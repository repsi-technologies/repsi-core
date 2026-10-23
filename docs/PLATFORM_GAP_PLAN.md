# Platform gap list and phased plan (2026-10-23)

Audit of what existed before this round of work. "Fake" means the endpoint returned hard-coded
numbers or a success it never performed.

## Audit findings

| Area | What exists | Gap |
|---|---|---|
| Dark mode | Token system in `globals.css` (`:root` / `.dark`), `ThemeProvider`, toggle in topbar. Workspace dashboards mostly use tokens. | Super admin pages hard-code a dark zinc palette (~600 classes), so they ignore the theme. `dashboard-skeleton`, `empty-state`, `getting-started-dialog` use hard-coded light hex. Gray/slate/zinc utilities are static in `@theme`, so they don't flip. |
| In-app notifications | `Notification` model, list / mark-read / mark-all endpoints, web page. | `POST /notifications` lets any role (including members) create a notification for any `user_id`, without checking that the user belongs to the workspace. No delivery status, no channels. |
| Email | `core/email.py` covers OTP, invitations, credentials and password reset (SMTP, dev-print fallback). | No welcome, receipt or expiry emails. No delivery log. |
| WhatsApp | AiSensy OTP provider. Renewal reminders are only `wa.me` links. | No business-template sender, consent or delivery log. |
| Preferences / templates / broadcasts | None in the workspace app. | All missing. The super admin `/broadcast` returned "queued" and delivered nothing (fake). |
| Reports | `/reports/summary` returned three hard-coded reports (fake). Dashboard service and attendance reports are real. | Revenue trends, membership analytics, custom reports, saved views, and Excel/PDF export are all missing. |
| Super admin | Many endpoints: workspaces, members, trainers, users, audit logs, plans, trials, overrides, complimentary access, status. | `/overview` was fake: fallback counts (`or 128`), fixed revenue (482000), fixed failed payments, invented activity and charts. `/workspaces` had an N+1 query and fake plan, MRR and "last active". `/payments` mixed gym-member payments into platform revenue and invented payments when the table was empty. `/system-health` was fully hard-coded. `CreateGymRequest` had a default owner password. |
| Entitlements | `require_feature`, plan feature JSON, per-gym overrides, complimentary access, suspension. | Fine as a base. |
| Usage limits | `check_member_capacity` on `POST /members`; `check_trainer_capacity` on trainer create. | The staff count included gym members (`USER` role), so the staff limit was meaningless. The staff limit was never enforced. The branch limit was never enforced. The member limit was bypassed by invitations, self-signup, CSV import and CRM conversion. |
| Security | Auth rate limiting on auth endpoints, permissions module, audit log. | No secure headers, no request IDs, no structured request logs. |
| Performance | Per-column `workspace_id` indexes. | No composite indexes for hot filters (attendance by time, payments by date, memberships by end date, notifications by unread). No caching. Super admin lists are unpaginated. |
| Ops | `.github/workflows/ci.yml`, `deploy.yml` and `release.yml` exist. | No load-test harness, backup or restore runbook, or error capture. |

## Phased plan (priority order from the request)

1. **Entitlements and usage limits.** Correct the staff count, enforce staff, branch and member limits on every
   creation path, and expose the full entitlement map to the web.
2. **Broadcasts to selected groups.** Add the `Broadcast`, `BroadcastDelivery`, `MessageTemplate` and
   `NotificationPreference` models. Audience segments, in-app delivery, email through SMTP (`skipped_not_configured`
   when SMTP is absent), WhatsApp recorded as `skipped_not_configured` unless approved templates and credentials
   exist. History and delivery-status endpoints. Lock down `POST /notifications`.
3. **Super admin dashboard.** Real overview metrics, MRR from subscriptions, growth charts from `created_at`,
   activity from audit logs, a batched workspace list with real plan and usage, platform payments from
   `SubscriptionPayment`, real health checks, a platform revenue report, and a real platform broadcast.
4. **Database performance.** Composite indexes (model + guarded `CREATE INDEX IF NOT EXISTS`), pagination on
   super admin lists, a TTL cache for entitlements (invalidated on admin changes) and for the overview.
5. **Reliability basics.** Request-ID middleware, structured access log, secure headers.
6. **Capacity / load test.** `app/api/scripts/load_test.py`: concurrent users, p50/p95/p99 latency, RSS/CPU, run
   locally against scratch SQLite.
7. **Dark mode.** Convert the super admin palette to tokens, and fix skeletons and empty states.
8. Later (see completion report): reports and exports, WhatsApp templates, scheduled jobs, mobile and desktop
   notifications, backups, error capture, image conversion, CI staging.
