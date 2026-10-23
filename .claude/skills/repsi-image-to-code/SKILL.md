---
name: repsi-image-to-code
description: Turn a screenshot, mockup or reference image into working, responsive REPSI React/Next.js code using existing components and tokens, then compare against the reference and refine. Use when the user shares an image of a UI and asks to build, copy, match or implement it.
paths:
  - "app/web/**"
---

# Image to code (REPSI)

Authored for this project. No single upstream "image-to-code" skill could be verified (several registries list
copies of the same text under different authors, written for Codex), so none was installed.

## 1. Analyse the reference

Read the image. Write a short breakdown before coding:
- Layout regions and grid (sidebar, header, cards, table, columns), and how each should reflow at 375 / 768 / 1440px.
- Component inventory mapped to `components/ui/*` (button, card, badge, dialog, dropdown-menu, input, tabs, tooltip,
  skeleton, empty-state). Name anything with no match.
- Typography sizes and weights, spacing, radius, borders, shadows, colours, each mapped to the nearest REPSI token
  in `app/web/DESIGN.md`. Keep REPSI's brand unless the user asks otherwise.
- Interactions the image implies (tabs, filters, menus, hover, selection) and the data each widget needs.

## 2. Build

- TypeScript, App Router, Tailwind 4 with the CSS variables; follow `repsi-dashboard-ui` and `app/web/AGENTS.md`
  (read the Next 16 docs for any API you use).
- Reuse existing components; extend one with a variant rather than duplicating it. No new UI or icon packages.
- Real interactions and real API calls (`lib/api.ts`). If the endpoint doesn't exist, say so and build it or stub
  clearly at the boundary — never ship fake data as if it were live.
- Images: real assets via `next/image` with `alt`. Never embed a screenshot of the interface itself.
- Include loading, empty, error and disabled states even if the image only shows the happy path.

## 3. Compare and refine

Run the dev server, open the page with the built-in browser or `npx playwright-cli`, screenshot at the reference
width, and compare region by region (alignment, spacing, sizes, colours, hierarchy). Fix differences, then check
375px and dark mode. Report remaining intentional differences (e.g. kept REPSI tokens).

## 4. Verify

`npx eslint <files>`, `npx tsc --noEmit`, and the `web-design-guidelines` review on the changed files.
