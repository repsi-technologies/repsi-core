from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.database import get_db
from app.core.permissions import require_permission
from app.middleware.entitlements import require_feature
from app.middleware.tenant import TenantContext
from app.models.communication import Broadcast, MessageTemplate, NotificationDelivery
from app.schemas.communication import (
    Audience,
    AudiencePreview,
    BroadcastCreate,
    BroadcastListResponse,
    BroadcastResponse,
    DeliveryListResponse,
    DeliveryResponse,
    TemplateCreate,
    TemplateResponse,
    TemplateUpdate,
)
from app.services import communication as comms

broadcasts_router = APIRouter(prefix="/broadcasts", tags=["Communications"])
templates_router = APIRouter(prefix="/message-templates", tags=["Communications"])
deliveries_router = APIRouter(prefix="/notification-deliveries", tags=["Communications"])

manager = require_permission("communications.manage")
gated = [Depends(require_feature("member_broadcasts"))]


def _broadcast_out(db: Session, b: Broadcast) -> BroadcastResponse:
    out = BroadcastResponse.model_validate(b)
    out.summary = comms.delivery_summary(db, b.workspace_id, b.id)
    out.by_channel = comms.channel_summary(db, b.workspace_id, b.id)
    return out


def _owned_broadcast(db: Session, tenant: TenantContext, broadcast_id: str) -> Broadcast:
    b = db.scalar(select(Broadcast).where(Broadcast.id == broadcast_id, Broadcast.workspace_id == tenant.workspace_id))
    if b is None:
        raise HTTPException(status_code=404, detail="Broadcast not found.")
    return b


@broadcasts_router.get("/segments")
def list_segments(tenant: TenantContext = Depends(manager)):
    return [{"key": k, "label": v} for k, v in comms.SEGMENTS.items()]


@broadcasts_router.post("/preview", response_model=AudiencePreview, dependencies=gated)
def preview_audience(audience: Audience, tenant: TenantContext = Depends(manager), db: Session = Depends(get_db)):
    recipients = comms.resolve_audience(db, tenant.workspace_id, audience.model_dump(exclude_none=True))
    return AudiencePreview(
        recipient_count=len(recipients),
        sample=[r.name for r in recipients[:8]],
        with_app_account=sum(1 for r in recipients if r.user_id),
        with_email=sum(1 for r in recipients if r.email),
        with_phone=sum(1 for r in recipients if r.phone),
    )


@broadcasts_router.post("", response_model=BroadcastResponse, status_code=status.HTTP_201_CREATED, dependencies=gated)
def create_broadcast(
    data: BroadcastCreate,
    background: BackgroundTasks,
    tenant: TenantContext = Depends(manager),
    db: Session = Depends(get_db),
):
    b = comms.create_broadcast(
        db, tenant.workspace_id, tenant.user_id,
        title=data.title.strip(), message=data.message.strip(), channels=list(dict.fromkeys(data.channels)),
        audience=data.audience.model_dump(exclude_none=True), template_id=data.template_id,
        action_url=data.action_url,
    )
    record_audit(
        db, tenant.workspace_id, tenant.user_id, "broadcast.sent", resource_type="broadcast", resource_id=b.id,
        details={"segment": data.audience.segment, "channels": b.channels, "recipients": b.recipient_count},
    )
    db.commit()
    if b.status == "sending":
        background.add_task(comms.dispatch_in_background, db.get_bind(), b.id)
    return _broadcast_out(db, b)


@broadcasts_router.get("", response_model=BroadcastListResponse)
def list_broadcasts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    tenant: TenantContext = Depends(manager),
    db: Session = Depends(get_db),
):
    base = select(Broadcast).where(Broadcast.workspace_id == tenant.workspace_id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(base.order_by(Broadcast.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return BroadcastListResponse(items=[_broadcast_out(db, b) for b in rows], total=total, page=page, page_size=page_size)


@broadcasts_router.get("/{broadcast_id}", response_model=BroadcastResponse)
def get_broadcast(broadcast_id: str, tenant: TenantContext = Depends(manager), db: Session = Depends(get_db)):
    return _broadcast_out(db, _owned_broadcast(db, tenant, broadcast_id))


@broadcasts_router.post("/{broadcast_id}/dispatch", response_model=BroadcastResponse, dependencies=gated)
def retry_dispatch(broadcast_id: str, tenant: TenantContext = Depends(manager), db: Session = Depends(get_db)):
    """Sends any still-queued deliveries now (e.g. after SMTP was configured or a worker restart)."""
    b = _owned_broadcast(db, tenant, broadcast_id)
    comms.dispatch_queued_deliveries(db, broadcast_id=b.id, limit=10_000)
    db.refresh(b)
    return _broadcast_out(db, b)


def _list_deliveries(db: Session, workspace_id: str, page: int, page_size: int, **filters) -> DeliveryListResponse:
    q = select(NotificationDelivery).where(NotificationDelivery.workspace_id == workspace_id)
    for column, value in filters.items():
        if value:
            q = q.where(getattr(NotificationDelivery, column) == value)
    total = db.scalar(select(func.count()).select_from(q.subquery())) or 0
    rows = db.scalars(q.order_by(NotificationDelivery.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return DeliveryListResponse(items=[DeliveryResponse.model_validate(r) for r in rows], total=total, page=page, page_size=page_size)


@broadcasts_router.get("/{broadcast_id}/deliveries", response_model=DeliveryListResponse)
def broadcast_deliveries(
    broadcast_id: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    channel: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    tenant: TenantContext = Depends(manager),
    db: Session = Depends(get_db),
):
    b = _owned_broadcast(db, tenant, broadcast_id)
    return _list_deliveries(db, tenant.workspace_id, page, page_size, broadcast_id=b.id, status=status_filter, channel=channel)


@deliveries_router.get("", response_model=DeliveryListResponse)
def list_deliveries(
    status_filter: Optional[str] = Query(None, alias="status"),
    channel: Optional[str] = None,
    event_type: Optional[str] = None,
    member_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    tenant: TenantContext = Depends(manager),
    db: Session = Depends(get_db),
):
    """Notification history and delivery log for the workspace."""
    return _list_deliveries(db, tenant.workspace_id, page, page_size, status=status_filter, channel=channel,
                            event_type=event_type, member_id=member_id)


@templates_router.get("", response_model=list[TemplateResponse])
def list_templates(
    include_inactive: bool = False,
    tenant: TenantContext = Depends(manager),
    db: Session = Depends(get_db),
):
    q = select(MessageTemplate).where(MessageTemplate.workspace_id == tenant.workspace_id)
    if not include_inactive:
        q = q.where(MessageTemplate.is_active == True)
    return db.scalars(q.order_by(MessageTemplate.name)).all()


@templates_router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(data: TemplateCreate, tenant: TenantContext = Depends(manager), db: Session = Depends(get_db)):
    return comms.create_template(db, tenant.workspace_id, tenant.user_id, data.model_dump())


@templates_router.patch("/{template_id}", response_model=TemplateResponse)
def update_template(
    template_id: str, data: TemplateUpdate, tenant: TenantContext = Depends(manager), db: Session = Depends(get_db),
):
    t = db.scalar(select(MessageTemplate).where(
        MessageTemplate.id == template_id, MessageTemplate.workspace_id == tenant.workspace_id))
    if t is None:
        raise HTTPException(status_code=404, detail="Message template not found.")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(t, key, value)
    if t.channel == "whatsapp" and not t.provider_template_name:
        raise HTTPException(status_code=422, detail="WhatsApp templates need the approved provider template name.")
    db.commit()
    db.refresh(t)
    return t
