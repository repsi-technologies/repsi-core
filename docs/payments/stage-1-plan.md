# Stage 1 — SaaS Payment Migration: Inspection & Plan

Branch: `feature/saas-payments` (cut from `master`; your uncommitted pricing edits came along unchanged).
Scope: gym-owner → REPSI subscriptions only. Gym-member payments stay on the existing UPI proof flow.
Tags: **V** = VERIFIED, **A** = ASSUMED, **U** = UNKNOWN.

## 1. Findings

| # | Finding | Tag | Evidence |
|---|---|---|---|
| F1 | Stack: FastAPI + SQLAlchemy 2. SQLite for dev and tests, Postgres in prod. No Alembic: additive DDL in `migrations.py`. | V | `app/api/app/core/migrations.py`, `CLAUDE.md` |
| F2 | A SaaS billing layer already exists, separate from gym-member `MembershipPlan`: `SubscriptionPlan` (`subscription_plans`), `GymSubscription` (`gym_subscriptions`), `SubscriptionPayment`, `BillingInvoice`, `BillingWebhookEvent`, `SubscriptionAuditLog`. | V | `app/api/app/models/billing.py` |
| F3 | **Money is stored as `Float`** in `monthly_price_inr`, `SubscriptionPayment.amount`, `BillingInvoice.amount` and `tax_amount`. | V | `models/billing.py:38-41,136,152-153` |
| F4 | Cashfree is stubbed and fails closed. Checkout, verification and webhooks raise `CashfreeUnavailableError` or return 503. No live provider path exists, so no production flow depends on it. | V | `services/billing.py:988-1011`, `api/v1/billing.py:149-266` |
| F5 | The webhook route parses `Dict` before signature checking (no raw body). The verify route hardcodes `plan_code="growth"` and accepts a client `amount`. Both are disabled today but must not be revived. | V | `api/v1/billing.py:172-192,256-266` |
| F6 | Billing auth is `_require_billing_admin`, which allows OWNER, ADMIN and SUPER_ADMIN. The workspace comes from `TenantContext`. The spec says owners only, so ADMIN must be dropped from order creation (see Q3). | V | `api/v1/billing.py:28-37`, `UserRole` in `models/user.py:10` |
| F7 | The tenant is `Workspace`. Branches are `GymLocation` rows inside one workspace. There is no parent organization above workspaces. | V | `services/organization.py:2-5`, `models/user.py:20` |
| F8 | `ensure_default_plans` **overwrites** plan prices and limits on every run, and its prices live in Python. | V | `services/billing.py:387-430` |
| F9 | Prices disagree between files. Web shows Basic at ₹299/mo, backend says ₹199. Premium's `member_limit` (100) is lower than Growth's (150). | V | `web/lib/pricing-data.ts:328`, `services/billing.py:50,91,138` |
| F10 | Statuses include `grace_period`, `expired`, `suspended`, `cancelled`, `canceled`, `pending_payment` and `past_due`. There is no `read_only` status. Grace length is `BILLING_GRACE_DAYS=3`, the spec says 7. | V | `models/billing.py:8-17`, `core/config.py:72` |
| F11 | Guards exist: `require_feature` and `check_member_capacity` in `middleware/entitlements.py`, and `check_limit_before_action`. There is **no 10% member grace**: the check is a hard `current + inc > limit`. | V | `services/billing.py:701-727`, `middleware/entitlements.py:79` |
| F12 | **Data export is feature-gated** (`require_feature("data_export")`), so an expired gym loses export. This breaks the "never block export" rule. | V | `api/v1/members.py:84` |
| F13 | Attendance, auth and member payments carry no `require_feature`, so check-ins and login are not subscription-gated. | V (grep of attendance/auth/payments routers) |
| F14 | A worker exists: `JOBS` registry, `JobRun` with a unique `run_key`, and `trial_lifecycle` / `subscription_status` jobs run through `scripts/run_jobs.py`. There is no durable per-event queue table. | V | `services/jobs.py:134-216`, `models/jobs.py` |
| F15 | The 14-day trial, reminders and the `is_repeat_trial_blocked` flag already exist. The repeat-trial check (by email or phone) is not confirmed. | V / A | `services/trial_lifecycle.py`, `models/billing.py:78` |
| F16 | Tests run on in-memory SQLite (forced in `conftest.py`). There is no localhost/`_test` guard for Postgres runs. The default `DATABASE_URL` is local SQLite. | V | `tests/conftest.py:6,30`, `core/config.py:135` |
| F17 | The mobile app only reads `/billing/trial-status`. It shows no prices or pay buttons. | V | `mobile/lib/features/dashboard/providers/dashboard_provider.dart:114` |
| F18 | The desktop app is a Tauri shell over the web build, with no native billing code. Billing UI is therefore the web `settings/billing` page. | V / A | `desktop/src-tauri/tauri.conf.json` |
| F19 | `.env.example` defines `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_ENV` and `FRONTEND_URL`. There is no webhook secret var, because Cashfree signs webhooks with the secret key (to confirm against current docs in Stage 3). | V / A | `app/api/.env.example` |
| F20 | `docs/payments/pricing.md` **does not exist**. Commercial pricing is not approved. | V | — |
| F21 | Memory note: `app/api/.env` points at **production**. Any local API run must override `DATABASE_URL`, `ENVIRONMENT` and `OTP_PROVIDER`. | V (memory) | — |

