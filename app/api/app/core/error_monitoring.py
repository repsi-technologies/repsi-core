"""
Error monitoring (Sentry). Off unless SENTRY_DSN is set AND the optional `sentry-sdk` package is installed
(`pip install sentry-sdk`); otherwise unhandled errors are still logged as JSON with their request id by
app/middleware/request_context.py. Personal data is never sent: send_default_pii is off and request
bodies, cookies and auth headers are stripped before an event leaves the process.
"""
import logging

from app.core.config import settings

logger = logging.getLogger("repsi.errors")
_enabled = False


def _scrub(event, hint):
    request = event.get("request") or {}
    request.pop("data", None)
    request.pop("cookies", None)
    headers = request.get("headers") or {}
    for key in list(headers):
        if key.lower() in ("authorization", "cookie", "x-api-key"):
            headers[key] = "[redacted]"
    return event


def init() -> bool:
    global _enabled
    if not settings.SENTRY_DSN:
        return False
    try:
        import sentry_sdk
    except ImportError:
        logger.warning("SENTRY_DSN is set but sentry-sdk is not installed; error monitoring is off.")
        return False
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        release=settings.VERSION,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        send_default_pii=False,
        before_send=_scrub,
    )
    _enabled = True
    return True


def status() -> dict:
    return {"provider": "sentry", "enabled": _enabled, "configured": bool(settings.SENTRY_DSN)}
