"""Stages 3-5: orders, Cashfree adapter, webhooks, reconciliation, lifecycle, entitlements, invoices, handoff.

The real CashfreeProvider runs against an httpx.MockTransport that imitates the documented sandbox API,
so request shape, headers and signature verification are exercised. No network, no real credentials.
"""
import base64
import hashlib
import hmac
import json
import uuid
from datetime import datetime, timedelta, timezone

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.models.saas import SaasAudit, SaasInvoice, SaasOrder, SaasPlan, SaasSubscription, SaasWebhookEvent
from app.models.user import Workspace
from app.services import payment_providers, saas_billing, saas_payments
from app.services.payment_providers import CashfreeProvider
from app.services.saas_billing import (
    IllegalTransition, add_months, as_utc, lifecycle_tick, member_limit_with_grace, saas_capacity_error,
    send_renewal_reminders, sync_catalog, transition,
)
from tests.conftest import TestingSessionLocal
from tests.factories import auth, make_gym

SECRET = "sandbox-secret-for-tests"
client = TestClient(app)
UTC = timezone.utc


class FakeCashfree:
    """Imitates POST /pg/orders and GET /pg/orders/{id}/payments of the Cashfree sandbox."""

    def __init__(self):
        self.orders, self.payments, self.calls = {}, {}, []
        self.fail_create = self.fail_fetch = False

    def __call__(self, request: httpx.Request) -> httpx.Response:
        assert request.headers["x-api-version"] == settings.CASHFREE_API_VERSION
        assert request.headers["x-client-id"] == "test-app-id"
        assert request.url.host == "sandbox.cashfree.com"
        self.calls.append((request.method, request.url.path))
        if request.method == "POST" and request.url.path == "/pg/orders":
            if self.fail_create:
                return httpx.Response(500, json={"code": "internal_error"})
            body = json.loads(request.content)
            assert set(body) >= {"order_id", "order_amount", "order_currency", "customer_details", "order_meta"}
            assert len(body["customer_details"]["customer_phone"]) >= 10
            self.orders[body["order_id"]] = body
            return httpx.Response(200, json={"cf_order_id": f"cf_{body['order_id']}", "order_id": body["order_id"],
                                             "payment_session_id": f"session_{body['order_id']}", "order_status": "ACTIVE"})
        if request.method == "GET" and request.url.path.endswith("/payments"):
            if self.fail_fetch:
                return httpx.Response(503, json={"code": "unavailable"})
            ref = request.url.path.split("/")[3]
            return httpx.Response(200, json=self.payments.get(ref, []))
        return httpx.Response(404)

    def pay(self, ref: str, status: str = "SUCCESS", amount: float = None, pid: str = None):
        amount = amount if amount is not None else self.orders[ref]["order_amount"]
        self.payments.setdefault(ref, []).append({
            "cf_payment_id": pid or uuid.uuid4().hex[:12], "payment_status": status, "payment_amount": amount,
            "payment_currency": "INR", "payment_group": "upi",
            "error_details": {"error_description": "declined"} if status == "FAILED" else None,
        })


@pytest.fixture
def cf(monkeypatch):
    fake = FakeCashfree()
    provider = CashfreeProvider("test-app-id", SECRET, "TEST", settings.CASHFREE_API_VERSION,
                                client=httpx.Client(transport=httpx.MockTransport(fake)))
    payment_providers.set_provider_for_tests(provider)
    monkeypatch.setattr(settings, "SAAS_BILLING_ENABLED", True)
    alerts = []
    monkeypatch.setattr(saas_payments, "alert", lambda s, b: alerts.append(s))
    fake.alerts = alerts
    with TestingSessionLocal() as db:
        sync_catalog(db)
    yield fake
    payment_providers.set_provider_for_tests(None)


def _gym(phone="+919812345678"):
    gym = make_gym("Billing Gym")
    with TestingSessionLocal() as db:
        ws = db.get(Workspace, gym.id)
        ws.phone = phone
        db.commit()
    return gym


