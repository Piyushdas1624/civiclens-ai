# CivicLens AI Backend

FastAPI-based backend for civic complaint reporting and AI-powered analysis.

## Architecture

```
Backend (FastAPI + SQLite)
├── main.py           → FastAPI app with all endpoints
├── ai_service.py     → Gemini Vision + Reasoning integration
├── geocoding.py      → Google Maps reverse geocoding
├── weather_service.py → Open-Meteo weather API (free)
└── database.py       → SQLite complaint storage
```

## Features

- **AI Analysis**: Google Gemini 2.0 Vision for image/text analysis
- **Reverse Geocoding**: Convert lat/lng to ward, city, area
- **Weather Context**: Real-time weather data via Open-Meteo (no auth required)
- **Complaint Storage**: SQLite database for persistence
- **Duplicate Detection**: AI-powered duplicate complaint detection
- **Professional Rewrite**: Formal complaint description generation
- **Urgency Scoring**: Intelligent 0-100 urgency assessment with reasoning
- **Department Routing**: Automatic routing to correct municipal department

## Setup

### 1. Install Dependencies

```bash
python setup_backend.py
# or manually:
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Create `backend/.env` with API keys:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
DATABASE_URL=sqlite:///complaints.db
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

### 3. Initialize Database

```bash
python -c "from database import init_db; init_db()"
```

### 4. Start Backend Server

```bash
cd backend
python -m uvicorn main:app --reload
```

Server will be available at: `http://localhost:8000`

## API Endpoints

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "healthy"
}
```

### Submit Complaint

```http
POST /api/report
Content-Type: application/json

