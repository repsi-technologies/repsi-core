"""
Support requests from gyms to the REPSI team.

Gym side (`/support/tickets`, permission `support.manage`: owners and admins by default): raise a
ticket, reply, and close it. Platform side (`/superadmin/support/tickets`, super admins only): queue
with filters, assignment, replies, internal notes and resolution. Every change is audited and the
other side gets an in-app notification.
"""
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.database import get_db
from app.core.permissions import require_permission
from app.middleware.tenant import TenantContext, get_current_tenant
from app.models.support import TICKET_STATUSES, SupportMessage, SupportTicket
from app.models.system import Notification
from app.models.user import User, UserRole, Workspace, WorkspaceMember
from app.services.finance_ops import next_number

router = APIRouter(prefix="/support", tags=["Support"])
admin_router = APIRouter(prefix="/superadmin/support", tags=["Super Admin"])

Category = Literal["billing", "technical", "account", "feature_request", "data", "other"]
Priority = Literal["low", "normal", "high", "urgent"]
PLATFORM = "platform"


class TicketCreate(BaseModel):
    subject: str = Field(min_length=4, max_length=200)
    category: Category = "other"
    priority: Priority = "normal"
    message: str = Field(min_length=5, max_length=10_000)


class Reply(BaseModel):
    message: str = Field(min_length=1, max_length=10_000)


class AdminReply(Reply):
    internal: bool = False


class AdminUpdate(BaseModel):
    status: Optional[Literal["open", "in_progress", "waiting_on_customer", "resolved", "closed"]] = None
    priority: Optional[Priority] = None
    assign_to_me: Optional[bool] = None
    resolution: Optional[str] = Field(default=None, max_length=5000)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _view(db: Session, t: SupportTicket, include_internal: bool, with_messages: bool = False) -> dict:
    out = {
        "id": t.id, "number": t.number, "workspace_id": t.workspace_id, "subject": t.subject, "category": t.category,
        "priority": t.priority, "status": t.status, "created_by_user_id": t.created_by_user_id,
        "assigned_to_user_id": t.assigned_to_user_id, "resolution": t.resolution, "resolved_at": t.resolved_at,
        "first_response_at": t.first_response_at, "last_activity_at": t.last_activity_at, "created_at": t.created_at,
    }
    if with_messages:
        q = select(SupportMessage).where(SupportMessage.ticket_id == t.id)
        if not include_internal:
            q = q.where(SupportMessage.internal.is_(False))
        msgs = db.scalars(q.order_by(SupportMessage.created_at)).all()
        authors = {u.id: u.full_name for u in db.scalars(select(User).where(User.id.in_({m.author_user_id for m in msgs}))).all()} if msgs else {}
        out["messages"] = [{"id": m.id, "body": m.body, "from_support": m.from_support, "internal": m.internal,
                            "author": "REPSI Support" if m.from_support and not include_internal else authors.get(m.author_user_id),
                            "created_at": m.created_at} for m in msgs]
    return out


def _notify_gym_admins(db: Session, ticket: SupportTicket, title: str, message: str) -> None:
    for wm in db.scalars(select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == ticket.workspace_id, WorkspaceMember.is_active.is_(True),
            WorkspaceMember.role.in_((UserRole.OWNER, UserRole.ADMIN)))).all():
        db.add(Notification(workspace_id=ticket.workspace_id, user_id=wm.user_id, title=title, message=message,
                            action_url="/settings/support", is_read=False))


def _notify_support(db: Session, ticket: SupportTicket, title: str, message: str) -> None:
    targets = [ticket.assigned_to_user_id] if ticket.assigned_to_user_id else list(
        db.scalars(select(User.id).where(User.is_superadmin.is_(True), User.is_active.is_(True))).all())
    for uid in targets:
        db.add(Notification(workspace_id=PLATFORM, user_id=uid, title=title, message=message,
                            action_url=f"/superadmin/support/{ticket.id}", is_read=False))


# ─── Gym side ──────────────────────────────────────────────────────────


