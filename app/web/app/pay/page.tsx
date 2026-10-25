"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PayCard, PayError, PayLoading, SignInPrompt, StatusBadge, subscriptionSummary } from "@/components/pay/pay-ui";
import { ApiError, applySession, getToken } from "@/lib/auth-client";
import {
  CYCLE_LABELS, formatDate, formatMoney, isDesktopApp, openCheckoutInBrowser, saasBillingApi,
  type SaasInvoice, type SaasSubscription,
} from "@/lib/saas-billing";

type View = "loading" | "signin" | "forbidden" | "disabled" | "ready" | "error";

function PayOverview() {
  const params = useSearchParams();
  const handoff = useRef<string | null>(params.get("t"));
  const started = useRef(false);
  const [view, setView] = useState<View>("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sub, setSub] = useState<SaasSubscription | null>(null);
  const [invoices, setInvoices] = useState<SaasInvoice[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setView("loading");
    setError("");
    try {
      const cfg = await saasBillingApi.config();
      if (!cfg.enabled) return setView("disabled");
      if (!getToken()) return setView("signin");
      const [s, inv] = await Promise.all([saasBillingApi.subscription(), saasBillingApi.invoices()]);
      setSub(s);
      setInvoices(inv);
      setView("ready");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return setView("signin");
      if (e instanceof ApiError && e.status === 403) return setView("forbidden");
      setError(e instanceof Error ? e.message : "Could not load billing.");
      setView("error");
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = handoff.current;
    if (!token) {
      load();
      return;
    }
    // Drop the single-use token from the address bar and history before using it.
    window.history.replaceState(null, "", "/pay");
    saasBillingApi
      .consumeHandoff(token)
      .then((session) => applySession(session))
      .catch(() => setNotice("That sign-in link has expired or was already used. Please sign in."))
      .finally(load);
  }, [load]);

  async function act(fn: () => Promise<SaasSubscription>) {
    setBusy(true);
    try {
      setSub({ ...(await fn()), can_manage: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (view === "loading") return <PayLoading label="Loading your subscription…" />;
  if (view === "signin")
    return (
      <>
        {notice && <div className="max-w-md mx-auto mt-6"><PayError message={notice} /></div>}
        <SignInPrompt redirect="/pay" />
      </>
    );
  if (view === "disabled")
    return (
      <PayCard className="max-w-md mx-auto mt-10 text-center">
        <h1 className="text-xl font-semibold">Online billing is coming soon</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Your gym keeps full access meanwhile. Questions? Write to billing@repsi.app.</p>
      </PayCard>
    );
  if (view === "forbidden")
    return (
      <PayCard className="max-w-md mx-auto mt-10 text-center">
        <h1 className="text-xl font-semibold">Billing is managed by the gym owner</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Ask your gym owner to manage the REPSI subscription.</p>
      </PayCard>
    );
  if (view === "error" || !sub) return <div className="mt-10"><PayError message={error} retry={load} /></div>;

  const renewLabel = sub.status === "active" ? "Renew or upgrade" : "Choose a plan";
  return (
    <div className="mt-4 space-y-6">
      {notice && <PayError message={notice} />}
      {error && <PayError message={error} />}
      <PayCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Current plan</p>
            <h1 className="mt-1 text-2xl font-semibold">
              {sub.status === "trialing" ? "Growth (trial)" : sub.plan_name}
              {sub.billing_cycle && sub.status !== "trialing" && (
                <span className="ml-2 text-base font-normal text-[var(--text-secondary)]">· {CYCLE_LABELS[sub.billing_cycle]}</span>
              )}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-xl">{subscriptionSummary(sub)}</p>
            {sub.pending_plan_code && (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Switching to {sub.pending_plan_code} at the end of this period.{" "}
                {sub.can_manage && (
                  <button type="button" className="underline" disabled={busy} onClick={() => act(saasBillingApi.cancelDowngrade)}>
                    Keep current plan
                  </button>
                )}
              </p>
            )}
          </div>
          <StatusBadge status={sub.status} />
        </div>
        {sub.can_manage ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {sub.status !== "suspended" && isDesktopApp() && (
              <Button
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  openCheckoutInBrowser()
                    .then(() => {
                      setNotice("Finish the payment in your browser. Your plan updates here when you come back.");
                      window.addEventListener("focus", load, { once: true });
                    })
                    .catch((e) => setError(e instanceof Error ? e.message : "Could not open your browser."))
                    .finally(() => setBusy(false));
                }}
              >
                {renewLabel} in browser
              </Button>
            )}
            {sub.status !== "suspended" && !isDesktopApp() && (
              <Link href="/pay/subscribe" className="inline-flex h-12 items-center justify-center rounded-[8px] bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]">
                {renewLabel}
              </Link>
            )}
            {sub.status === "active" && !sub.is_complimentary && (
              sub.cancel_at_period_end ? (
                <Button variant="secondary" disabled={busy} onClick={() => act(saasBillingApi.resume)}>Resume subscription</Button>
              ) : (
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`Cancel at the end of the period? You keep full access until ${formatDate(sub.paid_until)}, then the workspace becomes read-only. Your data is kept.`)) {
                      act(saasBillingApi.cancel);
                    }
                  }}
                >
                  Cancel at period end
                </Button>
              )
            )}
          </div>
        ) : (
          <p className="mt-5 text-sm text-[var(--text-muted)]">Only the gym owner can change the subscription.</p>
        )}
      </PayCard>

      <PayCard>
        <h2 className="text-lg font-semibold">Invoices</h2>
        {invoices.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">No invoices yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{inv.invoice_number}</p>
                  <p className="text-[var(--text-secondary)]">
                    {formatDate(inv.issued_at)} · {inv.plan_name} · {CYCLE_LABELS[inv.billing_cycle]}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium tabular-nums">{formatMoney(inv.amount_minor, inv.currency)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Download invoice ${inv.invoice_number}`}
                    onClick={() => saasBillingApi.downloadInvoice(inv).catch((e) => setError(e.message))}
                  >
                    <Download aria-hidden /> PDF
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PayCard>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<PayLoading />}>
      <PayOverview />
    </Suspense>
  );
}
