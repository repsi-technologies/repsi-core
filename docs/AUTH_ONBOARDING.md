# Authentication, WhatsApp OTP, Onboarding & Organization Management

Status as of 2026-10-21. Covers the FastAPI backend (`app/api`) and the Next.js web app (`app/web`).
The Flutter mobile app and Tauri desktop shell were not changed.

## 1. Architecture (as found, and what changed)

| Layer | Before | Now |
|---|---|---|
| Identity | `users` row per email; Google login matched by email from an **unverified** access token; owner-created Member rows could be claimed with "password = phone number" | One canonical `User`. Emails normalized. Google identities stored in `auth_identities` (keyed by Google `sub`). Phone becomes an identity only after OTP verification (`users.phone_e164`). Member/Trainer rows attach only via a **verified** email or phone |
| Sessions | Each endpoint built its own token/role; frontend guessed the next page | Every sign-in method ends in `AuthService.issue_session()` which returns the token plus `next_path` / `onboarding_required` computed from real memberships |
| Onboarding | 1,900-line client wizard; data kept in `localStorage` (including the password); `/workspaces/onboarding/complete` ignored most fields and errors were swallowed | Server-driven 5-step flow (`/onboarding/*`). Each step writes real columns; resume after refresh/logout; duplicate-proof |
| Business settings | Hard-coded settings form | `workspaces` is the single source of truth (address, timezone, currency, locale, opening hours, holidays) |
| Branches | `gym_locations` (attendance only, auto-seeded "Main Headquarters") | `gym_locations` extended into branches (address, contact, hours, primary flag) + `branch_assignments` for per-member branch access |
| Invitations | Any member could invite; accepting **overwrote an existing account's password**; no list/revoke/resend; `/invite` route required login | Role-gated, branch-aware, list/revoke/resend, secure acceptance that never overwrites passwords |

## 2. Files and modules

**Backend (`app/api`)**
- `app/core/config.py` – OTP/AiSensy/Google settings; production refuses `OTP_PROVIDER=test`.
- `app/core/phone.py` (new) – E.164 normalization and per-country validation (`phonenumbers`).
- `app/core/rate_limit.py` (new) – in-process sliding-window limiter for auth endpoints.
- `app/core/email.py` – role labels; dev-only console output; production never logs links/tokens.
- `app/core/migrations.py` – additive migration for all new columns/tables/indexes + backfills.
- `app/models/auth.py` – `AuthIdentity`, `PhoneOtpChallenge`, `PasswordResetToken`.
- `app/models/user.py` – `User.phone_e164/phone_verified/email_verified`; Workspace address/region/hours fields.
- `app/models/attendance.py` – branch fields on `GymLocation`, new `BranchAssignment`.
- `app/models/invitation.py` – `staff/manager/admin` roles, `branch_ids`, `accepted_user_id`.
- `app/services/otp.py` (new) – `OtpProvider` boundary, `TestOtpProvider`, `AiSensyOtpProvider`, `PhoneOtpService`.
- `app/services/auth.py` – rewritten around canonical identity resolution.
- `app/services/organization.py` (new) – profile, preferences, logo, branches, team access, onboarding.
- `app/api/v1/auth.py` – OTP, signup, session, identities, password reset/change, safe availability check.
- `app/api/v1/organization.py` (new) – `/onboarding`, `/organization`, `/branches`, `/team` routers.
- `app/api/v1/invitations.py` – rewritten.
- `app/api/v1/workspaces.py`, `app/api/v1/attendance.py` – role checks; branch-filtered locations.
- `app/middleware/tenant.py` – `get_current_user`, `require_roles`.
- `tests/test_identity_onboarding.py` (new, 23 tests), `tests/conftest.py` (isolated env).

**Web (`app/web`)**
- `lib/auth-client.ts` (new) – typed API client, error parsing, `applySession`, safe redirects.
- `lib/countries.ts` (new) – all countries/calling codes (libphonenumber-js), validation, region defaults.
- `components/ui/country-select.tsx` (new), `components/ui/phone-input.tsx` (rewritten, same props).
- `components/auth/otp-verification.tsx` (new) – 6-box input, paste, countdown, resend, errors.
- `components/organization/*` (new) – form primitives, business profile + logo, hours/holidays, branches, team & invitations.
- `app/(auth)/login`, `signup`, `forgot-password`, `reset-password`, `invite/accept` – rewritten against real endpoints.
- `app/onboarding/page.tsx` – new wizard; old `/onboarding/*` sub-routes redirect to it.
- `app/(workspace)/[workspace]/settings/page.tsx` + `features/settings/organization-settings.tsx` – real Business Profile, Hours & Preferences, Branches, Team & Access, My Profile & Sign-in tabs (mock "General"/"Team" data and placeholder tabs removed).
- `components/layout/auth-guard.tsx`, `components/providers/auth-provider.tsx`, `lib/auth.ts` – onboarding redirect, `/invite` public, no `apex-fitness` fallbacks.
- `app/api/v1/[...path]/route.ts` – in development the proxy now defaults to `http://127.0.0.1:8000` instead of production.

