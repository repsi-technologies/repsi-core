from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.phone import normalize_phone, require_phone
from app.core.rate_limit import client_ip, enforce_rate_limit
from app.middleware.tenant import TenantContext, get_current_tenant, get_current_user
from app.models.user import User, Workspace
from app.schemas.auth import (
    EmailOtpRequest,
    EmailOtpRequestResponse,
    EmailOtpVerify,
    GoogleLoginRequest,
    IdentitySummary,
    LoginRequest,
    MemberRegisterRequest,
    PasswordChange,
    PasswordResetConfirm,
    PasswordResetRequest,
    PhoneOtpRequest,
    PhoneOtpRequestResponse,
    PhoneOtpVerify,
    PhoneVerifyResponse,
    ProfileUpdate,
    RegisterOtpRequest,
    RegisterRequest,
    ResendRegisterOtpRequest,
    SignupOtpsRequest,
    SignupOtpsResponse,
    SignupRequest,
    Token,
    UserResponse,
    VerifyRegisterOtpRequest,
)
from app.services.auth import RESERVED_SLUGS, AuthService, has_usable_password
from app.services.otp import PURPOSE_AUTH, PURPOSE_LINK, EmailOtpService, PhoneOtpService

router = APIRouter(prefix="/auth", tags=["Authentication"])

VALID_LANGUAGES = ["en", "ta", "ml", "kn", "te"]


def _limit(request: Request, name: str, limit: int, window: int, extra: str = "") -> None:
    enforce_rate_limit(f"{name}:{client_ip(request)}:{extra}", limit, window)


# ─── Legacy owner/member registration (kept for mobile + email-OTP web flow) ──

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    _limit(request, "register", 10, 3600)
    auth_service = AuthService(db)
    user, workspace, _ = auth_service.register(req)
    return auth_service.issue_session(user, workspace.id)


@router.post("/register/request-otp")
def request_registration_otp(req: RegisterOtpRequest, request: Request, db: Session = Depends(get_db)):
    _limit(request, "register-otp", 10, 3600)
    AuthService(db).request_registration_otp(req)
    return {"message": "A verification code has been sent to your email."}


@router.post("/register/resend-otp")
def resend_registration_otp(req: ResendRegisterOtpRequest, request: Request, db: Session = Depends(get_db)):
    _limit(request, "register-otp", 10, 3600)
    AuthService(db).resend_registration_otp(str(req.email))
    return {"message": "A new verification code has been sent to your email."}


@router.post("/register/verify-otp", response_model=Token)
def verify_registration_otp(req: VerifyRegisterOtpRequest, request: Request, db: Session = Depends(get_db)):
    _limit(request, "register-verify", 20, 900)
    auth_service = AuthService(db)
    user, workspace, _ = auth_service.verify_registration_otp(req)
    return auth_service.issue_session(user, workspace.id)


