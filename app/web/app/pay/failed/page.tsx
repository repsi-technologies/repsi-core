"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";

import { PayCard, PayLoading } from "@/components/pay/pay-ui";

function FailedContent() {
  const ref = useSearchParams().get("order");
  return (
    <PayCard className="max-w-md mx-auto mt-10 text-center">
      <XCircle className="mx-auto size-10 text-[var(--error)]" aria-hidden />
      <h1 className="mt-3 text-xl font-semibold">Payment not completed</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        The payment was cancelled, declined or timed out. You weren&apos;t charged for this attempt, and your current access is unchanged.
        If money left your account, it will either be confirmed automatically or refunded by your bank.
      </p>
      {ref && /^rps_[a-f0-9]{32}$/.test(ref) && <p className="mt-2 text-xs text-[var(--text-muted)]">Reference: {ref}</p>}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link href="/pay/subscribe" className="inline-flex h-12 items-center justify-center rounded-[8px] bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]">
          Try again
        </Link>
        <Link href="/pay" className="inline-flex h-12 items-center justify-center rounded-[8px] border border-[var(--border)] px-5 text-sm">
          Back to billing
        </Link>
      </div>
    </PayCard>
  );
}

export default function PayFailedPage() {
  return (
    <Suspense fallback={<PayLoading />}>
      <FailedContent />
    </Suspense>
  );
}
