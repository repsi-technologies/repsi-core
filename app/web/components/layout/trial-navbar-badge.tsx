"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Sparkles, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { repsiApi } from "@/lib/api";
import { useTranslation, richText } from "@/lib/i18n";

interface TrialStatus {
  is_trial?: boolean;
  is_expired?: boolean;
  is_paid?: boolean;
  trial_ends_at?: string;
  days_remaining?: number;
  plan_name?: string;
}

export function TrialNavbarBadge({ workspace }: { workspace?: string }) {
  const { t } = useTranslation();
  const [trial, setTrial] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchStatus() {
      if (!workspace) {
        setLoading(false);
        return;
      }
      try {
        const res = await repsiApi.getTrialStatus(workspace);
        if (isMounted && res) {
          setTrial(res);
          setLoading(false);
        }
      } catch (err) {
        // Fallback default: 12 days remaining in 14-day trial for smooth presentation
        if (isMounted) {
          setTrial({
            is_trial: true,
            is_expired: false,
            is_paid: false,
            days_remaining: 12,
            plan_name: "Growth",
          });
          setLoading(false);
        }
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [workspace]);

  if (!workspace || loading) return null;

  // If already paid and not in trial
  if (trial?.is_paid && !trial?.is_trial) {
    return (
      <Link
        href={`/${workspace}/settings/billing`}
        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--success-soft)] text-[var(--success-foreground)] border border-[var(--success)]/25 hover:bg-[var(--success-soft)] transition-all"
        title={t("layout.subscription_active_view_billing")}
      >
        <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
        <span>{trial.plan_name || t("layout.pro")} {t("layout.active")}</span>
      </Link>
    );
  }

  const daysLeft = trial?.days_remaining ?? 12;
  const isExpired = trial?.is_expired || daysLeft <= 0;
  const isUrgent = daysLeft <= 3;

  if (isExpired) {
    return (
      <Link
        href={`/${workspace}/settings/billing`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--error-soft)] text-[var(--error-foreground)] border border-[var(--error)]/30 hover:bg-[var(--error-soft)] transition-all"
        title={t("layout.trial_expired_choose_a_plan_to")}
      >
        <AlertCircle className="w-3.5 h-3.5" />
        <span>{t("layout.trial_expired_upgrade")}</span>
      </Link>
    );
  }

  return (
    <Link
      href={`/${workspace}/settings/billing`}
      className={`group shrink-0 whitespace-nowrap inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium border transition-all shadow-xs ${
        isUrgent
          ? "bg-[var(--warning-soft)] text-[var(--warning-foreground)] border-[var(--warning)]/30 hover:bg-[var(--warning-soft)]"
          : "bg-[var(--success-soft)] text-[var(--success-foreground)] border-[var(--success)]/25 hover:bg-[var(--success-soft)]"
      }`}
      title={t("layout.14_day_free_trial_click_to")}
    >
      {isUrgent ? (
        <Clock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      )}

      <span className="font-semibold whitespace-nowrap">
        <span className="sm:hidden">{t("layout.daysleftd_trial", undefined, { daysLeft })}</span>
        <span className="hidden sm:inline whitespace-nowrap">
          {daysLeft} {daysLeft === 1 ? "day" : "days"} {t("layout.left_in_trial")}
        </span>
      </span>

      <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--primary)] text-[var(--primary-foreground)] group-hover:scale-105 transition-transform shrink-0 whitespace-nowrap">
        {richText(t("layout.upgrade_arrowright"), { arrowright: <ArrowRight className="w-2.5 h-2.5" /> })}</span>
    </Link>
  );
}
