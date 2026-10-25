"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Dumbbell,
  Info,
  Loader2,
  Plus,
  ShieldAlert,
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
const LIMIT_LABELS: [string, string][] = [
  ["members", "members"],
  ["trainers", "trainers"],
  ["staff", "staff logins"],
  ["branches", "branches"],
];

const FEATURE_LABELS: Record<string, string> = {
  sales_crm: "Sales CRM & Lead Pipeline",
  diet_plans: "Diet & Nutrition Plans",
  structured_workouts: "Structured Workouts",
  ai_insights: "AI Analytics & Churn Insights",
  member_broadcasts: "WhatsApp / Email Broadcasts",
  advanced_analytics: "Advanced Analytics",
  multi_branch: "Multi-branch Management",
  whatsapp_automation: "Automated WhatsApp Alerts",
};

interface DowngradeAddon {
  id: string;
  name: string;
  resource: "trainers" | "members" | "staff" | "branding";
  capacityBonus: number;
  unitLabel: string;
  priceMinor: number;
  priceLabel: string;
  description: string;
  badge?: string;
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
    description: "Retain 5 trainer slots so your coaching team stays fully active on a lower tier.",
    badge: "Recommended",
  },
  {
    id: "addon_members",
    name: "Member Expansion (+50)",
    resource: "members",
    capacityBonus: 50,
    unitLabel: "members",
    priceMinor: 29900,
    priceLabel: "₹299 / mo",
    description: "Expand active member capacity by 50 without jumping to a higher plan tier.",
  },
  {
    id: "addon_staff",
    name: "Staff Logins Pack (+3)",
    resource: "staff",
    capacityBonus: 3,
    unitLabel: "staff logins",
    priceMinor: 14900,
    priceLabel: "₹149 / mo",
    description: "Keep 3 front-desk and manager logins for your front office staff.",
  },
  {
    id: "addon_branding",
    name: "Custom Branding & Domain",
    resource: "branding",
    capacityBonus: 1,
    unitLabel: "custom portal",
    priceMinor: 29900,
    priceLabel: "₹299 / mo",
    description: "Retain custom domain, white-label member portal, and branded gym receipts.",
  },
];

function limitText(n: number | undefined, label: string) {
  if (n === undefined) return null;
  return n < 0 ? `Unlimited ${label}` : `${n} ${label}`;
}

