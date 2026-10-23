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
    """
    The caller's IP. X-Forwarded-For is client-controlled, so it is only used when
    TRUST_FORWARDED_FOR is on (the API sits behind our own reverse proxy), and then only the
    rightmost entry, which that proxy appended and a client cannot forge.
    """
    from app.core.config import settings

    if request is None:
        return "unknown"
    if settings.TRUST_FORWARDED_FOR:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def enforce_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    from app.core.config import settings

    if not settings.RATE_LIMITS_ENABLED:
        return
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
