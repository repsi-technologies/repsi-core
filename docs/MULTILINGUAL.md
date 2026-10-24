# REPSI Multilingual (i18n / l10n) Plan

Status: **foundation implemented (2026-10-24)**, see "Implementation status" below. The rest of this document is the guide for extending it.
Owner: platform. Scope: web (marketing site, auth, loading, member/staff dashboards, public gym sites), mobile (Flutter), API (errors, notifications, receipts).

## 1. Goals and non-goals

**Goals**

1. English (`en`) is the default and the fallback for every missing string.
2. First wave of Indian languages: Tamil (`ta`), Malayalam (`ml`), Hindi (`hi`), then Kannada (`kn`), Telugu (`te`), Marathi (`mr`), Bengali (`bn`), Gujarati (`gu`), Punjabi (`pa`), Odia (`or`), Urdu (`ur`, RTL).
3. Later, international languages: Arabic (`ar`, RTL), Spanish, French, Portuguese, Indonesian, Bahasa Melayu, Sinhala, Nepali, etc., driven by market demand, not up front.
4. One language per **user**, with a sensible **workspace (gym) default**, so a Tamil-speaking member of a gym whose owner works in English sees Tamil.
5. Everything a person reads is translatable: UI, validation errors, emails, WhatsApp/SMS, receipts/invoices, PDF exports, and public gym websites.

**Non-goals**

- Machine-translating *user-generated* content (gym names, plan names, member notes). These stay as typed; optional per-language overrides come later (section 9).
- Translating the legal text (Privacy, Terms) with machine output alone. These need legal review per language.
- Changing business rules by locale (currency, tax, timezone are workspace settings, not language settings).

## 2. Implementation status

Built (2026-10-24):

| Area | What exists now |
| --- | --- |
| Registry | `app/web/lib/i18n/languages.ts`, `app/api/app/core/i18n.py`, mobile `AppLanguage` enum. Selectable: en (stable), ta, ml, hi, kn, te (beta). Reserved/planned: mr, bn, gu, pa, or, ur, ar. |
| Web catalogues | `app/web/lib/i18n/locales/{en,ta,ml,hi,kn,te}.json`, 202 keys each, full parity. `npm run i18n:check` checks missing/extra/empty keys and `{placeholder}` parity. |
| Web runtime | `useTranslation().t(key, fallback?, params?)` with `{name}` interpolation and plural keys (`key.one` / `key.other` via `Intl.PluralRules`); English fallback; dev warning for unknown keys. Detection: saved choice -> browser languages -> English; account language applied on sign-in (`applySession`); changes saved to the account (`PUT /auth/me/language`) and to the `repsi_lang` cookie. `<html lang dir>` set before hydration by an inline script in `app/layout.tsx`. |
| Web formatters | `formatDate/Time/Number/Currency/Relative` in `lib/i18n/format.ts` (Latin digits, INR default). |
| Web fonts | Noto Sans Tamil/Malayalam/Devanagari/Kannada/Telugu as fallbacks (downloaded only when those scripts appear, via `unicode-range`); `:lang()` line-height and tracking rules in `globals.css`. |
| Web screens translated | Sidebar and mobile nav for every role, top bar user menu, language switcher (native names with `lang` attributes, beta badge), marketing nav (switcher added), brand loader, payment settings and the payment screens that already used `t()`. Gym preferences has a "Default member language" setting. |
| API | `SUPPORTED_LANGUAGES` from the registry (adds Hindi); unknown codes are now rejected with 422 instead of silently saved as English. `Workspace.default_language`, `MessageTemplate.language`, `NotificationDelivery.language` (additive migrations). Lifecycle notifications pick the member's language, then the gym default, then English, for both gym templates and the built-in default wording (ta/ml/hi/kn/te copy for welcome, receipts and membership events). Tests: `tests/test_i18n.py`. |
| Mobile | Hindi added; badge fallback bug fixed (new languages no longer show the Telugu badge); language synced to the account and applied from `preferred_language` on sign-in. Test: `test/localization_test.dart`. |

Not done yet (next steps, in order):

