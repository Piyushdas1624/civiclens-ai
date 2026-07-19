"""Caching layer for AI responses, geocoding, and weather data."""
import sqlite3
import time
import json
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import os

DATABASE_PATH = os.getenv("DATABASE_URL", "sqlite:///complaints.db").replace("sqlite:///", "")

# Cache TTLs (in seconds)
AI_RESPONSE_CACHE_TTL = None  # Never expire (AI analysis is deterministic)
ADDRESS_CACHE_TTL = 30 * 24 * 60 * 60  # 30 days
WEATHER_CACHE_TTL = 30 * 60  # 30 minutes


def init_cache_tables():
    """Initialize cache tables in database."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # AI response cache table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_hash TEXT NOT NULL,
            description_hash TEXT NOT NULL,
            response_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(image_hash, description_hash)
        )
    """)
    
    # Address cache table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS address_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            ward TEXT,
            city TEXT,
            area TEXT,
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            UNIQUE(latitude, longitude)
        )
    """)
    
    # Weather cache table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS weather_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            temperature REAL,
            rain REAL,
            visibility REAL,
            wind_speed REAL,
            weather_code INTEGER,
            condition TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            UNIQUE(latitude, longitude)
        )
    """)
    
    # API call rate limit table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS api_calls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            api_name TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()
    print("✅ Cache tables initialized")


def get_ai_response_from_cache(image_hash: str, description_hash: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve cached AI response.
    
    Args:
        image_hash: MD5 hash of optimized image
        description_hash: MD5 hash of description
    
    Returns:
        Cached response dict or None
    """
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT response_json FROM ai_cache 
            WHERE image_hash = ? AND description_hash = ?
        """, (image_hash, description_hash))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            print(f"✅ AI response cache HIT (image={image_hash[:8]}..., desc={description_hash[:8]}...)")
            return json.loads(row[0])
        
        print(f"⚠️ AI response cache MISS (image={image_hash[:8]}..., desc={description_hash[:8]}...)")
        return None
    except Exception as e:
        print(f"⚠️ Cache retrieval failed: {str(e)}")
        return None


def set_ai_response_cache(image_hash: str, description_hash: str, response: Dict[str, Any]) -> bool:
    """
    Cache AI response.
    
    Args:
        image_hash: MD5 hash of optimized image
        description_hash: MD5 hash of description
        response: Response dict from Gemini
    
    Returns:
        True if cached successfully
    """
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO ai_cache (image_hash, description_hash, response_json)
            VALUES (?, ?, ?)
        """, (image_hash, description_hash, json.dumps(response)))
        
        conn.commit()
        conn.close()
        print(f"💾 AI response cached (image={image_hash[:8]}..., desc={description_hash[:8]}...)")
        return True
    except Exception as e:
        print(f"⚠️ Cache write failed: {str(e)}")
        return False


def get_address_from_cache(latitude: float, longitude: float) -> Optional[Dict[str, str]]:
    """
    Retrieve cached geocoding result.
    
    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate
    
    Returns:
        Cached address dict or None
    """
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        now = datetime.utcnow()
        cursor.execute("""
            SELECT ward, city, area, address FROM address_cache 
            WHERE latitude = ? AND longitude = ?
            AND (expires_at IS NULL OR expires_at > ?)
        """, (latitude, longitude, now))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            print(f"✅ Address cache HIT ({latitude:.4f}, {longitude:.4f})")
            return {
                "ward": row[0],
                "city": row[1],
                "area": row[2],
                "address": row[3]
            }
        
        print(f"⚠️ Address cache MISS ({latitude:.4f}, {longitude:.4f})")
        return None
    except Exception as e:
        print(f"⚠️ Address cache retrieval failed: {str(e)}")
        return None


def set_address_cache(latitude: float, longitude: float, address_data: Dict[str, str]) -> bool:
    """
    Cache geocoding result.
    
    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate
        address_data: Dict with ward, city, area, address
    
    Returns:
        True if cached successfully
    """
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        expires_at = datetime.utcnow() + timedelta(seconds=ADDRESS_CACHE_TTL)
        
        cursor.execute("""
            INSERT OR REPLACE INTO address_cache 
            (latitude, longitude, ward, city, area, address, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            latitude, longitude,
            address_data.get("ward"),
            address_data.get("city"),
            address_data.get("area"),
            address_data.get("address"),
            expires_at
        ))
        
        conn.commit()
        conn.close()
        print(f"💾 Address cached ({latitude:.4f}, {longitude:.4f}, expires in 30 days)")
        return True
    except Exception as e:
        print(f"⚠️ Address cache write failed: {str(e)}")
        return False