Dependencies added: `phonenumbers`, `tzdata` (API, `pyproject.toml`); `libphonenumber-js@1.13.14` (web). **`uv.lock` was not regenerated** (uv isn't installed here) — run `uv lock` before relying on `uv sync --locked`.

## 3. Database changes

All applied by `run_database_migrations()` at API startup; additive only, idempotent.

- New tables: `auth_identities`, `phone_otp_challenges`, `password_reset_tokens`, `branch_assignments`.
- `users`: `phone_e164` (unique index `uq_users_phone_e164`), `phone_verified`, `email_verified`.
- `workspaces`: `address_line2, state, postal_code, country_code, timezone, currency, locale, opening_hours, closed_dates`.
- `gym_locations`: `address_line2, city, state, postal_code, country_code, phone, email, timezone, opening_hours, is_primary`; unique `(workspace_id, code)` (created only if existing data allows).
- `gym_invitations`: `branch_ids`, `accepted_user_id`. Postgres: `invitationrole` enum gains `STAFF, MANAGER, ADMIN` (`ALTER TYPE … ADD VALUE` needs PostgreSQL 12+ inside a transaction).
- Backfills: emails lower-cased when no collision; `email_verified=TRUE` for users that already belong to a workspace (they were admitted by the previous email-based flows) and superadmins; existing `MAIN` locations become primary; **on the first run only**, every existing workspace is marked `onboarding_completed=TRUE` so existing organizations are never pushed back into onboarding.

Verified against a database built from the old (`HEAD`) schema with seeded rows: data preserved, owner verified, orphan account left unverified, workspace not re-onboarded, session routes to its dashboard. Not run against PostgreSQL.

## 4. Environment variables

API (`app/api/.env`):

| Variable | Dev / test | Production |
|---|---|---|
| `ENVIRONMENT` | `development` | `production` |
| `OTP_PROVIDER` | `test` | `aisensy` (startup fails if `test`) |
| `OTP_TEST_CODE` | `123456` (default) | ignored |
| `PHONE_OTP_EXPIRE_MINUTES` / `PHONE_OTP_RESEND_COOLDOWN_SECONDS` / `PHONE_OTP_MAX_SENDS_PER_HOUR` / `PHONE_OTP_MAX_ATTEMPTS` | 5 / 30 / 5 / 5 | tune as needed |
| `AISENSY_API_KEY`, `AISENSY_CAMPAIGN_NAME` | – | required |
| `AISENSY_API_URL` | – | default `https://backend.aisensy.com/campaign/t1/api/v2` |
| `AISENSY_SOURCE`, `AISENSY_TIMEOUT_SECONDS` | optional | optional |
| `GOOGLE_CLIENT_ID` | optional (unset = audience not checked, logged warning) | **required** (same value as web `NEXT_PUBLIC_GOOGLE_CLIENT_ID`) |
| `PASSWORD_RESET_EXPIRE_MINUTES` | 30 | 30 |
| `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` | empty = emails printed to the console | required for invitations and password reset |
| `SECRET_KEY`, `FRONTEND_URL`, `DATABASE_URL` | as before | as before |

Web (`app/web/.env`): `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_API_URL` (non-localhost hosts), `REMOTE_API_URL` (proxy target; dev default `http://127.0.0.1:8000/api/v1`).

## 5. AiSensy status

Implemented: `AiSensyOtpProvider` posts `{apiKey, campaignName, destination (E.164 without "+"), userName, source, templateParams: [code], buttons: [copy-code URL button param = code]}` to `AISENSY_API_URL`. Codes are random, stored only as HMAC-SHA256, never logged; delivery failures roll back the challenge and return a generic 503. Unit-tested with a mocked HTTP layer only — **no real message has been sent**.

Still needed from you: the AiSensy API key, the API campaign name bound to an **approved WhatsApp authentication template**, and confirmation from AiSensy's docs that the payload shape (especially `buttons` for the copy-code button and `userName`) matches your template. If your template has no button, remove `buttons` in `app/services/otp.py`.

## 6. Authentication & account-linking behavior

- **Password** sign-in accepts email (case-insensitive) or phone; accounts without a password (Google-only) can't use it until they set one (Profile or "Forgot password").
- **Google**: token validated server-side via Google `tokeninfo` with audience check. Known `sub` → that user. New `sub` + Google-verified email:
  - no account → new account (`email_verified=true`), then onboarding;
  - account with verified email → Google linked to it;
  - account with **unverified** email → 409; the person signs in another way and connects Google from *Settings → My Profile & Sign-in* (requires the same email).
- **WhatsApp OTP**: verified number with an account → signed in; otherwise a 20-minute signed sign-up ticket finishes registration. A ticket can't attach to an email that already has an account.
- **Password reset** proves email ownership and marks the email verified.
- **Invitations** never overwrite passwords: an existing account must sign in (any method) to accept; a signed-in user can accept only an invitation addressed to their email or verified phone.
- Roles are only upgraded by linking/invitations, never downgraded.

## 7. Onboarding & organization management

Wizard steps: Business (name, URL, logo, type, size, email, phone, full address) → Hours & region (timezone, currency, locale, weekly hours, holidays) → Branches (primary branch auto-created; add/edit/deactivate; per-branch hours) → Team (invite with role + branch access; resend/cancel) → Launch (review + 14-day trial). Progress lives on the server; refresh, back-navigation and sign-out/in resume at the right step; repeated saves update the same organization.

Settings tabs: Business Profile, Hours & Preferences, Branches, Team & Access (roles, branch assignment, deactivate), My Profile & Sign-in (name, linked methods, add/verify phone, set/change password). Owners/admins edit; managers see team/invitations; others read-only. All enforced on the backend.

## 8. Tests and results

| Check | Result |
|---|---|
| `pytest` (app/api) | **91 passed, 1 failed** — the failure (`test_crm_and_website.py`, `NameError: order_data`) is pre-existing and unrelated. `test_trial_system` is time-dependent and flakes on the original code too |
| New `tests/test_identity_onboarding.py` | 23/23 pass: test OTP, wrong code, attempt lockout, single use, expiry, resend cooldown, hourly cap, per-country validation, AiSensy payload/failure, prod guard, Google→password, password→Google, unverified-email linking, wrong Google audience, duplicates, password reset, onboarding resume/no-duplicates/validation, full onboarding + settings persistence + logo upload/retrieval/forged file, branch limits, invitations + branch access + permissions, existing-account acceptance, revoked/expired, cross-organization isolation |
| Old-schema migration | Pass (see §3) |
| `tsc --noEmit` (web) | Pass |
| `eslint` on changed web files | 0 errors |
| `next build` | Pass |
| Browser (local API on scratch DB) | Signup with country search + phone validation → wrong OTP rejected → `123456` → onboarding → refresh resumes → hours validation → holiday → primary branch → plan limit on second branch (402) → invite trainer with branch → launch → settings show saved values → invitation accepted by new user → trainer dashboard → WhatsApp login for unregistered number continues sign-up and can't claim an existing email → WhatsApp and password sign-in reach the same user id. No horizontal scroll at 375 px on settings tabs |

Not tested: real Google OAuth popup (needs a client ID and Google account), real AiSensy delivery, real SMTP, PostgreSQL migrations, Flutter app, keyboard-only walkthrough with a screen reader.

## 9. Known issues and remaining work

- **Secrets**: `app/api/.env.example` (tracked) currently contains SMTP credentials added outside this work — rotate them and remove them from the file. `app/api/.env` now points at a production-like environment; running the API locally with it will run these migrations against that database.
- JWTs remain 7-day and non-revocable; password reset/deactivation does not end existing sessions.
- Rate limits for IPs are per-process (move to Redis for multiple workers); per-phone OTP limits are in the database.
- Branch access is enforced for branch listing/management and attendance locations; members, payments and most reports are not yet partitioned by branch (no `branch_id` on those tables).
- Legacy endpoints `/auth/register` and `/auth/register/member` (used by the mobile app) still create accounts without email verification; such accounts are created unverified and are never auto-linked. Moving mobile to the OTP flow is recommended.
- Membership-plan creation was dropped from onboarding (the old wizard never saved it); plans are created from *Memberships*.
- Many other routers still lack role checks (see `docs/ENGINEERING_AUDIT.md` P0-1).
- Windows browsers render country flags as letters ("IN"); other platforms show emoji flags.
- `uv.lock` needs regenerating for the two new Python dependencies.

## 10. Run and verify locally

```bash
cd app/api
.venv/Scripts/python -m pip install phonenumbers tzdata   # or: uv lock && uv sync
ENVIRONMENT=development OTP_PROVIDER=test DATABASE_URL=sqlite:///./local.db \
  .venv/Scripts/python -m uvicorn app.main:app --port 8000
```

```bash
cd app/web
REMOTE_API_URL=http://127.0.0.1:8000/api/v1 npm run dev
```

Then open `http://localhost:3000/signup`, use any valid mobile number and code **123456**, complete onboarding, invite someone (the invite link prints in the API console when SMTP isn't configured), and accept it in a private window. Run the tests with `cd app/api && .venv/Scripts/python -m pytest -q`.
