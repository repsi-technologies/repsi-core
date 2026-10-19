"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const PUBLIC_PREFIXES = [
  "/",
  "/features",
  "/pricing",
  "/about",
  "/contact",
  "/login",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
  "/how-it-works",
  "/integrations",
  "/tour",
  "/changelog",
  "/solutions",
  "/use-cases",
  "/blog",
  "/guides",
  "/help",
  "/docs",
  "/download",
  "/downloads",
  "/careers",
  "/partners",
  "/privacy",
  "/terms",
  "/compare",
  "/cities",
  "/gym-management-software-india",
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const normalizedPath = pathname.replace(/\/+$/, "") || "/";

    const isPublic = PUBLIC_PREFIXES.some((prefix) => {
      if (prefix === "/") return normalizedPath === "/";
      return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`);
    });

    const hasToken = document.cookie.split("; ").some((row) => row.startsWith("repsi_session="));

    if (normalizedPath === "/dashboard") {
      if (!hasToken) {
        router.replace("/login");
      } else {
        router.replace("/apex-fitness/dashboard");
      }
      return;
    }

    if (!isPublic && !hasToken) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  const normalizedPath = pathname ? (pathname.replace(/\/+$/, "") || "/") : "/";
  const isPublic = PUBLIC_PREFIXES.some((prefix) => {
    if (prefix === "/") return normalizedPath === "/";
    return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`);
  });

  // Show nothing while verifying auth on protected routes to prevent flash of content
  if (!isPublic && authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
