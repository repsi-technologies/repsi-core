"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Database, RefreshCw, Sparkles, CheckCircle2, Circle, ArrowRight, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/features/dashboard/stat-card";
import { RevenueChart } from "@/features/dashboard/revenue-chart";
import { AttendanceChart } from "@/features/dashboard/attendance-chart";
import { RecentActivity } from "@/features/dashboard/recent-activity";
import { QuickActions } from "@/features/dashboard/quick-actions";
import { RepsiMascot } from "@/components/ui/repsi-mascot";
import { GettingStartedDialog } from "@/components/layout/getting-started-dialog";
import { TrialCountdownCard } from "@/features/dashboard/trial-countdown-card";
import { PaymentCollectionCard } from "@/features/dashboard/payment-collection-card";
import { repsiApi } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { slugToGymName } from "@/lib/workspace";

import { API_BASE } from "@/lib/api-base";
import { useTranslation, richText } from "@/lib/i18n";

interface DashboardMetrics {
  active_members: number;
  monthly_revenue: number;
  today_attendance: number;
  expiring_memberships: number;
  revenue_growth_pct: number;
  attendance_peak_hour: string;
  recent_checkins_count: number;
  revenue_chart: Array<{ label: string; value: number }>;
  attendance_chart: Array<{ label: string; value: number }>;
}

// ─── Client-Side In-Memory Cache (30s Stale Time for 0ms Navigation) ──────────────
const dashboardMetricsCache: Record<string, { data: DashboardMetrics; timestamp: number }> = {};
const CACHE_STALE_MS = 30_000;

