"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  UserCheck,
  Users,
  Clock,
  TrendingUp,
  Search,
  Plus,
  CheckCircle2,
  LogOut,
  QrCode,
  Scan,
  Sparkles,
  Dumbbell,
  ShieldCheck,
  RefreshCw,
  X,
  ArrowRight,
  ExternalLink,
  Settings,
  History,
  BarChart3,
  Flame,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCodeView } from "@/components/ui/qr-code-view";
import {
  repsiApi,
  ApiAttendance,
  ApiAttendanceSummary,
  ApiCurrentlyInside,
  ApiAttendanceQR,
  ApiAttendanceSettings,
  ApiAttendanceAnalytics,
  ApiMember,
  ApiTrainer,
} from "@/lib/api";
import { getWorkspaceFromPath, slugToGymName } from "@/lib/workspace";

// Sub-components
import { QrManagementCard } from "./components/qr-management-card";
import { CurrentlyInsideTable } from "./components/currently-inside-table";
import { AttendanceHistoryTable } from "./components/attendance-history-table";
import { AttendanceAnalyticsView } from "./components/attendance-analytics-view";
import { AttendanceSettingsCard } from "./components/attendance-settings-card";
import { useTranslation, tr } from "@/lib/i18n";

type TabKey = "overview" | "qr_manager" | "history" | "analytics" | "settings";