## 2. Tenant model recommendation
Subscriptions belong to a **Workspace** (one gym business). Branches are covered by the plan's `branch_limit`. No parent-org table is needed: it would duplicate identity and break the `workspace_id` scoping rule. A multi-gym owner holds one subscription per workspace. Revisit this only if consolidated multi-workspace billing is requested.

## 3. Proposed schema (Stage 2, additive)
New `saas_*` tables. The legacy tables stay until Stage 6b. All money is `BigInteger` minor units with a `currency CHAR(3)` next to it.

- `saas_plan`: `id`, `code` (unique, stable), `name`, `rank`, `is_public`, `is_active`.
- `saas_plan_price`: `plan_id`, `billing_cycle` (`monthly|quarterly|half_yearly|annual`), `currency`, `amount_minor`, `period_months`, `is_enabled`. Unique on (`plan_id`, `cycle`, `currency`). INR enabled; USD, EUR, GBP and AED disabled.
- `saas_entitlement`: `plan_id`, `key`, `kind` (`feature|limit`), `bool_value`, `int_value` (-1 = unlimited). Unique on (`plan_id`, `key`).
- `saas_subscription`: `workspace_id` (unique FK), `plan_id`, `status`, `billing_cycle`, `currency`, `trial_ends_at`, `paid_until`, `grace_ends_at`, `cancel_at_period_end`, `pending_plan_id`, `pending_cycle`, `price_override_minor` and `price_override_currency` (founder lock), `is_grandfathered`, `version` (optimistic lock). All timestamps are timezone-aware.
- `saas_order`: `workspace_id`, `subscription_id`, `order_ref` (unique, our id sent to Cashfree), `kind` (`new|renewal|upgrade`), `plan_id`, `cycle`, `currency`, `amount_minor`, `tax_minor` (nullable), `status`, `needs_review`, `idempotency_key` (unique per workspace), `provider`, `provider_order_id` (unique), `expires_at`, `paid_at`, `created_by_user_id`.
- `saas_payment_attempt`: `order_id`, `provider_payment_id` (unique, nullable), `status`, `method`, `amount_minor`, `currency`, `raw_status`, `failure_reason`.
- `saas_webhook_event`: `provider`, `event_id` (unique with `provider`), `event_type`, `raw_body` (text), `signature_ok`, `status` (`queued|processed|failed`), `attempts`, `next_attempt_at`, `last_error`. This doubles as the durable queue drained by a worker job.
- `saas_invoice`: `workspace_id`, `order_id` (unique), `invoice_number` (unique), `fy` (e.g. `26-27`), `seq`, `amount_minor`, `currency`, nullable `tax_minor`, `gstin` and `tax_breakup`, `issued_at`.
- `saas_invoice_counter`: `fy` (PK), `last_seq`. Incremented with `SELECT … FOR UPDATE` on Postgres and inside a transaction on SQLite.
- `saas_audit`: `workspace_id`, `entity`, `entity_id`, `from_state`, `to_state`, `actor`, `reason`, `meta` JSON. Written in the same transaction as the state change.
- `saas_refund`: `order_id`, `provider_refund_id` (unique), `amount_minor`, `currency`, `status`. Written only from verified webhooks.
- `saas_handoff_token`: `token_hash` (unique), `user_id`, `workspace_id`, `purpose`, `expires_at`, `consumed_at`.

