// Captures the signed-in REPSI product from the live site. It opens a visible browser at the login page and
// waits for YOU to sign in (the script never sees or types a password). Use the demo / sales workspace, not
// a real gym: everything on screen ends up in a public video.
// Writes public/screens/<id>.png and src/captures.json.
//
//   node capture/capture-live.mjs          (SITE_URL defaults to https://www.repsi.app)
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.resolve(root, "../app/web/package.json"));
const { chromium } = require("@playwright/test");

const SITE = process.env.SITE_URL || "https://www.repsi.app";
const out = path.join(root, "public/screens");
mkdirSync(out, { recursive: true });

// Owner screens, desktop at 2x and phone width at 3x. Ids match src/shots.ts.
const DESKTOP = ["dashboard", "members", "trainers", "workouts", "nutrition", "attendance", "payments", "memberships",
  "notifications", "broadcasts", "analytics"];
const PHONE = ["dashboard", "attendance", "members", "payments"];

const browser = await chromium.launch({ headless: false, channel: process.env.CAPTURE_CHANNEL || "chrome" });
const captured = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: "en-IN" });
  await context.addInitScript(() => {
    if (!location.pathname.startsWith("/login")) return;
    window.addEventListener("DOMContentLoaded", () => {
      const note = document.createElement("div");
      note.textContent = "REPSI launch video capture: sign in with the DEMO workspace. Screens after sign-in are recorded.";
      note.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99999;padding:10px 16px;background:#E25822;color:#fff;font:600 14px system-ui;text-align:center";
      document.body.appendChild(note);
    });
  });
  const page = await context.newPage();
  await page.goto(`${SITE}/login`);
  console.log("Waiting for you to sign in in the browser window (10 minutes)...");
  await page.waitForURL((url) => !/^\/(login|signup|register|verify)/.test(url.pathname) && url.pathname.split("/").filter(Boolean).length >= 1,
    { timeout: 600_000 });
  await page.waitForLoadState("networkidle");
  const ws = new URL(page.url()).pathname.split("/").filter(Boolean)[0];
  console.log(`Signed in; workspace '${ws}'. Capturing...`);

  async function shoot(target, route, id) {
    await target.goto(`${SITE}/${ws}/${route}`, { waitUntil: "networkidle", timeout: 90_000 }).catch(() => {});
    await target.waitForTimeout(2500);
    await target.addStyleTag({ content: "[data-sonner-toaster], [class*='whatsapp' i] { display: none !important; }" });
    await target.screenshot({ path: path.join(out, `${id}.png`) });
    captured.push(id);
    console.log(`captured ${id}`);
  }
  for (const route of DESKTOP) await shoot(page, route, route);
  await page.setViewportSize({ width: 390, height: 844 });
  // Phone-width shots reuse the signed-in session; device scale stays 2x, which is still 780px wide.
  for (const route of PHONE) await shoot(page, route, `phone-${route}`);
} finally {
  await browser.close();
  writeFileSync(path.join(root, "src/captures.json"), JSON.stringify(captured, null, 2) + "\n");
}
