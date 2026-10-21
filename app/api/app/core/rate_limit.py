"""
Small in-process sliding-window rate limiter for unauthenticated auth endpoints.

Limits are per API process. A multi-process or multi-host deployment should move this
to a shared store (e.g. Redis); persistent per-phone OTP limits live in the database.
"""
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

_lock = threading.Lock()
_hits: dict[str, deque] = defaultdict(deque)


def client_ip(request: Request | None) -> str:
    if request is None:
        return "unknown"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    now = time.monotonic()
    with _lock:
        bucket = _hits[key]
        while bucket and now - bucket[0] > window_seconds:
            bucket.popleft()
        if len(bucket) >= limit:
            retry_after = int(window_seconds - (now - bucket[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Please wait a moment and try again.",
                headers={"Retry-After": str(retry_after)},
            )
        bucket.append(now)


def reset_rate_limits() -> None:
    """Test helper."""
    with _lock:
        _hits.clear()
