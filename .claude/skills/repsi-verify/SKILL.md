---
name: repsi-verify
description: Run REPSI's real verification steps — API pytest suite, web lint, TypeScript check and production build — and report results honestly. Use after any code change in app/api or app/web, before saying work is done, or when asked to test, lint, type-check or build.
argument-hint: "[api|web|all]"
---

# REPSI verification

Run what applies to the changed area (`$ARGUMENTS`: `api`, `web`, or `all`; default: whatever changed).

## API (`app/api`)

```bash
cd app/api && .venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
```
(`uv run pytest -q` where `uv` is installed; on Linux/macOS `.venv/bin/python`.)
Run focused files first (`pytest tests/test_x.py -q`), then the full suite.

## Web (`app/web`)

```bash
cd app/web && npx eslint <changed files>
cd app/web && npx tsc --noEmit
cd app/web && npm run build
```
There is no frontend unit-test runner configured; don't claim frontend tests ran. Visual checks require a running dev server.

## Reporting rules

- Report the actual command and its pass/fail counts. Quote failing test names and the key error line.
- Separate pre-existing failures from new ones. Establish the baseline by running the suite before you edit; don't `git stash` the user's work to find out.
- Fix regressions you introduced. Don't skip, xfail, or delete tests to get green.
- If a step can't run (missing tool, no network, no DB), say so explicitly.

## Restrictions

- Never run against production databases or with real provider credentials.
- Don't run `app/core/reset_db.py`, seed scripts, or `git clean/reset` without asking.
