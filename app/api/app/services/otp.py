"""
Phone OTP delivery and verification.

The authentication flow only talks to `PhoneOtpService`. Which provider delivers the code is
decided by `OTP_PROVIDER`:

- "test":    no message is sent; the code is always `OTP_TEST_CODE` (default 123456).
             Refused at startup when ENVIRONMENT=production (see Settings validator).
- "aisensy": a random 6-digit code is delivered as a WhatsApp authentication template
             through the AiSensy campaign API.

Both providers go through the same server-side verification (HMAC comparison, expiry,
attempt limits, single use), so swapping providers needs no change to the auth flow.
OTP codes are never logged or returned to the client.
"""
import hashlib
import hmac
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Protocol

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.phone import mask_phone
from app.models.auth import EmailOtpChallenge, PhoneOtpChallenge

logger = logging.getLogger(__name__)

PURPOSE_AUTH = "auth"  # sign in or sign up with a phone number
PURPOSE_LINK = "link"  # attach a phone number to the signed-in account
PURPOSES = {PURPOSE_AUTH, PURPOSE_LINK}


class OtpDeliveryError(Exception):
    pass


class OtpProvider(Protocol):
    name: str

    def generate_code(self) -> str: ...

    def send(self, phone_e164: str, code: str) -> None: ...


class TestOtpProvider:
    """Development/testing provider: fixed code, no delivery."""

    name = "test"

    def generate_code(self) -> str:
        return settings.OTP_TEST_CODE

    def send(self, phone_e164: str, code: str) -> None:
        logger.info("Test OTP issued for %s (no message sent)", mask_phone(phone_e164))


class AiSensyOtpProvider:
    """
    WhatsApp delivery via AiSensy's campaign API (POST {AISENSY_API_URL}).

    Requires an approved WhatsApp *authentication* template attached to an API campaign
    named AISENSY_CAMPAIGN_NAME whose single body parameter is the code. Authentication
    templates also carry a copy-code URL button whose parameter is the same code.
    """

    name = "aisensy"

    def generate_code(self) -> str:
        return f"{secrets.randbelow(1_000_000):06d}"

    def send(self, phone_e164: str, code: str) -> None:
        if not settings.AISENSY_API_KEY or not settings.AISENSY_CAMPAIGN_NAME:
            raise OtpDeliveryError("AiSensy is not configured")
        payload = {
            "apiKey": settings.AISENSY_API_KEY,
            "campaignName": settings.AISENSY_CAMPAIGN_NAME,
            "destination": phone_e164.lstrip("+"),
            "userName": "REPSI User",
            "source": settings.AISENSY_SOURCE,
            "templateParams": [code],
            "buttons": [
                {
                    "type": "button",
                    "sub_type": "url",
                    "index": 0,
                    "parameters": [{"type": "text", "text": code}],
                }
            ],
        }
        try:
            resp = httpx.post(settings.AISENSY_API_URL, json=payload, timeout=settings.AISENSY_TIMEOUT_SECONDS)
        except httpx.HTTPError as exc:
            raise OtpDeliveryError(f"AiSensy request failed: {type(exc).__name__}") from exc
        if resp.status_code >= 400:
            # Response bodies may echo the payload; log only the status.
            raise OtpDeliveryError(f"AiSensy responded with HTTP {resp.status_code}")


def get_otp_provider() -> OtpProvider:
    provider = settings.OTP_PROVIDER.lower()
    if provider == "aisensy":
        return AiSensyOtpProvider()
    if settings.is_production and not settings.ALLOW_TEST_OTP_IN_PRODUCTION:
        # Defense in depth; Settings already refuses this combination unless explicitly allowed.
        raise HTTPException(status_code=503, detail="Phone verification is not available.")
    return TestOtpProvider()


def _hash_code(phone_e164: str, purpose: str, code: str) -> str:
    msg = f"{phone_e164}:{purpose}:{code}".encode("utf-8")
    return hmac.new(settings.SECRET_KEY.encode("utf-8"), msg, hashlib.sha256).hexdigest()


