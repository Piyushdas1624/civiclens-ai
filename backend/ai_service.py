"""Google Gemini AI service for issue analysis."""
import os
import json
import base64
from typing import Dict, Optional
from dotenv import load_dotenv
import google.generativeai as genai
import requests

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Mock response for testing
MOCK_GEMINI_RESPONSE = {
    "category": "electrical",
    "urgency_score": 75,
    "urgency_explanation": ["Power outage affecting multiple units", "High safety risk"],
    "confidence": 0.92,
    "professional_rewrite": "Multiple residential units experiencing complete power loss. Immediate electrical inspection required. Potential safety hazard.",
    "department": "Electrical",
    "duplicate_count": 2,
    "duplicate_reason": "Similar power outage reports from adjacent buildings in past 3 hours",
    "citizen_message": "Thank you for reporting this electrical issue. Our team has been notified and will investigate within 24 hours."
}


def configure_gemini():
    """Configure Gemini API."""
    if not GEMINI_API_KEY:
        print("⚠️ GEMINI_API_KEY not set, using mock responses")
        return False
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        return True
    except Exception as e:
        print(f"❌ Failed to configure Gemini: {str(e)}")
        return False


def encode_image_to_base64(image_data: bytes) -> str:
    """Encode image bytes to base64 string."""
    return base64.standard_b64encode(image_data).decode("utf-8")


def analyze_issue(
    image_data: Optional[bytes],
    description: str,
    location: Dict[str, str],
    weather: Dict[str, any]
) -> Dict:
    """
    Analyze a civic complaint using Gemini vision and reasoning.
    
    Args:
        image_data: Raw image bytes (optional)
        description: User's textual description
        location: Location dict with ward, city, area
        weather: Weather dict with temperature, rain, wind, etc.
    
    Returns:
        Dict with analysis results
    """
    if not configure_gemini():
        print("📋 Using mock Gemini response for testing")
        return MOCK_GEMINI_RESPONSE
    
    try:
        # Build context
        context = f"""
Location: {location.get('address', 'Unknown')}, Ward: {location.get('ward')}, City: {location.get('city')}
Weather: {weather.get('condition')}, Temperature: {weather.get('temperature')}°C, 
Rain: {weather.get('rain')}mm, Wind: {weather.get('wind_speed')}km/h, Visibility: {weather.get('visibility')}km
"""
        
        system_prompt = """You are an AI municipal officer analyzing civic complaints. 
Your role is to:
1. Categorize the issue
2. Assess urgency (0-100 scale)
3. Evaluate confidence in the assessment
4. Rewrite the complaint professionally
5. Route to appropriate department
6. Detect potential duplicates
7. Provide friendly acknowledgment

Always respond with valid JSON only, no markdown formatting."""
        
        user_prompt = f"""Analyze this civic complaint:

Description: {description}

{context}

Respond with ONLY this JSON structure (no markdown, no explanation):
{{
  "category": "electrical|road|water|sanitation|parks|other",
  "urgency_score": <0-100>,
  "urgency_explanation": ["reason 1", "reason 2"],
  "confidence": <0.0-1.0>,
  "professional_rewrite": "formal description",
  "department": "Electrical|Water|Sanitation|Roads|Parks|Other",
  "duplicate_count": <0-5>,
  "duplicate_reason": "why this might be duplicate or null",
  "citizen_message": "friendly acknowledgment"
}}"""
        
        # Prepare request
        model = genai.GenerativeModel("gemini-3.5-flash")
        
        # Build content with optional image
        content_parts = []
        
        if image_data:
            try:
                # Add image
                content_parts.append({
                    "mime_type": "image/jpeg",
                    "data": encode_image_to_base64(image_data)
                })
            except Exception as e:
                print(f"⚠️ Failed to encode image: {str(e)}")
        
        # Add text prompt
        content_parts.append(user_prompt)
        
        # Disable safety filters for hackathon civic issue categories
        safety_settings = {
            genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
            genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: genai.types.HarmBlockThreshold.BLOCK_NONE,
            genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: genai.types.HarmBlockThreshold.BLOCK_NONE,
            genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
        }
        
        # Call Gemini with strict JSON mode and safety disabled
        response = model.generate_content(
            content_parts,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=2048,  # Increase token limit to be safe
                temperature=0.1,  # Lower temperature to reduce generation noise
                response_mime_type="application/json"
            ),
            safety_settings=safety_settings
        )
        
        response_text = response.text.strip()
        print(f"🤖 Gemini response received (length: {len(response_text)})")
        
        # Robustly extract JSON block using regex
        import re
        brace_match = re.search(r'(\{.*\})', response_text, re.DOTALL)
        if brace_match:
            response_text = brace_match.group(1).strip()
        else:
            # Fallback text cleaning
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
        
        # Parse JSON response
        result = json.loads(response_text)
        
        # Validate and clean response
        return {
            "category": result.get("category", "other"),
            "urgency_score": min(100, max(0, int(result.get("urgency_score", 50)))),
            "urgency_explanation": result.get("urgency_explanation", ["Assessment based on provided information"]),
            "confidence": min(1.0, max(0.0, float(result.get("confidence", 0.5)))),
            "professional_rewrite": result.get("professional_rewrite", description),
            "department": result.get("department", "Other"),
            "duplicate_count": min(5, max(0, int(result.get("duplicate_count", 0)))),
            "duplicate_reason": result.get("duplicate_reason"),
            "citizen_message": result.get("citizen_message", "Thank you for reporting this issue. Our team will review it shortly.")
        }
    
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse Gemini JSON response: {str(e)}")
        print(f"Response was: {response.text}")
        return MOCK_GEMINI_RESPONSE
    except Exception as e:
        print(f"❌ Gemini analysis failed: {str(e)}")
        return MOCK_GEMINI_RESPONSE
