---
name: repsi-testing
description: Write and maintain REPSI tests — pytest unit/integration tests for FastAPI endpoints (auth, tenant isolation, role-based access, lifecycle, payments) and Playwright end-to-end tests for app/web. Use when fixing a bug (reproduce it in a failing test first), adding an endpoint or screen, or when asked to add, extend or debug tests. For running the full checks and reporting, use repsi-verify.
---

# REPSI testing

Authored for this project. "Test Skill" did not identify one verifiable upstream package, so no third-party testing
skill was installed. This skill uses the frameworks already in the repo: pytest (API) and Playwright (web e2e).

## Bugs: reproduce first

1. Write the smallest failing test that shows the bug (API: `app/api/tests/test_<area>.py`; UI: `app/web/e2e/`).
2. Run it and confirm it fails for the reason you expect. Paste the failing line.
3. Fix the code, rerun the test, then the area's test file, then the full suite.

## API tests (pytest, `app/api/tests`)

- `conftest.py` forces in-memory SQLite, `ENVIRONMENT=test`, test OTP `123456`, and blanks provider keys. Never
  bypass it or point tests at a real database or provider.
- Use `TestClient(app)` and the helpers in `conftest.py` (`give_active_membership`, …). Create data through the API
  where practical so the test covers validation and permissions.
- Every new endpoint gets:
  - happy path with response shape;
  - **tenant isolation**: a second workspace's token gets 403/404 and never sees the first workspace's rows;
  - **role checks**: each denied role (USER/member, TRAINER, STAFF as relevant) gets 403; allowed roles succeed;
  - validation errors (422) and not-found (404);
  - history: lifecycle/payment changes append records, they don't overwrite.
- Mock external HTTP at the boundary (`httpx`/provider client). Assert `skipped_not_configured` when credentials
  are absent; never assert a fake provider success.
- Run: `cd app/api && .venv/Scripts/python.exe -m pytest tests/test_<area>.py -q -p no:cacheprovider`.

## Web end-to-end tests (Playwright, `app/web/e2e`)

- Config: `app/web/playwright.config.ts`. It starts a **scratch** API (SQLite file under `app/web/e2e/.tmp`,
  `ENVIRONMENT=development`, `OTP_PROVIDER=test`, empty provider keys) and `next dev`, and seeds isolated accounts
  with `app/api/scripts/e2e_seed.py`. The seed refuses to run against anything but a SQLite file.
- Credentials for seeded accounts are random per run and written to `app/web/e2e/.tmp/accounts.json` (gitignored).
  Never put real or production credentials in tests, fixtures or logs.
- Prefer role/label locators (`getByRole`, `getByLabel`) over CSS. Assert API-backed results, not just toasts.
- Cover each role's allowed and denied routes, and a mobile viewport project for navigation.
- Run: `cd app/web && npx playwright test` (one file: `npx playwright test e2e/auth.spec.ts`;
  debug: `--headed`, `--trace on`; report: `npx playwright show-report`).
- For exploratory checks use the `playwright-cli` skill (`npx playwright-cli open http://localhost:3000`).

## Reporting

Only call a test passing after you ran it and saw it pass. Report command, counts, and failing test names; keep
pre-existing failures separate from new ones. Don't skip, xfail or delete tests to get green.
