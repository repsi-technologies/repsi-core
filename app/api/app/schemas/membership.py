import json
from typing import Optional, List, Literal
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.member import MemberStatus


class PlanAccessRules(BaseModel):
    """Checked at every check-in. Omit a field for no restriction."""
    branch_ids: Optional[List[str]] = None
    weekdays: Optional[List[int]] = Field(default=None, description="0 = Monday … 6 = Sunday")
    start_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    end_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    max_visits_per_week: Optional[int] = Field(default=None, ge=1, le=50)

    @field_validator("weekdays")
    @classmethod
    def _weekdays(cls, v):
        if v is not None and any(d < 0 or d > 6 for d in v):
            raise ValueError("weekdays must be between 0 (Monday) and 6 (Sunday)")
        return v


class MembershipPlanCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: Optional[str] = None
    duration_months: int = Field(default=1, ge=1, le=60)
    price: float = Field(ge=0)
    features: Optional[str] = None
    access_rules: Optional[PlanAccessRules] = None
    class_credits: Optional[int] = Field(default=None, ge=0, le=1000)
    guest_passes: Optional[int] = Field(default=None, ge=0, le=100)


class MembershipPlanUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    description: Optional[str] = None
    duration_months: Optional[int] = Field(default=None, ge=1, le=60)
    price: Optional[float] = Field(default=None, ge=0)
    features: Optional[str] = None
    is_active: Optional[bool] = None
    access_rules: Optional[PlanAccessRules] = None
    class_credits: Optional[int] = Field(default=None, ge=0, le=1000)
    guest_passes: Optional[int] = Field(default=None, ge=0, le=100)


class MembershipPlanResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    duration_months: int
    price: float
    features: Optional[str] = None
    is_active: bool
    access_rules: Optional[dict] = None
    class_credits: Optional[int] = None
    guest_passes: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("access_rules", mode="before")
    @classmethod
    def _parse_rules(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v) or None
            except ValueError:
                return None
        return v


class MembershipCreate(BaseModel):
    member_id: str
    plan_id: str
    start_date: date
    price_paid: Optional[float] = Field(default=None, ge=0)  # defaults to the plan price (after any coupon)
    auto_renew: bool = False
    coupon_code: Optional[str] = Field(default=None, max_length=40)


class MembershipResponse(BaseModel):
    id: str
    workspace_id: str
    member_id: str
    plan_id: str
    start_date: date
    end_date: date
    status: MemberStatus
    price_paid: float
    auto_renew: bool

    model_config = ConfigDict(from_attributes=True)


class ExpiringMembershipItem(BaseModel):
    membership_id: str
    member_id: str
    member_name: str
    phone: str
    email: str
    plan_name: str
    start_date: date
    end_date: date
    days_remaining: int
    status: MemberStatus
    price_paid: float


class RenewalReminderItem(BaseModel):
    member_id: str
    member_name: str
    phone: str
    email: str
    plan_name: str
    expiry_date: date
    days_remaining: int
    amount_due: float
    message_template: str
    whatsapp_url: str


class MembershipFreezeRequest(BaseModel):
    start_date: date
    end_date: date
    reason: Optional[str] = Field(None, max_length=1000)


class MembershipExtendRequest(BaseModel):
    days: int = Field(..., ge=1)
    reason: str = Field(..., min_length=1, max_length=1000)


class MembershipCancelRequest(BaseModel):
    reason: str = Field(..., min_length=1, max_length=1000)


class MembershipRenewRequest(BaseModel):
    plan_id: Optional[str] = None  # defaults to the current plan
    mode: Literal["after_current", "immediate"] = "after_current"
    price: Optional[float] = Field(None, ge=0)


class MembershipEventResponse(BaseModel):
    id: str
    event_type: str
    actor_user_id: Optional[str] = None
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    previous_end_date: Optional[date] = None
    new_end_date: Optional[date] = None
    reason: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MembershipFreezeResponse(BaseModel):
    id: str
    start_date: date
    end_date: date
    reason: Optional[str] = None
    resumed_at: Optional[datetime] = None
    days_frozen: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class MembershipDetailResponse(BaseModel):
    id: str
    member_id: str
    plan_id: str
    plan_name: Optional[str] = None
    start_date: date
    end_date: date
    status: MemberStatus
    effective_status: str
    price_paid: float
    amount_paid: float
    balance_due: float
    payment_status: str  # unpaid | partial | paid
    auto_renew: bool
    freeze_days_used: int
    freeze_days_remaining: int
    freezes: List[MembershipFreezeResponse] = []
    events: List[MembershipEventResponse] = []
