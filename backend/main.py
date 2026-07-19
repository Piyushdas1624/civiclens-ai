"""FastAPI backend for CivicLens AI with optimization layer."""
import os
import base64
import io
import time
from typing import Optional
from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Header
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from PIL import Image

from database import init_db, save_complaint, get_all_complaints, get_complaint_by_id, get_complaints_by_status, update_complaint_status
from ai_service import analyze_issue
from geocoding import reverse_geocode
from weather_service import get_weather
from image_processor import optimize_image, calculate_description_hash
from cache_service import (
    init_cache_tables, 
    get_ai_response_from_cache, 
    set_ai_response_cache,
    get_address_from_cache,
    set_address_cache,
    get_weather_from_cache,
    set_weather_cache,
    cleanup_expired_cache
)
from rate_limiter import check_rate_limit, record_api_call_usage, RateLimitExceeded
from duplicate_detector import find_potential_duplicates, should_reuse_cached_analysis

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="CivicLens AI Backend",
    description="AI-powered civic complaint reporting and analysis system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "x-gemini-api-key", "X-Gemini-Api-Key"],
)

# Initialize database and cache on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and cache on startup."""
    init_db()
    init_cache_tables()
    cleanup_expired_cache()
    print("✅ Database and cache tables initialized")


def find_nearby_complaints(latitude: float, longitude: float, radius_meters: float = 180, category: str = None) -> list:
    """
    Find complaints within a radius of the given coordinates.
    Uses simple distance calculation (acceptable for demo).
    """
    try:
        from math import radians, cos, sin, asin, sqrt
        
        complaints = get_all_complaints()
        nearby = []
        
        for complaint in complaints:
            if complaint.get('latitude') is None or complaint.get('longitude') is None:
                continue
            
            # Haversine formula for distance
            lon1, lat1, lon2, lat2 = map(radians, [longitude, latitude, complaint['longitude'], complaint['latitude']])
            dlon = lon2 - lon1
            dlat = lat2 - lat1
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * asin(sqrt(a))
            r = 6371000  # Earth radius in meters
            distance = c * r
            
            if distance <= radius_meters and complaint.get('category') == category:
                nearby.append({
                    "id": complaint.get('id'),
                    "title": complaint.get('title'),
                    "category": complaint.get('category'),
                    "location": complaint.get('location'),
                    "status": complaint.get('status'),
                    "distance": round(distance, 0),
                    "time_ago": "recently",  # Can enhance with actual timestamps
                    "urgency": complaint.get('urgency_score')
                })
        
        # Sort by distance and limit to 3
        return sorted(nearby, key=lambda x: x['distance'])[:3]
    except Exception as e:
        print(f"⚠️ Error finding nearby complaints: {str(e)}")
        return []


# Request/Response models
class LocationInput(BaseModel):
    """Location input model."""
    latitude: float
    longitude: float


class ReportIssueRequest(BaseModel):
    """Report issue request model."""
    description: str
    latitude: float
    longitude: float
    image_base64: Optional[str] = None


class ComplaintResponse(BaseModel):
    """Complaint response model."""
    id: int
    image_url: Optional[str]
    description: str
    location_lat: float
    location_lng: float
    ward: str
    city: str
    category: str
    urgency: int
    confidence: float
    department: str
    duplicate_count: int
    professional_rewrite: str
    reasoning: str
    status: str
    created_at: str


class AnalysisResponse(BaseModel):
    """AI analysis response model."""
    category: str
    urgency_score: int
    urgency_explanation: list
    confidence: float
    professional_rewrite: str
    department: str
    duplicate_count: int
    duplicate_reason: Optional[str]
    citizen_message: str


class UpdateStatusRequest(BaseModel):
    """Update complaint status request model."""
    status: str


# Routes
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "CivicLens AI Backend",
        "status": "online",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/api/report", response_model=ComplaintResponse)
