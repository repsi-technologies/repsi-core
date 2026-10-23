from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Channel = Literal["in_app", "email", "whatsapp"]
Segment = Literal[
    "all_members", "active_membership", "expiring_soon", "expired", "new_members",
    "selected_members", "trainers", "staff",
]


class Audience(BaseModel):
    segment: Segment
    member_ids: Optional[list[str]] = Field(None, max_length=1000)
    days: Optional[int] = Field(None, ge=1, le=365)


class BroadcastCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    message: str = Field(min_length=2, max_length=4000)
    channels: list[Channel] = Field(min_length=1, max_length=3)
    audience: Audience
    template_id: Optional[str] = None
    action_url: Optional[str] = Field(None, max_length=512, pattern=r"^/")


class AudiencePreview(BaseModel):
    recipient_count: int
    sample: list[str]
    with_app_account: int
    with_email: int
    with_phone: int


class BroadcastResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    message: str
    channels: list[str]
    audience: dict
    template_id: Optional[str] = None
    status: str
    recipient_count: int
    created_by: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    summary: dict[str, int] = {}
    by_channel: dict[str, dict[str, int]] = {}


class BroadcastListResponse(BaseModel):
    items: list[BroadcastResponse]
    total: int
    page: int
    page_size: int


class DeliveryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    broadcast_id: Optional[str] = None
    event_type: str
    channel: str
    member_id: Optional[str] = None
    recipient_name: Optional[str] = None
    destination: Optional[str] = None
    status: str
    provider: Optional[str] = None
    error: Optional[str] = None
    attempts: int
    created_at: datetime
    sent_at: Optional[datetime] = None


class DeliveryListResponse(BaseModel):
    items: list[DeliveryResponse]
    total: int
    page: int
    page_size: int


class TemplateCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    channel: Channel = "in_app"
    category: Literal["announcement", "reminder", "receipt", "welcome"] = "announcement"
    subject: Optional[str] = Field(None, max_length=255)
    body: str = Field(min_length=2, max_length=4000)
    provider_template_name: Optional[str] = Field(None, max_length=150, pattern=r"^[A-Za-z0-9_\-\s]+$")


class TemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    subject: Optional[str] = Field(None, max_length=255)
    body: Optional[str] = Field(None, min_length=2, max_length=4000)
    provider_template_name: Optional[str] = Field(None, max_length=150, pattern=r"^[A-Za-z0-9_\-\s]+$")
    is_active: Optional[bool] = None


class TemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    channel: str
    category: str
    subject: Optional[str] = None
    body: str
    provider_template_name: Optional[str] = None
    is_active: bool
    created_at: datetime


class PreferencesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    in_app_enabled: bool = True
    email_enabled: bool = True
    whatsapp_enabled: bool = False
    whatsapp_consent_at: Optional[datetime] = None
    announcements_enabled: bool = True


class PreferencesUpdate(BaseModel):
    in_app_enabled: Optional[bool] = None
    email_enabled: Optional[bool] = None
    whatsapp_enabled: Optional[bool] = None
    announcements_enabled: Optional[bool] = None
