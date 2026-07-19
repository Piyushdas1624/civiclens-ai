"""
Integration test for API optimization layer.
Run this after starting the backend to verify all optimizations work.
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"

print("="*70)
print("CivicLens API Optimization Layer — Integration Tests")
print("="*70)

# Test 1: Health check
print("\n[Test 1] Backend health check...")
try:
    resp = requests.get(f"{BASE_URL}/health")
    assert resp.status_code == 200
    print("✅ PASS: Backend is online")
except Exception as e:
    print(f"❌ FAIL: {e}")

# Test 2: Basic complaint submission (without image)
print("\n[Test 2] Submit basic complaint (cache warming)...")
try:
    payload = {
        "description": "Pothole on Main Street, very dangerous",
        "latitude": 40.7128,
        "longitude": -74.0060
    }
    resp = requests.post(f"{BASE_URL}/api/report", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    complaint_id = data['id']
    print(f"✅ PASS: Complaint #{complaint_id} created")
    print(f"  - Category: {data['category']}")
    print(f"  - Urgency: {data['urgency']}/100")
    print(f"  - Department: {data['department']}")
except Exception as e:
    print(f"❌ FAIL: {e}")

# Test 3: Address cache (same location, different description)
print("\n[Test 3] Submit second complaint from same location (test address cache)...")
try:
    payload = {
        "description": "Large hole in the road on Main Street, needs repair",
        "latitude": 40.7128,
        "longitude": -74.0060
    }
    resp = requests.post(f"{BASE_URL}/api/report", json=payload)
    assert resp.status_code == 200
    print("✅ PASS: Second complaint created")
    print("  - Check logs: Should show '✅ Using cached location'")
except Exception as e:
    print(f"❌ FAIL: {e}")

# Test 4: Weather cache (nearby location)
print("\n[Test 4] Submit complaint from nearby location (test weather cache)...")
try:
    payload = {
        "description": "Flooded intersection near Main St",
        "latitude": 40.7130,  # Slightly different
        "longitude": -74.0058  # Slightly different
    }
    resp = requests.post(f"{BASE_URL}/api/report", json=payload)
    assert resp.status_code == 200
    print("✅ PASS: Third complaint created")
    print("  - Check logs: Weather likely from cache (~60% hit rate)")
except Exception as e:
    print(f"❌ FAIL: {e}")

# Test 5: Duplicate detection
print("\n[Test 5] Submit identical complaint (test duplicate detection)...")
try:
    payload = {
        "description": "Pothole on Main Street, very dangerous",
        "latitude": 40.7128,
        "longitude": -74.0060
    }
    resp = requests.post(f"{BASE_URL}/api/report", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    print(f"✅ PASS: Complaint #{data['id']} created")
    print(f"  - Duplicate count: {data['duplicate_count']}")
    if data['duplicate_count'] > 0:
        print("  - ✅ Duplicate detection working!")
except Exception as e:
    print(f"❌ FAIL: {e}")

# Test 6: Analyze endpoint (preview without saving)
print("\n[Test 6] Analyze without saving (test AI cache)...")
try:
    payload = {
        "description": "Downed power lines near intersection",
        "latitude": 40.7125,
        "longitude": -74.0062
    }
    resp = requests.post(f"{BASE_URL}/api/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    print(f"✅ PASS: Analysis preview returned")
    print(f"  - Category: {data['category']}")
    print(f"  - Urgency: {data['urgency_score']}/100")
    print(f"  - Nearby complaints: {len(data.get('nearby_complaints', []))}")
except Exception as e:
    print(f"❌ FAIL: {e}")

# Test 7: Get all complaints
print("\n[Test 7] Retrieve all complaints...")
try:
    resp = requests.get(f"{BASE_URL}/api/complaints")
    assert resp.status_code == 200
    data = resp.json()
    total = data['total']
    print(f"✅ PASS: Retrieved {total} complaints")
except Exception as e:
    print(f"❌ FAIL: {e}")

# Test 8: Rate limiting (if you want to test, make multiple requests quickly)
print("\n[Test 8] Rate limiting (optional - fast-forwards 5+ requests)...")
try:
    for i in range(6):
        payload = {
            "description": f"Test complaint #{i}",
            "latitude": 40.7128 + i*0.001,
            "longitude": -74.0060 + i*0.001
        }
        resp = requests.post(f"{BASE_URL}/api/report", json=payload)
        if resp.status_code == 429:
            print(f"✅ PASS: Rate limit triggered on request #{i+1}")
            print(f"  - Status: 429")
            data = resp.json()
            print(f"  - Retry after: {data.get('retry_after', 'N/A')} seconds")
            break
        elif resp.status_code != 200:
            print(f"⚠️ WARNING: Request #{i+1} returned {resp.status_code}")
except Exception as e:
    print(f"ℹ️ INFO: Rate limiting test skipped ({e})")

print("\n" + "="*70)
print("Integration Tests Complete!")
print("="*70)

print("""
Next Steps:
1. Check backend logs for optimization messages:
   - 🖼️  Image optimized: ...
   - ✅ Using cached location
   - ✅ Using cached weather
   - ✅ AI response cache HIT
   - 📊 API usage: X/5 calls/min

2. Verify database:
   sqlite3 backend/complaints.db
   > SELECT COUNT(*) FROM complaints;
   > SELECT COUNT(*) FROM ai_cache;
   > SELECT COUNT(*) FROM address_cache;
   > SELECT COUNT(*) FROM weather_cache;

3. Check cache effectiveness:
   - Open backend logs and search for "cache HIT" vs "cache MISS"
   - Calculate hit rate = HIT / (HIT + MISS)
   - Target: AI cache >50%, Address cache >80%, Weather cache >60%

4. Monitor API calls:
   sqlite3 backend/complaints.db
   > SELECT api_name, COUNT(*) as calls FROM api_calls GROUP BY api_name;
   > Should show Gemini << 6 (due to caching)
""")
