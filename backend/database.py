"""Database initialization and connection management."""
import sqlite3
import os
from datetime import datetime
from contextlib import contextmanager
from typing import Optional, List, Dict

DATABASE_PATH = os.getenv("DATABASE_URL", "sqlite:///complaints.db").replace("sqlite:///", "")


def init_db():
    """Initialize SQLite database with complaints table."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
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
            image_hash TEXT,
            description_hash TEXT,
            cached_ai_response_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()


@contextmanager
def get_db():
    """Context manager for database connections."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def save_complaint(
    image_url: Optional[str],
    description: str,
    location_lat: float,
    location_lng: float,
    ward: str,
    city: str,
    category: str,
    urgency: int,
    confidence: float,
    department: str,
    duplicate_count: int,
    professional_rewrite: str,
    reasoning: str,
    image_hash: Optional[str] = None,
    description_hash: Optional[str] = None,
) -> Dict:
    """Save a complaint to the database."""
    with get_db() as conn:
        cursor = conn.cursor()
        created_at_iso = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        cursor.execute("""
            INSERT INTO complaints (
                image_url, description, location_lat, location_lng,
                ward, city, category, urgency, confidence, department,
                duplicate_count, professional_rewrite, reasoning, status,
                image_hash, description_hash, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            image_url, description, location_lat, location_lng,
            ward, city, category, urgency, confidence, department,
            duplicate_count, professional_rewrite, reasoning, "open",
            image_hash, description_hash, created_at_iso
        ))
        conn.commit()
        complaint_id = cursor.lastrowid
    
    return get_complaint_by_id(complaint_id)


def get_complaint_by_id(complaint_id: int) -> Optional[Dict]:
    """Retrieve a complaint by ID."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM complaints WHERE id = ?", (complaint_id,))
        row = cursor.fetchone()
        
        if row:
            return dict(row)
        return None


def get_all_complaints(limit: int = 50, offset: int = 0) -> List[Dict]:
    """Retrieve all complaints with pagination."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM complaints ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_complaints_by_status(status: str, limit: int = 50) -> List[Dict]:
    """Retrieve complaints by status."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM complaints WHERE status = ? ORDER BY created_at DESC LIMIT ?",
            (status, limit)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def update_complaint_status(complaint_id: int, status: str) -> Optional[Dict]:
    """Update complaint status."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE complaints SET status = ? WHERE id = ?",
            (status, complaint_id)
        )
        conn.commit()
    
    return get_complaint_by_id(complaint_id)
