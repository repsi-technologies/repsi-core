"use client";

import { useState, useEffect, use, useRef } from "react";
import {
  Scan,
  Camera,
  CheckCircle2,
  Clock,
  Calendar,
  Flame,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Info,
  Dumbbell,
  VideoOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { repsiApi, ApiMemberPersonalAttendance } from "@/lib/api";
import { QrCameraScanner } from "@/features/attendance/components/qr-camera-scanner";
import { getAuthUser } from "@/lib/auth";
import { slugToGymName } from "@/lib/workspace";

type AttendanceState =
  | "NOT_CHECKED_IN"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "AUTO_CHECKED_OUT"
  | "INVALID_QR"
  | "EXPIRED_MEMBERSHIP"
  | "SUSPENDED_MEMBER"
  | "QR_INACTIVE"
  | "ALREADY_CHECKED_IN";

export default function MemberAttendancePage(props: { params: Promise<{ workspace: string }> }) {
  const params = use(props.params);
  const workspace = params.workspace || "apex-fitness";
  const gymName = slugToGymName(workspace);

  const [personalStats, setPersonalStats] = useState<ApiMemberPersonalAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Camera & Scan Modal
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraScanning, setCameraScanning] = useState(false);
  const [scanResultState, setScanResultState] = useState<AttendanceState | null>(null);
  const [scanFeedbackMessage, setScanFeedbackMessage] = useState<string>("");

  // Live Timer for Active Session
  const [liveDuration, setLiveDuration] = useState("0m");

  const loadData = async () => {
    try {
      setLoadError(null);
      setPersonalStats(await repsiApi.getMyPersonalAttendance());
    } catch (err: any) {
      setLoadError(err.message || "Couldn't load your attendance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspace]);

  // Live stopwatch when currently inside
  useEffect(() => {
    if (!personalStats?.active_session?.checkInTime) return;

    const updateTimer = () => {
      const active = personalStats.active_session;
      if (!active) return;
      const start = new Date(active.checkInTime);
      const diffMins = Math.max(0, Math.floor((Date.now() - start.getTime()) / 60000));
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;
      setLiveDuration(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [personalStats]);

  // Check in by scanning the physical entrance QR (the backend validates the token and membership)
  const handleEntranceScan = async (scanned: string) => {
    setCameraScanning(true);
    setScanResultState(null);
    setScanFeedbackMessage("");

    try {
      await repsiApi.selfCheckInWithGymQr(scanned);
      setScanResultState("CHECKED_IN");
      setScanFeedbackMessage(`Check-in successful! Welcome to ${gymName}.`);
      await loadData();
    } catch (err: any) {
      const errMsg = err.message || "";
      if (errMsg.toLowerCase().includes("already checked in")) {
        setScanResultState("ALREADY_CHECKED_IN");
        setScanFeedbackMessage(errMsg);
      } else if (errMsg.startsWith("Check-in blocked")) {
        setScanResultState("SUSPENDED_MEMBER");
        setScanFeedbackMessage(errMsg.replace("Check-in blocked: ", ""));
      } else if (errMsg.includes("deactivated") || errMsg.includes("replaced")) {
        setScanResultState("QR_INACTIVE");
        setScanFeedbackMessage("This QR code has been rotated or deactivated by the gym owner.");
      } else {
        setScanResultState("INVALID_QR");
        setScanFeedbackMessage(errMsg || "Invalid QR code. Please scan the current entrance display.");
      }
    } finally {
      setCameraScanning(false);
    }
  };

  // Manual Check-Out
  const handleManualCheckOut = async () => {
    if (!personalStats?.active_session?.id) return;
    try {
      await repsiApi.checkOut(personalStats.active_session.id, "MANUAL");
      await loadData();
      alert("Checked out successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to check out");
    }
  };

  const isInside = personalStats?.is_currently_inside ?? false;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">
            My Attendance & Gym Access
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Scan entrance QR passes, track workout consistency, and manage your sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isInside ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1.5 px-3 py-1 font-semibold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Inside {gymName}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[var(--text-muted)] border-[var(--border)] px-3 py-1 text-xs">
              Outside Gym
            </Badge>
          )}
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-600">
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={loadData}>Try again</Button>
        </div>
      )}

      {/* Main Action Banner: Mobile-First Scan or Active Session */}
      <div className="rounded-3xl border border-[var(--border)] bg-gradient-to-br from-emerald-500/10 via-[var(--surface)] to-[var(--surface)] p-6 sm:p-8 space-y-6 shadow-sm">
        {isInside ? (
          /* Active Session View */
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Active Workout Session
                </span>
                <h2 className="text-xl font-bold text-[var(--text)]">You're Currently Checked In</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Check-In Time
                </span>
                <p className="text-lg font-bold font-mono text-[var(--text)]">
                  {personalStats?.active_session?.checkInTime
                    ? new Date(personalStats.active_session.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Active"}
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Session Duration
                </span>
                <p className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
                  <span>{liveDuration}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Smart Auto Checkout
                </span>
                <p className="text-xs font-semibold text-[var(--text-muted)] pt-1">
                  Active (Max 4h or 10 PM)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleManualCheckOut}
                className="h-11 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-[var(--primary-foreground)] font-bold text-xs gap-2 shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Check Out Now</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Ready to Scan Banner */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-md">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 font-bold text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fast 1-Tap Entry</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
                Scan Gym QR to Check In
              </h2>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Aim your device camera at the reception QR code or kiosk monitor to record your visit in seconds.
              </p>
            </div>

            <Button
              onClick={() => {
                setScanResultState(null);
                setCameraModalOpen(true);
              }}
              size="lg"
              className="h-13 px-8 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-extrabold text-sm gap-2.5 shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.02]"
            >
              <Scan className="w-5 h-5" />
              <span>Scan QR / Check In</span>
            </Button>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Visits</span>
            <Dumbbell className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-[var(--text)]">{personalStats?.total_visits ?? 0}</p>
          <span className="text-[11px] text-[var(--text-muted)]">All-time workouts</span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-500">
            {personalStats?.current_streak_days ?? 0} Days
          </p>
          <span className="text-[11px] text-[var(--text-muted)]">Consecutive training</span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">This Month</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-[var(--text)]">{personalStats?.this_month_visits ?? 0}</p>
          <span className="text-[11px] text-[var(--text-muted)]">Visits logged</span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Average Session</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-[var(--text)]">
            {Math.floor((personalStats?.average_duration_minutes ?? 60) / 60)}h {(personalStats?.average_duration_minutes ?? 60) % 60}m
          </p>
          <span className="text-[11px] text-[var(--text-muted)]">Dwell time</span>
        </div>
      </div>

      {/* Attendance Calendar Heatmap (Monthly View) */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-[var(--text)]">Attendance Calendar</h3>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            Current Month Consistency
          </span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2 pt-2 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <span key={day} className="text-[10px] font-bold uppercase text-[var(--text-muted)] pb-1">
              {day}
            </span>
          ))}

          {Array.from({ length: 31 }, (_, i) => {
            const dayNum = i + 1;
            const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const attended = personalStats?.calendar_attendance_dates?.includes(dateStr);
            const isToday = dayNum === new Date().getDate();

            return (
              <div
                key={dayNum}
                className={`h-11 rounded-xl flex flex-col items-center justify-center text-xs font-semibold border transition-all ${
                  attended
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                    : isToday
                    ? "border-emerald-500 text-[var(--text)] bg-emerald-500/10 font-bold"
                    : "border-[var(--border)] bg-[var(--background)] text-[var(--text-muted)] opacity-60"
                }`}
              >
                <span>{dayNum}</span>
                {attended && <span className="w-1 h-1 rounded-full bg-white mt-0.5" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Camera QR Scanner Modal */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-[var(--text)]">Scan Gym Entrance QR</h3>
              </div>
              <button
                onClick={() => setCameraModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Camera scanner (handles permission-denied and unsupported browsers itself) */}
            {(
              <div className="space-y-4">
                <QrCameraScanner
                  busy={cameraScanning}
                  onResult={handleEntranceScan}
                  label="Start camera"
                  manualPlaceholder="Code shown under the entrance QR"
                />

                {/* Scan Status Feedback */}
                {scanResultState && (
                  <div
                    className={`p-4 rounded-2xl border text-center space-y-1.5 ${
                      scanResultState === "CHECKED_IN" || scanResultState === "CHECKED_OUT"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                        : scanResultState === "ALREADY_CHECKED_IN"
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300"
                        : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 font-bold text-sm">
                      {scanResultState === "CHECKED_IN" || scanResultState === "CHECKED_OUT" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span>
                        {scanResultState === "CHECKED_IN"
                          ? "Check-in successful!"
                          : scanResultState === "CHECKED_OUT"
                          ? "Check-out logged!"
                          : scanResultState === "ALREADY_CHECKED_IN"
                          ? "You're already checked in"
                          : scanResultState === "SUSPENDED_MEMBER"
                          ? "Membership Suspended"
                          : "Invalid QR Code"}
                      </span>
                    </div>
                    <p className="text-xs opacity-90">{scanFeedbackMessage}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
