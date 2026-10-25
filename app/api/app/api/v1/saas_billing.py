"""Central SaaS billing API (gym owners paying REPSI). Everything except /config returns 404 while
SAAS_BILLING_ENABLED is false. Pricing, plan and ownership are always decided here, never by the client."""
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import client_ip, enforce_rate_limit
from app.middleware.tenant import TenantContext, get_current_tenant
from app.models.saas import SaasInvoice, SaasOrder, SaasPlan, SaasPlanPrice, SaasSubscription
from app.models.user import User, UserRole, Workspace, WorkspaceMember
from app.services.payment_providers import ProviderError, get_provider, to_major
from app.services.saas_billing import (
    BillingError, audit, consume_handoff_token, entitlements_for, get_or_create_subscription, issue_handoff_token,
    render_invoice_pdf,
)
from app.services.saas_payments import (
    checkout_view, create_order, ingest_webhook, subscription_view, sync_order, usage_over_limits,
)

router = APIRouter(prefix="/saas-billing", tags=["SaaS billing"])

BILLING_VIEW_ROLES = ("OWNER", "ADMIN", "SUPER_ADMIN")


def _enabled() -> None:
    if not settings.SAAS_BILLING_ENABLED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")


def _ws(tenant: TenantContext) -> str:
    if not tenant.workspace_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Workspace context required.")
    return tenant.workspace_id


def _viewer(tenant: TenantContext = Depends(get_current_tenant)) -> TenantContext:
    _enabled()
    if tenant.role not in BILLING_VIEW_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only gym owners and admins can view billing.")
    _ws(tenant)
    return tenant


def _owner(tenant: TenantContext = Depends(get_current_tenant)) -> TenantContext:
    """Only the gym owner may buy or change the subscription. Trainers, staff and admins may not."""
    _enabled()
    if tenant.role != "OWNER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the gym owner can manage the subscription.")
    _ws(tenant)
    return tenant


def _billing_error(e: BillingError) -> HTTPException:
    return HTTPException(status_code=e.status_code, detail={"error_code": e.code, "message": e.message})


def _provider_env() -> Optional[str]:
    try:
        return get_provider().environment
    except ProviderError:
        return None


# --- public ---------------------------------------------------------------------------------------

@router.get("/config")
def billing_config():
    return {"enabled": settings.SAAS_BILLING_ENABLED, "environment": _provider_env() if settings.SAAS_BILLING_ENABLED else None,
            "checkout_url": settings.SAAS_CHECKOUT_URL}


@router.get("/plans")
def list_plans(db: Session = Depends(get_db)):
    _enabled()
    out = []
    for plan in db.query(SaasPlan).filter_by(is_active=True, is_public=True).order_by(SaasPlan.rank):
        prices = db.query(SaasPlanPrice).filter_by(plan_id=plan.id, is_enabled=True).order_by(SaasPlanPrice.period_months)
        fake_sub = SaasSubscription(plan_id=plan.id, status="active")
        ents = entitlements_for(db, fake_sub)
        out.append({
            "code": plan.code, "name": plan.name, "rank": plan.rank,
            "prices": [{"billing_cycle": p.billing_cycle, "period_months": p.period_months, "currency": p.currency,
                        "amount_minor": p.amount_minor, "amount": to_major(p.amount_minor)} for p in prices],
            "limits": ents["limits"], "features": ents["features"],
        })
    return out


# --- subscription ---------------------------------------------------------------------------------

@router.get("/subscription")
def get_subscription(tenant: TenantContext = Depends(_viewer), db: Session = Depends(get_db)):
    try:
        sub = get_or_create_subscription(db, tenant.workspace_id)
    except BillingError as e:
        raise _billing_error(e)
    view = subscription_view(db, sub)
    view["can_manage"] = tenant.role == "OWNER"
    return view


class DowngradeRequest(BaseModel):
    plan_code: str = Field(max_length=50)
    billing_cycle: str = Field(max_length=20)


@router.post("/subscription/downgrade")
def schedule_downgrade(req: DowngradeRequest, tenant: TenantContext = Depends(_owner), db: Session = Depends(get_db)):
    sub = get_or_create_subscription(db, tenant.workspace_id)
    current = db.get(SaasPlan, sub.plan_id)
    target = db.query(SaasPlan).filter_by(code=req.plan_code, is_active=True).first()
    if sub.status != "active" or target is None or target.rank >= current.rank:
        raise HTTPException(status_code=409, detail={"error_code": "DOWNGRADE_NOT_ALLOWED",
                                                     "message": "Downgrades can be scheduled from an active paid plan to a lower plan."})
    if not db.query(SaasPlanPrice).filter_by(plan_id=target.id, billing_cycle=req.billing_cycle, currency=sub.currency, is_enabled=True).first():
        raise HTTPException(status_code=400, detail={"error_code": "PRICE_UNAVAILABLE", "message": "That billing cycle is not available."})
    over = usage_over_limits(db, tenant.workspace_id, target)
    if over:
        raise HTTPException(status_code=409, detail={"error_code": "USAGE_EXCEEDS_PLAN", "resources": over,
                                                     "message": f"Reduce {', '.join(over)} to fit {target.name} first."})
    sub.pending_plan_id, sub.pending_billing_cycle = target.id, req.billing_cycle
    audit(db, "subscription", sub, "downgrade_scheduled", actor=tenant.user_id, meta={"to_plan": target.code, "cycle": req.billing_cycle})
    db.commit()
    return subscription_view(db, sub)