@router.post("/register/member", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_member(req: MemberRegisterRequest, request: Request, db: Session = Depends(get_db)):
    _limit(request, "register", 10, 3600)
    auth_service = AuthService(db)
    user, workspace, _ = auth_service.register_member(req)
    return auth_service.issue_session(user, workspace.id)


# ─── Sign-in ─────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    _limit(request, "login", 20, 300)
    _limit(request, "login-id", 8, 300, req.email.strip().lower())
    auth_service = AuthService(db)
    user = auth_service.authenticate(req)
    return auth_service.issue_session(user, req.workspace_slug)


@router.post("/google", response_model=Token)
def google_login(req: GoogleLoginRequest, request: Request, db: Session = Depends(get_db)):
    _limit(request, "google", 30, 300)
    auth_service = AuthService(db)
    user = auth_service.google_authenticate(req)
    return auth_service.issue_session(user, req.workspace_slug)


# ─── WhatsApp OTP ────────────────────────────────────────────────────────

@router.post("/otp/request", response_model=PhoneOtpRequestResponse)
def request_phone_otp(
    req: PhoneOtpRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    phone = require_phone(req.phone, req.country, "mobile")
    _limit(request, "otp-request", 10, 3600)
    if req.purpose == PURPOSE_LINK:
        raise HTTPException(status_code=400, detail="Use /auth/me/phone/request-otp to add a phone to your account.")
    result = PhoneOtpService(db).request(phone, PURPOSE_AUTH)
    return PhoneOtpRequestResponse(phone=phone, **result)


@router.post("/otp/verify", response_model=PhoneVerifyResponse)
def verify_phone_otp(req: PhoneOtpVerify, request: Request, db: Session = Depends(get_db)):
    phone = require_phone(req.phone, req.country, "mobile")
    _limit(request, "otp-verify", 30, 900)
    auth_service = AuthService(db)
    user, registration_token = auth_service.verify_phone_for_auth(phone, req.code)
    if user is not None:
        return PhoneVerifyResponse(status="authenticated", token=auth_service.issue_session(user), phone=phone)
    return PhoneVerifyResponse(status="registration_required", registration_token=registration_token, phone=phone)


@router.post("/signup/request-otps", response_model=SignupOtpsResponse)
def request_signup_otps(req: SignupOtpsRequest, request: Request, db: Session = Depends(get_db)):
    """Validates inputs and dispatches OTPs to both phone (WhatsApp) and email."""
    _limit(request, "signup-otps", 10, 3600)
    auth_service = AuthService(db)
    phone = require_phone(req.phone, req.country, "mobile")
    email = req.email.strip().lower()

    if auth_service.get_by_phone(phone):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This phone number already has an account. Please sign in.",
        )
    if auth_service.get_by_email(email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists. Please sign in.",
        )

    phone_res = PhoneOtpService(db).request(phone, PURPOSE_AUTH)
    email_res = EmailOtpService(db).request(email, PURPOSE_AUTH)

    return SignupOtpsResponse(
        phone=phone,
        email=email,
        phone_resend_in=phone_res["resend_in"],
        email_resend_in=email_res["resend_in"],
        phone_expires_in=phone_res["expires_in"],
        email_expires_in=email_res["expires_in"],
        test_mode=bool(phone_res.get("test_mode") or email_res.get("test_mode")),
    )


@router.post("/email-otp/request", response_model=EmailOtpRequestResponse)
def request_email_otp(req: EmailOtpRequest, request: Request, db: Session = Depends(get_db)):
    _limit(request, "email-otp-request", 10, 3600)
    result = EmailOtpService(db).request(req.email, req.purpose)
    return EmailOtpRequestResponse(email=req.email, **result)


@router.post("/email-otp/verify")
def verify_email_otp(req: EmailOtpVerify, request: Request, db: Session = Depends(get_db)):
    _limit(request, "email-otp-verify", 30, 900)
    EmailOtpService(db).verify(req.email, "auth", req.code)
    return {"status": "verified", "email": req.email}


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest, request: Request, db: Session = Depends(get_db)):
    """Creates an account with dual phone+email verification or legacy verified phone token."""
    _limit(request, "signup", 10, 3600)
    auth_service = AuthService(db)
    user = auth_service.signup_user(req)
    return auth_service.issue_session(user)


# ─── Current user ────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    tenant: TenantContext = Depends(get_current_tenant),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response, _, _ = AuthService(db).describe_user(user, tenant.workspace_id or None)
    return response


