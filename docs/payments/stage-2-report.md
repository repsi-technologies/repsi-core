# Stage 2 Report: Schema, Migrations, Backfill, DB Guard

Status: **partial, by agreement.** The schema, migrations, backfill and DB guard are done. **Plan-sync is waiting for `docs/payments/pricing.md`.**
Branch: `feature/saas-payments`. Nothing has been committed. Nothing was run against production.

## 1. Changes
| File | What |
|---|---|
| `app/api/app/models/saas.py` | 12 new `saas_*` tables. Money is `BigInteger` minor units with currency beside it. Statuses are `String` columns with `CHECK` constraints. |
| `app/api/app/models/__init__.py` | Registers the new models so `create_all` creates them. |
| `app/api/app/core/migrations.py` | Notes the tables. Now imports `app.models` first, so `python -m app.core.migrations` also creates every table (before this, only the app startup path did). |
| `app/api/app/core/config.py` | `SAAS_BILLING_ENABLED: bool = False`. |
| `app/api/app/services/saas_billing.py` | `add_months` (month-end clamping), `fiscal_year` (Indian FY, IST), `allocate_invoice_number` (row lock, gap-free numbering), `plan_backfill_row` and `backfill_subscriptions`. |
| `app/api/scripts/backfill_saas_subscriptions.py` | CLI. Dry-run by default; `--apply` writes. |
| `app/api/tests/db_guard.py`, `tests/conftest.py` | Tests refuse any database except in-memory SQLite, a `*_test` SQLite file, or a `*_test` database on localhost. Set it with `REPSI_TEST_DATABASE_URL`. |
| `app/api/tests/test_saas_billing_foundation.py` | 31 tests. |

## 2. Schema
`saas_plan`, `saas_plan_price` (unique on plan + cycle + currency, `is_enabled` defaults to false), `saas_entitlement`, `saas_subscription` (one per workspace, founder override, pending downgrade fields, `version`), `saas_order` (unique idempotency key per workspace, unique provider ref, `needs_review`), `saas_payment_attempt`, `saas_webhook_event` (unique on provider + event_id, stores the raw body, doubles as the queue), `saas_invoice` (16 characters max, unique on FY + sequence, nullable tax and GSTIN fields), `saas_invoice_counter`, `saas_audit`, `saas_refund`, `saas_handoff_token` (stores only a hash).
Legacy `subscription_plans`, `gym_subscriptions` and the gym-member `payments` and `memberships` tables are untouched.

## 3. Migration and rollback
- The migration only adds tables, through the existing `create_all`. There are no ALTER, DROP or data changes on existing tables. It is safe to re-run; the tests run it twice.
- **Rollback:** leave `SAAS_BILLING_ENABLED=false`. Nothing reads the new tables yet. A full removal would be `DROP TABLE` on the 12 `saas_*` tables, children first: handoff_token, refund, audit, invoice, invoice_counter, webhook_event, payment_attempt, order, subscription, entitlement, plan_price, plan. **Do this manually, only with your approval. No script runs it.**

## 4. Existing-gym guarantees (backfill)
The backfill never charges, never shortens access, never edits a legacy row, and skips workspaces that already have a subscription. Every row it creates gets `is_grandfathered=true` plus a `saas_audit` entry.
- Suspended → stays `suspended`.
- Complimentary and not lapsed → `active` + `is_complimentary`, `paid_until` = complimentary end (null = no end).
- Admin-set active or grace with a future period end → `active` until that date, on the same plan if it exists in `saas_plan`, otherwise Growth.
- Everything else → `trialing` on Growth until **launch + 60 days**, or the legacy trial end if that is later.
- It records the owner's user id for later repeat-trial checks.

## 5. Tests actually run
- `tests/test_saas_billing_foundation.py`: **31 passed**. Covers migrations running twice on a scratch `*_test.db`, all constraints, calendar clamping, FY boundary in IST, invoice sequencing, backfill rules, dry run, idempotency and the DB guard.
- With `test_trial_system.py` and `test_billing_module.py`: **49 passed**.
- Full API suite: **327 passed, 4 failed.** All 4 are in `tests/test_subscriptions.py` and **fail identically on unmodified HEAD**. That file expects the old plan limits (Basic 10 members), while `ensure_default_plans` now sets 20. They are pre-existing failures, not caused by Stage 2.
- DB guard: with `REPSI_TEST_DATABASE_URL` pointing at a remote host, pytest stops with "Refusing to run tests: Test database host must be localhost."
- Backfill on a scratch SQLite with 3 workspaces: dry run reported `grandfathered_trial: 3`, apply created 3, a second apply reported `skipped_existing: 3`.
- **Not run:** Postgres. The `FOR UPDATE` invoice-lock concurrency test needs a local `repsi_test` Postgres (MANUAL/optional).

## 6. Risks and open items
- **Plan-sync is not built.** It needs `pricing.md`. The backfill refuses to run until a `growth` plan exists.
- The legacy `ensure_default_plans` still overwrites legacy prices on each boot (F8). It stays until Stage 6b; the new tables don't depend on it.
- The 4 pre-existing `test_subscriptions.py` failures need a decision: update the tests or the catalogue. Recommendation: update the tests in Stage 4, when entitlements move to `saas_entitlement`.
- Production steps for you, later: back up the DB, deploy, let startup create the tables, run plan-sync, run the backfill dry run, review it, then run `--apply`.

## 7. Next
- **Stage 2 completion (about 0.5 day once `pricing.md` exists):** `scripts/sync_saas_plans.py` upserts plans, prices and entitlements by code. It never touches subscriptions, orders or founder overrides. Tests cover repeat runs and price changes that leave existing subscriptions alone.
- **Stage 3 acceptance (3–4 days):** provider interface plus Cashfree adapter (from current docs), OWNER-only order creation with idempotency, raw-body signature-verified webhook into the queue, worker drain, reconciliation and late-payment path. Signed-fixture tests for success, failure, pending, duplicate, invalid signature, delayed and late payments. MANUAL: a live sandbox webhook through a tunnel.
