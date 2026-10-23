"""
Personal-training appointments and trainer availability.

- Trainers manage their own weekly availability and time off; staff with `schedules.manage` manage anyone's.
- Members book sessions with a trainer inside that availability; staff with `bookings.manage` book for members.
- Appointments are TrainingSession rows (the same records the trainer dashboard already shows).
"""
from datetime import date, datetime, time, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import has_permission
from app.middleware.tenant import TenantContext, get_current_tenant
from app.models.booking import TrainerTimeOff
from app.models.member import Member
from app.models.trainer import SessionStatus, Trainer, TrainingSession
from app.services import booking as svc

router = APIRouter(prefix="/appointments", tags=["Appointments"])


class Slot(BaseModel):
    weekday: int = Field(ge=0, le=6)
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    branch_id: Optional[str] = None


class AvailabilityUpdate(BaseModel):
    slots: List[Slot] = Field(default_factory=list, max_length=50)


class TimeOffCreate(BaseModel):
    trainer_id: str
    starts_on: date
    ends_on: date
    reason: Optional[str] = Field(default=None, max_length=500)


class AppointmentCreate(BaseModel):
    trainer_id: str
    member_id: Optional[str] = None
    starts_at: datetime
    duration_minutes: int = Field(default=60, ge=15, le=240)
    title: Optional[str] = Field(default=None, max_length=150)
    notes: Optional[str] = Field(default=None, max_length=2000)
    location: Optional[str] = Field(default=None, max_length=150)


class AppointmentCancel(BaseModel):
    reason: str = Field(min_length=3, max_length=255)


def _trainer(db: Session, tenant: TenantContext, trainer_id: str) -> Trainer:
    t = db.scalar(select(Trainer).where(Trainer.workspace_id == tenant.workspace_id, Trainer.id == trainer_id))
    if t is None:
        raise HTTPException(status_code=404, detail="Trainer not found.")
    return t


def _can_manage_schedule(db: Session, tenant: TenantContext, trainer: Trainer) -> bool:
    return trainer.user_id == tenant.user_id or has_permission(db, tenant, "schedules.manage")


def _my_member(db: Session, tenant: TenantContext) -> Optional[Member]:
    return db.scalar(select(Member).where(Member.workspace_id == tenant.workspace_id, Member.user_id == tenant.user_id))


def _view(a: TrainingSession) -> dict:
    start = svc.aware(a.scheduled_at)
    return {
        "id": a.id, "trainer_id": a.trainer_id, "member_id": a.client_id, "title": a.title,
        "starts_at": start, "ends_at": start + timedelta(minutes=a.duration_minutes or 60),
        "duration_minutes": a.duration_minutes, "status": a.status.value if hasattr(a.status, "value") else a.status,
        "notes": a.notes, "location": a.location, "source": a.source,
        "cancelled_at": svc.aware(a.cancelled_at), "cancel_reason": a.cancel_reason,
    }


# ─── Availability ──────────────────────────────────────────────────────


