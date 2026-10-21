# REPSI — Engineering Audit & Assessment

- **Audit date:** 2026-10-21
- **Commit audited:** `936f8ca` on `master` (working tree clean before and after the audit)
- **Scope of changes made:** none to source. This file is the only artifact added. A `next build` refreshed the git-ignored `app/web/.next/`.
- **Existing prior report:** `reports/PRODUCTION_READINESS_REPORT.md` (2026-10-19) was **not overwritten**. Several of its claims are contradicted by the checks below (see §11).

Legend: **[V]** verified by reading code or running a command in this audit. **[A]** assumption or inference, not verified.

---

## 1. Repository structure and technology stack

Monorepo, 675 tracked files, 15 commits. Root `package.json` declares an npm workspace containing only `app/web`.

| App | Path | Stack | Notes |
|---|---|---|---|
| API | `app/api` | FastAPI, SQLAlchemy 2 (sync), Pydantic v2, python-jose, bcrypt, SQLite/Postgres, `uv` | ~15k LOC Python, 22 routers, ~210 route decorators [V] |
| Web | `app/web` | Next.js 16.4 (App Router), React 19.2, Tailwind 4, Radix, recharts, three/ogl/framer-motion | 255 TS/TSX files, 139 build routes [V] |
| Mobile | `app/mobile` | Flutter, Riverpod, Dio, GoRouter | ~100 Dart files, 2 test files [V] |
| Desktop | `app/desktop` | Tauri v2 shell | Loads a generated launcher pointing at `https://repsi.app` [V per prior report + `tauri.conf.json`] |
| CI/CD | `.github/workflows` | `ci.yml`, `deploy.yml` (SSH to VPS), `release.yml` (APK + desktop on tag) | |
| Docs | none | `docs/` did **not** exist before this file; README links `docs/architecture.md` and `docker/`, `docker-compose.yml`, which also do not exist [V] |

Untracked/ignored but present locally: `app/api/repsi.db` (909 KB SQLite dev DB), `app/api/private_storage/` (receipts, QR images), `app/api/.venv`, root `node_modules`. All are git-ignored [V]. `app/mobile/assets/.env` **is tracked** despite the `.env` ignore rule (contents: only the public API base URL, so no secret leaked) [V].

## 2. Architecture and dependency map

```
Browser (Next.js, client-rendered pages)  ──►  /api/v1/[...path] Next proxy ──► FastAPI (api.repsi.app)
   │  (lib/api.ts 2.9k-line client; also calls API directly via NEXT_PUBLIC_API_URL)
Flutter app ───────────────────────────────────────────────────────────────►  FastAPI /api/v1
Tauri desktop ► loads https://repsi.app (same web app)

FastAPI:  router → (Depends get_current_tenant) → inline role checks → services/repositories → SQLAlchemy
          lifespan: Base.metadata.create_all + hand-written ALTER TABLE migrations (core/migrations.py)
Storage:  local disk app/api/private_storage (receipts, merchant QR)
Email:    SMTP (Gmail) for registration OTP only
Payments: manual UPI/receipt verification (live); Cashfree/Razorpay routes intentionally return 503
```

Tenant model [V]: `Workspace` ← `WorkspaceMember(role)` → `User`. Tenant tables carry `workspace_id`. `BaseTenantRepository` scopes by workspace. `get_current_tenant` resolves workspace from the JWT or the `X-Workspace-ID` header and verifies an active `WorkspaceMember` row (sound). `SUPER_ADMIN` bypasses it.

Roles (`UserRole`): SUPER_ADMIN, OWNER, ADMIN, MANAGER, TRAINER, STAFF, USER. "Member" in the UI is role `USER`. The frontend also has a `MEMBER` role string that the backend never emits.

## 3. Features and implementation status

