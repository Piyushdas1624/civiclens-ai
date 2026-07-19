"""Image optimization service for reducing API call costs."""
import io
import hashlib
from typing import Tuple, Optional
from PIL import Image

# Image constraints for free-tier optimization
MAX_WIDTH = 1280
MAX_HEIGHT = 1280
JPEG_QUALITY = 80  # 80% quality for balance between size and detail


def calculate_image_hash(image_data: bytes) -> str:
    """Calculate MD5 hash of image data for cache key."""
    return hashlib.md5(image_data).hexdigest()


def optimize_image(image_data: bytes) -> Tuple[bytes, str]:
    """
    Compress and optimize image for Gemini API.
    
    Process:
    1. Open image and strip EXIF metadata
    2. Resize if larger than MAX_WIDTH x MAX_HEIGHT
    3. Convert to JPEG at JPEG_QUALITY
    4. Return optimized bytes and hash
    
    Args:
        image_data: Raw image bytes
    
    Returns:
        Tuple of (optimized_image_bytes, image_hash)
    """
    try:
        # Open image
        image = Image.open(io.BytesIO(image_data))
        
        # Remove EXIF and other metadata by creating new image
        # This also converts to RGB if needed (strips alpha channel)
        data = list(image.getdata())
        image_without_exif = Image.new(image.mode, image.size)
        image_without_exif.putdata(data)
        
        # Convert RGBA/other formats to RGB for JPEG
        if image_without_exif.mode in ('RGBA', 'LA', 'P'):
            # Create white background
            rgb_image = Image.new('RGB', image_without_exif.size, (255, 255, 255))
            rgb_image.paste(image_without_exif, mask=image_without_exif.split()[-1] if image_without_exif.mode == 'RGBA' else None)
            image_without_exif = rgb_image
        elif image_without_exif.mode != 'RGB':
            image_without_exif = image_without_exif.convert('RGB')
        
        # Resize if necessary
        original_size = image_without_exif.size
        if original_size[0] > MAX_WIDTH or original_size[1] > MAX_HEIGHT:
            image_without_exif.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.Resampling.LANCZOS)
            print(f"📏 Image resized from {original_size} to {image_without_exif.size}")
        
        # Compress to JPEG
        output = io.BytesIO()
        image_without_exif.save(output, format='JPEG', quality=JPEG_QUALITY, optimize=True)
        optimized_data = output.getvalue()
        
        # Calculate hash of optimized image
        image_hash = calculate_image_hash(optimized_data)
        
        original_size_kb = len(image_data) / 1024
        optimized_size_kb = len(optimized_data) / 1024
        reduction = round(100 * (1 - len(optimized_data) / len(image_data)))
        
        print(f"🖼️ Image optimized: {original_size_kb:.1f}KB → {optimized_size_kb:.1f}KB ({reduction}% reduction)")
        
        return optimized_data, image_hash
    
    except Exception as e:
        print(f"⚠️ Image optimization failed: {str(e)}, using original")
        # If optimization fails, return original with hash
        image_hash = calculate_image_hash(image_data)
        return image_data, image_hash


def calculate_description_hash(description: str) -> str:
    """Calculate hash of complaint description for cache key."""
    normalized = description.strip().lower()
    return hashlib.md5(normalized.encode()).hexdigest()


def is_similar_description(desc1: str, desc2: str, threshold: float = 0.8) -> bool:
    """
    Simple similarity check between two descriptions.
    Uses Jaccard similarity of word sets.
    
    Args:
        desc1: First description
        desc2: Second description
        threshold: Similarity threshold (0.0-1.0)
    
    Returns:
        True if similarity >= threshold
    """
    try:
        words1 = set(desc1.lower().split())
        words2 = set(desc2.lower().split())
        
        if not words1 or not words2:
            return False
        
        intersection = len(words1 & words2)
        union = len(words1 | words2)
        
        similarity = intersection / union if union > 0 else 0.0
        return similarity >= threshold
    except Exception as e:
        print(f"⚠️ Similarity check failed: {str(e)}")
        return False
