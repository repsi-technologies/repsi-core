from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.attendance import AttendanceMethod, CheckoutType, AttendanceStatus


class CheckInRequest(BaseModel):
    member_id: Optional[str] = None
    trainer_id: Optional[str] = None
    identifier: Optional[str] = None  # QR payload, phone, email, or member ID
    qr_token: Optional[str] = None  # Secure rotating gym QR token
    gym_location_id: Optional[str] = None
    method: AttendanceMethod = AttendanceMethod.QR
    terminal_id: Optional[str] = None
    override_reason: Optional[str] = Field(None, max_length=500)  # staff override of an access denial


class CheckOutRequest(BaseModel):
    attendance_id: Optional[str] = None
    member_id: Optional[str] = None
    checkout_type: str = "MANUAL"  # "MANUAL", "AUTO", "STAFF"


class AttendanceResponse(BaseModel):
    id: str
    workspace_id: str
    gym_location_id: Optional[str] = None
    member_id: Optional[str] = None
    trainer_id: Optional[str] = None
    person_name: str
    person_type: str = "member"
    attendance_status: str = "in"  # "in" | "out"
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    duration_formatted: str = "0m"
    method: AttendanceMethod = AttendanceMethod.QR
    checkout_type: Optional[str] = "MANUAL"
    qr_token_id: Optional[str] = None
    terminal_id: Optional[str] = None
    status: str = "CHECKED_IN"
    notes: Optional[str] = None
    recorded_by_user_id: Optional[str] = None
    checked_out_by_user_id: Optional[str] = None
    override_reason: Optional[str] = None
    corrected_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AttendanceHistoryPage(BaseModel):
    items: List[AttendanceResponse]
    total: int
    page: int
    page_size: int


class AttendanceCorrectionRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500)
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None


class AttendanceCorrectionResponse(BaseModel):
    id: str
    attendance_id: str
    actor_user_id: str
    reason: str
    previous_check_in_time: Optional[datetime] = None
    previous_check_out_time: Optional[datetime] = None
    new_check_in_time: Optional[datetime] = None
    new_check_out_time: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AttendanceSummary(BaseModel):
    today_total: int
    currently_inside: int
    total_checked_out: int
    peak_hour: str
    average_dwell_minutes: int
    abnormal_sessions_count: int = 0
    auto_checkouts_count: int = 0


class CurrentlyInsideMember(BaseModel):
    attendance_id: str
    member_id: Optional[str] = None
    trainer_id: Optional[str] = None
    name: str
    person_type: str = "member"
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    plan_name: Optional[str] = "Standard"
    membership_status: Optional[str] = "active"
    check_in_time: datetime
    elapsed_minutes: int
    duration_formatted: str
    terminal_id: Optional[str] = None
    gym_location_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AttendanceQRResponse(BaseModel):
    id: str
    workspace_id: str
    gym_location_id: Optional[str] = None
    token: str
    payload: str
    label: str
    is_active: bool
    expires_at: Optional[datetime] = None
    rotated_at: Optional[datetime] = None
    created_at: datetime
    created_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AttendanceQRGenerateRequest(BaseModel):
    gym_location_id: Optional[str] = None
    label: Optional[str] = "Main Entrance QR"
    expires_in_hours: Optional[int] = None


class AttendanceQRToggleRequest(BaseModel):
    is_active: bool


class AttendanceSettingsSchema(BaseModel):
    id: Optional[str] = None
    workspace_id: str
    gym_location_id: Optional[str] = None
    max_session_duration_minutes: int = 240
    gym_closing_time: str = "22:00"
    auto_checkout_enabled: bool = True
    qr_rotation_interval_minutes: int = 0
    allow_member_manual_checkout: bool = True
    allow_staff_manual_checkout: bool = True
    require_active_membership: bool = True
    expiry_grace_days: int = 0
    max_visits_per_day: int = 0
    block_on_overdue_invoice: bool = True

    model_config = ConfigDict(from_attributes=True)


class AttendanceSettingsUpdate(BaseModel):
    max_session_duration_minutes: Optional[int] = None
    gym_closing_time: Optional[str] = None
    auto_checkout_enabled: Optional[bool] = None
    qr_rotation_interval_minutes: Optional[int] = None
    allow_member_manual_checkout: Optional[bool] = None
    allow_staff_manual_checkout: Optional[bool] = None
    require_active_membership: Optional[bool] = None
    expiry_grace_days: Optional[int] = Field(None, ge=0, le=30)
    max_visits_per_day: Optional[int] = Field(None, ge=0, le=20)
    block_on_overdue_invoice: Optional[bool] = None


class MemberPersonalAttendanceResponse(BaseModel):
    member_id: str
    member_name: str
    total_visits: int
    this_week_visits: int
    this_month_visits: int
    average_duration_minutes: int
    current_streak_days: int
    last_visit_time: Optional[datetime] = None
    is_currently_inside: bool = False
    active_session: Optional[AttendanceResponse] = None
    calendar_attendance_dates: List[str] = []
    recent_sessions: List[AttendanceResponse] = []


class AttendanceAnalyticsResponse(BaseModel):
    daily_trends: List[dict]
    hourly_distribution: List[dict]
    day_of_week_distribution: List[dict]
    average_duration_minutes: int
    total_visits_period: int
    unique_members_visited: int
    most_active_members: List[dict]
    declining_members: List[dict]
    inactive_members_count: int
    inactive_members: List[dict]


class GymLocationSchema(BaseModel):
    id: str
    workspace_id: str
    name: str
    code: str
    address: Optional[str] = None
    closing_time: str = "22:00"
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)
