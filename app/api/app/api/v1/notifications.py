from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from typing import Optional

from app.core.database import get_db
from app.middleware.tenant import get_current_tenant, TenantContext
from app.models.system import Notification
from app.models.user import WorkspaceMember
from app.schemas.communication import PreferencesResponse, PreferencesUpdate
from app.services import communication as comms
from app.schemas.notification import (
    NotificationResponse,
    NotificationCreate,
    NotificationListResponse,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])

STAFF_SENDER_ROLES = ("OWNER", "ADMIN", "MANAGER", "STAFF", "SUPER_ADMIN")


@router.get("/preferences", response_model=PreferencesResponse)
def get_my_preferences(tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    """The caller's channel preferences in this workspace (defaults when never saved)."""
    return comms.get_preferences(db, tenant.workspace_id, tenant.user_id)


@router.put("/preferences", response_model=PreferencesResponse)
def update_my_preferences(
    data: PreferencesUpdate,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Opt in/out per channel. Turning WhatsApp on records the consent timestamp; off clears it immediately."""
    return comms.update_preferences(db, tenant.workspace_id, tenant.user_id, data.model_dump(exclude_unset=True))


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """
    List notifications for current authenticated user in their tenant workspace.
    Strictly isolated by workspace_id and user_id.
    """
    base_query = select(Notification).where(
        Notification.workspace_id == tenant.workspace_id,
        Notification.user_id == tenant.user_id,
    )

    total_query = select(func.count(Notification.id)).where(
        Notification.workspace_id == tenant.workspace_id,
        Notification.user_id == tenant.user_id,
    )
    total = db.scalar(total_query) or 0

    unread_query = select(func.count(Notification.id)).where(
        Notification.workspace_id == tenant.workspace_id,
        Notification.user_id == tenant.user_id,
        Notification.is_read.is_(False),
    )
    unread_count = db.scalar(unread_query) or 0

    offset = (page - 1) * page_size
    items_query = (
        base_query.order_by(desc(Notification.created_at))
        .offset(offset)
        .limit(page_size)
    )
    items = db.scalars(items_query).all()

    return NotificationListResponse(
        items=items,
        total=total,
        unread_count=unread_count,
    )


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    data: NotificationCreate,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """
    Create a notification scoped to current workspace (staff only).
    Recipient defaults to caller; any other recipient must be an active member of this workspace.
    """
    if tenant.role not in STAFF_SENDER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only staff can create notifications.")
    recipient_id = data.user_id or tenant.user_id
    if recipient_id != tenant.user_id:
        in_workspace = db.scalar(select(WorkspaceMember.id).where(
            WorkspaceMember.workspace_id == tenant.workspace_id,
            WorkspaceMember.user_id == recipient_id,
            WorkspaceMember.is_active == True,
        ))
        if not in_workspace:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient not found in this workspace.")
    notif = Notification(
        workspace_id=tenant.workspace_id,
        user_id=recipient_id,
        title=data.title,
        message=data.message,
        action_url=data.action_url,
        is_read=False,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@router.patch("/{id}/read", response_model=NotificationResponse)
def mark_notification_read(
    id: str,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """
    Mark a specific notification as read.
    """
    notif = db.scalar(
        select(Notification).where(
            Notification.id == id,
            Notification.workspace_id == tenant.workspace_id,
            Notification.user_id == tenant.user_id,
        )
    )
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.post("/mark-all-read")
def mark_all_notifications_read(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """
    Mark all unread notifications as read for current user.
    """
    notifications = db.scalars(
        select(Notification).where(
            Notification.workspace_id == tenant.workspace_id,
            Notification.user_id == tenant.user_id,
            Notification.is_read.is_(False),
        )
    ).all()

    for notif in notifications:
        notif.is_read = True

    db.commit()
    return {"message": "All notifications marked as read", "updated_count": len(notifications)}