@router.get("/session", response_model=Token)
def refresh_session(
    workspace: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Re-issues a token scoped to `workspace` (id or slug) or to the user's default workspace."""
    return AuthService(db).issue_session(user, workspace)


@router.put("/me", response_model=UserResponse)
def update_profile(
    req: ProfileUpdate,
    tenant: TenantContext = Depends(get_current_tenant),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.full_name is not None:
        user.full_name = " ".join(req.full_name.split())
    if req.preferred_language is not None:
        lang = req.preferred_language.lower().strip()
        user.preferred_language = lang if lang in VALID_LANGUAGES else "en"
    db.commit()
    response, _, _ = AuthService(db).describe_user(user, tenant.workspace_id or None)
    return response


class LanguageUpdateRequest(BaseModel):
    language: str


@router.put("/me/language")
def update_user_language(
    req: LanguageUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lang = req.language.lower().strip()
    if lang not in VALID_LANGUAGES:
        lang = "en"
    user.preferred_language = lang
    db.commit()
    return {"status": "success", "language": lang}


@router.get("/me/identities", response_model=IdentitySummary)
def get_identities(user: User = Depends(get_current_user)):
    google = next((i for i in user.identities if i.provider == "google"), None)
    return IdentitySummary(
        email=user.email,
        email_verified=bool(user.email_verified),
        has_password=has_usable_password(user),
        phone=user.phone_e164,
        phone_verified=bool(user.phone_verified),
        google_linked=google is not None,
        google_email=google.email if google else None,
    )


@router.post("/me/identities/google", response_model=IdentitySummary)
def link_google(req: GoogleLoginRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    AuthService(db).link_google(user, req.token)
    db.refresh(user)
    return get_identities(user)


@router.delete("/me/identities/google", response_model=IdentitySummary)
def unlink_google(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    AuthService(db).unlink_google(user)
    db.refresh(user)
    return get_identities(user)


@router.post("/me/phone/request-otp", response_model=PhoneOtpRequestResponse)
def request_link_phone_otp(
    req: PhoneOtpRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    phone = require_phone(req.phone, req.country, "mobile")
    _limit(request, "otp-request", 10, 3600)
    existing = db.query(User).filter(User.phone_e164 == phone, User.id != user.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="This phone number is already used by another account.")
    result = PhoneOtpService(db).request(phone, PURPOSE_LINK)
    return PhoneOtpRequestResponse(phone=phone, **result)


@router.post("/me/phone/verify", response_model=IdentitySummary)
def verify_link_phone(
    req: PhoneOtpVerify,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    phone = require_phone(req.phone, req.country, "mobile")
    _limit(request, "otp-verify", 30, 900)
    AuthService(db).link_phone(user, phone, req.code)
    db.refresh(user)
    return get_identities(user)


@router.put("/me/password")
def change_password(req: PasswordChange, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    AuthService(db).change_password(user, req.current_password, req.new_password)
    return {"status": "success", "message": "Your password has been updated."}


# ─── Password recovery ───────────────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(req: PasswordResetRequest, request: Request, db: Session = Depends(get_db)):
    _limit(request, "forgot", 5, 900)
    AuthService(db).request_password_reset(str(req.email))
    return {"message": "If an account exists for that email, a reset link has been sent."}


@router.post("/reset-password", response_model=Token)
def reset_password(req: PasswordResetConfirm, request: Request, db: Session = Depends(get_db)):
    _limit(request, "reset", 10, 900)
    auth_service = AuthService(db)
    user = auth_service.reset_password(req.token, req.new_password)
    return auth_service.issue_session(user)


@router.post("/logout")
def logout():
    # Tokens are stateless JWTs; the client discards its copy.
    return {"status": "success", "message": "Successfully logged out"}


@router.get("/check-availability")
def check_availability(
    request: Request,
    email: str = None,
    phone: str = None,
    slug: str = None,
    country: str = None,
    db: Session = Depends(get_db),
):
    """Read-only availability checks for sign-up forms."""
    _limit(request, "availability", 60, 300)
    email_exists = phone_exists = slug_exists = False

    if slug and slug.strip():
        clean_slug = slug.strip().lower()
        slug_exists = clean_slug in RESERVED_SLUGS or bool(
            db.query(Workspace.id).filter(func.lower(Workspace.slug) == clean_slug).first()
        )

    if email and email.strip():
        email_exists = bool(
            db.query(User.id).filter(func.lower(User.email) == email.strip().lower()).first()
        )

    if phone and phone.strip():
        normalized = normalize_phone(phone, country or "IN")
        if normalized:
            phone_exists = bool(db.query(User.id).filter(User.phone_e164 == normalized).first())

    return {
        "email_exists": email_exists,
        "phone_exists": phone_exists,
        "slug_exists": slug_exists,
        "email_message": "Email is already registered" if email_exists else None,
        "phone_message": "Mobile number is already registered" if phone_exists else None,
        "slug_message": "Workspace URL is already taken" if slug_exists else None,
    }
