"""Google Maps reverse geocoding service."""
import os
import requests
from typing import Dict, Optional
from functools import lru_cache

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
REVERSE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"

# Siliguri mock fallback
SILIGURI_FALLBACK_RESPONSE = {
    "ward": "Ward 5",
    "city": "Siliguri",
    "area": "Mahananda Para",
    "address": "Ward 5, Mahananda Para, Siliguri, West Bengal, 734001"
}


def reverse_geocode_nominatim(latitude: float, longitude: float) -> Optional[Dict[str, str]]:
    """OpenStreetMap Nominatim geocoding fallback with custom User-Agent."""
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "format": "json",
            "lat": latitude,
            "lon": longitude,
            "zoom": 18,
            "addressdetails": 1
        }
        headers = {
            "User-Agent": "CivicLensAI/1.0 (contact: support@civiclens.ai)"
        }
        
        print(f"🌍 Attempting OpenStreetMap Nominatim reverse geocode for ({latitude}, {longitude})...")
        response = requests.get(url, params=params, headers=headers, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        address_info = data.get("address", {})
        
        # Ward/suburb detection
        ward = address_info.get("suburb") or address_info.get("neighbourhood") or address_info.get("district") or address_info.get("county") or "Ward Unknown"
        city = address_info.get("city") or address_info.get("town") or address_info.get("village") or address_info.get("state") or "Siliguri"
        area = address_info.get("suburb") or address_info.get("neighbourhood") or "Unknown Area"
        formatted_address = data.get("display_name", f"{latitude:.4f}, {longitude:.4f}")
        
        print(f"✅ Nominatim geocoding success: {ward}, {city}")
        return {
            "ward": ward,
            "city": city,
            "area": area,
            "address": formatted_address
        }
    except Exception as e:
        print(f"⚠️ OpenStreetMap reverse geocode failed: {str(e)}")
        return None


@lru_cache(maxsize=100)
def reverse_geocode(latitude: float, longitude: float) -> Dict[str, str]:
    """
    Reverse geocode coordinates to get ward, city, and area information.
    Attempts Google Maps first, then OpenStreetMap Nominatim, and falls back to Siliguri.
    
    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate
    
    Returns:
        Dict with ward, city, area, and full address
    """
    # Try Google Maps Geocoding if key is set
    if GOOGLE_MAPS_API_KEY:
        try:
            params = {
                "latlng": f"{latitude},{longitude}",
                "key": GOOGLE_MAPS_API_KEY
            }
            
            response = requests.get(REVERSE_GEOCODING_URL, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "OK" and data.get("results"):
                # Parse the first result
                result = data["results"][0]
                address_components = result.get("address_components", [])
                formatted_address = result.get("formatted_address", "Unknown")
                
                # Extract components
                city = ""
                ward = ""
                area = ""
                
                for component in address_components:
                    types = component.get("types", [])
                    if "administrative_area_level_2" in types:
                        ward = component.get("long_name", "")
                    elif "locality" in types:
                        city = component.get("long_name", "")
                    elif "neighborhood" in types:
                        area = component.get("long_name", "")
                
                if not city:
                    for component in address_components:
                        if "administrative_area_level_1" in component.get("types", []):
                            city = component.get("long_name", "")
                            break
                
                return {
                    "ward": ward or "Unknown Ward",
                    "city": city or "Unknown City",
                    "area": area or "Unknown Area",
                    "address": formatted_address
                }
            else:
                print(f"⚠️ Google Geocoding API returned status: {data.get('status')}")
        except Exception as e:
            print(f"⚠️ Google Geocoding request failed: {str(e)}")
            
    # Try OpenStreetMap Nominatim as first fallback
    osm_response = reverse_geocode_nominatim(latitude, longitude)
    if osm_response:
        return osm_response
        
    # Final fallback to local Siliguri response
    print("⚠️ All geocoding services failed, using Siliguri fallback mock data")
    return SILIGURI_FALLBACK_RESPONSE
