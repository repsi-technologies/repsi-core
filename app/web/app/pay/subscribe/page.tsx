"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PayCard, PayError, PayLoading, SignInPrompt } from "@/components/pay/pay-ui";
import { ApiError, getToken } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  CYCLE_LABELS, formatDate, formatMoney, newIdempotencyKey, openCashfreeCheckout, saasBillingApi,
  type BillingCycle, type SaasOrder, type SaasPlan, type SaasSubscription,
} from "@/lib/saas-billing";

const CYCLES: BillingCycle[] = ["monthly", "quarterly", "half_yearly", "annual"];
const LIMIT_LABELS: [string, string][] = [["members", "members"], ["trainers", "trainers"], ["staff", "staff logins"], ["branches", "branches"]];

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
  const isDowngrade = isActivePaid && !!current && !!selected && selected.rank < current.rank;
  const isUpgrade = isActivePaid && !!current && !!selected && selected.rank > current.rank;

  function choose(code: string, c: BillingCycle) {
    setPlanCode(code);
    setCycle(c);
    setOrder(null);
    setError("");
    setInfo("");
  }

  async function startOrder() {
    if (!selected) return;
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
        keyRef.current = null; // closed order: the next attempt needs a new one
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
    setBusy(true);
    setError("");
    try {
      const s = await saasBillingApi.scheduleDowngrade(selected.code, cycle);
      setSub({ ...s, can_manage: true });
      setInfo(`${selected.name} starts on ${formatDate(s.paid_until)}. You keep your current plan until then.`);
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
          return (
            <button
              key={p.code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(p.code, cycle)}
              className={cn(
                "text-left rounded-[12px] border bg-[var(--surface)] p-5 transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--ring)] outline-none",
                active ? "border-[var(--primary)] shadow-md" : "border-[var(--border)] hover:shadow-sm",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{p.name}</span>
                {isCurrent && <span className="text-xs rounded-full bg-[var(--nav-hover-bg)] px-2 py-0.5">Current</span>}
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
            </p>
            <Button className="mt-4" disabled={busy} onClick={scheduleDowngrade}>
              {busy && <Loader2 className="animate-spin" aria-hidden />} Schedule change
            </Button>
          </>
        ) : order ? (
          <>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Plan</dt><dd>{selected.name} · {CYCLE_LABELS[order.billing_cycle]}</dd></div>
              <div className="flex justify-between">
                <dt>Type</dt>
                <dd>{order.kind === "upgrade" ? "Upgrade (prorated)" : order.kind === "renewal" ? "Renewal" : "New subscription"}</dd>
              </div>
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
            <Button className="mt-4 w-full" disabled={busy} onClick={startOrder}>
              {busy && <Loader2 className="animate-spin" aria-hidden />} Continue to payment
            </Button>
          </>
        )}
      </PayCard>
    </div>
  );
}
