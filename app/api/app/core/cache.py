"""
Small in-process TTL cache for hot, read-mostly lookups (entitlements, platform overview).

Per-process, like `core/rate_limit.py`: each API worker keeps its own copy, so TTLs are kept
short and every write path that changes the cached data calls `invalidate(prefix)`. A
multi-host deployment that needs cross-worker invalidation should move this to Redis.
Set CACHE_ENABLED=false to bypass it entirely.
"""
import threading
import time
from typing import Any, Callable, TypeVar

from app.core.config import settings

T = TypeVar("T")

_lock = threading.Lock()
_store: dict[str, tuple[float, Any]] = {}
_stats = {"hits": 0, "misses": 0}


def get_or_set(key: str, ttl_seconds: float, factory: Callable[[], T]) -> T:
    if not getattr(settings, "CACHE_ENABLED", True) or ttl_seconds <= 0:
        return factory()
    now = time.monotonic()
    with _lock:
        hit = _store.get(key)
        if hit and hit[0] > now:
            _stats["hits"] += 1
            return hit[1]
    value = factory()  # computed outside the lock; a concurrent miss just recomputes
    with _lock:
        _stats["misses"] += 1
        _store[key] = (now + ttl_seconds, value)
    return value


def invalidate(prefix: str = "") -> None:
    with _lock:
        for key in [k for k in _store if k.startswith(prefix)]:
            del _store[key]


def stats() -> dict:
    with _lock:
        return {**_stats, "entries": len(_store)}
