"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate, type SaasSubscription } from "@/lib/saas-billing";

export function PayCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-sm", className)}>
      {children}
    </section>
  );
}

export function PayLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-20 text-sm text-[var(--text-secondary)]">
      <Loader2 className="size-4 animate-spin" aria-hidden /> {label}
    </div>
  );
}

export function PayError({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div role="alert" className="rounded-[8px] border border-[var(--error)]/30 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
      {message}
      {retry && (
        <button type="button" onClick={retry} className="ml-2 underline font-medium">
          Try again
        </button>
      )}
    </div>
  );
}

export function SignInPrompt({ redirect }: { redirect: string }) {
  return (
    <PayCard className="max-w-md mx-auto mt-10 text-center">
      <h1 className="text-xl font-semibold">Sign in to manage billing</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">Use your gym owner account to view your plan, pay and download invoices.</p>
      <Link
        href={`/login?redirect=${encodeURIComponent(redirect)}`}
        className="mt-5 inline-flex h-12 items-center justify-center rounded-[8px] bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
      >
        Sign in
      </Link>
    </PayCard>
  );
}

const STATUS_TEXT: Record<SaasSubscription["status"], { label: string; tone: string }> = {
  trialing: { label: "Free trial", tone: "bg-blue-50 text-blue-700" },
  active: { label: "Active", tone: "bg-emerald-50 text-emerald-700" },
  grace: { label: "Payment due", tone: "bg-amber-50 text-amber-800" },
  read_only: { label: "Read-only", tone: "bg-red-50 text-red-700" },
  suspended: { label: "Suspended", tone: "bg-red-50 text-red-700" },
};

export function StatusBadge({ status }: { status: SaasSubscription["status"] }) {
  const s = STATUS_TEXT[status];
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", s.tone)}>{s.label}</span>;
}

export function subscriptionSummary(sub: SaasSubscription): string {
  switch (sub.status) {
    case "trialing":
      return `Your free trial (Growth features) ends on ${formatDate(sub.trial_ends_at)}.`;
    case "active":
      if (sub.is_complimentary && !sub.paid_until) return "Complimentary access from REPSI.";
      return sub.cancel_at_period_end
        ? `Cancelled. Full access until ${formatDate(sub.paid_until)}, then read-only.`
        : `Paid through ${formatDate(sub.paid_until)}.`;
    case "grace":
      return `Your plan expired on ${formatDate(sub.paid_until)}. Renew before ${formatDate(sub.grace_ends_at)} to avoid read-only mode.`;
    case "read_only":
      return "Your workspace is read-only. Check-ins, member payments and exports still work. Renew to restore full access.";
    case "suspended":
      return "This workspace is suspended. Contact REPSI support.";
  }
}
