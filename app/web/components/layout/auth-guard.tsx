"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { hasAuthSession, getAuthUser } from "@/lib/auth";

import { RepsiBrandLoader } from "@/components/ui/repsi-brand-loader";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Check authentication session
    const isAuthed = hasAuthSession();
    if (!isAuthed) {
      setAuthorized(false);
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. Validate requested workspace slug against authorized user context
    const user = getAuthUser();

    // Owners whose organization isn't set up yet resume onboarding (state is server-side).
    if (user?.onboardingRequired || (user && !user.workspaceSlug && user.role !== "SUPER_ADMIN")) {
      setAuthorized(false);
      router.replace("/onboarding");
      return;
    }
    const storedSlug = typeof window !== "undefined" ? localStorage.getItem("repsi_workspace_slug") : null;
    const authorizedSlug = user?.workspaceSlug || storedSlug;

    const parts = pathname.split("/").filter(Boolean); // e.g. ["apex-fitness", "crm"]
    if (parts.length > 0) {
      const requestedSlug = parts[0];
      const subRoute = parts[1] || "dashboard";

      // Tenant isolation: block accessing another gym's workspace URL
      if (
        user?.role !== "SUPER_ADMIN" &&
        authorizedSlug &&
        requestedSlug !== authorizedSlug
      ) {
        console.warn(`Unauthorized workspace URL attempt: requested '${requestedSlug}', authorized '${authorizedSlug}'`);
        setAuthorized(false);
        const homePath = user?.role === "TRAINER" 
          ? `/${authorizedSlug}/trainer/dashboard`
          : (user?.role === "USER" || user?.role === "MEMBER")
          ? `/${authorizedSlug}/member/dashboard`
          : `/${authorizedSlug}/dashboard`;
        router.replace(homePath);
        return;
      }

      // Role-Based Access Control (RBAC) route guarding
      const role = user?.role?.toUpperCase();

      if (role === "USER" || role === "MEMBER") {
        // Members are restricted to member portal, chat, and profile
        const allowedMemberPrefixes = ["member", "chat", "profile"];
        const isAllowed = allowedMemberPrefixes.some((prefix) => subRoute === prefix || subRoute.startsWith(prefix));
        if (!isAllowed) {
          console.warn(`Member role blocked from owner/trainer route: /${requestedSlug}/${subRoute}`);
          setAuthorized(false);
          router.replace(`/${authorizedSlug || requestedSlug}/member/dashboard`);
          return;
        }
      } else if (role === "TRAINER") {
        // Trainers cannot access owner-only management routes
        const ownerOnlyRoutes = ["crm", "settings", "finance", "memberships", "website", "reports", "superadmin"];
        const isOwnerOnly = ownerOnlyRoutes.includes(subRoute);
        if (isOwnerOnly) {
          console.warn(`Trainer role blocked from owner-only route: /${requestedSlug}/${subRoute}`);
          setAuthorized(false);
          router.replace(`/${authorizedSlug || requestedSlug}/trainer/dashboard`);
          return;
        }
      } else if (role !== "SUPER_ADMIN" && subRoute === "superadmin") {
        setAuthorized(false);
        router.replace(`/${authorizedSlug || requestedSlug}/dashboard`);
        return;
      }
    }

    setAuthorized(true);
  }, [pathname, router]);

  // While checking authorization, render branded loading screen
  if (authorized !== true) {
    return <RepsiBrandLoader showText={false} fullScreen={true} />;
  }

  return <>{children}</>;
}
