# Stages 2–6 Report: Catalogue, Payments, Lifecycle, Checkout, Clients

Branch: `feature/saas-payments`. Nothing has been deployed, no production database was touched, and `SAAS_BILLING_ENABLED` defaults to `false`.
**Production readiness is NOT claimed:** the MANUAL checks in §6 haven't been done yet.

## 1. What was built
**Stage 2 completion**
- `docs/payments/pricing.md`: prices derived from the published `app/web/lib/pricing-data.ts`. **Needs your confirmation.**
- `app/api/app/core/saas_catalog.py` is the backend source of truth.
- `scripts/sync_saas_plans.py` (`sync_catalog`) is idempotent. It never touches subscriptions, orders or overrides, and deactivates plans instead of deleting them.

**Stage 3: payments** (`app/api/app/services/payment_providers.py`, `saas_payments.py`)
- A `PaymentProvider` protocol, plus a `CashfreeProvider` built from the current official docs: API `2026-01-01`, `POST /pg/orders`, `GET /pg/orders/{id}/payments`. Webhook signature is base64 HMAC-SHA256 of timestamp + raw body.
- Orders: OWNER only, priced server-side, unique idempotency key per workspace (a double click returns the same order), stored durably before the provider is called, 30-minute expiry. Money is handled as integers or `Decimal` only.
- Activation happens only from a payment the server itself fetched from Cashfree. Webhooks and redirects only trigger that check. An amount or currency mismatch sets `needs_review` and raises an alert, with no activation.
- Webhook `POST /api/v1/saas-billing/webhooks/cashfree`: reads the raw body, verifies the signature, stores a unique event id (sha256 of type, order, payment and status), returns immediately, then the `saas_webhook_drain` job (1 minute) processes it. Retries back off exponentially; after 8 failures it alerts.
- `saas_reconcile` job (10 minutes): re-checks created, pending and recently expired orders, expires stale ones, and alerts after 3 provider errors or 24 hours stuck. A late payment moves an order from expired to paid with `needs_review`, at the price actually paid, starting from verification time.
- Refunds come from verified webhooks only and flag the order. There is no refund API.

**Stage 4: lifecycle** (`saas_billing.py`)
- Central `transition()` with tables for subscription, order and attempt. Illegal moves are logged and raised. Repeating a move does nothing. The audit row is written in the same transaction.
- `saas_lifecycle` job (hourly): trial → read_only; active → grace (7 days) → read_only; a cancelled subscription goes straight to read_only; scheduled downgrades apply at period end. Reminders at 7, 3 and 1 days, de-duplicated.
- Renewal: `paid_until = max(now, paid_until) + calendar months`, with end-of-month clamping. Upgrades are prorated (rounded up to the rupee) and keep `paid_until`. Downgrades are scheduled and blocked when usage is over the target plan's caps. Founder overrides apply to the same plan and cycle and are cleared on a plan change.
- Trial eligibility: one trial per owner, with repeats matched by email or phone. A blocked repeat starts as read_only.
- Guards (`middleware/entitlements.py`, `middleware/tenant.py`):
  - When the flag is on, `require_feature` and capacity checks read `saas_entitlement`.
  - Member limit is `cap * 11 // 10`.
  - A read-only write guard returns `402 SUBSCRIPTION_READ_ONLY`. Allowlisted: auth, attendance, member payments, billing, notifications, onboarding and exports.
  - **Member CSV export is no longer plan-gated, even with the flag off.**
- Invoices: `RP/26-27/000001`, gap-free per Indian FY under a row lock. The PDF is titled "Invoice", with no GST fields until tax is enabled. Access is scoped to the tenant.

**Stage 5: web checkout** (`app/web/app/pay/*`, `lib/saas-billing.ts`, `components/pay/pay-ui.tsx`)
- `/pay` (overview, invoices, cancel and resume, handoff sign-in), `/pay/subscribe` (plan and cycle, server-priced summary, official Cashfree v3 JS SDK), `/pay/success` (polls a server-verified status), `/pay/failed`.
- Handoff: `POST /saas-billing/handoff` creates a 5-minute, single-use token bound to user + workspace + purpose, stored as a SHA-256 hash. `POST /handoff/consume` updates it atomically and issues a normal session only to an active OWNER or ADMIN. The token is removed from the URL straight away.
- `pay` was added to the reserved slugs (web middleware and API) and to the client auth-guard public routes. The old billing settings page now sends owners to `/pay`.
- The shared `parseError` now shows the server's message for structured `{error_code, message}` errors.

