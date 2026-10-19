"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { RepsiBrandLoader } from "@/components/ui/repsi-brand-loader";

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

  // Show signature R loading screen while verifying auth on protected routes
  if (!isPublic && authorized === null) {
    return <RepsiBrandLoader message="Preparing your workspace..." fullScreen={true} />;
  }

  return <>{children}</>;
}