def _aware(dt: datetime | None) -> datetime | None:
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class PhoneOtpService:
    def __init__(self, db: Session, provider: OtpProvider | None = None):
        self.db = db
        self.provider = provider or get_otp_provider()

    def _get(self, phone_e164: str, purpose: str) -> PhoneOtpChallenge | None:
        return (
            self.db.query(PhoneOtpChallenge)
            .filter(PhoneOtpChallenge.phone_e164 == phone_e164, PhoneOtpChallenge.purpose == purpose)
            .first()
        )

    def request(self, phone_e164: str, purpose: str) -> dict:
        if purpose not in PURPOSES:
            raise HTTPException(status_code=422, detail="Unsupported verification purpose.")
        now = datetime.now(timezone.utc)
        challenge = self._get(phone_e164, purpose)

        if challenge:
            last_sent = _aware(challenge.last_sent_at)
            wait = settings.PHONE_OTP_RESEND_COOLDOWN_SECONDS - (now - last_sent).total_seconds()
            if wait > 0 and challenge.consumed_at is None:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Please wait {int(wait) + 1} seconds before requesting a new code.",
                    headers={"Retry-After": str(int(wait) + 1)},
                )
            window_start = _aware(challenge.send_window_started_at)
            if (now - window_start).total_seconds() >= 3600:
                challenge.send_window_started_at = now
                challenge.send_count = 0
            if challenge.send_count >= settings.PHONE_OTP_MAX_SENDS_PER_HOUR:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many codes requested for this number. Try again later.",
                )
        else:
            challenge = PhoneOtpChallenge(
                phone_e164=phone_e164,
                purpose=purpose,
                send_window_started_at=now,
                send_count=0,
                last_sent_at=now,
                expires_at=now,
            )
            self.db.add(challenge)

        code = self.provider.generate_code()
        challenge.code_hash = _hash_code(phone_e164, purpose, code)
        challenge.expires_at = now + timedelta(minutes=settings.PHONE_OTP_EXPIRE_MINUTES)
        challenge.last_sent_at = now
        challenge.send_count = (challenge.send_count or 0) + 1
        challenge.attempts = 0
        challenge.consumed_at = None
        self.db.flush()

        try:
            self.provider.send(phone_e164, code)
        except OtpDeliveryError as exc:
            self.db.rollback()
            logger.error("OTP delivery failed for %s: %s", mask_phone(phone_e164), exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="We couldn't send the WhatsApp code right now. Please try again shortly.",
            )
        self.db.commit()
        return {
            "expires_in": settings.PHONE_OTP_EXPIRE_MINUTES * 60,
            "resend_in": settings.PHONE_OTP_RESEND_COOLDOWN_SECONDS,
            "channel": "whatsapp",
            "test_mode": self.provider.name == "test",
        }

    def verify(self, phone_e164: str, purpose: str, code: str, consume: bool = True) -> PhoneOtpChallenge:
        """Raises HTTPException unless `code` is the current, unexpired, unused code."""
        challenge = self._get(phone_e164, purpose)
        generic = HTTPException(status_code=400, detail="Incorrect or expired code.")
        if not challenge or challenge.consumed_at is not None or not challenge.code_hash:
            raise generic
        if datetime.now(timezone.utc) > _aware(challenge.expires_at):
            raise HTTPException(status_code=400, detail="This code has expired. Request a new one.")
        if challenge.attempts >= settings.PHONE_OTP_MAX_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many incorrect attempts. Request a new code.",
            )
        clean = "".join(ch for ch in (code or "") if ch.isdigit())
        if len(clean) != 6 or not hmac.compare_digest(challenge.code_hash, _hash_code(phone_e164, purpose, clean)):
            challenge.attempts += 1
            self.db.commit()
            raise HTTPException(status_code=400, detail="Incorrect code. Please check and try again.")
        if consume:
            challenge.consumed_at = datetime.now(timezone.utc)
            challenge.code_hash = None
            self.db.commit()
        return challenge


