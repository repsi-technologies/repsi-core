"""
Request ID, structured access log, secure headers and request-size limit.

Every response carries `X-Request-ID` (the caller's value when it looks safe, otherwise a new
UUID); the same id is in the JSON access-log line, so a user-reported id leads straight to the
server log. Access logs record method, route path (no query string), status and duration only:
no headers, tokens, bodies or PII.
"""
import json
import logging
import re
import time
import uuid
from contextvars import ContextVar

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.config import settings

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")
access_logger = logging.getLogger("repsi.access")
_SAFE_ID = re.compile(r"^[A-Za-z0-9._-]{8,64}$")

SECURE_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
}
# Interactive API docs load scripts from a CDN; everything else is JSON and may not be framed or run scripts.
API_CSP = "default-src 'none'; frame-ancestors 'none'"
DOCS_PATHS = ("/docs", "/redoc", "/openapi.json")


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get()
        return True


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "request_id": getattr(record, "request_id", "-"),
            "msg": record.getMessage(),
        }
        payload.update(getattr(record, "fields", {}) or {})
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging() -> None:
    """JSON logs with request ids on the root logger (idempotent)."""
    root = logging.getLogger()
    if any(isinstance(h.formatter, JsonFormatter) for h in root.handlers):
        return
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    handler.addFilter(RequestIdFilter())
    root.addHandler(handler)
    root.setLevel(logging.INFO if settings.is_production else logging.INFO)


def install(app: FastAPI) -> None:
    @app.middleware("http")
    async def request_context(request: Request, call_next):
        incoming = request.headers.get("x-request-id", "")
        rid = incoming if _SAFE_ID.match(incoming) else uuid.uuid4().hex
        token = request_id_var.set(rid)
        started = time.perf_counter()
        try:
            length = int(request.headers.get("content-length") or 0)
        except ValueError:
            length = 0
        try:
            if length > settings.MAX_REQUEST_BYTES:
                response = JSONResponse(status_code=413, content={"detail": "Request body is too large."})
            else:
                try:
                    response = await call_next(request)
                except Exception:
                    access_logger.exception("Unhandled error", extra={"fields": {"path": request.url.path}})
                    response = JSONResponse(
                        status_code=500,
                        content={"detail": "Something went wrong on our side.", "request_id": rid},
                    )
            duration_ms = round((time.perf_counter() - started) * 1000, 1)
            response.headers["X-Request-ID"] = rid
            for header, value in SECURE_HEADERS.items():
                response.headers.setdefault(header, value)
            if not request.url.path.endswith(DOCS_PATHS):
                response.headers.setdefault("Content-Security-Policy", API_CSP)
            if settings.is_production:
                response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
            route = request.scope.get("route")
            fields = {
                "method": request.method,
                "path": getattr(route, "path", None) or request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
            }
            level = logging.WARNING if duration_ms >= settings.SLOW_REQUEST_MS or response.status_code >= 500 else logging.INFO
            access_logger.log(level, "request", extra={"fields": fields})
            return response
        finally:
            request_id_var.reset(token)
