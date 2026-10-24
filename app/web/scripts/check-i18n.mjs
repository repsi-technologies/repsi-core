// Catalogue checks: every locale has every English key, the same {placeholders}, and no empty values.
// Usage: npm run i18n:check   (exit code 1 on any problem)
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "i18n", "locales");
const load = (code) => JSON.parse(readFileSync(join(dir, `${code}.json`), "utf8"));
const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

const en = load("en");
let problems = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "en.json")) {
  const code = file.replace(".json", "");
  const catalogue = load(code);
  const missing = Object.keys(en).filter((k) => !(k in catalogue));
  const extra = Object.keys(catalogue).filter((k) => !(k in en));
  const empty = Object.keys(catalogue).filter((k) => !String(catalogue[k]).trim());
  const badVars = Object.keys(en).filter((k) => k in catalogue && placeholders(en[k]) !== placeholders(catalogue[k]));
  for (const [label, keys] of [["missing", missing], ["extra", extra], ["empty", empty], ["placeholder mismatch", badVars]]) {
    if (keys.length) {
      problems += keys.length;
      console.error(`${code}: ${keys.length} ${label}: ${keys.slice(0, 10).join(", ")}${keys.length > 10 ? " …" : ""}`);
    }
  }
  console.log(`${code}: ${Object.keys(catalogue).length}/${Object.keys(en).length} keys`);
}
process.exit(problems ? 1 : 0);
