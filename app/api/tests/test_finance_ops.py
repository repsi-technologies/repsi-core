"""Receipts, refunds, dues, reconciliation, coupons and plan access rules."""
from datetime import date, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.communication import NotificationDelivery
from app.models.finance import Invoice, Payment
from tests.conftest import TestingSessionLocal
from tests.factories import make_gym

client = TestClient(app)
API = "/api/v1"


@pytest.fixture
def gym():
    return make_gym("Finance Gym")


def pay(gym, amount=1500.0, method="cash", role="STAFF"):
    res = client.post(f"{API}/payments/", headers=gym.headers[role],
                      json={"member_id": gym.member_id, "amount": amount, "method": method})
    assert res.status_code == 201, res.text
    return res.json()


def test_payment_gets_sequential_receipt_and_confirmation(gym):
    first, second = pay(gym), pay(gym, 500)
    assert first["receipt_number"].endswith("000001") and second["receipt_number"].endswith("000002")
    db = TestingSessionLocal()
    try:
        rows = db.query(NotificationDelivery).filter(NotificationDelivery.member_id == gym.member_id,
                                                     NotificationDelivery.event_type == "payment_receipt").all()
        assert {r.channel for r in rows} >= {"in_app", "email"}
        email = next(r for r in rows if r.channel == "email")
        assert email.status == "queued" and first["receipt_number"] in email.body
    finally:
        db.close()


def test_payment_for_other_gyms_member_is_rejected(gym):
    other = make_gym("Other Finance Gym")
    res = client.post(f"{API}/payments/", headers=gym.headers["OWNER"],
                      json={"member_id": other.member_id, "amount": 100, "method": "cash"})
    assert res.status_code == 404


def test_receipt_pdf_for_staff_and_own_member_only(gym):
    p = pay(gym)
    staff = client.get(f"{API}/payments/{p['id']}/receipt.pdf", headers=gym.headers["OWNER"])
    assert staff.status_code == 200 and staff.content.startswith(b"%PDF-")
    assert client.get(f"{API}/payments/{p['id']}/receipt.pdf", headers=gym.headers["USER"]).status_code == 200
    assert client.get(f"{API}/payments/{p['id']}/receipt.pdf", headers=gym.headers["TRAINER"]).status_code == 403
    other = make_gym("Other Receipt Gym")
    assert client.get(f"{API}/payments/{p['id']}/receipt.pdf", headers=other.headers["OWNER"]).status_code == 404


def test_partial_then_full_refund_keeps_history(gym):
    p = pay(gym, 1000)
    staff_try = client.post(f"{API}/payments/{p['id']}/refunds", headers=gym.headers["STAFF"],
                            json={"amount": 100, "reason": "Overcharge"})
    assert staff_try.status_code == 403  # refunds need payments.manage
    r1 = client.post(f"{API}/payments/{p['id']}/refunds", headers=gym.headers["OWNER"],
                     json={"amount": 300, "reason": "Pro-rated cancellation"})
    assert r1.status_code == 201, r1.text
    too_much = client.post(f"{API}/payments/{p['id']}/refunds", headers=gym.headers["OWNER"],
                           json={"amount": 800, "reason": "Too much"})
    assert too_much.status_code == 422
    r2 = client.post(f"{API}/payments/{p['id']}/refunds", headers=gym.headers["MANAGER"],
                     json={"amount": 700, "reason": "Rest of it", "method": "upi"})
    assert r2.status_code == 201
    payments = client.get(f"{API}/payments/", params={"member_id": gym.member_id}, headers=gym.headers["OWNER"]).json()
    updated = next(x for x in payments if x["id"] == p["id"])
    assert updated["amount"] == 1000 and updated["refunded_amount"] == 1000 and updated["status"] == "refunded"
    assert len(client.get(f"{API}/payments/{p['id']}/refunds", headers=gym.headers["OWNER"]).json()) == 2


def test_outstanding_dues_from_unpaid_invoices(gym):
    db = TestingSessionLocal()
    try:
        db.add(Invoice(workspace_id=gym.id, invoice_number="INV-DUE-1", member_id=gym.member_id, subtotal=2000,
                       total_amount=2000, amount_paid=500, status="pending", due_date=date.today() - timedelta(days=40)))
        db.commit()
    finally:
        db.close()
    dues = client.get(f"{API}/payments/dues/outstanding", headers=gym.headers["OWNER"]).json()
    assert dues["total"] == 1500 and dues["by_age"] == {"31-60": 1500}
    summary = client.get(f"{API}/payments/summary", headers=gym.headers["OWNER"]).json()
    assert summary["pending_dues"] == 1500
    assert client.get(f"{API}/payments/dues/outstanding", headers=gym.headers["USER"]).status_code == 403