| Area | Status | Evidence |
|---|---|---|
| Registration with email OTP | Works | hashed OTP, 5-attempt cap, cooldown, `secrets` [V]. **But** the non-OTP `/auth/register` is still live (§4 P0-2) |
| Login (email/phone), Google login | Works, with flaws | §4 |
| Workspaces, onboarding wizard, slug rules | Works | tests pass |
| Members CRUD, CSV import/export, memberships/plans | Works | tests pass |
| Attendance (QR, check-in/out, auto-checkout, CSV) | Works | tests pass; 977-line service |
| Trainers, assignments, workouts | Works | tests pass |
| Manual UPI payments + receipt review | Works; best-built module | magic-byte check, size cap, UUID filenames, per-member isolation [V] |
| Billing / plans / trials / entitlements | Works, partial enforcement | `require_feature` applied on only 5 call sites [V]; trial reminder off-by-one (§4) |
| CRM, website builder, public gym sites | Works, auth gaps | §4 |
| Superadmin portal | Works | single `get_superadmin` guard [V]; 1,595-line router |
| Biometric devices | Partial | adapter present; hardware integration not verifiable here [A] |
| **Password reset** | **Not implemented** | `POST /auth/forgot-password` returns a success message and sends nothing; no reset endpoint [V] |
| **Logout / token revocation** | **Not implemented** | `/auth/logout` is a no-op [V] |
| **Reports** | **Stub** | `/reports/summary` returns hard-coded 2025 data [V] |
| Online payments (Cashfree/Razorpay) | Disabled by design | 503 [V] |
| Classes | Basic | create/list/attendance only, no edit/delete [V] |
| Chat, running tracker, diet plan (web/mobile screens) | Unknown | no backend routes seen for chat [A]; not traced |
| Alembic migrations | **Declared dependency, not used** | no `alembic.ini` or migrations dir [V] |

## 4. Critical bugs, security vulnerabilities, technical debt

### P0 findings (each verified)

**P0-1. Missing role authorization — any workspace member can act as owner.** Only a subset of endpoints check `tenant.role`. These have **no role check**: `classes.py` (create, participants), `machines.py` (create/update/delete), `dashboard.py` (`/dashboard/metrics`, `/owner/dashboard`, revenue), `users.py` (lists all workspace users with email/phone), `websites.py` (`PUT /my-website`, publish, **connect custom domain**), `notifications.py` (create for any `user_id`), `search.py`.
Combined with **P0-3** below, this is exploitable by an anonymous internet user. Proof of concept run in-memory (scratchpad script, no repo or DB writes): registered an owner, self-registered as a `USER` of that gym using only its public slug, then with that `USER` token: `GET /dashboard/metrics` → 200, `GET /users/` → 200 (staff emails), `POST /machines/` → 201, `POST /classes/` → 201, `DELETE /machines/{id}` → 200. The frontend `AuthGuard` blocks this in the UI only; the API is the real boundary.

**P0-2. Unverified owner registration is still open.** `POST /auth/register` (the non-OTP path) creates a User, Workspace, OWNER membership and a 14-day trial with no email verification (PoC returned 201). This defeats the OTP flow, enables trial farming and email squatting, and it also deletes any "orphan" user with the same email.

**P0-3. Open self-registration into any gym.** `POST /auth/register/member` takes a public `workspace_slug` and grants an active `USER` membership with no invitation, approval or matching Member record. Slugs are public (`/site/{slug}`). This is what makes P0-1 anonymously reachable.

**P0-4. Hard-coded default credentials in git, including a SUPER_ADMIN.** `app/api/app/core/seed.py` creates accounts with weak, committed passwords (superadmin, owner, trainer, user, and a personal account), and re-sets the personal account's password on every run. `reset_db.py` runs `drop_all` against whatever `DATABASE_URL` is set, with no environment guard. If the seed was ever run against production, the superadmin password is public. **Action: rotate/disable on production regardless of whether the seed was run.** Passwords are intentionally not reproduced here.

**P0-5. Password recovery is a lie.** `/auth/forgot-password` responds "instructions have been sent" and does nothing (PoC confirmed, for a non-existent address). Users locked out have no recovery path.

