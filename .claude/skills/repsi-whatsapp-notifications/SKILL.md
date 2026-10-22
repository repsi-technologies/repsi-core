---
name: repsi-whatsapp-notifications
description: Add or change REPSI WhatsApp/SMS/email member notifications — membership confirmation, expiry and renewal reminders, payment confirmation, extension and freeze updates — including provider integration (AiSensy), templates, consent, delivery logs, retries and de-duplication.
---

# REPSI WhatsApp notifications

## Existing implementation (read first)

- AiSensy settings: `app/api/app/core/config.py` (`AISENSY_*`, backend-only).
- Provider pattern to copy: `app/api/app/services/otp.py` (`OtpProvider` protocol, `TestOtpProvider`, `AiSensyOtpProvider`, factory by setting).
- Email: `app/api/app/core/email.py`. In-app notifications: `app/api/app/models/system.py::Notification`, `api/v1/notifications.py`.
- Current reminders only build `wa.me` click-to-chat links: `GET /memberships/renewal-reminders`.
- Member notification service (if present): `app/api/app/services/member_notifications.py`.

## Rules

- Provider boundary: a protocol with a `test`/`disabled` implementation and an AiSensy implementation selected by config. When credentials are missing, record the message as `skipped_not_configured` — never as `sent`.
- Use approved template/campaign names per event; template parameters only, no free-form marketing text through transactional templates.
- Respect consent: only send to members who opted in (store consent + timestamp); honour opt-out immediately.
- Every send attempt is a delivery-log row: event type, member, channel, template, status (`queued/sent/failed/skipped_*`), provider response id/error, attempts, timestamps.
- De-duplicate with an idempotency key such as `{workspace_id}:{event}:{membership_id}:{date}` and a unique constraint, so job retries can't double-send.
- Send outside the request path (background task / scheduled job). Retries use bounded backoff.
- Phone numbers normalised via `app/core/phone.py` before sending.

## Workflow

1. Read the files above. Reuse the OTP provider HTTP code style and timeouts.
2. Add models via `repsi-db-migrations`, service + tests, then trigger points in the lifecycle/payment services.
3. Run `repsi-verify`.

## Required tests

Not-configured fallback, consent filtering, duplicate suppression on retry, provider failure recorded with error, reminder window selection by workspace timezone. Mock `httpx`; never call AiSensy in tests.

## Restrictions

- Never log API keys or full message bodies containing personal data at INFO level.
- Never expose provider credentials to the web app.
- Don't mark delivery successful without a provider acknowledgement.
