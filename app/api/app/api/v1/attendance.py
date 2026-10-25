import csv
import io
from datetime import datetime, date, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.middleware.tenant import get_current_tenant, TenantContext
from app.models.user import User
from app.models.member import Member
from app.schemas.attendance import (
    CheckInRequest,
    CheckOutRequest,
    AttendanceResponse,
    AttendanceSummary,
    CurrentlyInsideMember,
    AttendanceQRResponse,
    AttendanceQRGenerateRequest,
    AttendanceQRToggleRequest,
    AttendanceSettingsSchema,
    AttendanceSettingsUpdate,
    AttendanceAnalyticsResponse,
    MemberPersonalAttendanceResponse,
    GymLocationSchema,
    AttendanceCorrectionRequest,
    AttendanceCorrectionResponse,
    AttendanceHistoryPage,
)
from app.services.attendance import AttendanceService
from app.services import member_pass
from app.services.member_lifecycle import get_or_create_member_for_user
from app.core.config import settings
from app.core.permissions import has_permission, require_permission
from app.core.rate_limit import enforce_rate_limit
from app.core.audit import record_audit
from app.models.attendance import Attendance, AttendanceCorrection, AttendanceMethod

router = APIRouter(prefix="/attendance", tags=["Attendance"])

# Roles that may only check themselves in/out (members, and trainers clocking in).
SELF_SERVICE_ROLES = ("USER", "MEMBER", "TRAINER")


def _is_self_service(tenant: TenantContext) -> bool:
    return tenant.role in SELF_SERVICE_ROLES


def _require(db: Session, tenant: TenantContext, permission: str) -> None:
    if not has_permission(db, tenant, permission):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You don't have permission to record attendance for other people.")


def _resolve_scan_target(db: Session, tenant: TenantContext, req: CheckInRequest) -> dict:
    """For staff scans: turns a signed member pass into member_id + jti; counts invalid scans for rate limiting."""
    ident = (req.identifier or "").strip()
    if not member_pass.is_member_pass(ident):
        return {"member_id": req.member_id, "trainer_id": req.trainer_id, "identifier": req.identifier, "jti": None}
    try:
        member_id, jti = member_pass.verify_pass(ident, tenant.workspace_id)
    except HTTPException:
        _count_invalid_scan(tenant)
        raise
    return {"member_id": member_id, "trainer_id": None, "identifier": None, "jti": jti}


def _count_invalid_scan(tenant: TenantContext) -> None:
    enforce_rate_limit(f"attendance-invalid-scan:{tenant.workspace_id}:{tenant.user_id}",
                       settings.ATTENDANCE_INVALID_SCAN_LIMIT, 60)


def _staff_check_in(svc: AttendanceService, db: Session, tenant: TenantContext, req: CheckInRequest):
    target = _resolve_scan_target(db, tenant, req)
    try:
        return svc.check_in(
            member_id=target["member_id"],
            trainer_id=target["trainer_id"],
            identifier=target["identifier"],
            qr_token=req.qr_token,
            gym_location_id=req.gym_location_id,
            method=req.method,
            terminal_id=req.terminal_id,
            actor_user_id=tenant.user_id,
            override_reason=req.override_reason,
            can_override=has_permission(db, tenant, "attendance.override"),
            pass_jti=target["jti"],
        )
    except HTTPException as exc:
        if exc.status_code == status.HTTP_404_NOT_FOUND:
            _count_invalid_scan(tenant)
        raise


def _self_check_in(svc: AttendanceService, tenant: TenantContext, req: CheckInRequest):
    # Members must scan the gym's entrance QR so a check-in proves physical presence.
    if tenant.role != "TRAINER" and not req.qr_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Scan the QR code at the gym entrance to check in, or check in at the front desk.")
    return svc.check_in(
        user_id=tenant.user_id,
        qr_token=req.qr_token,
        gym_location_id=req.gym_location_id,
        method=req.method,
        terminal_id=req.terminal_id,
        member_facing=True,
    )