**P0-6. Deploy pipeline cannot work.** `deploy.yml` runs `docker compose -f docker-compose.production.yml …` and `alembic upgrade head`. Neither the compose file nor Alembic config exists [V]. There is also no `.dockerignore`, so `COPY . .` in the API Dockerfile would bake `repsi.db`, `private_storage/`, `.venv` and any `.env` into the image [V]. The Dockerfile runs as root, has no healthcheck and a single uvicorn process. Triggers on `main`/`master` pushes touching `app/api/**`.

### P1 findings

- **Google login accepts any Google access token.** It calls `userinfo` with the token and never checks audience/client ID or `email_verified`. A token minted for any third-party app by a victim can log in as that victim. `google-auth` is a dependency but unused for verification [V].
- **Pre-hijack via "phone number as password".** `authenticate()` lets anyone log in as an owner-created Member using the member's email/phone and password = their phone number, and permanently creates the User with that password [V]. Also crashes (500) if `member.email` is null [A, from code read].
- **Unauthenticated destructive GET.** `GET /auth/check-availability` deletes "orphan" User rows as a side effect, and doubles as an email/phone enumeration oracle with `LIKE %…%` phone matching [V].
- **No rate limiting anywhere** (login, OTP request/verify, public lead form, availability). No lockout. No password-strength rule (`password: str`) [V].
- **Session design:** 7-day non-revocable JWT; token stored in a JS-readable cookie **and** `localStorage` (XSS-stealable); no refresh tokens; logout is client-side only; deactivating a user does not invalidate tokens for SUPER_ADMIN path and relies on per-request membership lookups for others [V].
- **Public `GET /websites/public/{slug}` mutates state:** if a workspace has no website row it creates one and **forces `is_published = True`** [V]. Public lead POST has no spam control.
- **Web API proxy** (`app/api/v1/[...path]/route.ts`): forwards all client headers, forges `Origin`/`Referer` as `https://repsi.app`, sets `Access-Control-Allow-Origin: *`, and defaults to the **production** API when `REMOTE_API_URL` is unset (a dev machine can write to prod). `next.config.ts` has a second, unrelated rewrite to plain **`http://api.repsi.app`**, and `lib/auth.ts` defaults to a third host (`repsi.fastapicloud.dev`). Three API base URLs, one of them non-TLS [V].
- **Release APK signs with the debug keystore** when no release keystore is configured (`build.gradle.kts`) [V].
- **Tauri `csp: null`** [V].
- **Trial reminder bug (also a failing test):** `days_left = int(seconds // 86400)` floors, so 2 days minus microseconds becomes "1 day" and the 1-day reminder fires at ~2 days. Idempotency itself is fine; the milestone math is off by one [V by reproducing and reading].

### P2 / debt

- **Schema management is `create_all` + hand-rolled `ALTER TABLE ADD COLUMN`** in `core/migrations.py` (only covers 6 tables, no type changes/indexes/rollback; swallows exceptions). Startup failures are `print`ed and ignored in `main.py` lifespan, so the API starts with a broken schema [V].
- `/health` always reports `"database": "connected"` without querying [V].
- Sync SQLAlchemy and a sync `httpx.get` to Google inside a request handler; `asyncpg` listed but unused [V].
- Authorization logic duplicated inline per endpoint (`tenant.role not in [...]` lists) rather than a shared dependency, which is the root cause of P0-1.
- Duplicate/overlapping concerns: `SECRET_KEY` and `JWT_SECRET` both appear in `.env.example`, only `SECRET_KEY` is read; `Settings` ignores `.env.example` keys like `REFRESH_TOKEN_EXPIRE_DAYS`, `JWT_*` (`extra="ignore"`) [V].
- Large files: `superadmin.py` 1,595 lines, `services/billing.py` 1,017, `manual_payment.py` 996, `attendance.py` 977; web `lib/api.ts` 2,937, `onboarding/wizard/page.tsx` 1,909, `website/page.tsx` 1,686 [V].
- Dead/misleading code: `lib/mock-data.ts` (21 lines, no importers found by grep); `components/ui/lanyard.tsx` and `components/animations/lanyard.tsx` both exist; two `pricing-section.tsx`; hard-coded `apex-fitness` default workspace slug in web `loginSession` default and Flutter `AppConfig`; `UserRole`/`MEMBER` mismatch.
- 1,003 ESLint warnings (mostly `no-explicit-any`; 124 `any` in `lib/api.ts`).
- Local-disk file storage: not horizontally scalable, not in any backup story [A].
- Untested paths: Postgres (tests use SQLite in-memory only) [V]; email sending; Google login; biometric hardware.

