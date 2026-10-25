"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Dumbbell,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PayCard, PayError, PayLoading, SignInPrompt } from "@/components/pay/pay-ui";
import { ApiError, getToken } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  CYCLE_LABELS,
  formatDate,
  formatMoney,
  newIdempotencyKey,
  openCashfreeCheckout,
  saasBillingApi,
  type BillingCycle,
  type SaasOrder,
  type SaasPlan,
  type SaasSubscription,
} from "@/lib/saas-billing";

const CYCLES: BillingCycle[] = ["monthly", "quarterly", "half_yearly", "annual"];

const CYCLE_CONFIG: Record<
  BillingCycle,
  { label: string; sublabel: string; badge?: string; months: number }
> = {
  monthly: { label: "Monthly", sublabel: "Billed monthly", months: 1 },
  quarterly: { label: "3 Months", sublabel: "Billed quarterly", badge: "Save 10%", months: 3 },
  half_yearly: { label: "6 Months", sublabel: "Billed every 6 months", badge: "Save 25%", months: 6 },
  annual: { label: "Annual", sublabel: "Billed annually", badge: "Save 35%", months: 12 },
};

const LIMIT_LABELS: [string, string][] = [
  ["members", "members"],
  ["trainers", "trainers"],
  ["staff", "staff logins"],
  ["branches", "branches"],
];

const FEATURE_LABELS: Record<string, string> = {
  member_management: "Member Management",
  qr_attendance: "QR Code Attendance Check-in",
  payment_records: "Payment Tracking & Invoices",
  basic_workouts: "Workout Library",
  basic_dashboard: "Operations Dashboard",
  membership_reminders: "Membership Reminders",
  data_export: "Data Export",
  trainer_management: "Trainer Management",
  ai_assistant: "Repsi AI Assistant",
  ai_workouts: "AI Workout Generator",
  member_portal: "Member Mobile & Web Portal",
  growth_analytics: "Growth Analytics",
  ai_insights: "AI Churn & Attendance Insights",
  member_broadcasts: "WhatsApp & Email Broadcasts",
  structured_workouts: "Structured Workout Splits",
  diet_plans: "Diet & Nutrition Templates",
  sales_crm: "Lead Management CRM",
  multi_branch: "Multi-branch Management",
  advanced_analytics: "Advanced Analytics",
  whatsapp_automation: "Automated WhatsApp Alerts",
  custom_domain: "Custom Domain & White-label",
  api_access: "API Access",
};

interface DowngradeAddon {
  id: string;
  name: string;
  resource: "trainers" | "members" | "staff" | "branding";
  capacityBonus: number;
  unitLabel: string;
  priceMinor: number;
  priceLabel: string;
  benefit: string;
}

const DOWNGRADE_ADDONS: DowngradeAddon[] = [
  {
    id: "addon_trainers",
    name: "Trainer Capacity Pack (+5)",
    resource: "trainers",
    capacityBonus: 5,
    unitLabel: "trainers",
    priceMinor: 19900,
    priceLabel: "₹199 / mo",
    benefit: "Keeps 5 extra trainer slots active without upgrading to a higher tier.",
  },
  {
    id: "addon_members",
    name: "Member Expansion (+50)",
    resource: "members",
    capacityBonus: 50,
    unitLabel: "members",
    priceMinor: 29900,
    priceLabel: "₹299 / mo",
    benefit: "Expands gym capacity by 50 active members for growing branch traffic.",
  },
  {
    id: "addon_staff",
    name: "Staff Logins Pack (+3)",
    resource: "staff",
    capacityBonus: 3,
    unitLabel: "staff logins",
    priceMinor: 14900,
    priceLabel: "₹149 / mo",
    benefit: "Maintains 3 front-desk and manager logins for shift coverage.",
  },
  {
    id: "addon_branding",
    name: "Custom Branding & Domain",
    resource: "branding",
    capacityBonus: 1,
    unitLabel: "custom portal",
    priceMinor: 29900,
    priceLabel: "₹299 / mo",
    benefit: "Retains custom gym domain, white-label member portal, and branded receipts.",
  },
];

