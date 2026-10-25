"""Payment provider interface and the Cashfree (INR) adapter.

Cashfree PG, API version settings.CASHFREE_API_VERSION (2026-01-01), per the official docs:
  POST {base}/orders                       create order -> cf_order_id, payment_session_id, order_status
  GET  {base}/orders/{order_id}/payments   payments: payment_status SUCCESS|FAILED|PENDING|USER_DROPPED|...
  Webhook signature = base64(HMAC-SHA256(secret_key, x-webhook-timestamp + raw_body)).
Never log credentials or full provider payloads.
"""
import base64
import hashlib
import hmac
import logging
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Optional, Protocol

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class ProviderError(RuntimeError):
    """Provider unreachable or rejected the request. Message is safe to log (no secrets)."""


class ProviderNotConfigured(ProviderError):
    pass


@dataclass
class CreatedOrder:
    provider_order_id: str
    session_id: str


@dataclass
class ProviderPayment:
    payment_id: str
    status: str  # normalised: success | failed | pending | abandoned
    amount_minor: int
    currency: str
    method: Optional[str]
    raw_status: str
    failure_reason: Optional[str] = None


class PaymentProvider(Protocol):
    name: str
    environment: str  # "sandbox" | "production"

    def create_order(self, *, order_ref: str, amount_minor: int, currency: str, customer_id: str,
                     customer_phone: str, customer_email: Optional[str], customer_name: Optional[str],
                     return_url: str, notify_url: Optional[str], expires_at: datetime) -> CreatedOrder: ...

    def fetch_payments(self, order_ref: str) -> list[ProviderPayment]: ...

    def verify_webhook(self, raw_body: bytes, timestamp: Optional[str], signature: Optional[str]) -> bool: ...


def to_major(amount_minor: int) -> str:
    """Minor units -> decimal string with 2 places, no float rounding."""
    return str((Decimal(amount_minor) / 100).quantize(Decimal("0.01")))


def to_minor(amount) -> int:
    return int((Decimal(str(amount)) * 100).quantize(Decimal("1")))


_CASHFREE_STATUS = {
    "SUCCESS": "success",
    "FAILED": "failed",
    "CANCELLED": "failed",
    "VOID": "failed",
    "USER_DROPPED": "abandoned",
    "NOT_ATTEMPTED": "pending",
    "PENDING": "pending",
}


class CashfreeProvider:
    name = "cashfree"

    def __init__(self, app_id: str, secret_key: str, env: str, api_version: str, client: Optional[httpx.Client] = None):
        if not app_id or not secret_key:
            raise ProviderNotConfigured("Cashfree credentials are not configured.")
        self._app_id, self._secret = app_id, secret_key
        self.environment = "production" if env.upper() in ("PROD", "PRODUCTION") else "sandbox"
        self._base = "https://api.cashfree.com/pg" if self.environment == "production" else "https://sandbox.cashfree.com/pg"
        self._version = api_version
        self._client = client or httpx.Client(timeout=15.0)

    def _headers(self, idempotency_key: Optional[str] = None) -> dict:
        h = {"x-client-id": self._app_id, "x-client-secret": self._secret, "x-api-version": self._version,
             "Content-Type": "application/json", "Accept": "application/json"}
        if idempotency_key:
            h["x-idempotency-key"] = idempotency_key
        return h

    def _request(self, method: str, path: str, **kw) -> httpx.Response:
        try:
            resp = self._client.request(method, f"{self._base}{path}", **kw)
        except httpx.HTTPError as e:
            raise ProviderError(f"Cashfree unreachable: {type(e).__name__}") from e
        if resp.status_code >= 400:
            code = ""
            try:
                code = resp.json().get("code", "")
            except ValueError:
                pass
            raise ProviderError(f"Cashfree {method} {path.split('/')[1]} failed: HTTP {resp.status_code} {code}".strip())
        return resp

    def create_order(self, *, order_ref, amount_minor, currency, customer_id, customer_phone, customer_email,
                     customer_name, return_url, notify_url, expires_at) -> CreatedOrder:
        customer = {"customer_id": customer_id, "customer_phone": customer_phone}
        if customer_email:
            customer["customer_email"] = customer_email
        if customer_name and len(customer_name) >= 3:
            customer["customer_name"] = customer_name[:100]
        meta = {"return_url": return_url[:250]}
        if notify_url:
            meta["notify_url"] = notify_url[:250]
        body = {
            "order_id": order_ref,
            "order_amount": float(Decimal(to_major(amount_minor))),  # JSON number with <= 2 decimals
            "order_currency": currency,
            "customer_details": customer,
            "order_meta": meta,
            "order_expiry_time": expires_at.isoformat(timespec="seconds"),
        }
        data = self._request("POST", "/orders", json=body, headers=self._headers(order_ref)).json()
        if not data.get("payment_session_id") or data.get("order_id") != order_ref:
            raise ProviderError("Cashfree create order returned an unexpected response.")
        return CreatedOrder(provider_order_id=str(data.get("cf_order_id") or order_ref), session_id=data["payment_session_id"])

    def fetch_payments(self, order_ref: str) -> list[ProviderPayment]:
        rows = self._request("GET", f"/orders/{order_ref}/payments", headers=self._headers()).json()
        out = []
        for p in rows if isinstance(rows, list) else []:
            raw = str(p.get("payment_status") or "")
            err = p.get("error_details") or {}
            out.append(ProviderPayment(
                payment_id=str(p.get("cf_payment_id")),
                status=_CASHFREE_STATUS.get(raw, "pending"),
                amount_minor=to_minor(p.get("payment_amount") or 0),
                currency=str(p.get("payment_currency") or ""),
                method=p.get("payment_group"),
                raw_status=raw,
                failure_reason=(err.get("error_description") or err.get("error_reason")) if err else None,
            ))
        return out

    def verify_webhook(self, raw_body: bytes, timestamp: Optional[str], signature: Optional[str]) -> bool:
        if not timestamp or not signature:
            return False
        digest = hmac.new(self._secret.encode(), timestamp.encode() + raw_body, hashlib.sha256).digest()
        return hmac.compare_digest(base64.b64encode(digest).decode(), signature.strip())


_override: Optional[PaymentProvider] = None


def set_provider_for_tests(provider: Optional[PaymentProvider]) -> None:
    global _override
    _override = provider


def get_provider() -> PaymentProvider:
    if _override is not None:
        return _override
    return CashfreeProvider(settings.CASHFREE_APP_ID, settings.CASHFREE_SECRET_KEY, settings.CASHFREE_ENV,
                            settings.CASHFREE_API_VERSION)
