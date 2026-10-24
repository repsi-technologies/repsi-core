"""Schemas for business profile, preferences, branches, team and onboarding."""
import json
import re
import zoneinfo
from datetime import date
from functools import lru_cache
from typing import Literal, Optional

import phonenumbers
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.core.i18n import normalize_language

DAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
_TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
_SLUG_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$")


@lru_cache
def _timezones() -> frozenset[str]:
    return frozenset(zoneinfo.available_timezones())


def _country(value: Optional[str]) -> Optional[str]:
    if value is None or value == "":
        return None
    value = value.strip().upper()
    if value not in phonenumbers.SUPPORTED_REGIONS:
        raise ValueError("Select a valid country.")
    return value


def _clean(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    value = " ".join(value.split())
    return value or None


class DayHours(BaseModel):
    closed: bool = False
    open: Optional[str] = None
    close: Optional[str] = None

    @model_validator(mode="after")
    def _check(self) -> "DayHours":
        if self.closed:
            self.open = None
            self.close = None
            return self
        if not self.open or not self.close or not _TIME_RE.match(self.open) or not _TIME_RE.match(self.close):
            raise ValueError("Opening and closing times must be in HH:MM format.")
        if self.open >= self.close:
            raise ValueError("Closing time must be after opening time.")
        return self


class OpeningHours(BaseModel):
    mon: DayHours
    tue: DayHours
    wed: DayHours
    thu: DayHours
    fri: DayHours
    sat: DayHours
    sun: DayHours

    def to_json(self) -> str:
        return json.dumps(self.model_dump(), separators=(",", ":"))


class ClosedDate(BaseModel):
    date: date
    label: str = Field(default="Closed", max_length=80)


def parse_hours(raw: Optional[str]) -> Optional[dict]:
    if not raw:
        return None
    try:
        return OpeningHours.model_validate(json.loads(raw)).model_dump()
    except Exception:
        return None


def parse_closed_dates(raw: Optional[str]) -> list[dict]:
    if not raw:
        return []
    try:
        return [ClosedDate.model_validate(d).model_dump(mode="json") for d in json.loads(raw)]
    except Exception:
        return []


# ─── Business profile ─────────────────────────────────────────────────

class BusinessProfileIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: Optional[str] = Field(default=None, max_length=60)
    business_email: Optional[EmailStr] = None
    phone: str = Field(min_length=4, max_length=32)
    phone_country: Optional[str] = Field(default=None, max_length=2)
    gym_type: Optional[str] = Field(default=None, max_length=100)
    business_types: list[str] = Field(default_factory=list, max_length=10)
    business_size: Optional[str] = Field(default=None, max_length=100)
    address_line1: str = Field(min_length=3, max_length=255)
    address_line2: Optional[str] = Field(default=None, max_length=255)
    city: str = Field(min_length=2, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    country_code: str = Field(min_length=2, max_length=2)
    country: Optional[str] = Field(default=None, max_length=100)  # display name from the client

    _strip = field_validator("name", "country", "address_line1", "address_line2", "city", "state", "gym_type", "business_size")(_clean)
    _cc = field_validator("country_code", "phone_country")(_country)

    @field_validator("slug")
    @classmethod
    def _slug(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v.strip():
            return None
        v = v.strip().lower()
        if not _SLUG_RE.match(v):
            raise ValueError("Workspace URL may use 3-60 lowercase letters, numbers and hyphens.")
        return v

    @field_validator("postal_code")
    @classmethod
    def _postal(cls, v: Optional[str]) -> Optional[str]:
        v = _clean(v)
        if v and not re.match(r"^[A-Za-z0-9][A-Za-z0-9 -]{1,18}$", v):
            raise ValueError("Enter a valid postal code.")
        return v

    @field_validator("business_types")
    @classmethod
    def _types(cls, v: list[str]) -> list[str]:
        out = []
        for item in v:
            item = _clean(item)
            if item and item not in out:
                out.append(item[:60])
        return out


class PreferencesIn(BaseModel):
    timezone: str
    currency: str = Field(min_length=3, max_length=3)
    locale: str = Field(default="en-IN", max_length=16)
    # Omitted -> unchanged. Members without their own preference see and receive this language.
    default_language: Optional[str] = Field(default=None, max_length=10)
    opening_hours: OpeningHours
    closed_dates: list[ClosedDate] = Field(default_factory=list, max_length=100)

    @field_validator("timezone")
    @classmethod
    def _tz(cls, v: str) -> str:
        if v not in _timezones():
            raise ValueError("Select a valid time zone.")
        return v

    @field_validator("currency")
    @classmethod
    def _cur(cls, v: str) -> str:
        v = v.strip().upper()
        if not re.match(r"^[A-Z]{3}$", v):
            raise ValueError("Select a valid currency.")
        return v

    @field_validator("locale")
    @classmethod
    def _loc(cls, v: str) -> str:
        if not re.match(r"^[a-z]{2,3}(-[A-Z]{2})?$", v.strip()):
            raise ValueError("Select a valid language/region.")
        return v.strip()

    @field_validator("default_language")
    @classmethod
    def _lang(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        lang = normalize_language(v)
        if not lang:
            raise ValueError("Select a supported language.")
        return lang

    @field_validator("closed_dates")
    @classmethod
    def _dedupe(cls, v: list[ClosedDate]) -> list[ClosedDate]:
        seen, out = set(), []
        for d in sorted(v, key=lambda x: x.date):
            if d.date not in seen:
                seen.add(d.date)
                out.append(d)
        return out


class OrganizationProfileOut(BaseModel):
    id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    business_email: Optional[str] = None
    phone: Optional[str] = None
    gym_type: Optional[str] = None
    business_types: list[str] = []
    business_size: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country_code: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    locale: Optional[str] = None
    default_language: str = "en"
    opening_hours: Optional[dict] = None
    closed_dates: list[dict] = []
    onboarding_completed: bool = False
    onboarding_step: int = 1
    can_edit: bool = False
    can_rename: bool = True
    rename_message: Optional[str] = None


# ─── Branches ─────────────────────────────────────────────────────────

class BranchIn(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    code: Optional[str] = Field(default=None, max_length=50)
    address_line1: Optional[str] = Field(default=None, max_length=255)
    address_line2: Optional[str] = Field(default=None, max_length=255)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    country_code: Optional[str] = Field(default=None, max_length=2)
    phone: Optional[str] = Field(default=None, max_length=32)
    phone_country: Optional[str] = Field(default=None, max_length=2)
    email: Optional[EmailStr] = None
    timezone: Optional[str] = None
    opening_hours: Optional[OpeningHours] = None  # None = use business hours
    is_primary: bool = False

    _strip = field_validator("name", "address_line1", "address_line2", "city", "state", "postal_code")(_clean)
    _cc = field_validator("country_code", "phone_country")(_country)

    @field_validator("code")
    @classmethod
    def _code(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v.strip():
            return None
        v = re.sub(r"[^A-Z0-9-]+", "-", v.strip().upper()).strip("-")
        if len(v) < 2:
            raise ValueError("Branch code must have at least 2 letters or numbers.")
        return v[:50]

    @field_validator("timezone")
    @classmethod
    def _tz(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in _timezones():
            raise ValueError("Select a valid time zone.")
        return v or None


class BranchOut(BaseModel):
    id: str
    name: str
    code: str
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    timezone: Optional[str] = None
    opening_hours: Optional[dict] = None
    is_primary: bool = False
    is_active: bool = True
    member_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# ─── Team ─────────────────────────────────────────────────────────────

TeamRole = Literal["ADMIN", "MANAGER", "STAFF", "TRAINER", "USER"]


class TeamMemberOut(BaseModel):
    id: str  # workspace_members.id
    user_id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    branch_ids: list[str] = []
    all_branches: bool = True
    is_self: bool = False
    joined_at: Optional[str] = None


class TeamMemberUpdate(BaseModel):
    role: Optional[TeamRole] = None
    branch_ids: Optional[list[str]] = Field(default=None, max_length=200)
    is_active: Optional[bool] = None


class OnboardingState(BaseModel):
    has_workspace: bool
    workspace_id: Optional[str] = None
    workspace_slug: Optional[str] = None
    onboarding_completed: bool = False
    current_step: str
    steps: dict[str, bool]
    profile: Optional[OrganizationProfileOut] = None
    branches: list[BranchOut] = []
    user: dict
