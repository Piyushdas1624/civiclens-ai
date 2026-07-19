"""Duplicate detection to minimize redundant Gemini API calls."""
import math
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from database import get_all_complaints
from image_processor import is_similar_description

DUPLICATE_DETECTION_RADIUS_METERS = 500
DUPLICATE_DETECTION_TIME_WINDOW_HOURS = 24
DESCRIPTION_SIMILARITY_THRESHOLD = 0.75  # 75% word overlap


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two coordinates using Haversine formula.
    
    Args:
        lat1, lon1: First coordinate
        lat2, lon2: Second coordinate
    
    Returns:
        Distance in meters
    """
    from math import radians, cos, sin, asin, sqrt
    
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371000  # Earth radius in meters
    return c * r


def find_potential_duplicates(
    description: str,
    latitude: float,
    longitude: float,
    category: Optional[str] = None
) -> List[Dict]:
    """
    Find potentially duplicate complaints based on:
    - Location (within 500m radius)
    - Time (within 24 hours)
    - Description similarity (75%+ word overlap)
    - Category (if known)
    
    Args:
        description: Complaint description
        latitude: Latitude coordinate
        longitude: Longitude coordinate
        category: Complaint category (optional)
    
    Returns:
        List of potential duplicate complaints
    """
    try:
        complaints = get_all_complaints(limit=1000)  # Get all recent complaints
        duplicates = []
        now = datetime.utcnow()
        time_window = now - timedelta(hours=DUPLICATE_DETECTION_TIME_WINDOW_HOURS)
        
        for complaint in complaints:
            # Skip if no location data
            if not complaint.get('location_lat') or not complaint.get('location_lng'):
                continue
            
            # Check time window
            try:
                created_at = datetime.fromisoformat(complaint['created_at'].replace('Z', '+00:00'))
            except (ValueError, TypeError, AttributeError):
                created_at = None
            
            if created_at and created_at < time_window:
                continue  # Outside time window
            
            # Check category match (if known)
            if category and complaint.get('category') and complaint.get('category').lower() != category.lower():
                continue
            
            # Check location (Haversine distance)
            distance = calculate_distance(
                latitude, longitude,
                complaint['location_lat'], complaint['location_lng']
            )
            
            if distance > DUPLICATE_DETECTION_RADIUS_METERS:
                continue  # Outside radius
            
            # Check description similarity
            complaint_desc = complaint.get('description', '')
            if not is_similar_description(description, complaint_desc, DESCRIPTION_SIMILARITY_THRESHOLD):
                continue
            
            # Found a duplicate!
            duplicates.append({
                "id": complaint.get('id'),
                "title": complaint.get('professional_rewrite', complaint_desc),
                "description": complaint_desc,
                "category": complaint.get('category'),
                "location": f"{complaint.get('location_lat')}, {complaint.get('location_lng')}",
                "status": complaint.get('status'),
                "distance": round(distance, 0),
                "urgency": complaint.get('urgency'),
                "created_at": complaint.get('created_at'),
                "similarity": "high"
            })
        
        # Sort by distance and return top 5
        duplicates_sorted = sorted(duplicates, key=lambda x: x['distance'])
        return duplicates_sorted[:5]
    
    except Exception as e:
        print(f"⚠️ Duplicate detection failed: {str(e)}")
        return []


def should_reuse_cached_analysis(
    image_hash: str,
    description_hash: str,
    latitude: float,
    longitude: float,
    description: str
) -> bool:
    """
    Determine if we should reuse cached AI analysis.
    
    Args:
        image_hash: Hash of optimized image
        description_hash: Hash of description
        latitude: Latitude
        longitude: Longitude
        description: Full description text
    
    Returns:
        True if we should reuse cache instead of calling Gemini
    """
    try:
        # Check for exact match (same image + description hashes)
        complaints = get_all_complaints(limit=100)
        
        for complaint in complaints:
            # We can't reliably check hashes from database since they weren't stored
            # But we can check for exact location + description matches
            if (complaint.get('location_lat') == latitude and
                complaint.get('location_lng') == longitude and
                complaint.get('description', '').strip().lower() == description.strip().lower()):
                print(f"🔄 Exact duplicate found (complaint #{complaint.get('id')}), will reuse AI analysis")
                return True
        
        return False
    except Exception as e:
        print(f"⚠️ Cache reuse check failed: {str(e)}")
        return False
