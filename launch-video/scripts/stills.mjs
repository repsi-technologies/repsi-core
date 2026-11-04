// Renders review stills from one bundle: node scripts/stills.mjs <LaunchVertical|LaunchLandscape> <frame> [frame...]
// Writes .tmp/stills/<v|l>-<frame>.png at 40% scale.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [id, ...frames] = process.argv.slice(2);
const out = path.join(root, ".tmp/stills");
mkdirSync(out, { recursive: true });

function browser() {
  if (process.env.REMOTION_BROWSER) return process.env.REMOTION_BROWSER;
  const base = path.join(process.env.LOCALAPPDATA ?? "", "ms-playwright");
  if (!existsSync(base)) return null;
  const dir = readdirSync(base).filter((d) => d.startsWith("chromium_headless_shell-")).sort().reverse()[0];
  return dir ? path.join(base, dir, "chrome-headless-shell-win64", "chrome-headless-shell.exe") : null;
}

const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts") });
const composition = await selectComposition({ serveUrl, id, browserExecutable: browser() });
for (const frame of frames.map(Number)) {
  const file = path.join(out, `${id === "LaunchVertical" ? "v" : "l"}-${frame}.png`);
  await renderStill({ serveUrl, composition, frame, output: file, scale: 0.4, browserExecutable: browser() });
  console.log(file);
}
