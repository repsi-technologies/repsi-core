"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { PaymentMethodsCard } from "@/features/payments/payment-methods-card";
import { repsiApi } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

/** Owner dashboard: member payment proofs waiting for approval, and how members are told to pay. */
export function PaymentCollectionCard({ workspace }: { workspace: string }) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<{ count: number; amount: number } | null>(null);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    repsiApi
      .getPaymentSubmissions("pending_review")
      .then((rows) => setPending({ count: rows.length, amount: rows.reduce((s, r) => s + (Number(r.amount) || 0), 0) }))
      .catch(() => setAllowed(false)); // roles without payment access don't see this card
  }, []);

  if (!allowed) return null;
  const base = `/${workspace}/payments`;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <Link
        href={`${base}?tab=verification`}
        className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--primary)]/40"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Clock className="h-4 w-4 text-[var(--primary)]" aria-hidden />
          {t("pay.pending_approvals", "Payments waiting for approval")}
        </div>
        <div className="mt-3">
          <p className="text-3xl font-bold tabular-nums text-[var(--text)]">{pending ? pending.count : "—"}</p>
          <p className="text-sm text-[var(--text-muted)]">
            {pending && pending.count > 0
              ? t("pay.pending_amount", "₹{amount} submitted by members", { amount: pending.amount.toLocaleString("en-IN") })
              : t("pay.none_pending", "All member payment proofs are reviewed.")}
          </p>
        </div>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--link)]">
          {t("pay.review", "Review")} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </Link>
      <PaymentMethodsCard manageHref={`${base}?tab=settings`} />
    </div>
  );
}
