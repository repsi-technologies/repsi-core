/**
 * Typed client for REPSI authentication, onboarding and organization endpoints.
 * All verification (OTP, passwords, Google tokens, invitations) happens on the backend;
 * this module only sends requests and stores the session the backend issues.
 */
import { getAuthCookie, loginSession, type AuthUser } from "@/lib/auth";

import { API_BASE } from "@/lib/api-base";

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface ValidationItem {
  loc?: (string | number)[];
  msg?: string;
}

function parseError(status: number, body: unknown): ApiError {
  const detail = (body as { detail?: unknown })?.detail;
  if (typeof detail === "string") return new ApiError(status, detail);
  if (Array.isArray(detail)) {
    const fields: Record<string, string> = {};
    for (const item of detail as ValidationItem[]) {
      const loc = (item.loc || []).filter((p) => p !== "body");
      const key = loc.map(String).join(".") || "form";
      const msg = (item.msg || "Invalid value").replace(/^Value error, /, "");
      if (!fields[key]) fields[key] = msg;
    }
    const first = Object.values(fields)[0] || "Please check the highlighted fields.";
    return new ApiError(status, first, fields);
  }
  if (status === 429) return new ApiError(status, "Too many attempts. Please wait a moment and try again.");
  if (status >= 500) return new ApiError(status, "Something went wrong on our side. Please try again.");
  return new ApiError(status, "Request failed. Please try again.");
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("repsi_auth_token") || getAuthCookie();
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; form?: FormData; auth?: boolean; token?: string | null } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = options.token !== undefined ? options.token : options.auth === false ? null : getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (options.form) {
    body = options.form;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { method: options.method || "GET", headers, body });
  } catch {
    throw new ApiError(0, "Can't reach REPSI right now. Check your connection and try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw parseError(res.status, data);
  return data as T;
}

export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  if (path.startsWith("/api/v1")) {
    return API_BASE.startsWith("http") ? API_BASE.replace(/\/api\/v1$/, "") + path : path;
  }
  return path;
}

// ─── Types ────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role?: string | null;
  workspace_id?: string | null;
  workspace_slug?: string | null;
  gym_name?: string | null;
  gym_logo_url?: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  onboarding_required: boolean;
  is_superadmin: boolean;
}

export interface SessionToken {
  access_token: string;
  refresh_token?: string | null;
  role?: string | null;
  workspace_id?: string | null;
  workspace_slug?: string | null;
  gym_name?: string | null;
  gym_logo_url?: string | null;
  user?: SessionUser | null;
  next_path?: string | null;
  onboarding_required?: boolean;
}

export interface OtpRequestResult {
  phone: string;
  expires_in: number;
  resend_in: number;
  channel: string;
  test_mode: boolean;
}

export interface SignupOtpsResult {
  phone: string;
  email: string;
  phone_resend_in: number;
  email_resend_in: number;
  phone_expires_in: number;
  email_expires_in: number;
  test_mode: boolean;
}

export interface OtpVerifyResult {
  status: "authenticated" | "registration_required";
  token?: SessionToken;
  registration_token?: string;
  phone: string;
}

export interface IdentitySummary {
  email: string;
  email_verified: boolean;
  has_password: boolean;
  phone?: string | null;
  phone_verified: boolean;
  google_linked: boolean;
  google_email?: string | null;
}

export interface DayHours {
  closed: boolean;
  open?: string | null;
  close?: string | null;
}
export type OpeningHours = Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", DayHours>;

export interface OrganizationProfile {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  business_email?: string | null;
  phone?: string | null;
  gym_type?: string | null;
  business_types: string[];
  business_size?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  country?: string | null;
  timezone?: string | null;
  currency?: string | null;
  locale?: string | null;
  opening_hours?: OpeningHours | null;
  closed_dates: { date: string; label: string }[];
  onboarding_completed: boolean;
  onboarding_step: number;
  can_edit: boolean;
  can_rename: boolean;
  rename_message?: string | null;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  phone?: string | null;
  email?: string | null;
  timezone?: string | null;
  opening_hours?: OpeningHours | null;
  is_primary: boolean;
  is_active: boolean;
  member_count: number;
}

export interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: string;
  is_active: boolean;
  branch_ids: string[];
  all_branches: boolean;
  is_self: boolean;
  joined_at?: string | null;
}

export interface Invitation {
  id: string;
  workspace_id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: "member" | "trainer" | "staff" | "manager" | "admin";
  status: "pending" | "accepted" | "expired" | "revoked";
  expires_at: string;
  created_at: string;
  accepted_at?: string | null;
  branch_ids: string[];
  invited_by_name?: string | null;
}