1. Extract the remaining hard-coded strings screen by screen (dashboard pages under `app/(workspace)`, auth/onboarding forms, member portal pages, marketing page bodies, legal pages). Use `t("area.key", "English fallback")` and add the key to `en.json` and every locale.
2. Replace `toLocaleDateString("en-GB")` / `toLocaleTimeString([], …)` in `lib/api.ts` with `lib/i18n/format.ts`. Check first whether those strings get parsed again.
3. API error codes (`{"code", "params"}`) for clients to translate; localized email/PDF receipts (Indic font in PDFs).
4. Marketing SEO: locale-prefixed URLs, `hreflang`, sitemap. Add the prefixes to `RESERVED_SLUGS` in `middleware.ts` first.
5. Native-speaker review of every beta catalogue (the current ta/ml/hi/kn/te strings are drafts), then mark them `stable`.
6. The `message_templates` unique constraint is still `(workspace_id, name)`, so language variants need distinct names (for example "Welcome (Tamil)"). WhatsApp language variants still need their own Meta approval.
7. Users get `preferred_language = "en"` by default, so the gym default only applies to members without an app account. If gyms want it to apply to everyone, make the column nullable ("inherit").
8. Mobile: move from `AppStrings` maps to ARB/`flutter_localizations` once the string count grows.

## 2a. State before implementation (for reference)

| Area | What exists | Gap |
| --- | --- | --- |
| API `User.preferred_language` (`app/api/app/models/user.py`) | Column, default `en`; accepted by `auth.py` | Allowed set is only `en, ta, ml, kn, te` (`VALID_LANGUAGES`); `hi` and others rejected |
| API `Workspace.locale` | BCP-47 string (e.g. `en-IN`), plus `timezone`, `currency` | Not used to choose a default language for members/notifications |
| Mobile `app/mobile/lib/core/localization/` | `AppLanguage` enum (en/ta/ml/kn/te), hand-written `AppStrings` map, Riverpod provider persisted in SharedPreferences | Strings live in Dart maps (hard to hand to translators); no plurals/ICU; not synced to the API; no Hindi |
| Web | Small `lib/i18n` provider with one TS dictionary (en/ta/ml/kn/te, 116 keys) used by payment screens; `<html lang="en">` hard-coded; IBM Plex Sans only; `toLocaleDateString("en-GB")` in `lib/api.ts` | Nav/shell untranslated, no Hindi, no interpolation/plurals, account language not applied on sign-in, no Indic fonts |
| Notifications | `MessageTemplate` (channel, body with `{{placeholders}}`, `provider_template_name`) | No `language` on templates; WhatsApp templates must be approved per language |
| Marketing | Many routes under `app/(marketing)` | No localized URLs / `hreflang` / sitemap entries |

Takeaway: the data model has the right seed (`preferred_language`, `locale`). Mobile has a working but non-scalable approach. Web has nothing. The plan below unifies all three on one catalogue format and one set of language codes.

## 3. Principles

1. **Codes**: use BCP-47 everywhere (`en`, `ta`, `ml`, `hi`, `en-IN`). Store the **language** on users (`ta`) and the **locale** (`ta-IN`) derived from language + workspace country. Never store display names.
2. **Keys, not sentences**: code references stable keys (`members.status.active`); English is just another catalogue file, not the source of truth embedded in code.
3. **ICU MessageFormat** for plurals, gender and select: Indian languages have different plural rules (Hindi/Bengali treat 0 and 1 as "one"; Arabic has six categories). Never concatenate strings (`"You have " + n + " members"`).
4. **Fallback chain**: `user language -> workspace default language -> en`. A missing key must show English, never the raw key, and must be reported in dev/CI.
5. **No translation in the database for system text.** UI strings live in versioned files reviewed in PRs. Only tenant content (templates, plan names) lives in the DB.
6. **Format via `Intl`, not by hand**: dates, numbers, currency, relative time, lists. Indian digit grouping (`12,34,567`) comes free with `en-IN`/`hi-IN`.
7. **Layout must tolerate length**: Tamil and Malayalam strings are commonly 30-60% longer than English, and Indic scripts need taller line-height. Design with that, do not truncate silently.
8. **Humans translate, machines draft.** Machine translation is fine as a first draft behind a "needs review" flag; shipping a language needs a native-speaker review of the top flows.

## 4. Recommended architecture

