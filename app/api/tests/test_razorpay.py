import uuid
import traceback
from fastapi.testclient import TestClient
from app.main import app


def test_cashfree_checkout_fails_closed():
    with TestClient(app) as client:
        try:
            # Register owner
            unique_email = f"cf_owner_{uuid.uuid4().hex[:6]}@repsi.app"
            reg_payload = {
                "full_name": "Cashfree Gym Owner",
                "email": unique_email,
                "password": "SecretPassword123!",
                "gym_name": "Cashfree Power Gym",
                "gym_phone": "+91 98888 77777",
                "gym_city": "Mumbai"
            }
            resp = client.post("/api/v1/auth/register", json=reg_payload)
            print("REG RESP CODE:", resp.status_code)
            print("REG RESP BODY:", resp.json())
            assert resp.status_code == 201
            token = resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # 1. Test create-order endpoint
            order_payload = {
                "amount": 1499.0,
                "currency": "INR",
                "notes": {
                    "plan_id": "growth",
                    "plan_name": "Growth Tier",
                    "billing_cycle": "monthly"
                }
            }
            order_resp = client.post("/api/v1/payments/cashfree/create-order", json=order_payload, headers=headers)
            print("ORDER RESP CODE:", order_resp.status_code)
            print("ORDER RESP BODY:", order_resp.json())
            assert order_resp.status_code == 503

            # 2. Test alias /cashfree/order endpoint
            alias_resp = client.post("/api/v1/payments/cashfree/order", json=order_payload, headers=headers)
            print("ALIAS RESP CODE:", alias_resp.status_code)
            print("ALIAS RESP BODY:", alias_resp.json())
            assert alias_resp.status_code == 503

            # 3. Test verification endpoint
            verify_payload = {
                "cashfree_order_id": "client_supplied_order",
                "cashfree_payment_id": "pay_test_cf_123456",
                "amount": 1499.0,
            }
            verify_resp = client.post("/api/v1/payments/cashfree/verify", json=verify_payload, headers=headers)
            print("VERIFY RESP CODE:", verify_resp.status_code)
            print("VERIFY RESP BODY:", verify_resp.json())
            assert verify_resp.status_code == 503

            # 4. Check workspace billing endpoint reflects invoices
            billing_resp = client.get("/api/v1/workspaces/billing", headers=headers)
            print("BILLING RESP CODE:", billing_resp.status_code)
            print("BILLING RESP BODY:", billing_resp.json())
            assert billing_resp.status_code == 200
            billing_data = billing_resp.json()
            assert "plan" in billing_data
            assert "usage" in billing_data
            assert "invoices" in billing_data
        except Exception as e:
            traceback.print_exc()
            raise e