**Rollback:** the change is additive. Rolling back means turning off `SAAS_BILLING_ENABLED` and ignoring the new tables. Drop scripts are documented but never run automatically.

## 4. State machines
- **Subscription:** `trialing → active` (verified payment) · `trialing → read_only` (trial ends) · `active → grace` (`paid_until` passed) · `grace → active` (payment) or `→ read_only` (after 7 days) · `read_only → active` (payment). When `cancel_at_period_end` is set and `paid_until` passes, the subscription goes straight to `read_only`. Downgrades are stored in the `pending_*` fields. Legacy `expired`, `cancelled` and `past_due` map to `read_only` and `grace_period` maps to `grace` during backfill. `suspended` is kept as an admin-only override.
- **Order:** `created → pending → paid | failed | cancelled | expired`. `expired → paid` happens only for a verified late payment and sets `needs_review`. `paid` is final.
- **Attempt:** `initiated → success | failed | pending | abandoned`. `pending` can move to `success` or `failed`.
- One central `transition(entity, to, reason)` function: illegal moves raise and are logged, a move to the current state does nothing, and the audit row is written in the same transaction.

## 5. Deliverables by stage
1. This plan.
2. `saas_*` models and migrations; `scripts/sync_saas_plans.py` reading `pricing.md`-derived data, idempotent, never touching subscriptions or overrides; `scripts/backfill_saas_subscriptions.py --dry-run`; DB guard in tests.
3. `PaymentProvider` protocol, `CashfreeProvider` (current documented API version), order create/status, raw-body webhook with HMAC verification, `saas_webhook_event` queue plus `saas_webhook_drain` and `saas_reconcile` jobs, late-payment path, alert hook.
4. Lifecycle service, `require_feature` / `check_limit` on `saas_entitlement`, `floor(cap × 1.1)` member grace, read-only write guard with an allowlist, upgrade proration, scheduled downgrades, 7/3/1-day reminders, FY invoices with PDF, tenant-authorized download. Removes the export gate (F12).
5. Web `/pay`, `/pay/subscribe`, `/pay/success`, `/pay/failed` and `/pay/invoices/[id]`; handoff-token issue and consume endpoints; Playwright tests with a mocked provider.
6. **6a:** desktop opens the system browser with a handoff; mobile shows only "Manage your subscription at repsi.app"; status refresh; regression run. **6b** (separate change, after your approval): remove legacy `SubscriptionPayment`, the `cashfree_*` columns, stub routes and old web checkout code.