export default function SubscribePage() {
  const [state, setState] = useState<"loading" | "signin" | "ready" | "error">("loading");
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [sub, setSub] = useState<SaasSubscription | null>(null);
  const [planCode, setPlanCode] = useState("growth");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [order, setOrder] = useState<SaasOrder | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  // One key per selection: a double click or retry of the same choice returns the same order.
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

  // Capacity & availability checks against live usage
  const liveUsage = sub.usage || {};
  const currentTrainers = liveUsage.trainers ?? 0;
  const currentMembers = liveUsage.members ?? 0;
  const currentStaff = liveUsage.staff ?? 0;

  const targetTrainerLimit = selected?.limits?.trainers ?? -1;
  const targetMemberLimit = selected?.limits?.members ?? -1;
  const targetStaffLimit = selected?.limits?.staff ?? -1;

  // Bonus from selected add-ons
  const bonusTrainers = selectedAddons.includes("addon_trainers") ? 5 : 0;
  const bonusMembers = selectedAddons.includes("addon_members") ? 50 : 0;
  const bonusStaff = selectedAddons.includes("addon_staff") ? 3 : 0;

  const effectiveTrainerLimit = targetTrainerLimit >= 0 ? targetTrainerLimit + bonusTrainers : -1;
  const effectiveMemberLimit = targetMemberLimit >= 0 ? targetMemberLimit + bonusMembers : -1;
  const effectiveStaffLimit = targetStaffLimit >= 0 ? targetStaffLimit + bonusStaff : -1;

  // Violations
  const trainersExceeded = effectiveTrainerLimit >= 0 && currentTrainers > effectiveTrainerLimit;
  const membersExceeded = effectiveMemberLimit >= 0 && currentMembers > effectiveMemberLimit;
  const staffExceeded = effectiveStaffLimit >= 0 && currentStaff > effectiveStaffLimit;
  const hasBlockingViolation = isLowerTier && (trainersExceeded || membersExceeded || staffExceeded);

  // Lost features
  const lostFeatures = isLowerTier && current && selected
    ? Object.keys(current.features).filter((k) => current.features[k] && !selected.features[k])
    : [];

  // Addon pricing calculations
  const addonTotalMinor = selectedAddons.reduce((sum, id) => {
    const item = DOWNGRADE_ADDONS.find((a) => a.id === id);
    return sum + (item ? item.priceMinor : 0);
  }, 0);

  const basePriceMinor = price?.amount_minor ?? 0;
  const totalAmountMinor = basePriceMinor + addonTotalMinor;
  const currentPlanPrice = current?.prices.find((p) => p.billing_cycle === cycle && p.currency === "INR");
  const monthlySavingsMinor = currentPlanPrice ? currentPlanPrice.amount_minor - totalAmountMinor : 0;

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
      const addonNote = selectedAddons.length > 0 ? " (Add-on packs will be activated simultaneously)" : "";
      setInfo(`${selected.name} starts on ${formatDate(s.paid_until)}${addonNote}. You keep your current plan until then.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not schedule the change.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/pay" className="text-sm text-[var(--text-secondary)] hover:underline">← Billing</Link>
          <h1 className="mt-1 text-2xl font-semibold">Choose your REPSI plan</h1>
        </div>
        <div role="radiogroup" aria-label="Billing period" className="inline-flex flex-wrap rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-1">
          {CYCLES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={cycle === c}
              disabled={isUpgrade}
              onClick={() => choose(planCode, c)}
              className={cn("rounded-[6px] px-3 py-1.5 text-sm transition-colors disabled:opacity-50", cycle === c ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-[var(--text-secondary)] hover:text-[var(--text)]")}
            >
              {CYCLE_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <div role="radiogroup" aria-label="Plan" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => {
          const pr = p.prices.find((x) => x.billing_cycle === cycle && x.currency === "INR");
          const active = p.code === planCode;
          const isCurrent = sub.status !== "trialing" && p.code === sub.plan_code;
          const isLower = current && p.rank < current.rank;
          return (
            <button
              key={p.code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(p.code, cycle)}
              className={cn(
                "relative text-left rounded-[12px] border bg-[var(--surface)] p-5 transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--ring)] outline-none",
                active ? "border-[var(--primary)] shadow-md" : "border-[var(--border)] hover:shadow-sm",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{p.name}</span>
                <div className="flex items-center gap-1.5">
                  {isLower && !isCurrent && (
                    <span className="text-[11px] rounded-full bg-amber-50 text-amber-700 font-medium px-2 py-0.5 border border-amber-200">
                      Lower tier
                    </span>
                  )}
                  {isCurrent && <span className="text-xs rounded-full bg-[var(--nav-hover-bg)] px-2 py-0.5 font-medium">Current</span>}
                </div>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {pr ? formatMoney(pr.amount_minor, pr.currency) : "—"}
                <span className="ml-1 text-sm font-normal text-[var(--text-secondary)]">/ {CYCLE_LABELS[cycle].toLowerCase()}</span>
              </p>
              <ul className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
                {LIMIT_LABELS.map(([k, label]) => {
                  const t = limitText(p.limits[k], label);
                  return t ? (
                    <li key={k} className="flex items-center gap-2"><Check className="size-3.5 text-[var(--primary)]" aria-hidden />{t}</li>
                  ) : null;
                })}
              </ul>
            </button>
          );
        })}
      </div>

      {/* ─── Downgrade Warning & Resource Availability Assessment ─────────── */}
      {isLowerTier && current && selected && (
        <PayCard className="border-amber-300 bg-amber-50/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="font-semibold text-amber-900">
                  Downgrade Notice: Switching from {current.name} to {selected.name}
                </h3>
                <p className="mt-0.5 text-xs text-amber-800">
                  {selected.name} provides lower capacity limits and omits some premium tools. Review your capacity below:
                </p>
              </div>

              {/* Resource capacity differences & live availability */}
              <div className="grid gap-2 sm:grid-cols-3">
                {/* Trainers */}
                <div className={cn(
                  "rounded-lg p-3 border text-xs",
                  trainersExceeded
                    ? "bg-red-50 border-red-300 text-red-900"
                    : "bg-white/80 border-amber-200 text-amber-900"
                )}>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5"><Dumbbell className="size-3.5" /> Trainers</span>
                    <span className="tabular-nums">
                      {current.limits.trainers === -1 ? "∞" : current.limits.trainers} → {selected.limits.trainers}
                      {bonusTrainers > 0 && <span className="text-emerald-600"> (+{bonusTrainers})</span>}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-amber-700">
                    <span>Active in gym: <strong>{currentTrainers}</strong></span>
                    {trainersExceeded ? (
                      <span className="text-red-700 font-semibold">Exceeds limit!</span>
                    ) : (
                      <span className="text-emerald-700 font-medium">✓ Fits quota</span>
                    )}
                  </div>
                  {trainersExceeded && (
                    <p className="mt-1.5 text-[11px] text-red-700">
                      ⚠️ You have {currentTrainers} active trainers. You must remove {currentTrainers - effectiveTrainerLimit} trainer{currentTrainers - effectiveTrainerLimit > 1 ? "s" : ""} or add a Trainer Pack below.
                    </p>
                  )}
                </div>

                {/* Members */}
                <div className={cn(
                  "rounded-lg p-3 border text-xs",
                  membersExceeded
                    ? "bg-red-50 border-red-300 text-red-900"
                    : "bg-white/80 border-amber-200 text-amber-900"
                )}>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5"><Users className="size-3.5" /> Members</span>
                    <span className="tabular-nums">
                      {current.limits.members === -1 ? "∞" : current.limits.members} → {selected.limits.members}
                      {bonusMembers > 0 && <span className="text-emerald-600"> (+{bonusMembers})</span>}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-amber-700">
                    <span>Active in gym: <strong>{currentMembers}</strong></span>
                    {membersExceeded ? (
                      <span className="text-red-700 font-semibold">Exceeds limit!</span>
                    ) : (
                      <span className="text-emerald-700 font-medium">✓ Fits quota</span>
                    )}
                  </div>
                  {membersExceeded && (
                    <p className="mt-1.5 text-[11px] text-red-700">
                      ⚠️ Active members ({currentMembers}) exceed {selected.name} limit ({effectiveMemberLimit}).
                    </p>
                  )}
                </div>

                {/* Staff Logins */}
                <div className={cn(
                  "rounded-lg p-3 border text-xs",
                  staffExceeded
                    ? "bg-red-50 border-red-300 text-red-900"
                    : "bg-white/80 border-amber-200 text-amber-900"
                )}>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5"><Users className="size-3.5" /> Staff Logins</span>
                    <span className="tabular-nums">
                      {current.limits.staff === -1 ? "∞" : current.limits.staff} → {selected.limits.staff}
                      {bonusStaff > 0 && <span className="text-emerald-600"> (+{bonusStaff})</span>}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-amber-700">
                    <span>Active staff: <strong>{currentStaff}</strong></span>
                    {staffExceeded ? (
                      <span className="text-red-700 font-semibold">Exceeds limit!</span>
                    ) : (
                      <span className="text-emerald-700 font-medium">✓ Fits quota</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Lost Features Alert */}
              {lostFeatures.length > 0 && (
                <div className="rounded-lg bg-amber-100/60 p-2.5 text-xs text-amber-900">
                  <span className="font-semibold">Tools removed on {selected.name}:</span>{" "}
                  {lostFeatures.map((f) => FEATURE_LABELS[f] || f).join(", ")}.
                </div>
              )}
            </div>
          </div>
        </PayCard>
      )}

      {/* ─── Add-ons Section for Downgrading Users ───────────────────────── */}
      {isLowerTier && (
        <PayCard className="border-[var(--primary)]/30 bg-surface">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)]">
                <Sparkles className="size-3.5" /> Capacity Protection Add-ons
              </div>
              <h2 className="mt-2 text-lg font-semibold">Keep your trainers and capacity on a lower budget</h2>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Downgrading to save costs? Attach flexible capacity add-ons so your trainers and staff aren&apos;t lost.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {DOWNGRADE_ADDONS.map((addon) => {
              const isSelected = selectedAddons.includes(addon.id);
              const solvesTrainerViolation = addon.resource === "trainers" && currentTrainers > targetTrainerLimit;
              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => toggleAddon(addon.id)}
                  className={cn(
                    "text-left rounded-xl border p-3.5 transition-all text-xs cursor-pointer",
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]"
                      : "border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--primary)]/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm">{addon.name}</span>
                    <div className="flex items-center gap-1.5">
                      {addon.badge && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          {addon.badge}
                        </span>
                      )}
                      <span className="font-bold text-sm text-[var(--primary)] tabular-nums">{addon.priceLabel}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-[var(--text-secondary)]">{addon.description}</p>
                  <div className="mt-2 flex items-center justify-between pt-2 border-t border-[var(--border)]/60 text-[11px]">
                    <span className="font-medium text-[var(--primary)]">+{addon.capacityBonus} {addon.unitLabel}</span>
                    <span className={cn("font-medium", isSelected ? "text-[var(--primary)]" : "text-[var(--text-secondary)]")}>
                      {isSelected ? "✓ Added to plan" : "+ Click to add"}
                    </span>
                  </div>
                  {solvesTrainerViolation && isSelected && (
                    <p className="mt-1.5 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Covers your {currentTrainers} active trainers!
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick value calculation callout */}
          {selectedAddons.length > 0 && currentPlanPrice && (
            <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2">
              <div>
                <strong>Smart Choice:</strong> {selected?.name} ({formatMoney(basePriceMinor, "INR")}) + {selectedAddons.length} add-on{selectedAddons.length > 1 ? "s" : ""} ({formatMoney(addonTotalMinor, "INR")}) ={" "}
                <span className="font-bold text-emerald-950">{formatMoney(totalAmountMinor, "INR")} / {CYCLE_LABELS[cycle].toLowerCase()}</span>
              </div>
              {monthlySavingsMinor > 0 && (
                <span className="rounded-full bg-emerald-200/80 px-2.5 py-0.5 font-bold text-emerald-900 text-[11px]">
                  Saves {formatMoney(monthlySavingsMinor, "INR")} vs {current?.name}
                </span>
              )}
            </div>
          )}
        </PayCard>
      )}

      {/* ─── Order Summary & CTAs ────────────────────────────────────────── */}
      <PayCard className="max-w-xl">
        <h2 className="text-lg font-semibold">Order summary</h2>
        {error && <div className="mt-3"><PayError message={error} /></div>}
        {info && <p role="status" className="mt-3 text-sm text-emerald-700">{info}</p>}

        {!selected || !price ? (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">This plan isn&apos;t available for that billing period.</p>
        ) : isDowngrade ? (
          <>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Moving to {selected.name} takes effect when your current period ends on {formatDate(sub.paid_until)}. Nothing is charged now.
              {selectedAddons.length > 0 && (
                <span className="block mt-1 font-medium text-[var(--primary)]">
                  Selected add-ons ({selectedAddons.map((id) => DOWNGRADE_ADDONS.find((a) => a.id === id)?.name).join(", ")}) will activate with the new plan.
                </span>
              )}
            </p>

            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                className="flex-1"
                disabled={busy || hasBlockingViolation}
                onClick={scheduleDowngrade}
              >
                {busy && <Loader2 className="animate-spin" aria-hidden />}
                {hasBlockingViolation ? "Resolve capacity limits above" : "Schedule change"}
              </Button>
              {current && (
                <Button
                  variant="outline"
                  onClick={() => choose(current.code, cycle)}
                  className="text-xs"
                >
                  Keep {current.name} (Recommended)
                </Button>
              )}
            </div>
          </>
        ) : order ? (
          <>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Plan</dt><dd>{selected.name} · {CYCLE_LABELS[order.billing_cycle]}</dd></div>
              <div className="flex justify-between">
                <dt>Type</dt>
                <dd>{order.kind === "upgrade" ? "Upgrade (prorated)" : order.kind === "renewal" ? "Renewal" : "New subscription"}</dd>
              </div>
              {selectedAddons.length > 0 && (
                <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                  <dt>Add-ons</dt>
                  <dd>{selectedAddons.length} pack{selectedAddons.length > 1 ? "s" : ""} selected</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-[var(--border)] pt-2 font-semibold">
                <dt>Total</dt><dd className="tabular-nums">{formatMoney(order.amount_minor, order.currency)}</dd>
              </div>
            </dl>
            {order.environment === "sandbox" && <p className="mt-2 text-xs text-amber-700">Sandbox mode: no real money is charged.</p>}
            <Button className="mt-4 w-full" disabled={busy} onClick={pay}>
              {busy && <Loader2 className="animate-spin" aria-hidden />} Pay {formatMoney(order.amount_minor, order.currency)}
            </Button>
            <button type="button" className="mt-2 w-full text-sm text-[var(--text-secondary)] underline" onClick={() => setOrder(null)}>
              Change selection
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {isUpgrade
                ? `Upgrading charges only the difference for the rest of your period (until ${formatDate(sub.paid_until)}).`
                : isActivePaid
                  ? `Renewing adds ${CYCLE_LABELS[cycle].toLowerCase()} after ${formatDate(sub.paid_until)}.`
                  : `${selected.name}, ${CYCLE_LABELS[cycle].toLowerCase()}: ${formatMoney(price.amount_minor, price.currency)}. Your plan starts as soon as payment is confirmed.`}
            </p>

            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                className="flex-1"
                disabled={busy || hasBlockingViolation}
                onClick={startOrder}
              >
                {busy && <Loader2 className="animate-spin" aria-hidden />}
                {hasBlockingViolation ? "Resolve capacity limits above" : "Continue to payment"}
              </Button>
              {isLowerTier && current && (
                <Button
                  variant="outline"
                  onClick={() => choose(current.code, cycle)}
                  className="text-xs"
                >
                  Keep {current.name} (Recommended)
                </Button>
              )}
            </div>
          </>
        )}
      </PayCard>
    </div>
  );
}

