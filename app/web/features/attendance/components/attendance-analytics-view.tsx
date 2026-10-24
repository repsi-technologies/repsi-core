"use client";

import { useState } from "react";
import {
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle,
  Award,
  Users,
  Flame,
  ArrowRight,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiAttendanceAnalytics } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

interface AttendanceAnalyticsViewProps {
  analytics: ApiAttendanceAnalytics | null;
  averageDwellMinutes: number;
}

export function AttendanceAnalyticsView({
  analytics,
  averageDwellMinutes,
}: AttendanceAnalyticsViewProps) {
  const { t } = useTranslation();
  const [selectedRange, setSelectedRange] = useState<number>(30);

  if (!analytics) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-xs text-[var(--text-muted)]">
        {t("attendance.loading_analytics_charts")}
      </div>
    );
  }

  const maxCheckIn = Math.max(1, ...analytics.daily_trends.map((d) => d.check_ins));
  const maxHourly = Math.max(1, ...analytics.hourly_distribution.map((h) => h.count));
  const maxDay = Math.max(1, ...analytics.day_of_week_distribution.map((d) => d.count));

  return (
    <div className="space-y-6">
      {/* Retention Risk Alert Banner */}
      {analytics.inactive_members_count > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--text)]">{t("attendance.member_retention_alert")}</h3>
                <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[10px]">
                  {t("attendance.action_needed")}
                </Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                <strong className="text-[var(--text)] font-semibold">
                  {t("attendance.inactive_members_countactive_members", undefined, { inactive_members_count: analytics.inactive_members_count })}</strong>{" "}
                {t("attendance.haven_t_visited_the_gym_in")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => {
                alert(t("attendance.exporting_follow_up_list_for_inactive", undefined, { inactive_members_count: analytics.inactive_members_count }));
              }}
              size="sm"
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm"
            >
              {t("attendance.export_re_engagement_list")}
            </Button>
          </div>
        </div>
      )}

      {/* Main KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {t("attendance.total_visits_30d")}
          </span>
          <p className="text-2xl font-extrabold text-[var(--text)]">{analytics.total_visits_period}</p>
          <span className="text-[11px] text-emerald-600 font-medium">{t("attendance.all_logged_entrance_scans")}</span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {t("attendance.unique_members")}
          </span>
          <p className="text-2xl font-extrabold text-[var(--text)]">{analytics.unique_members_visited}</p>
          <span className="text-[11px] text-[var(--text-muted)]">{t("attendance.active_facility_patrons")}</span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {t("attendance.average_workout_duration")}
          </span>
          <p className="text-2xl font-extrabold text-[var(--text)]">
            {Math.floor(averageDwellMinutes / 60)}h {averageDwellMinutes % 60}m
          </p>
          <span className="text-[11px] text-blue-600 font-medium">{t("attendance.consistent_daily_dwell")}</span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {t("attendance.retention_risk_14d")}
          </span>
          <p className="text-2xl font-extrabold text-amber-600">{analytics.inactive_members_count}</p>
          <span className="text-[11px] text-amber-600/80 font-medium">{t("attendance.inactive_members_flagged")}</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hourly Distribution (Peak Hours) */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--text)]">{t("attendance.peak_hours_distribution")}</h3>
              <p className="text-[11px] text-[var(--text-muted)]">{t("attendance.busiest_gym_check_in_hours_of")}</p>
            </div>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="space-y-2 pt-2">
            {analytics.hourly_distribution.slice(0, 10).map((h) => {
              const pct = Math.round((h.count / maxHourly) * 100);
              return (
                <div key={h.hour} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-mono text-[var(--text)]">{h.hour}</span>
                    <span className="font-semibold text-[var(--text-muted)]">{h.count} check-ins</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--background)] rounded-full overflow-hidden border border-[var(--border)]">
                    <div
                      className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Days of Week Peak */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--text)]">{t("attendance.busiest_days_of_week")}</h3>
              <p className="text-[11px] text-[var(--text-muted)]">{t("attendance.weekly_traffic_distribution_pattern")}</p>
            </div>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>

          <div className="space-y-2.5 pt-2">
            {analytics.day_of_week_distribution.map((d) => {
              const pct = Math.round((d.count / maxDay) * 100);
              return (
                <div key={d.day} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-semibold text-[var(--text)]">{d.day}</span>
                    <span className="font-mono text-[var(--text-muted)]">{d.count} visits</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--background)] rounded-full overflow-hidden border border-[var(--border)]">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Most Active Members & Inactive Members Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Active */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-[var(--text)]">{t("attendance.most_active_gym_members")}</h3>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">{t("attendance.top_consistency")}</span>
          </div>

          {analytics.most_active_members.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-4 text-center">{t("attendance.no_member_activity_recorded_yet")}</p>
          ) : (
            <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl">
              {analytics.most_active_members.map((m, idx) => (
                <div key={m.id || idx} className="p-3 flex items-center justify-between text-xs hover:bg-[var(--surface-hover)]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--background)] text-[var(--text-muted)] flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-[var(--text)]">{m.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{m.plan}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-bold">
                    {t("attendance.visitsvisits", undefined, { visits: m.visits })}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inactive Members List (Retention) */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-[var(--text)]">{t("attendance.at_risk_inactive_members_14_days")}</h3>
            </div>
            <span className="text-[11px] text-amber-600 font-semibold">{t("attendance.follow_up_needed")}</span>
          </div>

          {analytics.inactive_members.length === 0 ? (
            <div className="p-6 text-center text-xs text-emerald-600 font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t("attendance.great_job_all_active_members_have")}</span>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl max-h-64 overflow-y-auto">
              {analytics.inactive_members.map((m, idx) => (
                <div key={m.id || idx} className="p-3 flex items-center justify-between text-xs hover:bg-[var(--surface-hover)]">
                  <div>
                    <p className="font-semibold text-[var(--text)]">{m.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{m.phone || m.plan}</p>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-[10px]">
                    {t("attendance.14_days_absent")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
