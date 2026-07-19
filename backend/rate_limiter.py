"""Rate limiting service for external APIs."""
import time
from typing import Tuple
from cache_service import get_api_call_count, record_api_call

# Rate limits for Gemini API
GEMINI_RATE_LIMIT_PER_MINUTE = 5  # 5 requests per minute
GEMINI_RATE_LIMIT_PER_HOUR = 50   # 50 requests per hour


class RateLimitExceeded(Exception):
    """Raised when rate limit is exceeded."""
    def __init__(self, retry_after: int, limit_type: str):
        self.retry_after = retry_after
        self.limit_type = limit_type
        super().__init__(f"Rate limit exceeded ({limit_type}). Retry after {retry_after}s")


def check_rate_limit(api_name: str = "gemini") -> Tuple[bool, int]:
    """
    Check if API rate limit is exceeded.
    
    Args:
        api_name: Name of API to check (default: "gemini")
    
    Returns:
        Tuple of (is_allowed, seconds_until_next_request)
        - is_allowed: True if request can proceed
        - seconds_until_next_request: 0 if allowed, else seconds to wait
    
    Raises:
        RateLimitExceeded if hard limit exceeded
    """
    # Check 1-minute limit
    calls_last_minute = get_api_call_count(api_name, seconds=60)
    if calls_last_minute >= GEMINI_RATE_LIMIT_PER_MINUTE:
        print(f"⚠️ Rate limit: {calls_last_minute}/{GEMINI_RATE_LIMIT_PER_MINUTE} calls/min")
        raise RateLimitExceeded(
            retry_after=60,
            limit_type=f"per_minute ({calls_last_minute}/{GEMINI_RATE_LIMIT_PER_MINUTE})"
        )
    
    # Check 1-hour limit
    calls_last_hour = get_api_call_count(api_name, seconds=3600)
    if calls_last_hour >= GEMINI_RATE_LIMIT_PER_HOUR:
        print(f"⚠️ Rate limit: {calls_last_hour}/{GEMINI_RATE_LIMIT_PER_HOUR} calls/hour")
        raise RateLimitExceeded(
            retry_after=3600,
            limit_type=f"per_hour ({calls_last_hour}/{GEMINI_RATE_LIMIT_PER_HOUR})"
        )
    
    return True, 0


def record_api_call_usage(api_name: str = "gemini") -> None:
    """Record that an API call was made."""
    record_api_call(api_name)
    calls_last_minute = get_api_call_count(api_name, seconds=60)
    print(f"📊 API usage: {calls_last_minute}/{GEMINI_RATE_LIMIT_PER_MINUTE} calls/min")


def exponential_backoff_retry(func, max_retries: int = 3, initial_delay: float = 1.0):
    """
    Retry a function with exponential backoff on failure.
    
    Args:
        func: Callable to retry
        max_retries: Maximum number of retries
        initial_delay: Initial delay in seconds (doubles each retry)
    
    Returns:
        Result of func() on success
    
    Raises:
        Last exception if all retries failed
    """
    last_exception = None
    delay = initial_delay
    
    for attempt in range(max_retries + 1):
        try:
            return func()
        except Exception as e:
            last_exception = e
            
            # Check for retryable status codes
            if hasattr(e, 'status_code'):
                if e.status_code in [429, 500, 502, 503, 504]:
                    if attempt < max_retries:
                        print(f"⚠️ Retryable error ({e.status_code}), attempt {attempt + 1}/{max_retries + 1}")
                        print(f"⏳ Waiting {delay}s before retry...")
                        time.sleep(delay)
                        delay *= 2  # Exponential backoff
                    continue
            else:
                # Network errors, timeouts
                if isinstance(e, (ConnectionError, TimeoutError)):
                    if attempt < max_retries:
                        print(f"⚠️ Connection error, attempt {attempt + 1}/{max_retries + 1}")
                        print(f"⏳ Waiting {delay}s before retry...")
                        time.sleep(delay)
                        delay *= 2
                    continue
            
            # Non-retryable error
            raise
    
    raise last_exception
