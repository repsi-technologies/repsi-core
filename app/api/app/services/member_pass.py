"""
Short-lived signed member passes for staff-scanned QR check-in.

Format: "rpass1.<base64url(payload)>.<base64url(hmac)>"
payload = {"m": member_id, "w": workspace_id, "e": expires_unix, "j": random_jti}

The QR carries no personal data, cannot be forged without SECRET_KEY, expires after
MEMBER_PASS_TTL_SECONDS, and each jti can be redeemed once (member_pass_redemptions.jti is
unique), so screenshots and camera re-scans can't be replayed. A valid pass only identifies
the member — access is still decided by access_eligibility.
"""
import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Optional

from fastapi import HTTPException, status

from app.core.config import settings

PREFIX = "rpass1"


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _unb64(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def _sign(body: str) -> str:
    key = hashlib.sha256(f"member-pass:{settings.SECRET_KEY}".encode()).digest()
    return _b64(hmac.new(key, body.encode(), hashlib.sha256).digest())


def is_member_pass(value: Optional[str]) -> bool:
    return bool(value) and value.strip().startswith(PREFIX + ".")


def issue_pass(member_id: str, workspace_id: str, now: Optional[float] = None) -> dict:
    now = int(now if now is not None else time.time())
    expires = now + settings.MEMBER_PASS_TTL_SECONDS
    payload = {"m": member_id, "w": workspace_id, "e": expires, "j": secrets.token_urlsafe(12)}
    body = _b64(json.dumps(payload, separators=(",", ":")).encode())
    return {"token": f"{PREFIX}.{body}.{_sign(body)}", "expires_at": expires, "ttl_seconds": settings.MEMBER_PASS_TTL_SECONDS}


def _invalid(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def verify_pass(token: str, workspace_id: str, now: Optional[float] = None) -> tuple[str, str]:
    """Returns (member_id, jti). Raises 400 for malformed, forged, expired or other-gym passes."""
    try:
        prefix, body, sig = token.strip().split(".")
    except ValueError:
        raise _invalid("Unrecognised member pass.")
    if prefix != PREFIX or not hmac.compare_digest(sig, _sign(body)):
        raise _invalid("Invalid member pass.")
    try:
        payload = json.loads(_unb64(body))
    except Exception:
        raise _invalid("Invalid member pass.")
    if payload.get("w") != workspace_id:
        raise _invalid("This pass belongs to a different gym.")
    if int(payload.get("e", 0)) < int(now if now is not None else time.time()):
        raise _invalid("This pass has expired. Ask the member to refresh the QR in their app.")
    return payload["m"], payload["j"]
