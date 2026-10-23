# REPSI

Multi-tenant gym management SaaS. Monorepo:

- `app/api` — FastAPI + SQLAlchemy 2 + Pydantic 2. SQLite in tests/dev, PostgreSQL in production.
- `app/web` — Next.js 16 (App Router) + React 19 + Tailwind 4 + Radix UI. See `app/web/AGENTS.md`: this Next.js differs from training data; read `app/web/node_modules/next/dist/docs/` before writing Next code.
- `app/mobile` (Flutter), `app/desktop` (Tauri) — consume the same API.

## Commands

- API tests: `cd app/api && .venv/Scripts/python.exe -m pytest -q` (`uv run pytest` where `uv` is on PATH)
- Web lint / types / build: `cd app/web && npx eslint . && npx tsc --noEmit && npm run build`
- Web end-to-end: `cd app/web && npx playwright test` (starts a scratch SQLite API and `next dev`; never uses `app/api/.env`'s database). Report: `npx playwright show-report`.
- Background jobs: `cd app/api && python -m scripts.run_jobs --list`; backups: `python -m scripts.backup`. See `docs/RUNBOOK_OPERATIONS.md`.
- Schema changes go through `app/api/app/core/migrations.py` (additive only; there is no Alembic history).

## Non-negotiables

- Every tenant-owned query is scoped by `workspace_id` from `TenantContext`, never from the request body. Role checks happen on the backend.
- Inspect and reuse existing models, repositories, services, `lib/api.ts` methods and `components/ui` before adding new ones. No parallel member/user identities.
- Preserve history: lifecycle, status, payment and plan changes append records; they don't overwrite them.
- Never commit secrets, log tokens/PII, fake a provider success, or claim a test passed without running it. Ask before destructive commands or data deletion.

Specialized procedures live in `.claude/skills/` (tenant access, members, memberships, payments, WhatsApp, migrations, backend APIs, dashboard UI, verification), plus testing (`repsi-testing`), browser automation (`playwright-cli`), UI review (`web-design-guidelines`), the design system (`repsi-design-system`, see `app/web/DESIGN.md`) and image-to-code (`repsi-image-to-code`). Setup and versions: `docs/CLAUDE_SKILLS.md`.
