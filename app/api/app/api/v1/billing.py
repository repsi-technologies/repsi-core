from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.billing import SubscriptionPlan
from app.services.billing import BillingService, CashfreeUnavailableError
from app.services.trial_lifecycle import TrialLifecycleService
from app.middleware.tenant import get_current_tenant, TenantContext
from app.schemas.billing import (
    SubscriptionPlanSchema,
    SubscriptionBillingOverviewSchema,
    TrialStatusResponse,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
    ChangePlanRequest,
    ChangePlanResponse,
    AdminTrialExtensionRequest,
    AdminManualOverrideRequest,
)

router = APIRouter(prefix="/billing", tags=["Billing & Subscription"])


def _workspace_of(tenant: TenantContext) -> str:
    """Billing data always belongs to the caller's verified workspace, never a client-supplied id."""
    if not tenant.workspace_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Workspace context required.")
    return tenant.workspace_id


def _require_billing_admin(tenant: TenantContext) -> None:
    if tenant.role not in ("OWNER", "ADMIN", "SUPER_ADMIN"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only workspace administrators can manage billing.")

@router.get("/plans", response_model=List[SubscriptionPlanSchema])
def get_subscription_plans(db: Session = Depends(get_db)):
    """Returns all active Repsi subscription plans (Starter, Basic, Growth, Pro, Business)."""
    plans = BillingService.ensure_default_plans(db)
    return [
        SubscriptionPlanSchema(
            id=p.id,
            code=p.code,
            name=p.name,
            tagline=p.tagline,
            description=p.description,
            monthly_price_inr=p.monthly_price_inr,
            annual_price_inr=p.annual_price_inr,
            monthly_price_usd=p.monthly_price_usd,
            annual_price_usd=p.annual_price_usd,
            member_limit=p.member_limit,
            trainer_limit=p.trainer_limit,
            branch_limit=p.branch_limit,
            is_popular=p.is_popular,
            display_order=p.display_order,
            features=p.features or {},
        )
        for p in plans
    ]

@router.get("/trial-status", response_model=TrialStatusResponse)
def get_trial_status_route(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """
    Returns authoritative 14-day trial countdown and subscription lifecycle status.
    Calculated in real-time from server UTC timestamps.
    """
    workspace_id = _workspace_of(tenant)
    return BillingService.get_trial_status(db, workspace_id)

@router.get("/subscription", response_model=SubscriptionBillingOverviewSchema)
def get_current_subscription(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Retrieves current workspace subscription, trial days remaining, usage meters, and feature flags."""
    workspace_id = _workspace_of(tenant)
    sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)
    usage = BillingService.get_workspace_usage(db, workspace_id)
    trial_data = BillingService.get_trial_status(db, workspace_id)
    p = sub.plan

    sub_schema = {
        "id": sub.id,
        "workspace_id": sub.workspace_id,
        "plan": {
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "tagline": p.tagline,
            "description": p.description,
            "monthly_price_inr": p.monthly_price_inr,
            "annual_price_inr": p.annual_price_inr,
            "monthly_price_usd": p.monthly_price_usd,
            "annual_price_usd": p.annual_price_usd,
            "member_limit": p.member_limit,
            "trainer_limit": p.trainer_limit,
            "branch_limit": p.branch_limit,
            "is_popular": p.is_popular,
            "display_order": p.display_order,
            "features": p.features or {},
        },
        "status": sub.status.value if hasattr(sub.status, "value") else str(sub.status),
        "billing_cycle": sub.billing_cycle.value if hasattr(sub.billing_cycle, "value") else str(sub.billing_cycle),
        "currency": sub.currency,
        "trial_start": sub.trial_start,
        "trial_end": sub.trial_end,
        "trial_started_at": sub.trial_started_at or sub.trial_start,
        "trial_ends_at": sub.trial_ends_at or sub.trial_end,
        "trial_days_left": trial_data["days_remaining"],
        "trial_hours_left": trial_data["hours_remaining"],
        "trial_progress_pct": trial_data["progress_pct"],
        "trial_state": trial_data["trial_state"],
        "is_expired": trial_data["is_expired"],
        "current_period_start": sub.current_period_start,
        "current_period_end": sub.current_period_end,
        "cancel_at_period_end": sub.cancel_at_period_end,
    }

    return {
        "subscription": sub_schema,
        "usage": usage,
        "features": BillingService.get_effective_features(db, workspace_id),
    }

@router.post("/reconcile-trials")
def reconcile_trials_endpoint(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """
    Triggers manual or scheduled trial expiration reconciliation & reminder delivery.
    """
    if tenant.role != "SUPER_ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only super administrators can reconcile trials.")
    reconciled = TrialLifecycleService.reconcile_all_trials(db)
    reminders = TrialLifecycleService.send_trial_reminders(db)
    return {
        "status": "success",
        "reconciliation": reconciled,
        "reminders": reminders,
    }

@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
def create_checkout_session(
    payload: CheckoutSessionRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Creates a Cashfree payment session for plan checkout."""
    _require_billing_admin(tenant)
    workspace_id = _workspace_of(tenant)
    try:
        data = BillingService.create_cashfree_checkout_session(
            db=db,
            workspace_id=workspace_id,
            plan_code=payload.plan_code,
            billing_cycle=payload.billing_cycle,
            currency=payload.currency,
        )
        return data
    except CashfreeUnavailableError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/verify-payment", response_model=PaymentVerifyResponse)
def verify_payment(
    payload: PaymentVerifyRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Verifies Cashfree payment status and updates workspace subscription to Active."""
    _require_billing_admin(tenant)
    workspace_id = _workspace_of(tenant)
    try:
        return BillingService.verify_and_activate_payment(
            db=db,
            workspace_id=workspace_id,
            plan_code="growth",
            cashfree_order_id=payload.cashfree_order_id,
            cashfree_payment_id=payload.cashfree_payment_id,
            amount=payload.amount,
        )
    except CashfreeUnavailableError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

@router.post("/change-plan", response_model=ChangePlanResponse)
def change_plan(
    payload: ChangePlanRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Check eligibility without changing a plan before payment is verified."""
    if tenant.role not in ["OWNER", "ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only workspace administrators can request a plan change.")

    workspace_id = tenant.workspace_id
    valid, is_downgrade, msg, excess = BillingService.validate_plan_change(
        db=db, workspace_id=workspace_id, target_plan_code=payload.target_plan_code
    )

    if not valid:
        return ChangePlanResponse(
            success=False,
            is_downgrade=is_downgrade,
            limit_blocked=True,
            message=msg,
            excess_members=excess.get("excess_members", 0),
            excess_trainers=excess.get("excess_trainers", 0),
            excess_branches=excess.get("excess_branches", 0),
        )

    return ChangePlanResponse(
        success=True,
        is_downgrade=is_downgrade,
        limit_blocked=False,
        message="Plan change is eligible. Complete verified checkout before the subscription is updated.",
    )

@router.get("/entitlements")
def get_entitlements(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Effective feature flags, limits and live usage for the caller's workspace (drives UI gating)."""
    workspace_id = _workspace_of(tenant)
    sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)
    status_value = sub.status.value if hasattr(sub.status, "value") else str(sub.status)
    return {
        "workspace_id": workspace_id,
        "plan": {"code": sub.plan.code, "name": sub.plan.name},
        "status": status_value,
        "features": BillingService.get_effective_features(db, workspace_id),
        "limits": BillingService.get_effective_limits(db, workspace_id),
        "usage": BillingService.get_workspace_usage(db, workspace_id),
    }


@router.get("/entitlements/{feature_key}")
def check_feature(
    feature_key: str,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Server-side check if feature flag is active for workspace."""
    workspace_id = _workspace_of(tenant)
    has_access = BillingService.check_feature_entitlement(db, workspace_id, feature_key)
    return {"workspace_id": workspace_id, "feature_key": feature_key, "has_access": has_access}

@router.post("/webhook")
def cashfree_webhook(
    payload: Dict[str, Any],
    x_webhook_signature: Optional[str] = Header(None, alias="X-Webhook-Signature"),
    db: Session = Depends(get_db),
):
    """Reject callbacks until Cashfree raw-body signatures are verified."""
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Online payment callbacks are disabled until signature verification is configured.",
    )