@router.delete("/subscription/downgrade")
def cancel_downgrade(tenant: TenantContext = Depends(_owner), db: Session = Depends(get_db)):
    sub = get_or_create_subscription(db, tenant.workspace_id)
    if sub.pending_plan_id:
        sub.pending_plan_id = sub.pending_billing_cycle = None
        audit(db, "subscription", sub, "downgrade_cancelled", actor=tenant.user_id)
        db.commit()
    return subscription_view(db, sub)


@router.post("/subscription/cancel")
def cancel_subscription(tenant: TenantContext = Depends(_owner), db: Session = Depends(get_db)):
    """Cancellation is a flag: access continues until paid_until, then the workspace becomes read-only."""
    sub = get_or_create_subscription(db, tenant.workspace_id)
    if sub.status != "active":
        raise HTTPException(status_code=409, detail={"error_code": "NOTHING_TO_CANCEL", "message": "There is no active paid period to cancel."})
    if not sub.cancel_at_period_end:
        from datetime import datetime, timezone
        sub.cancel_at_period_end, sub.cancel_requested_at = True, datetime.now(timezone.utc)
        audit(db, "subscription", sub, "cancel_requested", actor=tenant.user_id)
        db.commit()
    return subscription_view(db, sub)


@router.post("/subscription/resume")
def resume_subscription(tenant: TenantContext = Depends(_owner), db: Session = Depends(get_db)):
    sub = get_or_create_subscription(db, tenant.workspace_id)
    if sub.cancel_at_period_end and sub.status == "active":
        sub.cancel_at_period_end, sub.cancel_requested_at = False, None
        audit(db, "subscription", sub, "cancel_withdrawn", actor=tenant.user_id)
        db.commit()
    return subscription_view(db, sub)


# --- orders ---------------------------------------------------------------------------------------

class OrderRequest(BaseModel):
    plan_code: str = Field(max_length=50)
    billing_cycle: str = Field(max_length=20)
    currency: str = Field(default="INR", max_length=3)
    idempotency_key: str = Field(min_length=8, max_length=100)


@router.post("/orders", status_code=status.HTTP_201_CREATED)
def post_order(req: OrderRequest, request: Request, tenant: TenantContext = Depends(_owner), db: Session = Depends(get_db)):
    enforce_rate_limit(f"saas-order:{tenant.workspace_id}", 20, 600)
    user = db.get(User, tenant.user_id)
    try:
        order = create_order(db, workspace_id=tenant.workspace_id, user=user, plan_code=req.plan_code,
                             billing_cycle=req.billing_cycle, currency=req.currency, idempotency_key=req.idempotency_key)
    except BillingError as e:
        raise _billing_error(e)
    return checkout_view(db, order, _provider_env())


