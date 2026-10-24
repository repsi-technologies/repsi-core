"""
The sales demo gym (Workspace.is_demo, created by scripts/seed_demo.py).

Prospects share one demo login, so the demo gym is fully explorable but cannot reach the outside world
or change anything that belongs to the account itself:

- Outbound messages (email, WhatsApp, SMS, push) are recorded with status `skipped_demo` and never sent
  (communication.dispatch_queued_deliveries).
- The routes below are refused with 403 DEMO_RESTRICTED: account security, billing and plan changes,
  online payment-gateway orders and payment settings, invitations (they email real addresses), website
  publishing and domains, support tickets, team role changes, gym rename/deregister, onboarding resets
  and public image uploads.
- Password reset emails are never sent for the demo account.

Everything else (members, memberships, payments recorded by hand, attendance, classes, workouts, CRM,
reports, broadcasts) works normally on the demo gym's own data, which tenant scoping keeps apart from
every real gym.
"""
from __future__ import annotations

import re
from typing import Optional

from fastapi import HTTPException, status

from app.core.config import settings

_WRITE = {"POST", "PUT", "PATCH", "DELETE"}

DEMO_RESTRICTED_PATHS = tuple(re.compile(p) for p in (
    r"^/auth/me$",
    r"^/auth/me/(password|phone/.*|identities/.*|avatar)$",
    r"^/auth/sessions/.+$",
    r"^/billing/.*$",
    r"^/payments/(cashfree|razorpay)/(create-order|order|verify)$",
    r"^/payments/settings(/.*)?$",
    r"^/invitations/?$",
    r"^/invitations/(direct-add|[^/]+/resend)$",
    r"^/websites/my-website/(publish|domain|verify-domain)$",
    r"^/support/.*$",
    r"^/team/.*$",
    r"^/workspaces/(deregister|rename|seed-demo-data)$",
    r"^/workspaces/[^/]+$",
    r"^/onboarding/.*$",
    r"^/organization/logo$",
))


def is_demo_email(email: Optional[str]) -> bool:
    demo = (settings.DEMO_ACCOUNT_EMAIL or "").strip().lower()
    return bool(demo) and (email or "").strip().lower() == demo


def is_restricted_in_demo(method: str, path: str) -> bool:
    """`path` is the full request path; the API version prefix is ignored."""
    if method.upper() not in _WRITE:
        return False
    prefix = settings.API_V1_STR.rstrip("/")
    if prefix and path.startswith(prefix):
        path = path[len(prefix):]
    return any(p.match(path) for p in DEMO_RESTRICTED_PATHS)


def refuse_if_demo_restricted(ws, request) -> None:
    if ws is None or not getattr(ws, "is_demo", False) or request is None:
        return
    if is_restricted_in_demo(request.method, request.url.path):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "DEMO_RESTRICTED",
                "message": "This isn't available in the demo gym. Create your own gym on repsi.app to use it.",
            },
        )