{
  "description": "Broken streetlight on Main St",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

Response (200 OK):
```json
{
  "id": 1,
  "image_url": null,
  "description": "Broken streetlight on Main St",
  "location_lat": 40.7128,
  "location_lng": -74.0060,
  "ward": "Ward 5",
  "city": "New York",
  "category": "parks",
  "urgency": 65,
  "confidence": 0.89,
  "department": "Parks",
  "duplicate_count": 1,
  "professional_rewrite": "Public lighting infrastructure malfunction detected at specified location requiring immediate inspection and repair.",
  "reasoning": "Safety hazard affecting pedestrian visibility, Located in high-traffic area",
  "status": "open",
  "created_at": "2024-01-15T10:30:00.123456"
}
```

### Preview Analysis (No Save)

```http
POST /api/analyze
Content-Type: application/json

{
  "description": "Broken streetlight on Main St",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "image_base64": "data:image/jpeg;base64,..."
}
```

Response:
```json
{
  "category": "parks",
  "urgency_score": 65,
  "urgency_explanation": [
    "Safety hazard affecting pedestrian visibility",
    "Located in high-traffic area"
  ],
  "confidence": 0.89,
  "professional_rewrite": "Public lighting infrastructure malfunction...",
  "department": "Parks",
  "duplicate_count": 1,
  "duplicate_reason": "Similar streetlight report 2 hours ago in adjacent block",
  "citizen_message": "Thank you for reporting this issue..."
}
```

### Get All Complaints

```http
GET /api/complaints?limit=50&offset=0&status=open
```

Response:
```json
{
  "total": 15,
  "complaints": [...]
}
```

### Get Specific Complaint

```http
GET /api/complaints/1
```

### Reverse Geocode

```http
POST /api/location/reverse-geocode
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

Response:
```json
{
  "ward": "Ward 5",
  "city": "New York",
  "area": "Manhattan",
  "address": "123 Main St, New York, NY 10001, USA"
}
```

### Get Weather

```http
POST /api/weather
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

Response:
```json
{
  "temperature": 22,
  "rain": 0,
  "visibility": 10,
  "wind_speed": 5,
  "condition": "Partly cloudy"
}
```

## Database Schema

### complaints table

```sql
CREATE TABLE complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url TEXT,
  description TEXT NOT NULL,
  location_lat REAL NOT NULL,
  location_lng REAL NOT NULL,
  ward TEXT,
  city TEXT,
  category TEXT,
  urgency INTEGER,
  confidence REAL,
  department TEXT,
  duplicate_count INTEGER,
  professional_rewrite TEXT,
  reasoning TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## AI Analysis Pipeline

1. **Image Processing**: Gemini vision analyzes uploaded image for context
2. **Context Enrichment**: Adds location (ward, city), weather (temp, rain, wind)
3. **Category Detection**: Classifies complaint into: electrical, road, water, sanitation, parks, other
4. **Urgency Assessment**: Scores 0-100 based on:
   - Severity of issue
   - Safety impact
   - Weather conditions
   - Location criticality
5. **Department Routing**: Routes to: Electrical, Water, Sanitation, Roads, Parks, Other
6. **Duplicate Detection**: Checks for similar complaints in past 24 hours
7. **Professional Rewrite**: Generates formal municipal description
8. **Confidence Scoring**: Returns 0.0-1.0 confidence in analysis

## Error Handling

All errors return appropriate HTTP status codes:

- `400 Bad Request`: Invalid input (missing description, invalid coordinates)
- `404 Not Found`: Complaint ID doesn't exist
- `500 Internal Server Error`: Processing failure (Gemini API error, etc.)

Error responses include detail message:
```json
{
  "detail": "Description must be at least 5 characters"
}
```

## Fallback Behavior

If Gemini API is unavailable, the backend returns deterministic mock data:

```json
{
  "category": "electrical",
  "urgency_score": 75,
  "urgency_explanation": ["Power outage affecting multiple units", "High safety risk"],
  "confidence": 0.92,
  "professional_rewrite": "Multiple residential units experiencing complete power loss...",
  "department": "Electrical",
  "duplicate_count": 2,
  "duplicate_reason": "Similar power outage reports from adjacent buildings",
  "citizen_message": "Thank you for reporting this electrical issue..."
}
```

## API Documentation

Interactive API documentation available at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Testing Endpoints

### cURL Examples

```bash
# Health check
curl http://localhost:8000/health

# Submit complaint
curl -X POST http://localhost:8000/api/report \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Broken streetlight",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'

# Get complaints
curl http://localhost:8000/api/complaints

# Get specific complaint
curl http://localhost:8000/api/complaints/1

# Reverse geocode
curl -X POST http://localhost:8000/api/location/reverse-geocode \
  -H "Content-Type: application/json" \
  -d '{"latitude": 40.7128, "longitude": -74.0060}'

# Get weather
curl -X POST http://localhost:8000/api/weather \
  -H "Content-Type: application/json" \
  -d '{"latitude": 40.7128, "longitude": -74.0060}'
```

## Performance

- **Reverse Geocoding**: Cached (100 location results)
- **Weather API**: Cached (100 location results)
- **Database**: SQLite with indexes on status, created_at
- **Gemini API**: ~2-5 seconds per analysis (image processing)

## Security Notes

- CORS configured for development (localhost:5173, :3000)
- No authentication required (local deployment)
- API keys should be in `.env` and not committed
- Image data validated before processing
- Database queries use parameterized statements (SQLi protection)

## Troubleshooting

### Gemini API Errors
```
❌ Failed to configure Gemini: ...
```
→ Check `GEMINI_API_KEY` in `.env` is correct

### Geocoding Returns Mock Data
```
⚠️ GOOGLE_MAPS_API_KEY not set, using mock data
```
→ Add `GOOGLE_MAPS_API_KEY` to `.env`

### Database Locked
```
sqlite3.OperationalError: database is locked
```
→ Close other connections or restart server

### Port Already in Use
```
Address already in use
```
→ Use different port: `python -m uvicorn main:app --port 8001`

## Development

### File Structure
```
backend/
├── main.py              # FastAPI app
├── ai_service.py        # Gemini integration
├── geocoding.py         # Google Maps
├── weather_service.py   # Open-Meteo
├── database.py          # SQLite
├── requirements.txt     # Dependencies
└── .env                 # Config (not in git)
```

### Adding New Endpoints

1. Add route in `main.py`
2. Use existing service modules (ai_service, geocoding, weather_service)
3. Query database via `database.py` functions
4. Return Pydantic model for response validation
5. Test via `http://localhost:8000/docs`

### Database Migrations

To add new fields to complaints table:
1. Edit schema in `database.py` `init_db()`
2. Delete `complaints.db`
3. Restart server (auto-creates new table)

For production, use Alembic for migrations.

## Next Steps

1. ✅ Core API implemented
2. ⬜ Frontend integration
3. ⬜ WebSocket for real-time updates
4. ⬜ Authentication (JWT)
5. ⬜ Advanced filtering/search
6. ⬜ Export reports (PDF, CSV)
7. ⬜ Email notifications
8. ⬜ Analytics dashboard