export interface OnboardingState {
  has_workspace: boolean;
  workspace_id?: string | null;
  workspace_slug?: string | null;
  onboarding_completed: boolean;
  current_step: "business" | "preferences" | "branches" | "team" | "launch";
  steps: Record<string, boolean>;
  profile?: OrganizationProfile | null;
  branches: Branch[];
  user: { id: string; full_name: string; email: string; phone?: string | null; next_path: string };
}

/** sessionStorage key holding a verified-phone sign-up ticket between login and signup. */
export const SIGNUP_TICKET_KEY = "repsi_signup_ticket";

// ─── Session handling ─────────────────────────────────────────────────

/** Stores the backend-issued session and returns where the user should go next. */
export function applySession(token: SessionToken): string {
  const u = token.user;
  const slug = token.workspace_slug || u?.workspace_slug || "";
  const logoUrl = token.gym_logo_url || u?.gym_logo_url || "";
  if (typeof window !== "undefined") {
    if (logoUrl) {
      localStorage.setItem("repsi_gym_logo", logoUrl);
    } else {
      localStorage.removeItem("repsi_gym_logo");
    }
  }
  const authUser: AuthUser = {
    id: u?.id || "",
    name: u?.full_name || u?.email || "",
    email: u?.email || "",
    role: ((token.role || u?.role || "USER") as AuthUser["role"]),
    workspaceSlug: slug || undefined,
    gymName: token.gym_name || u?.gym_name || undefined,
    gymLogoUrl: logoUrl || undefined,
    onboardingRequired: Boolean(token.onboarding_required),
  };
  loginSession(token.access_token, authUser, slug, token.refresh_token);
  return token.next_path || (slug ? `/${slug}/dashboard` : "/onboarding");
}

/** Only allow same-site relative redirects (prevents open redirects via ?redirect=). */
export function safeRedirect(target: string | null | undefined): string | null {
  if (!target || !target.startsWith("/") || target.startsWith("//")) return null;
  if (target.startsWith("/login") || target.startsWith("/signup")) return null;
  return target;
}

// ─── Endpoints ────────────────────────────────────────────────────────

export const authApi = {
  login: (identifier: string, password: string, country?: string) =>
    apiRequest<SessionToken>("/auth/login", { method: "POST", auth: false, body: { email: identifier, password, country } }),
  google: (token: string) => apiRequest<SessionToken>("/auth/google", { method: "POST", auth: false, body: { token } }),
  requestOtp: (phone: string, country: string) =>
    apiRequest<OtpRequestResult>("/auth/otp/request", { method: "POST", auth: false, body: { phone, country, purpose: "auth" } }),
  verifyOtp: (phone: string, country: string, code: string) =>
    apiRequest<OtpVerifyResult>("/auth/otp/verify", { method: "POST", auth: false, body: { phone, country, code } }),
  requestSignupOtps: (full_name: string, email: string, phone: string, country: string) =>
    apiRequest<SignupOtpsResult>("/auth/signup/request-otps", {
      method: "POST",
      auth: false,
      body: { full_name, email, phone, country },
    }),
  requestEmailOtp: (email: string) =>
    apiRequest<{ email: string; expires_in: number; resend_in: number; test_mode: boolean }>("/auth/email-otp/request", {
      method: "POST",
      auth: false,
      body: { email, purpose: "auth" },
    }),
  signup: (payload: {
    full_name: string;
    email: string;
    password: string;
    registration_token?: string;
    phone?: string;
    country?: string;
    phone_code?: string;
    email_code?: string;
  }) =>
    apiRequest<SessionToken>("/auth/signup", { method: "POST", auth: false, body: payload }),
  session: (workspace?: string) =>
    apiRequest<SessionToken>(`/auth/session${workspace ? `?workspace=${encodeURIComponent(workspace)}` : ""}`),
  me: () => apiRequest<SessionUser>("/auth/me"),
  updateProfile: (full_name: string) => apiRequest<SessionUser>("/auth/me", { method: "PUT", body: { full_name } }),
  identities: () => apiRequest<IdentitySummary>("/auth/me/identities"),
  linkGoogle: (token: string) => apiRequest<IdentitySummary>("/auth/me/identities/google", { method: "POST", body: { token } }),
  unlinkGoogle: () => apiRequest<IdentitySummary>("/auth/me/identities/google", { method: "DELETE" }),
  requestLinkPhoneOtp: (phone: string, country: string) =>
    apiRequest<OtpRequestResult>("/auth/me/phone/request-otp", { method: "POST", body: { phone, country, purpose: "link" } }),
  verifyLinkPhone: (phone: string, country: string, code: string) =>
    apiRequest<IdentitySummary>("/auth/me/phone/verify", { method: "POST", body: { phone, country, code } }),
  changePassword: (current_password: string | null, new_password: string) =>
    apiRequest<{ message: string }>("/auth/me/password", { method: "PUT", body: { current_password, new_password } }),
  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>("/auth/forgot-password", { method: "POST", auth: false, body: { email } }),
  resetPassword: (token: string, new_password: string) =>
    apiRequest<SessionToken>("/auth/reset-password", { method: "POST", auth: false, body: { token, new_password } }),
};