def _order(gym, plan="growth", cycle="monthly", key=None, role="OWNER", **extra):
    body = {"plan_code": plan, "billing_cycle": cycle, "currency": "INR", "idempotency_key": key or uuid.uuid4().hex, **extra}
    return client.post("/api/v1/saas-billing/orders", json=body, headers=gym.headers[role])


def _sub(db, gym) -> SaasSubscription:
    return db.query(SaasSubscription).filter_by(workspace_id=gym.id).one()


def _signed(payload: dict, secret: str = SECRET):
    raw = json.dumps(payload).encode()
    ts = str(int(datetime.now(UTC).timestamp() * 1000))
    sig = base64.b64encode(hmac.new(secret.encode(), ts.encode() + raw, hashlib.sha256).digest()).decode()
    return raw, {"x-webhook-timestamp": ts, "x-webhook-signature": sig, "content-type": "application/json"}


def _webhook(ref, status="SUCCESS", type_="PAYMENT_SUCCESS_WEBHOOK", pid="p1", secret=SECRET):
    payload = {"type": type_, "event_time": datetime.now(UTC).isoformat(),
               "data": {"order": {"order_id": ref, "order_amount": 999, "order_currency": "INR"},
                        "payment": {"cf_payment_id": pid, "payment_status": status, "payment_amount": 999,
                                    "payment_currency": "INR", "payment_group": "upi"}}}
    raw, headers = _signed(payload, secret)
    return client.post("/api/v1/saas-billing/webhooks/cashfree", content=raw, headers=headers)


def _set(gym, **fields):
    with TestingSessionLocal() as db:
        sub = saas_billing.get_or_create_subscription(db, gym.id)
        for k, v in fields.items():
            setattr(sub, k, v)
        db.commit()


# --- flag, catalogue, pricing --------------------------------------------------------------------

def test_routes_hidden_while_flag_off(monkeypatch):
    monkeypatch.setattr(settings, "SAAS_BILLING_ENABLED", False)
    assert client.get("/api/v1/saas-billing/plans").status_code == 404
    assert client.get("/api/v1/saas-billing/config").json()["enabled"] is False


def test_plan_sync_is_idempotent_and_leaves_overrides(cf):
    gym = _gym()
    _set(gym, price_override_minor=49900, price_override_currency="INR", billing_cycle="monthly")
    with TestingSessionLocal() as db:
        again = sync_catalog(db)
        assert again["plans_created"] == again["prices_created"] == again["prices_updated"] == 0
        assert _sub(db, gym).price_override_minor == 49900
    plans = client.get("/api/v1/saas-billing/plans").json()
    growth = next(p for p in plans if p["code"] == "growth")
    assert {p["currency"] for p in growth["prices"]} == {"INR"}  # other currencies disabled
    assert next(p for p in growth["prices"] if p["billing_cycle"] == "monthly")["amount_minor"] == 99900


def test_order_amount_is_server_side_and_tamper_proof(cf):
    gym = _gym()
    res = _order(gym, amount_minor=1, amount=1)
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["amount_minor"] == 99900 and body["status"] == "pending"
    assert body["payment_session_id"].startswith("session_") and body["environment"] == "sandbox"
    assert cf.orders[body["order_ref"]]["order_amount"] == 999.0
    assert _order(gym, cycle="weekly").status_code == 400
    usd = client.post("/api/v1/saas-billing/orders", headers=gym.headers["OWNER"],
                      json={"plan_code": "growth", "billing_cycle": "monthly", "currency": "USD", "idempotency_key": uuid.uuid4().hex})
    assert usd.status_code == 400 and usd.json()["detail"]["error_code"] == "PRICE_UNAVAILABLE"


@pytest.mark.parametrize("role", ["ADMIN", "MANAGER", "STAFF", "TRAINER", "USER"])
def test_only_owner_creates_orders(cf, role):
    gym = _gym()
    assert _order(gym, role=role).status_code == 403


def test_staff_cannot_view_billing_but_admin_can(cf):
    gym = _gym()
    assert client.get("/api/v1/saas-billing/subscription", headers=gym.headers["TRAINER"]).status_code == 403
    view = client.get("/api/v1/saas-billing/subscription", headers=gym.headers["ADMIN"]).json()
    assert view["status"] == "trialing" and view["can_manage"] is False


