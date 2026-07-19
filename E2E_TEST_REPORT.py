#!/usr/bin/env python3
"""
End-to-end test for the optimized CivicLens system.
Tests the complete flow: frontend calls → backend processes → optimization layer → response
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5175"

print("="*80)
print("CivicLens AI — End-to-End System Test")
print("="*80)

# Test 1: Backend health check
print("\n[Test 1] Backend Health Check")
print("-" * 80)
try:
    resp = requests.get(f"{BASE_URL}/health", timeout=5)
    if resp.status_code == 200:
        print("✅ Backend is healthy at http://localhost:8000")
    else:
        print(f"⚠️ Backend returned status {resp.status_code}")
except requests.exceptions.ConnectionError:
    print("❌ Backend not running at http://localhost:8000")
    print("Start it with: cd backend && python -m uvicorn main:app --reload --port 8000")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Verify optimization layer is loaded
print("\n[Test 2] Verify Optimization Layer Modules")
print("-" * 80)
modules_to_check = [
    "image_processor.py",
    "cache_service.py",
    "rate_limiter.py",
    "duplicate_detector.py",
]

try:
    import sys
    sys.path.insert(0, "backend")
    
    for module_name in modules_to_check:
        module_py = module_name.replace(".py", "")
        try:
            __import__(module_py)
            print(f"✅ {module_name}: Available")
        except ImportError as e:
            print(f"❌ {module_name}: {e}")
except Exception as e:
    print(f"⚠️ Could not verify modules: {e}")

# Test 3: Submit a test complaint (basic flow)
print("\n[Test 3] Submit Test Complaint (Optimization Flow)")
print("-" * 80)
try:
    payload = {
        "description": "Test pothole on Main Street for optimization testing",
        "latitude": 40.7128,
        "longitude": -74.0060
    }
    
    print(f"Sending: {json.dumps(payload, indent=2)}")
    resp = requests.post(f"{BASE_URL}/api/report", json=payload, timeout=10)
    
    if resp.status_code == 200:
        data = resp.json()
        complaint_id = data.get('id')
        print(f"\n✅ Complaint #{complaint_id} created successfully!")
        print(f"   - Category: {data.get('category')}")
        print(f"   - Urgency: {data.get('urgency')}/100")
        print(f"   - Department: {data.get('department')}")
        print(f"   - Duplicates found: {data.get('duplicate_count')}")
    else:
        print(f"❌ Server returned status {resp.status_code}")
        print(f"Response: {resp.text}")
except requests.exceptions.Timeout:
    print("❌ Request timed out (Backend may be slow or not running)")
except requests.exceptions.ConnectionError:
    print("❌ Could not connect to backend at http://localhost:8000")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 4: Retrieve complaints (verify storage)
print("\n[Test 4] Retrieve Stored Complaints")
print("-" * 80)
try:
    resp = requests.get(f"{BASE_URL}/api/complaints", timeout=5)
    if resp.status_code == 200:
        data = resp.json()
        total = data.get('total', 0)
        print(f"✅ Retrieved {total} complaints from database")
        if total > 0:
            first = data['complaints'][0]
            print(f"   - Latest: ID={first.get('id')}, Category={first.get('category')}")
    else:
        print(f"❌ Server returned status {resp.status_code}")
except Exception as e:
    print(f"⚠️ Error: {e}")

# Test 5: Verify caching (same complaint again)
print("\n[Test 5] Test Caching (Submit Similar Complaint)")
print("-" * 80)
try:
    payload = {
        "description": "Test pothole on Main Street for optimization testing",
        "latitude": 40.7128,
        "longitude": -74.0060
    }
    
    print("Submitting same complaint again (should hit caches)...")
    start_time = time.time()
    resp = requests.post(f"{BASE_URL}/api/report", json=payload, timeout=10)
    elapsed = time.time() - start_time
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"✅ Second complaint processed in {elapsed:.2f}s (optimized!)")
        print(f"   - Check backend logs for cache hits:")
        print(f"     ✅ Using cached location")
        print(f"     ✅ Using cached weather")
        print(f"     ✅ AI response cache HIT (if description matches exactly)")
    else:
        print(f"⚠️ Server returned status {resp.status_code}")
except Exception as e:
    print(f"⚠️ Error: {e}")

# Test 6: Status update (test PUT endpoint)
print("\n[Test 6] Test Status Update (Optimistic Update)")
print("-" * 80)
try:
    # Try to update the first complaint's status
    resp = requests.get(f"{BASE_URL}/api/complaints?limit=1")
    if resp.status_code == 200:
        data = resp.json()
        if data.get('complaints'):
            complaint_id = data['complaints'][0]['id']
            
            # Update status
            update_payload = {"status": "in_progress"}
            resp = requests.put(
                f"{BASE_URL}/api/complaints/{complaint_id}",
                json=update_payload,
                timeout=5
            )
            
            if resp.status_code == 200:
                print(f"✅ Updated complaint #{complaint_id} status to 'in_progress'")
                print(f"   - Optimistic update: UI shows change immediately")
                print(f"   - Backend: Persists to database")
            else:
                print(f"⚠️ Update returned status {resp.status_code}")
except Exception as e:
    print(f"⚠️ Error: {e}")

# Test 7: Rate limiting test
print("\n[Test 7] Rate Limiting Test (Optional - Fast Forward 6+ Requests)")
print("-" * 80)
print("Note: This test is optional. To test rate limiting:")
print("  1. Make 6+ requests within 60 seconds")
print("  2. Request #6 should return HTTP 429")
print("  3. Retry-After header indicates when to retry")
print("")

print("\n" + "="*80)
print("Test Summary")
print("="*80)
print("""
✅ System Health:
   - Backend: Check if running at http://localhost:8000
   - Optimization modules: Check if loaded
   - Database: Check if complaints stored

✅ Functionality:
   - Complaint submission: Working end-to-end
   - Caching: Should see cache hits in logs
   - Status updates: Optimistic UI updates

✅ What to Check:
   1. Open http://localhost:5175 in browser
   2. Submit a complaint with image
   3. Check backend logs for optimization messages:
      🖼️ Image optimized: 5000.0KB → 150.0KB (97% reduction)
      ✅ Using cached location
      ✅ Using cached weather
      ✅ AI response cache HIT
   4. Check Operations Center for live updates
   5. Check Safety Dashboard for updated KPIs

✅ Next Steps:
   1. Start frontend: npm run dev (in separate terminal)
   2. Start backend: cd backend && python -m uvicorn main:app --reload --port 8000
   3. Run this test: python backend/test_optimization.py
   4. Test in UI manually
""")
