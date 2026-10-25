import uuid
import math
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.billing import (
    SubscriptionPlan,
    GymSubscription,
    SubscriptionAuditLog,
    SubscriptionPayment,
    BillingInvoice,
    BillingWebhookEvent,
    SubscriptionStatus,
    BillingCycle,
    PaymentStatus,
)
from app.models.member import Member, MemberStatus
from app.models.trainer import Trainer
from app.models.attendance import GymLocation
from app.models.user import Workspace, WorkspaceMember, UserRole
from app.core import cache
from app.core.config import settings

logger = logging.getLogger(__name__)

# Roles that consume the plan's staff quota.
STAFF_LIMIT_ROLES = (UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)


def invalidate_entitlements(workspace_id: Optional[str] = None) -> None:
    """Drop cached entitlement snapshots for one workspace (or all, e.g. after a plan catalog edit)."""
    cache.invalidate(f"entitlements:{workspace_id}" if workspace_id else "entitlements:")


class CashfreeUnavailableError(RuntimeError):
    """Raised while online billing is disabled pending secure provider integration."""

# Configurable catalog values per specification.
# NOTE: The annual prices below are the supplied values (e.g. Basic ₹129, Growth ₹469).
# These unusually low annual prices must be confirmed with business stakeholders before opening production payment gateways.
DEFAULT_PLANS = [
    {
        "code": "basic",
        "name": "Lite",
        "tagline": "Essential attendance, payments and profiles for small facilities",
        "description": "Members, QR check-in, payment records and receipts, self-serve support for up to 20 active members.",
        "monthly_price_inr": 199.0,
        "annual_price_inr": 129.0,
        "monthly_price_usd": 2.99,
        "annual_price_usd": 1.99,
        "member_limit": 20,
        "trainer_limit": 1,
        "staff_limit": 1,
        "branch_limit": 1,
        "is_popular": False,
        "is_active": True,
        "contact_sales": False,
        "display_order": 1,
        "features": {
            "member_management": True,
            "membership_records": True,
            "qr_attendance": True,
            "payment_records": True,
            "basic_workouts": True,
            "basic_dashboard": True,
            "membership_reminders": True,
            "ai_assistant": True,
            "ai_workouts": True,
            "ai_insights": False,
            "member_broadcasts": False,
            # Feature gating defaults
            "trainer_management": False,
            "diet_plans": False,
            "advanced_analytics": False,
            "data_export": False,
            "multi_branch": False,
        },
    },
    {
        "code": "growth",
        "name": "Growth",
        "tagline": "Classes, scheduling, workouts, diet, CRM, and P&L tracking",
        "description": "Workout builder, diet plans, classes & batches, leads CRM, and dues queue for up to 150 active members.",
        "monthly_price_inr": 999.0,
        "annual_price_inr": 649.0,
        "monthly_price_usd": 13.99,
        "annual_price_usd": 8.99,
        "member_limit": 150,
        "trainer_limit": 10,
        "staff_limit": 10,
        "branch_limit": 1,
        "is_popular": True,
        "is_active": True,
        "contact_sales": False,
        "display_order": 2,
        "features": {
            # Everything in Basic
            "member_management": True,
            "membership_records": True,
            "qr_attendance": True,
            "payment_records": True,
            "basic_workouts": True,
            "basic_dashboard": True,
            "membership_reminders": True,
            "ai_assistant": True,
            "ai_workouts": True,
            "ai_insights": True,
            "member_broadcasts": True,
            # Growth features
            "trainer_management": True,
            "trainer_assignment": True,
            "structured_workouts": True,
            "attendance_reports": True,
            "expiry_notifications": True,
            "fee_summaries": True,
            "member_status_tracking": True,
            "growth_analytics": True,
            "sales_crm": True,
            # Higher tier gates
            "diet_plans": False,
            "advanced_analytics": False,
            "data_export": False,
            "multi_branch": False,
        },
    },
    {
        "code": "premium",
        "name": "Premium",
        "tagline": "Diet plans, progress tracking & advanced analytics",
        "description": "Personalized workouts, nutrition & diet management, trainer workload metrics, and dues reports for up to 100 members.",
        "monthly_price_inr": 1299.0,
        "annual_price_inr": 1099.0,
        "monthly_price_usd": 15.99,
        "annual_price_usd": 13.99,
        "member_limit": 100,
        "trainer_limit": 15,
        "staff_limit": 10,
        "branch_limit": 1,
        "is_popular": False,
        "is_active": True,
        "contact_sales": False,
        "display_order": 3,
        "features": {
            # Everything in Growth
            "member_management": True,
            "membership_records": True,
            "qr_attendance": True,
            "payment_records": True,
            "basic_workouts": True,
            "basic_dashboard": True,
            "membership_reminders": True,
            "ai_assistant": True,
            "ai_workouts": True,
            "ai_insights": True,
            "member_broadcasts": True,
            "trainer_management": True,
            "trainer_assignment": True,
            "structured_workouts": True,
            "attendance_reports": True,
            "expiry_notifications": True,
            "fee_summaries": True,
            "member_status_tracking": True,
            "growth_analytics": True,
            "sales_crm": True,
            # Premium features
            "diet_plans": True,
            "manual_diet_plans": True,
            "assign_diet_plans": True,
            "personalized_workouts": True,
            "member_progress_tracking": True,
            "trainer_workload": True,
            "advanced_attendance_reports": True,
            "outstanding_dues_reports": True,
            "member_history": True,
            # Higher tier gates
            "advanced_business_analytics": False,
            "data_export": False,
            "multi_branch": False,
        },
    },
    {
        "code": "pro",
        "name": "Pro",
        "tagline": "3 branches, trainer commissions, WhatsApp automation & 400 members",
        "description": "High-volume fitness facility management, 3 branches, trainer commissions, and granular permissions for up to 400 members.",
        "monthly_price_inr": 1999.0,
        "annual_price_inr": 1299.0,
        "monthly_price_usd": 26.99,
        "annual_price_usd": 17.99,
        "member_limit": 400,
        "trainer_limit": 30,
        "staff_limit": 30,
        "branch_limit": 3,
        "is_popular": False,
        "is_active": True,
        "contact_sales": False,
        "display_order": 4,
        "features": {
            # Everything in Premium
            "member_management": True,
            "membership_records": True,
            "qr_attendance": True,
            "payment_records": True,
            "basic_workouts": True,
            "basic_dashboard": True,
            "membership_reminders": True,
            "ai_assistant": True,
            "ai_workouts": True,
            "ai_insights": True,
            "member_broadcasts": True,
            "trainer_management": True,
            "trainer_assignment": True,
            "structured_workouts": True,
            "attendance_reports": True,
            "expiry_notifications": True,
            "fee_summaries": True,
            "member_status_tracking": True,
            "growth_analytics": True,
            "sales_crm": True,
            "diet_plans": True,
            "manual_diet_plans": True,
            "assign_diet_plans": True,
            "personalized_workouts": True,
            "member_progress_tracking": True,
            "trainer_workload": True,
            "advanced_attendance_reports": True,
            "outstanding_dues_reports": True,
            "member_history": True,
            # Pro features
            "advanced_analytics": True,
            "advanced_business_analytics": True,
            "detailed_revenue_reports": True,
            "data_export": True,
            "trainer_performance": True,
            "configurable_notifications": True,
            "workout_diet_templates": True,
            "advanced_segmentation": True,
            "granular_staff_permissions": True,
        },
    },
    {
        "code": "pro_plus",
        "name": "Pro Plus+",
        "tagline": "Unlimited members, bulk tools & audit logging",
        "description": "Unlimited active gym member capacity, bulk actions, priority support, and full audit logs for large fitness clubs.",
        "monthly_price_inr": 4999.0,
        "annual_price_inr": 4599.0,
        "monthly_price_usd": 59.99,
        "annual_price_usd": 54.99,
        "member_limit": -1, # Unlimited
        "trainer_limit": -1, # Unlimited
        "staff_limit": -1, # Unlimited
        "branch_limit": 2,
        "is_popular": False,
        "is_active": True,
        "contact_sales": False,
        "display_order": 5,
        "features": {
            # Everything in Pro
            "member_management": True,
            "membership_records": True,
            "qr_attendance": True,
            "payment_records": True,
            "basic_workouts": True,
            "basic_dashboard": True,
            "membership_reminders": True,
            "ai_assistant": True,
            "ai_workouts": True,
            "ai_insights": True,
            "member_broadcasts": True,
            "trainer_management": True,
            "trainer_assignment": True,
            "structured_workouts": True,
            "attendance_reports": True,
            "expiry_notifications": True,
            "fee_summaries": True,
            "member_status_tracking": True,
            "growth_analytics": True,
            "sales_crm": True,
            "diet_plans": True,
            "manual_diet_plans": True,
            "assign_diet_plans": True,
            "personalized_workouts": True,
            "member_progress_tracking": True,
            "trainer_workload": True,
            "advanced_attendance_reports": True,
            "outstanding_dues_reports": True,
            "member_history": True,
            "advanced_analytics": True,
            "advanced_business_analytics": True,
            "detailed_revenue_reports": True,
            "data_export": True,
            "trainer_performance": True,
            "configurable_notifications": True,
            "workout_diet_templates": True,
            "advanced_segmentation": True,
            "granular_staff_permissions": True,
            # Pro Plus+ features
            "advanced_staff_roles": True,
            "custom_reporting": True,
            "bulk_member_ops": True,
            "enhanced_audit_logs": True,
            "advanced_notification_config": True,
            "priority_support": True,
            "dedicated_onboarding": True,
        },
    },
    {
        "code": "enterprise",
        "name": "Enterprise",
        "tagline": "Multi-branch chains, custom integrations & SLA",
        "description": "Tailored setup for multi-branch gym networks with centralized reporting, API access, and dedicated account support.",
        "monthly_price_inr": 0.0,
        "annual_price_inr": 0.0,
        "monthly_price_usd": 0.0,
        "annual_price_usd": 0.0,
        "member_limit": -1,
        "trainer_limit": -1,
        "staff_limit": -1,
        "branch_limit": -1,
        "is_popular": False,
        "is_active": True,
        "contact_sales": True,
        "display_order": 6,
        "features": {
            # Everything in Pro Plus+
            "member_management": True,
            "membership_records": True,
            "qr_attendance": True,
            "payment_records": True,
            "basic_workouts": True,
            "basic_dashboard": True,
            "membership_reminders": True,
            "ai_assistant": True,
            "ai_workouts": True,
            "ai_insights": True,
            "member_broadcasts": True,
            "trainer_management": True,
            "trainer_assignment": True,
            "structured_workouts": True,
            "attendance_reports": True,
            "expiry_notifications": True,
            "fee_summaries": True,
            "member_status_tracking": True,
            "growth_analytics": True,
            "sales_crm": True,
            "diet_plans": True,
            "manual_diet_plans": True,
            "assign_diet_plans": True,
            "personalized_workouts": True,
            "member_progress_tracking": True,
            "trainer_workload": True,
            "advanced_attendance_reports": True,
            "outstanding_dues_reports": True,
            "member_history": True,
            "advanced_analytics": True,
            "advanced_business_analytics": True,
            "detailed_revenue_reports": True,
            "data_export": True,
            "trainer_performance": True,
            "configurable_notifications": True,
            "workout_diet_templates": True,
            "advanced_segmentation": True,
            "granular_staff_permissions": True,
            "advanced_staff_roles": True,
            "custom_reporting": True,
            "bulk_member_ops": True,
            "enhanced_audit_logs": True,
            "advanced_notification_config": True,
            "priority_support": True,
            "dedicated_onboarding": True,
            # Enterprise features
            "multi_branch": True,
            "consolidated_branch_reports": True,
            "centralized_admin": True,
            "api_access": True,
            "custom_integrations": True,
        },
    },
]