def test_double_click_returns_same_order(cf):
    gym = _gym()
    a, b = _order(gym, key="click-12345678"), _order(gym, key="click-12345678")
    assert a.json()["order_ref"] == b.json()["order_ref"]
    assert sum(1 for m, p in cf.calls if m == "POST") == 1
    assert _order(gym, plan="pro", key="click-12345678").status_code == 409


def test_phone_required_and_provider_failure_marks_order_failed(cf):
    gym = _gym(phone=None)
    res = _order(gym)
    assert res.status_code == 400 and res.json()["detail"]["error_code"] == "PHONE_REQUIRED"
    gym2 = _gym()
    cf.fail_create = True
    res = _order(gym2)
    assert res.status_code == 502
    with TestingSessionLocal() as db:
        assert db.query(SaasOrder).filter_by(workspace_id=gym2.id).one().status == "failed"


# --- webhooks, verification, reconciliation --------------------------------------------------------

def test_successful_payment_via_webhook_activates_once(cf):
    gym = _gym()
    ref = _order(gym).json()["order_ref"]
    # The browser redirect alone never activates anything.
    assert client.get(f"/api/v1/saas-billing/orders/{ref}", headers=gym.headers["OWNER"]).json()["status"] == "pending"
    cf.pay(ref, pid="pay-1")
    assert _webhook(ref, pid="pay-1").json()["status"] == "queued"
    assert _webhook(ref, pid="pay-1").json()["status"] == "duplicate"
    before = datetime.now(UTC)
    with TestingSessionLocal() as db:
        assert saas_payments.drain_webhooks(db)["processed"] == 1
        assert saas_payments.drain_webhooks(db)["processed"] == 0
        order = db.query(SaasOrder).filter_by(order_ref=ref).one()
        sub = _sub(db, gym)
        assert order.status == "paid" and not order.needs_review
        assert sub.status == "active" and sub.billing_cycle == "monthly"
        # Trial days don't carry over: paid_until = verification time + 1 calendar month.
        assert add_months(before, 1) - timedelta(minutes=1) <= as_utc(sub.paid_until) <= add_months(datetime.now(UTC), 1)
        inv = db.query(SaasInvoice).filter_by(order_id=order.id).one()
        assert inv.invoice_number.startswith("RP/") and len(inv.invoice_number) <= 16 and inv.tax_minor is None
    # Out-of-order: a failure webhook for the same order after success changes nothing.
    cf.pay(ref, status="FAILED", pid="pay-2")
    _webhook(ref, status="FAILED", type_="PAYMENT_FAILED_WEBHOOK", pid="pay-2")
    with TestingSessionLocal() as db:
        saas_payments.drain_webhooks(db)
        assert db.query(SaasOrder).filter_by(order_ref=ref).one().status == "paid"
        assert db.query(SaasInvoice).filter_by(workspace_id=gym.id).count() == 1


def test_invalid_signature_rejected_and_not_stored(cf):
    gym = _gym()
    ref = _order(gym).json()["order_ref"]
    res = _webhook(ref, secret="wrong-secret")
    assert res.status_code == 401
    raw, headers = _signed({"type": "PAYMENT_SUCCESS_WEBHOOK"})
    headers["x-webhook-signature"] = ""
    assert client.post("/api/v1/saas-billing/webhooks/cashfree", content=raw, headers=headers).status_code == 401
    with TestingSessionLocal() as db:
        assert db.query(SaasWebhookEvent).filter_by(order_ref=ref).count() == 0


def test_forged_body_cannot_mark_paid_without_provider_success(cf):
    """A valid signature on a success event still only triggers a provider check."""
    gym = _gym()
    ref = _order(gym).json()["order_ref"]
    _webhook(ref, pid="ghost")  # provider has no such payment
    with TestingSessionLocal() as db:
        saas_payments.drain_webhooks(db)
        assert db.query(SaasOrder).filter_by(order_ref=ref).one().status == "pending"


