"""
Staff (trainer) own attendance: summary, correction requests and the owner's staff-hours report.

Kept apart from member attendance: these endpoints only read rows with `trainer_id` set, and a
trainer marking a member present never creates one of these rows. Check-in/out itself reuses
`POST /attendance/check-in|check-out` (trainers self-serve without a gym QR).
"""
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.database import get_db
from app.core.permissions import has_permission
from app.middleware.tenant import TenantContext, get_current_tenant
from app.models.attendance import Attendance, StaffCorrectionRequest
from app.models.system import Notification
from app.models.trainer import Trainer
from app.models.user import UserRole, WorkspaceMember
from app.services.attendance import AttendanceService
from app.services.trainer import TrainerService

router = APIRouter(prefix="/staff-attendance", tags=["Staff attendance"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _naive(dt: Optional[datetime]) -> Optional[datetime]:
    return dt.astimezone(timezone.utc).replace(tzinfo=None) if dt and dt.tzinfo else dt


def _minutes(a: Attendance, now: datetime) -> int:
    if a.duration_minutes is not None:
        return a.duration_minutes
    start = _naive(a.check_in_time)
    end = _naive(a.check_out_time) or _naive(now)
    return max(0, int((end - start).total_seconds() // 60)) if (start and end) else 0


def _record_out(a: Attendance, now: datetime) -> dict:
    return {"id": a.id, "check_in_time": a.check_in_time, "check_out_time": a.check_out_time,
            "minutes": _minutes(a, now), "method": a.method.value if hasattr(a.method, "value") else a.method,
            "corrected": a.corrected_at is not None}


def _request_out(r: StaffCorrectionRequest, trainer_name: Optional[str] = None) -> dict:
    return {"id": r.id, "attendance_id": r.attendance_id, "trainer_id": r.trainer_id, "trainer_name": trainer_name,
            "reason": r.reason, "requested_check_in_time": r.requested_check_in_time,
            "requested_check_out_time": r.requested_check_out_time, "status": r.status,
            "resolution_note": r.resolution_note, "resolved_at": r.resolved_at, "created_at": r.created_at}


def _own_trainer(db: Session, tenant: TenantContext) -> Trainer:
    if tenant.role != "TRAINER":
        raise HTTPException(status_code=403, detail="Only trainers have personal shift attendance here.")
    return TrainerService(db, tenant).verify_trainer_access()


def _require(db: Session, tenant: TenantContext, perm: str) -> None:
    if not has_permission(db, tenant, perm):
        raise HTTPException(status_code=403, detail="You don't have permission to do this.")


@router.get("/me")
def my_attendance(tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    trainer = _own_trainer(db, tenant)
    AttendanceService(db, tenant.workspace_id).run_smart_auto_checkout()
    now = _now()
    rows = db.query(Attendance).filter(
        Attendance.workspace_id == tenant.workspace_id, Attendance.trainer_id == trainer.id,
        Attendance.check_in_time >= _naive(now - timedelta(days=62)),
    ).order_by(Attendance.check_in_time.desc()).all()
    week_start = _naive(now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = _naive(now).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    active = next((r for r in rows if r.check_out_time is None), None)
    requests = db.query(StaffCorrectionRequest).filter(
        StaffCorrectionRequest.workspace_id == tenant.workspace_id, StaffCorrectionRequest.trainer_id == trainer.id,
    ).order_by(StaffCorrectionRequest.created_at.desc()).limit(20).all()
    return {
        "trainer_id": trainer.id,
        "active": _record_out(active, now) if active else None,
        "week_minutes": sum(_minutes(r, now) for r in rows if (cin := _naive(r.check_in_time)) is not None and cin >= week_start),
        "month_minutes": sum(_minutes(r, now) for r in rows if (cin := _naive(r.check_in_time)) is not None and cin >= month_start),
        "month_days": len({cin.date() for r in rows if (cin := _naive(r.check_in_time)) is not None and cin >= month_start}),
        "records": [_record_out(r, now) for r in rows[:40]],
        "correction_requests": [_request_out(r) for r in requests],
    }


class CorrectionRequestIn(BaseModel):
    attendance_id: str = Field(min_length=1, max_length=64)
    reason: str = Field(min_length=3, max_length=500)
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None

    @model_validator(mode="after")
    def _times(self):
        if not self.check_in_time and not self.check_out_time:
            raise ValueError("Give the corrected check-in or check-out time.")
        if self.check_in_time and self.check_out_time and self.check_out_time <= self.check_in_time:
            raise ValueError("Check-out must be after check-in.")
        return self


@router.post("/correction-requests", status_code=201)
def request_correction(data: CorrectionRequestIn, tenant: TenantContext = Depends(get_current_tenant),
                       db: Session = Depends(get_db)):
    trainer = _own_trainer(db, tenant)
    att = db.query(Attendance).filter(Attendance.workspace_id == tenant.workspace_id,
                                      Attendance.id == data.attendance_id).first()
    if not att or att.trainer_id != trainer.id:
        raise HTTPException(status_code=404, detail="Attendance record not found.")
    if db.query(StaffCorrectionRequest.id).filter(StaffCorrectionRequest.attendance_id == att.id,
                                                  StaffCorrectionRequest.status == "pending").first():
        raise HTTPException(status_code=409, detail="A correction for this record is already waiting for review.")
    r = StaffCorrectionRequest(workspace_id=tenant.workspace_id, attendance_id=att.id, trainer_id=trainer.id,
                               requested_by_user_id=tenant.user_id, reason=data.reason.strip(),
                               requested_check_in_time=_naive(data.check_in_time),
                               requested_check_out_time=_naive(data.check_out_time))
    db.add(r)
    db.flush()
    managers = db.query(WorkspaceMember.user_id).filter(
        WorkspaceMember.workspace_id == tenant.workspace_id, WorkspaceMember.is_active.is_(True),
        WorkspaceMember.role.in_((UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER))).all()
    for (uid,) in managers:
        db.add(Notification(workspace_id=tenant.workspace_id, user_id=uid, title="Attendance correction request",
                            message=f"{trainer.name} asked to correct a shift record.", is_read=False))
    record_audit(db, tenant.workspace_id, tenant.user_id, "staff_attendance.correction_requested",
                 resource_type="attendance", resource_id=att.id, details={"request_id": r.id})
    db.commit()
    return _request_out(r, trainer.name)


@router.get("/correction-requests")
def list_correction_requests(status: Optional[Literal["pending", "approved", "rejected"]] = Query(None),
                             tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    q = db.query(StaffCorrectionRequest, Trainer.name).join(Trainer, Trainer.id == StaffCorrectionRequest.trainer_id) \
        .filter(StaffCorrectionRequest.workspace_id == tenant.workspace_id)
    if tenant.role == "TRAINER" and not has_permission(db, tenant, "attendance.correct"):
        q = q.filter(StaffCorrectionRequest.trainer_id == _own_trainer(db, tenant).id)
    else:
        _require(db, tenant, "attendance.correct")
    if status:
        q = q.filter(StaffCorrectionRequest.status == status)
    return [_request_out(r, name) for r, name in q.order_by(StaffCorrectionRequest.created_at.desc()).limit(200).all()]


class ResolveIn(BaseModel):
    note: Optional[str] = Field(None, max_length=500)


def _pending(db: Session, tenant: TenantContext, request_id: str) -> StaffCorrectionRequest:
    _require(db, tenant, "attendance.correct")
    r = db.query(StaffCorrectionRequest).filter(StaffCorrectionRequest.workspace_id == tenant.workspace_id,
                                                StaffCorrectionRequest.id == request_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Request not found.")
    if r.status != "pending":
        raise HTTPException(status_code=409, detail=f"This request is already {r.status}.")
    trainer = db.get(Trainer, r.trainer_id)
    if trainer and trainer.user_id == tenant.user_id:
        raise HTTPException(status_code=403, detail="You can't approve your own correction.")
    return r


def _resolve(db: Session, tenant: TenantContext, r: StaffCorrectionRequest, status: str, note: Optional[str]) -> dict:
    r.status, r.resolved_by_user_id, r.resolved_at = status, tenant.user_id, _now()
    r.resolution_note = (note or "").strip() or None
    trainer = db.get(Trainer, r.trainer_id)
    if trainer and trainer.user_id:
        db.add(Notification(workspace_id=tenant.workspace_id, user_id=trainer.user_id, is_read=False,
                            title=f"Attendance correction {status}",
                            message=r.resolution_note or f"Your correction request was {status}."))
    record_audit(db, tenant.workspace_id, tenant.user_id, f"staff_attendance.correction_{status}",
                 resource_type="attendance", resource_id=r.attendance_id, details={"request_id": r.id})
    db.commit()
    return _request_out(r, trainer.name if trainer else None)


@router.post("/correction-requests/{request_id}/approve")
def approve_correction(request_id: str, data: ResolveIn, tenant: TenantContext = Depends(get_current_tenant),
                       db: Session = Depends(get_db)):
    r = _pending(db, tenant, request_id)
    # The existing correction path validates times and writes the AttendanceCorrection audit row.
    AttendanceService(db, tenant.workspace_id).correct_attendance(
        r.attendance_id, tenant.user_id, f"Requested by trainer: {r.reason}"[:500],
        r.requested_check_in_time, r.requested_check_out_time)
    return _resolve(db, tenant, r, "approved", data.note)


@router.post("/correction-requests/{request_id}/reject")
def reject_correction(request_id: str, data: ResolveIn, tenant: TenantContext = Depends(get_current_tenant),
                      db: Session = Depends(get_db)):
    return _resolve(db, tenant, _pending(db, tenant, request_id), "rejected", data.note)


@router.get("/report")
def staff_hours_report(days: int = Query(30, ge=1, le=92), tenant: TenantContext = Depends(get_current_tenant),
                       db: Session = Depends(get_db)):
    """Per-trainer shifts, hours and open check-ins for the owner. Member visits are never counted."""
    _require(db, tenant, "attendance.view")
    now = _now()
    since = _naive(now - timedelta(days=days))
    trainers = db.query(Trainer).filter(Trainer.workspace_id == tenant.workspace_id).order_by(Trainer.name).all()
    rows = db.query(Attendance).filter(Attendance.workspace_id == tenant.workspace_id,
                                       Attendance.trainer_id.isnot(None), Attendance.check_in_time >= since).all()
    pending = dict(db.query(StaffCorrectionRequest.trainer_id, func.count(StaffCorrectionRequest.id)).filter(
        StaffCorrectionRequest.workspace_id == tenant.workspace_id, StaffCorrectionRequest.status == "pending",
    ).group_by(StaffCorrectionRequest.trainer_id).all())
    out = []
    for t in trainers:
        mine = [a for a in rows if a.trainer_id == t.id]
        out.append({"trainer_id": t.id, "name": t.name, "shifts": len(mine),
                    "days": len({_naive(a.check_in_time).date() for a in mine}),
                    "minutes": sum(_minutes(a, now) for a in mine),
                    "checked_in": any(a.check_out_time is None for a in mine),
                    "pending_corrections": int(pending.get(t.id, 0))})
    return {"days": days, "trainers": out}
