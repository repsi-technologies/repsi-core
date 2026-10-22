---
name: repsi-member-management
description: Build or change REPSI member features — member directory, search/filter/sort/pagination, manual and signup registration, duplicate detection, member profile/details page, member status (active/inactive/suspended/archived), internal notes, interaction history, member documents, CSV import/export, and the member self-service portal.
---

# REPSI member management

## Existing implementation (read before changing)

- Model: `app/api/app/models/member.py::Member` (linked to `users` via `user_id`; workspace access via `workspace_members`).
- API: `app/api/app/api/v1/members.py` (list, get, create, update, renew, delete, CSV import/export, check-contact).
- Repository: `app/api/app/repositories/member.py::MemberRepository`.
- Schemas: `app/api/app/schemas/member.py`.
- Web: `app/web/features/members/*`, `app/web/app/(workspace)/[workspace]/members/**`, client methods in `app/web/lib/api.ts`.
- Signup/invite onboarding: `app/api/app/services/auth.py`, `app/api/app/api/v1/invitations.py`.

## Rules

- One identity: a gym member is a `Member` row (+ optional `User` + `WorkspaceMember` role `USER`). Manual registration, import, invitation and signup must all create/link the same `Member` record. Never create a second member table.
- Duplicates: within a workspace, phone (normalised E.164 via `app/core/phone.py`) and email (lower-cased) are unique among members. Check before insert, inside the same transaction.
- Account/member status and membership validity are separate. Membership expiry must not change the account status unless a configured rule says so.
- Status changes go through one service function that validates the transition, writes a history/event row (actor, reason, timestamp) and syncs `WorkspaceMember.is_active` where access must change.
- Internal notes and staff interaction history are staff-only; exclude them from member-facing schemas and `/me` endpoints.
- Documents: private storage only (see existing `private_storage` usage in manual payments), validate type and size, authorise every download.
- Import: parse → validate per row → preview → commit valid rows in a transaction; report imported / skipped / failed with row numbers. Never assign default or phone-derived passwords.
- Export: staff/owner roles only, respect current filters, exclude notes/documents unless explicitly permitted, write an audit event.
- List endpoints: server-side pagination, `total` must reflect the filters, page size capped, sort keys whitelisted.

## Workflow

1. Read the files above and the tests that cover them (`tests/test_direct_add_and_onboarding.py`, `tests/test_csv_import_and_expiries.py`, `tests/test_multi_tenancy.py`).
2. Apply `repsi-tenant-access-control` for every endpoint touched.
3. Schema changes: follow `repsi-db-migrations`.
4. Backend first, with tests; then wire the UI with `repsi-dashboard-ui`.
5. Run `repsi-verify`.

## Required tests

Creation (manual + duplicate rejection), update validation, status transitions (allowed and rejected), search/filter/sort/pagination totals, import row errors and duplicates, export role restriction, notes hidden from `USER`, cross-tenant 404s, self-service ownership.

## Restrictions

- Don't hard-delete members with financial history; prefer archive/deactivate unless the user explicitly asks.
- Don't remove existing endpoints or response fields the web/mobile apps use; add new ones alongside.
- Don't put business rules only in the frontend.
