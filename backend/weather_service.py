"""Open-Meteo weather service (free, no API key required)."""
import requests
from typing import Dict, Optional
from functools import lru_cache

WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast"

# Mock data for fallback
MOCK_WEATHER_RESPONSE = {
    "temperature": 22,
    "rain": 0,
    "visibility": 10,
    "wind_speed": 5,
    "condition": "Partly cloudy"
}


@lru_cache(maxsize=100)
def get_weather(latitude: float, longitude: float) -> Dict[str, any]:
    """
    Get weather information from Open-Meteo API (free, no authentication required).
    
    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate
    
    Returns:
        Dict with temperature, rain, visibility, and wind speed
    """
    try:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,precipitation,weather_code,wind_speed_10m,visibility",
            "timezone": "auto"
        }
        
        response = requests.get(WEATHER_API_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if "current" not in data:
            print("⚠️ Weather API response missing 'current' data")
            return MOCK_WEATHER_RESPONSE
        
        current = data["current"]
        
        return {
            "temperature": current.get("temperature_2m", 20),
            "rain": current.get("precipitation", 0),
            "visibility": current.get("visibility", 10),
            "wind_speed": current.get("wind_speed_10m", 0),
            "weather_code": current.get("weather_code", 0),
            "condition": decode_weather_code(current.get("weather_code", 0))
        }
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Weather request failed: {str(e)}")
        return MOCK_WEATHER_RESPONSE
    except Exception as e:
        print(f"❌ Weather error: {str(e)}")
        return MOCK_WEATHER_RESPONSE


def decode_weather_code(code: int) -> str:
    """Decode WMO weather code to human readable condition."""
    weather_codes = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Slight snow",
        73: "Moderate snow",
        75: "Heavy snow",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with hail",
        99: "Thunderstorm with heavy hail"
    }
    return weather_codes.get(code, "Unknown")