def test_failed_and_pending_payments_keep_order_open_then_expire(cf):
    gym = _gym()
    ref = _order(gym).json()["order_ref"]
    cf.pay(ref, status="FAILED", pid="f1")
    cf.pay(ref, status="PENDING", pid="p1")
    with TestingSessionLocal() as db:
        saas_payments.reconcile_orders(db)
        order = db.query(SaasOrder).filter_by(order_ref=ref).one()
        assert order.status == "pending"
        statuses = {a.provider_payment_id: a.status for a in db.query(saas_payments.SaasPaymentAttempt).filter_by(order_id=order.id)}
        assert statuses == {"f1": "failed", "p1": "pending"}
        saas_payments.reconcile_orders(db, now=datetime.now(UTC) + timedelta(hours=1))
        assert db.query(SaasOrder).filter_by(order_ref=ref).one().status == "expired"
        assert _sub(db, gym).status == "trialing"


def test_late_payment_after_expiry_paid_with_review(cf):
    gym = _gym()
    ref = _order(gym).json()["order_ref"]
    later = datetime.now(UTC) + timedelta(hours=2)
    with TestingSessionLocal() as db:
        saas_payments.reconcile_orders(db, now=later)
        assert db.query(SaasOrder).filter_by(order_ref=ref).one().status == "expired"
    # Catalogue price changes later; the payment still matches what was actually ordered.
    cf.pay(ref, pid="late-1")
    with TestingSessionLocal() as db:
        saas_payments.reconcile_orders(db, now=later)
        order = db.query(SaasOrder).filter_by(order_ref=ref).one()
        assert order.status == "paid" and order.needs_review
        sub = _sub(db, gym)
        assert sub.status == "active" and as_utc(sub.paid_until) == add_months(later, 1)
    assert "Late payment accepted" in cf.alerts


def test_amount_mismatch_not_activated(cf):
    gym = _gym()
    ref = _order(gym).json()["order_ref"]
    cf.pay(ref, amount=1.0)
    with TestingSessionLocal() as db:
        saas_payments.reconcile_orders(db)
        order = db.query(SaasOrder).filter_by(order_ref=ref).one()
        assert order.status == "pending" and order.needs_review
        assert _sub(db, gym).status == "trialing"
    assert "Payment amount mismatch" in cf.alerts


def test_reconcile_alerts_after_repeated_provider_errors(cf):
    gym = _gym()
    _order(gym)
    cf.fail_fetch = True
    with TestingSessionLocal() as db:
        for _ in range(3):
            saas_payments.reconcile_orders(db)
    assert "Reconciliation failing" in cf.alerts


def test_webhook_processing_retries_with_backoff(cf, monkeypatch):
    gym = _gym()
    ref = _order(gym).json()["order_ref"]
    cf.pay(ref, pid="r1")
    _webhook(ref, pid="r1")
    cf.fail_fetch = True
    with TestingSessionLocal() as db:
        assert saas_payments.drain_webhooks(db)["retry"] == 1
        ev = db.query(SaasWebhookEvent).filter_by(order_ref=ref).one()
        assert ev.attempts == 1 and ev.status == "queued" and ev.next_attempt_at is not None
        cf.fail_fetch = False
        assert saas_payments.drain_webhooks(db, now=datetime.now(UTC) + timedelta(minutes=5))["processed"] == 1
        assert db.query(SaasOrder).filter_by(order_ref=ref).one().status == "paid"


# --- renewals, upgrades, downgrades, overrides ----------------------------------------------------------

def _pay_now(cf, gym, **kw):
    ref = _order(gym, **kw).json()["order_ref"]
    cf.pay(ref)
    with TestingSessionLocal() as db:
        saas_payments.reconcile_orders(db)
    return ref


def test_early_renewal_extends_from_paid_until(cf):
    gym = _gym()
    _pay_now(cf, gym)
    future = datetime.now(UTC) + timedelta(days=10)
    _set(gym, paid_until=future)
    _pay_now(cf, gym)
    with TestingSessionLocal() as db:
        sub = _sub(db, gym)
        assert sub.status == "active" and as_utc(sub.paid_until) == add_months(future, 1)


