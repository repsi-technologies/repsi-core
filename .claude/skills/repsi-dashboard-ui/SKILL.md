---
name: repsi-dashboard-ui
description: Build or change REPSI owner/staff/member dashboard screens in app/web (Next.js 16 App Router, React 19, Tailwind 4, Radix UI) — tables, filters, forms, dialogs, detail pages, navigation, responsive and accessible states, wired to real API calls.
paths:
  - "app/web/**"
---

# REPSI dashboard UI

## Before writing code

1. Read `app/web/AGENTS.md`. Next.js 16 differs from older versions: check `app/web/node_modules/next/dist/docs/01-app/` for the API you're about to use (e.g. async `params` in pages, `use()` for promises, middleware/proxy conventions) and heed deprecations.
2. Find the existing screen for the domain:
   - Routes: `app/web/app/(workspace)/[workspace]/<area>/` (owner/staff), `.../member/` (self-service), `.../trainer/`.
   - Feature components: `app/web/features/<area>/`.
   - Navigation: `app/web/components/layout/sidebar.tsx` (role-specific sections) and `mobile-nav.tsx`.
   - Primitives: `app/web/components/ui/*` (button, card, badge, dialog, dropdown-menu, input, label, skeleton, empty-state, tooltip, phone-input…). Use these; don't add a new UI kit.
   - API: `app/web/lib/api.ts` (`repsiApi`, `getAuthHeader`). Add typed methods there instead of calling `fetch` in components.
   - Types: `app/web/types/index.ts`; helpers in `lib/utils.ts` (`formatDate`, `formatCurrency`, `getInitials`, `cn`).

## Workflow

1. Confirm the backend endpoint exists and its response shape (read the FastAPI schema). If it doesn't, build it first (`repsi-backend-api`).
2. Add/extend the `repsiApi` method with types; surface `detail` from error responses.
3. Build the screen with: page title + breadcrumb, primary action, search/filters, server-side pagination, loading skeleton, empty state, error state with retry, success toast.
4. Forms: labelled inputs, inline validation mirroring backend rules, disabled submit while pending, confirm dialogs for destructive or sensitive actions (suspend, cancel, delete, refund).
5. Responsive: tables collapse to cards or horizontal scroll inside their container under `md`; no page-level horizontal scroll at 375px.
6. Accessibility: keyboard-reachable actions, `aria-label` on icon buttons, visible focus, status conveyed by text not colour alone.
7. Hide actions the role can't perform, but treat this as UX only — the backend enforces it.

## Checks

`npx eslint <changed files>`, `npx tsc --noEmit`, and `npm run build` in `app/web`. Check the screen in the browser at desktop and mobile widths when a dev server is available.

## Restrictions

- No mock data (`lib/mock-data.ts`) in production screens; no fake buttons or TODO handlers.
- Don't restyle the brand or replace existing working components wholesale.
- Don't put secrets or provider keys in client code or `NEXT_PUBLIC_*`.
- Don't add heavy dependencies for things the existing stack already covers.