### 4.1 Single source of truth for catalogues

```
packages/i18n/                # (or app/i18n/ if no workspace tooling)
  locales/
    en/                       # source language
      common.json
      auth.json
      dashboard.json
      members.json
      payments.json
      marketing.json
      errors.json
      notifications.json
    ta/ ml/ hi/ ...           # same file names, same keys
  languages.json              # registry: code, native name, English name, script, dir, status
  README.md
```

- Namespaced JSON (ICU syntax inside values). One namespace per feature keeps web bundles small: load only `common` + the namespaces a route needs.
- `languages.json` is the registry that drives the language switcher, the API's `VALID_LANGUAGES`, the mobile enum, sitemap `hreflang`, and CI coverage checks. Example entry:

```json
{ "code": "ta", "native": "தமிழ்", "english": "Tamil", "script": "Tamil", "dir": "ltr", "status": "beta", "intlLocale": "ta-IN" }
```

- `status`: `planned | beta | stable`. Only `beta`/`stable` appear in the switcher (beta shows a small badge).
- Mobile reads the same JSON (convert to ARB at build time with a small script, section 4.4) so translators work on one format.

### 4.2 Web (Next.js 16 App Router)

> `app/web/AGENTS.md` says this Next.js differs from older versions. **Before coding, read `app/web/node_modules/next/dist/docs/`** (routing, middleware/proxy, i18n, metadata) and confirm the library choice below still supports Next 16 and React 19.

Library: **`next-intl`** is the recommended choice (App Router native, ICU, server + client components, typed keys, small runtime). Alternatives (`react-i18next`, `lingui`) work but need more glue for server components. Verify the installed version's compatibility before adopting.

**Routing strategy: two surfaces, two rules**

| Surface | URL | Language source |
| --- | --- | --- |
| Marketing site (public, SEO) | Locale prefix: `/ta/pricing`, `/hi/features`; English stays unprefixed (`/pricing`) | URL is the truth; `hreflang` + canonical per language |
| Auth, onboarding, dashboards (private) | **No prefix** (`/dashboard`) | Logged-in user's `preferred_language`; cookie `repsi_lang` when logged out |
| Public gym sites (`/{slug}` -> `/site/{slug}`) | Optional `?lang=` or `/{slug}/ta`; defaults to gym's `locale` language | Gym setting, visitor can switch |

Why not prefix everything: private pages gain nothing from SEO prefixes, and prefixing would collide with the tenant-slug rewrite in `app/web/middleware.ts` (every unknown first segment is treated as a gym slug and rewritten to `/site/{slug}`). Any marketing locale prefix **must be added to the reserved list** (or handled before the slug rewrite), otherwise `/ta` becomes a gym called "ta". Add a unit/e2e test for this.

**Language resolution order (private app)**

1. Authenticated user: `preferred_language` from the API (`/auth/me`).
2. Cookie `repsi_lang` (set on switch, 1 year, `SameSite=Lax`, not sensitive).
3. `Accept-Language` header (best match against enabled languages).
4. Workspace default (known after workspace resolution).
5. `en`.

**Implementation notes**

- `app/layout.tsx`: set `<html lang={locale} dir={dir}>` from the resolved locale (currently hard-coded `en`). Wrap with the provider; load messages server-side so first paint is already translated (no flash of English).
- `loading.tsx` / skeletons / error boundaries / `not-found`: these must use the same provider; keep `loading` text minimal (prefer skeletons + `aria-label` from `common.loading`).
- Server components use the server translator; client components use the hook. Do not ship whole catalogues to the client; pass only needed namespaces.
- Typed keys: generate a `Messages` type from `en` so a typo fails `tsc --noEmit`.
- Metadata: translate `title`, `description`, OpenGraph per locale; emit `<link rel="alternate" hreflang>` plus `x-default`; extend `sitemap.ts` with localized URLs.
- Replace hard-coded `toLocaleDateString("en-GB")` and `toLocaleTimeString([], …)` in `lib/api.ts` with shared formatters (`formatDate`, `formatCurrency`, `formatRelative`) that take the active locale and the workspace `timezone`/`currency`.
- Language switcher: one component in `components/ui` (Radix `DropdownMenu`), shows native names ("தமிழ்", "മലയാളം", "हिन्दी"), each with `lang` attribute so screen readers pronounce correctly. Saving also calls the API (`PATCH /auth/me`) for logged-in users.