async def report_issue(request: ReportIssueRequest, x_gemini_api_key: Optional[str] = Header(None)):
    """
    Submit a new civic complaint with AI analysis.
    
    Optimized process with caching and duplicate detection:
    1. Optimize image (compress, resize, strip EXIF)
    2. Check for duplicates (location + description within 24h)
    3. Reverse geocode location (with cache)
    4. Fetch weather data (with cache, TTL 30 min)
    5. Check AI response cache (image_hash + description_hash)
    6. Check rate limit before calling Gemini
    7. Analyze with Gemini AI (if not cached)
    8. Cache AI response
    9. Store in database
    10. Return complete analysis
    """
    try:
        # Validate input
        if not request.description or len(request.description.strip()) < 5:
            raise HTTPException(
                status_code=400,
                detail="Description must be at least 5 characters"
            )
        
        print(f"\n{'='*60}")
        print(f"📝 New complaint submitted")
        print(f"{'='*60}")
        
        # Step 1: Optimize image (if provided)
        image_data = None
        image_hash = None
        image_url = None
        if request.image_base64:
            try:
                print(f"🖼️  Processing image...")
                image_b64 = request.image_base64
                if "," in image_b64:
                    image_b64 = image_b64.split(",", 1)[1]
                
                original_data = base64.b64decode(image_b64)
                image_data, image_hash = optimize_image(original_data)
                
                # Save optimized image to a file
                uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
                os.makedirs(uploads_dir, exist_ok=True)
                filename = f"{image_hash}.jpg"
                filepath = os.path.join(uploads_dir, filename)
                with open(filepath, "wb") as f:
                    f.write(image_data)
                image_url = f"/api/images/{filename}"
                print(f"💾 Saved image to {filepath} and registered as {image_url}")
            except Exception as e:
                print(f"⚠️ Image processing failed: {str(e)}, continuing without image")
                image_data = None
                image_url = None
        
        # Step 2: Calculate description hash
        description_hash = calculate_description_hash(request.description)
        
        # Step 3: Reverse geocode (with cache)
        print(f"🌍 Reverse geocoding...")
        location = get_address_from_cache(request.latitude, request.longitude)
        if not location:
            location = reverse_geocode(request.latitude, request.longitude)
            set_address_cache(request.latitude, request.longitude, location)
        else:
            print(f"✅ Using cached location")
        
        # Step 4: Get weather (with cache)
        print(f"🌤️  Fetching weather...")
        weather = get_weather_from_cache(request.latitude, request.longitude)
        if not weather:
            weather = get_weather(request.latitude, request.longitude)
            set_weather_cache(request.latitude, request.longitude, weather)
        else:
            print(f"✅ Using cached weather")
        
        # Step 5: Check for duplicate complaints
        print(f"🔍 Checking for duplicates...")
        duplicates = find_potential_duplicates(
            request.description,
            request.latitude,
            request.longitude
        )
        
        # Step 6: Check AI response cache (only if custom API key is NOT provided)
        print(f"💾 Checking AI response cache...")
        analysis = None
        if image_hash and description_hash and not x_gemini_api_key:
            analysis = get_ai_response_from_cache(image_hash, description_hash)
        elif x_gemini_api_key:
            print(f"🔑 Custom Gemini API Key detected — bypassing cache for live Gemini call")

            try:
                print(f"🚦 Checking rate limit...")
                check_rate_limit("gemini")
                print(f"✅ Rate limit check passed")
                
                print(f"🤖 Calling Gemini AI for analysis...")
                analysis = analyze_issue(image_data, request.description, location, weather, custom_api_key=x_gemini_api_key)
                record_api_call_usage("gemini")
                
                # Step 8: Cache AI response
                if image_hash and description_hash:
                    set_ai_response_cache(image_hash, description_hash, analysis)
                
            except RateLimitExceeded as e:
                print(f"❌ Rate limit exceeded: {str(e)}")
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Rate limit exceeded",
                        "retry_after": e.retry_after,
                        "limit_type": e.limit_type
                    }
                )
        
        # Step 9: Store in database
        print(f"💾 Saving complaint to database...")
        complaint = save_complaint(
            image_url=image_url,
            description=request.description,
            location_lat=request.latitude,
            location_lng=request.longitude,
            ward=location.get("ward", "Unknown"),
            city=location.get("city", "Unknown"),
            category=analysis.get("category", "other"),
            urgency=analysis.get("urgency_score", 50),
            confidence=analysis.get("confidence", 0.5),
            department=analysis.get("department", "Other"),
            duplicate_count=len(duplicates),
            professional_rewrite=analysis.get("professional_rewrite", request.description),
            reasoning="\n".join(analysis.get("urgency_explanation", []))
        )
        
        print(f"✅ Complaint #{complaint['id']} created successfully")
        print(f"{'='*60}\n")
        return complaint
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in report_issue: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process complaint: {str(e)}"
        )


