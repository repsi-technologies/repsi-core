from pathlib import Path
from typing import Any

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

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

    PASSWORD_RESET_EXPIRE_MINUTES: int = 30

    # Database
    DATABASE_URL: str = "sqlite:///./repsi.db"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Cashfree Payment Gateway
    CASHFREE_APP_ID: str = ""
    CASHFREE_SECRET_KEY: str = ""
    CASHFREE_ENV: str = "TEST"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "https://repsi.app",
        "https://www.repsi.app",
        "https://repsi.vercel.app",
        "https://repsi.fastapicloud.dev",
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
