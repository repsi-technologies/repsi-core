"""
Group classes: class templates, dated sessions, bookings with waitlists, and the schedule calendar.

Who can do what:
- Everyone in the workspace can browse classes and sessions.
- `classes.manage` (owner/admin/manager) creates, edits and cancels classes and sessions.
- Members book and cancel their own places; staff with `bookings.manage` book for any member.
- Trainers see and check in the sessions they teach.
"""
from datetime import date, datetime, time, timedelta, timezone
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import has_permission, require_permission
from app.middleware.tenant import TenantContext, get_current_tenant
from app.models.attendance import ClassAttendance
from app.models.booking import ClassBooking, ClassSession
from app.models.member import Member
from app.models.trainer import GymClass, SessionStatus, Trainer, TrainingSession
from app.repositories.base import BaseTenantRepository
from app.services import booking as svc

router = APIRouter(prefix="/classes", tags=["Classes"])


class ClassCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    schedule: str = Field(default="", max_length=100)  # human summary, e.g. "Mon/Wed 7 AM"
    trainer_id: Optional[str] = None
    category: str = Field(default="Strength", max_length=50)
    capacity: int = Field(default=20, ge=1, le=500)
    room: str = Field(default="Studio A", max_length=100)
    duration_minutes: int = Field(default=60, ge=10, le=480)
    description: Optional[str] = Field(default=None, max_length=2000)
    branch_id: Optional[str] = None
    booking_open_hours: int = Field(default=168, ge=1, le=24 * 60)
    cancel_cutoff_hours: int = Field(default=2, ge=0, le=72)
    waitlist_enabled: bool = True


class ClassUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    schedule: Optional[str] = Field(default=None, max_length=100)
    trainer_id: Optional[str] = None
    category: Optional[str] = Field(default=None, max_length=50)
    capacity: Optional[int] = Field(default=None, ge=1, le=500)
    room: Optional[str] = Field(default=None, max_length=100)
    duration_minutes: Optional[int] = Field(default=None, ge=10, le=480)
    description: Optional[str] = Field(default=None, max_length=2000)
    booking_open_hours: Optional[int] = Field(default=None, ge=1, le=24 * 60)
    cancel_cutoff_hours: Optional[int] = Field(default=None, ge=0, le=72)
    waitlist_enabled: Optional[bool] = None
    is_active: Optional[bool] = None


class ClassResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    schedule: str
    trainer_id: Optional[str] = None
    category: str
    capacity: int
    room: Optional[str] = None
    is_active: bool
    duration_minutes: int = 60
    description: Optional[str] = None
    booking_open_hours: int = 168
    cancel_cutoff_hours: int = 2
    waitlist_enabled: bool = True

    model_config = ConfigDict(from_attributes=True)


class SessionCreate(BaseModel):
    starts_at: Optional[datetime] = None  # single session (naive = gym local time)
    weekdays: Optional[List[int]] = Field(default=None, description="0 = Monday … 6 = Sunday")
    start_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    from_date: Optional[date] = None
    until_date: Optional[date] = None
    duration_minutes: Optional[int] = Field(default=None, ge=10, le=480)
    trainer_id: Optional[str] = None
    capacity: Optional[int] = Field(default=None, ge=1, le=500)
    room: Optional[str] = Field(default=None, max_length=100)


class SessionUpdate(BaseModel):
    starts_at: Optional[datetime] = None
    capacity: Optional[int] = Field(default=None, ge=1, le=500)
    trainer_id: Optional[str] = None
    room: Optional[str] = Field(default=None, max_length=100)


class CancelRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=255)


class BookRequest(BaseModel):
    member_id: Optional[str] = None  # staff booking for a member; members omit it
    override_rules: bool = False  # staff only: skip membership/credit/booking-window checks


class BookingCancel(BaseModel):
    reason: Optional[str] = Field(default=None, max_length=255)


class MarkClassAttendanceRequest(BaseModel):
    member_id: str
    status: str = "attended"  # attended, late, absent, cancelled


def _my_member(db: Session, tenant: TenantContext) -> Optional[Member]:
    return db.scalar(select(Member).where(Member.workspace_id == tenant.workspace_id, Member.user_id == tenant.user_id))


