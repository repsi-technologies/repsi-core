"""Super admin platform data is real (no invented numbers), workspace suspension is enforced, and caches invalidate."""
import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.core import cache
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.billing import GymSubscription, PaymentStatus, SubscriptionPayment, SubscriptionPlan
from app.models.communication import NotificationDelivery
from app.models.system import Notification
from app.models.user import User
from app.services.billing import BillingService
from tests.conftest import TestingSessionLocal

client = TestClient(app)
API = "/api/v1"


def uid() -> str:
    return uuid.uuid4().hex[:8]


def superadmin_headers() -> dict:
    db = TestingSessionLocal()
    try:
        u = User(email=f"platform.{uid()}@example.com", full_name="Platform Admin",
                 hashed_password=get_password_hash("SuperAdmin2026!"), is_superadmin=True, is_active=True)
        db.add(u)
        db.commit()
        return {"Authorization": f"Bearer {create_access_token(u.id, None, 'SUPER_ADMIN')}"}
    finally:
        db.close()


def owner(prefix: str) -> tuple[dict, str, str]:
    res = client.post(f"{API}/auth/register", json={
        "full_name": f"{prefix} Owner", "email": f"{prefix}.{uid()}@example.com", "password": "Password123!",
        "gym_name": f"{prefix} Gym {uid()}", "gym_phone": f"+91 9{uuid.uuid4().int % 10**9:09d}", "gym_city": "Pune",
    })
    assert res.status_code == 201, res.text
    body = res.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["workspace_id"], body["user"]["id"]


def make_paid(workspace_id: str, plan_code: str = "premium", cycle: str = "monthly"):
    db = TestingSessionLocal()
    try:
        sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == plan_code).one()
        sub.plan_id, sub.status, sub.billing_cycle = plan.id, "active", cycle
        db.add_all([
            SubscriptionPayment(id=str(uuid.uuid4()), workspace_id=workspace_id, subscription_id=sub.id,
                                amount=plan.monthly_price_inr, status=PaymentStatus.SUCCESS, payment_method="upi"),
            SubscriptionPayment(id=str(uuid.uuid4()), workspace_id=workspace_id, subscription_id=sub.id,
                                amount=99.0, status=PaymentStatus.FAILED, payment_method="card"),
        ])
        snapshot = type("Plan", (), {"name": plan.name, "monthly_price_inr": plan.monthly_price_inr})
        db.commit()
        return snapshot
    finally:
        db.close()


def test_superadmin_endpoints_require_superadmin():
    headers, _, _ = owner("notadmin")
    for path in ("/superadmin/overview", "/superadmin/revenue", "/superadmin/workspaces", "/superadmin/payments",
                 "/superadmin/system-health", "/superadmin/broadcasts"):
        assert client.get(f"{API}{path}").status_code == 401, path
        assert client.get(f"{API}{path}", headers=headers).status_code == 403, path


def test_overview_and_revenue_come_from_real_rows():
    admin = superadmin_headers()
    before = client.get(f"{API}/superadmin/overview", headers=admin).json()
    _, ws, _ = owner("paid")
    plan = make_paid(ws)
    after = client.get(f"{API}/superadmin/overview", headers=admin).json()

    assert after["total_gyms"] == before["total_gyms"] + 1
    assert after["paid_gyms"] == before["paid_gyms"] + 1
    assert after["monthly_revenue"] == round(before["monthly_revenue"] + plan.monthly_price_inr, 2)
    assert after["failed_payments_count"] == before["failed_payments_count"] + 1
    assert after["gym_growth_chart"][-1]["value"] == after["total_gyms"]  # cumulative to date
    assert "Apex Fitness" not in str(after["recent_activities"])  # no invented activity

    revenue = client.get(f"{API}/superadmin/revenue", headers=admin, params={"months": 3}).json()
    this_month = revenue["months"][-1]
    assert this_month["month"] == datetime.now(timezone.utc).strftime("%Y-%m")
    assert this_month["collected"] >= plan.monthly_price_inr
    assert this_month["failed_payments"] >= 1
    assert any(r["plan"] == plan.name and r["paying"] >= 1 for r in revenue["by_plan"])