@router.get("/orders/{order_ref}")
def get_order(order_ref: str, tenant: TenantContext = Depends(_viewer), db: Session = Depends(get_db)):
    """Status for the success/failed pages. Pending orders are verified with the provider first."""
    order = db.query(SaasOrder).filter_by(order_ref=order_ref, workspace_id=tenant.workspace_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status in ("created", "pending", "expired"):
        try:
            order = sync_order(db, order)
        except (ProviderError, BillingError):
            db.rollback()  # webhook/reconcile will catch up; report the stored state
    view = checkout_view(db, order, _provider_env())
    view["subscription"] = subscription_view(db, get_or_create_subscription(db, tenant.workspace_id))
    return view


# --- invoices -------------------------------------------------------------------------------------

def _invoice_view(db: Session, inv: SaasInvoice) -> dict:
    order = db.get(SaasOrder, inv.order_id)
    plan = db.get(SaasPlan, order.plan_id)
    return {"id": inv.id, "invoice_number": inv.invoice_number, "issued_at": inv.issued_at.isoformat(),
            "amount_minor": inv.amount_minor, "amount": to_major(inv.amount_minor), "currency": inv.currency,
            "tax_minor": inv.tax_minor, "order_ref": order.order_ref, "plan_name": plan.name,
            "billing_cycle": order.billing_cycle, "kind": order.kind}


@router.get("/invoices")
def list_invoices(tenant: TenantContext = Depends(_viewer), db: Session = Depends(get_db)):
    rows = db.query(SaasInvoice).filter_by(workspace_id=tenant.workspace_id).order_by(SaasInvoice.issued_at.desc()).limit(200)
    return [_invoice_view(db, inv) for inv in rows]


def _tenant_invoice(db: Session, tenant: TenantContext, invoice_id: str) -> SaasInvoice:
    # The id alone never authorizes: it must belong to the caller's workspace.
    inv = db.query(SaasInvoice).filter_by(id=invoice_id, workspace_id=tenant.workspace_id).first()
    if inv is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv


@router.get("/invoices/{invoice_id}")
def get_invoice(invoice_id: str, tenant: TenantContext = Depends(_viewer), db: Session = Depends(get_db)):
    return _invoice_view(db, _tenant_invoice(db, tenant, invoice_id))


@router.get("/invoices/{invoice_id}/pdf")
def get_invoice_pdf(invoice_id: str, tenant: TenantContext = Depends(_viewer), db: Session = Depends(get_db)):
    inv = _tenant_invoice(db, tenant, invoice_id)
    filename = inv.invoice_number.replace("/", "-") + ".pdf"
    return Response(content=render_invoice_pdf(db, inv), media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"', "Cache-Control": "private, no-store"})


# --- app -> web handoff ---------------------------------------------------------------------------

@router.post("/handoff")
def create_handoff(tenant: TenantContext = Depends(_viewer), db: Session = Depends(get_db)):
    """Single-use, 5-minute link that signs the app user into the web checkout for this workspace."""
    enforce_rate_limit(f"saas-handoff:{tenant.user_id}", 10, 600)
    token, expires = issue_handoff_token(db, tenant.user_id, tenant.workspace_id)
    return {"url": f"{settings.SAAS_CHECKOUT_URL.rstrip('/')}?t={token}", "expires_at": expires.isoformat()}


class HandoffConsume(BaseModel):
    token: str = Field(min_length=20, max_length=200)


@router.post("/handoff/consume")
def consume_handoff(req: HandoffConsume, request: Request, db: Session = Depends(get_db)):
    _enabled()
    enforce_rate_limit(f"saas-handoff-consume:{client_ip(request)}", 20, 300)
    row = consume_handoff_token(db, req.token)
    invalid = HTTPException(status_code=401, detail={"error_code": "HANDOFF_INVALID",
                                                    "message": "This sign-in link has expired or was already used. Please log in."})
    if row is None:
        raise invalid
    user = db.get(User, row.user_id)
    ws = db.get(Workspace, row.workspace_id)
    member = db.query(WorkspaceMember).filter_by(workspace_id=row.workspace_id, user_id=row.user_id, is_active=True).first()
    role = member.role if member else None
    if not user or not user.is_active or not ws or member is None or role not in (UserRole.OWNER, UserRole.ADMIN):
        raise invalid
    from app.services.auth import AuthService
    return AuthService(db).issue_session(user, ws.slug, user_agent=request.headers.get("user-agent"), ip_address=client_ip(request))


# --- provider webhook -----------------------------------------------------------------------------

@router.post("/webhooks/cashfree")
async def cashfree_webhook(
    request: Request,
    x_webhook_signature: Optional[str] = Header(None),
    x_webhook_timestamp: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """No session auth: the HMAC signature over the raw body is the authentication. Verified events are
    stored once (unique event id) and processed by the saas_webhook_drain worker job."""
    _enabled()
    raw = await request.body()  # raw bytes, before any JSON parsing
    if len(raw) > 256 * 1024:
        raise HTTPException(status_code=413, detail="Payload too large")
    try:
        accepted, reason = ingest_webhook(db, raw, x_webhook_timestamp, x_webhook_signature)
    except ProviderError:
        raise HTTPException(status_code=503, detail="Webhook verification is not configured")
    if not accepted:
        raise HTTPException(status_code=401 if reason == "invalid_signature" else 400, detail=reason)
    return {"status": reason}


# --- superadmin -----------------------------------------------------------------------------------

class PriceOverride(BaseModel):
    amount_minor: Optional[int] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default="INR", max_length=3)
    reason: str = Field(min_length=3, max_length=500)


@router.put("/admin/workspaces/{workspace_id}/price-override")
def set_price_override(workspace_id: str, req: PriceOverride, tenant: TenantContext = Depends(get_current_tenant),
                       db: Session = Depends(get_db)):
    """Founder price lock for one workspace (renewals of its current plan and cycle). null clears it."""
    _enabled()
    if tenant.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Super admin only.")
    sub = get_or_create_subscription(db, workspace_id)
    old = sub.price_override_minor
    sub.price_override_minor = req.amount_minor
    sub.price_override_currency = req.currency.upper() if req.amount_minor is not None and req.currency else None
    audit(db, "subscription", sub, "price_override", actor=tenant.user_id, reason=req.reason,
          meta={"old": old, "new": req.amount_minor, "currency": sub.price_override_currency})
    db.commit()
    return subscription_view(db, sub)
