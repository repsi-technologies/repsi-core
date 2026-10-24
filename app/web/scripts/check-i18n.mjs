// Catalogue checks (runs before `npm run build`; exit code 1 on any problem):
//  - exactly the shipped languages (en, ta, ml, hi) have catalogues
//  - every locale has every English key, no extra or empty values, the same {placeholders}
//  - translations are written in their own script (no Malayalam inside Tamil, etc.)
//  - every literal key passed to t("…") / tr("…") in the source exists in en.json
// Usage: npm run i18n:check
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "lib", "i18n", "locales");
const LANGS = ["en", "ta", "ml", "hi"];
const SCRIPTS = { ta: /[஀-௿]/, ml: /[ഀ-ൿ]/, hi: /[ऀ-ॿ]/ };
const load = (code) => JSON.parse(readFileSync(join(dir, `${code}.json`), "utf8"));
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

let problems = 0;
const report = (label, items) => {
  if (!items.length) return;
  problems += items.length;
  console.error(`${label}: ${items.length}\n  ${items.slice(0, 15).join("\n  ")}${items.length > 15 ? "\n  …" : ""}`);
};

const files = readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", "")).sort();
report("unexpected locale files (ship exactly en, ta, ml, hi)", files.filter((f) => !LANGS.includes(f)));
report("missing locale files", LANGS.filter((l) => !files.includes(l)));

const en = load("en");
for (const code of LANGS.filter((l) => l !== "en" && files.includes(l))) {
  const cat = load(code);
  const keys = Object.keys(en);
  const others = Object.entries(SCRIPTS).filter(([c]) => c !== code).map(([, r]) => r);
  report(`${code}: missing keys`, keys.filter((k) => !(k in cat)));
  report(`${code}: extra keys`, Object.keys(cat).filter((k) => !(k in en)));
  report(`${code}: empty values`, keys.filter((k) => k in cat && !String(cat[k]).trim()));
  report(`${code}: placeholder mismatch`, keys.filter((k) => k in cat && placeholders(en[k]) !== placeholders(cat[k])));
  report(`${code}: text in another Indic script`, keys.filter((k) => others.some((r) => r.test(String(cat[k] ?? "")))));
  const own = keys.filter((k) => SCRIPTS[code].test(String(cat[k] ?? ""))).length;
  if (own / keys.length < 0.85) report(`${code}: mostly untranslated`, [`only ${own}/${keys.length} values use the ${code} script`]);
  console.log(`${code}: ${Object.keys(cat).length}/${keys.length} keys`);
}

// Keys referenced from source must exist (a typo would silently show the English fallback or the raw key).
const sourceDirs = ["app", "components", "features", "lib"].map((d) => join(root, d));
const used = new Map();
const walk = (p) => {
  if (statSync(p).isDirectory()) return readdirSync(p).forEach((f) => f !== "node_modules" && walk(join(p, f)));
  if (!/\.(tsx?|mjs)$/.test(p)) return;
  const src = readFileSync(p, "utf8");
  for (const m of src.matchAll(/\b(?:t|tr|translate\(\s*\w+\s*,)\s*\(?\s*["'`]([a-z][a-z0-9_]*\.[A-Za-z0-9_.]+)["'`]/g)) {
    if (!used.has(m[1])) used.set(m[1], relative(root, p));
  }
};
sourceDirs.forEach(walk);
const pluralBase = (k) => k in en || `${k}.one` in en || `${k}.other` in en;
report("keys used in source but missing from en.json", [...used].filter(([k]) => !pluralBase(k)).map(([k, f]) => `${k}  (${f})`));
console.log(`source references: ${used.size}`);

process.exit(problems ? 1 : 0);
