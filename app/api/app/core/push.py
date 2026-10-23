"""
Push notifications through Firebase Cloud Messaging (HTTP v1).

Needs FCM_PROJECT_ID and FCM_SERVICE_ACCOUNT_FILE (a service-account JSON kept outside git). The
OAuth access token is minted with google-auth, which is already an API dependency. Without that
configuration every send returns skipped_not_configured.
"""
import logging
import os
import threading
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)
_SCOPE = "https://www.googleapis.com/auth/firebase.messaging"
_lock = threading.Lock()
_credentials = None


def push_configured() -> bool:
    return bool(settings.FCM_PROJECT_ID and settings.FCM_SERVICE_ACCOUNT_FILE
                and os.path.isfile(settings.FCM_SERVICE_ACCOUNT_FILE))


def _access_token() -> str:
    global _credentials
    from google.auth.transport.requests import Request
    from google.oauth2 import service_account

    with _lock:
        if _credentials is None:
            _credentials = service_account.Credentials.from_service_account_file(
                settings.FCM_SERVICE_ACCOUNT_FILE, scopes=[_SCOPE])
        if not _credentials.valid:
            _credentials.refresh(Request())
        return _credentials.token


def send_push(token: str, title: str, body: str, data: Optional[dict] = None) -> tuple[str, Optional[str], Optional[str]]:
    """Returns (status, provider_message_id, error). 'unregistered' means the token should be revoked."""
    if not push_configured():
        return "skipped_not_configured", None, "Push notifications are not configured"
    try:
        resp = httpx.post(
            f"https://fcm.googleapis.com/v1/projects/{settings.FCM_PROJECT_ID}/messages:send",
            headers={"Authorization": f"Bearer {_access_token()}"},
            json={"message": {"token": token, "notification": {"title": title[:200], "body": body[:1000]},
                              "data": {k: str(v) for k, v in (data or {}).items()}}},
            timeout=10,
        )
    except Exception as exc:  # network or credential refresh error
        return "failed", None, f"FCM request failed: {type(exc).__name__}"
    if resp.status_code == 404 or (resp.status_code == 400 and "UNREGISTERED" in resp.text):
        return "unregistered", None, "Device token is no longer registered"
    if resp.status_code >= 400:
        return "failed", None, f"FCM responded with HTTP {resp.status_code}"
    try:
        return "sent", resp.json().get("name"), None
    except ValueError:
        return "sent", None, None