export function DashboardClient({ workspace }: { workspace: string }) {
  const { t } = useTranslation();
  const router = useRouter();

  // Initialize from cache if fresh
  const cachedEntry = dashboardMetricsCache[workspace];
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(cachedEntry ? cachedEntry.data : null);
  const [loading, setLoading] = useState<boolean>(!cachedEntry);
  const [revalidating, setRevalidating] = useState<boolean>(false);
  const [seeding, setSeeding] = useState(false);
  const [dismissChecklist, setDismissChecklist] = useState(false);
  const [showGettingStartedModal, setShowGettingStartedModal] = useState(false);

  const fetchMetrics = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRevalidating(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("repsi_auth_token") : null;
      const res = await fetch(`${API_BASE}/dashboard/metrics`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        dashboardMetricsCache[workspace] = { data, timestamp: Date.now() };
      } else {
        const defaultData: DashboardMetrics = {
          active_members: 0,
          monthly_revenue: 0,
          today_attendance: 0,
          expiring_memberships: 0,
          revenue_growth_pct: 0,
          attendance_peak_hour: "—",
          recent_checkins_count: 0,
          revenue_chart: [],
          attendance_chart: [],
        };
        setMetrics(defaultData);
        dashboardMetricsCache[workspace] = { data: defaultData, timestamp: Date.now() };
      }
    } catch (err) {
      console.warn("Could not fetch dashboard metrics", err);
    } finally {
      setLoading(false);
      setRevalidating(false);
    }
  }, [workspace]);

  useEffect(() => {
    const user = getAuthUser();
    if (user?.role === "TRAINER") {
      router?.replace(`/${workspace}/trainer/dashboard`);
      return;
    } else if (user?.role === "USER" || user?.role === "MEMBER") {
      router?.replace(`/${workspace}/member/dashboard`);
      return;
    }

    const cacheIsFresh = Boolean(
      dashboardMetricsCache[workspace] &&
      Date.now() - dashboardMetricsCache[workspace].timestamp < CACHE_STALE_MS
    );
    if (cacheIsFresh) {
      // Background revalidate without blocking UI
      fetchMetrics(true);
    } else {
      fetchMetrics(false);
    }
  }, [workspace, fetchMetrics, router]);

  const handleSeedDemoData = async () => {
    if (!confirm(t("dashboard.are_you_sure_you_want_to"))) {
      return;
    }
    setSeeding(true);
    try {
      await repsiApi.seedDemoData();
      delete dashboardMetricsCache[workspace];
      await fetchMetrics(false);
    } catch (err: any) {
      alert(err.message || t("dashboard.failed_to_seed_demo_data"));
    } finally {
      setSeeding(false);
    }
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return t("dashboard.good_morning");
    if (hour < 17) return t("dashboard.good_afternoon");
    return t("dashboard.good_evening");
  })();

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hasData = (metrics?.active_members ?? 0) > 0 || (metrics?.monthly_revenue ?? 0) > 0;
  const isSetupMode = !hasData && !dismissChecklist && !loading;

  const checklistSteps = [
    { title: t("dashboard.gym_profile"), completed: true, href: `/${workspace}/settings` },
    { title: t("dashboard.add_membership_plans"), completed: false, href: `/${workspace}/memberships` },
    { title: t("dashboard.add_trainers"), completed: false, href: `/${workspace}/trainers` },
    { title: t("dashboard.add_members"), completed: (metrics?.active_members ?? 0) > 0, href: `/${workspace}/members` },
    { title: t("dashboard.set_up_attendance"), completed: false, href: `/${workspace}/attendance` },
    { title: t("dashboard.public_gym_website"), completed: false, href: `/${workspace}/website` },
  ];

  const completedStepsCount = checklistSteps.filter((s) => s.completed).length;
  const setupPercent = Math.round((completedStepsCount / checklistSteps.length) * 100);

  const authUser = typeof window !== "undefined" ? getAuthUser() : null;
  const isUuidWorkspace = workspace && /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(workspace);
  const gymDisplayName = authUser?.gymName || (!isUuidWorkspace ? slugToGymName(workspace) : t("dashboard.apex_fitness_club"));
  const ownerDisplayName = authUser?.name || t("dashboard.owner");

  return (
    <div className="space-y-8">
      {/* ─────────────────────────────────────────────────────────────────────────────
          IMMEDIATE DASHBOARD SHELL HEADER (Renders instantly without blocking)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-md bg-[var(--success-soft)] text-[var(--success-foreground)] border border-[var(--success)]/20 inline-flex items-center gap-1.5 shadow-xs">
              <span className={`w-1.5 h-1.5 rounded-full bg-[var(--success)] ${revalidating ? "animate-ping" : "animate-pulse"}`} />
              {gymDisplayName} {t("dashboard.live_workspace")}
            </span>
            {revalidating && (
              <span className="text-[10px] text-[var(--success-foreground)] font-medium flex items-center gap-1">
                {richText(t("dashboard.refreshcwlive_sync"), { refreshcw: <RefreshCw className="w-3 h-3 animate-spin" /> })}</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
            {greeting}, {ownerDisplayName}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[var(--text-muted)] mt-1">
            {isSetupMode ? t("dashboard.let_s_finish_setting_up_your") : "Today's overview — " + today}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href={`/${workspace}/members/new`}>
            <Button size="sm" className="flex-shrink-0 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] rounded-xl font-bold shadow-sm transition-all active:scale-[0.99] cursor-pointer">
              {richText(t("dashboard.plusadd_member"), { plus: <Plus className="h-4 w-4 mr-1.5 stroke-[2.5]" /> })}</Button>
          </Link>
        </div>
      </div>

      {/* 14-Day Free Trial Countdown Card */}
      <TrialCountdownCard workspace={workspace} />

      {/* Member payment proofs awaiting approval + the UPI / QR / bank details members see */}
      <PaymentCollectionCard workspace={workspace} />

      {/* Adaptive Setup Checklist Banner (when in setup phase) */}
      {isSetupMode ? (
        <div className="rounded-2xl border-2 border-[var(--primary)]/30 bg-gradient-to-r from-[var(--primary-soft)] via-[var(--surface)] to-[var(--primary-soft)] dark:from-[var(--background)] dark:via-[var(--surface)] dark:to-[var(--background)] p-4 sm:p-7 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 text-left w-full md:w-auto">
              <RepsiMascot pose="onboarding" size="md" animate={false} />
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--primary-dark)] bg-[var(--primary)]/10 px-2.5 py-0.5 rounded">
                  {t("dashboard.setup_progress_setuppercent", undefined, { setupPercent })}</span>
                <h3 className="text-xl font-black text-[var(--text)] tracking-tight">
                  {t("dashboard.welcome_to_repsi_let_s_get")}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl">
                  {t("dashboard.completedstepscountof_countsteps_completed_add_your_membership", undefined, { completedStepsCount, count: checklistSteps.length })}</p>

                {/* Progress Bar */}
                <div className="w-full max-w-md h-2.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden mt-3">
                  <div
                    className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                    style={{ width: `${setupPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
              <Button
                onClick={() => setShowGettingStartedModal(true)}
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-bold text-xs h-10 px-5 rounded-xl shadow-sm"
              >
                <span>{t("dashboard.continue_setup")}</span>
              </Button>
              <button
                type="button"
                onClick={() => setDismissChecklist(true)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] dark:hover:text-white font-semibold py-1 transition-colors"
              >
                {t("dashboard.i_ll_do_this_later")}
              </button>
            </div>
          </div>

          {/* Checklist steps summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-5 mt-5 border-t border-[var(--primary)]/20 text-xs">
            {checklistSteps.map((step, idx) => (
              <Link
                key={idx}
                href={step.href}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  step.completed
                    ? "bg-[var(--surface)] dark:bg-[var(--raised)] border-[var(--primary)]/30 text-[var(--primary-dark)]"
                    : "bg-[var(--surface-secondary)]/50 dark:bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/40"
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-[var(--primary-dark)] shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-[#94A3B8] shrink-0" />
                )}
                <span className="truncate font-semibold">{step.title}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}


      {/* ─────────────────────────────────────────────────────────────────────────────
          PROGRESSIVE METRIC CARDS (Skeletons during initial load, instant cached render)
      ───────────────────────────────────────────────────────────────────────────── */}
      {loading && !metrics ? (
        <DashboardSkeleton showShellHeader={false} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label={t("dashboard.active_members")}
              sublabel={metrics?.active_members ? "Total enrolled" : "No members yet"}
              value={metrics ? metrics.active_members : 0}
              change={metrics ? metrics.revenue_growth_pct : 0}
              changeType="increase"
              iconName="users"
            />
            <StatCard
              label={t("dashboard.monthly_revenue")}
              sublabel={metrics?.monthly_revenue ? "Current month" : "No payment data yet"}
              value={metrics ? metrics.monthly_revenue : 0}
              change={0}
              changeType="increase"
              isCurrency
              iconName="trending-up"
            />
            <StatCard
              label={t("dashboard.today_s_attendance")}
              sublabel={metrics?.today_attendance ? "Check-ins today" : "Attendance will appear after check-in"}
              value={metrics ? metrics.today_attendance : 0}
              change={0}
              changeType="increase"
              iconName="calendar-check"
            />
            <StatCard
              label={t("dashboard.expiring_soon")}
              sublabel={metrics?.expiring_memberships ? "Within 7 days" : "No expiring plans"}
              value={metrics ? metrics.expiring_memberships : 0}
              change={0}
              changeType="decrease"
              iconName="alert-triangle"
            />
          </div>

          {/* Quick Actions (Positioned directly below stats) */}
          <QuickActions workspace={workspace} />

          {/* Progressive Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            <div className="lg:col-span-4">
              <RevenueChart data={metrics?.revenue_chart} />
            </div>
            <div className="lg:col-span-3">
              <AttendanceChart data={metrics?.attendance_chart} />
            </div>
          </div>

          {/* Activity Row */}
          <div className="grid grid-cols-1 gap-6">
            <RecentActivity />
          </div>
        </>
      )}

      {/* Permanent Getting Started Dialog */}
      <GettingStartedDialog
        workspace={workspace}
        isOpen={showGettingStartedModal}
        onClose={() => setShowGettingStartedModal(false)}
        completedSteps={{
          profile: true,
          memberships: false,
          trainers: false,
          members: (metrics?.active_members ?? 0) > 0,
          attendance: false,
          website: false,
        }}
      />
    </div>
  );
}
