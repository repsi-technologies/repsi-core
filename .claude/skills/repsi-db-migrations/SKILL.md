---
name: repsi-db-migrations
description: Make REPSI database schema changes safely — new tables, columns, indexes, constraints or enum values in app/api models. Use whenever a SQLAlchemy model in app/api/app/models changes.
paths:
  - "app/api/app/models/**"
  - "app/api/app/core/migrations.py"
---

# REPSI schema changes

## How migrations work here

There is **no Alembic history** (alembic is a dependency but unused). On startup `app/api/app/core/migrations.py::run_database_migrations` runs `Base.metadata.create_all` (creates missing tables) and then idempotent, additive `ALTER TABLE ... ADD COLUMN` blocks guarded by `inspector.get_columns`. Tests build the schema with `create_all` on in-memory SQLite (`tests/conftest.py`). Production is PostgreSQL.

## Workflow

1. New table: add the model (with `TimestampMixin`, `TenantMixin` for tenant data, `generate_uuid` ids), import it in `app/api/app/models/__init__.py` so `create_all` sees it. No ALTER needed.
2. New column on an existing table: add it to the model **and** add an entry to the matching block in `migrations.py` (create the block if the table has none). New columns must be nullable or have a server-safe default so existing rows remain valid.
3. Enum changes: SQLAlchemy `Enum` on Postgres creates a native type. Prefer `String` columns with Python-side validation for new status fields; if extending an existing native enum, add a guarded `ALTER TYPE ... ADD VALUE IF NOT EXISTS` for Postgres only.
4. Indexes/uniques: add `Index`/`UniqueConstraint` in `__table_args__`; for existing tables also add a guarded `CREATE INDEX IF NOT EXISTS` in `migrations.py`. Check for existing duplicate data before adding a unique constraint.
5. Backfills: idempotent `UPDATE ... WHERE new_col IS NULL`, in the same migration block, wrapped in try/except with logging like the existing ones.
6. Verify: run the full API test suite, and start the app once against a copy of an existing SQLite DB (never the developer's real `repsi.db` without asking) to confirm the migration applies twice without error.

## Required checks

- Migration is idempotent (safe to run on every boot).
- Works on SQLite and PostgreSQL syntax (avoid `JSONB` on SQLite — follow the existing dialect switch).
- Existing API responses unchanged unless intentionally extended.

## Restrictions

- No `DROP TABLE`, `DROP COLUMN`, column type narrowing, or data deletion without explicit user approval.
- Don't run `app/core/reset_db.py` or delete `repsi.db` / `private_storage` without asking.
- Don't introduce Alembic in passing; that's a separate, planned change.
