"""
Authentication and canonical identity resolution.

Every sign-in method (password, Google, WhatsApp OTP, invitation acceptance) ends in
`AuthService.issue_session(user)`, so the same person always gets the same user id,
memberships, role and next page regardless of how they signed in.

Identity rules:
- Emails are normalized (trimmed, lower-cased) before every lookup and insert.
- A Google identity is keyed by Google's stable `sub`. On first Google sign-in it is linked
  to an existing account only when both sides have a verified email; otherwise the user
  must sign in with their existing method and link Google from their profile.
- A phone number becomes a sign-in identity (`phone_e164`) only after OTP verification.
- Owner-created Member/Trainer records are attached to an account only through a verified
  email or verified phone.
- Linking never overwrites an existing password, provider, or profile data.
"""
import hashlib
import logging
import re
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.email import send_password_reset_email, send_registration_otp
from app.core.phone import normalize_phone
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.auth import AuthIdentity, PasswordResetToken, PendingRegistration
from app.models.member import Member
from app.models.trainer import Trainer
from app.models.user import User, UserRole, Workspace, WorkspaceMember
from app.schemas.auth import (
    GoogleLoginRequest,
    LoginRequest,
    MemberRegisterRequest,
    RegisterRequest,
    SignupRequest,
    Token,
    UserResponse,
    VerifyRegisterOtpRequest,
)
from app.services.otp import PURPOSE_AUTH, PURPOSE_LINK, PhoneOtpService

logger = logging.getLogger(__name__)

# Stored in users.hashed_password for accounts that have no password yet (e.g. Google-only).
# It is not a bcrypt hash, so verify_password() always rejects it.
UNUSABLE_PASSWORD = "!unusable"
GOOGLE = "google"
SIGNUP_TOKEN_PURPOSE = "phone_signup"
SIGNUP_TOKEN_MINUTES = 20

ROLE_PRIORITY = {
    UserRole.OWNER: 0,
    UserRole.ADMIN: 1,
    UserRole.MANAGER: 2,
    UserRole.STAFF: 3,
    UserRole.TRAINER: 4,
    UserRole.USER: 5,
}


def normalize_email(email: str) -> str:
    return str(email).strip().lower()


def has_usable_password(user: User) -> bool:
    return bool(user.hashed_password) and user.hashed_password.startswith("$2")


def role_home_path(slug: str, role: str) -> str:
    role = (role or "").upper()
    if role == "TRAINER":
        return f"/{slug}/trainer/dashboard"
    if role in ("USER", "MEMBER"):
        return f"/{slug}/member/dashboard"
    return f"/{slug}/dashboard"


@dataclass
class GoogleProfile:
    subject: str
    email: str
    email_verified: bool
    name: str | None


