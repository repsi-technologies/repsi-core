"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

import { PayCard, PayError, PayLoading, SignInPrompt } from "@/components/pay/pay-ui";
import { ApiError, getToken } from "@/lib/auth-client";
import { formatDate, formatMoney, saasBillingApi, type SaasOrder } from "@/lib/saas-billing";

const POLL_MS = 3000;
const MAX_POLLS = 20; // ~1 minute, then tell the owner we'll confirm in the background

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const ref = params.get("order") || "";
  const [order, setOrder] = useState<SaasOrder | null>(null);
  const [polls, setPolls] = useState(0);
  const [error, setError] = useState("");
  const [signin, setSignin] = useState(false);

  useEffect(() => {
    if (!ref || !/^rps_[a-f0-9]{32}$/.test(ref)) {
      setError("Missing or invalid order reference.");
      return;
    }
    if (!getToken()) {
      setSignin(true);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let count = 0;
    const tick = async () => {
      try {
        // The server verifies with Cashfree; the redirect itself proves nothing.
        const o = await saasBillingApi.order(ref);
        if (cancelled) return;
        setOrder(o);
        const attemptFailed = o.status === "pending" && (o.last_attempt_status === "failed" || o.last_attempt_status === "abandoned");
        if (o.status === "failed" || o.status === "cancelled" || o.status === "expired" || attemptFailed) {
          router.replace(`/pay/failed?order=${encodeURIComponent(ref)}`);
          return;
        }
        if (o.status !== "paid" && ++count < MAX_POLLS) timer = setTimeout(tick, POLL_MS);
        setPolls(count);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) return setSignin(true);
        if (++count < MAX_POLLS) timer = setTimeout(tick, POLL_MS);
        else setError(e instanceof Error ? e.message : "Could not check the payment.");
        setPolls(count);
      }
    };
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ref, router]);

  if (signin) return <SignInPrompt redirect={`/pay/success?order=${encodeURIComponent(ref)}`} />;
  if (error) return <div className="mt-10 max-w-md mx-auto"><PayError message={error} /><Link href="/pay" className="mt-4 inline-block underline text-sm">Back to billing</Link></div>;
  if (!order) return <PayLoading label="Confirming your payment…" />;

  if (order.status === "paid") {
    const sub = order.subscription;
    return (
      <PayCard className="max-w-md mx-auto mt-10 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden />
        <h1 className="mt-3 text-xl font-semibold">Payment confirmed</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {formatMoney(order.amount_minor, order.currency)} received.
          {sub?.paid_until && ` Your ${sub.plan_name} plan is active until ${formatDate(sub.paid_until)}.`}
        </p>
        {order.needs_review && (
          <p className="mt-2 text-xs text-[var(--text-muted)]">Our team will double-check this payment; no action is needed.</p>
        )}
        <Link href="/pay" className="mt-5 inline-flex h-12 items-center justify-center rounded-[8px] bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]">
          View billing & invoice
        </Link>
      </PayCard>
    );
  }

  const gaveUp = polls >= MAX_POLLS;
  return (
    <PayCard className="max-w-md mx-auto mt-10 text-center" >
      {gaveUp ? <Clock className="mx-auto size-10 text-amber-600" aria-hidden /> : <Loader2 className="mx-auto size-10 animate-spin text-[var(--text-secondary)]" aria-hidden />}
      <h1 className="mt-3 text-xl font-semibold" role="status" aria-live="polite">
        {gaveUp ? "Payment is still processing" : "Confirming your payment…"}
      </h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        {gaveUp
          ? "Some payments (UPI, net banking) take a few minutes. We'll activate your plan automatically once Cashfree confirms it. You can safely close this page."
          : "Please don't close this page."}
      </p>
      <Link href="/pay" className="mt-5 inline-block underline text-sm">Back to billing</Link>
    </PayCard>
  );
}

export default function PaySuccessPage() {
  return (
    <Suspense fallback={<PayLoading />}>
      <SuccessContent />
    </Suspense>
  );
}
