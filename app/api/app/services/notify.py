"""
Lifecycle messages to one member: welcome, payment receipts, expiry and renewal reminders,
freeze/extension updates, class bookings and appointments.

Each call writes one NotificationDelivery per channel with an idempotency key, so the same
event never messages a member twice (re-running a job, retrying a request). In-app rows are
delivered immediately; email, WhatsApp, SMS and push rows stay `queued` until
`dispatch_queued_deliveries` sends them (scheduler job or CLI). Rules:

- in_app / email follow the member's channel preferences (transactional, not "announcements").
- WhatsApp needs the member's recorded opt-in AND an approved template that the gym linked to
  this event (MessageTemplate with category=<event>, channel=whatsapp, provider_template_name).
- SMS is only attempted for essential events and only when an SMS provider is configured.
- Push is only attempted when the member's account has a registered device.

A gym can override the default wording with an active in_app/email MessageTemplate whose category
is the event type. Placeholders: {{first_name}}, {{gym_name}} and the event's own variables.
"""
from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.i18n import default_copy, pick_by_language, resolve_language
from app.core.phone import mask_phone, normalize_phone
from app.core.sms import sms_configured
from app.models.communication import DeviceToken, MessageTemplate, NotificationDelivery, NotificationPreference
from app.models.member import Member
from app.models.system import Notification
from app.models.user import User, Workspace

logger = logging.getLogger(__name__)

ESSENTIAL_EVENTS = {"payment_receipt", "membership_expiring", "membership_expired", "refund_processed"}

DEFAULT_COPY: dict[str, tuple[str, str]] = {
    "welcome": ("Welcome to {{gym_name}}", "Hi {{first_name}}, welcome to {{gym_name}}! We're glad to have you."),
    "payment_receipt": (
        "Payment received – {{amount}}",
        "Hi {{first_name}}, we received {{amount}} on {{date}}. Receipt {{receipt_number}}. Thank you!",
    ),
    "refund_processed": (
        "Refund processed – {{amount}}",
        "Hi {{first_name}}, a refund of {{amount}} has been processed. Reason: {{reason}}.",
    ),
    "membership_assigned": (
        "Your {{plan_name}} membership is confirmed",
        "Hi {{first_name}}, your {{plan_name}} membership runs from {{start_date}} to {{end_date}}.",
    ),
    "membership_renewed": (
        "Membership renewed",
        "Hi {{first_name}}, your {{plan_name}} membership is renewed until {{end_date}}.",
    ),
    "membership_extended": (
        "Membership extended",
        "Hi {{first_name}}, your membership now ends on {{end_date}}.",
    ),
    "membership_frozen": (
        "Membership paused",
        "Hi {{first_name}}, your membership is paused from {{start_date}}. We'll see you back soon.",
    ),
    "membership_unfrozen": (
        "Membership resumed",
        "Hi {{first_name}}, your membership is active again and now ends on {{end_date}}.",
    ),
    "membership_expiring": (
        "Your membership ends in {{days}} day(s)",
        "Hi {{first_name}}, your {{plan_name}} membership at {{gym_name}} ends on {{end_date}}. Renew to keep training.",
    ),
    "membership_expired": (
        "Your membership has ended",
        "Hi {{first_name}}, your {{plan_name}} membership ended on {{end_date}}. Renew any time at {{gym_name}}.",
    ),
    "class_booked": ("Class booked: {{class_name}}", "You're booked for {{class_name}} on {{when}}."),
    "class_waitlisted": (
        "Waitlisted: {{class_name}}",
        "{{class_name}} on {{when}} is full. You're number {{position}} on the waitlist.",
    ),
    "class_promoted": (
        "You're in: {{class_name}}",
        "A place opened up. You're now booked for {{class_name}} on {{when}}.",
    ),
    "class_cancelled": (
        "Class cancelled: {{class_name}}",
        "{{class_name}} on {{when}} has been cancelled by the gym. {{reason}}",
    ),
    "appointment_booked": ("Session booked with {{trainer_name}}", "Your session with {{trainer_name}} is on {{when}}."),
    "appointment_cancelled": (
        "Session cancelled",
        "Your session with {{trainer_name}} on {{when}} has been cancelled. {{reason}}",
    ),
}

_VAR = re.compile(r"{{\s*([a-z_]+)\s*}}")


def fill(text: str, values: dict) -> str:
    return _VAR.sub(lambda m: str(values.get(m.group(1), "")), text or "").strip()


def _template(
    db: Session, workspace_id: str, event_type: str, channel: str,
    language: Optional[str] = None, workspace_default: Optional[str] = None,
) -> Optional[MessageTemplate]:
    """The gym's active template for this event, in the recipient's language when one exists."""
    templates = db.scalars(
        select(MessageTemplate).where(
            MessageTemplate.workspace_id == workspace_id,
            MessageTemplate.category == event_type,
            MessageTemplate.channel == channel,
            MessageTemplate.is_active.is_(True),
        ).order_by(MessageTemplate.created_at)
    ).all()
    return pick_by_language(templates, language, workspace_default)


