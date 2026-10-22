---
name: repsi-membership-lifecycle
description: Implement or modify REPSI membership plans and the membership lifecycle — assignment, activation, expiry, renewal, extension, freeze/unfreeze, cancellation, eligibility, discounts/coupons, expiry tracking and membership history. Use for anything touching MembershipPlan, Membership, end dates, or renewal logic.
---

# REPSI membership lifecycle

## Existing implementation (read first)

- Models: `app/api/app/models/member.py` (`MembershipPlan`, `Membership`, shared `MemberStatus` enum).
- API: `app/api/app/api/v1/memberships.py` (plans CRUD, assign, expiring, check-expiries, renewal reminders) and `POST /members/{id}/renew` in `members.py`.
- Lifecycle service (if present): `app/api/app/services/membership_lifecycle.py` — extend it rather than writing transitions inside routers.
- Web: `app/web/app/(workspace)/[workspace]/memberships/**`, `features/members/renewal-alerts-card.tsx`.
- Workspace timezone: `Workspace.timezone` (IANA). Use it for "today".

## Lifecycle rules

States: `scheduled → active → expired`, `active ⇄ frozen`, `scheduled|active|frozen → cancelled`. `expired` and `cancelled` are terminal for that period; renewal creates a **new** period row.

- Every transition goes through the service, validates the current state, and appends a lifecycle event (type, from/to, actor, reason, before/after dates, JSON details).
- Never overwrite a past period's dates or price. Snapshot plan name, duration and price onto the membership at assignment so later plan edits don't change history.
- End date = start + plan duration in calendar terms (months via month arithmetic, days for day-based plans), not `months * 30`, unless the existing data contract requires otherwise — document any change.
- Renewal mode is explicit: `after_current` (start the day after current end), `immediate` (start today, current period ends), or `extend_current`. Prevent overlapping active periods unless the workspace allows it.
- Freeze: start/end dates, reason, no overlapping freezes, cap by configured allowance; on unfreeze/auto-resume, extend end date by the frozen days. Frozen members don't get active-member access.
- Extension: positive day count, reason required, staff only, recorded as an event.
- Expiry: batch job/endpoint marks `active` periods past end as `expired` idempotently. It must not change the account `Member.status` unless a configured rule says so.
- Price and discount are computed on the backend. Assignment never marks a membership paid; payment state comes from payments (`repsi-payment-workflows`).
- Eligibility checks return machine-readable reasons the UI can display.

## Workflow

1. Read the files above plus `tests/test_csv_import_and_expiries.py`, `tests/test_subscriptions.py`.
2. Write/extend the service function and its unit tests first, then the endpoint (`repsi-backend-api`), then the UI.
3. Schema changes via `repsi-db-migrations`.
4. Run `repsi-verify`.

## Required tests

Every allowed transition and at least one rejected transition per state; date math across month ends and leap years; timezone "today"; renewal modes and overlap rejection; freeze overlap/allowance and resume extension; expiry job idempotency; plan edit doesn't change existing assignments; cross-tenant 404s.

## Restrictions

- Don't add lifecycle enforcement only in React.
- Don't delete memberships to "reset" state.
- Don't silently change existing API response shapes used by `app/web` or `app/mobile`.