@router.post("/check-in", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def check_in(
    req: CheckInRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """
    Check-in with server-side validation (membership, account status, QR token, duplicates).
    Members/trainers check themselves in; staff need `attendance.record` to check in others,
    and `attendance.override` plus `override_reason` to admit someone who would be denied.
    """
    svc = AttendanceService(db, tenant.workspace_id)
    if tenant.role in ("USER", "MEMBER"):
        return _self_check_in(svc, tenant, req)

    if tenant.role == "TRAINER":
        if req.member_id or (req.identifier and not req.trainer_id):
            _require(db, tenant, "attendance.record")
            return _staff_check_in(svc, db, tenant, req)
        return _self_check_in(svc, tenant, req)

    _require(db, tenant, "attendance.record")
    return _staff_check_in(svc, db, tenant, req)


@router.post("/check-out", response_model=AttendanceResponse)
def check_out(
    req: CheckOutRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Check out. Members/trainers can close their own visit; trainers with attendance.record can check out members."""
    svc = AttendanceService(db, tenant.workspace_id)
    if tenant.role in ("USER", "MEMBER"):
        if not svc.get_or_create_settings().allow_member_manual_checkout:
            raise HTTPException(status_code=403, detail="Please check out at the front desk.")
        person = svc._resolve_person(user_id=tenant.user_id)
        if not person:
            raise HTTPException(status_code=404, detail="No active check-in session found to check out.")
        own = svc._active_visit(person["obj"].id if person["type"] == "member" else None,
                                person["obj"].id if person["type"] == "trainer" else None)
        if not own or (req.attendance_id and req.attendance_id != own.id):
            raise HTTPException(status_code=404, detail="No active check-in session found to check out.")
        return svc.check_out(attendance_id=own.id, checkout_type="MANUAL")

    if tenant.role == "TRAINER":
        is_marking_other = bool(req.member_id)
        if not is_marking_other and req.attendance_id and has_permission(db, tenant, "attendance.record"):
            att_row = db.query(Attendance).filter(Attendance.workspace_id == tenant.workspace_id, Attendance.id == req.attendance_id).first()
            if att_row and att_row.member_id:
                is_marking_other = True

        if is_marking_other:
            _require(db, tenant, "attendance.record")
            return svc.check_out(
                attendance_id=req.attendance_id,
                member_id=req.member_id,
                checkout_type=req.checkout_type if req.checkout_type in ("MANUAL", "STAFF") else "STAFF",
                actor_user_id=tenant.user_id,
            )

        person = svc._resolve_person(user_id=tenant.user_id)
        if not person:
            raise HTTPException(status_code=404, detail="No active check-in session found to check out.")
        own = svc._active_visit(None, person["obj"].id)
        if not own or (req.attendance_id and req.attendance_id != own.id):
            raise HTTPException(status_code=404, detail="No active check-in session found to check out.")
        return svc.check_out(attendance_id=own.id, checkout_type="MANUAL")

    _require(db, tenant, "attendance.record")
    return svc.check_out(
        attendance_id=req.attendance_id,
        member_id=req.member_id,
        checkout_type=req.checkout_type if req.checkout_type in ("MANUAL", "STAFF") else "STAFF",
        actor_user_id=tenant.user_id,
    )


@router.post("/scan-qr")
def scan_qr_toggle(
    req: CheckInRequest,
    tenant: TenantContext = Depends(require_permission("attendance.record")),
    db: Session = Depends(get_db),
):
    """
    Front-desk scanner: accepts a signed member pass (preferred), a member/trainer ID, phone or email.
    Checks the person out if they're inside, otherwise checks them in through the same rules as /check-in.
    """
    svc = AttendanceService(db, tenant.workspace_id)
    target = _resolve_scan_target(db, tenant, req)
    person = svc._resolve_person(identifier=target["identifier"], member_id=target["member_id"], trainer_id=target["trainer_id"])
    if not person:
        _count_invalid_scan(tenant)
        raise HTTPException(status_code=404, detail="No matching member or trainer found in this gym workspace.")

    m_id = person["obj"].id if person["type"] == "member" else None
    t_id = person["obj"].id if person["type"] == "trainer" else None
    name = person["obj"].first_name if person["type"] == "member" else person["obj"].name
    active = svc._active_visit(m_id, t_id)
    if active:
        rec = svc.check_out(attendance_id=active.id, checkout_type="STAFF", actor_user_id=tenant.user_id)
        return {
            "status": "success",
            "action": "check_out",
            "person_name": name,
            "person_type": person["type"],
            "message": f"Goodbye, {name}! Visit duration: {rec.duration_formatted}.",
            "record": {
                "id": rec.id,
                "check_in_time": rec.check_in_time.isoformat(),
                "check_out_time": rec.check_out_time.isoformat() if rec.check_out_time else None,
                "duration_formatted": rec.duration_formatted,
            },
        }

    rec = svc.check_in(
        member_id=m_id,
        trainer_id=t_id,
        qr_token=req.qr_token,
        gym_location_id=req.gym_location_id,
        method=req.method,
        terminal_id=req.terminal_id,
        actor_user_id=tenant.user_id,
        override_reason=req.override_reason,
        can_override=has_permission(db, tenant, "attendance.override"),
        pass_jti=target["jti"],
    )
    return {
        "status": "success",
        "action": "check_in",
        "person_name": rec.person_name,
        "person_type": person["type"],
        "overridden": bool(rec.override_reason),
        "message": f"Welcome, {rec.person_name}! Checked in at {rec.check_in_time.strftime('%I:%M %p')}.",
        "record": {
            "id": rec.id,
            "check_in_time": rec.check_in_time.isoformat(),
            "duration_formatted": rec.duration_formatted,
        },
    }


@router.get("/eligibility")
def check_access_eligibility(
    member_id: Optional[str] = Query(None),
    identifier: Optional[str] = Query(None),
    tenant: TenantContext = Depends(require_permission("attendance.record")),
    db: Session = Depends(get_db),
):
    """Front-desk preview: who is this, are they inside, and would a check-in be allowed (with reason)?"""
    svc = AttendanceService(db, tenant.workspace_id)
    req = CheckInRequest(member_id=member_id, identifier=identifier)
    target = _resolve_scan_target(db, tenant, req)
    person = svc._resolve_person(identifier=target["identifier"], member_id=target["member_id"])
    if not person or person["type"] != "member":
        _count_invalid_scan(tenant)
        raise HTTPException(status_code=404, detail="No matching member found in this gym.")
    m: Member = person["obj"]
    decision = svc.evaluate_access(person)
    active = svc._active_visit(m.id, None)
    last = db.query(Attendance).filter(
        Attendance.workspace_id == tenant.workspace_id, Attendance.member_id == m.id
    ).order_by(Attendance.check_in_time.desc()).first()
    return {
        "member": {
            "id": m.id,
            "name": f"{m.first_name} {m.last_name or ''}".strip(),
            "phone": m.phone,
            "avatar_url": m.avatar_url,
            "status": m.status.value,
            "plan_name": m.plan_name if m.memberships else None,
        },
        "decision": decision.as_dict(),
        "can_override": has_permission(db, tenant, "attendance.override"),
        "active_visit": {"id": active.id, "check_in_time": active.check_in_time.isoformat()} if active else None,
        "last_visit": {
            "check_in_time": last.check_in_time.isoformat(),
            "check_out_time": last.check_out_time.isoformat() if last.check_out_time else None,
            "method": last.method.value,
        } if last else None,
    }


@router.get("/member/me/pass")
def get_my_member_pass(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Short-lived signed QR pass for the signed-in member. Refresh before `expires_at`."""
    member = get_or_create_member_for_user(db, tenant.workspace_id, tenant.user_id)
    return member_pass.issue_pass(member.id, tenant.workspace_id)


@router.post("/{attendance_id}/correct", response_model=AttendanceResponse)
def correct_attendance_record(
    attendance_id: str,
    data: AttendanceCorrectionRequest,
    tenant: TenantContext = Depends(require_permission("attendance.correct")),
    db: Session = Depends(get_db),
):
    svc = AttendanceService(db, tenant.workspace_id)
    return svc.correct_attendance(attendance_id, tenant.user_id, data.reason, data.check_in_time, data.check_out_time)


@router.get("/{attendance_id}/corrections", response_model=List[AttendanceCorrectionResponse])
def list_attendance_corrections(
    attendance_id: str,
    tenant: TenantContext = Depends(require_permission("attendance.view")),
    db: Session = Depends(get_db),
):
    record = db.query(Attendance).filter(
        Attendance.workspace_id == tenant.workspace_id, Attendance.id == attendance_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found.")
    return db.query(AttendanceCorrection).filter(
        AttendanceCorrection.workspace_id == tenant.workspace_id,
        AttendanceCorrection.attendance_id == attendance_id,
    ).order_by(AttendanceCorrection.created_at.desc()).all()


@router.post("/auto-checkout")
def trigger_auto_checkout(
    tenant: TenantContext = Depends(require_permission("attendance.record")),
    db: Session = Depends(get_db),
):
    """
    Run the smart auto checkout engine. Checks sessions exceeding max duration or past closing time.
    """
    svc = AttendanceService(db, tenant.workspace_id)
    count = svc.run_smart_auto_checkout()
    return {
        "status": "success",
        "auto_checked_out_sessions": count,
        "message": f"Processed auto-checkout for {count} sessions based on gym closing hours and maximum duration limit.",
    }


@router.get("/summary", response_model=AttendanceSummary)
def get_attendance_summary(
    gym_location_id: Optional[str] = Query(None),
    tenant: TenantContext = Depends(require_permission("attendance.view")),
    db: Session = Depends(get_db),
):
    """
    Get live overview metrics for gym owner dashboard.
    """
    svc = AttendanceService(db, tenant.workspace_id)
    return svc.get_owner_summary(gym_location_id=gym_location_id)


@router.get("/currently-inside", response_model=List[CurrentlyInsideMember])
def get_currently_inside(
    gym_location_id: Optional[str] = Query(None),
    tenant: TenantContext = Depends(require_permission("attendance.view")),
    db: Session = Depends(get_db),
):
    """
    Get live list of members currently inside the facility.
    """
    svc = AttendanceService(db, tenant.workspace_id)
    return svc.get_currently_inside(gym_location_id=gym_location_id)


@router.get("/history", response_model=List[AttendanceResponse])
def get_attendance_history(
    search: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    status: Optional[str] = Query(None),  # "all", "in", "out", "auto"
    checkout_type: Optional[str] = Query(None),
    gym_location_id: Optional[str] = Query(None),
    member_id: Optional[str] = Query(None),
    method: Optional[AttendanceMethod] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    tenant: TenantContext = Depends(require_permission("attendance.view")),
    db: Session = Depends(get_db),
):
    """
    Searchable, filterable attendance history logs.
    """
    svc = AttendanceService(db, tenant.workspace_id)
    records = svc.get_attendance_history(
        search=search,
        date_from=date_from,
        date_to=date_to,
        status_filter=status,
        checkout_type=checkout_type,
        gym_location_id=gym_location_id,
        member_id=member_id,
        method=method,
        skip=skip,
        limit=limit,
    )
    return records


@router.get("/history/page", response_model=AttendanceHistoryPage)
def get_attendance_history_page(
    search: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    gym_location_id: Optional[str] = Query(None),
    member_id: Optional[str] = Query(None),
    method: Optional[AttendanceMethod] = Query(None),
    sort: str = Query("-check_in_time", pattern="^-?(check_in_time|check_out_time|duration_minutes)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    tenant: TenantContext = Depends(require_permission("attendance.view")),
    db: Session = Depends(get_db),
):
    """Paginated history with total count. Dates are the gym's local calendar days."""
    svc = AttendanceService(db, tenant.workspace_id)
    items, total = svc.get_attendance_history_page(
        search=search, date_from=date_from, date_to=date_to, status_filter=status,
        gym_location_id=gym_location_id, member_id=member_id, method=method, sort=sort,
        skip=(page - 1) * page_size, limit=page_size,
    )
    return AttendanceHistoryPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/export-csv")
def export_attendance_csv(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    gym_location_id: Optional[str] = Query(None),
    tenant: TenantContext = Depends(require_permission("attendance.export")),
    db: Session = Depends(get_db),
):
    """
    Exports filtered attendance logs as a CSV file for authorized gym owners.
    """
    svc = AttendanceService(db, tenant.workspace_id)
    records = svc.get_attendance_history(
        date_from=date_from,
        date_to=date_to,
        status_filter=status,
        gym_location_id=gym_location_id,
        limit=5000,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Record ID",
        "Person Name",
        "Person Type",
        "Check-In Time (UTC)",
        "Check-Out Time (UTC)",
        "Duration (Minutes)",
        "Duration Formatted",
        "Method",
        "Checkout Type",
        "Status",
        "Terminal ID",
    ])

    for r in records:
        writer.writerow([
            r.id,
            r.person_name,
            r.person_type,
            r.check_in_time.isoformat() if r.check_in_time else "",
            r.check_out_time.isoformat() if r.check_out_time else "",
            r.duration_minutes or 0,
            r.duration_formatted or "",
            r.method.value if hasattr(r.method, "value") else str(r.method),
            r.checkout_type or "MANUAL",
            r.status or ("CHECKED_OUT" if r.check_out_time else "CHECKED_IN"),
            r.terminal_id or "",
        ])

    record_audit(db, tenant.workspace_id, tenant.user_id, "attendance.exported", resource_type="attendance",
                 details={"rows": len(records), "date_from": date_from, "date_to": date_to})
    db.commit()

    csv_data = output.getvalue()
    filename = f"attendance-{tenant.workspace_id[:8]}-{date.today().isoformat()}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/analytics", response_model=AttendanceAnalyticsResponse)
def get_attendance_analytics(
    days: int = Query(30, ge=7, le=90),
    tenant: TenantContext = Depends(require_permission("attendance.view")),
    db: Session = Depends(get_db),
):
    """
    Attendance analytics including peak hours, day of week distribution, and retention risks.
    """
    svc = AttendanceService(db, tenant.workspace_id)
    return svc.get_attendance_analytics(days=days)


# ─── QR CODE MANAGEMENT ───────────────────────────────────────────────

@router.get("/qr", response_model=AttendanceQRResponse)
def get_active_qr_code(
    gym_location_id: Optional[str] = Query(None),
    tenant: TenantContext = Depends(require_permission("attendance.view")),
    db: Session = Depends(get_db),
):
    """
    Get the currently active QR code for gym check-in.
    """
    svc = AttendanceService(db, tenant.workspace_id)
    return svc.get_active_qr(gym_location_id=gym_location_id)


@router.post("/qr/generate", response_model=AttendanceQRResponse)
def generate_or_rotate_qr_code(
    req: AttendanceQRGenerateRequest = AttendanceQRGenerateRequest(),
    tenant: TenantContext = Depends(require_permission("attendance.configure")),
    db: Session = Depends(get_db),
):
    """
    Generate or rotate a secure random QR code. Instantly invalidates previous active QR.
    """
    svc = AttendanceService(db, tenant.workspace_id)
    return svc.generate_or_rotate_qr(
        user_id=tenant.user_id,
        gym_location_id=req.gym_location_id,
        label=req.label or "Main Entrance QR",
        expires_in_hours=req.expires_in_hours,
    )


@router.post("/qr/{qr_id}/toggle", response_model=AttendanceQRResponse)
def toggle_qr_code_status(
    qr_id: str,
    req: AttendanceQRToggleRequest,
    tenant: TenantContext = Depends(require_permission("attendance.configure")),
    db: Session = Depends(get_db),
):
    """
    Activate or deactivate a specific QR code instantly.
    """
    svc = AttendanceService(db, tenant.workspace_id)
    return svc.toggle_qr_status(qr_id, req.is_active)


# ─── OWNER SETTINGS ───────────────────────────────────────────────────

@router.get("/settings", response_model=AttendanceSettingsSchema)
def get_attendance_settings(
    gym_location_id: Optional[str] = Query(None),
    tenant: TenantContext = Depends(require_permission("attendance.view")),
    db: Session = Depends(get_db),
):
    """
    Get gym attendance policy settings (max duration, closing time, auto-checkout).
    """
    svc = AttendanceService(db, tenant.workspace_id)
    return svc.get_or_create_settings(gym_location_id=gym_location_id)


@router.put("/settings", response_model=AttendanceSettingsSchema)
def update_attendance_settings(
    req: AttendanceSettingsUpdate,
    gym_location_id: Optional[str] = Query(None),
    tenant: TenantContext = Depends(require_permission("attendance.configure")),
    db: Session = Depends(get_db),
):
    """
    Update gym attendance settings.
    """
    svc = AttendanceService(db, tenant.workspace_id)
    changes = req.model_dump(exclude_unset=True)
    record_audit(db, tenant.workspace_id, tenant.user_id, "attendance.settings_updated",
                 resource_type="attendance_settings", resource_id=gym_location_id, details={"changes": changes})
    return svc.update_settings(changes, gym_location_id=gym_location_id)


# ─── MEMBER PERSONAL ATTENDANCE ───────────────────────────────────────

@router.get("/member/me", response_model=MemberPersonalAttendanceResponse)
def get_my_personal_attendance(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """
    Get personal attendance stats, streak, calendar visits, and current session for logged in member.
    """
    svc = AttendanceService(db, tenant.workspace_id)
    person = svc._resolve_person(user_id=tenant.user_id)
    if not person or person["type"] != "member":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not linked to your user account.",
        )
    return svc.get_member_personal_stats(person["obj"].id)


@router.get("/member/{member_id}", response_model=MemberPersonalAttendanceResponse)
def get_member_attendance_profile(
    member_id: str,
    tenant: TenantContext = Depends(require_permission("attendance.view")),
    db: Session = Depends(get_db),
):
    """
    Get personal attendance profile for a specific member (owner or member view).
    """
    svc = AttendanceService(db, tenant.workspace_id)
    return svc.get_member_personal_stats(member_id)


# ─── LOCATIONS ────────────────────────────────────────────────────────

@router.get("/locations", response_model=List[GymLocationSchema])
def get_gym_locations(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """
    Get available branches/locations for this gym.
    """
    from app.services.organization import OrganizationService

    svc = AttendanceService(db, tenant.workspace_id)
    allowed = OrganizationService(db).accessible_branch_ids(tenant)
    return [loc for loc in svc.get_locations() if allowed is None or loc.id in allowed]


# ─── BACKWARD COMPATIBLE BASE LIST ────────────────────────────────────

@router.get("", response_model=List[AttendanceResponse])
@router.get("/", response_model=List[AttendanceResponse], include_in_schema=False)
@router.get("/check-in", response_model=List[AttendanceResponse], include_in_schema=False)
def list_attendance(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """
    List attendance for current tenant role (owner sees today's stream, member sees own).
    """
    svc = AttendanceService(db, tenant.workspace_id)
    if _is_self_service(tenant):
        person = svc._resolve_person(user_id=tenant.user_id)
        if not person:
            return []
        if person["type"] == "member":
            return svc.get_attendance_history(member_id=person["obj"].id, limit=50)
        return svc.get_attendance_history(trainer_id=person["obj"].id, limit=50)
    _require(db, tenant, "attendance.view")
    return svc.get_attendance_history(limit=50)