@app.post("/api/analyze")
async def analyze(request: ReportIssueRequest) -> AnalysisResponse:
    """
    Analyze a complaint without saving it.
    Useful for preview before submitting.
    
    Optimized with caching, rate limiting, and image optimization.
    """
    try:
        # Step 1: Optimize image if provided
        image_data = None
        image_hash = None
        if request.image_base64:
            try:
                print(f"🖼️  Processing image for preview...")
                image_b64 = request.image_base64
                if "," in image_b64:
                    image_b64 = image_b64.split(",", 1)[1]
                
                original_data = base64.b64decode(image_b64)
                image_data, image_hash = optimize_image(original_data)
            except Exception as e:
                print(f"⚠️ Image processing failed: {str(e)}")
        
        # Step 2: Get location and weather (with cache)
        location = get_address_from_cache(request.latitude, request.longitude)
        if not location:
            location = reverse_geocode(request.latitude, request.longitude)
            set_address_cache(request.latitude, request.longitude, location)
        
        weather = get_weather_from_cache(request.latitude, request.longitude)
        if not weather:
            weather = get_weather(request.latitude, request.longitude)
            set_weather_cache(request.latitude, request.longitude, weather)
        
        # Step 3: Check AI response cache
        description_hash = calculate_description_hash(request.description)
        analysis = None
        if image_hash and description_hash:
            analysis = get_ai_response_from_cache(image_hash, description_hash)
        
        # Step 4: Analyze (or use cached result)
        if not analysis:
            try:
                check_rate_limit("gemini")
                print(f"🤖 Analyzing for preview...")
                analysis = analyze_issue(image_data, request.description, location, weather)
                record_api_call_usage("gemini")
                
                if image_hash and description_hash:
                    set_ai_response_cache(image_hash, description_hash, analysis)
            except RateLimitExceeded as e:
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limit exceeded: {e.limit_type}"
                )
        
        # Step 5: Find nearby complaints for duplicate detection
        nearby = find_potential_duplicates(
            request.description,
            request.latitude,
            request.longitude,
            category=analysis.get('category')
        )
        analysis['nearby_complaints'] = nearby
        analysis['latitude'] = request.latitude
        analysis['longitude'] = request.longitude
        
        return analysis
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@app.get("/api/complaints")
async def get_complaints(limit: int = 50, offset: int = 0, status: Optional[str] = None):
    """Get all complaints or filter by status."""
    try:
        if status:
            complaints = get_complaints_by_status(status, limit=limit)
        else:
            complaints = get_all_complaints(limit=limit, offset=offset)
        
        return {
            "total": len(complaints),
            "complaints": complaints
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve complaints: {str(e)}"
        )


@app.get("/api/complaints/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(complaint_id: int):
    """Get a specific complaint by ID."""
    try:
        complaint = get_complaint_by_id(complaint_id)
        if not complaint:
            raise HTTPException(
                status_code=404,
                detail=f"Complaint {complaint_id} not found"
            )
        return complaint
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve complaint: {str(e)}"
        )


@app.put("/api/complaints/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint_endpoint(complaint_id: int, request: UpdateStatusRequest):
    """Update a complaint's status."""
    try:
        complaint = update_complaint_status(complaint_id, request.status)
        if not complaint:
            raise HTTPException(
                status_code=404,
                detail=f"Complaint {complaint_id} not found"
            )
        return complaint
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update complaint: {str(e)}"
        )


@app.post("/api/location/reverse-geocode")
async def reverse_geocode_endpoint(request: LocationInput):
    """Reverse geocode coordinates."""
    try:
        location = reverse_geocode(request.latitude, request.longitude)
        return location
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Geocoding failed: {str(e)}"
        )


@app.post("/api/weather")
async def weather_endpoint(request: LocationInput):
    """Get weather for coordinates."""
    try:
        weather = get_weather(request.latitude, request.longitude)
        return weather
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Weather fetch failed: {str(e)}"
        )


@app.get("/api/images/{filename}")
async def get_image(filename: str):
    """Retrieve an uploaded image by filename."""
    uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
    filepath = os.path.join(uploads_dir, filename)
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=404,
            detail="Image not found"
        )
    return FileResponse(filepath)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