def _own_ticket(db: Session, tenant: TenantContext, ticket_id: str) -> SupportTicket:
    t = db.scalar(select(SupportTicket).where(SupportTicket.workspace_id == tenant.workspace_id, SupportTicket.id == ticket_id))
    if t is None:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    return t


@router.post("/tickets", status_code=status.HTTP_201_CREATED)
def create_ticket(data: TicketCreate, tenant: TenantContext = Depends(require_permission("support.manage")),
                  db: Session = Depends(get_db)):
    now = _now()
    t = SupportTicket(workspace_id=tenant.workspace_id, number=f"SUP-{next_number(db, PLATFORM, 'support_ticket'):06d}",
                      subject=data.subject.strip(), category=data.category, priority=data.priority, status="open",
                      created_by_user_id=tenant.user_id, last_activity_at=now)
    db.add(t)
    db.flush()
    db.add(SupportMessage(workspace_id=tenant.workspace_id, ticket_id=t.id, author_user_id=tenant.user_id, body=data.message))
    ws = db.get(Workspace, tenant.workspace_id)
    _notify_support(db, t, f"New support ticket {t.number}", f"{ws.name if ws else 'A gym'}: {t.subject}")
    record_audit(db, tenant.workspace_id, tenant.user_id, "support_ticket_created", resource_type="support_ticket",
                 resource_id=t.id, details={"number": t.number, "category": t.category, "priority": t.priority})
    db.commit()
    return _view(db, t, include_internal=False, with_messages=True)


@router.get("/tickets")
def list_tickets(status_filter: Optional[str] = Query(default=None, alias="status"),
                 tenant: TenantContext = Depends(require_permission("support.manage")), db: Session = Depends(get_db)):
    q = select(SupportTicket).where(SupportTicket.workspace_id == tenant.workspace_id)
    if status_filter:
        q = q.where(SupportTicket.status == status_filter)
    return [_view(db, t, False) for t in db.scalars(q.order_by(SupportTicket.last_activity_at.desc()).limit(200)).all()]


@router.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: str, tenant: TenantContext = Depends(require_permission("support.manage")),
               db: Session = Depends(get_db)):
    return _view(db, _own_ticket(db, tenant, ticket_id), include_internal=False, with_messages=True)


@router.post("/tickets/{ticket_id}/messages", status_code=status.HTTP_201_CREATED)
def reply_to_ticket(ticket_id: str, data: Reply, tenant: TenantContext = Depends(require_permission("support.manage")),
                    db: Session = Depends(get_db)):
    t = _own_ticket(db, tenant, ticket_id)
    if t.status == "closed":
        raise HTTPException(status_code=409, detail="This ticket is closed. Open a new one.")
    db.add(SupportMessage(workspace_id=t.workspace_id, ticket_id=t.id, author_user_id=tenant.user_id, body=data.message))
    t.last_activity_at = _now()
    if t.status in ("waiting_on_customer", "resolved"):
        t.status = "open"
    _notify_support(db, t, f"Reply on {t.number}", data.message[:200])
    db.commit()
    return _view(db, t, include_internal=False, with_messages=True)


@router.post("/tickets/{ticket_id}/close")
def close_ticket(ticket_id: str, tenant: TenantContext = Depends(require_permission("support.manage")),
                 db: Session = Depends(get_db)):
    t = _own_ticket(db, tenant, ticket_id)
    t.status, t.last_activity_at = "closed", _now()
    record_audit(db, tenant.workspace_id, tenant.user_id, "support_ticket_closed", resource_type="support_ticket", resource_id=t.id)
    db.commit()
    return _view(db, t, include_internal=False)


# ─── Platform side ─────────────────────────────────────────────────────


def _require_superadmin(tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)) -> TenantContext:
    user = db.get(User, tenant.user_id)
    if tenant.role != "SUPER_ADMIN" or user is None or not user.is_superadmin:
        raise HTTPException(status_code=403, detail="Super admin access required.")
    return tenant


