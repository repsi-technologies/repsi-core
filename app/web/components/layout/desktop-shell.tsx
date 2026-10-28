"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isDesktopApp } from "@/lib/saas-billing";

// Marketing pages (the (marketing) route group). Privacy and terms stay reachable from the sign-in footer.
const MARKETING_PREFIXES = [
  "/about", "/blog", "/careers", "/changelog", "/cities", "/compare", "/contact", "/docs", "/download",
  "/downloads", "/features", "/gym-management-software-india", "/guides", "/help", "/how-it-works",
  "/integrations", "/partners", "/pricing", "/solutions", "/tour", "/use-cases",
];

function isMarketingPath(path: string): boolean {
  const p = path.replace(/\/+$/, "") || "/";
  return p === "/" || MARKETING_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

/**
 * Inside the REPSI desktop (Tauri) shell the app behaves like the mobile app: it opens on sign-in,
 * never shows the marketing site, and has no browser right-click menu outside text fields.
 */
export function DesktopShell() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isDesktopApp()) return;
    document.documentElement.dataset.shell = "desktop";
    const onContextMenu = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, [contenteditable='true']")) return;
      e.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, []);

  useEffect(() => {
    if (pathname && isDesktopApp() && isMarketingPath(pathname)) router.replace("/login");
  }, [pathname, router]);

  return null;
}