def test_upgrade_is_prorated_and_keeps_paid_until(cf):
    gym = _gym()
    _pay_now(cf, gym)  # growth monthly
    with TestingSessionLocal() as db:
        end = as_utc(_sub(db, gym).paid_until)
    res = _order(gym, plan="pro")
    assert res.json()["kind"] == "upgrade"
    full_diff = 199900 - 99900
    assert 100 <= res.json()["amount_minor"] <= full_diff and res.json()["amount_minor"] % 100 == 0
    cf.pay(res.json()["order_ref"])
    with TestingSessionLocal() as db:
        saas_payments.reconcile_orders(db)
        sub = _sub(db, gym)
        assert db.get(SaasPlan, sub.plan_id).code == "pro" and as_utc(sub.paid_until) == end


def test_proration_math_half_period():
    with TestingSessionLocal() as db:
        sync_catalog(db)
        growth = db.query(SaasPlan).filter_by(code="growth").one()
        pro = db.query(SaasPlan).filter_by(code="pro").one()
        end = datetime(2027, 3, 1, tzinfo=UTC)
        sub = SaasSubscription(plan_id=growth.id, status="active", billing_cycle="monthly", currency="INR", paid_until=end)
        half = end - (end - add_months(end, -1)) / 2
        assert saas_payments.prorated_upgrade_amount(db, sub, pro, half) == 50000  # ₹500 of the ₹1,000 difference


def test_downgrade_must_be_scheduled_and_respects_usage(cf):
    gym = _gym()
    _pay_now(cf, gym)
    assert _order(gym, plan="lite").json()["detail"]["error_code"] == "DOWNGRADE_REQUIRES_SCHEDULE"
    res = client.post("/api/v1/saas-billing/subscription/downgrade", headers=gym.headers["OWNER"],
                      json={"plan_code": "lite", "billing_cycle": "monthly"})
    assert res.status_code == 409 and "staff" in res.json()["detail"]["resources"]  # factory gym has 3 staff logins
    ok = client.post("/api/v1/saas-billing/subscription/downgrade", headers=gym.headers["OWNER"],
                     json={"plan_code": "starter", "billing_cycle": "monthly"})
    assert ok.status_code == 200 and ok.json()["pending_plan_code"] == "starter"
    with TestingSessionLocal() as db:
        end = as_utc(_sub(db, gym).paid_until)
        lifecycle_tick(db, now=end + timedelta(minutes=1))
        sub = _sub(db, gym)
        assert db.get(SaasPlan, sub.plan_id).code == "starter" and sub.pending_plan_id is None and sub.status == "grace"


def test_founder_override_price_used_for_same_plan_and_cycle(cf):
    gym = _gym()
    _pay_now(cf, gym)
    _set(gym, price_override_minor=49900, price_override_currency="INR")
    assert _order(gym).json()["amount_minor"] == 49900
    assert _order(gym, cycle="annual").json()["amount_minor"] == 778800


# --- lifecycle ----------------------------------------------------------------------------------

def test_trial_expiry_grace_and_read_only(cf):
    gym = _gym()
    with TestingSessionLocal() as db:
        sub = saas_billing.get_or_create_subscription(db, gym.id)
        assert sub.status == "trialing" and as_utc(sub.trial_ends_at) > datetime.now(UTC) + timedelta(days=13)
        lifecycle_tick(db, now=as_utc(sub.trial_ends_at) + timedelta(seconds=1))
        assert _sub(db, gym).status == "read_only"
    _pay_now(cf, gym)  # read_only -> active
    with TestingSessionLocal() as db:
        sub = _sub(db, gym)
        assert sub.status == "active"
        end = as_utc(sub.paid_until)
        lifecycle_tick(db, now=end + timedelta(hours=1))
        sub = _sub(db, gym)
        assert sub.status == "grace" and as_utc(sub.grace_ends_at) == end + timedelta(days=7)
        lifecycle_tick(db, now=end + timedelta(days=6))
        assert _sub(db, gym).status == "grace"
        lifecycle_tick(db, now=end + timedelta(days=7, seconds=1))
        assert _sub(db, gym).status == "read_only"
        actions = [a.to_state for a in db.query(SaasAudit).filter_by(entity="subscription", entity_id=sub.id, action="transition")]
        assert actions[-3:] == ["active", "grace", "read_only"]


