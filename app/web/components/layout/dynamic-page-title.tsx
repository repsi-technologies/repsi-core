"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Dedicated mapping of static route titles
const STATIC_TITLES: Record<string, string> = {
  "/": "Repsi",
  "/pricing": "Pricing",
  "/features": "Features",
  "/about": "About",
  "/contact": "Contact",
  "/download": "Download App",
  "/downloads": "Download App",
  "/login": "Sign In",
  "/signup": "Create Account",
  "/forgot-password": "Forgot Password",
  "/reset-password": "Reset Password",
  "/onboarding": "Onboarding",
  "/onboarding/wizard": "Gym Onboarding",
  "/changelog": "Changelog",
  "/careers": "Careers",
  "/privacy": "Privacy Policy",
  "/terms": "Terms of Service",
  "/help": "Help Center",
  "/docs": "Documentation",
  "/blog": "Blog",
  "/dashboard": "Dashboard",
};

// Workspace sub-feature display names
const FEATURE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  members: "Members",
  memberships: "Memberships",
  attendance: "Attendance",
  trainers: "Trainers",
  classes: "Classes",
  workouts: "Workouts",
  payments: "Payments",
  expenses: "Expenses",
  reports: "Reports",
  analytics: "Analytics",
  notifications: "Notifications",
  activity: "Activity",
  settings: "Settings",
  website: "Website Builder",
  machines: "Equipment & Machines",
  crm: "Leads & CRM",
  chat: "Team Chat",
  member: "Member Portal",
  trainer: "Trainer Portal",
};

export function DynamicPageTitle() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    if (pathname === "/") {
      document.title = "Repsi";
      return;
    }

    if (STATIC_TITLES[pathname]) {
      document.title = `${STATIC_TITLES[pathname]} | Repsi`;
      return;
    }

    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) {
      document.title = "Repsi";
      return;
    }

    // SuperAdmin routes: /superadmin/...
    if (segments[0] === "superadmin") {
      const sub = segments[1] ? segments[1].charAt(0).toUpperCase() + segments[1].slice(1) : "Overview";
      document.title = `${sub} | SuperAdmin · Repsi`;
      return;
    }

    // Workspace routes: /[workspace]/[feature]
    const subRoute = segments[1] || "dashboard";
    const titleName = FEATURE_TITLES[subRoute] || (subRoute.charAt(0).toUpperCase() + subRoute.slice(1).replace(/-/g, " "));

    document.title = `${titleName} | Repsi`;
  }, [pathname]);

  return null;
}
