# Claude Code skills and tools for REPSI

Installed 2026-10-23 on Claude Code 2.1.307. All skills are project skills under `.claude/skills/`, so
they load for anyone who opens this repository in Claude Code. No credentials are involved.

| # | Requested | What was found | Status | Location |
|---|---|---|---|---|
| 1 | Test Skill | No single verifiable upstream: the name matches many unrelated registry entries. Nothing third-party was installed. | **Authored locally** | `.claude/skills/repsi-testing/` |
| 2 | Web Design Guidelines | `web-design-guidelines` by Vercel, in [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines) (MIT). Rules from [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/434b7f91364665f2f733b310ec54809bf8f37937/command.md). | **Installed** (vendored and pinned, with REPSI rules added) | `.claude/skills/web-design-guidelines/` |
| 3 | Awesome Design MD | [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT): DESIGN.md files describing other companies' sites. It has no scripts or packages. | **Configured as a reference** (not vendored). REPSI's own `app/web/DESIGN.md` uses its format. | `.claude/skills/repsi-design-system/`, `app/web/DESIGN.md` |
| 4 | Image to Code | Several registries list the same "image-to-code" text under different authors, and it targets Codex. No original could be confirmed. Nothing third-party was installed. | **Authored locally** | `.claude/skills/repsi-image-to-code/` |
| 5 | Microsoft Playwright CLI | Two different things: (a) **`@playwright/test` 1.64.0**, Microsoft's test framework and its `npx playwright` CLI, used for the e2e suite; (b) **`@playwright/cli` 0.1.22** ([microsoft/playwright-cli](https://github.com/microsoft/playwright-cli), Apache-2.0), a CLI for coding agents. It ships the `playwright-cli` skill. | **Installed** (both, pinned devDependencies of `app/web`). Chromium downloaded. | `app/web/package.json`, `app/web/playwright.config.ts`, `app/web/e2e/`, `.claude/skills/playwright-cli/` |

## Commands used

```bash
cd app/web
npm i -D -E @playwright/test@1.64.0 @playwright/cli@0.1.22
npx playwright install chromium          # Chromium + headless shell into %LOCALAPPDATA%\ms-playwright
cd ../.. && npx playwright-cli install --skills   # wrote .claude/skills/playwright-cli and a .gitignore entry
```

`web-design-guidelines` was fetched at a pinned commit with `curl` and read before vendoring. It has
no scripts. The agent CLI depends on its own pre-release `playwright` build
(`1.64.0-alpha-1790635538000`); `@playwright/test` uses the stable 1.64.0. Both can be installed side by side.

## How to use them from Claude Code

| Skill | Invoke | Typical use |
|---|---|---|
| `repsi-testing` | `/repsi-testing`, or automatic when writing tests | Write the failing test first, then pytest or Playwright coverage for roles and tenancy |
| `repsi-verify` (existing) | `/repsi-verify all` | Run pytest, lint, tsc and build, and report honestly |
| `web-design-guidelines` | `/web-design-guidelines app/web/features/reports/*.tsx` | Accessibility and UX review, `file:line` findings |
| `repsi-design-system` | automatic for `app/web/**` | Keep new screens on REPSI tokens and components |
| `repsi-image-to-code` | paste a screenshot and ask to build it | Mockup to responsive component, compared against the reference |
| `playwright-cli` | `/playwright-cli`, or `npx playwright-cli open http://localhost:3000` | Drive a browser for exploratory checks and screenshots |

Run the e2e suite: `cd app/web && npx playwright test` (or `npm run test:e2e`). Debug with
`--headed` and `--trace on`, then `npx playwright show-report`.

## Updating

- Playwright: bump both pinned versions in `app/web/package.json`, `npm i`, `npx playwright install chromium`,
  then `npx playwright-cli install --skills` and review the diff in `.claude/skills/playwright-cli/`.
- Web Interface Guidelines: re-fetch `command.md` at a new commit into
  `.claude/skills/web-design-guidelines/references/`, review the diff, and update the sha in the SKILL.md frontmatter.
- awesome-design-md: nothing is vendored. Update the pinned sha in `repsi-design-system/SKILL.md` if you want newer entries.

## Security notes

- The Playwright suite only runs against a scratch SQLite database it creates in `app/web/e2e/.tmp`,
  with random passwords for its accounts. It refuses non-SQLite databases and production or staging settings.
- `.playwright-cli/` (agent session output, which can contain cookies) and the e2e scratch folders are gitignored.
- The `playwright-cli` skill allows `Bash(playwright-cli:*)`, `Bash(npx playwright:*)` and
  `Bash(npx --no-install playwright:*)` without prompting. Remove that `allowed-tools` line if you want prompts.