def test_cancelled_subscription_skips_grace(cf):
    gym = _gym()
    _pay_now(cf, gym)
    assert client.post("/api/v1/saas-billing/subscription/cancel", headers=gym.headers["OWNER"]).json()["cancel_at_period_end"]
    with TestingSessionLocal() as db:
        end = as_utc(_sub(db, gym).paid_until)
        lifecycle_tick(db, now=end + timedelta(seconds=1))
        assert _sub(db, gym).status == "read_only"


def test_illegal_transition_rejected_and_repeat_is_harmless():
    sub = SaasSubscription(id="x", status="trialing")
    with TestingSessionLocal() as db:
        with pytest.raises(IllegalTransition):
            transition(db, "subscription", sub, "grace")
        assert transition(db, "subscription", sub, "trialing") is False
        order = SaasOrder(id="o", status="paid")
        with pytest.raises(IllegalTransition):
            transition(db, "order", order, "pending")
        db.rollback()


def test_repeat_trial_blocked_for_same_owner_email(cf):
    gym = _gym()
    with TestingSessionLocal() as db:
        saas_billing.get_or_create_subscription(db, gym.id)
        from app.models.user import User, UserRole, WorkspaceMember
        owner = db.get(User, gym.user_ids["OWNER"])
        ws2 = Workspace(name="Second", slug=f"second-{uuid.uuid4().hex[:6]}", is_active=True)
        db.add(ws2)
        db.flush()
        db.add(WorkspaceMember(workspace_id=ws2.id, user_id=owner.id, role=UserRole.OWNER, is_active=True))
        db.commit()
        assert saas_billing.get_or_create_subscription(db, ws2.id).status == "read_only"


# --- read-only enforcement and entitlements ---------------------------------------------------------

def test_read_only_blocks_writes_but_not_reads_checkins_payments_or_export(cf):
    gym = _gym()
    _set(gym, status="read_only")
    h = gym.headers["OWNER"]
    res = client.post("/api/v1/members", headers=h, json={"first_name": "New", "last_name": "Person", "phone": "+919811111111"})
    assert res.status_code == 402 and res.json()["detail"]["error_code"] == "SUBSCRIPTION_READ_ONLY"
    assert client.get("/api/v1/members", headers=h).status_code == 200
    assert client.get("/api/v1/members/export-csv", headers=h).status_code == 200
    checkin = client.post("/api/v1/attendance/check-in", headers=h, json={"member_id": gym.member_id})
    assert checkin.status_code != 402
    assert client.post("/api/v1/saas-billing/handoff", headers=h).status_code == 200
    assert client.get("/api/v1/auth/me", headers=h).status_code in (200, 404)


def test_member_cap_grace_is_floor_ten_percent(cf):
    assert [member_limit_with_grace(c) for c in (20, 50, 150, 400, 9, -1)] == [22, 55, 165, 440, 9, -1]
    gym = _gym()
    with TestingSessionLocal() as db:
        lite = db.query(SaasPlan).filter_by(code="lite").one()
        sub = saas_billing.get_or_create_subscription(db, gym.id)
        sub.plan_id, sub.status = lite.id, "active"
        db.commit()
        # Factory gym has 2 active members: 2 + 20 = 22 is allowed, 23 is not.
        assert saas_capacity_error(db, sub, gym.id, "members", increment=20) is None
        err = saas_capacity_error(db, sub, gym.id, "members", increment=21)
        assert err["limit"] == 22 and err["plan_cap"] == 20


def test_feature_gate_uses_saas_plan(cf):
    gym = _gym()
    with TestingSessionLocal() as db:
        lite = db.query(SaasPlan).filter_by(code="lite").one()
        sub = saas_billing.get_or_create_subscription(db, gym.id)
        sub.plan_id, sub.status = lite.id, "active"
        db.commit()
    res = client.get("/api/v1/ai/insights", headers=gym.headers["OWNER"])
    assert res.status_code == 403 and res.json()["detail"]["error_code"] == "FEATURE_NOT_IN_PLAN"