def _my_trainer(db: Session, tenant: TenantContext) -> Optional[Trainer]:
    return db.scalar(select(Trainer).where(Trainer.workspace_id == tenant.workspace_id, Trainer.user_id == tenant.user_id))


def _session_view(db: Session, s: ClassSession, gym_class: Optional[GymClass], c: dict, mine: Optional[ClassBooking] = None) -> dict:
    return {
        "id": s.id, "class_id": s.class_id, "class_name": gym_class.name if gym_class else None,
        "category": gym_class.category if gym_class else None, "trainer_id": s.trainer_id,
        "starts_at": svc.aware(s.starts_at), "ends_at": svc.aware(s.ends_at), "capacity": s.capacity,
        "room": s.room, "status": s.status, "cancel_reason": s.cancel_reason, "series_id": s.series_id,
        "booked": c.get("booked", 0) + c.get("attended", 0), "waitlisted": c.get("waitlisted", 0),
        "spots_left": max(0, s.capacity - c.get("booked", 0) - c.get("attended", 0)),
        "my_booking": _booking_view(mine) if mine else None,
    }


def _booking_view(b: ClassBooking, member: Optional[Member] = None) -> dict:
    out = {
        "id": b.id, "session_id": b.session_id, "member_id": b.member_id, "status": b.status,
        "waitlist_position": b.waitlist_position, "booked_at": svc.aware(b.booked_at),
        "cancelled_at": svc.aware(b.cancelled_at), "cancel_reason": b.cancel_reason, "late_cancel": b.late_cancel,
        "checked_in_at": svc.aware(b.checked_in_at),
    }
    if member is not None:
        out["member_name"] = f"{member.first_name} {member.last_name or ''}".strip()
    return out


# ─── Class templates ───────────────────────────────────────────────────