def test_day_close_variance_and_reopen(gym):
    pay(gym, 1200, "cash")
    pay(gym, 800, "upi")
    today = date.today().isoformat()
    expected = client.get(f"{API}/payments/reconciliation/expected", params={"business_date": today},
                          headers=gym.headers["OWNER"]).json()
    assert expected["expected"] == {"cash": 1200.0, "upi": 800.0}
    closed = client.post(f"{API}/payments/reconciliation/close", headers=gym.headers["OWNER"],
                         json={"business_date": today, "counted": {"cash": 1100, "upi": 800}})
    assert closed.status_code == 201, closed.text
    assert closed.json()["variance"]["cash"] == -100.0 and closed.json()["total_variance"] == -100.0
    again = client.post(f"{API}/payments/reconciliation/close", headers=gym.headers["OWNER"],
                        json={"business_date": today, "counted": {"cash": 1200}})
    assert again.status_code == 409
    assert client.post(f"{API}/payments/reconciliation/reopen", headers=gym.headers["OWNER"],
                       json={"business_date": today, "reason": "Found 100 in the drawer"}).status_code == 200
    recount = client.post(f"{API}/payments/reconciliation/close", headers=gym.headers["OWNER"],
                          json={"business_date": today, "counted": {"cash": 1200, "upi": 800}})
    assert recount.status_code == 201 and recount.json()["total_variance"] == 0
    history = client.get(f"{API}/payments/reconciliation/history", headers=gym.headers["OWNER"]).json()
    assert len(history) == 2  # the first close is kept


# ─── Coupons ───────────────────────────────────────────────────────────


def test_coupon_quote_apply_and_limits(gym):
    c = client.post(f"{API}/offers/coupons", headers=gym.headers["OWNER"], json={
        "code": "diwali 20", "discount_type": "percent", "discount_value": 20, "max_discount": 250,
        "max_redemptions": 1, "plan_ids": [gym.plan_id]})
    assert c.status_code == 201, c.text
    assert c.json()["code"] == "DIWALI20"
    assert client.post(f"{API}/offers/coupons", headers=gym.headers["STAFF"],
                       json={"code": "NOPE10", "discount_value": 10}).status_code == 403

    q = client.post(f"{API}/offers/coupons/quote", headers=gym.headers["STAFF"],
                    json={"code": "diwali20", "plan_id": gym.plan_id, "member_id": gym.other_member_id}).json()
    assert q["list_price"] == 1500 and q["discount"] == 250 and q["final_price"] == 1250  # capped at 250

    m = client.post(f"{API}/memberships/", headers=gym.headers["STAFF"], json={
        "member_id": gym.other_member_id, "plan_id": gym.plan_id, "start_date": date.today().isoformat(),
        "coupon_code": "DIWALI20"})
    assert m.status_code == 201, m.text
    assert m.json()["price_paid"] == 1250
    redemptions = client.get(f"{API}/offers/coupons/{c.json()['id']}/redemptions", headers=gym.headers["OWNER"]).json()
    assert len(redemptions) == 1 and redemptions[0]["discount"] == 250

    exhausted = client.post(f"{API}/offers/coupons/quote", headers=gym.headers["STAFF"],
                            json={"code": "DIWALI20", "plan_id": gym.plan_id, "member_id": gym.member_id})
    assert exhausted.status_code == 422


def test_expired_and_cross_tenant_coupons(gym):
    client.post(f"{API}/offers/coupons", headers=gym.headers["OWNER"], json={
        "code": "OLD50", "discount_type": "flat", "discount_value": 50,
        "valid_until": (date.today() - timedelta(days=1)).isoformat()})
    res = client.post(f"{API}/offers/coupons/quote", headers=gym.headers["OWNER"],
                      json={"code": "OLD50", "plan_id": gym.plan_id})
    assert res.status_code == 422 and "expired" in res.json()["detail"]
    other = make_gym("Coupon Other Gym")
    assert client.post(f"{API}/offers/coupons/quote", headers=other.headers["OWNER"],
                       json={"code": "OLD50", "plan_id": other.plan_id}).status_code == 404


# ─── Plan access rules ─────────────────────────────────────────────────


def test_plan_access_rules_are_stored_and_enforced(gym):
    today = datetime.now(timezone.utc)
    blocked_day = (today.weekday() + 1) % 7  # any day except today (UTC gym timezone)
    plan = client.post(f"{API}/memberships/plans", headers=gym.headers["OWNER"], json={
        "name": "Weekend only", "duration_months": 1, "price": 900,
        "access_rules": {"weekdays": [blocked_day]}, "class_credits": 4})
    assert plan.status_code == 201, plan.text
    assert plan.json()["access_rules"] == {"weekdays": [blocked_day]} and plan.json()["class_credits"] == 4

    m = client.post(f"{API}/memberships/", headers=gym.headers["OWNER"], json={
        "member_id": gym.other_member_id, "plan_id": plan.json()["id"], "start_date": date.today().isoformat()})
    assert m.status_code == 201, m.text
    check_in = client.post(f"{API}/attendance/check-in", headers=gym.headers["STAFF"],
                           json={"member_id": gym.other_member_id})
    assert check_in.status_code == 403, check_in.text
    assert "plan allows visits on" in check_in.json()["detail"]