def test_workspace_list_payments_and_health_are_real():
    admin = superadmin_headers()
    _, ws, _ = owner("listed")
    make_paid(ws, "growth", "annual")
    name = client.get(f"{API}/billing/entitlements", headers=owner("x")[0]).status_code  # unrelated owner works
    assert name == 200

    res = client.get(f"{API}/superadmin/workspaces", headers=admin, params={"q": "listed", "limit": 5})
    assert res.status_code == 200, res.text
    assert int(res.headers["X-Total-Count"]) >= 1
    row = next(r for r in res.json() if r["id"] == ws)
    assert row["plan_code"] == "growth" and row["subscription_status"] == "active"
    db = TestingSessionLocal()
    try:
        growth = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "growth").one()
        assert row["mrr"] == growth.annual_price_inr
    finally:
        db.close()
    assert row["staff_count"] == 0 and row["last_active"] != "Active 5 min ago"

    payments = client.get(f"{API}/superadmin/payments", headers=admin, params={"status": "failed"}).json()
    assert payments and all(p["status"] == "failed" for p in payments)
    assert all(p["id"] not in ("pay-sub-101", "pay-sub-102") for p in payments)

    health = client.get(f"{API}/superadmin/system-health", headers=admin).json()
    by_name = {m["component"]: m for m in health["metrics"]}
    assert by_name["Email (SMTP)"]["status"] == "NOT_CONFIGURED"  # SMTP is blank in tests
    assert all(m["uptime_pct"] is None for m in health["metrics"])
    assert health["overall_status"] == "OPERATIONAL"


def test_platform_broadcast_delivers_and_logs_in_app():
    admin = superadmin_headers()
    _, ws_live, owner_live = owner("bcastlive")
    _, ws_off, owner_off = owner("bcastoff")
    assert client.patch(f"{API}/superadmin/workspaces/{ws_off}/status", headers=admin,
                        json={"is_active": False, "reason": "test"}).status_code == 200

    res = client.post(f"{API}/superadmin/broadcast", headers=admin, json={
        "target_audience": "all_owners", "subject": "Maintenance window", "message": "Sunday 2am IST",
    })
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["status"] == "sent" and body["recipients"] >= 1
    db = TestingSessionLocal()
    try:
        got = {n.user_id for n in db.query(Notification).filter(Notification.title == "Maintenance window")}
        assert owner_live in got and owner_off not in got
        assert db.query(NotificationDelivery).filter(NotificationDelivery.broadcast_id == body["broadcast_id"]).count() == body["recipients"]
    finally:
        db.close()
    assert client.post(f"{API}/superadmin/broadcast", headers=admin, json={
        "target_audience": "everyone_ever", "subject": "x", "message": "y"}).status_code == 422
    history = client.get(f"{API}/superadmin/broadcasts", headers=admin).json()
    assert history[0]["id"] == body["broadcast_id"]


def test_suspended_workspace_is_restricted_until_reactivated():
    admin = superadmin_headers()
    headers, ws, _ = owner("suspend")
    member = {"first_name": "Sus", "last_name": "Pended", "email": f"sus.{uid()}@example.com", "phone": "+919811122233"}
    assert client.patch(f"{API}/superadmin/workspaces/{ws}/status", headers=admin,
                        json={"is_active": False, "reason": "Unpaid"}).status_code == 200

    r = client.post(f"{API}/members", headers=headers, json=member)
    assert r.status_code == 403 and r.json()["detail"]["error_code"] == "WORKSPACE_SUSPENDED"
    assert client.get(f"{API}/members", headers=headers).status_code == 403
    assert client.get(f"{API}/billing/entitlements", headers=headers).status_code == 200  # can see why

    assert client.patch(f"{API}/superadmin/workspaces/{ws}/status", headers=admin,
                        json={"is_active": True, "reason": "Paid"}).status_code == 200
    assert client.post(f"{API}/members", headers=headers, json=member).status_code == 201


def test_entitlement_cache_is_invalidated_by_admin_changes(monkeypatch):
    monkeypatch.setattr(settings, "CACHE_ENABLED", True)
    cache.invalidate()
    headers, ws, _ = owner("cache")
    first = client.post(f"{API}/broadcasts/preview", headers=headers, json={"segment": "all_members"})
    assert first.status_code == 200
    assert cache.stats()["entries"] >= 1

    db = TestingSessionLocal()
    try:
        BillingService.set_gym_overrides(db, ws, custom_features={"member_broadcasts": False}, reason="test")
    finally:
        db.close()
    blocked = client.post(f"{API}/broadcasts/preview", headers=headers, json={"segment": "all_members"})
    assert blocked.status_code == 403  # no stale cached grant
    cache.invalidate()
