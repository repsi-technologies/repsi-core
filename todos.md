# REPSI — Module status and todos

Source: `Repsi - Modules (1).pdf` (136 modules, 15 groups), compared against the code on `master`.
First written 2026-10-23; **updated 2026-10-23 (second pass)** after the work below.
Nothing is committed. Verification results are in section 4.

Legend: ✅ done · 🟡 partial (what's missing is stated) · ⛔ blocked or not started (reason stated)

---

## 1. Module status

| Group | Modules | Status |
|---|---|---|
| 1. Core foundation | 01–10 | ✅ 01–04, 06–10 · 🟡 05 Flutter app not changed or verified here (no Flutter SDK) |
| 2. Workspace & onboarding | 11–18 | ✅ all |
| 3. Member management | 19–28 | ✅ all (27 Member Documents added) |
| 4. Memberships | 29–38 | ✅ all (30 plan access rules and class credits, 37 coupons added) |
| 5. Attendance & access | 39–45 | ✅ all (plan rules now checked at check-in) |
| 6. Trainers & staff | 46–53 | ✅ all (49 weekly availability and time off added) |
| 7. Payments & finance | 54–65 | ✅ all (61 refunds, 62 PDF receipts, 65 day-end reconciliation, 60 real dues) |
| 8. Workouts & fitness | 66–73 | ✅ all |
| 9. Classes & appointments | 74–80 | ✅ all (sessions, booking, waitlist, cancellation, capacity, PT appointments, calendar) |
| 10. Notifications | 81–88 | ✅ 81 web, 82, 84–88 · 🟡 81 mobile inbox UI and 83 SMS (code done, provider not configured) |
| 11. Dashboards & reporting | 89–96 | ✅ all (92–96 real reports, saved views, CSV/Excel/PDF) |
| 12. Super admin & SaaS | 97–110 | ✅ all (108 support tickets added; 102 shows real invoices only) |
| 13. Security & infra | 111–122 | ✅ 111–114, 117–119, 122 · 🟡 115, 116, 120, 121 (need real infrastructure; see C) |
| 14. AI features | 123–130 | ✅ all (per-gym AI budgets and prompt-injection tests added) |
| 15. i18n & accessibility | 131–136 | ✅ 131–135 · 🟡 136 (formatting follows the language; full WCAG audit not done) |

## 2. Todo list from the first pass — what happened

### A. Launch blockers

- [x] **A1 Sessions.** Server-side sessions (`auth_sessions`): access tokens carry a session id, refresh tokens are hashed and
      rotate on each use (reusing one fails), logout revokes the session, and a password change or reset signs out other
      devices. Endpoints: `/auth/refresh`, `/auth/logout`, `/auth/sessions`. The web app stores the refresh token and retries
      once after a 401. *Still open:* moving tokens from `localStorage` to an HttpOnly cookie, and a short access-token
      lifetime. Both need the web and mobile clients changed together.
- [x] **A2 Audit P0 list.**
  - Role checks were missing on dashboard, users, machines, website, classes and search. Members could read revenue,
    staff emails and other members. Fixed with permissions, plus tests.
  - Legacy `/auth/register` is off in production.
  - `/auth/register/member` now only claims a member record the gym created.
  - Seed passwords are no longer in git. Seed and reset refuse production and non-SQLite databases.
  - The forged `SUPER_ADMIN` claim is now checked against the database.
  - Google login and the check-availability endpoint were already fixed.
  - **Also found and fixed:** members created without a password got the shared default `MemberPass123!`, and CSV imports
    used the phone number as the password. Anyone could sign in as those members. No login is created now unless staff set
    a password.
  - The public website endpoint auto-published unpublished sites and crashed when listing trainers.
  - Member delete cascaded away payment history.
  - Rate limits trusted a client-sent `X-Forwarded-For`, so a fake IP bypassed the login and OTP limits. Now only the hop our
    own proxy appended is trusted (`TRUST_FORWARDED_FOR`).
- [x] **A3 Failing tests.** The trial reminder off-by-one is fixed. `test_crm_and_website` passes with the existing working-tree change.
- [~] **A4 Backups.** `scripts/backup.py` handles `pg_dump` or SQLite, uploads, a checksum manifest, retention and optional S3
      upload. The deploy takes a backup before each release. The runbook is in `docs/RUNBOOK_OPERATIONS.md`. *Verified on
      SQLite only.* The PostgreSQL path, the cron entry and a restore rehearsal need the real server.
- [~] **A5 Deploy.**
  - Added `.dockerignore` and a non-root image with a healthcheck.
  - `docker-compose.production.yml` has an api service and a jobs worker.
  - `deploy.yml` deploys to staging after CI, and to production by manual approval, with a health check and automatic rollback.
  - CI now runs lint, tsc, Playwright and dependency audits.
  - The stale `uv.lock` is fixed.
  - *Not run:* no Docker here. GitHub environments and secrets have to be created.
- [ ] **A6 Alembic and PostgreSQL tests.** Kept the additive `migrations.py`, as the project's own rules say ("don't
      introduce Alembic in passing"). Adopting Alembic is a separate decision. No PostgreSQL is available here, so tests still
      run on SQLite only.
- [x] **A7 Scheduler.** There are 7 jobs (messages, membership transitions, expiry reminders, auto checkout, class no-shows,
      trials, SaaS grace). They run from the in-process scheduler or `scripts/run_jobs.py` in cron. Each slot is claimed once
      in the database. Super admins see job runs and can trigger them.

### B. Missing modules — all built (API, tests and web screens)

- [x] **B1 Member documents:** private storage, type and size checks, member sign-off with name, time and IP, archive instead of delete.
- [x] **B2 Classes and appointments:** dated sessions and weekly series, booking, waitlist with auto-promotion, booking window,
      late cancel, class credits, check-in, no-shows, PT appointments, and one calendar for both.
- [x] **B3 Trainer availability:** weekly slots, time off, free-slot search, clash checks.
- [x] **B4 Reports:** revenue, memberships, attendance, dues, trainers and classes. Saved views, and CSV, Excel and PDF export.
      The hard-coded `/reports/summary` and the fake Reports page are replaced.
- [x] **B5 Support tickets:** gym side and a super-admin queue, internal notes, resolution, notifications.
- [x] **B6 Coupons:** percent or flat, cap, dates, usage limits, plan scope, new members only, redemption history.

### C. Partial modules

- [x] C1 plan access rules · [x] C2 refunds · [x] C3 PDF receipts with sequential numbers · [x] C4 day close · [x] C5 analytics
- [x] **C6/C7** Welcome, receipt, expiry, freeze and extension messages go out by in-app, email, WhatsApp (approved template
      plus consent), SMS (MSG91 or Twilio) and push. All are idempotent. *Providers aren't configured, so these are recorded as
      `skipped_not_configured`.*
- [~] **C8** The backend has device registration and FCM push. *The Flutter inbox and push UI are not built (no Flutter SDK
      here). Desktop uses the web app.*
- [x] **C9** Storage layer: local disk or S3, used by receipts, QR codes, logos and documents. *S3 needs `boto3` and a bucket.*
- [x] **C10** Sentry hook with PII scrubbing. *Needs `sentry-sdk` and a DSN.* The system health page shows its status.
- [x] C11 AI budgets and injection tests · [x] C13 configurable grace period, real billing data (the fake Visa card and invoices are removed)
- [~] **C12** Formatting follows the chosen language. All five language packs have the same 116 keys. *Most screens still
      have untranslated English text, and no full WCAG audit has been done.*
- [x] **C14** Negative role tests for the new and fixed endpoints, plus Playwright role and tenancy checks.

### D. Bugs and debt

- [x] CSV import passwords and links · [x] super admin database check · [x] STAFF navigation and route guard · [x] super admin lists paginated and batched
- [x] Web e2e tests (Playwright) · [x] Tauri CSP · [x] the release APK fails without a release keystore
- [x] One API base URL (`api.repsi.app`; `fastapicloud.dev` and the plain-HTTP rewrite are removed)
- [x] Mobile navigation showed the owner menu to every role · [x] the member route guard let members open `/members`
- [ ] Dark-mode visual pass of every screen. Only the new screens use tokens by construction.
- [ ] WebP/AVIF images (`images.unoptimized: true` kept). Changing it needs a deploy-target check.
- [ ] Splitting the big files (`lib/api.ts`, `superadmin.py`, …). This is a risky refactor that isn't needed for function, so it's deferred.
- [ ] PostgreSQL multi-worker load test (needs staging).
- [ ] Review and commit the working tree (your earlier uncommitted changes plus this work).

## 3. Needs your action (can't be done from this machine)

1. Create GitHub environments `staging` and `production` with `VPS_*` secrets and required reviewers. Add the
   `ANDROID_KEYSTORE_BASE64` / `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_ALIAS` / `ANDROID_KEY_PASSWORD` secrets.
2. On the VPS: `.env.production`, the backup cron line, and one restore rehearsal (runbook §1–2).
3. Choose and configure providers: SMTP, AiSensy templates per event, SMS (MSG91 DLT ids), FCM, S3 bucket, Sentry DSN.
4. Product decisions: Alembic adoption, HttpOnly-cookie sessions, which plan tier gets classes, coupons, reports and documents.
5. The homepage demo-booking widget posts leads to the `apex-fitness` site (override with `NEXT_PUBLIC_DEMO_LEADS_SLUG`).
   Public lead forms now need a **published** site, so make sure that site is published in production.

## 4. Verification

See the final report in the conversation; summary:

- API: `pytest -q` (in-memory SQLite) — **233 passed, 0 failed** (was 169 passed / 1 failed at the start of this pass)
- Web: `eslint . --quiet` — **0 errors** (was 7; warnings remain) · `tsc --noEmit` — **pass** · `next build` — **pass**
- E2E: `npx playwright test` (scratch SQLite API + next dev, Chromium desktop + Pixel 7) — **19 passed** (first runs found 2 real bugs, both fixed: the member route guard and the mobile nav role)
- Migrations: applied twice to a copy of the dev SQLite DB; 86 tables, no errors.
- Backup script: SQLite dump of a copy of the dev DB, integrity check ok. PostgreSQL path not run.
- Not run: Docker build, Flutter, Tauri/Rust, PostgreSQL.
