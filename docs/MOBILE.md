# REPSI Mobile (Flutter) — status, setup, release

Scope of this document: the member-facing Android release. Everything below was checked against the code
on 2026-10-23/24; "verified" means a command was run and its result is quoted in the testing section.

## 1. Feature inventory (member app)

| Area | Status | Notes |
|---|---|---|
| Email / phone + password sign-in | Implemented, verified by unit tests (token handling) | `POST /auth/login`. Session restore on cold start. |
| Session renewal | Implemented, unit-tested | 401 → single shared `POST /auth/refresh` → retry once. Rejected refresh → local sign-out. Network failure during refresh keeps the user signed in. |
| Google sign-in | Implemented, **blocked on external setup** | Needs an Android OAuth client in Google Cloud (package `app.repsi.mobile` + signing SHA-1) and its client ID in the API's `GOOGLE_MOBILE_CLIENT_IDS`. Not testable here. |
| Sign out / expired session | Implemented | Clears secure storage and every cached per-user provider (`resetSessionProviders`). |
| Change password | Implemented | `PUT /auth/me/password`; other devices are signed out by the API. |
| Delete account | Implemented (new API `DELETE /auth/me`) | Required by Play. Gym owners are refused until they close/hand over the gym on the web. Gym keeps its member/payment/attendance records, unlinked from the login. |
| Member attendance (QR) | Implemented, **needs on-device test** | Scan the gym entrance QR → `POST /attendance/check-in` (server validates membership, QR rotation, duplicates). Check-out, status, streak and history from `GET /attendance/member/me`. |
| Member pass for the front desk | Implemented, needs device test | `GET /attendance/member/me/pass` (short-lived signed token), auto-renewed before expiry. |
| Staff/owner pass scanner | Implemented, needs device test | Scans a member pass → `POST /attendance/scan-qr`. |
| Health Connect (Google Fit data) | Implemented, **needs on-device test** | Read-only steps, distance, active calories. Daily totals uploaded to the new `PUT /health/daily`; member can disconnect, which deletes the stored data. |
| Notifications inbox | Existing screens, API-backed | Push (FCM) is **not** implemented. |
| Payments list | Existing screen, API-backed | |
| AI workout coach | Existing screens, API-backed | |
| Fitness goal + suggested workouts (2026-10-25) | Implemented, widget/API-tested | First sign-in asks once for goal, level, days/week, session length and focus areas (`features/coaching/views/goal_setup_view.dart`). `PUT /coaching/me/goal` appends (history kept). `GET /coaching/me/suggestions` builds a weekly split from the global exercise library (`app/services/coaching.py`). Shown as the member **Workouts** tab and a home hero card. |
| Guided workout runner | Implemented, widget-tested | Set-by-set with countdown ring for timed sets and rest. Runs on the phone only: **sessions are not saved to the server** (logging needs a workout assignment; see `/fitness/sessions`). |
| My trainer, trainer/PT requests | Implemented, API-tested | Member sees assigned trainer(s) and messages them; can request a trainer or personal training, optionally naming one (`POST /coaching/requests`, one pending at a time, cancellable). Owner/manager (`trainers.assign`) approves by picking a trainer, which creates the normal `TrainerClient` assignment, or declines with a note. In-app notifications both ways. |
| Trainer ⇄ member chat | Implemented | `/chat/*`. Polls every 8 s while a thread is open (no push yet). |
| Trainer shell | Real data | Home (today's sessions, clients, unread), Clients, Schedule (`/trainers/me/schedule`), Messages, More. The old sample "Plans" tab (`trainer_create_workout_view.dart`) is no longer reachable. |
| Owner shell | Partly audited | More → Trainer requests (pending badge) and Appearance added. Dashboard/finance/front desk not re-audited. |
| Classes, Progress, Membership detail, Documents, Exercise library, Running tracker | **Hidden from member navigation** | Still sample content; re-enable each when it reads real data. |
| Theme | Light / dark / follow phone (default) | Screens read `context.palette` (`app/theme/repsi_palette.dart`) so dark mode no longer shows light-only colours. |
| Localisation | en (stable), ta / ml / hi (**Beta**) | ARB catalogues in `lib/l10n`. Non-English languages are labelled Beta in the picker: they are drafts awaiting native-speaker review. Overflow tests at 320/412 px in en/ta/ml, light and dark (`test/coaching_screens_test.dart`). |
| iOS | Not done | Only `NSCameraUsageDescription` was added; Health Connect is Android-only. |

### Why Health Connect and not "Google Fit"
Google's Fit APIs are deprecated for new apps. Google Fit and most fitness apps write into Health Connect, so
reading Health Connect covers Google Fit data. Requires Android 9+ (API 26+); on Android 13 and below the user
installs the Health Connect app (the screen links to it).

## 2. Architecture notes

- Feature-first under `lib/features`, Riverpod state, `go_router`, Dio. The backend owns business rules.
- `core/api/api_interceptors.dart` — bearer header + single-flight refresh. `core/providers/session_reset.dart` —
  list of keep-alive providers to drop on sign-out; add new tenant-data providers there.
- One `GoRouter` for the app lifetime driven by `refreshListenable` (previously it was rebuilt on every auth change,
  resetting navigation and the login form on a failed sign-in).
- Tokens live in `flutter_secure_storage`; workspace and cached profile in `SharedPreferences` (loaded in `main()`).
  Android backup is disabled (`allowBackup=false`).
- Health: `features/health` — `HealthDataSource` (device, mockable) → `HealthNotifier` (consent, throttled sync,
  disconnect) → `HealthRepository` (API). Consent flag is local; data is per user on the server.
- Backend additions: `app/models/health.py`, `app/api/v1/health.py` (`PUT/GET/DELETE /health/daily`, user-scoped
  and workspace-scoped, ≤31 days per call, plausibility limits), `DELETE /auth/me`,
  `GOOGLE_MOBILE_CLIENT_IDS` (extra accepted Google audiences). New table is created by the existing
  `Base.metadata.create_all` migration step (additive).

## 3. API used by the member app

`/auth/login`, `/auth/google`, `/auth/refresh`, `/auth/me` (GET, DELETE), `/auth/me/password`, `/auth/logout`,
`/members/me`, `/attendance/check-in`, `/attendance/check-out`, `/attendance/member/me`,
`/attendance/member/me/pass`, `/attendance/scan-qr` (staff), `/health/daily`, `/payments/`, `/notifications/*`, `/ai/*`,
`/coaching/*` (goals, suggestions, trainer requests), `/chat/*`, `/trainers/me/clients`, `/trainers/me/schedule`.

## 4. Setup

```bash
cd app/mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1     # emulator → local API (debug only)
```

Run the local API with a scratch database, never the production one in `app/api/.env`:
`DATABASE_URL=sqlite:///./dev.db ENVIRONMENT=development OTP_PROVIDER=test uvicorn app.main:app`.
Release builds ignore non-HTTPS `API_BASE_URL` values.

## 5. Tests

```bash
cd app/mobile && flutter analyze && flutter test
cd app/api && .venv/Scripts/python.exe -m pytest -q
```

Note: a few backend tests compare the machine's local date with the gym's timezone and fail when run between
00:00 and ~05:30 IST on a non-UTC machine (`TZ=UTC` fixes most; `test_daily_visit_limit` also depends on being
more than ~10 minutes past midnight). They pass at other times of day.

## 6. Release (Google Play)

1. **Signing** — create an upload keystore outside the repo and an untracked `android/key.properties`
   (`storeFile`, `storePassword`, `keyAlias`, `keyPassword`), or set `KEYSTORE_PATH`, `KEYSTORE_PASSWORD`,
   `KEY_ALIAS`, `KEY_PASSWORD`. Release builds fail without a keystore unless `-PALLOW_DEBUG_SIGNING=true`
   (unpublishable).
2. **Version** — bump `version:` in `pubspec.yaml` (`1.0.1+2` today; the `+N` build number must increase per upload).
3. **Build** — `flutter build appbundle --release --dart-define=API_BASE_URL=https://api.repsi.app/api/v1`.
   R8 minification and resource shrinking are on; **run the release build on a device** before uploading, since
   keep rules for Health Connect and the scanner were written without a build.
4. **Google sign-in** — create the Android OAuth client (package + SHA-1 of the *Play app-signing* key and your
   upload key), add its client ID to the API env `GOOGLE_MOBILE_CLIENT_IDS`.
5. **Play Console declarations**
   - Data safety: account info, email/phone, health & fitness (steps, distance, calories), attendance. Encrypted in
     transit; deletion available in-app (More → Delete Account) and on the web.
   - Health Connect permission declaration for `READ_STEPS`, `READ_DISTANCE`, `READ_ACTIVE_CALORIES_BURNED`, with a
     privacy policy that names health data (check `app/web/app/(marketing)/privacy` covers it before submitting).
   - Camera permission: used only for QR check-in.
   - Provide a test account with an active membership for reviewers.
6. Assets: launcher icon via `dart run flutter_launcher_icons`; store listing graphics are not in the repo.

Nothing here has been uploaded or published.

## 7. Known issues / not verified

- **No Android SDK or device in the authoring environment**: no APK/AAB was built, and camera scanning, Health
  Connect permission/read, Google sign-in and R8 shrinking were never run on hardware or an emulator.
  Covered instead by Dart unit/widget tests with fakes (see below).
- Hidden member screens listed in §1 still hold sample data; owner/trainer/admin shells were not reviewed.
- No push notifications, no offline cache beyond the cached profile, no localisation of new screens.
- `dart format` was run once over `lib/` by mistake; unrelated files were restored from git, but
  `app_typography.dart`, `dashboard_view.dart`, `member_profile_view.dart`, `more_view.dart` and
  `repsi_app_bar.dart` (which already had uncommitted changes) kept formatter-only diffs.
- Web build and Playwright suite were not re-run (no web files changed).

## 8. Running on a phone (USB debugging)

This repo's machine has no Android SDK, so `flutter devices` lists only Windows/Chrome/Edge. To debug over USB:

1. Install Android Studio (installs the SDK + platform-tools), then `flutter config --android-sdk <path>` and
   `flutter doctor --android-licenses`.
2. On the phone: Settings → About → tap *Build number* 7× → Developer options → enable *USB debugging*; plug in and accept the prompt.
3. `flutter devices` should list the phone, then `cd app/mobile && flutter run` (uses the production API by default,
   i.e. the same database as web).

Do not test the production API from Flutter **web** in Chrome: the API's CORS list allows only the website origin,
so every request fails with "Unable to connect". A phone or emulator is not subject to CORS.
For local web debugging run the API with `BACKEND_CORS_ORIGINS=http://localhost:3000` and
`flutter run -d web-server --web-port 3000 --dart-define=API_BASE_URL=http://localhost:8000/api/v1`
(needs `flutter create . --platforms=web` first; the `web/` folder is not committed).