@admin_router.get("/tickets")
def admin_list_tickets(
    response: Response,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    priority: Optional[str] = None,
    workspace_id: Optional[str] = None,
    mine: bool = False,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    tenant: TenantContext = Depends(_require_superadmin),
    db: Session = Depends(get_db),
):
    q = select(SupportTicket)
    if status_filter:
        q = q.where(SupportTicket.status == status_filter)
    if priority:
        q = q.where(SupportTicket.priority == priority)
    if workspace_id:
        q = q.where(SupportTicket.workspace_id == workspace_id)
    if mine:
        q = q.where(SupportTicket.assigned_to_user_id == tenant.user_id)
    response.headers["X-Total-Count"] = str(db.scalar(select(func.count()).select_from(q.subquery())) or 0)
    rows = db.scalars(q.order_by(SupportTicket.last_activity_at.desc()).offset(offset).limit(limit)).all()
    names = {w.id: w.name for w in db.scalars(select(Workspace).where(Workspace.id.in_({t.workspace_id for t in rows}))).all()} if rows else {}
    return [{**_view(db, t, True), "workspace_name": names.get(t.workspace_id)} for t in rows]


@admin_router.get("/stats")
def admin_ticket_stats(tenant: TenantContext = Depends(_require_superadmin), db: Session = Depends(get_db)):
    by_status = dict(db.execute(select(SupportTicket.status, func.count(SupportTicket.id)).group_by(SupportTicket.status)).all())
    return {"by_status": {s: by_status.get(s, 0) for s in TICKET_STATUSES},
            "open_urgent": db.scalar(select(func.count(SupportTicket.id)).where(
                SupportTicket.priority == "urgent", SupportTicket.status.in_(("open", "in_progress")))) or 0}


@admin_router.get("/tickets/{ticket_id}")
def admin_get_ticket(ticket_id: str, tenant: TenantContext = Depends(_require_superadmin), db: Session = Depends(get_db)):
    t = db.get(SupportTicket, ticket_id)
    if t is None:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    return _view(db, t, include_internal=True, with_messages=True)


@admin_router.post("/tickets/{ticket_id}/messages", status_code=status.HTTP_201_CREATED)
def admin_reply(ticket_id: str, data: AdminReply, tenant: TenantContext = Depends(_require_superadmin),
                db: Session = Depends(get_db)):
    t = db.get(SupportTicket, ticket_id)
    if t is None:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    now = _now()
    db.add(SupportMessage(workspace_id=t.workspace_id, ticket_id=t.id, author_user_id=tenant.user_id,
                          from_support=True, internal=data.internal, body=data.message))
    if not data.internal:
        t.first_response_at = t.first_response_at or now
        t.last_activity_at = now
        if t.status == "open":
            t.status = "in_progress"
        _notify_gym_admins(db, t, f"REPSI Support replied on {t.number}", data.message[:200])
    db.commit()
    return _view(db, t, include_internal=True, with_messages=True)


@admin_router.patch("/tickets/{ticket_id}")
def admin_update_ticket(ticket_id: str, data: AdminUpdate, tenant: TenantContext = Depends(_require_superadmin),
                        db: Session = Depends(get_db)):
    t = db.get(SupportTicket, ticket_id)
    if t is None:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    changes = {}
    if data.priority:
        changes["priority"], t.priority = data.priority, data.priority
    if data.assign_to_me is not None:
        t.assigned_to_user_id = tenant.user_id if data.assign_to_me else None
        changes["assigned_to"] = t.assigned_to_user_id
    if data.resolution is not None:
        t.resolution = data.resolution
    if data.status:
        if data.status == "resolved" and not (data.resolution or t.resolution):
            raise HTTPException(status_code=422, detail="Add a resolution note before resolving the ticket.")
        changes["status"], t.status = data.status, data.status
        if data.status == "resolved":
            t.resolved_at = _now()
            _notify_gym_admins(db, t, f"{t.number} resolved", (t.resolution or "")[:200])
    t.last_activity_at = _now()
    record_audit(db, t.workspace_id, tenant.user_id, "support_ticket_updated", resource_type="support_ticket",
                 resource_id=t.id, details=changes)
    db.commit()
    return _view(db, t, include_internal=True, with_messages=True)
