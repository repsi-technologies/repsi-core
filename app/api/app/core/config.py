from pathlib import Path
from typing import Annotated, Any

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

_CURRENT_DIR = Path(__file__).resolve().parent
_API_ENV = _CURRENT_DIR.parent.parent / ".env"
_REPO_ENV = _CURRENT_DIR.parent.parent.parent.parent / ".env"
_ENV_FILES = [str(_REPO_ENV), str(_API_ENV), ".env"]


class Settings(BaseSettings):
    PROJECT_NAME: str = "REPSI API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "repsi-super-secret-key-change-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    FRONTEND_URL: str = "http://localhost:3000"

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    OTP_EXPIRE_MINUTES: int = 10
    OTP_RESEND_COOLDOWN_SECONDS: int = 60

    # Phone (WhatsApp) OTP
    # "test" verifies against OTP_TEST_CODE and sends nothing; "aisensy" delivers via WhatsApp.
    # "test" is refused when ENVIRONMENT=production (see validator below).
    OTP_PROVIDER: str = "test"
    OTP_TEST_CODE: str = "123456"
    ALLOW_TEST_OTP_IN_PRODUCTION: bool = False
    PHONE_OTP_EXPIRE_MINUTES: int = 5
    PHONE_OTP_RESEND_COOLDOWN_SECONDS: int = 30
    PHONE_OTP_MAX_SENDS_PER_HOUR: int = 5
    PHONE_OTP_MAX_ATTEMPTS: int = 5

    # AiSensy WhatsApp delivery (server-side only; never exposed to the frontend)
    AISENSY_API_URL: str = "https://backend.aisensy.com/campaign/t1/api/v2"
    AISENSY_API_KEY: str = ""
    AISENSY_CAMPAIGN_NAME: str = ""
    AISENSY_SOURCE: str = "repsi-auth"
    AISENSY_TIMEOUT_SECONDS: float = 10.0

    # Google OAuth: tokens are only accepted when issued to this client ID
    GOOGLE_CLIENT_ID: str = ""
    # Comma-separated extra OAuth client IDs (Android / iOS apps) whose tokens are also accepted.
    # A mobile app's Google access token is issued to its own platform client, not the web one.
    GOOGLE_MOBILE_CLIENT_IDS: str = ""

    @property
    def google_allowed_client_ids(self) -> set[str]:
        ids = {self.GOOGLE_CLIENT_ID.strip(), *(i.strip() for i in self.GOOGLE_MOBILE_CLIENT_IDS.split(","))}
        return {i for i in ids if i}

    PASSWORD_RESET_EXPIRE_MINUTES: int = 30
    # Legacy owner sign-up without email verification (POST /auth/register). Off in production
    # unless explicitly enabled; the verified sign-up flows replace it.
    LEGACY_REGISTRATION_ENABLED: bool | None = None
    # Server-side sessions: refresh tokens are opaque, stored hashed, and rotate on every use.
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    # Days after a missed SaaS renewal before paid features lock (per-gym override on the subscription).
    BILLING_GRACE_DAYS: int = 3
    # Use the X-Forwarded-For hop added by our own reverse proxy as the client IP (rate limits, audit).
    TRUST_FORWARDED_FOR: bool = False
    # Only for local end-to-end test stacks; refused when ENVIRONMENT=production.
    RATE_LIMITS_ENABLED: bool = True

    # Private file storage: "local" (app/api/private_storage) or "s3" (any S3-compatible bucket; needs boto3)
    STORAGE_BACKEND: str = "local"
    STORAGE_S3_BUCKET: str = ""
    STORAGE_S3_PREFIX: str = "repsi"
    STORAGE_S3_REGION: str = ""
    STORAGE_S3_ENDPOINT_URL: str = ""
    STORAGE_S3_ACCESS_KEY_ID: str = ""
    STORAGE_S3_SECRET_ACCESS_KEY: str = ""
    MEMBER_DOCUMENT_MAX_BYTES: int = 10 * 1024 * 1024
    # Public images (gym logos, profile photos) go to Cloudinary when configured, otherwise to the
    # storage backend above. Private files (documents, receipts, payment QR) never go to Cloudinary.
    # Either CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name> or the three parts.
    CLOUDINARY_URL: str = ""
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    CLOUDINARY_FOLDER: str = "repsi"
    CLOUDINARY_TIMEOUT_SECONDS: float = 20.0
    AVATAR_MAX_BYTES: int = 5 * 1024 * 1024

    # SMS for essential alerts: "none", "msg91" (India, DLT template ids) or "twilio"
    SMS_PROVIDER: str = "none"
    SMS_TIMEOUT_SECONDS: float = 10.0
    MSG91_AUTH_KEY: str = ""
    MSG91_SENDER_ID: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""

    # Push notifications through Firebase Cloud Messaging HTTP v1 (service-account JSON file path)
    FCM_PROJECT_ID: str = ""
    FCM_SERVICE_ACCOUNT_FILE: str = ""

    # Error monitoring (Sentry). Needs the optional sentry-sdk package and a DSN; off otherwise.
    SENTRY_DSN: str = ""
    SENTRY_TRACES_SAMPLE_RATE: float = 0.0

    # In-process scheduler for reminders, expiries, auto-checkout and queued messages. Enable it on
    # exactly one API process, or leave it off and run `python -m scripts.run_jobs` from cron.
    SCHEDULER_ENABLED: bool = False
    SCHEDULER_TICK_SECONDS: int = 60

    # Membership lifecycle defaults (used when a workspace has no override)
    DEFAULT_TIMEZONE: str = "Asia/Kolkata"
    MEMBERSHIP_MAX_FREEZE_DAYS: int = 90
    MEMBERSHIP_MAX_EXTENSION_DAYS: int = 365

    # Signed member QR passes (staff scan); short TTL limits screenshot reuse, jti blocks replay
    MEMBER_PASS_TTL_SECONDS: int = 60
    # Invalid scans allowed per staff user per minute before rate limiting
    ATTENDANCE_INVALID_SCAN_LIMIT: int = 10

    # Database
    DATABASE_URL: str = "sqlite:///./repsi.db"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # In-process TTL cache (entitlements, platform overview). Per worker; see app/core/cache.py.
    CACHE_ENABLED: bool = True
    ENTITLEMENT_CACHE_SECONDS: float = 30.0
    PLATFORM_OVERVIEW_CACHE_SECONDS: float = 60.0
    # Slow-request warning threshold for the request log
    SLOW_REQUEST_MS: int = 1000
    # AI (Google Gemini, free tier by default). Without GEMINI_API_KEY every AI feature still works
    # with deterministic answers and reports ai=false; nothing is faked. See app/services/ai_core.py.
    AI_ENABLED: bool = True
    GEMINI_API_KEY: str = ""
    GEMINI_API_URL: str = "https://generativelanguage.googleapis.com/v1beta"
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    GEMINI_FALLBACK_MODEL: str = "gemini-2.5-flash-lite"
    GEMINI_TIMEOUT_SECONDS: float = 20.0
    # Platform-wide Gemini calls (keep under the key's free-tier requests/day and requests/minute)
    AI_GLOBAL_DAILY_CALLS: int = 800
    AI_GLOBAL_CALLS_PER_MINUTE: int = 10
    # Per-person daily Gemini calls (cache/knowledge-base answers are free and unlimited)
    AI_MEMBER_DAILY_CALLS: int = 5
    AI_STAFF_DAILY_CALLS: int = 20

    # Hard cap on request bodies (largest upload is a 10 MB payment proof)
    MAX_REQUEST_BYTES: int = 12 * 1024 * 1024

    # Cashfree Payment Gateway
    CASHFREE_APP_ID: str = ""
    CASHFREE_SECRET_KEY: str = ""
    CASHFREE_ENV: str = "TEST"

    # CORS
    # NoDecode lets the validator below accept comma-separated values as well as JSON lists;
    # without it pydantic-settings insists on JSON and refuses to start on a plain comma list.
    BACKEND_CORS_ORIGINS: Annotated[list[str], NoDecode] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "https://repsi.app",
        "https://www.repsi.app",
        "https://repsi.vercel.app",
    ]

    @field_validator("SMTP_PORT", mode="before")
    @classmethod
    def assemble_smtp_port(cls, v: Any) -> int:
        if v is None or v == "":
            return 587
        return int(v)

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v: Any) -> str:
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("postgres://"):
                return v_str.replace("postgres://", "postgresql://", 1)
            return v_str
        return str(v) if v is not None else "sqlite:///./repsi.db"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            if not v.strip():
                return []
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(i).strip() for i in parsed]
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(i).strip() for i in v]
        raise ValueError(v)

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.ENVIRONMENT.lower() == "production":
            if not self.RATE_LIMITS_ENABLED:
                raise ValueError("RATE_LIMITS_ENABLED cannot be turned off in production!")
            if self.SECRET_KEY == "repsi-super-secret-key-change-in-production-min-32-chars-long":
                raise ValueError("SECRET_KEY must be changed from the default value in production!")
            if len(self.SECRET_KEY) < 32:
                raise ValueError("SECRET_KEY must be at least 32 characters in production!")
            if self.OTP_PROVIDER.lower() == "test" and not self.ALLOW_TEST_OTP_IN_PRODUCTION:
                raise ValueError(
                    "OTP_PROVIDER=test (fixed OTP) is not allowed in production! "
                    "Set OTP_PROVIDER=aisensy or set ALLOW_TEST_OTP_IN_PRODUCTION=true if intentionally testing in production."
                )
        if self.OTP_PROVIDER.lower() not in {"test", "aisensy"}:
            raise ValueError("OTP_PROVIDER must be 'test' or 'aisensy'.")
        return self

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
