from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

PASSWORD_MIN_LENGTH = 8


def _check_password(value: str) -> str:
    if len(value) < PASSWORD_MIN_LENGTH:
        raise ValueError(f"Password must be at least {PASSWORD_MIN_LENGTH} characters.")
    if len(value.encode("utf-8")) > 72:
        raise ValueError("Password must be at most 72 bytes.")
    return value


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str | None = None
    avatar_url: str | None = None
    is_superadmin: bool
    is_active: bool
    role: str | None = None
    workspace_id: str | None = None
    workspace_slug: str | None = None
    gym_name: str | None = None
    gym_logo_url: str | None = None
    preferred_language: str = "en"
    email_verified: bool = False
    phone_verified: bool = False
    onboarding_required: bool = False

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    workspace_id: str | None = None
    workspace_slug: str | None = None
    gym_name: str | None = None
    gym_logo_url: str | None = None
    role: str | None = None
    user: UserResponse | None = None
    # Where the client should go next, derived from the user's real memberships and
    # onboarding state (e.g. "/onboarding", "/acme/dashboard", "/superadmin/dashboard").
    next_path: str | None = None
    onboarding_required: bool = False
    # Opaque, single-use refresh token for POST /auth/refresh (rotates on every use).
    refresh_token: str | None = None
    expires_in: int | None = None


class TokenPayload(BaseModel):
    sub: str | None = None
    workspace_id: str | None = None
    role: str | None = None


class LoginRequest(BaseModel):
    # Accepts an email address or a phone number (kept as `email` for client compatibility).
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=256)
    workspace_slug: str | None = None
    country: str | None = Field(default=None, max_length=2)


class GoogleLoginRequest(BaseModel):
    token: str = Field(min_length=10)
    workspace_slug: str | None = None


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    gym_name: str
    gym_phone: str | None = None
    gym_city: str | None = None


class RegisterOtpRequest(RegisterRequest):
    pass


class VerifyRegisterOtpRequest(BaseModel):
    email: EmailStr
    otp: str


class ResendRegisterOtpRequest(BaseModel):
    email: EmailStr


class MemberRegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    workspace_slug: str
    phone: str | None = None


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str = Field(min_length=16)
    new_password: str

    _pw = field_validator("new_password")(_check_password)


# ─── Phone (WhatsApp) OTP ───────────────────────────────────────────────

class PhoneOtpRequest(BaseModel):
    phone: str = Field(min_length=4, max_length=32)
    country: str | None = Field(default=None, max_length=2)
    purpose: Literal["auth", "link", "login"] = "auth"


class PhoneOtpVerify(BaseModel):
    phone: str = Field(min_length=4, max_length=32)
    country: str | None = Field(default=None, max_length=2)
    code: str = Field(min_length=6, max_length=12)


class PhoneOtpRequestResponse(BaseModel):
    phone: str
    expires_in: int
    resend_in: int
    channel: str = "whatsapp"
    test_mode: bool = False


class PhoneVerifyResponse(BaseModel):
    """Either a session (`token`) for an existing account, or a short-lived
    `registration_token` proving the phone was verified, for completing sign-up."""
    status: Literal["authenticated", "registration_required"]
    token: Token | None = None
    registration_token: str | None = None
    phone: str


class EmailOtpRequest(BaseModel):
    email: EmailStr
    purpose: str = "auth"


class EmailOtpRequestResponse(BaseModel):
    email: str
    expires_in: int
    resend_in: int
    channel: str = "email"
    test_mode: bool = False


class EmailOtpVerify(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=12)


class SignupOtpsRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(min_length=4, max_length=32)
    country: str = Field(default="IN", max_length=2)


class SignupOtpsResponse(BaseModel):
    phone: str
    email: str
    phone_resend_in: int
    email_resend_in: int
    phone_expires_in: int
    email_expires_in: int
    test_mode: bool = False


class SignupRequest(BaseModel):
    registration_token: str | None = None
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str
    phone: str | None = None
    country: str | None = None
    phone_code: str | None = None
    email_code: str | None = None

    _pw = field_validator("password")(_check_password)

    @field_validator("full_name")
    @classmethod
    def _strip_name(cls, v: str) -> str:
        v = " ".join(v.split())
        if len(v) < 2:
            raise ValueError("Enter your full name.")
        return v


# ─── Account / linked sign-in methods ─────────────────────────────────

class IdentitySummary(BaseModel):
    email: str
    email_verified: bool
    has_password: bool
    phone: str | None = None
    phone_verified: bool
    google_linked: bool
    google_email: str | None = None


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    preferred_language: str | None = None


class AccountDeleteRequest(BaseModel):
    """`password` is required for accounts that have one; Google-only accounts confirm with the word."""
    password: str | None = None
    confirm: str = Field(min_length=1, max_length=20)


class PasswordChange(BaseModel):
    current_password: str | None = None
    new_password: str

    _pw = field_validator("new_password")(_check_password)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=20, max_length=200)
    workspace: str | None = None


class LogoutRequest(BaseModel):
    refresh_token: str | None = None
    all_devices: bool = False