# --- invoices -------------------------------------------------------------------------------------

def test_invoices_are_tenant_scoped(cf):
    gym, other = _gym(), _gym()
    _pay_now(cf, gym)
    invoices = client.get("/api/v1/saas-billing/invoices", headers=gym.headers["OWNER"]).json()
    assert len(invoices) == 1
    inv_id = invoices[0]["id"]
    pdf = client.get(f"/api/v1/saas-billing/invoices/{inv_id}/pdf", headers=gym.headers["ADMIN"])
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF") and b"Tax Invoice" not in pdf.content
    assert client.get(f"/api/v1/saas-billing/invoices/{inv_id}", headers=other.headers["OWNER"]).status_code == 404
    assert client.get(f"/api/v1/saas-billing/invoices/{inv_id}/pdf", headers=other.headers["OWNER"]).status_code == 404
    assert client.get(f"/api/v1/saas-billing/invoices/{inv_id}", headers=gym.headers["TRAINER"]).status_code == 403
    ref = invoices[0]["order_ref"]
    assert client.get(f"/api/v1/saas-billing/orders/{ref}", headers=other.headers["OWNER"]).status_code == 404


# --- reminders ------------------------------------------------------------------------------------

def test_renewal_reminders_sent_once_per_threshold(cf):
    gym = _gym()
    _pay_now(cf, gym)
    _set(gym, paid_until=datetime.now(UTC) + timedelta(days=2, hours=12))
    with TestingSessionLocal() as db:
        first = send_renewal_reminders(db)["sent"]
        again = send_renewal_reminders(db)["sent"]
        sub = _sub(db, gym)
        keys = [a.action for a in db.query(SaasAudit).filter_by(entity_id=sub.id) if a.action.startswith("reminder_")]
    assert first >= 1 and again == 0 and len(keys) == 1 and keys[0].startswith("reminder_3d")


# --- app -> web handoff ---------------------------------------------------------------------------

def _token_from(url: str) -> str:
    return url.split("?t=", 1)[1]


def test_handoff_token_single_use(cf):
    gym = _gym()
    res = client.post("/api/v1/saas-billing/handoff", headers=gym.headers["OWNER"])
    assert res.status_code == 200
    url = res.json()["url"]
    assert url.startswith(settings.SAAS_CHECKOUT_URL) and "access" not in url
    token = _token_from(url)
    with TestingSessionLocal() as db:
        from app.models.saas import SaasHandoffToken
        row = db.query(SaasHandoffToken).order_by(SaasHandoffToken.created_at.desc()).first()
        assert row.token_hash != token and len(row.token_hash) == 64
    first = client.post("/api/v1/saas-billing/handoff/consume", json={"token": token})
    assert first.status_code == 200 and first.json()["access_token"]
    me = client.get("/api/v1/saas-billing/subscription", headers={"Authorization": f"Bearer {first.json()['access_token']}"})
    assert me.status_code == 200
    assert client.post("/api/v1/saas-billing/handoff/consume", json={"token": token}).status_code == 401


def test_handoff_expired_or_unknown_rejected_and_staff_cannot_issue(cf):
    gym = _gym()
    assert client.post("/api/v1/saas-billing/handoff", headers=gym.headers["TRAINER"]).status_code == 403
    token = _token_from(client.post("/api/v1/saas-billing/handoff", headers=gym.headers["OWNER"]).json()["url"])
    with TestingSessionLocal() as db:
        from app.models.saas import SaasHandoffToken
        for row in db.query(SaasHandoffToken).filter_by(workspace_id=gym.id):
            row.expires_at = datetime.now(UTC) - timedelta(seconds=1)
        db.commit()
    assert client.post("/api/v1/saas-billing/handoff/consume", json={"token": token}).status_code == 401
    assert client.post("/api/v1/saas-billing/handoff/consume", json={"token": "x" * 43}).status_code == 401
