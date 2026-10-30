export function slugToGymName(slug: string): string {
  if (!slug) return "Apex Fitness";
  if (slug === "apex-fitness") return "Apex Fitness";
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export function getWorkspaceFromPath(pathname: string): string {
  if (!pathname) return "apex-fitness";
  const parts = pathname.split("/").filter(Boolean);
  const reserved = [
    "features", "pricing", "about", "contact",
    "login", "signup", "verify-email", "forgot-password", "reset-password",
    "onboarding", "superadmin"
  ];
  if (parts.length > 0 && !reserved.includes(parts[0])) {
    return parts[0];
  }
  return "apex-fitness";
}

/** Workspace-relative path of the signed-in user's own account settings. */
export function accountPathForRole(role: string | null | undefined): string {
  const r = (role || "").toUpperCase();
  if (r === "USER") return "/member/profile";
  if (r === "TRAINER") return "/trainer/profile";
  return "/settings?tab=profile";
}

/** Notification links are stored workspace-relative ("/payments"); make them absolute for routing. */
export function resolveWorkspaceLink(url: string, workspace: string | undefined): string {
  if (!url.startsWith("/") || url.startsWith("//")) return url;
  const absolute = ["/pay", "/superadmin", "/login", "/onboarding", "/help"];
  if (!workspace || absolute.some((a) => url === a || url.startsWith(a + "/") || url.startsWith(a + "?"))) return url;
  if (url === `/${workspace}` || url.startsWith(`/${workspace}/`)) return url;
  return `/${workspace}${url}`;
}

/** Fired after notifications are read so the topbar badge refreshes immediately. */
export const NOTIFICATIONS_CHANGED_EVENT = "repsi:notifications-changed";
