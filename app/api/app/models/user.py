import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, Index
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    TRAINER = "TRAINER"
    STAFF = "STAFF"
    USER = "USER"


class Workspace(Base, TimestampMixin):
    __tablename__ = "workspaces"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    logo_url = Column(String(512), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), default="India")
    country_code = Column(String(2), nullable=True)  # ISO-3166 alpha-2, e.g. "IN"
    # Regional preferences (single source of truth for business settings)
    timezone = Column(String(64), nullable=True)  # IANA name, e.g. "Asia/Kolkata"
    currency = Column(String(3), nullable=True)  # ISO-4217, e.g. "INR"
    locale = Column(String(16), nullable=True)  # BCP-47, e.g. "en-IN"
    opening_hours = Column(Text, nullable=True)  # JSON: {"mon": {"closed": false, "open": "06:00", "close": "22:00"}, ...}
    closed_dates = Column(Text, nullable=True)  # JSON: [{"date": "2026-12-25", "label": "Christmas"}]
    gym_type = Column(String(100), default="Commercial Fitness")
    business_types = Column(Text, nullable=True)  # JSON or comma-separated: Gym, Yoga Studio, Pool, PT Studio
    business_size = Column(String(100), nullable=True)  # Just starting, Under 100, 100-500, etc.
    managed_features = Column(Text, nullable=True)  # JSON array of selected features
    management_method = Column(String(100), nullable=True)  # Notebook, Excel, Another software, etc.
    checkin_method = Column(String(100), default="QR Code")  # QR Code, Receptionist, Kiosk, Manual
    brand_color = Column(String(50), default="#000000")
    onboarding_completed = Column(Boolean, default=False, nullable=False)
    onboarding_step = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    # Sales demo gym: messages are recorded but never sent, and account/billing changes are refused (app/core/demo.py).
    is_demo = Column(Boolean, default=False, nullable=False)
    last_name_changed_at = Column(DateTime, nullable=True)
    name_change_count = Column(Integer, default=0, nullable=False)

    # Relationships
    memberships = relationship(
        "WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan"
    )


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    # Canonical, verified-only phone identity used for WhatsApp OTP sign-in
    phone_e164 = Column(String(20), unique=True, nullable=True, index=True)
    phone_verified = Column(Boolean, default=False, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    avatar_url = Column(String(512), nullable=True)
    is_superadmin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    preferred_language = Column(String(10), default="en", nullable=False)

    # Relationships
    workspaces = relationship(
        "WorkspaceMember", back_populates="user", cascade="all, delete-orphan"
    )
    identities = relationship(
        "AuthIdentity", back_populates="user", cascade="all, delete-orphan"
    )


class WorkspaceMember(Base, TimestampMixin):
    __tablename__ = "workspace_members"
    __table_args__ = (
        Index("ix_workspace_members_ws_role_active", "workspace_id", "role", "is_active"),
    )

    id = Column(String(64), primary_key=True, default=generate_uuid)
    workspace_id = Column(
        String(64),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        String(64),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(Enum(UserRole), default=UserRole.STAFF, nullable=False)
    permissions = Column(
        Text, nullable=True
    )  # Comma-separated or JSON list of granular permissions
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="memberships")
    user = relationship("User", back_populates="workspaces")

    __table_args__ = (
        UniqueConstraint("workspace_id", "user_id", name="uq_workspace_user"),
    )
