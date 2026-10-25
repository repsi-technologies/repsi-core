# SaaS Billing: Deployment Checklist (owner runs this; nothing here was run by the agent)

## 0. Before anything
- [ ] Confirm `docs/payments/pricing.md` and edit `app/api/app/core/saas_catalog.py` if any price changes.
- [ ] Take a full database backup: `python -m scripts.backup`.
- [ ] Check out the release that contains `feature/saas-payments`.

## 1. Sandbox first (MANUAL)
- [ ] Use a staging API with `CASHFREE_ENV=TEST` and sandbox `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY`, `SAAS_BILLING_ENABLED=true`, and `SAAS_CHECKOUT_URL=https://<staging-web>/pay`.
- [ ] Set `SAAS_PUBLIC_API_URL=https://<staging-api>`, or register the webhook in the Cashfree dashboard: `https://<staging-api>/api/v1/saas-billing/webhooks/cashfree`. Use the Dev Studio verifier to confirm the signature check.
- [ ] Pay with a sandbox test card or UPI. Expect success, then the subscription goes `active` and an invoice appears.
- [ ] Also try: a failed card (lands on `/pay/failed`), closing checkout (order expires after 30 minutes), a late payment (`needs_review` plus an alert email), and a refund from the dashboard (a recorded `saas_refund`).
- [ ] Desktop: build on a machine with Rust (`cd app/desktop && npm run build`). Confirm "Renew in browser" opens the system browser and comes back signed in.
- [ ] Android and iOS: confirm no prices or links appear. Review the store payment rules.

## 2. Production environment variables (names only; values never go in git)
`CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_ENV=PROD`, `CASHFREE_API_VERSION=2026-01-01`, `SAAS_PUBLIC_API_URL=https://<api>`, `SAAS_CHECKOUT_URL=https://repsi.app/pay`, `SAAS_ALERT_EMAIL=<ops inbox>`, `SAAS_GRACE_DAYS=7`, `SAAS_TRIAL_DAYS=14`, `SAAS_ORDER_TTL_MINUTES=30`, `SAAS_HANDOFF_TTL_SECONDS=300`. **Leave `SAAS_BILLING_ENABLED=false` for now.**

## 3. Deploy with the flag off
- [ ] Deploy the API and web. Startup `create_all` adds the 12 `saas_*` tables. No existing table is altered.
- [ ] Register the production webhook in Cashfree (PG webhooks, payment and refund events): `https://<api>/api/v1/saas-billing/webhooks/cashfree`.
- [ ] Sync the catalogue: `python -m scripts.sync_saas_plans`. Run it twice; the second run should report 0 created and 0 updated.
- [ ] Backfill existing gyms as a dry run: `python -m scripts.backfill_saas_subscriptions --launch-date YYYY-MM-DD --rows`. Review the counts and rows.
- [ ] Apply the backfill: `... --apply`. Re-run it to confirm `skipped_existing` equals the number of workspaces.

## 4. Turn it on
- [ ] Set `SAAS_BILLING_ENABLED=true` and restart the API and job runner.
- [ ] Make sure cron runs `python -m scripts.run_jobs` every minute. Check that `saas_webhook_drain`, `saas_reconcile` and `saas_lifecycle` appear in `--list` and complete.
- [ ] Do a ₹1 smoke test with an internal workspace and a founder override (`PUT /saas-billing/admin/workspaces/{id}/price-override`), or a low plan.

## 5. Monitoring
- Alert emails go to `SAAS_ALERT_EMAIL`: amount mismatch, late payment, payment on a closed order, refund, reconcile failures, stuck over 24 hours, webhook failed after 8 tries.
- Weekly SQL check: `SELECT * FROM saas_order WHERE needs_review` and `SELECT * FROM saas_webhook_event WHERE status='failed'`.

## 6. Rollback
- Fast: set `SAAS_BILLING_ENABLED=false` and restart. `/saas-billing/*` returns 404, guards fall back to the legacy behaviour, and data is kept.
- Paid orders and invoices stay in `saas_*`. Never drop them. A full schema removal requires your explicit approval and a backup (drop order is in `stage-2-report.md`).
- Stage 6b (legacy Cashfree code removal) happens only after production has been stable. It goes in a separate PR.