**Fonts and typography (important for India)**

- IBM Plex Sans has no Indic glyphs; the browser would fall back to arbitrary system fonts. Add Noto families via `next/font` (self-hosted, subset, `display: swap`): `Noto Sans Tamil`, `Noto Sans Malayalam`, `Noto Sans Devanagari`, `Noto Sans Kannada`, `Noto Sans Telugu`, `Noto Sans Bengali`, `Noto Sans Gujarati`, `Noto Sans Gurmukhi`, `Noto Sans Oriya`, `Noto Naskh Arabic` / `Noto Sans Arabic` (Urdu/Arabic).
- Load a script font **only when that locale is active** (CSS variable per `[lang]`), so English users download nothing extra.
- In `globals.css`: `:lang(ta), :lang(ml), :lang(hi) … { line-height: 1.7; letter-spacing: 0; }` and never apply negative letter-spacing, `text-transform: uppercase`, or all-caps styles to Indic text (they break shaping or do nothing). Update `app/web/DESIGN.md` with these rules.
- Tailwind: use logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `text-start`) instead of `ml/mr/left/right` so RTL (Urdu, Arabic) works without a second stylesheet. Mirror directional icons (chevrons, arrows) only; do not mirror logos, charts, or phone numbers.

### 4.3 API (FastAPI)

1. **Language registry**: replace the hard-coded `VALID_LANGUAGES` in `app/api/app/api/v1/auth.py` with a value loaded from `languages.json` (only `beta`/`stable`).
2. **Request language**: add a dependency `get_request_language()` -> `user.preferred_language` -> `Accept-Language` -> workspace locale -> `en`. Never trust `workspace_id` from client; language is not a tenant key and is safe from the header.
3. **Errors**: return **stable machine codes** plus params, e.g. `{"code": "membership.expired", "params": {"date": "2026-11-01"}, "message": "…"}`. Clients translate by `code`; `message` is an English fallback for logs and third-party consumers. Do this progressively, starting with auth and payment errors.
4. **Server-rendered text** (emails, WhatsApp, SMS, invoices/receipts PDF, CSV headers): use `Babel` (or `gettext`/`fluent`) with the same catalogues, rendered in the **recipient's** language, not the actor's.
5. **Number/date/currency in PDFs**: format with Babel `format_currency(…, locale="en_IN")`. Ensure PDF generation embeds a font with Indic glyphs (Noto) or Tamil/Malayalam/Hindi receipts will render as boxes.
6. **Data model (additive only, via `app/core/migrations.py`)**:
   - `Workspace.default_language` (String(10), default `en`) distinct from `locale` (formatting). Optional `enabled_languages` (JSON) so a gym can limit the switcher.
   - `MessageTemplate.language` (String(10), default `en`) and uniqueness `(workspace_id, name, language)` (replace the current `(workspace_id, name)` unique constraint carefully; additive migration plus a new index, no history rewrite).
   - Keep `User.preferred_language`; widen validation; allow `NULL`-means-inherit later if desired.
   - Record language on `NotificationDelivery` (what language was actually sent) for audit; deliveries are append-only per the project rules.
7. **Tenant scoping**: all new language/template queries are scoped by `workspace_id` from `TenantContext`. Language endpoints (`PATCH /auth/me`) affect only the caller; workspace default requires owner/admin role checked on the backend.

### 4.4 Mobile (Flutter)

Replace the hand-written `AppStrings` map with the official **`flutter_localizations` + `intl` + ARB** pipeline (`l10n.yaml`, `AppLocalizations`). `intl` is already a dependency.

- Generate ARB from the shared catalogue (small Node/Python script in CI) so translators never edit two formats; or make ARB the master and generate web JSON from it, but pick **one** master.
- Keep the Riverpod `LocaleNotifier` and SharedPreferences, add: sync to API on change, load from `preferred_language` on login, device locale as first-run default.
- Add `hi` and the remaining languages to `AppLanguage`; drive it from the registry.
- Add Noto font assets only for languages shipped; Android and iOS system fonts cover most Indic scripts, but test on low-end Android (older devices lack Malayalam/Odia shaping).
- Push notifications: send a **translation key + params** or pre-rendered text in the recipient's language from the API; do not rely on the app translating background pushes.

