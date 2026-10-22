from typing import Optional, List, Literal
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.member import MemberStatus


class MembershipPlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_months: int = 1
    price: float
    features: Optional[str] = None


class MembershipPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_months: Optional[int] = None
    price: Optional[float] = None
    features: Optional[str] = None
    is_active: Optional[bool] = None


class MembershipPlanResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    duration_months: int
    price: float
    features: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class MembershipCreate(BaseModel):
    member_id: str
    plan_id: str
    start_date: date
    price_paid: float
    auto_renew: bool = False


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
