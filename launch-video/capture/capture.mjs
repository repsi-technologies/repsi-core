// Captures real REPSI screens from the scratch stack (capture/start-stack.sh + `next dev -p 3100`)
// into public/screens/<id>.png, then writes src/captures.json so the film uses them instead of placeholders.
//
//   node capture/capture.mjs            (BASE_URL defaults to http://localhost:3100)
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const require = createRequire(path.resolve(root, "../app/web/package.json"));
const { chromium } = require("@playwright/test");

const BASE = process.env.BASE_URL || "http://localhost:3100";
const accounts = JSON.parse(readFileSync(path.join(root, ".tmp/accounts.json"), "utf-8"));
const ws = accounts.workspace;
const out = path.join(root, "public/screens");
mkdirSync(out, { recursive: true });

// Desktop shots are 1440x900 at 2x; phone shots are 390x844 at 3x. Ids match src/shots.ts.
const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const SHOTS = [
  { id: "dashboard", as: "owner", device: DESKTOP, url: `/${ws}/dashboard` },
  { id: "members", as: "owner", device: DESKTOP, url: `/${ws}/members` },
  { id: "trainers", as: "owner", device: DESKTOP, url: `/${ws}/trainers` },
  { id: "workouts", as: "owner", device: DESKTOP, url: `/${ws}/workouts` },
  { id: "nutrition", as: "owner", device: DESKTOP, url: `/${ws}/nutrition` },
  { id: "attendance", as: "owner", device: DESKTOP, url: `/${ws}/attendance` },
  { id: "payments", as: "owner", device: DESKTOP, url: `/${ws}/payments` },
  { id: "memberships", as: "owner", device: DESKTOP, url: `/${ws}/memberships` },
  { id: "notifications", as: "owner", device: DESKTOP, url: `/${ws}/notifications` },
  { id: "broadcasts", as: "owner", device: DESKTOP, url: `/${ws}/broadcasts` },
  { id: "member-home", as: "member", device: PHONE, url: `/${ws}/member/dashboard` },
  { id: "member-workout", as: "member", device: PHONE, url: `/${ws}/member/workout` },
  { id: "member-qr", as: "member", device: PHONE, url: `/${ws}/member/qr` },
  { id: "member-trainer", as: "member", device: PHONE, url: `/${ws}/member/trainer` },
  { id: "trainer-home", as: "trainer", device: PHONE, url: `/${ws}/trainer/dashboard` },
  { id: "trainer-clients", as: "trainer", device: PHONE, url: `/${ws}/trainer/clients` },
];

async function signIn(page, account) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email or phone").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 60_000 });
}

const browser = await chromium.launch();
const captured = [];
try {
  for (const role of ["owner", "member", "trainer"]) {
    for (const device of [DESKTOP, PHONE]) {
      const shots = SHOTS.filter((s) => s.as === role && s.device === device);
      if (!shots.length) continue;
      const context = await browser.newContext({ ...device, colorScheme: "dark", locale: "en-IN" });
      // The product's own dark theme (next-themes, storageKey "repsi-theme") matches the film's black grade.
      await context.addInitScript(() => localStorage.setItem("repsi-theme", "dark"));
      const page = await context.newPage();
      await signIn(page, accounts[role]);
      for (const shot of shots) {
        await page.goto(`${BASE}${shot.url}`, { waitUntil: "networkidle", timeout: 90_000 });
        // Let charts and skeletons settle, and keep toasts or the dev overlay out of frame.
        await page.waitForTimeout(2500);
        await page.addStyleTag({ content: "nextjs-portal, [data-sonner-toaster] { display: none !important; }" });
        await page.screenshot({ path: path.join(out, `${shot.id}.png`) });
        captured.push(shot.id);
        console.log(`captured ${shot.id}`);
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  writeFileSync(path.join(root, "src/captures.json"), JSON.stringify(captured, null, 2) + "\n");
}
