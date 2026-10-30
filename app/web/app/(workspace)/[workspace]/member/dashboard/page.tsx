"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CalendarCheck,
  ChevronRight,
  Dumbbell,
  Flame,
  QrCode,
  Salad,
  Receipt,
  RefreshCw,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { formatDate, useTranslation } from "@/lib/i18n";
import {
  repsiApi,
  type ApiCoachingMe,
  type ApiMemberPersonalAttendance,
  type ApiMemberSelf,
} from "@/lib/api";
import { fitnessApi, type ApiScheduleOccurrence } from "@/lib/fitness-api";
import { cn } from "@/lib/utils";

type Load<T> = { data: T | null; error: string | null; loading: boolean };
const initial = { data: null, error: null, loading: true };

/** Loads once per `key` (and again on retry); `fn` is read from a ref so callers can pass inline lambdas. */
function useLoad<T>(fn: () => Promise<T>, key: string): [Load<T>, () => void] {
  const [state, setState] = useState<Load<T>>(initial);
  const [attempt, setAttempt] = useState(0);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef.current()
      .then((data) => live && setState({ data, error: null, loading: false }))
      .catch((e: Error) => live && setState({ data: null, error: e.message, loading: false }));
    return () => {
      live = false;
    };
  }, [key, attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return [state, retry];
}

function localISODate(d = new Date()) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5", className)}>{children}</section>;
}

function CardTitle({ icon: Icon, title, href, linkLabel }: { icon: React.ElementType; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold text-[var(--text)]">
        <Icon className="h-4.5 w-4.5 shrink-0 text-[var(--primary)]" aria-hidden />
        <span className="truncate">{title}</span>
      </h2>
      {href && (
        <Link href={href} className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[var(--link)] hover:underline">
          {linkLabel}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-muted)]">
      <span className="min-w-0">{message}</span>
      <button type="button" onClick={onRetry} className="inline-flex shrink-0 items-center gap-1 font-semibold text-[var(--link)] hover:underline">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
        {t("common.retry", "Retry")}
      </button>
    </div>
  );
}

function Skeleton({ h = "h-12" }: { h?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-[var(--surface-secondary)]", h)} />;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl bg-[var(--background-secondary)] p-3">
      <p className="truncate text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-0.5 truncate text-lg font-bold tabular-nums text-[var(--text)]">{value}</p>
    </div>
  );
}