def _hash_email_code(email: str, purpose: str, code: str) -> str:
    msg = f"{email.lower().strip()}:{purpose}:{code}".encode("utf-8")
    return hmac.new(settings.SECRET_KEY.encode("utf-8"), msg, hashlib.sha256).hexdigest()


class EmailOtpService:
    def __init__(self, db: Session):
        self.db = db

    def _get(self, email: str, purpose: str) -> EmailOtpChallenge | None:
        return (
            self.db.query(EmailOtpChallenge)
            .filter(EmailOtpChallenge.email == email.lower().strip(), EmailOtpChallenge.purpose == purpose)
            .first()
        )

    @property
    def is_test_mode(self) -> bool:
        from app.core.email import _smtp_configured
        if settings.OTP_PROVIDER.lower() == "test":
            return True
        if not _smtp_configured():
            return True
        return False

    def request(self, email: str, purpose: str = PURPOSE_AUTH) -> dict:
        normalized_email = email.lower().strip()
        now = datetime.now(timezone.utc)
        challenge = self._get(normalized_email, purpose)

        if challenge:
            last_sent = _aware(challenge.last_sent_at)
            wait = settings.OTP_RESEND_COOLDOWN_SECONDS - (now - last_sent).total_seconds()
            if wait > 0 and challenge.consumed_at is None:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Please wait {int(wait) + 1} seconds before requesting a new email code.",
                    headers={"Retry-After": str(int(wait) + 1)},
                )
            window_start = _aware(challenge.send_window_started_at)
            if (now - window_start).total_seconds() >= 3600:
                challenge.send_window_started_at = now
                challenge.send_count = 0
            if challenge.send_count >= 5:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many email codes requested. Try again later.",
                )
        else:
            challenge = EmailOtpChallenge(
                email=normalized_email,
                purpose=purpose,
                send_window_started_at=now,
                send_count=0,
                last_sent_at=now,
                expires_at=now,
            )
            self.db.add(challenge)

        test_mode = self.is_test_mode
        code = settings.OTP_TEST_CODE if test_mode else f"{secrets.randbelow(1_000_000):06d}"
        challenge.code_hash = _hash_email_code(normalized_email, purpose, code)
        challenge.expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
        challenge.last_sent_at = now
        challenge.send_count = (challenge.send_count or 0) + 1
        challenge.attempts = 0
        challenge.consumed_at = None
        self.db.flush()

        try:
            from app.core.email import send_registration_otp
            send_registration_otp(normalized_email, code)
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as exc:
            self.db.rollback()
            logger.error("Email OTP delivery failed for %s: %s", normalized_email, exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="We couldn't send the email verification code right now. Please try again shortly.",
            )
        self.db.commit()
        return {
            "expires_in": settings.OTP_EXPIRE_MINUTES * 60,
            "resend_in": settings.OTP_RESEND_COOLDOWN_SECONDS,
            "channel": "email",
            "test_mode": test_mode,
        }

    def verify(self, email: str, purpose: str, code: str, consume: bool = True) -> EmailOtpChallenge:
        normalized_email = email.lower().strip()
        challenge = self._get(normalized_email, purpose)
        generic = HTTPException(status_code=400, detail="Incorrect or expired email verification code.")
        if not challenge or challenge.consumed_at is not None or not challenge.code_hash:
            raise generic
        if datetime.now(timezone.utc) > _aware(challenge.expires_at):
            raise HTTPException(status_code=400, detail="This email verification code has expired. Request a new one.")
        if challenge.attempts >= 5:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many incorrect email code attempts. Request a new code.",
            )
        clean = "".join(ch for ch in (code or "") if ch.isdigit())
        if len(clean) != 6 or not hmac.compare_digest(challenge.code_hash, _hash_email_code(normalized_email, purpose, clean)):
            challenge.attempts += 1
            self.db.commit()
            raise HTTPException(status_code=400, detail="Incorrect email verification code. Please check and try again.")
        if consume:
            challenge.consumed_at = datetime.now(timezone.utc)
            challenge.code_hash = None
            self.db.commit()
        return challenge
