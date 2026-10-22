---
name: repsi-payment-workflows
description: Work on REPSI member payments — recording manual payments, partial payments and balances, invoices/receipts, refunds, payment status, manual payment proof review, and online gateways (Razorpay/Cashfree). Use for any change to Payment, Invoice, ManualPaymentSubmission, BusinessPaymentSettings or payment endpoints.
---

# REPSI payment workflows

## Existing implementation (read first)

- Models: `app/api/app/models/finance.py` (`Payment`, `Invoice`, `Expense`), `app/api/app/models/payment_settings.py` (`BusinessPaymentSettings`, `ManualPaymentSubmission`), `app/api/app/models/billing.py` (platform SaaS billing — a different domain; don't mix gym-member payments into it).
- Services: `app/api/app/services/manual_payment.py`, `app/api/app/services/billing.py`.
- API: `app/api/app/api/v1/payments.py`, `billing.py`.
- Tests: `tests/test_manual_payments.py`, `tests/test_razorpay.py`, `tests/test_billing_module.py`.
- Web: `app/web/features/payments/*`, `features/settings/payment-settings-tab.tsx`.

## Rules

- A membership is "paid" only when recorded successful payments cover its amount due. Creating a membership never implies payment.
- Amounts: store currency with every amount; compute totals, discounts and balances on the backend. Reject negative or over-refund amounts.
- Manual payments are labelled as manual (method + who recorded it). Never present a manual workflow as an online gateway.
- Online gateways: create orders server-side; trust only verified signatures/webhooks on the backend; make webhook handling idempotent on the provider reference.
- Never store card numbers, CVV, UPI PINs or bank credentials. Payment proofs go to private storage and are served only through authorised endpoints.
- Refunds/cancellations create new records or status transitions with actor and reason; don't edit the original amount.
- Every payment mutation writes an audit/lifecycle event and is tenant-scoped (`repsi-tenant-access-control`).

## Workflow

1. Read the models/services above; reuse `manual_payment.py` helpers instead of re-implementing receipts or proof storage.
2. Implement backend + tests, then UI.
3. Run `repsi-verify`.

## Required tests

Full payment, partial payment and balance, overpayment rejection, refund limits, status transitions, idempotent gateway verification (duplicate webhook), role restrictions, cross-tenant 404s.

## Restrictions

- Gateway credentials stay in backend env vars (`app/api/app/core/config.py`); never expose them to `NEXT_PUBLIC_*`.
- Don't call live gateway APIs from tests; mock the HTTP boundary.
- Don't fake a successful payment when a gateway isn't configured — return a clear "not configured" error.
