---
name: repsi-tenant-access-control
description: Enforce REPSI multi-tenant isolation and role-based access on FastAPI endpoints. Use when adding or changing any API route, repository query, role/permission check, workspace switching, member self-service access, or when reviewing code for IDOR / cross-tenant data leaks.
paths:
  - "app/api/**"
---

# REPSI tenant isolation and access control

## How tenancy works here (verify before relying on it)

- `app/api/app/middleware/tenant.py`: `get_current_tenant` resolves `TenantContext(workspace_id, user_id, role)` from the JWT and verifies an active `WorkspaceMember` row. `X-Workspace-ID` is honoured only after that membership check (and freely for `SUPER_ADMIN`).
- `require_roles(*roles)` and the `ORG_ADMIN_ROLES` / `BRANCH_MANAGER_ROLES` tuples gate by role.
- Roles (`app/models/user.py::UserRole`): `SUPER_ADMIN, OWNER, ADMIN, MANAGER, TRAINER, STAFF, USER`. `USER` = gym member.
- Tenant tables use `TenantMixin` (`workspace_id`). `BaseTenantRepository` scopes every query.
- Feature gating: `app/middleware/entitlements.py` (`require_feature`, `check_member_capacity`).

## Workflow

1. Read the router file and the tenant/entitlement dependencies it already uses. Reuse them; do not write a new auth helper if `require_roles` fits.
2. Pick the narrowest role set for the operation. Defaults:
   - Read member directory / details: OWNER, ADMIN, MANAGER, STAFF (TRAINER only for assigned members when the endpoint supports it).
   - Mutate members, memberships, payments: OWNER, ADMIN, MANAGER, STAFF.
   - Plans, pricing, coupons, business settings, exports, deletes, refunds: OWNER, ADMIN (MANAGER only if the existing code already allows it).
   - Internal notes, documents, audit history: staff roles only — never `USER`.
   - Self-service (`/me/...`): `USER`, resolved via `Member.user_id == tenant.user_id` in `tenant.workspace_id`.
3. Every lookup by id filters by `workspace_id == tenant.workspace_id` too. Return 404 (not 403) for ids from another tenant so existence isn't leaked.
4. Never accept `workspace_id`, `member_id` ownership, `role`, price or status-of-payment from the client as truth.
5. Child records (memberships, payments, notes, documents) are checked against both the tenant and the parent id in the path.
6. Response schemas: staff-only fields (notes, internal flags, audit) never appear in member-facing schemas.
7. Record sensitive admin actions (status changes, exports, deletes, refunds, role changes) in the existing audit/event tables.

## Required tests (pytest, `app/api/tests/`)

For each new or changed endpoint add cases for:
- unauthenticated → 401
- wrong role (at least `USER` and, where relevant, `TRAINER`) → 403
- other tenant's id → 404, and list endpoints never include other tenants' rows
- member self-service can only see its own record

Follow the fixtures/patterns in `tests/test_multi_tenancy.py` and `tests/test_full_e2e_isolation.py`.

## Restrictions

- Do not loosen an existing role check to make a test or UI pass.
- Do not trust frontend route guards (`components/layout/auth-guard.tsx`) as authorization.
- Do not add `SUPER_ADMIN` bypasses beyond what `get_current_tenant` already provides.
- Do not log tokens, OTPs, passwords or full documents.
