---
name: repsi-backend-api
description: Conventions for building or changing REPSI FastAPI endpoints, Pydantic schemas, repositories and services in app/api — routing, validation, transactions, pagination, error responses, performance and pytest coverage.
paths:
  - "app/api/**"
---

# REPSI backend API conventions

## Layout

`app/api/app/` → `api/v1/<module>.py` (routers, registered in `api/v1/router.py`), `schemas/`, `models/`, `repositories/` (`BaseTenantRepository`), `services/` (business logic), `middleware/` (tenant, entitlements), `core/` (config, db, security, phone, email, rate limits, migrations).

## Workflow

1. Find the existing router/service for the domain and read it fully, plus its tests. Extend; don't fork a parallel module.
2. Business rules live in `services/`; routers stay thin (auth deps → validate → call service → map to schema).
3. Schemas: separate Create / Update / Response models; `ConfigDict(from_attributes=True)` for ORM responses; constrain strings, numbers and enums with Pydantic (`Field`, `Literal`). Staff-only fields get their own response model.
4. Auth: apply `repsi-tenant-access-control` on every route.
5. Transactions: one `db.commit()` per request at the end of the service operation; `flush()` for intermediate ids. Roll back on error. Don't call repository helpers that commit mid-operation when atomicity matters (`BaseTenantRepository.create/update` commit).
6. Lists: `page`, `page_size` (cap 100), whitelisted `sort` keys, filters applied before `count()`, return `{items, total, page, page_size}` like `MemberListResponse`.
7. Performance: avoid N+1 (`joinedload`/`selectinload`), index filter columns, bound exports and use streaming for large CSVs.
8. Errors: `HTTPException` with a user-readable `detail`; 404 for missing/other-tenant ids, 409 for conflicts/duplicates, 422 for validation, 403 for role.
9. Time: dates in workspace timezone (`Workspace.timezone`) for business "today"; store timestamps in UTC.
10. Tests in `app/api/tests/test_<module>.py` using `fastapi.testclient.TestClient` and the existing conftest (in-memory SQLite, overridden `get_db`). Register users/workspaces through the same helpers other tests use.

## Restrictions

- Don't change existing response field names/types consumed by `app/web/lib/api.ts` or `app/mobile/lib/core/api` without updating every caller.
- Don't add dependencies to `pyproject.toml` without a clear need and the user's OK.
- Don't hardcode prices, durations, gym names or default passwords.
