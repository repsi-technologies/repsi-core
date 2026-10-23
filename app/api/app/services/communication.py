"""
Broadcasts, templates, preferences and delivery logging.

Flow: resolve the audience → write one NotificationDelivery per recipient and channel →
in-app rows are delivered immediately (a Notification insert), email/WhatsApp rows stay
`queued` and are sent by `dispatch_queued_deliveries` outside the request (BackgroundTasks
or a scheduled job). A delivery is only `sent` once the channel acknowledged it; missing
provider configuration is recorded as `skipped_not_configured`, never as sent.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Iterable, Optional
from zoneinfo import ZoneInfo

import httpx
from fastapi import HTTPException, status
from sqlalchemy import and_, exists, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.email import send_notification_email
from app.core.phone import mask_phone, normalize_phone
from app.models.communication import (
    Broadcast,
    MessageTemplate,
    NotificationDelivery,
    NotificationPreference,
)
from app.models.member import Member, MemberStatus, Membership
from app.models.system import Notification
from app.models.user import User, UserRole, Workspace, WorkspaceMember

logger = logging.getLogger(__name__)

SEGMENTS = {
    "all_members": "All active member accounts",
    "active_membership": "Members with a membership covering today",
    "expiring_soon": "Members whose membership ends within N days",
    "expired": "Members whose latest membership has ended",
    "new_members": "Members who joined within the last N days",
    "selected_members": "Hand-picked members",
    "trainers": "Trainers",
    "staff": "Admins, managers and front-desk staff",
}
MAX_SELECTED = 1000
DISPATCH_BATCH = 200
_PLACEHOLDER = re.compile(r"{{\s*(first_name|gym_name)\s*}}")


@dataclass
class Recipient:
    user_id: Optional[str]
    member_id: Optional[str]
    name: str
    first_name: str
    email: Optional[str]
    phone: Optional[str]


def workspace_today(ws: Optional[Workspace]) -> date:
    try:
        return datetime.now(ZoneInfo(ws.timezone)).date() if ws and ws.timezone else date.today()
    except Exception:
        return date.today()


def render(text: str, recipient: Recipient, gym_name: str) -> str:
    values = {"first_name": recipient.first_name or "there", "gym_name": gym_name}
    return _PLACEHOLDER.sub(lambda m: values[m.group(1)], text or "")


# ─── Audience ──────────────────────────────────────────────────────────


def resolve_audience(db: Session, workspace_id: str, audience: dict) -> list[Recipient]:
    segment = audience.get("segment")
    if segment not in SEGMENTS:
        raise HTTPException(status_code=422, detail=f"Unknown audience segment '{segment}'.")
    ws = db.get(Workspace, workspace_id)
    today = workspace_today(ws)
    days = int(audience.get("days") or 7)
    if days < 1 or days > 365:
        raise HTTPException(status_code=422, detail="days must be between 1 and 365.")

    if segment in ("trainers", "staff"):
        roles = [UserRole.TRAINER] if segment == "trainers" else [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]
        rows = db.execute(
            select(User.id, User.full_name, User.email, User.phone)
            .join(WorkspaceMember, WorkspaceMember.user_id == User.id)
            .where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.is_active == True,
                WorkspaceMember.role.in_(roles),
            )
        ).all()
        return [
            Recipient(user_id=r.id, member_id=None, name=r.full_name or "", first_name=(r.full_name or "").split(" ")[0],
                      email=r.email, phone=r.phone)
            for r in rows
        ]

    q = select(Member).where(Member.workspace_id == workspace_id, Member.status == MemberStatus.ACTIVE)
    live = and_(
        Membership.workspace_id == workspace_id,
        Membership.member_id == Member.id,
        Membership.status == MemberStatus.ACTIVE,
        Membership.start_date <= today,
        Membership.end_date >= today,
    )
    if segment == "active_membership":
        q = q.where(exists().where(live))
    elif segment == "expiring_soon":
        q = q.where(exists().where(and_(live, Membership.end_date <= today + timedelta(days=days))))
    elif segment == "expired":
        had_one = exists().where(and_(Membership.workspace_id == workspace_id, Membership.member_id == Member.id))
        q = q.where(had_one, ~exists().where(live))
    elif segment == "new_members":
        q = q.where(Member.joined_date >= today - timedelta(days=days))
    elif segment == "selected_members":
        ids = list(dict.fromkeys(audience.get("member_ids") or []))
        if not ids:
            raise HTTPException(status_code=422, detail="Select at least one member.")
        if len(ids) > MAX_SELECTED:
            raise HTTPException(status_code=422, detail=f"Select at most {MAX_SELECTED} members.")
        q = q.where(Member.id.in_(ids))

    members = db.scalars(q.order_by(Member.first_name)).all()
    return [
        Recipient(user_id=m.user_id, member_id=m.id, name=f"{m.first_name} {m.last_name or ''}".strip(),
                  first_name=m.first_name, email=m.email if m.email and not m.email.endswith("@repsi.internal") else None,
                  phone=m.phone)
        for m in members
    ]


# ─── Preferences ───────────────────────────────────────────────────────


def _default_preferences(workspace_id: str, user_id: str) -> NotificationPreference:
    return NotificationPreference(workspace_id=workspace_id, user_id=user_id, in_app_enabled=True,
                                  email_enabled=True, whatsapp_enabled=False, announcements_enabled=True)


def get_preferences(db: Session, workspace_id: str, user_id: str) -> NotificationPreference:
    pref = db.scalar(select(NotificationPreference).where(
        NotificationPreference.workspace_id == workspace_id, NotificationPreference.user_id == user_id))
    if pref is None:
        pref = _default_preferences(workspace_id, user_id)  # not persisted until the user saves
    return pref


def update_preferences(db: Session, workspace_id: str, user_id: str, changes: dict) -> NotificationPreference:
    pref = db.scalar(select(NotificationPreference).where(
        NotificationPreference.workspace_id == workspace_id, NotificationPreference.user_id == user_id))
    if pref is None:
        pref = _default_preferences(workspace_id, user_id)
        db.add(pref)
    for key, value in changes.items():
        if value is None:
            continue
        if key == "whatsapp_enabled":
            pref.whatsapp_consent_at = datetime.now(timezone.utc) if value else None
        setattr(pref, key, value)
    db.commit()
    db.refresh(pref)
    return pref


def _preferences_for(db: Session, workspace_id: str, user_ids: Iterable[str]) -> dict[str, NotificationPreference]:
    ids = [u for u in user_ids if u]
    if not ids:
        return {}
    rows = db.scalars(select(NotificationPreference).where(
        NotificationPreference.workspace_id == workspace_id, NotificationPreference.user_id.in_(ids))).all()
    return {p.user_id: p for p in rows}


# ─── Broadcasts ────────────────────────────────────────────────────────


def _mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    return f"{local[:2]}{'•' * max(1, len(local) - 2)}@{domain}"


def create_broadcast(
    db: Session,
    workspace_id: str,
    actor_user_id: Optional[str],
    *,
    title: str,
    message: str,
    channels: list[str],
    audience: dict,
    template_id: Optional[str] = None,
    action_url: Optional[str] = None,
) -> Broadcast:
    template = None
    if template_id:
        template = db.scalar(select(MessageTemplate).where(
            MessageTemplate.id == template_id, MessageTemplate.workspace_id == workspace_id,
            MessageTemplate.is_active == True))
        if template is None:
            raise HTTPException(status_code=404, detail="Message template not found.")
    if "whatsapp" in channels and not (template and template.channel == "whatsapp" and template.provider_template_name):
        raise HTTPException(
            status_code=422,
            detail="WhatsApp broadcasts need an approved WhatsApp template (provider template name) selected.",
        )

    recipients = resolve_audience(db, workspace_id, audience)
    if not recipients:
        raise HTTPException(status_code=422, detail="No recipients match this audience.")

    ws = db.get(Workspace, workspace_id)
    gym_name = ws.name if ws else "your gym"
    prefs = _preferences_for(db, workspace_id, (r.user_id for r in recipients))
    now = datetime.now(timezone.utc)

    broadcast = Broadcast(
        workspace_id=workspace_id, title=title, message=message, channels=channels, audience=audience,
        template_id=template.id if template else None, created_by=actor_user_id,
        recipient_count=len(recipients), status="sending",
    )
    db.add(broadcast)
    db.flush()

    for r in recipients:
        pref = prefs.get(r.user_id)
        key_who = r.member_id or r.user_id
        for channel in channels:
            d = NotificationDelivery(
                workspace_id=workspace_id, broadcast_id=broadcast.id, event_type="broadcast", channel=channel,
                recipient_user_id=r.user_id, member_id=r.member_id, recipient_name=r.name,
                idempotency_key=f"{workspace_id}:broadcast:{broadcast.id}:{channel}:{key_who}", status="queued",
            )
            if pref is not None and not pref.announcements_enabled:
                d.status = "skipped_opt_out"
            elif channel == "in_app":
                if not r.user_id:
                    d.status, d.error = "skipped_no_contact", "Member has no app account"
                elif pref is not None and not pref.in_app_enabled:
                    d.status = "skipped_opt_out"
                else:
                    db.add(Notification(
                        workspace_id=workspace_id, user_id=r.user_id, title=render(title, r, gym_name),
                        message=render(message, r, gym_name), action_url=action_url, is_read=False,
                    ))
                    d.status, d.provider, d.attempts, d.sent_at = "sent", "in_app", 1, now
            elif channel == "email":
                if not r.email:
                    d.status, d.error = "skipped_no_contact", "No email address"
                elif pref is not None and not pref.email_enabled:
                    d.status = "skipped_opt_out"
                else:
                    d.destination = _mask_email(r.email)
            elif channel == "whatsapp":
                phone = normalize_phone(r.phone, (ws.country_code if ws else None) or "IN") if r.phone else None
                if not phone:
                    d.status, d.error = "skipped_no_contact", "No valid phone number"
                elif pref is None or not pref.whatsapp_enabled:
                    d.status = "skipped_no_consent"
                else:
                    d.destination = mask_phone(phone)
            db.add(d)

    _refresh_broadcast_status(db, broadcast)
    db.commit()
    db.refresh(broadcast)
    return broadcast


def _refresh_broadcast_status(db: Session, broadcast: Broadcast) -> None:
    db.flush()
    counts = delivery_summary(db, broadcast.workspace_id, broadcast.id)
    if counts.get("queued"):
        broadcast.status = "sending"
        return
    broadcast.status = "completed_with_errors" if counts.get("failed") else "completed"
    broadcast.completed_at = broadcast.completed_at or datetime.now(timezone.utc)


def delivery_summary(db: Session, workspace_id: str, broadcast_id: str) -> dict[str, int]:
    rows = db.execute(
        select(NotificationDelivery.status, func.count(NotificationDelivery.id))
        .where(NotificationDelivery.workspace_id == workspace_id, NotificationDelivery.broadcast_id == broadcast_id)
        .group_by(NotificationDelivery.status)
    ).all()
    return {s: c for s, c in rows}


def channel_summary(db: Session, workspace_id: str, broadcast_id: str) -> dict[str, dict[str, int]]:
    rows = db.execute(
        select(NotificationDelivery.channel, NotificationDelivery.status, func.count(NotificationDelivery.id))
        .where(NotificationDelivery.workspace_id == workspace_id, NotificationDelivery.broadcast_id == broadcast_id)
        .group_by(NotificationDelivery.channel, NotificationDelivery.status)
    ).all()
    out: dict[str, dict[str, int]] = {}
    for channel, st, c in rows:
        out.setdefault(channel, {})[st] = c
    return out


# ─── Dispatch (outside the request path) ───────────────────────────────


def send_whatsapp_template(phone_e164: str, campaign_name: str, params: list[str], user_name: str) -> tuple[str, Optional[str], Optional[str]]:
    """AiSensy campaign send for an approved template. Returns (status, provider_id, error)."""
    if not settings.AISENSY_API_KEY:
        return "skipped_not_configured", None, "WhatsApp provider is not configured"
    payload = {
        "apiKey": settings.AISENSY_API_KEY,
        "campaignName": campaign_name,
        "destination": phone_e164.lstrip("+"),
        "userName": user_name or "REPSI Member",
        "source": settings.AISENSY_SOURCE,
        "templateParams": params,
    }
    try:
        resp = httpx.post(settings.AISENSY_API_URL, json=payload, timeout=settings.AISENSY_TIMEOUT_SECONDS)
    except httpx.HTTPError as exc:
        return "failed", None, f"AiSensy request failed: {type(exc).__name__}"
    if resp.status_code >= 400:
        return "failed", None, f"AiSensy responded with HTTP {resp.status_code}"
    provider_id = None
    try:
        body = resp.json()
        provider_id = str(body.get("submitted_message_id") or body.get("id") or "") or None
    except ValueError:
        pass
    return "sent", provider_id, None


def dispatch_queued_deliveries(db: Session, broadcast_id: Optional[str] = None, limit: int = DISPATCH_BATCH) -> int:
    """Sends queued email/WhatsApp deliveries. Idempotent: only `queued` rows are touched."""
    q = select(NotificationDelivery).where(NotificationDelivery.status == "queued")
    if broadcast_id:
        q = q.where(NotificationDelivery.broadcast_id == broadcast_id)
    deliveries = db.scalars(q.order_by(NotificationDelivery.created_at).limit(limit)).all()
    if not deliveries:
        return 0

    broadcasts = {b.id: b for b in db.scalars(select(Broadcast).where(
        Broadcast.id.in_({d.broadcast_id for d in deliveries if d.broadcast_id}))).all()}
    templates = {t.id: t for t in db.scalars(select(MessageTemplate).where(
        MessageTemplate.id.in_({b.template_id for b in broadcasts.values() if b.template_id}))).all()}
    member_ids = {d.member_id for d in deliveries if d.member_id}
    members = {m.id: m for m in db.scalars(select(Member).where(Member.id.in_(member_ids))).all()} if member_ids else {}
    user_ids = {d.recipient_user_id for d in deliveries if d.recipient_user_id and not d.member_id}
    users = {u.id: u for u in db.scalars(select(User).where(User.id.in_(user_ids))).all()} if user_ids else {}
    workspaces = {w.id: w for w in db.scalars(select(Workspace).where(
        Workspace.id.in_({d.workspace_id for d in deliveries}))).all()}

    for d in deliveries:
        b = broadcasts.get(d.broadcast_id)
        ws = workspaces.get(d.workspace_id)
        gym_name = ws.name if ws else "REPSI"
        m, u = members.get(d.member_id), users.get(d.recipient_user_id)
        r = Recipient(
            user_id=d.recipient_user_id, member_id=d.member_id, name=d.recipient_name or "",
            first_name=(m.first_name if m else (u.full_name or "").split(" ")[0] if u else ""),
            email=(m.email if m else u.email if u else None), phone=(m.phone if m else u.phone if u else None),
        )
        d.attempts = (d.attempts or 0) + 1
        if b is None:
            d.status, d.error = "failed", "Broadcast no longer exists"
        elif d.channel == "email":
            if not r.email:
                d.status, d.error = "skipped_no_contact", "No email address"
            else:
                d.status, d.error = send_notification_email(r.email, render(b.title, r, gym_name), render(b.message, r, gym_name))
                d.provider = "smtp"
        elif d.channel == "whatsapp":
            t = templates.get(b.template_id)
            phone = normalize_phone(r.phone, (ws.country_code if ws else None) or "IN") if r.phone else None
            if not t or not t.provider_template_name:
                d.status, d.error = "failed", "Approved WhatsApp template missing"
            elif not phone:
                d.status, d.error = "skipped_no_contact", "No valid phone number"
            else:
                d.status, d.provider_message_id, d.error = send_whatsapp_template(
                    phone, t.provider_template_name, [r.first_name or "there", gym_name], r.name)
                d.provider = "aisensy"
        else:
            d.status, d.error = "failed", f"Channel {d.channel} is not dispatchable"
        if d.status == "sent":
            d.sent_at = datetime.now(timezone.utc)
    db.flush()
    for b in broadcasts.values():
        _refresh_broadcast_status(db, b)
    db.commit()
    return len(deliveries)


def dispatch_in_background(bind, broadcast_id: str) -> None:
    """BackgroundTasks entry point: own session on the same engine as the request."""
    db = Session(bind=bind)
    try:
        dispatch_queued_deliveries(db, broadcast_id=broadcast_id, limit=10_000)
    except Exception:
        db.rollback()
        logger.exception("Broadcast dispatch failed for %s", broadcast_id)
    finally:
        db.close()


# ─── Templates ─────────────────────────────────────────────────────────


def create_template(db: Session, workspace_id: str, actor_user_id: str, data: dict) -> MessageTemplate:
    if data.get("channel") == "whatsapp" and not data.get("provider_template_name"):
        raise HTTPException(status_code=422, detail="WhatsApp templates need the approved provider template name.")
    t = MessageTemplate(workspace_id=workspace_id, created_by=actor_user_id, **data)
    db.add(t)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A template with this name already exists.")
    db.refresh(t)
    return t
