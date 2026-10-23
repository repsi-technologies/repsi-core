# Platform work: completion report (2026-10-23)

The gap list and phased plan are in `docs/PLATFORM_GAP_PLAN.md`. This round covered the items the user
flagged as most important: broadcasts, the super admin dashboard, per-plan entitlements, usage limits,
database performance, caching and load testing. It also did dark mode and several security fixes found
during the audit. Nothing is committed.

## Verification (commands actually run)

| Check | Result |
|---|---|
| `pytest -q` (app/api) | **155 passed, 2 failed** in the final run. Both failures already existed: `test_crm_and_website` (`NameError: order_data`) and `test_trial_system` (reminder dedupe `assert 1 == 0`). Baseline before this work: 131 passed, 2 failed. |
| New test files | `test_plan_limits.py` (6), `test_communications.py` (8), `test_platform_admin.py` (6), plus 2 cases in `test_health.py` and 2 in `test_billing_module.py` |
| `npx tsc --noEmit` (app/web) | Pass |
| `npm run build` (app/web) | Pass |
| ESLint on new web files | 0 errors, 0 warnings. The super admin pages still have older `any` warnings (0 errors). |
| Browser check (local API on scratch SQLite + `next dev`) | Broadcasts page: compose, live audience preview and history, in light and dark. The super admin dashboard follows the light theme and shows real counts. The health page shows only real checks. |

## Status by item

### 1. Dark mode: **Partial**
- Done: the super admin area (all pages and the layout, ~1,100 class swaps), the payment verification queue,
  the dashboard skeleton and the empty state now use theme tokens, with readable accents in light mode.
  The new broadcast and preference screens are token-only. The fitness screens had no light-only colours
  (remaining whites are QR codes and overlays, which are intentional).
- Remaining: a page-by-page visual pass of every owner, trainer and member screen in dark mode. Only the
  broadcasts page and two super admin pages were checked visually this session.

### 2. Notifications and communication
| Item | Status | Notes |
|---|---|---|
| In-app notifications (web) | **Done** | Existing inbox. `POST /notifications` is now staff-only and checks that the recipient is in the workspace (it used to let a member notify anyone). |
| In-app notifications (mobile) | **Not started** | The Flutter app needs to call `/notifications` and `/notifications/preferences`. |
| Email notifications | **Partial** | Broadcast emails send via SMTP, or are logged as `skipped_not_configured`. Welcome, receipt and expiry emails are not wired to lifecycle events yet. |
| WhatsApp OTP | **Done** (already existed) | |
| WhatsApp approved templates | **Done for broadcasts** | Requires an approved template name, an explicit member opt-in, and a provider HTTP 2xx before a send counts as `sent`. HTTP is mocked in tests. Not yet triggered by lifecycle events. |
| User notification preferences | **Done** (web) | `GET/PUT /notifications/preferences`. Turning WhatsApp on records the consent time. |
| Reusable templates | **Done** | `/message-templates`: create, edit, archive. Supports `{{first_name}}` and `{{gym_name}}`. |
| Broadcast to selected groups | **Done** | Segments: all, active membership, expiring in N days, expired, new in N days, hand-picked, trainers, staff. Preview, confirmation, background dispatch, retry. Gated by permission `communications.manage` and plan feature `member_broadcasts`. |
| History, delivery status, logs | **Done** | One `notification_deliveries` row per recipient per channel, with an idempotency key. `/broadcasts/{id}/deliveries` and `/notification-deliveries`. |

### 3. Reporting dashboards: **Not started** (apart from the platform revenue report below)
`/reports/summary` still returns three hard-coded reports. That fake endpoint should be replaced first.
Plan: a reports service with revenue trend, collections, membership cohorts (active, expired, new,
renewing) and attendance peaks. Saved views would go in a `saved_reports` table. CSV export streams from
the backend; Excel uses openpyxl and PDF uses weasyprint or reportlab. Both need the user's OK to add
the dependency.

### 4. Super admin / SaaS management
| Item | Status | Notes |
|---|---|---|
| Platform overview | **Done** | Fake figures removed: no fallback counts, fixed ₹482,000 revenue, or invented activity and charts. MRR comes from paid subscriptions and plan prices, failed payments from `subscription_payments`, charts are cumulative by month, activity comes from audit logs. Cached for 60 s. |
| Tenant management (details, usage, configuration) | **Done** | `/superadmin/workspaces` is batched (no N+1 query) and returns real plan, status, MRR, staff count and last activity, with `q`, `limit`, `offset` and an `X-Total-Count` header. The `CreateGymRequest` default password `OwnerPass2026!` is removed. |
| Plans, trials, overrides, complimentary access | **Done** (already existed) | Changes now invalidate cached entitlements immediately. |
| Platform invoices and payments | **Partial** | `/superadmin/payments` now reads platform `subscription_payments` instead of gym-member payments, and no longer invents rows. `/workspaces/billing` still returns hard-coded invoices. Cashfree checkout is intentionally disabled. |
| Per-plan feature entitlements | **Done** | `GET /billing/entitlements` returns features, limits and usage. `require_feature` uses a cached snapshot. The plan catalog syncs new feature keys on startup. |
| Usage limits enforced | **Done** | Every path is checked: member create, CSV import (per-row error), CRM conversion, invitation accept, direct add, reactivation, trainer create, staff invite, and branch create. Staff usage no longer counts gym members. |
| Grace, restriction, safe reactivation | **Partial** | Suspending a workspace now actually blocks its users: `WORKSPACE_SUSPENDED`, except read access to auth, billing status and notifications. Reactivation re-checks member quotas. The existing 3-day billing grace period is unchanged. |
| Platform revenue reports | **Done** | `GET /superadmin/revenue`: monthly collections, failed payments, MRR by plan. There is no UI page for it yet. |
| Audit and admin logs | **Done** (already existed) | Broadcasts are now audited. |
| Support management | **Not started** | The support page has no backend. |
| Platform-wide broadcast | **Done** | It used to return a fake "queued" without delivering anything. It now delivers in-app to owners and admins (or everyone) of active, paying or trial workspaces, logs a delivery row for each, and keeps a history at `/superadmin/broadcasts`. |
| Suspension and reactivation | **Done** | See above. |