## 6. Risks
| Risk | Level | Mitigation |
|---|---|---|
| `app/api/.env` points at production (F21) | HIGH | Never load it. Tests force SQLite or a guarded localhost `_test` Postgres. Explicit overrides for any local run. |
| Float money (F3) | HIGH | New integer tables. Legacy floats are read only for backfill. |
| `ensure_default_plans` overwriting prices (F8) | HIGH | Replace it with the idempotent sync. Leave the legacy table alone. |
| Export gated by subscription (F12) | HIGH | Remove the gate in Stage 4 and add a test. |
| Pricing mismatch, no `pricing.md` (F9, F20) | HIGH | Blocked on Q1. |
| ADMIN can manage billing (F6) | MEDIUM | Restrict order creation to OWNER. |
| No raw-body webhook or durable queue (F5, F14) | MEDIUM | New route and queue table, drained by the existing job runner. |
| Grace is 3 days vs 7 required (F10) | MEDIUM | Make it 7 in the new lifecycle. |
| Cashfree can't reach localhost | MEDIUM | Signed fixtures for automated tests. A live tunnel test is MANUAL (yours). |
| App-store rules on external payment links | MEDIUM | Mobile shows no price and no link button by default (Q8). |
| SQLite lacks `FOR UPDATE` for the invoice counter | LOW | Postgres row lock. SQLite relies on serialized writes. Concurrency test on Postgres is MANUAL or optional. |

## 7. Estimates (focused engineering days)
S2: 2–3 · S3: 3–4 · S4: 3–4 · S5: 3 · S6a: 2 · S6b: 1. Total about 14–17.

## 8. Open questions (recommended default in **bold**)
1. **Pricing:** create `docs/payments/pricing.md` with plans, INR price per cycle and the entitlement matrix. Which file is correct today, backend ₹199 or web ₹299 for Basic? **Default: none. Stage 2 plan-sync is blocked until you provide it.**
2. Billing cycles offered? **Monthly, 6-month and annual** (the refund rule mentions 6-month and annual).
3. Can ADMIN pay? **No. OWNER only. ADMIN can view billing.**
4. Grandfathering: **every existing workspace gets `trialing` with Growth entitlements until launch + 60 days, `is_grandfathered=true`, no charge, reminders on.** Workspaces already on paid or complimentary plans keep that status with `paid_until` = their current period end.
5. Trial eligibility: **one trial per workspace and per owner account. A repeat trial is blocked when the owner's email or phone matches an earlier trial.**
6. Member cap: **`limit = floor(cap × 1.1)`. Above it, only adding or activating new members is blocked. Renewals, check-ins and payments continue.**
7. Read-only allowlist: **login, check-ins, recording member payments and proof approval, data export, all billing endpoints and all GETs. Every other write returns 402 `SUBSCRIPTION_READ_ONLY`.**
8. Mobile: **Android and iOS show no prices and no purchase buttons, only "Manage your subscription at repsi.app" as plain text. Desktop opens the system browser.**
9. Invoices: **`RP/26-27/000001` (16 characters max), sequence per Indian financial year. No GST fields, GSTIN or "Tax Invoice" title until tax is enabled.**
10. Alert channel for stuck or failed payments: **email to the superadmin address via the existing notify service**, plus a superadmin dashboard flag. Do you want Telegram or Slack instead?
11. Upgrade proration: **remaining days ÷ period days × price difference, rounded up to the rupee, with a new `paid_until` unchanged.**
12. Order expiry: **30 minutes.** Pending orders are reconciled every 10 minutes and alert after 3 failed reconciles or 24 hours stuck.
13. Founder override: **set by superadmin, applies to renewals of the same plan and cycle, cleared on plan change unless "carry" is set.**
14. Feature flag: **`SAAS_BILLING_ENABLED` default false. With it off, the new routes return 404 and the legacy behaviour is unchanged.**

## 9. What Stage 2 needs from you
- Approval of this plan, or edits to the defaults in Q2–Q14.
- **`docs/payments/pricing.md`** (Q1): plan codes, INR price per cycle and limits/features per plan.
- Planned launch date, used for the grandfathering end date (Q4).
- Stage 3 only: Cashfree **sandbox** keys exported in your shell as `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` and `CASHFREE_ENV=TEST`. I will only check that they are set, never print them. Optionally, a local Postgres `repsi_test` database for the concurrency tests.

## Gate checks
Every gate lists each check as AUTOMATED (pytest or Playwright, which I run) or MANUAL (yours: live sandbox payment, tunnel webhook, device and store review).