export function AttendanceClient() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspace = getWorkspaceFromPath(pathname);
  const gymName = slugToGymName(workspace);

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [showQrModal, setShowQrModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [checkIns, setCheckIns] = useState<ApiAttendance[]>([]);
  const [currentlyInside, setCurrentlyInside] = useState<ApiCurrentlyInside[]>([]);
  const [summary, setSummary] = useState<ApiAttendanceSummary>({
    today_total: 0,
    currently_inside: 0,
    total_checked_out: 0,
    peak_hour: "06:00 – 08:30 AM",
    average_dwell_minutes: 60,
    abnormal_sessions_count: 0,
    auto_checkouts_count: 0,
  });
  const [activeQr, setActiveQr] = useState<ApiAttendanceQR | null>(null);
  const [settings, setSettings] = useState<ApiAttendanceSettings | null>(null);
  const [analytics, setAnalytics] = useState<ApiAttendanceAnalytics | null>(null);
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [trainers, setTrainers] = useState<ApiTrainer[]>([]);

  // Manual Check-In Modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualSearch, setManualSearch] = useState("");
  const [manualTab, setManualTab] = useState<"member" | "trainer">("member");

  // Scanner Simulator Modal
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scanStatus, setScanStatus] = useState<{
    type: "success" | "error";
    message: string;
    details?: string;
  } | null>(null);
  const [scanning, setScanning] = useState(false);

  const loadData = async () => {
    try {
      const [att, inside, sum, qr, sett, ana, mems, trs] = await Promise.all([
        repsiApi.getAttendance(),
        repsiApi.getCurrentlyInside(),
        repsiApi.getAttendanceSummary(),
        repsiApi.getActiveQr(undefined, workspace).catch(() => null),
        repsiApi.getAttendanceSettings().catch(() => null),
        repsiApi.getAttendanceAnalytics().catch(() => null),
        repsiApi.getMembers().catch(() => []),
        repsiApi.getTrainers().catch(() => []),
      ]);

      setCheckIns(att);
      setCurrentlyInside(inside);
      setSummary(sum);
      if (qr) setActiveQr(qr);
      if (sett) setSettings(sett);
      if (ana) setAnalytics(ana);
      setMembers(mems);
      setTrainers(trs);
    } catch (err) {
      console.error("Failed to load attendance dashboard data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam === "qr" || tabParam === "qr_manager") {
      setActiveTab("qr_manager");
    }
    if (searchParams?.get("show_qr") === "true") {
      setShowQrModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();

    // Auto-refresh live data every 20 seconds
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, [workspace]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleManualCheckInMember = async (m: ApiMember) => {
    try {
      await repsiApi.checkInMember(m.id, m.name);
      await loadData();
      setManualModalOpen(false);
      setManualSearch("");
    } catch (e: any) {
      alert(e.message || t("attendance.failed_to_check_in_member"));
    }
  };

  const handleManualCheckOut = async (attendanceId: string) => {
    try {
      await repsiApi.checkOut(attendanceId, "STAFF");
      await loadData();
      setManualModalOpen(false);
      setManualSearch("");
    } catch (e: any) {
      alert(e.message || t("attendance.failed_to_check_out"));
    }
  };

  const handleManualCheckInTrainer = async (t: ApiTrainer) => {
    try {
      await repsiApi.checkInTrainer(t.id, t.name);
      await loadData();
      setManualModalOpen(false);
      setManualSearch("");
    } catch (e: any) {
      alert(e.message || tr("attendance.failed_to_check_in_trainer"));
    }
  };

  const handleSimulateScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    setScanning(true);
    setScanStatus(null);
    try {
      const res = await repsiApi.scanQr(scanInput.trim());
      setScanStatus({
        type: "success",
        message: res.message,
        details: `Session status: ${res.action === "check_in" ? "CHECKED_IN" : "CHECKED_OUT"}`,
      });
      await loadData();
      setScanInput("");
    } catch (err: any) {
      setScanStatus({
        type: "error",
        message: err.message || t("attendance.access_scan_failed"),
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">
              {t("attendance.attendance_command_hub")}
            </h1>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-semibold">
              {t("attendance.live_access")}
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {t("attendance.real_time_gym_attendance_secure_revocable")}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => setShowQrModal(true)}
            className="text-xs gap-1.5 h-9 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-bold shadow-sm cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{t("attendance.show_qr_code")}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{t("common.refresh")}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setScannerModalOpen(true)}
            className="text-xs gap-1.5 h-9"
          >
            <Scan className="w-3.5 h-3.5 text-blue-500" />
            <span>{t("attendance.fast_pass_scan")}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setManualModalOpen(true)}
            className="text-xs gap-1.5 h-9 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] shadow-sm font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("attendance.manual_entry")}</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] overflow-x-auto pb-1">
        {[
          { key: "overview", label: t("attendance.today_s_overview_live_inside"), icon: Users },
          { key: "qr_manager", label: t("attendance.attendance_qr_station"), icon: QrCode },
          { key: "history", label: t("attendance.attendance_history_log"), icon: History },
          { key: "analytics", label: t("attendance.attendance_analytics"), icon: BarChart3 },
          { key: "settings", label: t("attendance.attendance_policies_settings"), icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & CURRENTLY INSIDE */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {t("attendance.today_s_check_ins")}
              </span>
              <p className="text-2xl font-extrabold text-[var(--text)]">{summary.today_total}</p>
              <span className="text-[10px] text-emerald-600 font-medium">{t("attendance.scans_recorded_today")}</span>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                {t("attendance.currently_inside")}
              </span>
              <p className="text-2xl font-extrabold text-emerald-600 flex items-center gap-1.5">
                <span>{summary.currently_inside}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              </p>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">{t("attendance.active_workout_sessions")}</span>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {t("attendance.checked_out")}
              </span>
              <p className="text-2xl font-extrabold text-[var(--text)]">{summary.total_checked_out}</p>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">{t("attendance.completed_sessions")}</span>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {t("attendance.average_session")}
              </span>
              <p className="text-2xl font-extrabold text-[var(--text)]">
                {Math.floor(summary.average_dwell_minutes / 60)}h {summary.average_dwell_minutes % 60}m
              </p>
              <span className="text-[10px] text-blue-600 font-medium">{t("attendance.daily_dwell_time")}</span>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {t("attendance.peak_time")}
              </span>
              <p className="text-xs font-bold text-[var(--text)] truncate font-mono mt-1">
                {summary.peak_hour}
              </p>
              <span className="text-[10px] text-amber-600 font-medium">{t("attendance.busiest_window")}</span>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {t("attendance.auto_check_outs")}
              </span>
              <p className="text-2xl font-extrabold text-amber-600">{summary.auto_checkouts_count}</p>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">{t("attendance.smart_closing_rule")}</span>
            </div>
          </div>

          {/* Quick Reception Check-in QR Access Banner */}
          <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/30 dark:via-emerald-900/10 dark:to-transparent p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--text)]">{t("attendance.gym_reception_check_in_qr_pass")}</h3>
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
                    {t("attendance.live_pass_ready")}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t("attendance.display_this_pass_at_front_desk")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <Button
                size="sm"
                onClick={() => setShowQrModal(true)}
                className="text-xs gap-1.5 h-9 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-bold cursor-pointer shadow-sm"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{t("attendance.show_qr_pass")}</span>
              </Button>
              <Link href={`/${workspace}/attendance/display`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 h-9 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t("attendance.kiosk_screen")}</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("qr_manager")}
                className="text-xs gap-1.5 h-9 cursor-pointer"
              >
                <span>{t("attendance.qr_settings")}</span>
              </Button>
            </div>
          </div>

          {/* Live Currently Inside Table */}
          <CurrentlyInsideTable members={currentlyInside} onRefresh={loadData} />
        </div>
      )}

      {/* TAB 2: ATTENDANCE QR STATION */}
      {activeTab === "qr_manager" && (
        <div className="space-y-6">
          <QrManagementCard
            workspace={workspace}
            gymName={gymName}
            activeQr={activeQr}
            onRefresh={loadData}
          />
        </div>
      )}

      {/* TAB 3: ATTENDANCE HISTORY LOG */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <AttendanceHistoryTable records={checkIns} gymName={gymName} />
        </div>
      )}

      {/* TAB 4: ATTENDANCE ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <AttendanceAnalyticsView
            analytics={analytics}
            averageDwellMinutes={summary.average_dwell_minutes}
          />
        </div>
      )}

      {/* TAB 5: SETTINGS & POLICIES */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <AttendanceSettingsCard settings={settings} onRefresh={loadData} />
        </div>
      )}

      {/* Fast Pass Scanner Simulator Modal */}
      {scannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-[var(--text)]">{t("attendance.fast_pass_turnstile_simulator")}</h3>
              </div>
              <button
                onClick={() => setScannerModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              {t("attendance.simulate_member_camera_scanner_or_turnstile")}
            </p>

            <form onSubmit={handleSimulateScan} className="space-y-3">
              <input
                type="text"
                autoFocus
                placeholder={t("attendance.scan_pass_payload_member_email_or")}
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--text)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />

              <Button
                type="submit"
                disabled={scanning || !scanInput.trim()}
                className="w-full text-xs font-semibold h-10 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]"
              >
                {scanning ? t("attendance.processing") : t("attendance.process_entrance_scan")}
              </Button>
            </form>

            {scanStatus && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                  scanStatus.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {scanStatus.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{scanStatus.message}</span>
                </div>
                {scanStatus.details && <p className="text-[11px] opacity-80">{scanStatus.details}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Check-In Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text)]">{t("attendance.reception_manual_check_in")}</h3>
              <button
                onClick={() => setManualModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 text-xs">
              <button
                type="button"
                onClick={() => setManualTab("member")}
                className={`pb-1 font-semibold ${manualTab === "member" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-[var(--text-muted)]"}`}
              >
                {t("attendance.members_count", undefined, { count: members.length })}</button>
              <button
                type="button"
                onClick={() => setManualTab("trainer")}
                className={`pb-1 font-semibold ${manualTab === "trainer" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-[var(--text-muted)]"}`}
              >
                {t("attendance.trainers_count", undefined, { count: trainers.length })}</button>
            </div>

            <input
              type="text"
              placeholder={t("attendance.search_by_name_phone_or_email")}
              value={manualSearch}
              onChange={(e) => setManualSearch(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--text)] focus:outline-none"
            />

            <div className="max-h-60 overflow-y-auto divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl">
              {manualTab === "member" ? (
                members
                  .filter((m) =>
                    m.name.toLowerCase().includes(manualSearch.toLowerCase()) ||
                    (m.phone && m.phone.includes(manualSearch)) ||
                    (m.email && m.email.toLowerCase().includes(manualSearch.toLowerCase()))
                  )
                  .map((m) => {
                    const activeInside = currentlyInside.find((ci) => ci.member_id === m.id);
                    const isInside = Boolean(activeInside);
                    const isExpired = m.status === "expired" || m.status === "cancelled";

                    return (
                      <div
                        key={m.id}
                        className="p-3 flex items-center justify-between hover:bg-[var(--surface-hover)] text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-[var(--text)]">{m.name}</p>
                            {isInside ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                {t("attendance.inside_duration_formatted", undefined, { duration_formatted: activeInside?.duration_formatted })}</span>
                            ) : isExpired ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                {m.status.toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-500/10 text-[var(--text-muted)]">
                                {m.plan || t("attendance.standard")}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)]">{m.phone || m.email}</p>
                        </div>

                        {isInside ? (
                          <Button
                            size="sm"
                            onClick={() => handleManualCheckOut(activeInside!.attendance_id)}
                            className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-[var(--primary-foreground)] font-semibold"
                          >
                            {t("attendance.check_out")}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isExpired}
                            onClick={() => handleManualCheckInMember(m)}
                            className={`h-7 text-xs font-semibold ${
                              isExpired
                                ? "opacity-50 cursor-not-allowed bg-slate-400 text-white"
                                : "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]"
                            }`}
                          >
                            {isExpired ? t("attendance.membership_expired") : t("attendance.check_in")}
                          </Button>
                        )}
                      </div>
                    );
                  })
              ) : (
                trainers
                  .filter((t) =>
                    t.name.toLowerCase().includes(manualSearch.toLowerCase()) ||
                    (t.phone && t.phone.includes(manualSearch))
                  )
                  .map((t) => {
                    const activeInside = currentlyInside.find((ci) => ci.trainer_id === t.id);
                    const isInside = Boolean(activeInside);

                    return (
                      <div
                        key={t.id}
                        className="p-3 flex items-center justify-between hover:bg-[var(--surface-hover)] text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-[var(--text)]">{t.name}</p>
                            {isInside && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                {tr("attendance.inside_duration_formatted", undefined, { duration_formatted: activeInside?.duration_formatted })}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)]">{t.phone}</p>
                        </div>

                        {isInside ? (
                          <Button
                            size="sm"
                            onClick={() => handleManualCheckOut(activeInside!.attendance_id)}
                            className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-[var(--primary-foreground)] font-semibold"
                          >
                            {tr("attendance.check_out")}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleManualCheckInTrainer(t)}
                            className="h-7 text-xs bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-semibold"
                          >
                            {tr("attendance.check_in")}
                          </Button>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Owner Show QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text)] tracking-tight">{t("attendance.reception_check_in_qr_pass")}</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">{t("attendance.gymname_main_gate_entrance", undefined, { gymName })}</p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-md">
                <QrCodeView
                  value={activeQr?.payload || `repsi://gym/checkin?gym_id=${workspace}&token=rep_live_pass`}
                  size={240}
                  title={gymName}
                  subtitle={t("attendance.scan_with_repsi_app_to_check")}
                  showDownload={true}
                  showCopy={true}
                />
              </div>
              <span className="text-[11px] font-medium text-[var(--text-muted)] text-center max-w-xs">
                {t("attendance.members_scan_this_code_with_their")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]">
              <Link href={`/${workspace}/attendance/display`} className="w-full">
                <Button
                  variant="outline"
                  className="w-full text-xs font-semibold h-10 gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t("attendance.kiosk_fullscreen")}</span>
                </Button>
              </Link>
              <Button
                onClick={() => {
                  setShowQrModal(false);
                  setActiveTab("qr_manager");
                }}
                className="w-full text-xs font-bold h-10 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] gap-1.5 cursor-pointer shadow-sm"
              >
                <span>{t("attendance.manage_print")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