## 5. Database, API, auth and multi-tenant assessment

- **Isolation core is good.** `get_current_tenant` verifies membership; repositories filter by `workspace_id`; the receipt flow explicitly blocks cross-member access; two isolation test files pass [V]. Residual risk: isolation is by convention (each query must remember to filter), no Postgres RLS, no FK from `workspace_id` on most tenant tables (`TenantMixin` is a plain indexed string) [V]. A forgotten filter becomes a cross-tenant leak. Recommend a test that introspects all routes and asserts a tenant filter, plus FKs.
- **Authorization is the weak layer** (P0-1/3). A single `require_roles(...)` dependency applied router-wide would close it.
- **Entitlements:** `require_feature` is used in 5 places; most modules (CRM, websites, biometric, classes, machines) are not plan-gated server-side even where the pricing page implies they are [V]. Needs a product decision on which features are gated.
- **IDs and PII:** UUID strings; PII (phones/emails) returned to unauthorized roles per P0-1.
- **Concurrency:** member/trainer capacity checks are check-then-insert without a lock, so parallel requests can exceed plan limits [A, from code shape].

## 6. Frontend UI/UX and responsiveness

Verified at build/lint level only. **No browser or viewport testing was performed in this audit** [not run].
- Route-level auth is client-side (`AuthGuard` in a layout, reads localStorage/cookie). `middleware.ts` only rewrites vanilla slugs to `/site/{slug}`; it is also a hand-maintained reserved-slug list that must stay in sync with the backend `reserved_slugs` set in `auth.py` (they already differ) [V]. Next 16 warns the `middleware` convention is deprecated in favor of `proxy` [V from build].
- Heavy decorative bundle (three.js, ogl, lottie, framer-motion) is on marketing pages; `images.unoptimized: true` disables Next image optimization [V]. Performance impact not measured.
- Accessibility not assessed beyond noting Radix primitives are used (good baseline) [A].
- i18n for 5 languages exists on web and mobile; completeness of translations not verified.

## 7. Testing, deployment, performance, maintainability gaps

| Gap | Detail |
|---|---|
| Web tests | **None** (no jest/vitest/playwright files) [V] |
| Mobile tests | 2 files; CI runs `flutter analyze/test/build apk` [V from workflow]. Not run here |
| API tests | 69 tests, good breadth on tenancy/billing/payments; 2 failing (below); no negative RBAC tests, which is why P0-1 passed CI |
| CI | Web job runs only `npm ci` + `npm run build`: **no lint, no `tsc`**. API job runs pytest. No security scanning, no dependency audit, no coverage |
| Deploy | Broken (P0-6). No staging, no rollback, no DB backup job, no secrets/rotation doc |
| Observability | `print` statements, no structured logging, no error tracking, no metrics, no request IDs; `/health` is static |
| Background jobs | Trial reminders/auto-checkout exist as service functions; no scheduler found in the app [A, no cron/worker in repo, so presumably triggered externally or via endpoints] |
| Dependencies | `pytest` is a runtime dependency; `psycopg2-binary` and `asyncpg` both present; `uvicorn` run single-process |
| Docs | README references missing docs and compose files |

## 8. Checks executed and results

Environment: Windows 11. On PATH: `node`, `npm`. **Not available:** `uv`, `python` (used `app/api/.venv/Scripts/python.exe`, Python 3.12 venv), `flutter`, `cargo`, `docker`. So Flutter analyze/test, Rust/Tauri build, Docker build, and `uv sync --locked` were **not run**.

