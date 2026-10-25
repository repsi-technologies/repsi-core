# REPSI SaaS Pricing (Phase 1)

> **Status: DERIVED, owner confirmation required before production.** I copied these prices from the
> published catalogue in `app/web/lib/pricing-data.ts` (commit `bbe1a3f`). The backend source of truth is
> `app/api/app/core/saas_catalog.py`. `python -m scripts.sync_saas_plans` loads it into `saas_plan*`.
> The legacy `subscription_plans` catalogue (codes basic, premium, pro_plus) is superseded.

Amounts are totals per billing period in INR, GST-inclusive at whatever rate is set later. INR is the only enabled currency. USD, EUR, GBP and AED prices are stored but disabled.

| Plan (code) | Monthly | 3 months | 6 months | Annual |
|---|---:|---:|---:|---:|
| Lite (`lite`) | ₹199 | ₹537 | ₹894 | ₹1,548 |
| Starter (`starter`) | ₹499 | ₹1,347 | ₹2,250 | ₹3,900 |
| Growth (`growth`) | ₹999 | ₹2,697 | ₹4,494 | ₹7,788 |
| Pro (`pro`) | ₹1,999 | ₹5,397 | ₹8,994 | ₹15,588 |
| Enterprise (`enterprise`) | ₹3,999 | ₹10,797 | ₹17,994 | ₹31,188 |

## Limits (-1 = unlimited)
| Plan | Members | Trainers | Staff | Branches |
|---|---:|---:|---:|---:|
| Lite | 20 | 1 | 1 | 1 |
| Starter | 50 | 3 | 3 | 1 |
| Growth | 150 | 10 | 10 | 1 |
| Pro | 400 | 30 | 30 | 3 |
| Enterprise | -1 | -1 | -1 | -1 |

**Member grace:** the enforced limit is `floor(cap × 1.1)`, computed as `cap * 11 // 10` (so Lite allows 22 and Growth 165). Above that limit, only adding or reactivating members is blocked. Check-ins, renewals and payments always continue.

## Features
- **All plans:** members, QR attendance, payment records, workouts, dashboard, reminders, data export, trainer accounts, AI assistant and AI workouts.
- **Starter and up:** member portal, growth analytics.
- **Growth and up:** AI insights, broadcasts, structured workouts, diet plans, sales CRM.
- **Pro and up:** multi-branch, advanced analytics, WhatsApp automation.
- **Enterprise:** custom domain, API access.

## Trial and lifecycle
- A 14-day trial with Growth entitlements and no card required. One trial per workspace and per owner; repeats are matched by email or phone.
- Grace lasts 7 days after `paid_until`, then the subscription goes `read_only`. A cancelled subscription goes straight to `read_only` at the period end.
- Existing gyms get grandfathered Growth trials until launch + 60 days.

## Read-only allowlist (writes still allowed)
Auth, attendance and check-ins, member payment records and payment-proof review, data export, billing (`/billing`, `/saas-billing`), notifications. All other writes return `402 SUBSCRIPTION_READ_ONLY`. Reads are never blocked.

## Refunds
Refunds are issued from the Cashfree dashboard only. The 7-day refund window applies to 6-month and annual plans, subject to the published terms. REPSI records refunds from verified webhooks.
