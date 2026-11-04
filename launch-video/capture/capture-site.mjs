// Captures the live public website (https://www.repsi.app, no sign-in) for the film: the first viewport and
// every top-level section of the home page, on desktop (1440 wide at 3x) and phone (390 wide at 3x).
// Writes public/site/{desktop,phone}-*.png.
//
//   node capture/capture-site.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.resolve(root, "../app/web/package.json"));
const { chromium } = require("@playwright/test");

const SITE = process.env.SITE_URL || "https://www.repsi.app";
const out = path.join(root, "public/site");
mkdirSync(out, { recursive: true });

const DEVICES = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
};

const browser = await chromium.launch();
try {
  for (const [name, device] of Object.entries(DEVICES)) {
    const context = await browser.newContext({ ...device, locale: "en-IN" });
    const page = await context.newPage();
    await page.goto(SITE, { waitUntil: "networkidle", timeout: 90_000 });
    // Floating chat and WhatsApp buttons are site chrome, not product; keep them out of frame.
    await page.addStyleTag({ content: "[class*='whatsapp' i], [aria-label*='whatsapp' i], [aria-label*='chat' i][class*='fixed'] { display: none !important; }" });
    // Scroll the whole page once so every in-view animation has played, then return to the top.
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 400) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(out, `${name}-hero.png`) });
    const sections = await page.$$("main > section, main > div > section");
    let i = 0;
    for (const section of sections) {
      const box = await section.boundingBox();
      if (!box || box.height < 200) continue;
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(900);
      await section.screenshot({ path: path.join(out, `${name}-section-${String(++i).padStart(2, "0")}.png`) });
      console.log(`${name} section ${i}: ${Math.round(box.width)}x${Math.round(box.height)}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
