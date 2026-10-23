import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

from app.core.database import Base, get_db
from app.main import app
from app.services.billing import BillingService
from app.models.billing import SubscriptionPlan, GymSubscription, SubscriptionStatus

from tests.conftest import TestingSessionLocal

client = TestClient(app)
_owner_headers: dict = {}


def owner_headers() -> dict:
    """A real owner session; billing endpoints derive the workspace from the token, not a header."""
    if not _owner_headers:
        res = client.post("/api/v1/auth/register", json={
            "full_name": "Billing Owner", "email": "billing.owner@example.com", "password": "Password123!",
            "gym_name": "Billing Test Gym", "gym_phone": "+91 99999 33333", "gym_city": "Chennai",
        })
        assert res.status_code == 201, res.text
        _owner_headers["Authorization"] = f"Bearer {res.json()['access_token']}"
    return dict(_owner_headers)

@pytest.fixture(autouse=True)
def setup_db():
    db = TestingSessionLocal()
    BillingService.ensure_default_plans(db)
    db.close()
    yield

def test_get_subscription_plans():
    response = client.get("/api/v1/billing/plans")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 6
    codes = [p["code"] for p in data]
    assert "basic" in codes
    assert "growth" in codes
    assert "premium" in codes
    assert "pro" in codes
    assert "pro_plus" in codes
    assert "enterprise" in codes

def test_get_workspace_subscription_default_trial():
    response = client.get("/api/v1/billing/subscription", headers=owner_headers())
    assert response.status_code == 200
    data = response.json()
    assert "subscription" in data
    assert "usage" in data
    assert data["subscription"]["plan"]["code"] == "growth"
    assert data["subscription"]["status"] == "trialing"
    assert data["subscription"]["trial_days_left"] in (13, 14)

def test_create_checkout_session():
    payload = {"plan_code": "growth", "billing_cycle": "annual", "currency": "INR"}
    response = client.post("/api/v1/billing/create-checkout-session", json=payload, headers=owner_headers())
    assert response.status_code == 503

def test_verify_and_activate_payment():
    payload = {
        "cashfree_order_id": "cf_ord_98124",
        "cashfree_payment_id": "cf_pay_12345",
        "amount": 499.0
    }
    response = client.post("/api/v1/billing/verify-payment", json=payload, headers=owner_headers())
    assert response.status_code == 503
    subscription = client.get("/api/v1/billing/subscription", headers=owner_headers())
    assert subscription.status_code == 200
    assert subscription.json()["subscription"]["status"] == "trialing"

def test_check_feature_entitlement():
    # Growth plan has trainer_management = True
    response = client.get("/api/v1/billing/entitlements/trainer_management", headers=owner_headers())
    assert response.status_code == 200
    assert response.json()["has_access"] is True

    # Growth plan has multi_branch = False
    response = client.get("/api/v1/billing/entitlements/multi_branch", headers=owner_headers())
    assert response.status_code == 200
    assert response.json()["has_access"] is False

def test_billing_reads_require_auth_and_ignore_workspace_header():
    for path in ("/api/v1/billing/subscription", "/api/v1/billing/trial-status",
                 "/api/v1/billing/entitlements", "/api/v1/billing/entitlements/trainer_management"):
        assert client.get(path, headers={"X-Workspace-Id": "test-gym"}).status_code == 401, path
    # An authenticated owner can't read another workspace by sending its id in the header.
    other = client.get("/api/v1/billing/entitlements", headers={**owner_headers(), "X-Workspace-Id": "someone-else"})
    assert other.status_code in (200, 403)
    if other.status_code == 200:
        assert other.json()["workspace_id"] != "someone-else"


def test_entitlement_summary_lists_features_limits_usage():
    res = client.get("/api/v1/billing/entitlements", headers=owner_headers())
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["features"]["trainer_management"] is True
    assert set(body["limits"]) == {"max_members", "max_trainers", "max_staff", "max_branches"}
    assert body["usage"]["staff"]["current"] == 0


def test_change_plan_validation():
    # Plan changes require an authenticated workspace administrator.
    payload = {"target_plan_code": "basic", "billing_cycle": "monthly"}
    response = client.post("/api/v1/billing/change-plan", json=payload, headers={"X-Workspace-Id": "test-gym"})
    assert response.status_code == 401

def test_reconcile_trials_requires_super_admin():
    response = client.post("/api/v1/billing/reconcile-trials")
    assert response.status_code == 401
