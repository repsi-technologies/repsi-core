"""
Member account status rules.

Account status (Member.status) controls gym/app access. It is separate from membership
validity: an expired membership does not change the account status.

  active     — normal access
  inactive   — no current relationship with the gym (left, lapsed); no access
  suspended  — access blocked by staff (e.g. policy violation); reason required
  archived   — hidden from the default directory; record retained; reason required

Older rows may still carry membership-style values (expiring/expired/frozen/cancelled)
written by previous versions; they may move to any account status.
"""
import json
from typing import Optional

from fastapi import HTTPException, status as http_status
from sqlalchemy.orm import Session

from app.models.member import Member, MemberStatus
from app.models.member_records import MemberEvent
from app.models.user import WorkspaceMember

ACCOUNT_STATUSES = {MemberStatus.ACTIVE, MemberStatus.INACTIVE, MemberStatus.SUSPENDED, MemberStatus.ARCHIVED}

ALLOWED_TRANSITIONS = {
    MemberStatus.ACTIVE: {MemberStatus.INACTIVE, MemberStatus.SUSPENDED, MemberStatus.ARCHIVED},
    MemberStatus.INACTIVE: {MemberStatus.ACTIVE, MemberStatus.SUSPENDED, MemberStatus.ARCHIVED},
    MemberStatus.SUSPENDED: {MemberStatus.ACTIVE, MemberStatus.INACTIVE, MemberStatus.ARCHIVED},
    MemberStatus.ARCHIVED: {MemberStatus.ACTIVE, MemberStatus.INACTIVE},
}

REASON_REQUIRED = {MemberStatus.SUSPENDED, MemberStatus.ARCHIVED}

# Suspending, archiving and restoring from archive are restricted to management roles.
MANAGEMENT_ROLES = {"OWNER", "ADMIN", "MANAGER", "SUPER_ADMIN"}


def record_member_event(
    db: Session,
    member: Member,
    event_type: str,
    actor_user_id: Optional[str],
    *,
    from_status: Optional[str] = None,
    to_status: Optional[str] = None,
    reason: Optional[str] = None,
    details: Optional[dict] = None,
) -> MemberEvent:
    event = MemberEvent(
        workspace_id=member.workspace_id,
        member_id=member.id,
        actor_user_id=actor_user_id,
        event_type=event_type,
        from_status=from_status,
        to_status=to_status,
        reason=reason,
        details=json.dumps(details) if details else None,
    )
    db.add(event)
    return event


def allowed_targets(current: MemberStatus) -> set:
    if current not in ACCOUNT_STATUSES:
        return set(ACCOUNT_STATUSES)
    return ALLOWED_TRANSITIONS[current]


def change_member_status(
    db: Session,
    member: Member,
    new_status: MemberStatus,
    actor_user_id: str,
    actor_role: str,
    reason: Optional[str] = None,
) -> Member:
    """Validates and applies an account status change. Caller commits."""
    current = member.status
    if new_status not in ACCOUNT_STATUSES:
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"'{new_status.value}' is not an account status. Use the membership freeze/cancel actions for membership changes.",
        )
    if new_status == current:
        raise HTTPException(status_code=http_status.HTTP_409_CONFLICT, detail=f"Member is already {current.value}.")
    if new_status not in allowed_targets(current):
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail=f"Cannot change member status from {current.value} to {new_status.value}.",
        )
    clean_reason = (reason or "").strip() or None
    if new_status in REASON_REQUIRED and not clean_reason:
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"A reason is required to mark a member {new_status.value}.",
        )
    needs_management = new_status in REASON_REQUIRED or current == MemberStatus.ARCHIVED
    if needs_management and actor_role not in MANAGEMENT_ROLES:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Only owners, admins and managers can suspend, archive or restore members.",
        )
    if new_status == MemberStatus.ACTIVE:
        # Reactivation consumes an active-member slot; never let it bypass the plan quota.
        from app.middleware.entitlements import assert_capacity
        assert_capacity(db, member.workspace_id, "members")

    member.status = new_status
    if member.user_id:
        ws_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == member.workspace_id,
            WorkspaceMember.user_id == member.user_id,
        ).first()
        if ws_member:
            ws_member.is_active = new_status == MemberStatus.ACTIVE

    record_member_event(
        db, member, "status_changed", actor_user_id,
        from_status=current.value, to_status=new_status.value, reason=clean_reason,
    )
    return member