| # | Command (cwd) | Result |
|---|---|---|
| 1 | `.venv/Scripts/python.exe -m pytest -q -x` (`app/api`) | Stopped at first failure: 11 passed, 1 failed |
| 2 | `.venv/Scripts/python.exe -m pytest -q` (`app/api`) | **67 passed, 2 failed** in 23.8s. Uses in-memory SQLite; `repsi.db` mtime unchanged |
| 2a | Failure: `tests/test_crm_and_website.py::test_razorpay_and_crm_and_website_builder` | `NameError: order_data` — test is broken (references a variable from removed Cashfree-success code; the preceding assertion expects 503) |
| 2b | Failure: `tests/test_trial_system.py::test_trial_lifecycle_reconciliation_and_reminders` | Reproduces in isolation. Real off-by-one in `send_trial_reminders` (§4 P1) |
| 3 | `node_modules/.bin/tsc --noEmit` (`app/web`) | **Exit 0**, no errors |
| 4 | `node_modules/.bin/eslint .` (`app/web`) | **7 errors, 1,003 warnings.** Errors: `components/marketing/flex-carousel-features.tsx` (1, `react-hooks/immutability`), `scripts/generate-icons.js` (3) and `scripts/generate-og.js` (3) (`no-require-imports`) |
| 5 | `node_modules/.bin/next build` (`app/web`) | **Exit 0**, compiled in 4.6s, 139 route lines listed; warning: `middleware` convention deprecated |
| 6 | RBAC/registration PoC (scratchpad script, in-memory DB) | Confirmed P0-1/2/3/5 (see §4) |
| 7 | Read-only inspection with Read/Grep/`git ls-files`, `cat` | Source for all code-level findings |

Not run: `npm audit` / `pip-audit` (no dependency-vulnerability data collected), any dev server, any browser test, any Postgres run, any destructive command, any deployment.

## 9. Prioritized improvements

**P0 — fix before any real customer traffic**
1. Central `require_roles()` dependency; apply to every router; add negative RBAC tests per role per endpoint (P0-1).
2. Remove or gate `POST /auth/register` (keep OTP flow only) (P0-2).
3. Replace open `register/member` with invitation/approval or Member-record match (P0-3).
4. Rotate/disable seeded credentials on every deployed environment; make `seed` refuse `ENVIRONMENT=production`, require passwords from env; guard `reset_db.py` (P0-4).
5. Implement real password reset (token table, expiry, single use, email, rate limit); make `forgot-password` non-enumerating (P0-5).
6. Make deploy real: add `.dockerignore`, production compose (or documented manual procedure), remove `alembic` step or adopt Alembic, non-root user, healthcheck, persistent volume for `private_storage` (P0-6).

**P1 — high**
7. Verify Google ID tokens (audience + `email_verified`) with `google-auth`.
8. Remove phone-as-password login; use invite/set-password flow.
9. Rate limiting + lockout (login, OTP, availability, public lead).
10. Make `check-availability` side-effect free.
11. Session hardening: HttpOnly Secure cookie or short-lived access + refresh, server-side revocation, logout that works, password policy.
12. Fix the public website GET mutation; add spam control on lead POST.
13. Unify API base URL config; drop `http://` rewrite; make proxy not forge origin/not wildcard CORS and not default to prod.
14. Add `tsc` + `lint` + audit steps to CI; fix the 7 lint errors; fix the 2 failing tests.
15. Release keystore signing required in release workflow; Tauri CSP.

**P2 — medium**
16. Adopt Alembic with a baseline migration; stop swallowing startup migration errors.
17. Real `/health` (DB ping) and `/ready`; structured logging, error tracking, request IDs.
18. Fix trial reminder math (ceil / explicit thresholds).
19. FKs on `workspace_id`, plan-limit checks under transaction/lock, decide entitlement coverage.
20. Replace stub reports with real queries or hide the page.
21. Web tests (Playwright smoke for login, member portal block, payment flow).