@router.get("/", response_model=List[ClassResponse])
def get_classes(
    include_inactive: bool = False,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    q = select(GymClass).where(GymClass.workspace_id == tenant.workspace_id)
    if not include_inactive or not has_permission(db, tenant, "classes.manage"):
        q = q.where(GymClass.is_active.is_(True))
    return db.scalars(q.order_by(GymClass.name)).all()


@router.post("/", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    data: ClassCreate,
    tenant: TenantContext = Depends(require_permission("classes.manage")),
    db: Session = Depends(get_db)
):
    if data.trainer_id and not db.scalar(select(Trainer.id).where(
            Trainer.workspace_id == tenant.workspace_id, Trainer.id == data.trainer_id)):
        raise HTTPException(status_code=404, detail="Trainer not found.")
    repo = BaseTenantRepository[GymClass](GymClass, db, tenant.workspace_id)
    return repo.create(**data.model_dump())


@router.patch("/{class_id}", response_model=ClassResponse)
def update_class(
    class_id: str,
    data: ClassUpdate,
    tenant: TenantContext = Depends(require_permission("classes.manage")),
    db: Session = Depends(get_db),
):
    gym_class = svc.get_class(db, tenant.workspace_id, class_id)
    changes = data.model_dump(exclude_unset=True)
    if changes.get("trainer_id") and not db.scalar(select(Trainer.id).where(
            Trainer.workspace_id == tenant.workspace_id, Trainer.id == changes["trainer_id"])):
        raise HTTPException(status_code=404, detail="Trainer not found.")
    for k, v in changes.items():
        setattr(gym_class, k, v)
    db.commit()
    db.refresh(gym_class)
    return gym_class


@router.delete("/{class_id}")
def archive_class(
    class_id: str,
    tenant: TenantContext = Depends(require_permission("classes.manage")),
    db: Session = Depends(get_db),
):
    """Classes are archived, not deleted, so booking and attendance history stays intact."""
    gym_class = svc.get_class(db, tenant.workspace_id, class_id)
    upcoming = db.scalar(select(ClassSession.id).where(
        ClassSession.class_id == gym_class.id, ClassSession.status == "scheduled",
        ClassSession.starts_at > svc.utcnow()))
    if upcoming:
        raise HTTPException(status_code=409, detail="Cancel this class's upcoming sessions before archiving it.")
    gym_class.is_active = False
    db.commit()
    return {"status": "success", "message": "Class archived."}


# ─── Sessions and calendar ─────────────────────────────────────────────


@router.post("/{class_id}/sessions", status_code=status.HTTP_201_CREATED)
def create_class_sessions(
    class_id: str,
    data: SessionCreate,
    tenant: TenantContext = Depends(require_permission("classes.manage")),
    db: Session = Depends(get_db),
):
    gym_class = svc.get_class(db, tenant.workspace_id, class_id)
    if not gym_class.is_active:
        raise HTTPException(status_code=409, detail="This class is archived.")
    sessions = svc.create_sessions(db, gym_class, tenant.user_id, **data.model_dump())
    db.commit()
    return [_session_view(db, s, gym_class, {}) for s in sessions]


@router.get("/sessions")
def list_sessions(
    start: Optional[date] = None,
    end: Optional[date] = None,
    class_id: Optional[str] = None,
    trainer_id: Optional[str] = None,
    include_cancelled: bool = False,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    tz = svc.workspace_zone(db, tenant.workspace_id)
    start = start or datetime.now(tz).date()
    end = end or start + timedelta(days=14)
    if (end - start).days > 92:
        raise HTTPException(status_code=422, detail="Choose a range of at most 92 days.")
    lo = datetime.combine(start, time.min, tzinfo=tz).astimezone(timezone.utc)
    hi = datetime.combine(end + timedelta(days=1), time.min, tzinfo=tz).astimezone(timezone.utc)
    q = select(ClassSession).where(ClassSession.workspace_id == tenant.workspace_id,
                                   ClassSession.starts_at >= lo, ClassSession.starts_at < hi)
    if class_id:
        q = q.where(ClassSession.class_id == class_id)
    if trainer_id:
        q = q.where(ClassSession.trainer_id == trainer_id)
    if not include_cancelled:
        q = q.where(ClassSession.status != "cancelled")
    sessions = db.scalars(q.order_by(ClassSession.starts_at).limit(1000)).all()
    classes = {c.id: c for c in db.scalars(select(GymClass).where(
        GymClass.id.in_({s.class_id for s in sessions}))).all()} if sessions else {}
    c = svc.counts(db, [s.id for s in sessions])
    mine = {}
    me = _my_member(db, tenant) if tenant.role == "USER" else None
    if me and sessions:
        mine = {b.session_id: b for b in db.scalars(select(ClassBooking).where(
            ClassBooking.member_id == me.id, ClassBooking.session_id.in_([s.id for s in sessions]),
            ClassBooking.status != "cancelled")).all()}
    return [_session_view(db, s, classes.get(s.class_id), c[s.id], mine.get(s.id)) for s in sessions]


@router.patch("/sessions/{session_id}")
def update_class_session(
    session_id: str,
    data: SessionUpdate,
    tenant: TenantContext = Depends(require_permission("classes.manage")),
    db: Session = Depends(get_db),
):
    session = svc.get_session(db, tenant.workspace_id, session_id)
    svc.update_session(db, session, actor_user_id=tenant.user_id, **data.model_dump(exclude_unset=True))
    db.commit()
    return _session_view(db, session, db.get(GymClass, session.class_id), svc.counts(db, [session.id])[session.id])


@router.post("/sessions/{session_id}/cancel")
def cancel_class_session(
    session_id: str,
    data: CancelRequest,
    tenant: TenantContext = Depends(require_permission("classes.manage")),
    db: Session = Depends(get_db),
):
    session = svc.get_session(db, tenant.workspace_id, session_id)
    affected = svc.cancel_session(db, session, data.reason, tenant.user_id)
    db.commit()
    return {"status": "success", "bookings_cancelled": affected}


@router.get("/calendar")
def schedule_calendar(
    start: Optional[date] = None,
    end: Optional[date] = None,
    trainer_id: Optional[str] = None,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Classes and personal-training sessions in one list, scoped to what the caller may see."""
    tz = svc.workspace_zone(db, tenant.workspace_id)
    start = start or datetime.now(tz).date()
    end = end or start + timedelta(days=7)
    if (end - start).days > 62:
        raise HTTPException(status_code=422, detail="Choose a range of at most 62 days.")
    lo = datetime.combine(start, time.min, tzinfo=tz).astimezone(timezone.utc)
    hi = datetime.combine(end + timedelta(days=1), time.min, tzinfo=tz).astimezone(timezone.utc)

    me_member = _my_member(db, tenant) if tenant.role == "USER" else None
    me_trainer = _my_trainer(db, tenant) if tenant.role == "TRAINER" else None
    if tenant.role == "TRAINER":
        trainer_id = me_trainer.id if me_trainer else "-"

    events = []
    sq = select(ClassSession).where(ClassSession.workspace_id == tenant.workspace_id, ClassSession.starts_at >= lo,
                                    ClassSession.starts_at < hi, ClassSession.status != "cancelled")
    if trainer_id:
        sq = sq.where(ClassSession.trainer_id == trainer_id)
    sessions = db.scalars(sq).all()
    if me_member is not None:
        booked_ids = set(db.scalars(select(ClassBooking.session_id).where(
            ClassBooking.member_id == me_member.id, ClassBooking.status.in_(("booked", "waitlisted", "attended")))).all())
        sessions = [s for s in sessions if s.id in booked_ids]
    classes = {c.id: c for c in db.scalars(select(GymClass).where(GymClass.workspace_id == tenant.workspace_id)).all()}
    c = svc.counts(db, [s.id for s in sessions])
    for s in sessions:
        g = classes.get(s.class_id)
        events.append({"type": "class", "id": s.id, "title": g.name if g else "Class", "starts_at": svc.aware(s.starts_at),
                       "ends_at": svc.aware(s.ends_at), "trainer_id": s.trainer_id, "room": s.room,
                       "booked": c[s.id]["booked"], "capacity": s.capacity})

    aq = select(TrainingSession).where(TrainingSession.workspace_id == tenant.workspace_id,
                                       TrainingSession.scheduled_at >= lo, TrainingSession.scheduled_at < hi,
                                       TrainingSession.status != SessionStatus.CANCELLED)
    if trainer_id:
        aq = aq.where(TrainingSession.trainer_id == trainer_id)
    if me_member is not None:
        aq = aq.where(TrainingSession.client_id == me_member.id)
    elif tenant.role == "USER":
        aq = aq.where(TrainingSession.id == "-")
    for a in db.scalars(aq).all():
        st = svc.aware(a.scheduled_at)
        events.append({"type": "appointment", "id": a.id, "title": a.title, "starts_at": st,
                       "ends_at": (st + timedelta(minutes=a.duration_minutes or 60)) if st else None, "trainer_id": a.trainer_id,
                       "member_id": a.client_id, "status": a.status.value if hasattr(a.status, "value") else a.status})
    events.sort(key=lambda e: e["starts_at"])
    return events


# ─── Bookings ──────────────────────────────────────────────────────────


@router.post("/sessions/{session_id}/book", status_code=status.HTTP_201_CREATED)
def book_session(
    session_id: str,
    data: BookRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    session = svc.get_session(db, tenant.workspace_id, session_id)
    if tenant.role == "USER":
        member = _my_member(db, tenant)
        if member is None or (data.member_id and data.member_id != member.id):
            raise HTTPException(status_code=403, detail="You can only book for yourself.")
        override = False
    else:
        if not has_permission(db, tenant, "bookings.manage"):
            raise HTTPException(status_code=403, detail="You don't have permission to manage bookings.")
        if not data.member_id:
            raise HTTPException(status_code=422, detail="Choose the member to book.")
        member = db.scalar(select(Member).where(Member.workspace_id == tenant.workspace_id, Member.id == data.member_id))
        if member is None:
            raise HTTPException(status_code=404, detail="Member not found.")
        override = data.override_rules
    booking = svc.book(db, session, member, tenant.user_id, staff_override=override)
    db.commit()
    return _booking_view(booking, member)


@router.get("/sessions/{session_id}/bookings")
def session_bookings(
    session_id: str,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    session = svc.get_session(db, tenant.workspace_id, session_id)
    if not has_permission(db, tenant, "bookings.manage"):
        raise HTTPException(status_code=403, detail="You don't have permission to view bookings.")
    if tenant.role == "TRAINER":
        me = _my_trainer(db, tenant)
        if me is None or session.trainer_id != me.id:
            raise HTTPException(status_code=403, detail="Trainers can only see their own sessions.")
    rows = db.execute(select(ClassBooking, Member).join(Member, Member.id == ClassBooking.member_id).where(
        ClassBooking.session_id == session.id).order_by(ClassBooking.status, ClassBooking.waitlist_position,
                                                         ClassBooking.booked_at)).all()
    return [_booking_view(b, m) for b, m in rows]


@router.get("/my-bookings")
def my_bookings(
    upcoming_only: bool = True,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    member = _my_member(db, tenant)
    if member is None:
        return []
    q = select(ClassBooking, ClassSession, GymClass).join(ClassSession, ClassSession.id == ClassBooking.session_id).join(
        GymClass, GymClass.id == ClassSession.class_id).where(ClassBooking.member_id == member.id)
    if upcoming_only:
        q = q.where(ClassSession.starts_at >= svc.utcnow() - timedelta(hours=2))
    rows = db.execute(q.order_by(ClassSession.starts_at).limit(200)).all()
    return [{**_booking_view(b), "class_name": g.name, "starts_at": svc.aware(s.starts_at),
             "ends_at": svc.aware(s.ends_at), "room": s.room, "session_status": s.status} for b, s, g in rows]


def _booking_for_caller(db: Session, tenant: TenantContext, booking_id: str) -> ClassBooking:
    booking = db.scalar(select(ClassBooking).where(
        ClassBooking.workspace_id == tenant.workspace_id, ClassBooking.id == booking_id))
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if tenant.role == "USER":
        me = _my_member(db, tenant)
        if me is None or booking.member_id != me.id:
            raise HTTPException(status_code=404, detail="Booking not found.")
    elif not has_permission(db, tenant, "bookings.manage"):
        raise HTTPException(status_code=403, detail="You don't have permission to manage bookings.")
    return booking


@router.post("/bookings/{booking_id}/cancel")
def cancel_booking(
    booking_id: str,
    data: BookingCancel,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    booking = _booking_for_caller(db, tenant, booking_id)
    svc.cancel_booking(db, booking, tenant.user_id, data.reason)
    db.commit()
    return _booking_view(booking)


@router.post("/bookings/{booking_id}/check-in")
def check_in_booking(
    booking_id: str,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    if tenant.role == "USER":
        raise HTTPException(status_code=403, detail="Staff or the class trainer check members in.")
    booking = _booking_for_caller(db, tenant, booking_id)
    if tenant.role == "TRAINER":
        session = db.get(ClassSession, booking.session_id)
        me = _my_trainer(db, tenant)
        if me is None or session is None or session.trainer_id != me.id:
            raise HTTPException(status_code=403, detail="Trainers can only check in their own sessions.")
    svc.check_in_booking(db, booking)
    db.commit()
    return _booking_view(booking)


# ─── Legacy class attendance (kept for existing clients) ───────────────


@router.get("/{class_id}/participants")
def get_class_participants(
    class_id: str,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    if tenant.role == "USER":
        raise HTTPException(status_code=403, detail="Members can't view class participant lists.")
    records = db.query(ClassAttendance, Member).join(
        Member, ClassAttendance.member_id == Member.id
    ).filter(
        ClassAttendance.workspace_id == tenant.workspace_id,
        ClassAttendance.class_id == class_id
    ).all()

    return [{
        "attendance_id": ca.id,
        "member_id": m.id,
        "name": f"{m.first_name} {m.last_name}".strip(),
        "phone": m.phone,
        "email": m.email,
        "status": ca.status,
        "check_in_time": ca.check_in_time
    } for ca, m in records]


@router.post("/{class_id}/attendance", status_code=status.HTTP_201_CREATED)
def mark_class_attendance(
    class_id: str,
    data: MarkClassAttendanceRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    if tenant.role == "USER":
        raise HTTPException(status_code=403, detail="Members can't mark class attendance.")
    gym_class = db.query(GymClass).filter(
        GymClass.workspace_id == tenant.workspace_id,
        GymClass.id == class_id
    ).first()
    if not gym_class:
        raise HTTPException(status_code=404, detail="Class not found.")

    member = db.query(Member).filter(
        Member.workspace_id == tenant.workspace_id,
        Member.id == data.member_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    attendance_record = ClassAttendance(
        workspace_id=tenant.workspace_id,
        class_id=class_id,
        member_id=data.member_id,
        status=data.status,
        check_in_time=datetime.now(timezone.utc)
    )
    db.add(attendance_record)
    db.commit()
    db.refresh(attendance_record)

    return {
        "status": "success",
        "attendance_id": attendance_record.id,
        "member_name": f"{member.first_name} {member.last_name}".strip(),
        "class_name": gym_class.name,
        "attendance_status": attendance_record.status
    }
