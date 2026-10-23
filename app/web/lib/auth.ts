/**
 * REPSI Client Authentication & Session Management
 *
 * Manages user sessions, auth cookies, tokens, and sign-out logic.
 * Integrated with Next.js middleware and FastAPI backend.
 */

import { API_BASE } from "@/lib/api-base";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "TRAINER" | "STAFF" | "SUPER_ADMIN" | "USER" | "MEMBER";
  workspaceSlug?: string;
  gymName?: string;
  gymLogoUrl?: string;
  onboardingRequired?: boolean;
}

export function setAuthCookie(token: string, days = 30): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `repsi_session=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = "repsi_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
}

export function getAuthCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )repsi_session=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function loginSession(token: string, user: AuthUser, workspaceSlug = "", refreshToken?: string | null): void {
  if (typeof window === "undefined") return;
  setAuthCookie(token);
  localStorage.setItem("repsi_auth_token", token);
  if (refreshToken) localStorage.setItem("repsi_refresh_token", refreshToken);
  localStorage.setItem("repsi_user", JSON.stringify(user));
  if (workspaceSlug) localStorage.setItem("repsi_workspace_slug", workspaceSlug);
  else localStorage.removeItem("repsi_workspace_slug");
}

let refreshing: Promise<boolean> | null = null;

/**
 * Exchanges the stored refresh token for a new access token (the server rotates both).
 * Concurrent callers share one request. Returns false when the session can't be renewed.
 */
export function refreshAccessToken(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const refreshToken = localStorage.getItem("repsi_refresh_token");
  if (!refreshToken) return Promise.resolve(false);
  refreshing ??= fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken, workspace: localStorage.getItem("repsi_workspace_slug") || undefined }),
  })
    .then(async (res) => {
      if (!res.ok) {
        localStorage.removeItem("repsi_refresh_token");
        return false;
      }
      const data = await res.json();
      setAuthCookie(data.access_token);
      localStorage.setItem("repsi_auth_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("repsi_refresh_token", data.refresh_token);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function logoutSession(): Promise<void> {
  // 1. Attempt backend invalidation
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("repsi_auth_token") : null;
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (err) {
    console.warn("Backend logout endpoint unavailable, proceeding with client purge", err);
  }

  // 2. Clear all local authentication credentials, wipe storage, and reset theme to default (light)
  clearAuthCookie();
  if (typeof window !== "undefined") {
    try {
      document.documentElement.classList.remove("dark");
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.style.colorScheme = "light";
    } catch {
      // Ignore DOM manipulation errors if any
    }

    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (err) {
      console.warn("Failed to clear browser storage on logout", err);
    }

    window.dispatchEvent(new Event("repsi_logout_event"));
  }

  // 3. Hard redirect to /login to ensure all memory states and client trees flush completely
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export function hasAuthSession(): boolean {
  if (typeof window === "undefined") return false;
  const cookie = getAuthCookie();
  const token = localStorage.getItem("repsi_auth_token");
  return Boolean(cookie || token);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const userJson = localStorage.getItem("repsi_user");
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}