function limitText(n: number | undefined, label: string) {
  if (n === undefined) return null;
  return n < 0 ? `Unlimited ${label}` : `${n} ${label}`;
}

export default function SubscribePage() {
  const gstinInputId = useId();
  const [state, setState] = useState<"loading" | "signin" | "ready" | "error">("loading");
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [sub, setSub] = useState<SaasSubscription | null>(null);
  const [planCode, setPlanCode] = useState("growth");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [order, setOrder] = useState<SaasOrder | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [gstin, setGstin] = useState("");
  const [showWhatChanges, setShowWhatChanges] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const keyRef = useRef<{ sel: string; key: string } | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      if (!getToken()) return setState("signin");
      const [p, s] = await Promise.all([saasBillingApi.plans(), saasBillingApi.subscription()]);
      setPlans(p);
      setSub(s);
      const query = new URLSearchParams(window.location.search);
      const wanted = query.get("plan");
      if (wanted && p.some((x) => x.code === wanted)) setPlanCode(wanted);
      else if (s.status !== "trialing" && p.some((x) => x.code === s.plan_code)) setPlanCode(s.plan_code);
      const wantedCycle = query.get("cycle") as BillingCycle | null;
      if (wantedCycle && CYCLES.includes(wantedCycle)) setCycle(wantedCycle);
      else if (s.billing_cycle) setCycle(s.billing_cycle);
      setState("ready");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return setState("signin");
      setError(e instanceof Error ? e.message : "Could not load plans.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state === "loading") return <PayLoading label="Loading plans…" />;
  if (state === "signin") return <SignInPrompt redirect="/pay/subscribe" />;
  if (state === "error" || !sub) return <div className="mt-10"><PayError message={error} retry={load} /></div>;
  if (!sub.can_manage)
    return (
      <PayCard className="max-w-md mx-auto mt-10 text-center">
        <h1 className="text-xl font-semibold">Only the gym owner can subscribe</h1>
        <Link href="/pay" className="mt-4 inline-block underline text-sm">Back to billing</Link>
      </PayCard>
    );

  const current = plans.find((p) => p.code === sub.plan_code);
  const selected = plans.find((p) => p.code === planCode);
  const price = selected?.prices.find((p) => p.billing_cycle === cycle && p.currency === "INR");
  const isActivePaid = sub.status === "active" && !sub.is_complimentary && !!sub.paid_until;
  const isLowerTier = !!current && !!selected && selected.rank < current.rank;
  const isDowngrade = isActivePaid && isLowerTier;
  const isUpgrade = isActivePaid && !!current && !!selected && selected.rank > current.rank;
  const isCurrentPlan = sub.status !== "trialing" && selected?.code === sub.plan_code;

  // Capacity & availability checks against live usage
  const liveUsage = sub.usage || {};
  const currentTrainers = liveUsage.trainers ?? 0;
  const currentMembers = liveUsage.members ?? 0;
  const currentStaff = liveUsage.staff ?? 0;

  const targetTrainerLimit = selected?.limits?.trainers ?? -1;
  const targetMemberLimit = selected?.limits?.members ?? -1;
  const targetStaffLimit = selected?.limits?.staff ?? -1;

  // Bonus from selected add-ons
  const hasTrainerAddon = selectedAddons.includes("addon_trainers");
  const hasMemberAddon = selectedAddons.includes("addon_members");
  const hasStaffAddon = selectedAddons.includes("addon_staff");

  const bonusTrainers = hasTrainerAddon ? 5 : 0;
  const bonusMembers = hasMemberAddon ? 50 : 0;
  const bonusStaff = hasStaffAddon ? 3 : 0;

  const effectiveTrainerLimit = targetTrainerLimit >= 0 ? targetTrainerLimit + bonusTrainers : -1;
  const effectiveMemberLimit = targetMemberLimit >= 0 ? targetMemberLimit + bonusMembers : -1;
  const effectiveStaffLimit = targetStaffLimit >= 0 ? targetStaffLimit + bonusStaff : -1;

  // Violations
  const trainersExceeded = effectiveTrainerLimit >= 0 && currentTrainers > effectiveTrainerLimit;
  const membersExceeded = effectiveMemberLimit >= 0 && currentMembers > effectiveMemberLimit;
  const staffExceeded = effectiveStaffLimit >= 0 && currentStaff > effectiveStaffLimit;
  const hasBlockingViolation = isLowerTier && (trainersExceeded || membersExceeded || staffExceeded);

  // Lost features (human-friendly labels, deduplicated analytics)
  const rawLostFeatures = isLowerTier && current && selected
    ? Object.keys(current.features).filter((k) => current.features[k] && !selected.features[k])
    : [];

  const lostFeatures = rawLostFeatures
    .filter((f) => !(f === "growth_analytics" && rawLostFeatures.includes("advanced_analytics")))
    .map((k) => FEATURE_LABELS[k] || k.replaceAll("_", " "));

  // Pricing math (Line items: Plan, each add-on, Subtotal, GST 18%, Total due today)
  const basePriceMinor = price?.amount_minor ?? 0;
  const currentPlanPrice = current?.prices.find((p) => p.billing_cycle === cycle && p.currency === "INR");

  const addonTotalMinor = selectedAddons.reduce((sum, id) => {
    const item = DOWNGRADE_ADDONS.find((a) => a.id === id);
    return sum + (item ? item.priceMinor : 0);
  }, 0);

  const subtotalMinor = basePriceMinor + addonTotalMinor;
  const gstMinor = Math.round(subtotalMinor * 0.18);
  const totalWithGstMinor = subtotalMinor + gstMinor;

  // Monthly savings calculation vs current plan
  const currentTotalMonthlyMinor = currentPlanPrice ? Math.round(currentPlanPrice.amount_minor / (CYCLE_CONFIG[cycle].months || 1)) : 0;
  const selectedTotalMonthlyMinor = Math.round(subtotalMinor / (CYCLE_CONFIG[cycle].months || 1));
  const monthlySavingsMinor = Math.max(0, currentTotalMonthlyMinor - selectedTotalMonthlyMinor);

  function choose(code: string, c: BillingCycle) {
    setPlanCode(code);
    setCycle(c);
    setOrder(null);
    setError("");
    setInfo("");
  }

  function toggleAddon(id: string) {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function startOrder() {
    if (!selected) return;
    if (hasBlockingViolation) {
      setError("Please resolve resource capacity limits before proceeding.");
      return;
    }
    const sel = `${selected.code}:${isUpgrade ? sub!.billing_cycle : cycle}`;
    if (!keyRef.current || keyRef.current.sel !== sel) keyRef.current = { sel, key: newIdempotencyKey() };
    setBusy(true);
    setError("");
    try {
      const o = await saasBillingApi.createOrder({
        plan_code: selected.code,
        billing_cycle: (isUpgrade ? sub!.billing_cycle : cycle) as BillingCycle,
        currency: "INR",
        idempotency_key: keyRef.current.key,
      });
      if (o.status !== "pending" || !o.payment_session_id) {
        keyRef.current = null;
        throw new Error(o.status === "paid" ? "This order is already paid." : "This checkout expired. Please try again.");
      }
      setOrder(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout.");
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (!order?.payment_session_id || !order.environment) return;
    setBusy(true);
    setError("");
    try {
      await openCashfreeCheckout(order.payment_session_id, order.environment);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open the payment page.");
      setBusy(false);
    }
  }

  async function scheduleDowngrade() {
    if (!selected) return;
    if (hasBlockingViolation) {
      setError("Please resolve capacity limits before scheduling this downgrade.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const s = await saasBillingApi.scheduleDowngrade(selected.code, cycle);
      setSub({ ...s, can_manage: true });
      const addonNote = selectedAddons.length > 0 ? " (Selected capacity add-ons will activate with your plan)" : "";
      setInfo(`${selected.name} scheduled! Takes effect on ${formatDate(s.paid_until)}${addonNote}. You keep full access until then.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not schedule the change.");
    } finally {
      setBusy(false);
    }
  }

  // Next renewal date calculation
  const nextRenewalDate = sub.paid_until ? new Date(sub.paid_until) : new Date();
  if (!sub.paid_until) {
    nextRenewalDate.setMonth(nextRenewalDate.getMonth() + (CYCLE_CONFIG[cycle].months || 1));
  }

  return (
    <div className="mt-4 pb-24 lg:pb-8">
      {/* ─── Breadcrumb & Header ─────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/pay" className="inline-flex items-center text-xs text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
            ← Back to Billing
          </Link>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Subscription & Checkout
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--text-secondary)]">
            Select your gym plan and custom capacity add-ons. Instant activation via Cashfree.
          </p>
        </div>

        {/* ─── Billing Cycle Segmented Control ────────────────────────────── */}
        <div
          role="radiogroup"
          aria-label="Billing cycle"
          className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-xs"
        >
          {CYCLES.map((c) => {
            const isSelected = cycle === c;
            const cfg = CYCLE_CONFIG[c];
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={isUpgrade}
                onClick={() => choose(planCode, c)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] outline-none disabled:opacity-50",
                  isSelected
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--border)]/30",
                )}
              >
                <span>{cfg.label}</span>
                {cfg.badge && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-tight",
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200",
                    )}
                  >
                    {cfg.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Two-Column Desktop Layout ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Plans, Downgrade Notice, Add-ons */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Plan Cards Grid */}
          <section aria-label="Available Plans">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              1. Choose your plan
            </h2>
            <div role="radiogroup" aria-label="Plans" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {plans.map((p) => {
                const pr = p.prices.find((x) => x.billing_cycle === cycle && x.currency === "INR");
                const isSelected = p.code === planCode;
                const isCurrent = sub.status !== "trialing" && p.code === sub.plan_code;
                const isPlanUpgrade = current && p.rank > current.rank;
                const isPlanDowngrade = current && p.rank < current.rank;
                const isEnterprise = p.code === "enterprise";

                // Per-month price calculation
                const perMonthAmount = pr ? Math.round(pr.amount_minor / (CYCLE_CONFIG[cycle].months || 1)) : 0;

                return (
                  <button
                    key={p.code}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => choose(p.code, cycle)}
                    className={cn(
                      "relative text-left rounded-xl border p-4 sm:p-5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] flex flex-col justify-between cursor-pointer",
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--surface)] ring-2 ring-[var(--primary)]/20 shadow-md"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover,var(--primary))]/40 hover:shadow-xs",
                    )}
                  >
                    {/* Top Row: Plan Name & Relationship Badge */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-base text-[var(--text)]">{p.name}</span>
                        <div className="flex items-center gap-1.5">
                          {isCurrent && (
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-800 border border-neutral-200">
                              Current
                            </span>
                          )}
                          {!isCurrent && isPlanUpgrade && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
                              Upgrade
                            </span>
                          )}
                          {!isCurrent && isPlanDowngrade && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                              Downgrade
                            </span>
                          )}
                          {isSelected && (
                            <div className="size-5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center">
                              <Check className="size-3 stroke-[3]" aria-hidden />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price Section: Per-Month + Cycle Total */}
                      <div className="mt-3">
                        {isEnterprise ? (
                          <div>
                            <p className="text-xl font-bold text-[var(--text)]">Custom</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Flexible high-volume pricing</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold tabular-nums text-[var(--text)] tracking-tight">
                                {pr ? formatMoney(perMonthAmount, pr.currency) : "—"}
                              </span>
                              <span className="text-xs font-normal text-[var(--text-secondary)]">/ month</span>
                            </div>
                            <p className="mt-0.5 text-xs text-[var(--text-secondary)] tabular-nums">
                              {CYCLE_CONFIG[cycle].months > 1
                                ? `${CYCLE_CONFIG[cycle].sublabel}: ${pr ? formatMoney(pr.amount_minor, pr.currency) : "—"}`
                                : "Billed monthly"}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Limits & Highlights */}
                      <ul className="mt-4 space-y-1.5 text-xs text-[var(--text-secondary)] border-t border-[var(--border)]/70 pt-3">
                        {LIMIT_LABELS.map(([k, label]) => {
                          const t = limitText(p.limits[k], label);
                          return t ? (
                            <li key={k} className="flex items-center gap-1.5">
                              <Check className="size-3.5 text-[var(--primary)] flex-shrink-0" aria-hidden />
                              <span>{t}</span>
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </div>

                    {isEnterprise && (
                      <div className="mt-4 pt-3 border-t border-[var(--border)]">
                        <a
                          href="mailto:sales@repsi.app?subject=Repsi%20Enterprise%20Inquiry"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
                        >
                          Contact sales for multi-branch <ArrowRight className="size-3" />
                        </a>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ─── Downgrade Warning Alert with Collapsible "What Changes" ───── */}
          {isLowerTier && current && selected && (
            <PayCard className="border-amber-300 bg-amber-50/40 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base text-amber-950">
                        Downgrading from {current.name} to {selected.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-amber-900">
                        Takes effect at the end of your billing cycle on{" "}
                        <strong>{formatDate(sub.paid_until)}</strong>. You keep full access until then. No immediate charges.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowWhatChanges((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                    >
                      {showWhatChanges ? "Hide details" : "What changes"}
                      {showWhatChanges ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    </button>
                  </div>

                  {/* Collapsible Section */}
                  {showWhatChanges && (
                    <div className="pt-3 border-t border-amber-200/80 space-y-4">
                      {/* Capacity rows with Progress Bars & Status */}
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                          Capacity Limits vs Live Usage:
                        </p>

                        {/* Trainers Capacity Row */}
                        <div className="rounded-lg bg-white/90 border border-amber-200 p-3 text-xs shadow-2xs">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="flex items-center gap-1.5 text-neutral-800">
                              <Dumbbell className="size-3.5 text-neutral-600" /> Trainers
                            </span>
                            <span className="tabular-nums">
                              {hasTrainerAddon
                                ? `${targetTrainerLimit} + 5 = ${effectiveTrainerLimit} capacity`
                                : `${currentTrainers} active / ${targetTrainerLimit} limit`}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-2 h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-300",
                                trainersExceeded ? "bg-red-500" : "bg-emerald-500",
                              )}
                              style={{
                                width: `${Math.min(
                                  100,
                                  effectiveTrainerLimit > 0
                                    ? Math.round((currentTrainers / effectiveTrainerLimit) * 100)
                                    : 100,
                                )}%`,
                              }}
                            />
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-neutral-600">
                              Active in gym: <strong className="text-neutral-900">{currentTrainers}</strong>
                            </span>
                            {trainersExceeded ? (
                              <span className="font-semibold text-red-700 rounded-full bg-red-50 px-2 py-0.5 border border-red-200">
                                ⚠️ Needs add-on (exceeds by {currentTrainers - effectiveTrainerLimit})
                              </span>
                            ) : (
                              <span className="font-medium text-emerald-700 rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                                ✓ Fits quota {hasTrainerAddon ? `(1 + 5 = 6)` : ""}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Members Capacity Row */}
                        <div className="rounded-lg bg-white/90 border border-amber-200 p-3 text-xs shadow-2xs">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="flex items-center gap-1.5 text-neutral-800">
                              <Users className="size-3.5 text-neutral-600" /> Members
                            </span>
                            <span className="tabular-nums">
                              {hasMemberAddon
                                ? `${targetMemberLimit} + 50 = ${effectiveMemberLimit} capacity`
                                : `${currentMembers} active / ${targetMemberLimit} limit`}
                            </span>
                          </div>

                          <div className="mt-2 h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-300",
                                membersExceeded ? "bg-red-500" : "bg-emerald-500",
                              )}
                              style={{
                                width: `${Math.min(
                                  100,
                                  effectiveMemberLimit > 0
                                    ? Math.round((currentMembers / effectiveMemberLimit) * 100)
                                    : 100,
                                )}%`,
                              }}
                            />
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-neutral-600">
                              Active in gym: <strong className="text-neutral-900">{currentMembers}</strong>
                            </span>
                            {membersExceeded ? (
                              <span className="font-semibold text-red-700 rounded-full bg-red-50 px-2 py-0.5 border border-red-200">
                                ⚠️ Needs add-on (exceeds by {currentMembers - effectiveMemberLimit})
                              </span>
                            ) : (
                              <span className="font-medium text-emerald-700 rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                                ✓ Fits quota
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Staff Logins Capacity Row */}
                        <div className="rounded-lg bg-white/90 border border-amber-200 p-3 text-xs shadow-2xs">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="flex items-center gap-1.5 text-neutral-800">
                              <Users className="size-3.5 text-neutral-600" /> Staff Logins
                            </span>
                            <span className="tabular-nums">
                              {hasStaffAddon
                                ? `${targetStaffLimit} + 3 = ${effectiveStaffLimit} capacity`
                                : `${currentStaff} active / ${targetStaffLimit} limit`}
                            </span>
                          </div>

                          <div className="mt-2 h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-300",
                                staffExceeded ? "bg-red-500" : "bg-emerald-500",
                              )}
                              style={{
                                width: `${Math.min(
                                  100,
                                  effectiveStaffLimit > 0
                                    ? Math.round((currentStaff / effectiveStaffLimit) * 100)
                                    : 100,
                                )}%`,
                              }}
                            />
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-neutral-600">
                              Active in gym: <strong className="text-neutral-900">{currentStaff}</strong>
                            </span>
                            {staffExceeded ? (
                              <span className="font-semibold text-red-700 rounded-full bg-red-50 px-2 py-0.5 border border-red-200">
                                ⚠️ Needs add-on
                              </span>
                            ) : (
                              <span className="font-medium text-emerald-700 rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                                ✓ Fits quota
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lost Features as clean chips */}
                      {lostFeatures.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-amber-950 uppercase tracking-wider mb-2">
                            Tools removed on {selected.name}:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {lostFeatures.map((feat) => (
                              <span
                                key={feat}
                                className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-900 border border-amber-200/60"
                              >
                                {feat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Data preservation notice */}
                      <div className="rounded-lg bg-amber-100/70 p-3 text-xs text-amber-900 leading-relaxed">
                        <strong className="block text-amber-950 mb-0.5">📦 What happens to your existing data?</strong>
                        Your existing member records, lead lists, diet plans, workout templates, and analytics history will not be deleted.
                        They will be securely archived in read-only mode and fully unlocked if you upgrade in the future.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </PayCard>
          )}

          {/* ─── Capacity Protection Add-ons ─────────────────────────────── */}
          <section aria-label="Add-on capacity packs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  2. Select capacity add-ons (optional)
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Protect trainer slots and member volume without paying for a full plan tier.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {DOWNGRADE_ADDONS.map((addon) => {
                const isSelected = selectedAddons.includes(addon.id);

                // Determine if this specific add-on is recommended based on user's actual violation
                const isRecommended =
                  (addon.resource === "trainers" && currentTrainers > targetTrainerLimit) ||
                  (addon.resource === "members" && currentMembers > targetMemberLimit) ||
                  (addon.resource === "staff" && currentStaff > targetStaffLimit);

                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={cn(
                      "relative rounded-xl border p-4 transition-all text-xs cursor-pointer flex flex-col justify-between select-none",
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--primary)]/[0.03] ring-1 ring-[var(--primary)] shadow-xs"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/40",
                    )}
                  >
                    <div>
                      {/* Checkbox Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={cn(
                              "mt-0.5 size-4 rounded-[4px] border flex items-center justify-center transition-colors",
                              isSelected
                                ? "bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]"
                                : "border-neutral-300 bg-white",
                            )}
                          >
                            {isSelected && <Check className="size-3 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-[var(--text)]">{addon.name}</span>
                            {isRecommended && (
                              <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                Recommended for you
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-sm text-[var(--text)] tabular-nums">{addon.priceLabel}</span>
                      </div>

                      {/* Benefit */}
                      <p className="mt-2 text-[var(--text-secondary)] leading-relaxed pl-6.5">
                        {addon.benefit}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-[var(--border)]/60 pt-2 pl-6.5 text-[11px]">
                      <span className="font-medium text-[var(--primary)]">+{addon.capacityBonus} {addon.unitLabel}</span>
                      <span className={cn("font-medium", isSelected ? "text-[var(--primary)] font-semibold" : "text-[var(--text-secondary)]")}>
                        {isSelected ? "✓ Added" : "Click to add"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ─── Right Column: Sticky Order Summary ─────────────────────────── */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
          <PayCard className="p-5 sm:p-6 shadow-md border-[var(--border)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="text-base font-bold text-[var(--text)]">Order Summary</h2>
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                {CYCLE_CONFIG[cycle].label} billing
              </span>
            </div>

            {error && <div className="mt-3"><PayError message={error} /></div>}
            {info && <p role="status" className="mt-3 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">{info}</p>}

            {!selected || !price ? (
              <p className="mt-4 text-sm text-[var(--text-secondary)]">This plan is not available for that cycle.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {/* Itemized Line Items */}
                <div className="space-y-2.5 text-xs sm:text-sm">
                  {/* Base Plan */}
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text)] font-medium">
                      {selected.name} Plan ({CYCLE_CONFIG[cycle].label})
                    </span>
                    <span className="tabular-nums font-medium text-[var(--text)]">
                      {formatMoney(basePriceMinor, price.currency)}
                    </span>
                  </div>

                  {/* Selected Add-ons itemized */}
                  {selectedAddons.map((id) => {
                    const addon = DOWNGRADE_ADDONS.find((a) => a.id === id);
                    if (!addon) return null;
                    return (
                      <div key={id} className="flex justify-between items-center text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1">
                          <Check className="size-3 text-[var(--primary)]" />
                          {addon.name}
                        </span>
                        <span className="tabular-nums font-medium text-[var(--text)]">
                          {formatMoney(addon.priceMinor, "INR")}
                        </span>
                      </div>
                    );
                  })}

                  {/* Subtotal */}
                  <div className="border-t border-[var(--border)] pt-2 flex justify-between items-center text-xs text-[var(--text-secondary)]">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-semibold text-[var(--text)]">
                      {formatMoney(subtotalMinor, price.currency)}
                    </span>
                  </div>

                  {/* GST (18%) */}
                  <div className="flex justify-between items-center text-xs text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">
                      Goods & Services Tax (GST 18%)
                    </span>
                    <span className="tabular-nums font-semibold text-[var(--text)]">
                      {formatMoney(gstMinor, price.currency)}
                    </span>
                  </div>

                  {/* Savings callout if applicable */}
                  {monthlySavingsMinor > 0 && current && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800 font-medium">
                      ✨ You save {formatMoney(monthlySavingsMinor, "INR")}/mo vs {current.name}
                    </div>
                  )}

                  {/* Total Due Today */}
                  <div className="border-t-2 border-[var(--border)] pt-3 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-bold text-[var(--text)]">Total due today</span>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {isDowngrade ? "Billed at next renewal" : "All taxes & charges included"}
                      </p>
                    </div>
                    <span className="text-xl font-extrabold tabular-nums text-[var(--primary)]">
                      {formatMoney(totalWithGstMinor, price.currency)}
                    </span>
                  </div>
                </div>

                {/* Subscription Metadata & Renewal Date */}
                <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-[var(--border)] p-3 text-[11px] text-[var(--text-secondary)] space-y-1">
                  <div className="flex justify-between">
                    <span>Billing cycle</span>
                    <span className="font-medium text-[var(--text)]">{CYCLE_CONFIG[cycle].label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next renewal date</span>
                    <span className="font-medium text-[var(--text)]">
                      {formatDate(nextRenewalDate.toISOString())}
                    </span>
                  </div>
                  {isUpgrade && sub.paid_until && (
                    <div className="flex justify-between text-blue-700 dark:text-blue-400 font-medium pt-1 border-t border-[var(--border)]">
                      <span>Prorated credit</span>
                      <span>Adjusted for remaining days on {current?.name}</span>
                    </div>
                  )}
                </div>

                {/* Optional GSTIN input for tax invoice */}
                <div>
                  <label htmlFor={gstinInputId} className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                    GSTIN (Optional for tax invoice)
                  </label>
                  <input
                    id={gstinInputId}
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] uppercase font-mono"
                  />
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                    Enter gym GSTIN for input tax credit (ITC) on B2B invoices.
                  </p>
                </div>

                {/* Primary CTA Buttons */}
                <div className="space-y-2 pt-2">
                  {isDowngrade ? (
                    <Button
                      className="w-full h-11 text-sm font-semibold shadow-xs"
                      disabled={busy || hasBlockingViolation}
                      onClick={scheduleDowngrade}
                    >
                      {busy && <Loader2 className="animate-spin mr-2 size-4" aria-hidden />}
                      {hasBlockingViolation ? "Resolve capacity limits above" : `Schedule downgrade to ${selected.name}`}
                    </Button>
                  ) : order ? (
                    <Button
                      className="w-full h-11 text-sm font-semibold shadow-xs bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] flex items-center justify-center gap-1.5"
                      disabled={busy}
                      onClick={pay}
                      aria-label={`Pay ${formatMoney(order.amount_minor, order.currency)} securely`}
                    >
                      {busy ? (
                        <Loader2 className="animate-spin mr-2 size-4" aria-hidden />
                      ) : (
                        <Lock className="size-4" />
                      )}
                      Pay {formatMoney(order.amount_minor, order.currency)} securely
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-11 text-sm font-semibold shadow-xs bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] flex items-center justify-center gap-1.5"
                      disabled={busy || hasBlockingViolation}
                      onClick={startOrder}
                      aria-label="Continue to payment"
                    >
                      {busy ? (
                        <Loader2 className="animate-spin mr-2 size-4" aria-hidden />
                      ) : (
                        <Lock className="size-4" />
                      )}
                      <span className="sr-only">Continue to payment: </span>
                      {hasBlockingViolation
                        ? "Resolve capacity limits above"
                        : `Pay ${formatMoney(totalWithGstMinor, price.currency)} securely`}
                    </Button>
                  )}

                  {/* Keep Current Plan as text link (not competing button) */}
                  {current && (isLowerTier || isUpgrade) && (
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => choose(current.code, cycle)}
                        className="text-xs text-[var(--text-secondary)] hover:text-[var(--text)] underline transition-colors cursor-pointer"
                      >
                        Keep {current.name} (cancel changes)
                      </button>
                    </div>
                  )}
                </div>

                {/* Trust & Payment Security Footer */}
                <div className="border-t border-[var(--border)] pt-4 space-y-2 text-[11px] text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium">
                    <ShieldCheck className="size-4 text-emerald-600 flex-shrink-0" />
                    <span>Secured by Cashfree Payments</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                    <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 font-medium">UPI</span>
                    <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 font-medium">Credit/Debit Cards</span>
                    <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 font-medium">Netbanking</span>
                    <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 font-medium">Wallets</span>
                  </div>

                  <p className="text-[10px] text-[var(--text-muted)] leading-normal pt-1">
                    Cancel anytime without penalty. Immediate tax invoice generated upon successful transaction.
                  </p>
                </div>
              </div>
            )}
          </PayCard>
        </div>
      </div>

      {/* ─── Mobile Sticky Bottom Bar ───────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)] border-t border-[var(--border)] p-4 shadow-xl flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] text-[var(--text-secondary)]">Total due today (incl. GST)</p>
          <p className="text-lg font-bold tabular-nums text-[var(--text)]">
            {price ? formatMoney(totalWithGstMinor, price.currency) : "—"}
          </p>
        </div>
        <div className="flex-1 max-w-[200px]">
          {isDowngrade ? (
            <Button
              className="w-full text-xs font-semibold h-10"
              disabled={busy || hasBlockingViolation}
              onClick={scheduleDowngrade}
            >
              {busy && <Loader2 className="animate-spin mr-1 size-3.5" />}
              Downgrade
            </Button>
          ) : order ? (
            <Button
              className="w-full text-xs font-semibold h-10 bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center gap-1"
              disabled={busy}
              onClick={pay}
            >
              <Lock className="size-3" />
              Pay {formatMoney(order.amount_minor, order.currency)}
            </Button>
          ) : (
            <Button
              className="w-full text-xs font-semibold h-10 bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center gap-1"
              disabled={busy || hasBlockingViolation}
              onClick={startOrder}
              aria-label="Continue to payment"
            >
              <Lock className="size-3" />
              {hasBlockingViolation ? "Capacity issue" : "Pay securely"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