### 5. Security and reliability
| Item | Status | Notes |
|---|---|---|
| Request validation | **Partial** | New endpoints use constrained Pydantic schemas. Older ones are unchanged. |
| Secure headers | **Done** | nosniff, frame DENY, referrer policy, permissions policy, COOP, CSP on JSON responses, and HSTS in production. |
| Request-size limit | **Done** | 12 MB cap returns 413. |
| Rate limits | **Partial** (already existed for auth) | Per-process only. Use Redis for multiple workers. |
| Tenant-isolation and role tests | **Done for the new areas** | Covered for broadcasts, templates, deliveries, notifications, billing, super admin and limits. |
| Private uploads with validation | **Not changed** (already existed for payment proofs and logos) | |
| Backups and restore runbook | **Not started** | See the plan below. |
| Error capture (backend/web/mobile/desktop) | **Partial** | The backend logs unhandled errors as JSON with a request ID and returns that ID to the client. Sentry or similar is not added; it needs a new dependency and a DSN. |
| Structured logs with request IDs | **Done** | JSON log lines with an `X-Request-ID` echo. Logs record method, route, status and duration only, with no PII. |
| **Security fix:** `/billing/*` read any workspace from a header, unauthenticated | **Fixed** | It now requires auth and takes the workspace from the token. Checkout and verify require owner or admin. |

### 6. Performance and operations
| Item | Status | Notes |
|---|---|---|
| Indexes | **Done** | Composite indexes on members, memberships, notifications, audit logs, workspace members, payments, subscription payments and subscriptions. Each is in its model and as a guarded `CREATE INDEX IF NOT EXISTS`. |
| Query optimisation | **Partial** | Removed the plan-catalog sync that ran on every gated request (6 queries plus a commit). Super admin lists are batched. The member list is 4 queries. |
| Pagination | **Partial** | New lists and super admin workspaces and payments are paginated. Some older super admin lists (members, trainers, users) are not. |
| Caching | **Done** | `core/cache.py` TTL cache for entitlements and the overview, invalidated on admin changes. Per process; switch to Redis for multiple hosts. |
| WebP/AVIF images | **Not started** | |
| Background jobs and scheduled tasks | **Partial** | Broadcast dispatch runs in FastAPI BackgroundTasks, and `dispatch_queued_deliveries` can be called by a cron job. There is no scheduler for reminders yet. |
| CI/CD with staging and production | **Not changed** | `.github/workflows/{ci,deploy,release}.yml` exist but were not reviewed this session. |
| Capacity / load test | **Done** | `app/api/scripts/load_test.py`. Results below. |

## Load test (local, 1 uvicorn worker, SQLite, Windows laptop)
Raw JSON: `reports/load/loadtest-10users.json` and `reports/load/loadtest-25users.json`.

| Users | Throughput | Errors | p50 | p95 | p99 | Server RSS (peak) | CPU |
|---|---|---|---|---|---|---|---|
| 10 | 84 req/s | 0% | 81 ms | 271 ms | 327 ms | 148 MB | ~137% of one core |
| 25 | 82 req/s | 0% | 244 ms | 567 ms | 661 ms | 154 MB | ~136% of one core |

What this shows: one worker saturates at about 80 req/s, and extra users only add queueing time.
In-process, `GET /members` is 4 queries and about 10 ms, so the latency is CPU and worker-bound, not
caused by queries. Next steps: run several workers on PostgreSQL in staging with the same script
(`--allow-remote`). Also make member import faster: 30 rows took 6.8 s because of a bcrypt hash per
row. SQLite numbers do not predict PostgreSQL production capacity.

## Findings outside scope (not changed)
- CSV import gives imported members a password derived from their phone number, and does not link
  `Member.user_id` to the user it creates. As a result, imported members never get in-app notifications.
- The JWT `SUPER_ADMIN` role is trusted without a database check in `get_current_tenant`.
- `/workspaces/billing` returns hard-coded invoices.
- The STAFF role is shown the member navigation in the sidebar.

## Plan for what's left
1. Reports: replace `/reports/summary`, add revenue, membership and attendance analytics, saved views, and CSV export. Excel and PDF need the user's OK for new dependencies.
2. Lifecycle notifications: welcome, receipt and expiry, as event hooks into the existing `NotificationDelivery` log, run from a daily scheduled job.
3. Mobile: inbox, preferences and push.
4. Backups: a nightly `pg_dump -Fc` to object storage with 30-day retention. The restore runbook is `pg_restore --clean --no-owner` into a fresh database, then a smoke test, and should be rehearsed monthly.
5. Error capture via Sentry (needs a DSN), on backend, web, mobile and desktop.
6. WebP/AVIF conversion with `next/image` and a sharp build step.
7. Review the CI pipeline and add a staging deploy and a load-test job.