def verify_google_access_token(access_token: str) -> GoogleProfile:
    """
    Validates a Google OAuth access token server-side and checks it was issued to
    our client (aud/azp == GOOGLE_CLIENT_ID). Tokens minted for other apps are rejected.
    """
    invalid = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google sign-in could not be verified.")
    try:
        resp = httpx.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"access_token": access_token},
            timeout=10,
        )
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="Google sign-in is temporarily unavailable.")
    if resp.status_code != 200:
        raise invalid
    info = resp.json()

    audience = info.get("aud") or info.get("azp")
    if settings.GOOGLE_CLIENT_ID:
        if audience != settings.GOOGLE_CLIENT_ID:
            raise invalid
    elif settings.is_production:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured.")
    else:
        logger.warning("GOOGLE_CLIENT_ID is not set; Google token audience is not being checked (development only).")

    subject = info.get("sub")
    email = info.get("email")
    if not subject or not email:
        raise invalid
    email_verified = str(info.get("email_verified", "")).lower() == "true"

    name = None
    try:
        profile = httpx.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        if profile.status_code == 200:
            name = profile.json().get("name")
    except httpx.HTTPError:
        pass
    return GoogleProfile(subject=subject, email=normalize_email(email), email_verified=email_verified, name=name)


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    # ─── Session issuance (single exit point for every sign-in method) ─────

    def _active_memberships(self, user: User) -> list[WorkspaceMember]:
        return (
            self.db.query(WorkspaceMember)
            .join(Workspace, Workspace.id == WorkspaceMember.workspace_id)
            .filter(
                WorkspaceMember.user_id == user.id,
                WorkspaceMember.is_active == True,
                Workspace.is_active == True,
            )
            .all()
        )

    def select_membership(self, user: User, workspace_hint: str | None = None) -> WorkspaceMember | None:
        memberships = self._active_memberships(user)
        if not memberships:
            return None
        if workspace_hint:
            for m in memberships:
                if workspace_hint in (m.workspace_id, m.workspace.slug):
                    return m
        return sorted(
            memberships,
            key=lambda m: (ROLE_PRIORITY.get(m.role, 9), m.created_at or datetime.min),
        )[0]

    def describe_user(self, user: User, workspace_hint: str | None = None) -> tuple[UserResponse, str, bool]:
        membership = self.select_membership(user, workspace_hint)
        workspace = membership.workspace if membership else None
        if user.is_superadmin:
            role = "SUPER_ADMIN"
        else:
            role = membership.role.value if membership else "USER"

        onboarding_required = False
        if user.is_superadmin:
            next_path = "/superadmin/dashboard"
        elif membership is None:
            onboarding_required = True
            next_path = "/onboarding"
        elif membership.role == UserRole.OWNER and not workspace.onboarding_completed:
            onboarding_required = True
            next_path = "/onboarding"
        else:
            next_path = role_home_path(workspace.slug, role)

        response = UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone_e164 or user.phone,
            is_superadmin=user.is_superadmin,
            is_active=user.is_active,
            role=role,
            workspace_id=workspace.id if workspace else None,
            workspace_slug=workspace.slug if workspace else None,
            gym_name=workspace.name if workspace else None,
            preferred_language=getattr(user, "preferred_language", "en") or "en",
            email_verified=bool(user.email_verified),
            phone_verified=bool(user.phone_verified),
            onboarding_required=onboarding_required,
        )
        return response, next_path, onboarding_required

    def issue_session(self, user: User, workspace_hint: str | None = None) -> Token:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated.")
        user_response, next_path, onboarding_required = self.describe_user(user, workspace_hint)
        token = create_access_token(
            subject=user.id, workspace_id=user_response.workspace_id, role=user_response.role
        )
        return Token(
            access_token=token,
            workspace_id=user_response.workspace_id,
            workspace_slug=user_response.workspace_slug,
            gym_name=user_response.gym_name,
            role=user_response.role,
            user=user_response,
            next_path=next_path,
            onboarding_required=onboarding_required,
        )

    # ─── Lookups ───────────────────────────────────────────────────────────

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(func.lower(User.email) == normalize_email(email)).first()

    def get_by_phone(self, phone_e164: str) -> User | None:
        return self.db.query(User).filter(User.phone_e164 == phone_e164).first()

    # ─── Password sign-in ──────────────────────────────────────────────────

    def authenticate(self, req: LoginRequest) -> User:
        identifier = req.email.strip()
        invalid = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email, phone or password."
        )
        user: User | None
        if "@" in identifier:
            user = self.get_by_email(identifier)
        else:
            phone = normalize_phone(identifier, req.country or "IN")
            user = self.get_by_phone(phone) if phone else None
            if user is None:
                # Legacy accounts stored the raw phone string before phone_e164 existed.
                user = self.db.query(User).filter(User.phone == identifier).first()

        if user is None or not verify_password(req.password, user.hashed_password):
            # Accounts without a password (e.g. Google-only) intentionally fail here.
            raise invalid
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated.")

        self.attach_verified_records(user)
        self.db.commit()
        return user

    # ─── Google ────────────────────────────────────────────────────────────

    def google_authenticate(self, req: GoogleLoginRequest) -> User:
        profile = verify_google_access_token(req.token)
        identity = (
            self.db.query(AuthIdentity)
            .filter(AuthIdentity.provider == GOOGLE, AuthIdentity.provider_subject == profile.subject)
            .first()
        )
        if identity:
            user = identity.user
            identity.last_used_at = datetime.now(timezone.utc)
        else:
            if not profile.email_verified:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Your Google account email is not verified.",
                )
            user = self.get_by_email(profile.email)
            if user is None:
                user = User(
                    email=profile.email,
                    full_name=(profile.name or profile.email.split("@")[0]).strip()[:255],
                    hashed_password=UNUSABLE_PASSWORD,
                    email_verified=True,
                    is_active=True,
                )
                self.db.add(user)
                self.db.flush()
            elif any(i.provider == GOOGLE for i in user.identities):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This account is linked to a different Google account. Sign in with that one or with your password.",
                )
            elif not user.email_verified:
                # Never merge into an account whose email ownership was never proven.
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "An account with this email already exists but its email isn't verified yet. "
                        "Sign in with your password or WhatsApp code, then connect Google from Profile."
                    ),
                )
            self.db.add(
                AuthIdentity(
                    user_id=user.id,
                    provider=GOOGLE,
                    provider_subject=profile.subject,
                    email=profile.email,
                    last_used_at=datetime.now(timezone.utc),
                )
            )

        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated.")
        self.attach_verified_records(user)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=409, detail="This Google account is already linked to another user.")
        self.db.refresh(user)
        return user

    def link_google(self, user: User, access_token: str) -> None:
        profile = verify_google_access_token(access_token)
        existing = (
            self.db.query(AuthIdentity)
            .filter(AuthIdentity.provider == GOOGLE, AuthIdentity.provider_subject == profile.subject)
            .first()
        )
        if existing and existing.user_id != user.id:
            raise HTTPException(status_code=409, detail="This Google account is already linked to another REPSI account.")
        if existing:
            return
        if any(i.provider == GOOGLE for i in user.identities):
            raise HTTPException(status_code=409, detail="A Google account is already connected. Disconnect it first.")
        if not profile.email_verified or profile.email != normalize_email(user.email):
            raise HTTPException(
                status_code=409,
                detail="Connect the Google account that uses the same email address as your REPSI account.",
            )
        self.db.add(
            AuthIdentity(user_id=user.id, provider=GOOGLE, provider_subject=profile.subject, email=profile.email)
        )
        # Google has just proven ownership of this exact email address.
        user.email_verified = True
        self.attach_verified_records(user)
        self.db.commit()

    def unlink_google(self, user: User) -> None:
        identity = next((i for i in user.identities if i.provider == GOOGLE), None)
        if identity is None:
            raise HTTPException(status_code=404, detail="No Google account is connected.")
        if not has_usable_password(user) and not (user.phone_verified and user.phone_e164):
            raise HTTPException(
                status_code=400,
                detail="Set a password or verify a phone number before disconnecting Google, so you can still sign in.",
            )
        self.db.delete(identity)
        self.db.commit()

    # ─── WhatsApp OTP sign-in / sign-up ───────────────────────────────────

    def verify_phone_for_auth(self, phone_e164: str, code: str) -> tuple[User | None, str | None]:
        """Returns (user, None) for an existing account or (None, registration_token)."""
        PhoneOtpService(self.db).verify(phone_e164, PURPOSE_AUTH, code)
        user = self.get_by_phone(phone_e164)
        if user is not None:
            if not user.is_active:
                self.db.commit()
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated.")
            user.phone_verified = True
            self.attach_verified_records(user)
            self.db.commit()
            return user, None
        self.db.commit()
        return None, self._make_signup_token(phone_e164)

    @staticmethod
    def _make_signup_token(phone_e164: str) -> str:
        payload = {
            "purpose": SIGNUP_TOKEN_PURPOSE,
            "phone": phone_e164,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=SIGNUP_TOKEN_MINUTES),
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def _read_signup_token(token: str) -> str:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        except JWTError:
            payload = {}
        if payload.get("purpose") != SIGNUP_TOKEN_PURPOSE or not payload.get("phone") or payload.get("sub"):
            raise HTTPException(
                status_code=400,
                detail="Your phone verification has expired. Please verify your number again.",
            )
        return payload["phone"]

    def signup_with_verified_phone(self, req: SignupRequest) -> User:
        phone = self._read_signup_token(req.registration_token)
        email = normalize_email(req.email)
        if self.get_by_phone(phone):
            raise HTTPException(status_code=409, detail="This phone number already has an account. Please sign in.")
        if self.get_by_email(email):
            raise HTTPException(
                status_code=409,
                detail=(
                    "An account with this email already exists. Sign in to that account and add this "
                    "phone number from Profile → Sign-in methods."
                ),
            )
        user = User(
            email=email,
            full_name=req.full_name,
            hashed_password=get_password_hash(req.password),
            phone=phone,
            phone_e164=phone,
            phone_verified=True,
            email_verified=False,
            is_active=True,
        )
        self.db.add(user)
        try:
            self.db.flush()
            self.attach_verified_records(user)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=409, detail="An account with these details already exists. Please sign in.")
        self.db.refresh(user)
        return user

    def link_phone(self, user: User, phone_e164: str, code: str) -> None:
        PhoneOtpService(self.db).verify(phone_e164, PURPOSE_LINK, code)
        owner = self.get_by_phone(phone_e164)
        if owner and owner.id != user.id:
            self.db.commit()
            raise HTTPException(status_code=409, detail="This phone number is already used by another account.")
        user.phone_e164 = phone_e164
        user.phone = phone_e164
        user.phone_verified = True
        self.attach_verified_records(user)
        self.db.commit()

    # ─── Password recovery / management ───────────────────────────────────

    def request_password_reset(self, email: str) -> None:
        user = self.get_by_email(email)
        if user is None or not user.is_active:
            return  # Same response either way; no account enumeration.
        raw = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)
        self.db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None)
        ).update({"used_at": now}, synchronize_session=False)
        self.db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=hashlib.sha256(raw.encode()).hexdigest(),
                expires_at=now + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES),
            )
        )
        self.db.commit()
        reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={raw}"
        send_password_reset_email(user.email, user.full_name, reset_url)

    def reset_password(self, raw_token: str, new_password: str) -> User:
        token_hash = hashlib.sha256(raw_token.strip().encode()).hexdigest()
        record = self.db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == token_hash).first()
        invalid = HTTPException(status_code=400, detail="This reset link is invalid or has expired.")
        if record is None or record.used_at is not None:
            raise invalid
        expires = record.expires_at if record.expires_at.tzinfo else record.expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            raise invalid
        user = self.db.query(User).filter(User.id == record.user_id).first()
        if user is None or not user.is_active:
            raise invalid
        user.hashed_password = get_password_hash(new_password)
        # The reset link was delivered to this inbox, which proves email ownership.
        user.email_verified = True
        record.used_at = datetime.now(timezone.utc)
        self.attach_verified_records(user)
        self.db.commit()
        return user

    def change_password(self, user: User, current_password: str | None, new_password: str) -> None:
        if has_usable_password(user):
            if not current_password or not verify_password(current_password, user.hashed_password):
                raise HTTPException(status_code=400, detail="Your current password is incorrect.")
        user.hashed_password = get_password_hash(new_password)
        self.db.commit()

    # ─── Owner-created Member / Trainer records ───────────────────────────

    def attach_verified_records(self, user: User) -> None:
        """
        Attach unclaimed Member/Trainer rows (created by gym staff) to this account, but
        only through identifiers this user has proven: a verified email or verified phone.
        Never downgrades an existing workspace role.
        """
        phone = user.phone_e164 if user.phone_verified else None

        def phone_matches(raw: str | None, country: str | None = None) -> bool:
            return bool(phone and raw and normalize_phone(raw, country or "IN") == phone)

        def candidates(model, email_col, phone_col):
            filters = []
            if user.email_verified and user.email:
                filters.append(func.lower(email_col) == normalize_email(user.email))
            if phone:
                filters.append(phone_col.like(f"%{phone[-8:]}%"))
            if not filters:
                return []
            rows = self.db.query(model).filter(model.user_id.is_(None), or_(*filters)).all()
            email_norm = normalize_email(user.email) if user.email_verified and user.email else None
            return [
                r for r in rows
                if (email_norm and (r.email or "").strip().lower() == email_norm) or phone_matches(getattr(r, "phone", None))
            ]

        for member in candidates(Member, Member.email, Member.phone):
            member.user_id = user.id
            self._ensure_membership(user, member.workspace_id, UserRole.USER)
        for trainer in candidates(Trainer, Trainer.email, Trainer.phone):
            trainer.user_id = user.id
            self._ensure_membership(user, trainer.workspace_id, UserRole.TRAINER)
        self.db.flush()

    def _ensure_membership(self, user: User, workspace_id: str, role: UserRole) -> WorkspaceMember:
        membership = (
            self.db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == user.id)
            .first()
        )
        if membership is None:
            membership = WorkspaceMember(workspace_id=workspace_id, user_id=user.id, role=role, is_active=True)
            self.db.add(membership)
            self.db.flush()
        elif ROLE_PRIORITY.get(role, 9) < ROLE_PRIORITY.get(membership.role, 9):
            # Only ever upgrade (e.g. USER -> TRAINER), never demote an OWNER/ADMIN.
            membership.role = role
        return membership

    # ─── Legacy registration endpoints ────────────────────────────────────

    def register(self, req: RegisterRequest) -> tuple[User, Workspace, str]:
        """
        Legacy owner registration (used by the mobile app and tests). It does not prove
        email ownership, so the account is created with email_verified=False and is never
        auto-linked to Google or to owner-created records by email.
        """
        normalized_email = normalize_email(req.email)
        if self.get_by_email(normalized_email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists.",
            )

        user = User(
            email=normalized_email,
            full_name=req.full_name,
            hashed_password=get_password_hash(req.password),
            phone=req.gym_phone,
            email_verified=False,
            is_active=True,
        )
        self.db.add(user)
        self.db.flush()

        workspace = Workspace(
            name=req.gym_name,
            slug=self.unique_slug(req.gym_name),
            phone=req.gym_phone,
            email=normalized_email,
            city=req.gym_city,
            is_active=True,
        )
        self.db.add(workspace)
        self.db.flush()
        self.db.add(
            WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role=UserRole.OWNER, is_active=True)
        )
        self.db.commit()
        self.db.refresh(user)
        self.db.refresh(workspace)

        from app.services.billing import BillingService
        BillingService.get_or_create_workspace_subscription(self.db, workspace.id)

        token = create_access_token(subject=user.id, workspace_id=workspace.id, role=UserRole.OWNER.value)
        return user, workspace, token

    def unique_slug(self, name: str, exclude_workspace_id: str | None = None) -> str:
        base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:60] or "gym"
        slug, counter = base, 1
        while True:
            q = self.db.query(Workspace).filter(func.lower(Workspace.slug) == slug)
            if exclude_workspace_id:
                q = q.filter(Workspace.id != exclude_workspace_id)
            if not q.first() and slug not in RESERVED_SLUGS:
                return slug
            slug = f"{base}-{counter}"
            counter += 1

    @staticmethod
    def _hash_otp(otp: str) -> str:
        return hashlib.sha256(otp.encode("utf-8")).hexdigest()

    def request_registration_otp(self, req: RegisterRequest) -> None:
        email = normalize_email(req.email)
        if self.get_by_email(email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists. Please sign in instead.",
            )

        now = datetime.now(timezone.utc)
        pending = self.db.query(PendingRegistration).filter(PendingRegistration.email == email).first()
        if pending and pending.last_sent_at:
            last_sent = pending.last_sent_at
            if last_sent.tzinfo is None:
                last_sent = last_sent.replace(tzinfo=timezone.utc)
            if (now - last_sent).total_seconds() < settings.OTP_RESEND_COOLDOWN_SECONDS:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Please wait before requesting another code.",
                )

        otp = f"{secrets.randbelow(1_000_000):06d}"
        if pending is None:
            pending = PendingRegistration(email=email)
            self.db.add(pending)
        pending.full_name = req.full_name.strip()
        pending.password_hash = get_password_hash(req.password)
        pending.gym_name = req.gym_name.strip()
        pending.gym_phone = req.gym_phone
        pending.gym_city = req.gym_city
        pending.otp_hash = self._hash_otp(otp)
        pending.otp_expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
        pending.last_sent_at = now
        pending.attempts = 0
        self.db.commit()
        try:
            send_registration_otp(email, otp)
        except Exception:
            self.db.delete(pending)
            self.db.commit()
            raise

    def verify_registration_otp(self, req: VerifyRegisterOtpRequest) -> tuple[User, Workspace, str]:
        email = normalize_email(req.email)
        pending = self.db.query(PendingRegistration).filter(PendingRegistration.email == email).first()
        if pending is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending verification was found for this email.",
            )
        if self.get_by_email(email):
            self.db.delete(pending)
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists.",
            )
        expires_at = pending.otp_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This verification code has expired.")
        if pending.attempts >= 5:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many incorrect attempts. Request a new code.",
            )
        if not secrets.compare_digest(pending.otp_hash, self._hash_otp(req.otp.strip())):
            pending.attempts += 1
            self.db.commit()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect verification code.")

        registration = RegisterRequest(
            full_name=pending.full_name,
            email=email,
            password="temporary-password-not-used",
            gym_name=pending.gym_name,
            gym_phone=pending.gym_phone,
            gym_city=pending.gym_city,
        )
        user, workspace, _ = self.register(registration)
        user.hashed_password = pending.password_hash
        user.email_verified = True  # proven by the emailed code
        self.db.delete(pending)
        self.db.commit()
        token = create_access_token(subject=user.id, workspace_id=workspace.id, role=UserRole.OWNER.value)
        return user, workspace, token

    def resend_registration_otp(self, email: str) -> None:
        normalized_email = normalize_email(email)
        pending = self.db.query(PendingRegistration).filter(PendingRegistration.email == normalized_email).first()
        if pending is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending verification was found for this email.",
            )
        now = datetime.now(timezone.utc)
        last_sent = pending.last_sent_at
        if last_sent.tzinfo is None:
            last_sent = last_sent.replace(tzinfo=timezone.utc)
        if (now - last_sent).total_seconds() < settings.OTP_RESEND_COOLDOWN_SECONDS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Please wait before requesting another code.",
            )
        otp = f"{secrets.randbelow(1_000_000):06d}"
        pending.otp_hash = self._hash_otp(otp)
        pending.otp_expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
        pending.last_sent_at = now
        pending.attempts = 0
        self.db.commit()
        try:
            send_registration_otp(normalized_email, otp)
        except Exception:
            self.db.rollback()
            raise

    def register_member(self, req: MemberRegisterRequest) -> tuple[User, Workspace, str]:
        normalized_email = normalize_email(req.email)
        if self.get_by_email(normalized_email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists.",
            )
        workspace = self.db.query(Workspace).filter(Workspace.slug == req.workspace_slug).first()
        if not workspace or not workspace.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gym workspace not found.")
        user = User(
            email=normalized_email,
            full_name=req.full_name,
            hashed_password=get_password_hash(req.password),
            phone=req.phone,
            email_verified=False,
            is_active=True,
        )
        self.db.add(user)
        self.db.flush()
        self.db.add(WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role=UserRole.USER, is_active=True))
        self.db.commit()
        self.db.refresh(user)
        token = create_access_token(subject=user.id, workspace_id=workspace.id, role=UserRole.USER.value)
        return user, workspace, token


RESERVED_SLUGS = {
    "api", "superadmin", "auth", "onboarding", "admin", "dashboard",
    "billing", "settings", "login", "register", "pricing", "help",
    "docs", "site", "features", "solutions", "contact", "about",
    "signup", "invite", "verify-email", "forgot-password", "reset-password",
}
