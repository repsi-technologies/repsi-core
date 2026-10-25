/**
 * Central REPSI SaaS checkout (repsi.app/pay). The backend decides every price, plan and ownership check;
 * this module only sends the owner's choice and renders what the server returns.
 */
import { API_BASE } from "@/lib/api-base";
import { apiRequest, getToken, type SessionToken } from "@/lib/auth-client";

export type BillingCycle = "monthly" | "quarterly" | "half_yearly" | "annual";

export interface SaasPrice {
  billing_cycle: BillingCycle;
  period_months: number;
  currency: string;
  amount_minor: number;
  amount: string;
}

export interface SaasPlan {
  code: string;
  name: string;
  rank: number;
  prices: SaasPrice[];
  limits: Record<string, number>;
  features: Record<string, boolean>;
}

export interface SaasSubscription {
  status: "trialing" | "active" | "grace" | "read_only" | "suspended";
  plan_code: string;
  plan_name: string;
  effective_plan_code: string;
  billing_cycle: BillingCycle | null;
  currency: string;
  trial_ends_at: string | null;
  paid_until: string | null;
  grace_ends_at: string | null;
  cancel_at_period_end: boolean;
  pending_plan_code: string | null;
  pending_billing_cycle: BillingCycle | null;
  is_grandfathered: boolean;
  is_complimentary: boolean;
  has_price_override: boolean;
  can_manage: boolean;
  limits: Record<string, number>;
}

export interface SaasOrder {
  order_ref: string;
  status: "created" | "pending" | "paid" | "failed" | "cancelled" | "expired";
  kind: "new" | "renewal" | "upgrade";
  plan_code: string;
  billing_cycle: BillingCycle;
  amount_minor: number;
  currency: string;
  needs_review: boolean;
  expires_at: string | null;
  payment_session_id: string | null;
  environment: "sandbox" | "production" | null;
  last_attempt_status: "initiated" | "pending" | "success" | "failed" | "abandoned" | null;
  subscription?: SaasSubscription;
}

export interface SaasInvoice {
  id: string;
  invoice_number: string;
  issued_at: string;
  amount_minor: number;
  amount: string;
  currency: string;
  order_ref: string;
  plan_name: string;
  billing_cycle: BillingCycle;
  kind: string;
}

export const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Monthly",
  quarterly: "3 months",
  half_yearly: "6 months",
  annual: "Annual",
};

export function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en", {
    style: "currency",
    currency,
    maximumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
  }).format(amountMinor / 100);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export const saasBillingApi = {
  config: () => apiRequest<{ enabled: boolean; environment: string | null }>("/saas-billing/config", { auth: false }),
  plans: () => apiRequest<SaasPlan[]>("/saas-billing/plans", { auth: false }),
  subscription: () => apiRequest<SaasSubscription>("/saas-billing/subscription"),
  createOrder: (body: { plan_code: string; billing_cycle: BillingCycle; currency: string; idempotency_key: string }) =>
    apiRequest<SaasOrder>("/saas-billing/orders", { method: "POST", body }),
  order: (ref: string) => apiRequest<SaasOrder>(`/saas-billing/orders/${encodeURIComponent(ref)}`),
  invoices: () => apiRequest<SaasInvoice[]>("/saas-billing/invoices"),
  handoff: () => apiRequest<{ url: string; expires_at: string }>("/saas-billing/handoff", { method: "POST" }),
  consumeHandoff: (token: string) =>
    apiRequest<SessionToken>("/saas-billing/handoff/consume", { method: "POST", auth: false, body: { token } }),
  cancel: () => apiRequest<SaasSubscription>("/saas-billing/subscription/cancel", { method: "POST" }),
  resume: () => apiRequest<SaasSubscription>("/saas-billing/subscription/resume", { method: "POST" }),
  scheduleDowngrade: (plan_code: string, billing_cycle: BillingCycle) =>
    apiRequest<SaasSubscription>("/saas-billing/subscription/downgrade", { method: "POST", body: { plan_code, billing_cycle } }),
  cancelDowngrade: () => apiRequest<SaasSubscription>("/saas-billing/subscription/downgrade", { method: "DELETE" }),

  /** Downloads an invoice PDF with the session token; invoice ids alone never authorize anything. */
  async downloadInvoice(invoice: SaasInvoice): Promise<void> {
    const token = getToken();
    const res = await fetch(`${API_BASE}/saas-billing/invoices/${encodeURIComponent(invoice.id)}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Could not download the invoice.");
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoice_number.replaceAll("/", "-")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

interface CashfreeInstance {
  checkout(options: { paymentSessionId: string; redirectTarget?: "_self" | "_blank" | "_top" | "_modal" }): Promise<unknown>;
}
type CashfreeFactory = (options: { mode: "sandbox" | "production" }) => CashfreeInstance;
const cashfreeGlobal = () => (window as unknown as { Cashfree?: CashfreeFactory }).Cashfree;

const CASHFREE_SDK = "https://sdk.cashfree.com/js/v3/cashfree.js";

/** Loads the official Cashfree v3 JS SDK once and redirects to the hosted checkout for this session. */
export async function openCashfreeCheckout(sessionId: string, mode: "sandbox" | "production"): Promise<void> {
  if (!cashfreeGlobal()) {
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${CASHFREE_SDK}"]`);
      const script = existing ?? document.createElement("script");
      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener("error", () => reject(new Error("Could not load the payment page. Check your connection.")), { once: true });
      if (!existing) {
        script.src = CASHFREE_SDK;
        script.async = true;
        document.head.appendChild(script);
      }
    });
  }
  const Cashfree = cashfreeGlobal();
  if (!Cashfree) throw new Error("Payment page unavailable.");
  await Cashfree({ mode }).checkout({ paymentSessionId: sessionId, redirectTarget: "_self" });
}

/** Unique per purchase attempt; a double click reuses it so the server returns the same order. */
export function newIdempotencyKey(): string {
  return `web-${crypto.randomUUID()}`;
}

interface TauriInternals {
  invoke(cmd: string, args?: Record<string, unknown>): Promise<unknown>;
}
const tauri = () => (window as unknown as { __TAURI_INTERNALS__?: TauriInternals }).__TAURI_INTERNALS__;

/** True inside the REPSI desktop (Tauri) shell, where checkout must run in the system browser. */
export function isDesktopApp(): boolean {
  return typeof window !== "undefined" && !!tauri();
}

/** Opens an https URL in the system browser (Tauri opener plugin), or a new tab on the web. */
export async function openExternal(url: string): Promise<void> {
  if (!/^https?:\/\//.test(url)) throw new Error("Refusing to open a non-web URL.");
  const t = tauri();
  if (t) {
    await t.invoke("plugin:opener|open_url", { url });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Desktop app: sign the owner into repsi.app/pay with a single-use, 5-minute handoff link and open it
 * in the system browser. No reusable token ever appears in the URL.
 */
export async function openCheckoutInBrowser(): Promise<void> {
  const { url } = await saasBillingApi.handoff();
  await openExternal(url);
}