export default function MemberDashboardPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = use(params);
  const { t, language } = useTranslation();
  const [firstName, setFirstName] = useState("");
  useEffect(() => setFirstName((getAuthUser()?.name || "").trim().split(" ")[0] || ""), []);

  const today = localISODate();
  const [self, reloadSelf] = useLoad<ApiMemberSelf>(() => repsiApi.getMySelf(), "self");
  const [attendance, reloadAttendance] = useLoad<ApiMemberPersonalAttendance>(() => repsiApi.getMyPersonalAttendance(), "attendance");
  const [coaching, reloadCoaching] = useLoad<ApiCoachingMe>(() => repsiApi.getMyCoaching(), "coaching");
  const [schedule, reloadSchedule] = useLoad<ApiScheduleOccurrence[]>(
    () => fitnessApi.schedule({ date_from: today, date_to: today }),
    today,
  );

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t("memberPortal.greetMorning", "Good morning") : hour < 17 ? t("memberPortal.greetAfternoon", "Good afternoon") : t("memberPortal.greetEvening", "Good evening");

  const base = `/${workspace}`;
  const quick = [
    { icon: QrCode, label: t("nav.digital_qr_pass", "My Pass"), href: `${base}/member/qr` },
    { icon: UserRound, label: t("nav.trainer", "My Trainer"), href: `${base}/member/trainer` },
    { icon: Salad, label: t("nav.diet_plan", "Diet plan"), href: `${base}/member/diet` },
    { icon: TrendingUp, label: t("nav.progress", "Progress"), href: `${base}/member/progress` },
    { icon: Receipt, label: t("nav.my_payments", "Payments"), href: `${base}/member/payments` },
    { icon: Bot, label: t("nav.ai_coach", "AI Coach"), href: `${base}/member/ai-coach` },
  ];

  // Current membership: newest active one, else the most recent (status only — plan details live on My Membership).
  const memberships = [...(self.data?.memberships ?? [])].sort((a, b) => b.end_date.localeCompare(a.end_date));
  const current = memberships.find((m) => m.status.toUpperCase() === "ACTIVE" && m.end_date >= today) ?? memberships[0];
  const daysLeft = current ? Math.ceil((new Date(current.end_date).getTime() - new Date(today).getTime()) / 86400000) : 0;
  const expired = current ? daysLeft < 0 : false;
  const soon = current ? !expired && daysLeft <= 7 : false;

  const todayItems = (schedule.data ?? []).filter((o) => !o.is_rest_day);
  const restDay = (schedule.data ?? []).some((o) => o.is_rest_day) && todayItems.length === 0;

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-muted)]">{greeting}</p>
          <h1 className="truncate text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
            {firstName || t("memberPortal.letsTrain", "Let's train")}
          </h1>
        </div>
        <Link
          href={`${base}/member/qr`}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
        >
          <QrCode className="h-4 w-4" aria-hidden />
          {t("memberPortal.tapToCheckIn", "Check in with QR")}
        </Link>
      </header>

      {/* Today's workout */}
      <Card className="border-[var(--primary)]/30">
        <CardTitle icon={Dumbbell} title={t("memberPortal.todaysWorkout", "Today's workout")} href={`${base}/member/workout`} linkLabel={t("memberPortal.viewPlan", "View plan")} />
        {schedule.loading ? (
          <Skeleton h="h-16" />
        ) : schedule.error ? (
          <InlineError message={schedule.error} onRetry={reloadSchedule} />
        ) : todayItems.length > 0 ? (
          <ul className="space-y-2">
            {todayItems.map((o) => (
              <li key={`${o.assignment_id}-${o.day_id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--background-secondary)] p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--text)]">{o.day_name}</p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {o.assignment_title} · {t("memberPortal.exerciseCount", "{count} exercises", { count: o.exercise_count })}
                  </p>
                </div>
                <Link
                  href={`${base}/member/workout`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
                >
                  {o.status === "completed" ? t("memberPortal.viewWorkout", "View") : t("memberPortal.startWorkout", "Start workout")}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--text-muted)]">
              {restDay
                ? t("memberPortal.restDay", "Rest day — recovery is part of the plan.")
                : t("memberPortal.noWorkoutToday", "No workout scheduled today. Ask your trainer for a plan or try the AI coach.")}
            </p>
            <Link href={`${base}/member/exercises`} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--link)] hover:underline">
              <BookOpen className="h-4 w-4" aria-hidden />
              {t("memberPortal.exploreExercises", "Explore exercises")}
            </Link>
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {/* Membership status (no plan/pricing details on the dashboard) */}
        <Card>
          <CardTitle icon={CalendarCheck} title={t("memberPortal.membership", "Membership")} href={`${base}/member/membership`} linkLabel={t("memberPortal.details", "Details")} />
          {self.loading ? (
            <Skeleton />
          ) : self.error ? (
            <InlineError message={self.error} onRetry={reloadSelf} />
          ) : !current ? (
            <p className="text-sm text-[var(--text-muted)]">{t("memberPortal.noMembershipYet", "No membership yet. Visit the front desk to get started.")}</p>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--text)]">
                {expired
                  ? t("memberPortal.expiredOn", "Expired on {date}", { date: formatDate(current.end_date, language) })
                  : t("memberPortal.validUntil", "Valid until {date}", { date: formatDate(current.end_date, language) })}
              </p>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                  expired ? "bg-[var(--error-soft)] text-[var(--error)]" : soon ? "bg-[var(--warning-soft)] text-[var(--warning)]" : "bg-[var(--success-soft)] text-[var(--success)]",
                )}
              >
                {expired ? t("common.expired", "Expired") : soon ? t("memberPortal.daysLeft", "{count} days left", { count: daysLeft }) : t("common.active", "Active")}
              </span>
            </div>
          )}
        </Card>

        {/* Trainer */}
        <Card>
          <CardTitle icon={UserRound} title={t("memberPortal.yourPersonalTrainer", "Your trainer")} href={`${base}/member/trainer`} linkLabel={t("memberPortal.details", "Details")} />
          {coaching.loading ? (
            <Skeleton />
          ) : coaching.error ? (
            <InlineError message={coaching.error} onRetry={reloadCoaching} />
          ) : coaching.data && coaching.data.trainers.length > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary-dark)]">
                  {coaching.data.trainers[0].name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--text)]">{coaching.data.trainers[0].name}</p>
                  {coaching.data.trainers[0].specialization && (
                    <p className="truncate text-xs text-[var(--text-muted)]">{coaching.data.trainers[0].specialization}</p>
                  )}
                </div>
              </div>
              <Link href={`${base}/chat`} className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-hover)]">
                {t("memberPortal.messageTrainer", "Message")}
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--text-muted)]">
                {coaching.data?.has_pending_request
                  ? t("memberPortal.trainerRequestPending", "Your trainer request is with the gym.")
                  : t("memberPortal.noTrainer", "No trainer assigned yet.")}
              </p>
              {!coaching.data?.has_pending_request && (
                <Link href={`${base}/member/trainer`} className="text-sm font-semibold text-[var(--link)] hover:underline">
                  {t("memberPortal.requestTrainer", "Request a trainer")}
                </Link>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Attendance */}
      <Card>
        <CardTitle icon={Flame} title={t("memberPortal.myAttendance", "My attendance")} href={`${base}/member/attendance`} linkLabel={t("memberPortal.viewAttendance", "View all")} />
        {attendance.loading ? (
          <Skeleton h="h-20" />
        ) : attendance.error ? (
          <InlineError message={attendance.error} onRetry={reloadAttendance} />
        ) : attendance.data ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label={t("memberPortal.thisWeek", "This week")} value={attendance.data.this_week_visits} />
              <Metric label={t("memberPortal.thisMonth", "This month")} value={attendance.data.this_month_visits} />
              <Metric label={t("memberPortal.streak", "Streak")} value={t("memberPortal.daysCount", "{count} days", { count: attendance.data.current_streak_days })} />
              <Metric label={t("memberPortal.avgVisit", "Avg. visit")} value={`${Math.round(attendance.data.average_duration_minutes)} min`} />
            </div>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              {attendance.data.is_currently_inside
                ? t("memberPortal.insideNow", "You're checked in right now.")
                : attendance.data.last_visit_time
                  ? t("memberPortal.lastVisit", "Last visit: {date}", { date: formatDate(attendance.data.last_visit_time, language) })
                  : t("memberPortal.noVisitsYet", "No visits yet — scan your QR pass at the gym.")}
            </p>
          </>
        ) : null}
      </Card>

      {/* Quick access — same six shortcuts as the mobile app */}
      <section aria-labelledby="quick-access">
        <h2 id="quick-access" className="mb-3 text-base font-semibold text-[var(--text)]">{t("memberPortal.quickAccess", "Quick access")}</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {quick.map(({ icon: Icon, label, href }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-center hover:border-[var(--primary)]/40"
            >
              <Icon className="h-5 w-5 text-[var(--primary)]" aria-hidden />
              <span className="line-clamp-2 text-xs font-medium leading-tight text-[var(--text)]">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
