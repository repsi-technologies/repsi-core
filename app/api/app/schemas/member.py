from typing import Optional, List, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from app.models.member import MemberStatus


class MemberCreate(BaseModel):
    first_name: str
    last_name: Optional[str] = ""
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    avatar_url: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    emergency_contact: Optional[str] = None
    plan_id: Optional[str] = None
    plan_name: Optional[str] = None
    start_date: Optional[date] = None
    trainer_id: Optional[str] = None
    notes: Optional[str] = None
    use_existing_user: Optional[bool] = False


class MemberUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    emergency_contact: Optional[str] = None
    status: Optional[MemberStatus] = None
    trainer_id: Optional[str] = None
    notes: Optional[str] = None
    user_id: Optional[str] = None


class MemberResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: Optional[str] = None
    first_name: str
    last_name: Optional[str] = ""
    email: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    status: MemberStatus
    repsi_access: str
    joined_date: date
    trainer_id: Optional[str] = None
    gender: Optional[str] = None
    emergency_contact: Optional[str] = None
    plan_name: Optional[str] = "Monthly"
    membership_end_date: Optional[date] = None
    date_of_birth: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)


class MemberListResponse(BaseModel):
    items: List[MemberResponse]
    total: int
    page: int
    page_size: int


class CheckContactRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None


class CheckContactResponse(BaseModel):
    exists: bool
    user_id: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None



class MemberStatusChangeRequest(BaseModel):
    status: MemberStatus
    reason: Optional[str] = Field(None, max_length=1000)


class MemberNoteCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)


class MemberNoteResponse(BaseModel):
    id: str
    member_id: str
    author_user_id: Optional[str] = None
    author_name: Optional[str] = None
    body: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MemberHistoryItem(BaseModel):
    id: str
    source: str  # member | membership
    event_type: str
    membership_id: Optional[str] = None
    actor_user_id: Optional[str] = None
    actor_name: Optional[str] = None
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    previous_end_date: Optional[date] = None
    new_end_date: Optional[date] = None
    reason: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime


class SelfMembershipItem(BaseModel):
    id: str
    plan_name: Optional[str] = None
    start_date: date
    end_date: date
    status: str
    price_paid: float
    amount_paid: float


class SelfPaymentItem(BaseModel):
    id: str
    amount: float
    currency: str
    method: str
    status: str
    paid_at: datetime
    membership_id: Optional[str] = None


class MemberSelfResponse(BaseModel):
    """Member-facing profile. Never includes staff notes or internal history."""
    id: str
    first_name: str
    last_name: Optional[str] = ""
    email: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    emergency_contact: Optional[str] = None
    status: MemberStatus
    joined_date: date
    memberships: List[SelfMembershipItem] = []
    payments: List[SelfPaymentItem] = []


class MemberSelfUpdate(BaseModel):
    gender: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    emergency_contact: Optional[str] = Field(None, max_length=100)
