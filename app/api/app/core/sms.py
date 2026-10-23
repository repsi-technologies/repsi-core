"""
SMS for essential alerts (payment confirmations, expiry reminders). OTPs keep using the OTP
providers in app/services/otp.py.

SMS_PROVIDER: "none" (default), "msg91" (India; needs a DLT-approved template id per message type)
or "twilio". Without credentials every send returns skipped_not_configured; a send is "sent" only
after the provider answered HTTP 2xx.
"""
from typing import Optional

import httpx

from app.core.config import settings


def sms_configured() -> bool:
    provider = (settings.SMS_PROVIDER or "none").lower()
    if provider == "msg91":
        return bool(settings.MSG91_AUTH_KEY and settings.MSG91_SENDER_ID)
    if provider == "twilio":
        return bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER)
    return False


def send_sms(phone_e164: str, body: str, template_id: Optional[str] = None,
             variables: Optional[dict] = None) -> tuple[str, Optional[str], Optional[str]]:
    """Returns (status, provider_message_id, error)."""
    provider = (settings.SMS_PROVIDER or "none").lower()
    if not sms_configured():
        return "skipped_not_configured", None, "SMS provider is not configured"
    try:
        if provider == "msg91":
            if not template_id:
                return "failed", None, "MSG91 needs a DLT template id for this message"
            resp = httpx.post(
                "https://control.msg91.com/api/v5/flow",
                headers={"authkey": settings.MSG91_AUTH_KEY, "content-type": "application/json"},
                json={"template_id": template_id, "sender": settings.MSG91_SENDER_ID,
                      "recipients": [{"mobiles": phone_e164.lstrip("+"), **(variables or {})}]},
                timeout=settings.SMS_TIMEOUT_SECONDS,
            )
        else:  # twilio
            resp = httpx.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json",
                auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                data={"To": phone_e164, "From": settings.TWILIO_FROM_NUMBER, "Body": body[:1500]},
                timeout=settings.SMS_TIMEOUT_SECONDS,
            )
    except httpx.HTTPError as exc:
        return "failed", None, f"SMS request failed: {type(exc).__name__}"
    if resp.status_code >= 400:
        return "failed", None, f"SMS provider responded with HTTP {resp.status_code}"
    message_id = None
    try:
        payload = resp.json()
        message_id = str(payload.get("sid") or payload.get("request_id") or payload.get("message") or "") or None
    except ValueError:
        pass
    return "sent", message_id, None
