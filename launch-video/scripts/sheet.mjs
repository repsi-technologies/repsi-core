// Tiles review stills into one contact sheet: node scripts/sheet.mjs <out.png> <cols> <still.png...>
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.resolve(root, "../app/web/package.json"));
const { chromium } = require("@playwright/test");

const [out, cols, ...files] = process.argv.slice(2);
const cells = files.map((f) => `<figure><img src="data:image/png;base64,${readFileSync(f).toString("base64")}"><figcaption>${path.basename(f, ".png")}</figcaption></figure>`).join("");
const html = `<body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;padding:6px;font:14px sans-serif">
<style>figure{margin:0}img{width:100%;display:block}figcaption{color:#fff;padding:2px}</style>${cells}</body>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(cols) * 400, height: 600 } });
await page.setContent(html);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