## 5. Translation workflow and tooling

1. English is authored in `locales/en/*.json` by developers in the same PR as the UI.
2. Translation management: use a TMS (**Crowdin**, **Lokalise**, or **Weblate** self-hosted; Weblate/Crowdin both have free tiers for open workflows). Connect the Git repo so translators work in a UI with context screenshots and glossary, and a bot opens PRs.
3. **Glossary** (critical for a gym SaaS): fix terms once per language, e.g. *Member, Membership, Plan, Trainer, Check-in, Freeze, Renewal, Invoice, Receipt, Due*. Decide whether to keep English loanwords where users actually say them (Hindi "मेंबरशिप", Tamil "மெம்பர்ஷிப்" are common in gyms) versus formal terms. Native-speaker reviewers decide per language.
4. **Tone**: respectful-but-plain. Hindi: *aap* form. Tamil/Malayalam: avoid overly literary register; choose conversational-formal.
5. Machine draft (LLM or MT) -> human review -> `status: beta` -> usage feedback -> `stable`. Track reviewer and date in the registry.
6. Never translate: brand "REPSI", product names, currency codes, placeholders (`{count}`), URLs, API enum values.
7. Short UI labels need context. Add a `_description` note or TMS comment for ambiguous words ("Plan", "Due", "Close", "Open").

## 6. Quality gates (CI)

Add these as checks, wired into `repsi-verify`:

- **Key parity**: every key in `en` exists in each `stable` language (beta may lag; report coverage %).
- **Placeholder parity**: same ICU variables in source and translation; no extra/missing `{name}`.
- **ICU syntax lint**: parse all messages; fail on invalid plural/select.
- **No hard-coded strings**: ESLint rule (`eslint-plugin-i18next` `no-literal-string` in JSX, scoped to `app/web/features` and `components` with allow-lists) at *warn* first, *error* once migrated.
- **Pseudo-localization** locale (`en-XA`): expands strings ~40% with accents and brackets; run e2e once on it to catch truncation and untranslated text.
- **Playwright**: per-language smoke (`ta`, `ml`, `hi`, `ur`): language switch persists after reload and login, `<html lang/dir>` correct, key pages have no raw keys (`/\w+\.\w+\.\w+/` text scan), no horizontal overflow at 375px.
- **API pytest**: language fallback chain, invalid language rejected, template resolution by language, tenant isolation on templates.
- **Visual check** of Tamil/Malayalam/Devanagari headings and buttons (text clipping, tall glyph cut-off).

## 7. India-specific guidance

