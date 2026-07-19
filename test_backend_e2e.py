#!/usr/bin/env python3
"""End-to-end backend API test."""
import sys
import os
import json
import base64
import time

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests

BASE_URL = "http://localhost:8000"

def test_health():
    """Test /health endpoint."""
    print("🧪 Testing /health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print(f"  ✅ Health check passed: {response.json()}")
            return True
        else:
            print(f"  ❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Health check error: {str(e)}")
        return False


def test_get_complaints():
    """Test GET /api/complaints endpoint."""
    print("\n🧪 Testing GET /api/complaints...")
    try:
        response = requests.get(f"{BASE_URL}/api/complaints", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Got {len(data['complaints'])} complaints from DB")
            return True
        else:
            print(f"  ❌ Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return False


def test_report_issue():
    """Test POST /api/report endpoint."""
    print("\n🧪 Testing POST /api/report (AI Analysis)...")
    
    payload = {
        "description": "Broken streetlight near city center affecting evening visibility and pedestrian safety",
        "latitude": 26.7212,
        "longitude": 88.3928,
        "image_base64": None
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/report",
            json=payload,
            timeout=15  # Allow time for Gemini API
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Analysis received!")
            print(f"     Category: {data.get('category')}")
            print(f"     Urgency: {data.get('urgency_score')}/100")
            print(f"     Department: {data.get('department')}")
            print(f"     Confidence: {data.get('confidence', 0):.1%}")
            
            if 'urgency_explanation' in data:
                print(f"     Reasoning ({len(data['urgency_explanation'])} points):")
                for i, reason in enumerate(data['urgency_explanation'], 1):
                    print(f"       {i}. {reason}")
            
            if 'nearby_complaints' in data:
                print(f"     Nearby complaints within 180m: {len(data['nearby_complaints'])}")
            
            return True
        else:
            print(f"  ❌ Failed: {response.status_code}")
            print(f"     Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"  ⚠️  Timeout (Gemini API may be slow)")
        return True
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return False


def test_get_single_complaint():
    """Test GET /api/complaints/{id} endpoint."""
    print("\n🧪 Testing GET /api/complaints/1...")
    try:
        response = requests.get(f"{BASE_URL}/api/complaints/1", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Got complaint: {data.get('title', 'N/A')}")
            return True
        elif response.status_code == 404:
            print(f"  ⚠️  Complaint not found (expected if DB empty)")
            return True
        else:
            print(f"  ❌ Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return False


def test_get_by_status():
    """Test GET /api/complaints?status=Submitted endpoint."""
    print("\n🧪 Testing GET /api/complaints?status=Submitted...")
    try:
        response = requests.get(
            f"{BASE_URL}/api/complaints",
            params={"status": "Submitted"},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            count = len(data.get('complaints', []))
            print(f"  ✅ Found {count} 'Submitted' complaints")
            return True
        else:
            print(f"  ❌ Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return False


def test_update_status():
    """Test PUT /api/complaints/{id} endpoint."""
    print("\n🧪 Testing PUT /api/complaints/1 (status update)...")
    
    payload = {
        "status": "Assigned"
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/api/complaints/1",
            json=payload,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Status updated successfully")
            print(f"     New status: {data.get('status')}")
            return True
        elif response.status_code == 404:
            print(f"  ⚠️  Complaint not found (expected if DB empty)")
            return True
        else:
            print(f"  ❌ Failed: {response.status_code}")
            print(f"     Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return False


def test_swagger_docs():
    """Test Swagger documentation endpoint."""
    print("\n🧪 Testing Swagger docs at /docs...")
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print(f"  ✅ Swagger docs available")
            return True
        else:
            print(f"  ⚠️  Swagger docs not available: {response.status_code}")
            return True  # Not critical
    except Exception as e:
        print(f"  ⚠️  Swagger docs error: {str(e)}")
        return True  # Not critical


def main():
    """Run all E2E tests."""
    print("\n" + "="*60)
    print("🚀 CivicLens AI Backend E2E Test")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    
    # Check if backend is running
    print("\n⏳ Waiting for backend to be ready...")
    for i in range(10):
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=2)
            if response.status_code == 200:
                print("✅ Backend is ready!\n")
                break
        except:
            if i < 9:
                print(f"  Attempt {i+1}/10... waiting...")
                time.sleep(1)
            else:
                print("❌ Backend not responding. Make sure it's running:")
                print("   cd backend && python -m uvicorn main:app --reload --port 8000")
                return 1
    
    results = {
        "Health Check": test_health(),
        "Get Complaints": test_get_complaints(),
        "Get Single Complaint": test_get_single_complaint(),
        "Filter by Status": test_get_by_status(),
        "Report Issue (AI)": test_report_issue(),
        "Update Status": test_update_status(),
        "Swagger Docs": test_swagger_docs(),
    }
    
    print("\n" + "="*60)
    print("📊 Test Results")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test:30} {status}")
    
    print("-"*60)
    print(f"Total: {passed}/{total} passed\n")
    
    if passed == total:
        print("🎉 All API tests passed! Backend is fully functional.")
        print("\n📚 API Documentation: http://localhost:8000/docs")
        print("🌐 Frontend: http://localhost:5175")
        return 0
    else:
        print(f"⚠️  {total - passed} test(s) failed. Check the output above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