def get_weather_from_cache(latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
    """
    Retrieve cached weather data.
    
    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate
    
    Returns:
        Cached weather dict or None
    """
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        now = datetime.utcnow()
        cursor.execute("""
            SELECT temperature, rain, visibility, wind_speed, weather_code, condition
            FROM weather_cache 
            WHERE latitude = ? AND longitude = ?
            AND expires_at > ?
        """, (latitude, longitude, now))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            print(f"✅ Weather cache HIT ({latitude:.4f}, {longitude:.4f})")
            return {
                "temperature": row[0],
                "rain": row[1],
                "visibility": row[2],
                "wind_speed": row[3],
                "weather_code": row[4],
                "condition": row[5]
            }
        
        print(f"⚠️ Weather cache MISS ({latitude:.4f}, {longitude:.4f})")
        return None
    except Exception as e:
        print(f"⚠️ Weather cache retrieval failed: {str(e)}")
        return None


def set_weather_cache(latitude: float, longitude: float, weather_data: Dict[str, Any]) -> bool:
    """
    Cache weather data.
    
    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate
        weather_data: Weather dict from API
    
    Returns:
        True if cached successfully
    """
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        expires_at = datetime.utcnow() + timedelta(seconds=WEATHER_CACHE_TTL)
        
        cursor.execute("""
            INSERT OR REPLACE INTO weather_cache 
            (latitude, longitude, temperature, rain, visibility, wind_speed, weather_code, condition, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            latitude, longitude,
            weather_data.get("temperature"),
            weather_data.get("rain"),
            weather_data.get("visibility"),
            weather_data.get("wind_speed"),
            weather_data.get("weather_code"),
            weather_data.get("condition"),
            expires_at
        ))
        
        conn.commit()
        conn.close()
        print(f"💾 Weather cached ({latitude:.4f}, {longitude:.4f}, expires in 30 min)")
        return True
    except Exception as e:
        print(f"⚠️ Weather cache write failed: {str(e)}")
        return False


def record_api_call(api_name: str) -> None:
    """Record an external API call for rate limiting."""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO api_calls (api_name) VALUES (?)", (api_name,))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️ Failed to record API call: {str(e)}")


def get_api_call_count(api_name: str, seconds: int = 60) -> int:
    """
    Get count of API calls in the last N seconds.
    
    Args:
        api_name: Name of API (e.g., "gemini")
        seconds: Time window in seconds
    
    Returns:
        Count of calls in time window
    """
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cutoff_time = datetime.utcnow() - timedelta(seconds=seconds)
        cursor.execute("""
            SELECT COUNT(*) FROM api_calls 
            WHERE api_name = ? AND timestamp > ?
        """, (api_name, cutoff_time))
        
        result = cursor.fetchone()
        conn.close()
        
        return result[0] if result else 0
    except Exception as e:
        print(f"⚠️ Failed to get API call count: {str(e)}")
        return 0


def cleanup_expired_cache() -> None:
    """Clean up expired cache entries."""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        now = datetime.utcnow()
        cursor.execute("DELETE FROM address_cache WHERE expires_at < ?", (now,))
        cursor.execute("DELETE FROM weather_cache WHERE expires_at < ?", (now,))
        
        # Clean up old API call records (keep only 24 hours)
        cutoff = datetime.utcnow() - timedelta(hours=24)
        cursor.execute("DELETE FROM api_calls WHERE timestamp < ?", (cutoff,))
        
        conn.commit()
        conn.close()
        print("🧹 Expired cache entries cleaned up")
    except Exception as e:
        print(f"⚠️ Cache cleanup failed: {str(e)}")