def _exists(db: Session, key: str) -> bool:
    return db.scalar(select(NotificationDelivery.id).where(NotificationDelivery.idempotency_key == key)) is not None


def notify_member(
    db: Session,
    member: Member,
    event_type: str,
    dedupe_key: str,
    variables: Optional[dict] = None,
    action_url: Optional[str] = None,
) -> int:
    """Queues the event for every applicable channel. Returns how many delivery rows were written."""
    ws = db.get(Workspace, member.workspace_id)
    gym_name = ws.name if ws else "your gym"
    values = {"first_name": member.first_name or "there", "gym_name": gym_name, **(variables or {})}
    user = db.get(User, member.user_id) if member.user_id else None
    # A member's own preference wins; otherwise the gym's default language (app/core/i18n.py).
    workspace_language = ws.default_language if ws else None
    language = resolve_language(user.preferred_language if user else None, workspace_language)
    default_subject, default_body = default_copy(event_type, language, DEFAULT_COPY)
    pref = None
    if user:
        pref = db.scalar(select(NotificationPreference).where(
            NotificationPreference.workspace_id == member.workspace_id, NotificationPreference.user_id == user.id))
    email = member.email or (user.email if user and not (user.email or "").endswith("@repsi.internal") else None)
    phone = normalize_phone(member.phone, (ws.country_code if ws else None) or "IN") if member.phone else None
    now = datetime.now(timezone.utc)
    written = 0

    def content(channel: str) -> tuple[str, str]:
        t = _template(db, member.workspace_id, event_type, channel, language, workspace_language)
        return fill(t.subject or default_subject if t else default_subject, values), fill(t.body if t else default_body, values)

    def add(channel: str, **fields) -> None:
        nonlocal written
        key = f"{member.workspace_id}:{event_type}:{dedupe_key}:{channel}:{member.id}"
        if _exists(db, key):
            return
        db.add(NotificationDelivery(
            workspace_id=member.workspace_id, event_type=event_type, channel=channel,
            recipient_user_id=user.id if user else None, member_id=member.id,
            recipient_name=f"{member.first_name} {member.last_name or ''}".strip(), idempotency_key=key,
            language=language, **fields,
        ))
        written += 1

    # In-app
    if user:
        subject, body = content("in_app")
        if pref is not None and not pref.in_app_enabled:
            add("in_app", status="skipped_opt_out", subject=subject, body=body)
        elif not _exists(db, f"{member.workspace_id}:{event_type}:{dedupe_key}:in_app:{member.id}"):
            db.add(Notification(workspace_id=member.workspace_id, user_id=user.id, title=subject[:255], message=body,
                                action_url=action_url, is_read=False))
            add("in_app", status="sent", provider="in_app", attempts=1, sent_at=now, subject=subject, body=body)

    # Email
    if email:
        subject, body = content("email")
        if pref is not None and not pref.email_enabled:
            add("email", status="skipped_opt_out", subject=subject, body=body)
        else:
            add("email", status="queued", destination=_mask_email(email), subject=subject, body=body)

    # WhatsApp: approved template linked to this event, plus recorded consent
    wa = _template(db, member.workspace_id, event_type, "whatsapp", language, workspace_language)
    if wa and wa.provider_template_name and phone:
        params = [values.get("first_name"), gym_name] + [str(values[k]) for k in sorted(variables or {})]
        if pref is None or not pref.whatsapp_enabled:
            add("whatsapp", status="skipped_no_consent", destination=mask_phone(phone))
        else:
            add("whatsapp", status="queued", destination=mask_phone(phone), provider_template_name=wa.provider_template_name,
                template_params=params, body=fill(wa.body, values))

    # SMS: essential alerts only, and only with a configured provider
    if event_type in ESSENTIAL_EVENTS and phone and sms_configured():
        subject, body = content("in_app")
        sms_t = _template(db, member.workspace_id, event_type, "sms", language, workspace_language)
        add("sms", status="queued", destination=mask_phone(phone), subject=subject, body=body,
            provider_template_name=sms_t.provider_template_name if sms_t else None, template_params=values)

    # Push: only when the member has a registered device
    if user and db.scalar(select(DeviceToken.id).where(DeviceToken.user_id == user.id, DeviceToken.revoked_at.is_(None))):
        subject, body = content("in_app")
        add("push", status="queued", subject=subject, body=body)

    db.flush()
    return written


def _mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    return f"{local[:2]}{'•' * max(1, len(local) - 2)}@{domain}"


def safe_notify(db: Session, member: Optional[Member], event_type: str, dedupe_key: str, **kwargs) -> None:
    """Messaging must never break the business action that triggered it."""
    if member is None:
        return
    try:
        with db.begin_nested():
            notify_member(db, member, event_type, dedupe_key, **kwargs)
    except Exception:
        logger.exception("Could not queue %s notification for member %s", event_type, member.id)