@router.get("/availability/{trainer_id}")
def get_availability(trainer_id: str, tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    _trainer(db, tenant, trainer_id)
    return [{"weekday": s.weekday, "start_time": s.start_time, "end_time": s.end_time, "branch_id": s.branch_id}
            for s in svc.availability(db, tenant.workspace_id, trainer_id)]


@router.put("/availability/{trainer_id}")
def put_availability(trainer_id: str, data: AvailabilityUpdate, tenant: TenantContext = Depends(get_current_tenant),
                     db: Session = Depends(get_db)):
    trainer = _trainer(db, tenant, trainer_id)
    if not _can_manage_schedule(db, tenant, trainer):
        raise HTTPException(status_code=403, detail="You can only change your own availability.")
    rows = svc.set_availability(db, tenant.workspace_id, trainer_id, [s.model_dump() for s in data.slots])
    db.commit()
    return [{"weekday": s.weekday, "start_time": s.start_time, "end_time": s.end_time, "branch_id": s.branch_id} for s in rows]


@router.get("/time-off")
def list_time_off(trainer_id: Optional[str] = None, tenant: TenantContext = Depends(get_current_tenant),
                  db: Session = Depends(get_db)):
    if tenant.role == "USER":
        raise HTTPException(status_code=403, detail="Members can't view trainer leave.")
    q = select(TrainerTimeOff).where(TrainerTimeOff.workspace_id == tenant.workspace_id,
                                     TrainerTimeOff.ends_on >= date.today() - timedelta(days=90))
    if trainer_id:
        q = q.where(TrainerTimeOff.trainer_id == trainer_id)
    return [{"id": t.id, "trainer_id": t.trainer_id, "starts_on": t.starts_on, "ends_on": t.ends_on, "reason": t.reason}
            for t in db.scalars(q.order_by(TrainerTimeOff.starts_on)).all()]


@router.post("/time-off", status_code=status.HTTP_201_CREATED)
def add_time_off(data: TimeOffCreate, tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    trainer = _trainer(db, tenant, data.trainer_id)
    if not _can_manage_schedule(db, tenant, trainer):
        raise HTTPException(status_code=403, detail="You can only record your own time off.")
    if data.ends_on < data.starts_on:
        raise HTTPException(status_code=422, detail="Time off must end on or after its start.")
    row = TrainerTimeOff(workspace_id=tenant.workspace_id, trainer_id=trainer.id, starts_on=data.starts_on,
                         ends_on=data.ends_on, reason=data.reason, created_by=tenant.user_id)
    db.add(row)
    db.commit()
    tz = svc.workspace_zone(db, tenant.workspace_id)
    lo = datetime.combine(data.starts_on, time.min, tzinfo=tz).astimezone(timezone.utc)
    hi = datetime.combine(data.ends_on + timedelta(days=1), time.min, tzinfo=tz).astimezone(timezone.utc)
    clashes = db.scalars(select(TrainingSession).where(
        TrainingSession.workspace_id == tenant.workspace_id, TrainingSession.trainer_id == trainer.id,
        TrainingSession.status == SessionStatus.SCHEDULED, TrainingSession.scheduled_at >= lo,
        TrainingSession.scheduled_at < hi)).all()
    return {"id": row.id, "trainer_id": row.trainer_id, "starts_on": row.starts_on, "ends_on": row.ends_on,
            "reason": row.reason, "conflicting_appointments": [_view(a) for a in clashes]}


@router.delete("/time-off/{time_off_id}")
def remove_time_off(time_off_id: str, tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    row = db.scalar(select(TrainerTimeOff).where(TrainerTimeOff.workspace_id == tenant.workspace_id,
                                                 TrainerTimeOff.id == time_off_id))
    if row is None:
        raise HTTPException(status_code=404, detail="Time off not found.")
    if not _can_manage_schedule(db, tenant, _trainer(db, tenant, row.trainer_id)):
        raise HTTPException(status_code=403, detail="You can only change your own time off.")
    db.delete(row)
    db.commit()
    return {"status": "success"}


@router.get("/slots")
def get_free_slots(trainer_id: str, day: date, duration_minutes: int = Query(default=60, ge=15, le=240),
                   tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    _trainer(db, tenant, trainer_id)
    return {"trainer_id": trainer_id, "day": day, "duration_minutes": duration_minutes,
            "slots": svc.free_slots(db, tenant.workspace_id, trainer_id, day, duration_minutes)}


# ─── Appointments ──────────────────────────────────────────────────────


@router.post("", status_code=status.HTTP_201_CREATED)
def create_appointment(data: AppointmentCreate, tenant: TenantContext = Depends(get_current_tenant),
                       db: Session = Depends(get_db)):
    trainer = _trainer(db, tenant, data.trainer_id)
    if tenant.role == "USER":
        member = _my_member(db, tenant)
        if member is None or (data.member_id and data.member_id != member.id):
            raise HTTPException(status_code=403, detail="You can only book sessions for yourself.")
        source = "member"
    else:
        is_own_trainer = trainer.user_id == tenant.user_id
        if not (is_own_trainer or has_permission(db, tenant, "bookings.manage")):
            raise HTTPException(status_code=403, detail="You don't have permission to book sessions.")
        if tenant.role == "TRAINER" and not is_own_trainer:
            raise HTTPException(status_code=403, detail="Trainers can only book their own sessions.")
        member = None
        if data.member_id:
            member = db.scalar(select(Member).where(Member.workspace_id == tenant.workspace_id, Member.id == data.member_id))
            if member is None:
                raise HTTPException(status_code=404, detail="Member not found.")
        source = "trainer" if is_own_trainer else "staff"
    appt = svc.book_appointment(db, tenant.workspace_id, trainer.id, member, data.starts_at, data.duration_minutes,
                                tenant.user_id, source, data.title, data.notes, data.location)
    db.commit()
    return _view(appt)


@router.get("")
def list_appointments(
    start: Optional[date] = None, end: Optional[date] = None, trainer_id: Optional[str] = None,
    member_id: Optional[str] = None, tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db),
):
    tz = svc.workspace_zone(db, tenant.workspace_id)
    start = start or datetime.now(tz).date()
    end = end or start + timedelta(days=30)
    lo = datetime.combine(start, time.min, tzinfo=tz).astimezone(timezone.utc)
    hi = datetime.combine(end + timedelta(days=1), time.min, tzinfo=tz).astimezone(timezone.utc)
    q = select(TrainingSession).where(TrainingSession.workspace_id == tenant.workspace_id,
                                      TrainingSession.scheduled_at >= lo, TrainingSession.scheduled_at < hi)
    if tenant.role == "USER":
        me = _my_member(db, tenant)
        q = q.where(TrainingSession.client_id == (me.id if me else "-"))
    elif tenant.role == "TRAINER":
        me_t = db.scalar(select(Trainer).where(Trainer.workspace_id == tenant.workspace_id, Trainer.user_id == tenant.user_id))
        q = q.where(TrainingSession.trainer_id == (me_t.id if me_t else "-"))
    if trainer_id:
        q = q.where(TrainingSession.trainer_id == trainer_id)
    if member_id and tenant.role != "USER":
        q = q.where(TrainingSession.client_id == member_id)
    return [_view(a) for a in db.scalars(q.order_by(TrainingSession.scheduled_at).limit(500)).all()]


def _appointment_for_caller(db: Session, tenant: TenantContext, appointment_id: str) -> TrainingSession:
    appt = db.scalar(select(TrainingSession).where(TrainingSession.workspace_id == tenant.workspace_id,
                                                   TrainingSession.id == appointment_id))
    if appt is None:
        raise HTTPException(status_code=404, detail="Session not found.")
    if tenant.role == "USER":
        me = _my_member(db, tenant)
        if me is None or appt.client_id != me.id:
            raise HTTPException(status_code=404, detail="Session not found.")
    elif tenant.role == "TRAINER":
        trainer = db.get(Trainer, appt.trainer_id)
        if trainer is None or trainer.user_id != tenant.user_id:
            raise HTTPException(status_code=403, detail="Trainers can only change their own sessions.")
    elif not has_permission(db, tenant, "bookings.manage"):
        raise HTTPException(status_code=403, detail="You don't have permission to manage sessions.")
    return appt


@router.post("/{appointment_id}/cancel")
def cancel_appointment(appointment_id: str, data: AppointmentCancel,
                       tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    appt = _appointment_for_caller(db, tenant, appointment_id)
    svc.cancel_appointment(db, appt, tenant.user_id, data.reason)
    db.commit()
    return _view(appt)


@router.post("/{appointment_id}/complete")
def complete_appointment(appointment_id: str, no_show: bool = False,
                         tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    if tenant.role == "USER":
        raise HTTPException(status_code=403, detail="Only the trainer or staff can complete a session.")
    appt = _appointment_for_caller(db, tenant, appointment_id)
    if appt.status != SessionStatus.SCHEDULED:
        raise HTTPException(status_code=409, detail="Only scheduled sessions can be completed.")
    appt.status = SessionStatus.NO_SHOW if no_show else SessionStatus.COMPLETED
    db.commit()
    return _view(appt)