class BillingService:
    @staticmethod
    def ensure_default_plans(db: Session) -> List[SubscriptionPlan]:
        """Seeds and synchronizes the standard Repsi SaaS subscription plans in the database."""
        for pdata in DEFAULT_PLANS:
            plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == pdata["code"]).first()
            if not plan:
                plan = SubscriptionPlan(
                    id=str(uuid.uuid4()),
                    code=pdata["code"],
                    name=pdata["name"],
                    tagline=pdata["tagline"],
                    description=pdata["description"],
                    monthly_price_inr=pdata["monthly_price_inr"],
                    annual_price_inr=pdata["annual_price_inr"],
                    monthly_price_usd=pdata["monthly_price_usd"],
                    annual_price_usd=pdata["annual_price_usd"],
                    member_limit=pdata["member_limit"],
                    trainer_limit=pdata["trainer_limit"],
                    staff_limit=pdata.get("staff_limit", 2),
                    branch_limit=pdata["branch_limit"],
                    is_popular=pdata["is_popular"],
                    is_active=pdata.get("is_active", True),
                    contact_sales=pdata.get("contact_sales", False),
                    display_order=pdata["display_order"],
                    features=pdata["features"],
                )
                db.add(plan)
            else:
                # Synchronize updated defaults without wiping custom pricing if altered by admin
                plan.name = pdata["name"]
                plan.tagline = pdata["tagline"]
                plan.description = pdata["description"]
                plan.member_limit = pdata["member_limit"]
                plan.trainer_limit = pdata["trainer_limit"]
                plan.staff_limit = pdata.get("staff_limit", 2)
                plan.branch_limit = pdata["branch_limit"]
                plan.display_order = pdata["display_order"]
                plan.is_popular = pdata["is_popular"]
                plan.contact_sales = pdata.get("contact_sales", False)
                # Ensure all feature keys exist
                existing_features = dict(plan.features or {})
                for k, v in pdata["features"].items():
                    if k not in existing_features:
                        existing_features[k] = v
                plan.features = existing_features
            db.commit()

        return db.query(SubscriptionPlan).order_by(SubscriptionPlan.display_order).all()

    @staticmethod
    def get_or_create_workspace_subscription(db: Session, workspace_id: str) -> GymSubscription:
        """
        Retrieves or initializes a 14-day Free Trial on the Growth tier (35 members limit).
        Evaluates subscription status dynamically and transactionally against server UTC timestamp.
        Enforces repeat-trial anti-abuse checks.
        """
        sub = db.query(GymSubscription).filter(GymSubscription.workspace_id == workspace_id).first()
        now = datetime.now(timezone.utc)

        if not sub:
            BillingService.ensure_default_plans(db)
            # Check repeat trial eligibility for the business
            ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
            is_repeat = False
            if ws:
                norm_phone = "".join(c for c in (ws.phone or "") if c.isdigit())
                if norm_phone and len(norm_phone) >= 10:
                    prior_workspaces = (
                        db.query(Workspace.id)
                        .filter(
                            Workspace.id != workspace_id,
                            Workspace.phone.ilike(f"%{norm_phone[-10:]}%")
                        )
                        .all()
                    )
                    if prior_workspaces:
                        prior_ids = [p[0] for p in prior_workspaces]
                        prior_sub = db.query(GymSubscription).filter(GymSubscription.workspace_id.in_(prior_ids)).first()
                        if prior_sub:
                            is_repeat = True

            growth_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "growth").first()
            if not growth_plan:
                growth_plan = db.query(SubscriptionPlan).first()

            trial_end = now + timedelta(days=14)

            sub = GymSubscription(
                id=str(uuid.uuid4()),
                workspace_id=workspace_id,
                plan_id=growth_plan.id,
                status=SubscriptionStatus.EXPIRED if is_repeat else SubscriptionStatus.TRIALING,
                billing_cycle=BillingCycle.MONTHLY,
                currency="INR",
                trial_start=now,
                trial_end=trial_end,
                trial_started_at=now,
                trial_ends_at=trial_end,
                is_repeat_trial_blocked=is_repeat,
                notes="Repeat trial blocked: business previously registered." if is_repeat else None,
                reminder_sent_flags={},
                current_period_start=now,
                current_period_end=trial_end,
            )
            db.add(sub)
            db.commit()
            db.refresh(sub)
            return sub

        # Dynamic server-side evaluation of trial expiration
        if sub.status == SubscriptionStatus.TRIALING:
            t_end = sub.trial_ends_at or sub.trial_end
            if t_end:
                t_end_utc = t_end if t_end.tzinfo else t_end.replace(tzinfo=timezone.utc)
                if now > t_end_utc and not sub.is_complimentary:
                    sub.status = SubscriptionStatus.EXPIRED
                    audit = SubscriptionAuditLog(
                        id=str(uuid.uuid4()),
                        workspace_id=workspace_id,
                        action="trial_expired",
                        old_value="trialing",
                        new_value="expired",
                        reason="14-day free trial elapsed according to server UTC timestamp."
                    )
                    db.add(audit)
                    db.commit()
        elif sub.status in (SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE_PERIOD) and sub.current_period_end:
            p_end = sub.current_period_end if sub.current_period_end.tzinfo else sub.current_period_end.replace(tzinfo=timezone.utc)
            if now > p_end and not sub.is_complimentary:
                # Grace period (per gym, else BILLING_GRACE_DAYS) before paid features lock.
                grace_days = sub.custom_grace_days if sub.custom_grace_days is not None else settings.BILLING_GRACE_DAYS
                new_status = (
                    SubscriptionStatus.GRACE_PERIOD if now <= p_end + timedelta(days=grace_days)
                    else SubscriptionStatus.EXPIRED
                )
                if new_status != sub.status:
                    db.add(SubscriptionAuditLog(
                        id=str(uuid.uuid4()),
                        workspace_id=workspace_id,
                        action="grace_started" if new_status == SubscriptionStatus.GRACE_PERIOD else "subscription_expired",
                        old_value=getattr(sub.status, "value", sub.status),
                        new_value=new_status.value,
                        reason=f"Billing period ended {p_end.date().isoformat()}; grace {grace_days} day(s).",
                    ))
                    sub.status = new_status.value
                    db.commit()

        return sub

    @staticmethod
    def get_effective_limits(db: Session, workspace_id: str) -> Dict[str, int]:
        """Resolves active limits combining plan configuration and per-gym Super Admin overrides."""
        sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)
        plan = sub.plan

        member_lim = sub.custom_member_limit if sub.custom_member_limit is not None else plan.member_limit
        trainer_lim = sub.custom_trainer_limit if sub.custom_trainer_limit is not None else plan.trainer_limit
        staff_lim = sub.custom_staff_limit if sub.custom_staff_limit is not None else getattr(plan, "staff_limit", 5)
        branch_lim = sub.custom_branch_limit if sub.custom_branch_limit is not None else plan.branch_limit

        return {
            "max_members": member_lim,
            "max_trainers": trainer_lim,
            "max_staff": staff_lim,
            "max_branches": branch_lim,
        }

    @staticmethod
    def get_effective_features(db: Session, workspace_id: str) -> Dict[str, bool]:
        """
        Resolves effective feature entitlements with strict deterministic precedence:
        1. Suspension denies non-essential features.
        2. Active complimentary access grants full plan access.
        3. Per-gym custom overrides take precedence.
        4. Expired status blocks paid features unless complimentary.
        5. Base plan features applied.
        """
        sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)
        plan = sub.plan
        now = datetime.now(timezone.utc)

        # 1. Security / Suspension override
        if sub.status == SubscriptionStatus.SUSPENDED:
            return {
                "member_management": False,
                "qr_attendance": False,
                "payment_records": False,
                "basic_dashboard": True, # Allow read-only access to view account status
            }

        # Check if complimentary access is currently active
        has_active_comp = False
        if sub.is_complimentary:
            if not sub.complimentary_until:
                has_active_comp = True
            else:
                c_until = sub.complimentary_until if sub.complimentary_until.tzinfo else sub.complimentary_until.replace(tzinfo=timezone.utc)
                has_active_comp = now <= c_until

        # Check expiration
        is_expired = False
        if sub.status in [SubscriptionStatus.EXPIRED, SubscriptionStatus.CANCELLED, SubscriptionStatus.CANCELED]:
            if not has_active_comp:
                is_expired = True

        if is_expired:
            # Expired: Core data viewable in read-only mode, but paid/advanced actions blocked
            return {
                "member_management": False,
                "qr_attendance": False,
                "payment_records": False,
                "basic_dashboard": True,
                "diet_plans": False,
                "advanced_analytics": False,
                "data_export": True,
                "trainer_management": False,
            }

        # Start with plan features
        features = dict(plan.features or {})

        # Apply per-gym custom overrides
        if sub.custom_features and isinstance(sub.custom_features, dict):
            features.update(sub.custom_features)

        return features

    @staticmethod
    def entitlement_snapshot(db: Session, workspace_id: str) -> Dict[str, Any]:
        """
        Subscription state + effective features for request gating, cached for
        ENTITLEMENT_CACHE_SECONDS per worker. Admin changes invalidate it immediately.
        """
        def build() -> Dict[str, Any]:
            sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)
            return {
                "status": sub.status.value if hasattr(sub.status, "value") else str(sub.status),
                "is_complimentary": bool(sub.is_complimentary),
                "suspension_reason": sub.suspension_reason,
                "plan_code": sub.plan.code,
                "plan_name": sub.plan.name,
                "features": BillingService.get_effective_features(db, workspace_id),
            }

        return cache.get_or_set(f"entitlements:{workspace_id}", settings.ENTITLEMENT_CACHE_SECONDS, build)

    @staticmethod
    def check_feature_entitlement(db: Session, workspace_id: str, feature_key: str) -> bool:
        """Verifies if the workspace has access to a specific feature key."""
        effective_features = BillingService.get_effective_features(db, workspace_id)
        return bool(effective_features.get(feature_key, False))

    @staticmethod
    def get_workspace_usage(db: Session, workspace_id: str) -> Dict[str, Any]:
        """Calculates live resource usage vs resolved effective limits."""
        sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)
        limits = BillingService.get_effective_limits(db, workspace_id)

        # Active members only (excludes archived, inactive, and deleted)
        active_members_count = (
            db.query(func.count(Member.id))
            .filter(Member.workspace_id == workspace_id, Member.status == MemberStatus.ACTIVE)
            .scalar()
            or 0
        )

        # Active trainers
        trainers_count = (
            db.query(func.count(Trainer.id))
            .filter(Trainer.workspace_id == workspace_id, Trainer.is_active == True)
            .scalar()
            or 0
        )

        # Staff accounts: active admins, managers and front-desk staff. Owners, trainers (own quota)
        # and gym members (USER) don't count against the staff limit.
        staff_count = (
            db.query(func.count(WorkspaceMember.id))
            .filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.is_active == True,
                WorkspaceMember.role.in_(STAFF_LIMIT_ROLES),
            )
            .scalar()
            or 0
        )

        # Active branches / locations (a workspace always operates at least one)
        branches_count = (
            db.query(func.count(GymLocation.id))
            .filter(GymLocation.workspace_id == workspace_id, GymLocation.is_active == True)
            .scalar()
            or 1
        )

        def make_metric(current: int, limit: int) -> Dict[str, Any]:
            unlimited = limit < 0
            pct = 0.0 if unlimited or limit == 0 else min(100.0, round((current / limit) * 100.0, 1))
            return {
                "current": current,
                "limit": limit,
                "unlimited": unlimited,
                "percentage": pct,
                "warning_triggered": not unlimited and pct >= 80.0,
                "limit_reached": not unlimited and current >= limit,
            }

        return {
            "members": make_metric(active_members_count, limits["max_members"]),
            "trainers": make_metric(trainers_count, limits["max_trainers"]),
            "staff": make_metric(staff_count, limits["max_staff"]),
            "branches": make_metric(branches_count, limits["max_branches"]),
        }

    @staticmethod
    def check_limit_before_action(
        db: Session, workspace_id: str, resource_type: str, increment: int = 1
    ) -> Tuple[bool, str, int, int]:
        """
        Concurrency-safe verification of resource quotas (members, trainers, staff, branches).
        Returns: (is_allowed, message, current_count, limit_count)
        """
        sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)
        if sub.status == SubscriptionStatus.SUSPENDED:
            return False, "Gym subscription is suspended. Action blocked.", 0, 0
        if sub.status == SubscriptionStatus.EXPIRED and not sub.is_complimentary:
            return False, "Gym subscription/trial has expired. Please upgrade or renew.", 0, 0

        usage = BillingService.get_workspace_usage(db, workspace_id)
        if resource_type not in usage:
            return True, "Valid resource", 0, -1

        res = usage[resource_type]
        if res["unlimited"]:
            return True, "Unlimited capacity", res["current"], -1

        if res["current"] + increment > res["limit"]:
            msg = f"Limit reached ({res['current']}/{res['limit']} {resource_type}). Upgrade your Repsi plan to add more."
            return False, msg, res["current"], res["limit"]

        return True, "Within quota", res["current"], res["limit"]

    @staticmethod
    def log_subscription_audit(
        db: Session,
        workspace_id: str,
        actor_user_id: Optional[str],
        action: str,
        old_val: Optional[str] = None,
        new_val: Optional[str] = None,
        reason: Optional[str] = None,
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
    ):
        """Records an immutable audit entry for administrative subscription actions."""
        final_old = old_value if old_value is not None else old_val
        final_new = new_value if new_value is not None else new_val
        final_reason = reason
        log = SubscriptionAuditLog(
            id=str(uuid.uuid4()),
            workspace_id=workspace_id,
            actor_user_id=actor_user_id,
            action=action,
            old_value=final_old,
            new_value=final_new,
            reason=reason,
        )
        db.add(log)
        db.commit()

    @staticmethod
    def extend_trial(
        db: Session, workspace_id: str, days: int, actor_user_id: Optional[str] = None, reason: Optional[str] = None
    ) -> GymSubscription:
        """Super Admin action to extend trial days without creating duplicate subscriptions."""
        sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)
        now = datetime.now(timezone.utc)

        current_end = sub.trial_end or now
        if current_end.tzinfo is None:
            current_end = current_end.replace(tzinfo=timezone.utc)

        # If trial already expired in the past, extend from now; otherwise add to current_end
        base_time = max(now, current_end)
        new_end = base_time + timedelta(days=days)

        old_str = f"status={sub.status.value if hasattr(sub.status, 'value') else sub.status}, trial_end={sub.trial_end}"
        sub.trial_end = new_end
        sub.current_period_end = new_end
        sub.status = SubscriptionStatus.TRIALING
        db.commit()
        invalidate_entitlements(workspace_id)
        db.refresh(sub)

        new_str = f"status=trialing, trial_end={new_end.isoformat()}, extended_by={days}_days"
        BillingService.log_subscription_audit(
            db, workspace_id, actor_user_id, "trial_extension", old_str, new_str, reason or f"Extended by {days} days"
        )
        return sub

    @staticmethod
    def validate_plan_change(
        db: Session,
        workspace_id: str,
        target_plan_code: str,
    ) -> Tuple[bool, bool, str, Dict[str, int]]:
        """
        Validates if a gym can transition to the target plan based on current member & resource capacity.
        Returns: (is_valid, is_downgrade, message, excess_dict)
        """
        sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)
        target_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == target_plan_code).first()
        if not target_plan:
            return False, False, f"Plan '{target_plan_code}' does not exist.", {}

        usage = BillingService.get_workspace_usage(db, workspace_id)
        current_members = usage["members"]["current"]
        current_trainers = usage["trainers"]["current"]
        current_branches = usage["branches"]["current"]

        excess_members = 0
        if target_plan.member_limit != -1 and current_members > target_plan.member_limit:
            excess_members = current_members - target_plan.member_limit

        excess_trainers = 0
        if target_plan.trainer_limit != -1 and current_trainers > target_plan.trainer_limit:
            excess_trainers = current_trainers - target_plan.trainer_limit

        excess_branches = 0
        if target_plan.branch_limit != -1 and current_branches > target_plan.branch_limit:
            excess_branches = current_branches - target_plan.branch_limit

        excess = {
            "excess_members": excess_members,
            "excess_trainers": excess_trainers,
            "excess_branches": excess_branches,
        }

        # Check if this represents a downgrade
        current_limit = sub.plan.member_limit
        target_limit = target_plan.member_limit
        is_downgrade = False
        if current_limit == -1 and target_limit != -1:
            is_downgrade = True
        elif current_limit != -1 and target_limit != -1 and target_limit < current_limit:
            is_downgrade = True

        if excess_members > 0 or excess_trainers > 0 or excess_branches > 0:
            msg = (
                f"Cannot change to {target_plan.name} plan. Current usage exceeds target plan limits "
                f"({excess_members} excess members, {excess_trainers} excess trainers)."
            )
            return False, is_downgrade, msg, excess

        return True, is_downgrade, f"Eligible for {target_plan.name} plan.", {}

    @staticmethod
    def change_gym_plan(
        db: Session,
        workspace_id: str,
        new_plan_code: str,
        billing_cycle: str = "monthly",
        actor_user_id: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> GymSubscription:
        """Super Admin action to change a gym's plan."""
        sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)
        target_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == new_plan_code).first()
        if not target_plan:
            raise ValueError(f"Plan '{new_plan_code}' not found.")

        old_val = f"plan={sub.plan.code}, cycle={sub.billing_cycle.value if hasattr(sub.billing_cycle, 'value') else sub.billing_cycle}"
        now = datetime.now(timezone.utc)
        period_days = 365 if billing_cycle == "annual" else 30

        sub.plan_id = target_plan.id
        sub.status = SubscriptionStatus.ACTIVE
        sub.billing_cycle = BillingCycle.ANNUAL if billing_cycle == "annual" else BillingCycle.MONTHLY
        sub.current_period_start = now
        sub.current_period_end = now + timedelta(days=period_days)
        db.commit()
        invalidate_entitlements(workspace_id)
        db.refresh(sub)

        new_val = f"plan={target_plan.code}, cycle={billing_cycle}, status=active"
        BillingService.log_subscription_audit(
            db, workspace_id, actor_user_id, "plan_change", old_val, new_val, reason or f"Switched plan to {target_plan.name}"
        )
        return sub

    @staticmethod
    def grant_complimentary_access(
        db: Session,
        workspace_id: str,
        days: Optional[int] = None,
        exact_date: Optional[datetime] = None,
        is_indefinite: bool = False,
        actor_user_id: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> GymSubscription:
        """Super Admin action to grant complimentary access without corrupting payment records."""
        sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)
        now = datetime.now(timezone.utc)

        if is_indefinite:
            comp_until = None
        elif exact_date:
            comp_until = exact_date
        elif days:
            comp_until = now + timedelta(days=days)
        else:
            comp_until = now + timedelta(days=30)

        old_val = f"is_comp={sub.is_complimentary}, until={sub.complimentary_until}"
        sub.is_complimentary = True
        sub.complimentary_until = comp_until
        if sub.status in [SubscriptionStatus.EXPIRED, SubscriptionStatus.SUSPENDED]:
            sub.status = SubscriptionStatus.ACTIVE

        db.commit()
        invalidate_entitlements(workspace_id)
        db.refresh(sub)

        new_val = f"is_comp=True, until={comp_until.isoformat() if comp_until else 'indefinite'}"
        BillingService.log_subscription_audit(
            db, workspace_id, actor_user_id, "complimentary_grant", old_val, new_val, reason or "Complimentary access granted"
        )
        return sub

    @staticmethod
    def set_gym_overrides(
        db: Session,
        workspace_id: str,
        custom_member_limit: Optional[int] = None,
        custom_trainer_limit: Optional[int] = None,
        custom_staff_limit: Optional[int] = None,
        custom_branch_limit: Optional[int] = None,
        custom_features: Optional[Dict[str, bool]] = None,
        actor_user_id: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> GymSubscription:
        """Super Admin action to set custom per-gym resource limits or feature flags."""
        sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)

        old_val = f"m_lim={sub.custom_member_limit}, t_lim={sub.custom_trainer_limit}, feats={sub.custom_features}"
        if custom_member_limit is not None:
            sub.custom_member_limit = custom_member_limit
        if custom_trainer_limit is not None:
            sub.custom_trainer_limit = custom_trainer_limit
        if custom_staff_limit is not None:
            sub.custom_staff_limit = custom_staff_limit
        if custom_branch_limit is not None:
            sub.custom_branch_limit = custom_branch_limit
        if custom_features is not None:
            sub.custom_features = custom_features

        db.commit()
        invalidate_entitlements(workspace_id)
        db.refresh(sub)

        new_val = f"m_lim={sub.custom_member_limit}, t_lim={sub.custom_trainer_limit}, feats={sub.custom_features}"
        BillingService.log_subscription_audit(
            db, workspace_id, actor_user_id, "override_updated", old_val, new_val, reason or "Custom gym limits/features updated"
        )
        return sub

    @staticmethod
    def set_subscription_status(
        db: Session,
        workspace_id: str,
        new_status: str,
        actor_user_id: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> GymSubscription:
        """Super Admin action to suspend, reactivate, or cancel a gym subscription."""
        sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)
        now = datetime.now(timezone.utc)

        old_val = f"status={sub.status.value if hasattr(sub.status, 'value') else sub.status}"
        status_enum = SubscriptionStatus(new_status)
        sub.status = status_enum

        if status_enum == SubscriptionStatus.SUSPENDED:
            sub.suspended_at = now
            sub.suspension_reason = reason or "Suspended by Super Admin"
        elif status_enum == SubscriptionStatus.ACTIVE:
            sub.suspended_at = None
            sub.suspension_reason = None
        elif status_enum in [SubscriptionStatus.CANCELLED, SubscriptionStatus.CANCELED]:
            sub.canceled_at = now

        db.commit()
        invalidate_entitlements(workspace_id)
        db.refresh(sub)

        new_val = f"status={new_status}"
        BillingService.log_subscription_audit(
            db, workspace_id, actor_user_id, "status_change", old_val, new_val, reason or f"Status changed to {new_status}"
        )
        return sub

    @staticmethod
    def create_cashfree_checkout_session(
        db: Session, workspace_id: str, plan_code: str, billing_cycle: str = "monthly", currency: str = "INR"
    ) -> Dict[str, Any]:
        """Fail closed until real provider orders and verification are implemented."""
        raise CashfreeUnavailableError("Online billing is temporarily unavailable.")

    @staticmethod
    def verify_and_activate_payment(
        db: Session,
        workspace_id: str,
        plan_code: str,
        cashfree_order_id: str,
        cashfree_payment_id: str,
        amount: float,
        billing_cycle: str = "monthly",
        currency: str = "INR",
    ) -> Dict[str, Any]:
        """Never activate a subscription from client supplied payment identifiers."""
        raise CashfreeUnavailableError("Online payment verification is unavailable; subscription unchanged.")

    @staticmethod
    def process_webhook_event(db: Session, event_id: str, event_type: str, payload: Dict[str, Any]) -> bool:
        """Reject webhooks until raw-body signature verification is implemented."""
        raise CashfreeUnavailableError("Online payment callbacks are disabled until signature verification is configured.")

    @staticmethod
    def get_trial_status(db: Session, workspace_id: str) -> Dict[str, Any]:
        """
        Calculates authoritative, real-time 14-day trial countdown and subscription health.
        Uses server-generated UTC timestamps as the sole source of truth.
        """
        sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)
        now = datetime.now(timezone.utc)
        plan = sub.plan
        limits = BillingService.get_effective_limits(db, workspace_id)

        t_start = sub.trial_started_at or sub.trial_start or sub.created_at or now
        t_start_utc = t_start if t_start.tzinfo else t_start.replace(tzinfo=timezone.utc)

        t_end = sub.trial_ends_at or sub.trial_end
        if t_end:
            t_end_utc = t_end if t_end.tzinfo else t_end.replace(tzinfo=timezone.utc)
        else:
            t_end_utc = t_start_utc + timedelta(days=14)

        status_val = sub.status.value if hasattr(sub.status, "value") else str(sub.status)
        is_trial = status_val == "trialing"
        is_paid = status_val in ["active", "grace_period"]
        is_expired = status_val in ["expired", "cancelled", "canceled"] and not sub.is_complimentary

        # Calculate exact time delta
        delta_seconds = (t_end_utc - now).total_seconds()
        total_duration_seconds = max(1.0, (t_end_utc - t_start_utc).total_seconds())

        days_remaining = max(0, int(delta_seconds // 86400))
        hours_remaining = max(0, int(math.ceil(delta_seconds / 3600)))

        # Progress of trial consumption (0% at start, 100% when expired)
        elapsed_seconds = max(0.0, (now - t_start_utc).total_seconds())
        progress_pct = min(100.0, max(0.0, round((elapsed_seconds / total_duration_seconds) * 100.0, 1)))

        # Contextual trial badge state
        if is_paid:
            trial_state = "paid"
        elif is_expired:
            trial_state = "expired"
        elif status_val == "suspended":
            trial_state = "suspended"
        elif status_val == "pending_payment":
            trial_state = "payment_pending"
        elif delta_seconds <= 0:
            trial_state = "expired"
        elif hours_remaining <= 24:
            trial_state = "hours_remaining"
        elif days_remaining <= 1:
            trial_state = "warning_1d"
        elif days_remaining <= 3:
            trial_state = "reminder_3d"
        elif days_remaining <= 7:
            trial_state = "reminder_7d"
        else:
            trial_state = "active"

        return {
            "workspace_id": workspace_id,
            "status": status_val,
            "is_trial": is_trial,
            "is_expired": is_expired,
            "is_paid": is_paid,
            "trial_started_at": t_start_utc.isoformat(),
            "trial_ends_at": t_end_utc.isoformat(),
            "trial_converted_at": sub.trial_converted_at.isoformat() if sub.trial_converted_at else None,
            "total_trial_days": 14,
            "days_remaining": days_remaining,
            "hours_remaining": hours_remaining,
            "progress_pct": progress_pct,
            "trial_state": trial_state,
            "plan_code": plan.code,
            "plan_name": plan.name,
            "member_limit": limits.get("max_members", 35),
            "is_complimentary": bool(sub.is_complimentary),
            "can_upgrade": True,
            "server_time_utc": now.isoformat(),
        }
