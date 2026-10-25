from typing import Optional, Callable
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.middleware.tenant import get_current_tenant, TenantContext
from app.services.billing import BillingService
from app.models.billing import SubscriptionStatus
from app.services.saas_billing import entitlements_for, saas_capacity_error, saas_subscription_if_enabled

def require_feature(feature_key: str):
    """
    Reusable FastAPI route dependency.
    Validates that the authenticated workspace has the required feature entitlement.
    Enforces deterministic precedence:
    1. Super Admin bypass (Super Admins can test/inspect all features).
    2. Subscription suspension check -> 403 SUBSCRIPTION_SUSPENDED
    3. Subscription expiration check -> 403 SUBSCRIPTION_EXPIRED
    4. Plan & custom feature entitlement check -> 403 FEATURE_NOT_IN_PLAN
    """
    def dependency(
        tenant: TenantContext = Depends(get_current_tenant),
        db: Session = Depends(get_db)
    ):
        if tenant.role == "SUPER_ADMIN":
            return True

        if not tenant.workspace_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workspace context required for entitlement verification."
            )

        saas = saas_subscription_if_enabled(db, tenant.workspace_id)
        if saas is not None:
            # Central SaaS billing: plan features only. Lapsed subscriptions are handled by the read-only
            # write guard, so reads and exports keep working.
            ents = entitlements_for(db, saas)
            if not ents["features"].get(feature_key, False):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error_code": "FEATURE_NOT_IN_PLAN",
                        "required_feature": feature_key,
                        "current_plan": ents["plan_code"],
                        "plan_name": ents["plan_name"],
                        "message": f"Feature '{feature_key}' is not included in your {ents['plan_name']} plan. Upgrade to access.",
                    },
                )
            return True

        snap = BillingService.entitlement_snapshot(db, tenant.workspace_id)

        # 1. Check suspension
        if snap["status"] == SubscriptionStatus.SUSPENDED.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "SUBSCRIPTION_SUSPENDED",
                    "workspace_id": tenant.workspace_id,
                    "reason": snap["suspension_reason"] or "Account suspended by Super Admin.",
                    "message": "Your gym workspace subscription is suspended. Please contact Repsi support."
                }
            )

        # 2. Check expiration (if not complimentary)
        expired = (SubscriptionStatus.EXPIRED.value, SubscriptionStatus.CANCELLED.value, SubscriptionStatus.CANCELED.value)
        if snap["status"] in expired and not snap["is_complimentary"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "SUBSCRIPTION_EXPIRED",
                    "workspace_id": tenant.workspace_id,
                    "status": snap["status"],
                    "current_plan": snap["plan_code"],
                    "message": "Your Repsi subscription or 14-day free trial has expired. Please renew or upgrade to continue."
                }
            )

        # 3. Check specific feature
        if not snap["features"].get(feature_key, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "FEATURE_NOT_IN_PLAN",
                    "required_feature": feature_key,
                    "current_plan": snap["plan_code"],
                    "plan_name": snap["plan_name"],
                    "message": f"Feature '{feature_key}' is not included in your {snap['plan_name']} plan. Upgrade to access."
                }
            )

        return True

    return dependency


def check_member_capacity(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Enforces member capacity limit prior to creating or activating a gym member.
    """
    if tenant.role == "SUPER_ADMIN":
        return True

    if saas_subscription_if_enabled(db, tenant.workspace_id) is not None:
        assert_capacity(db, tenant.workspace_id, "members")
        return True

    sub = BillingService.get_or_create_workspace_subscription(db, tenant.workspace_id)
    if sub.status == SubscriptionStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "SUBSCRIPTION_SUSPENDED",
                "workspace_id": tenant.workspace_id,
                "reason": sub.suspension_reason or "Account suspended by Super Admin.",
                "message": "Your gym workspace subscription is suspended. Please contact Repsi support."
            }
        )

    if sub.status in [SubscriptionStatus.EXPIRED, SubscriptionStatus.CANCELLED, SubscriptionStatus.CANCELED] and not sub.is_complimentary:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "SUBSCRIPTION_EXPIRED",
                "workspace_id": tenant.workspace_id,
                "status": sub.status.value if hasattr(sub.status, "value") else str(sub.status),
                "current_plan": sub.plan.code,
                "message": "Your Repsi subscription or 14-day free trial has expired. Please renew or upgrade to continue."
            }
        )

    assert_capacity(db, tenant.workspace_id, "members")
    return True


def check_trainer_capacity(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Enforces trainer capacity limit prior to adding a trainer account.
    """
    if tenant.role == "SUPER_ADMIN":
        return True

    assert_capacity(db, tenant.workspace_id, "trainers")
    return True


def capacity_error(db: Session, workspace_id: str, resource: str, increment: int = 1) -> Optional[dict]:
    """Returns the PLAN_LIMIT_REACHED payload when adding `increment` would exceed the quota, else None."""
    db.flush()  # count rows added earlier in this transaction
    saas = saas_subscription_if_enabled(db, workspace_id)
    if saas is not None:
        return saas_capacity_error(db, saas, workspace_id, resource, increment)
    allowed, message, current, limit = BillingService.check_limit_before_action(
        db, workspace_id, resource, increment=increment
    )
    if allowed:
        return None
    sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)
    return {
        "error_code": "PLAN_LIMIT_REACHED",
        "resource": resource,
        "current": current,
        "limit": limit,
        "current_plan": sub.plan.code,
        "plan_name": sub.plan.name,
        "message": message,
    }


def assert_capacity(db: Session, workspace_id: str, resource: str, increment: int = 1) -> None:
    """
    Quota guard for every path that adds a member, trainer, staff account or branch
    (invitations, direct add, CSV import, CRM conversion, reactivation, branch creation).
    Raises 409 PLAN_LIMIT_REACHED.
    """
    detail = capacity_error(db, workspace_id, resource, increment)
    if detail:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)