export interface BusinessProfileInput {
  name: string;
  slug?: string;
  business_email?: string;
  phone: string;
  phone_country: string;
  gym_type?: string;
  business_types: string[];
  business_size?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country_code: string;
  country?: string;
}

export interface PreferencesInput {
  timezone: string;
  currency: string;
  locale: string;
  opening_hours: OpeningHours;
  closed_dates: { date: string; label: string }[];
}

export type BranchInput = Partial<Omit<Branch, "id" | "is_active" | "member_count">> & {
  name: string;
  phone_country?: string;
};

export const orgApi = {
  onboardingState: () => apiRequest<OnboardingState>("/onboarding/state"),
  saveBusiness: (data: BusinessProfileInput) =>
    apiRequest<{ created: boolean; state: OnboardingState; session: SessionToken }>("/onboarding/business", { method: "PUT", body: data }),
  savePreferencesOnboarding: (data: PreferencesInput) =>
    apiRequest<OnboardingState>("/onboarding/preferences", { method: "PUT", body: data }),
  advance: (step: "branches" | "team") => apiRequest<OnboardingState>("/onboarding/advance", { method: "POST", body: { step } }),
  complete: (chosen_plan?: string) =>
    apiRequest<{ workspace_slug: string; session: SessionToken }>("/onboarding/complete", { method: "POST", body: { chosen_plan } }),

  profile: () => apiRequest<OrganizationProfile>("/organization"),
  updateProfile: (data: BusinessProfileInput) => apiRequest<OrganizationProfile>("/organization/profile", { method: "PUT", body: data }),
  updatePreferences: (data: PreferencesInput) => apiRequest<OrganizationProfile>("/organization/preferences", { method: "PUT", body: data }),
  uploadLogo: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiRequest<OrganizationProfile>("/organization/logo", { method: "POST", form });
    if (typeof window !== "undefined" && res?.logo_url) {
      localStorage.setItem("repsi_gym_logo", res.logo_url);
      window.dispatchEvent(new CustomEvent("repsi_logo_updated", { detail: res.logo_url }));
    }
    return res;
  },
  removeLogo: async () => {
    const res = await apiRequest<OrganizationProfile>("/organization/logo", { method: "DELETE" });
    if (typeof window !== "undefined") {
      localStorage.removeItem("repsi_gym_logo");
      window.dispatchEvent(new CustomEvent("repsi_logo_updated", { detail: null }));
    }
    return res;
  },

  branches: (includeInactive = false) => apiRequest<Branch[]>(`/branches${includeInactive ? "?include_inactive=true" : ""}`),
  createBranch: (data: BranchInput) => apiRequest<Branch>("/branches", { method: "POST", body: data }),
  updateBranch: (id: string, data: BranchInput) => apiRequest<Branch>(`/branches/${id}`, { method: "PUT", body: data }),
  setBranchActive: (id: string, active: boolean) =>
    apiRequest<Branch>(`/branches/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" }),

  team: () => apiRequest<TeamMember[]>("/team"),
  updateTeamMember: (id: string, data: { role?: string; branch_ids?: string[]; is_active?: boolean }) =>
    apiRequest<TeamMember>(`/team/${id}`, { method: "PUT", body: data }),

  invitations: () => apiRequest<Invitation[]>("/invitations"),
  invite: (data: { name: string; email: string; phone?: string; phone_country?: string; role: Invitation["role"]; branch_ids: string[]; specialization?: string }) =>
    apiRequest<Invitation>("/invitations", { method: "POST", body: data }),
  revokeInvitation: (id: string) => apiRequest<Invitation>(`/invitations/${id}/revoke`, { method: "POST" }),
  resendInvitation: (id: string) => apiRequest<Invitation>(`/invitations/${id}/resend`, { method: "POST" }),
};

export const DAY_LABELS: { key: keyof OpeningHours; label: string; short: string }[] = [
  { key: "mon", label: "Monday", short: "Mon" },
  { key: "tue", label: "Tuesday", short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday", short: "Thu" },
  { key: "fri", label: "Friday", short: "Fri" },
  { key: "sat", label: "Saturday", short: "Sat" },
  { key: "sun", label: "Sunday", short: "Sun" },
];

export function defaultHours(): OpeningHours {
  const open = { closed: false, open: "06:00", close: "22:00" };
  return { mon: open, tue: open, wed: open, thu: open, fri: open, sat: { closed: false, open: "07:00", close: "20:00" }, sun: { closed: true } };
}