- **Numbers and currency**: INR with lakh/crore grouping (`₹12,34,567`) through `Intl.NumberFormat("en-IN" | "hi-IN" | "ta-IN", {style:"currency", currency:"INR"})`. Decide per language whether to show native digits (Devanagari/Tamil numerals): **default to Latin digits** for payments/phones/OTP everywhere; offer native digits only as an opt-in, never for money or IDs.
- **Dates**: use `DD/MM/YYYY` or localized month names via `Intl`; workspace `timezone` (`Asia/Kolkata`) is independent of language. Weeks start Monday in most gyms; make it a workspace setting.
- **Names and search**: member names may be typed in Tamil/Malayalam/Hindi or transliterated. Search must be Unicode-normalized (NFC), case/accents-insensitive, and ideally match transliteration later. Do not assume first/last name structure or ASCII-only validation (check regexes in member forms and API schemas).
- **Phone**: store E.164 (`phone_e164`) already; display grouped by region. Not translated.
- **Mixed-script input**: users type in English keyboard + local script; keep fields UTF-8 end to end. PostgreSQL is UTF-8; SQLite is fine. Verify CSV import/export with a BOM-aware encoding so Excel opens Indic text correctly (export UTF-8 with BOM).
- **WhatsApp**: templates are approved by Meta **per language**, with names like `renewal_reminder_ta`. Map `MessageTemplate.provider_template_name` per language and fall back to `en` (or to the gym's default) if the language variant isn't approved. Respect consent flags; do not send a language variant that isn't approved by the provider. See `repsi-whatsapp-notifications`.
- **Keyboards / IME**: do not block composition events in inputs; do not auto-capitalize or auto-correct Indic fields.
- **Transliteration helper (optional later)**: let staff type member names in English, store a `display_name_local` for Tamil/Malayalam/Hindi receipts.
- **Government/legal**: GST invoice must keep required fields in English/Hindi as law demands; translated invoices are *additional*, not a replacement. Confirm with the finance/legal owner before shipping translated tax documents.

## 8. International languages (phase 3)

- **RTL (Urdu, Arabic)**: logical CSS properties adopted in phase 1 make this cheap. Test icons, progress bars, charts (axes stay LTR numerically), and phone/number fields (`dir="ltr"` on those inputs).
- **Locale formats**: derive from workspace `country_code` + language (`ar-AE`, `en-SG`, `ms-MY`, `si-LK`). Currency/timezone remain workspace settings.
- **Pluralization** differs strongly (Arabic 6 forms, Russian 3): only ICU handles this, hence principle 3.
- **Legal/compliance** differs per country (consent text, data residency); languages do not imply markets. Add languages for demand, not coverage.

## 9. Tenant content (phase 4, optional)

For content gyms write themselves (public website copy, plan names/descriptions, class names, announcements):

- Option A (simple): single language per field; gym chooses the site language.
- Option B (recommended later): a `translations` JSON per entity (`{"ta": {"name": "...", "description": "..."}}`) or a sibling table `entity_translations(workspace_id, entity_type, entity_id, language, field, value)`, scoped by `workspace_id`, falling back to the base field. Offer an "auto-translate draft" button the owner must approve (never auto-publish).
- Never overwrite the original on edit; keep history per the project rule.

## 10. Rollout plan and to-do

Each phase is shippable on its own. Sizes: S ≈ 1-2 days, M ≈ 3-5 days, L ≈ 1-2 weeks (one developer).

### Phase 0 - Decisions and foundations (S-M)

- [ ] Read `app/web/node_modules/next/dist/docs/` (routing, middleware/proxy, metadata) and confirm `next-intl` works with Next 16 + React 19 (spike on a branch).
- [ ] Decide master catalogue format (recommended: JSON/ICU in `locales/`, ARB generated for Flutter).
- [ ] Create `languages.json` registry and `locales/en/*` skeleton.
- [ ] Pick TMS (Crowdin / Lokalise / Weblate) and set up glossary for the gym domain.
- [ ] Recruit native reviewers: Tamil, Malayalam, Hindi first (one per language, paid or from known gym owners).
- [ ] Decide public-site URL strategy for marketing locales (prefix) and gym sites (`?lang` vs path).

### Phase 1 - Web platform plumbing (M-L)

- [ ] Install and configure i18n library; locale resolution (user -> cookie -> Accept-Language -> workspace -> `en`).
- [ ] `<html lang dir>` dynamic in `app/layout.tsx`; provider and server message loading.
- [ ] Update `middleware.ts`: locale handling for marketing prefixes and reserved slugs (add every language code to the reserved list or process before the slug rewrite); add e2e test.
- [ ] Language switcher component (native names, `lang` attrs) in `components/ui`; persist cookie + `PATCH /auth/me`.
- [ ] Shared formatters (`formatDate/Time/Currency/Number/Relative`) replacing `en-GB` calls in `lib/api.ts`.
- [ ] Noto font loading per script via `next/font`, `:lang()` typography rules; update `app/web/DESIGN.md`.
- [ ] Logical Tailwind utilities audit (`ml/mr/left/right` -> `ms/me/start/end`) in shared components first.
- [ ] Typed message keys from `en` and `tsc` integration.

### Phase 2 - API and data (M)

- [ ] Widen `VALID_LANGUAGES` from the registry (add `hi` and others as they reach beta).
- [ ] Add `Workspace.default_language` (+ optional `enabled_languages`) via additive migration in `app/core/migrations.py`; expose in settings API with owner/admin check.
- [ ] Add `MessageTemplate.language` + new unique index; resolve template by recipient language with fallback to workspace default, then `en`.
- [ ] `get_request_language()` dependency; start returning error `code` + `params` for auth, membership, payment errors.
- [ ] Babel-based rendering for emails/receipts/WhatsApp variables in recipient language; ensure PDF fonts support Indic scripts.
- [ ] Record language on `NotificationDelivery`.
- [ ] pytest: fallback chain, invalid language, tenant isolation, template resolution.

### Phase 3 - First languages: English + Tamil, Malayalam, Hindi (L)

- [ ] Extract strings in priority order: (1) auth, onboarding, loading/error/not-found; (2) member dashboard + portal; (3) staff/owner dashboard (members, memberships, payments, attendance); (4) marketing home, pricing, features; (5) legal pages (with legal review).
- [ ] Machine-draft `ta`, `ml`, `hi`; native review; mark `beta`.
- [ ] Add WhatsApp template variants (`_ta`, `_ml`, `_hi`) and submit for provider approval; fall back to `en` until approved.
- [ ] Marketing SEO: `hreflang`, localized metadata, sitemap entries, canonical URLs.
- [ ] Mobile: migrate `AppStrings` to ARB/`AppLocalizations`, add `hi`, sync with API.
- [ ] CI gates: key/placeholder parity, ICU lint, pseudo-locale e2e, per-language Playwright smoke.

### Phase 4 - More Indian languages (M per batch)

- [ ] Batch A: Kannada, Telugu (already in API/mobile enum), Marathi.
- [ ] Batch B: Bengali, Gujarati, Punjabi, Odia.
- [ ] Batch C: Urdu (RTL) - validates the RTL work.
- [ ] Per language: glossary, fonts, review, `beta` -> `stable` after real-user feedback and zero-missing-key CI.

### Phase 5 - International and tenant content (L, demand-driven)

- [ ] Arabic, plus top demand languages from signup analytics.
- [ ] Tenant-content translations (section 9) for public gym sites and plans.
- [ ] Transliteration helper and local-script member names on receipts.

### Ongoing

- [ ] Add "no hard-coded strings" lint as warn -> error once migrated.
- [ ] Add a PR checklist item: "new strings added to `en` and marked for translation".
- [ ] Review language usage analytics quarterly; promote/demote `status`.

## 11. Suggestions and risks

1. **Start with three languages, not twelve.** Quality in Tamil, Malayalam and Hindi beats thin coverage in many; the plumbing is the hard part and it is language-independent.
2. **Fix the foundations before extracting strings.** Fonts, `lang/dir`, formatters, and logical CSS affect every screen; retrofitting them after thousands of strings is costly.
3. **Watch the middleware.** The current "any unknown first segment is a gym slug" rule is the most likely source of locale-routing bugs. Keep the reserved list in one place and test it.
4. **Beware of WhatsApp approval lead time.** Meta template approval per language can take days; start submissions early and keep the English fallback.
5. **Do not machine-translate legal or payment text without review.** Refund, consent, and billing wording has legal weight.
6. **Native digits and transliteration are opt-in.** Default to Latin digits for money, phones, OTPs.
7. **Test on real low-end Android devices** for Indic rendering; emulators with Google fonts hide problems.
8. **Measure.** Track language chosen at signup, switch events, and missing-key reports; let data order the language roadmap.
9. **Avoid per-string runtime machine translation** (e.g. translating on the fly): unpredictable, slow, can't be tested, and produces inconsistent terminology.
10. **Keep one identity per user.** Language is a preference on the existing `User`; do not create a parallel "member language" record (see CLAUDE.md: no parallel member/user identities). Members who have a `User` use `preferred_language`; member-only records fall back to workspace default.

## 12. Definition of done (per language)

- 100% of keys translated for `stable` (>= 95% for `beta`), zero placeholder/ICU errors in CI.
- Reviewed by a native speaker; glossary applied; reviewer recorded in the registry.
- Fonts load only for that language; no clipped glyphs on 375px mobile and desktop.
- Key flows pass the per-language Playwright smoke: sign up/login, switch language, view dashboard, record a payment, view a receipt.
- Emails/WhatsApp/receipts render in that language for recipients with it selected, with correct fallback otherwise.
- `hreflang`, sitemap, and metadata present for marketing pages (if the language is public).