**Stage 6a: clients**
- **Mobile:** no prices and no purchase buttons. The banner reads `/saas-billing/subscription` (falling back to legacy) and says "Manage your subscription at repsi.app" for grace or read-only. Added an l10n key in en, hi, ta and ml.
- **Desktop:** added `tauri-plugin-opener` (Cargo, capability, `lib.rs`). The web side detects Tauri and opens `repsi.app/pay?t=…` in the system browser, then refreshes on focus. **Not compiled: there is no Rust toolchain on this machine.**
- Server messages shown in the apps use neutral wording ("Manage your subscription at repsi.app").

**Stage 6b: legacy cleanup is NOT done, by design.** It needs a verified sandbox payment and your approval. Candidates for removal:
- `/billing/create-checkout-session`, `/billing/verify-payment` and `/billing/webhook` (all fail closed today).
- `BillingService.create_cashfree_checkout_session` and `verify_and_activate_payment`.
- `SubscriptionPayment`, plus the `cashfree_*` columns on `gym_subscriptions`.
- The web functions `createBillingCheckoutSession` and `verifyBillingPayment`.
- `test_subscriptions.py`, which expects the legacy catalogue.

## 2. Endpoints and tables
Endpoints under `/api/v1/saas-billing`:
- **Public:** `config`, `plans`, `handoff/consume`, `webhooks/cashfree`.
- **OWNER or ADMIN:** `subscription`, `orders/{ref}`, `invoices`, `invoices/{id}`, `invoices/{id}/pdf`, `handoff`.
- **OWNER only:** `POST orders`, `subscription/cancel|resume`, `POST|DELETE subscription/downgrade`.
- **SUPER_ADMIN:** `PUT admin/workspaces/{id}/price-override`.

Schema: `saas_order` gained `provider_session_id`, `reconcile_failures` and `last_checked_at`. The table is new and not yet deployed, so `create_all` adds them.

## 3. Tests actually run
| Suite | Result |
|---|---|
| API full pytest | **362 passed, 4 failed.** All 4 are `test_subscriptions.py` and fail identically on HEAD `ea68e34` (legacy catalogue expectations). |
| `test_saas_payments.py` (new, real Cashfree adapter over a mocked HTTP transport) | 35 passed |
| `test_saas_billing_foundation.py` | 31 passed |
| Web `tsc --noEmit` | passed |
| Web `eslint` on new and changed files | 0 errors (warnings are pre-existing in the old billing page) |
| Web `next build` | passed; `/pay`, `/pay/subscribe`, `/pay/success`, `/pay/failed` built |
| Web `npm run build` (with the i18n prebuild) | **fails on your uncommitted `app/(marketing)/features/features-view.tsx`**: missing keys `final_cta.cta_button` and `pricing_preview.view_full_pricing`. Not touched by me. |
| Playwright, full suite (e2e API now runs with the SaaS flag on and empty Cashfree keys) | 24 passed, including the new `pay.spec.ts` |
| Flutter `analyze lib` | no issues |
| Flutter `test` | 87 passed, 25 failed. All 25 are in `coaching_screens_test.dart` and **fail identically on HEAD** (RenderFlex overflow). |
| Desktop Rust build | **not run** (no cargo or rustc) |

The new tests cover: success, failure, pending, late, duplicate, out-of-order, invalid signature, forged success, tampered amount and currency, double click, provider down, retries and backoff, reconcile alerts, early renewal, proration math, downgrade scheduling and usage block, founder override, trial, grace and read-only, cancelled without grace, illegal transitions, repeat trial, read-only allow and deny, 10% member grace, feature gating, tenant-scoped invoices and PDFs, reminders, handoff single-use, expiry and roles, and plan-sync idempotency.

## 4. Risks and open decisions
1. **Prices:** `pricing.md` is derived from the website. Confirm it, especially Enterprise at ₹3,999.
2. **Webhook event id:** Cashfree documents no event-id header, so dedupe uses a content hash. Replays are harmless because processing re-verifies with the API.
3. **Refund webhook shape** isn't in the fetched docs. The handler reads `data.refund.{cf_refund_id, refund_amount, refund_status}`; confirm it against a sandbox refund.
4. **App stores:** iOS and Android show no prices or links. Apple anti-steering rules still need your review before any wording change.
5. **Desktop:** the opener plugin is unbuilt. Run `cd app/desktop && npm run build` on a machine with Rust.
6. **Legacy billing UI** (`settings/billing`) still shows the old catalogue copy. `/pay` is now the source of truth.
7. `SUPER_ADMIN` bypasses the read-only guard.