**P3 — low**
22. Split `lib/api.ts` by domain; split 1,000+ line routers/services/pages; delete dead mock data and duplicate components.
23. Reduce `any` warnings; image optimization; Next `middleware`→`proxy`.
24. Move `pytest` to dev dependencies; drop unused `asyncpg`/`psycopg2` duplication; async or threadpool for outbound HTTP.
25. Fix README (missing docs/compose), remove tracked `app/mobile/assets/.env` in favor of `--dart-define`.

## 10. Phased roadmap (non-disruptive)

- **Phase 0 (days 1–3): containment.** Rotate/disable seeded accounts in prod; disable `/auth/register` and `register/member` (or feature-flag) at the API; verify what is in prod DB (any unexpected USER members/websites). No schema change.
- **Phase 1 (week 1–2): authorization and auth.** `require_roles`, negative tests, password reset, Google verification, rate limiting. Each as its own small PR with tests first (add the failing RBAC test, then fix).
- **Phase 2 (week 2–3): ship pipeline.** `.dockerignore`, prod compose, backups for DB and `private_storage`, healthcheck, CI gates (lint, tsc, audit), fix failing tests, signed releases.
- **Phase 3 (week 4–6): data and observability.** Alembic baseline, FKs, logging/error tracking, real health checks, session hardening.
- **Phase 4 (ongoing): quality.** Web e2e tests, code splitting of large modules, perf measurement, accessibility pass, mobile device test matrix.

## 11. Corrections to the existing `reports/PRODUCTION_READINESS_REPORT.md`

Checked against this audit:
- Says ESLint "0 errors" → measured **7 errors** now.
- Says "71 tests … thoroughly tested" and rates tenant isolation "strict" → measured 69 tests, **2 failing**; role authorization gaps (P0-1) are not mentioned.
- Describes a `/superadmin/impersonate` endpoint; no such route exists in `superadmin.py` [V]. Its other endpoint tables were not individually re-verified here, and it rates the verdict "CONDITIONAL GO". Based on P0-1..3, **this audit does not support a Go** for public launch until Phases 0–1 are done.
- Correctly identifies broken `deploy.yml`, stubbed password reset, Tauri CSP, static `/health`.
- Its claimed fix (production `SECRET_KEY` validator) is present in `config.py` [V]. Note it only trips when `ENVIRONMENT=production`; any other value (e.g. `prod`, `staging`) skips it [V].

## 12. Recommended folder structure (only where justified)

No framework changes or rewrite. Targeted changes only:

```
app/api/app/
  core/            (unchanged)
  deps/            NEW: auth.py → get_current_tenant, require_roles, require_feature (consolidate middleware/*)
  api/v1/          keep; split superadmin.py into superadmin/{workspaces,users,subscriptions,audit}.py
  services/        keep
app/api/migrations/  NEW (Alembic) — replaces core/migrations.py over time
docs/              ENGINEERING_AUDIT.md (this file), architecture.md (referenced by README), runbook.md
docker/ + docker-compose.production.yml   NEW, referenced already by deploy.yml
app/web/lib/api/   split api.ts → api/{client,auth,members,billing,...}.ts (pure mechanical move)
```

Justification: `deps/` is the minimum change that removes the root cause of P0-1; Alembic and the compose files are already assumed by existing workflows; splitting `api.ts` is mechanical and lowers merge risk.

---

## 13. Open questions for the owner

1. Has `seed.py` or `reset_db.py` ever been run against production? Which accounts exist there?
2. Are there paying customers or real member data live right now? (Determines whether Phase 0 is an emergency.)
3. Is `main` or `master` the production branch? (`deploy.yml` triggers on both; local branch is `master`, README/PR base says `main`.)
4. Is self-service member sign-up into a gym intended? If so, what approval model?
5. How is the production API hosted (VPS + Docker, or `fastapicloud.dev`)? The repo references both `api.repsi.app` and `repsi.fastapicloud.dev`.
6. Which features are meant to be plan-gated server-side?
7. Where are DB and `private_storage` backed up, and is production Postgres or SQLite?
8. Who sends reminder/auto-checkout jobs (cron, external scheduler)?
