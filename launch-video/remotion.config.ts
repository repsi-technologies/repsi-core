import { Config } from "@remotion/cli/config";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

// Remotion's own downloaded Chromium can be blocked by Windows Application Control on this machine; the
// headless shell Playwright installs for the web e2e suite runs fine, so prefer it when it is there.
// REMOTION_BROWSER overrides both.
function playwrightHeadlessShell(): string | null {
  const base = path.join(process.env.LOCALAPPDATA ?? "", "ms-playwright");
  if (!existsSync(base)) return null;
  for (const dir of readdirSync(base).filter((d) => d.startsWith("chromium_headless_shell-")).sort().reverse()) {
    const exe = path.join(base, dir, "chrome-headless-shell-win64", "chrome-headless-shell.exe");
    if (existsSync(exe)) return exe;
  }
  return null;
}

Config.setBrowserExecutable(process.env.REMOTION_BROWSER || playwrightHeadlessShell());
Config.setVideoImageFormat("png");
Config.setPixelFormat("yuv420p");
Config.setConcurrency(4);
