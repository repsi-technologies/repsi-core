# REPSI — Suggested additional modules and features

**Basis and limits.** This list comes from my general knowledge of gym and fitness management products
(Mindbody, Glofox, Zen Planner, Gymdesk, Wodify, TeamUp, PushPress, Trainerize, TrueCoach, and Indian products such as
Gymdesk-style desk apps, Cult-style apps and local tools). I did **not** run a live web comparison for this file,
so pricing, feature claims and market share are not verified. Check a competitor's current pages before
you quote them. Current status of existing modules is in `todos.md`.

Effort: S ≈ days, M ≈ 1–3 weeks, L ≈ a month or more. Priority is for REPSI's target market (independent Indian gyms and
studios, with multilingual staff and members, UPI-first payments).

---

## 1. Highest value (build next)

| # | Module | Why it matters | What it includes | Effort |
|---|---|---|---|---|
| 1 | **Class booking, waitlist and calendar** *(modules 76–80, already planned)* | The first thing studios compare. Without booking, REPSI is a desk tool only. | Member booking in app, waitlist auto-promotion, late-cancel rules, class credits, trainer calendar, Google/Apple calendar feed. | L |
| 2 | **Recurring payments and auto-renew** | Failed renewals are the biggest revenue leak. REPSI has manual UPI proof review, with the online gateways disabled. | Razorpay/Cashfree enablement with test mode first, UPI AutoPay mandates, payment links on WhatsApp, retry schedule, dunning messages. | L |
| 3 | **Dues and renewal collections desk** | Owners chase dues by hand. | Dues list by age, one-tap WhatsApp/SMS reminder, promise-to-pay date, follow-up tasks. Builds on module 60 and AI reminder suggestions (128). | M |
| 4 | **Lead-to-member sales funnel** | CRM exists. Conversion is where gyms lose money. | Pipeline stages, trial pass or free-visit booking, follow-up tasks and reminders, source tracking (walk-in, Instagram, referral), conversion report, auto-convert to member. | M |
| 5 | **Reports and exports** *(95–96, already planned)* | Owners ask for Excel on day one. | Revenue, dues, attendance, retention, trainer reports. CSV/Excel/PDF. Scheduled weekly email report. | M |
| 6 | **Member retention and churn alerts** | Cheaper than acquiring members. | At-risk list (no visit in N days, expiring, unpaid), win-back campaign templates, birthday and milestone messages, "we miss you" automation. Uses attendance and membership data. | M |
| 7 | **Automation engine (simple "when X then Y")** | Replaces manual reminders and ties together email, WhatsApp, in-app and tasks. | Triggers: new member, payment verified, N days before expiry, missed visits. Actions: send template, create task, tag member. Needs the scheduler from `todos.md` A7. | L |
| 8 | **Support tickets** *(108)* | Needed once there are paying tenants. | Tenant ticket form, super admin inbox, status and SLA, link to audit logs. | S–M |

## 2. Strong additions

| # | Module | What it includes | Effort |
|---|---|---|---|
| 9 | **Point of sale and product inventory** | Sell supplements, drinks, merchandise. Stock counts, low-stock alerts, GST invoices, link sales to member account. | M |
| 10 | **GST invoicing and tax reports** | GSTIN on the gym profile, tax-compliant invoice numbering, HSN/SAC codes, GSTR-ready export, credit notes for refunds. Important in India. | M |
| 11 | **Personal training packages and session credits** | Buy a pack of N sessions, deduct per session, expiry, trainer commission per session. Builds on appointments (79). | M |
| 12 | **Staff payroll and trainer commission** | Salary, attendance-based pay, per-session and per-sale commission, payout history. Staff attendance is partly there. | M |
| 13 | **Digital waiver and PAR-Q / health screening** | Member signs on first visit, stored with the document module (27). Required before workouts at many gyms. | S–M |
| 14 | **Member app engagement** | Challenges and leaderboards, streaks and badges, check-in rewards, referral program with credits. | M |
| 15 | **Nutrition and diet plans** | Trainer-assigned meal plans, food log, water and weight tracking, Indian-food database. The web app already has diet-plan screens that are not traced to a backend, so verify first. | M–L |
| 16 | **Body composition and progress photos** | Photo timeline with consent, before/after compare, InBody-style import. Extends modules 71–72. | S–M |
| 17 | **Multi-branch management** | Cross-branch memberships and check-in, branch-level reports and permissions, transfers. Branches exist (module 17). The cross-branch rules need more work. | M |
| 18 | **Lockers, towel and resource booking** | Locker assignment with rent and expiry, court/room/sauna booking, equipment maintenance schedule (machines exist). | S–M |
| 19 | **Access control hardware** | Turnstile and door controller integration, face/fingerprint devices, QR gate. The biometric adapter exists but is not tested against hardware. | M–L |
| 20 | **Gym website, booking widget and embeds** | The website builder exists. Add a class timetable widget, lead form with spam control, online join-and-pay page, and SEO. | M |

## 3. Platform and growth

| # | Module | What it includes | Effort |
|---|---|---|---|
| 21 | **White-label / branded member app** | Gym logo and colours in the app, custom domain, store listing for higher tiers. | L |
| 22 | **Public API, webhooks and Zapier-style integrations** | API keys per workspace with scopes, outgoing webhooks (member created, payment verified), Google Sheets and accounting export (Tally, Zoho Books). | M–L |
| 23 | **Wearable and fitness-app sync** | Google Fit, Apple Health, Strava, Garmin. The running tracker exists. Integrations screen exists, so verify what is real. | M |
| 24 | **Video / on-demand and virtual classes** | Upload or link workout videos, live class links (Zoom/Meet), paid online programs. | M–L |
| 25 | **Franchise / chain console** | One owner, many gyms, consolidated reporting, shared plans and pricing templates. | L |
| 26 | **Marketplace and referral for gym owners** | Partner discounts, REPSI referral rewards (a partner portal page exists on the marketing site). | M |
| 27 | **Data tools** | Import from competitor products (Excel templates for common tools), full data export for tenants, delete/anonymise on request. | M |
| 28 | **Privacy and compliance centre** | Consent log, data-processing terms, DPDP Act (India) request handling, retention rules. Needed before storing health data and photos. | M |

## 4. Quality-of-life ideas (small)

- Freeze, extension and discount **approval workflow** (staff request, owner approves).
- **Member tags and segments** saved for reuse in broadcasts and reports.
- **Tasks and reminders** for staff ("call this lead tomorrow").
- **Shift scheduling** for front desk and trainers.
- **Kiosk mode** for the check-in tablet (the attendance display page is a start).
- **Daily owner digest** by WhatsApp or email: today's collections, expiries, absentees.
- **Onboarding checklist** with progress in the dashboard. A getting-started dialog already exists.
- **Offline-tolerant check-in** on mobile and desktop, syncing when the connection returns.
- **Hindi and other Indian language packs** after the current five (en, ta, ml, kn, te).
- **Audit trail viewer** for gym owners (the audit log exists for super admin).

## 5. Recommended roadmap

1. **Now:** finish launch blockers in `todos.md` (A1–A7).
2. **Next quarter:** class booking (1), reports (5), dues desk (3), retention alerts (6), support tickets (8).
3. **After that:** online recurring payments (2), GST invoicing (10), sales funnel (4), automation (7), PT packages (11).
4. **Later:** POS (9), payroll (12), app engagement (14), nutrition (15), public API (22), white-label (21).

Two things to decide before the large items: whether to enable online payment gateways (2 depends on it), and which
paid tier each new module belongs to. Plan features are gated through `require_feature`, so each module needs a feature key.
