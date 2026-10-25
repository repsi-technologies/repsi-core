"use client";

import { useState, useEffect, use, useMemo } from "react";
import {
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Scan,
  Clock,
  LogOut,
  LogIn,
  RefreshCw,
  Dumbbell,
  AlertCircle,
  Calendar,
  Sparkles,
  Users,
  Search,
  UserCheck,
  UserX,
  Lock,
  Camera,
  Activity,
} from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { repsiApi, ApiAttendance, ApiMember } from "@/lib/api";
import { slugToGymName } from "@/lib/workspace";
import { QrCodeView } from "@/components/ui/qr-code-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n";
import { QrCameraScanner } from "@/features/attendance/components/qr-camera-scanner";

export default function TrainerAttendancePage(props: { params: Promise<{ workspace: string }> }) {
  const params = use(props.params);
  const workspace = params.workspace || "apex-fitness";
  const gymName = slugToGymName(workspace);
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"self" | "members">("self");
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<ApiAttendance[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [canMarkAttendance, setCanMarkAttendance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Member search & check-in state
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberActionLoading, setMemberActionLoading] = useState<string | null>(null);
  const [currentlyInside, setCurrentlyInside] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  const loadAttendance = async () => {
    try {
      const records = await repsiApi.getAttendance();
      setHistory(records);
    } catch (e) {
      console.warn("Failed to load trainer attendance", e);
    }
  };

  const loadPermissionsAndMembers = async () => {
    try {
      const permRes = await repsiApi.getMyPermissions().catch(() => null);
      const perms = permRes?.permissions || [];
      setPermissions(perms);

      const hasAccess = perms.includes("attendance.record") ||
        ["OWNER", "ADMIN", "MANAGER", "SUPER_ADMIN"].includes(user?.role || "");
      setCanMarkAttendance(hasAccess);

      if (hasAccess) {
        setMemberLoading(true);
        const [memList, insideList] = await Promise.all([
          repsiApi.getMembers().catch(() => []),
          repsiApi.getCurrentlyInside().catch(() => []),
        ]);
        setMembers(memList);
        setCurrentlyInside(insideList);
      }
    } catch (err) {
      console.warn("Failed to load staff permissions or members", err);
    } finally {
      setMemberLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const authUser = getAuthUser();
    setUser(authUser);
    loadAttendance();
  }, []);

  useEffect(() => {
    if (user) {
      loadPermissionsAndMembers();
    }
  }, [user]);

  const trainerId = user?.id || user?.sub || "trainer-default";
  const trainerName = user?.name || "Head Coach";
  const trainerEmail = user?.email || "trainer@repsi.app";

  // Trainer QR Payload
  const qrPayload = JSON.stringify({
    type: "repsi_trainer_pass",
    id: trainerId,
    name: trainerName,
    email: trainerEmail,
    workspace: workspace,
  });

  // Check if trainer is currently on duty
  const activeSession = history.find((h) => h.status === "in");

  const handleToggleAttendance = async () => {
    setActionLoading(true);
    setFeedback(null);

    try {
      if (activeSession) {
        await repsiApi.checkOut(activeSession.id);
        setFeedback({
          type: "success",
          message: "Clock-out logged successfully. Shift completed!",
        });
      } else {
        await repsiApi.checkIn({
          trainerId: trainerId,
          identifier: trainerEmail,
          method: "qr",
        });
        setFeedback({
          type: "success",
          message: `Clocked in successfully at ${gymName}! Have a great coaching shift.`,
        });
      }
      await loadAttendance();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to update attendance status.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Member Check-In by Trainer
  const handleMemberCheckIn = async (memberId: string, memberName: string) => {
    setMemberActionLoading(memberId);
    setFeedback(null);
    try {
      await repsiApi.checkIn({
        memberId: memberId,
        method: "staff",
      });
      setFeedback({
        type: "success",
        message: `Successfully checked in ${memberName}!`,
      });
      // Refresh inside list
      const insideList = await repsiApi.getCurrentlyInside().catch(() => []);
      setCurrentlyInside(insideList);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || `Failed to check in ${memberName}.`,
      });
    } finally {
      setMemberActionLoading(null);
    }
  };

  // Member Check-Out by Trainer
  const handleMemberCheckOut = async (attendanceId: string, memberName: string) => {
    setMemberActionLoading(attendanceId);
    setFeedback(null);
    try {
      await repsiApi.checkOut(attendanceId, "STAFF");
      setFeedback({
        type: "success",
        message: `Successfully checked out ${memberName}!`,
      });
      const insideList = await repsiApi.getCurrentlyInside().catch(() => []);
      setCurrentlyInside(insideList);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || `Failed to check out ${memberName}.`,
      });
    } finally {
      setMemberActionLoading(null);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members.slice(0, 15);
    const q = searchQuery.toLowerCase().trim();
    return members.filter((m) =>
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q)
    ).slice(0, 20);
  }, [members, searchQuery]);

  const currentlyInsideMemberIds = useMemo(() => {
    return new Set(currentlyInside.map((c) => c.member_id || c.id));
  }, [currentlyInside]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Trainer Attendance Hub</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Manage your personal coaching shift attendance, or mark member attendance when authorized by the gym owner.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {activeSession ? (
            <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 gap-1.5 px-3 py-1 font-semibold text-xs">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              {t("trainerPortal.onFloorDuty", "On Floor Duty")}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[var(--text-muted)] border-[var(--border)] px-3 py-1 text-xs">
              {t("trainerPortal.offDuty", "Off Duty")}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("self")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "self"
              ? "bg-[var(--primary)] text-white shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>My Shift Attendance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "members"
              ? "bg-[var(--primary)] text-white shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Mark Member Attendance</span>
          {canMarkAttendance && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>
      </div>

      {/* Status Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          )}
          <p className="text-xs font-semibold">{feedback.message}</p>
        </div>
      )}

      {/* TAB 1: Trainer's Own Attendance */}
      {activeTab === "self" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trainer Digital Pass Card */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/10 via-[var(--surface)] to-[var(--surface)] p-6 space-y-5 shadow-sm text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white uppercase tracking-wider shadow-sm">
              <Dumbbell className="h-3.5 w-3.5" />
              <span>Staff Coach Pass</span>
            </div>

            <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-600 font-extrabold text-2xl flex items-center justify-center mx-auto border-2 border-indigo-500/30">
              {trainerName.charAt(0)}
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--text)]">{trainerName}</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{trainerEmail}</p>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                Personal Trainer & Coach • {gymName}
              </p>
            </div>

            {/* Real QR Code */}
            <div className="p-3 bg-white rounded-2xl border border-[var(--border)] max-w-[260px] mx-auto shadow-inner">
              <QrCodeView
                value={qrPayload}
                size={180}
                title={trainerName}
                subtitle="Trainer Staff Access Key"
                showDownload={true}
                showCopy={true}
                darkColor="#312e81"
              />
            </div>

            <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Turnstile & Staff Room Access Token</span>
            </div>
          </div>

          {/* Shift Clock In / Out & Turnstile Integration */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-[var(--text)]">
                    {t("trainerPortal.dutyControls", "Duty Shift Controls")}
                  </h2>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {t("trainerPortal.dutySubtitle", "Log your gym presence for payroll, client session availability, and turnstile door records.")}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--text)]">
                  <span>Duty Status:</span>
                  <span className={activeSession ? "text-indigo-600 font-bold" : "text-[var(--text-muted)]"}>
                    {activeSession ? `Active Shift (Since ${activeSession.checkInTime})` : "Not Clocked In"}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)] flex items-center justify-between">
                  <span>Facility Gate:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Synced with Gym Turnstiles
                  </span>
                </div>
              </div>

              <button
                onClick={handleToggleAttendance}
                disabled={actionLoading}
                type="button"
                className={`w-full flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60 ${
                  activeSession
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {actionLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : activeSession ? (
                  <>
                    <LogOut className="h-4 w-4" />
                    <span>Clock Out of Shift</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Clock In for Coaching Shift</span>
                  </>
                )}
              </button>
            </div>

            {/* Shift Records */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                  My Shift History
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadAttendance}
                  className="h-7 px-2 text-[11px] gap-1 text-[var(--text-muted)]"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </Button>
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] py-4 text-center">
                  No past trainer shifts found for today. Clock in above to start your coaching hours!
                </p>
              ) : (
                <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl max-h-48 overflow-y-auto">
                  {history.slice(0, 5).map((rec) => (
                    <div key={rec.id} className="p-3 flex items-center justify-between text-xs hover:bg-[var(--surface-hover)]">
                      <div>
                        <p className="font-semibold text-[var(--text)]">Coaching Floor Shift</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          In: {rec.checkInTime} {rec.checkOutTime ? `· Out: ${rec.checkOutTime}` : "· Active Now"}
                        </p>
                      </div>
                      {rec.status === "in" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                          On Duty
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]">
                          Shift Ended
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Mark Member Attendance */}
      {activeTab === "members" && (
        <div className="space-y-6">
          {!canMarkAttendance ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[var(--text)]">
                Member Attendance Recording Locked
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                Gym owners control which staff can mark member check-ins. If you need permission to check in members at class studios or front gates, ask your gym owner to grant the <strong>attendance.record</strong> permission on your staff account.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Controls Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:max-w-md">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search member by name, phone or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowScanner(true)}
                    className="h-10 px-3 text-xs gap-1.5 rounded-xl border-[var(--border)]"
                  >
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>Scan Member QR</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadPermissionsAndMembers}
                    className="h-10 px-3 text-xs gap-1 text-[var(--text-muted)]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </Button>
                </div>
              </div>

              {/* QR Camera Scanner Modal */}
              {showScanner && (
                <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                      <Camera className="w-4 h-4 text-indigo-600" />
                      <span>Live Member Pass Scanner</span>
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowScanner(false)} className="text-xs h-7">
                      Close Scanner
                    </Button>
                  </div>
                  <QrCameraScanner
                    onResult={async (token: string) => {
                      setShowScanner(false);
                      try {
                        const scanRes = await repsiApi.scanQr(token);
                        setFeedback({
                          type: "success",
                          message: scanRes.message || `Member ${scanRes.person_name} marked successfully!`,
                        });
                        const insideList = await repsiApi.getCurrentlyInside().catch(() => []);
                        setCurrentlyInside(insideList);
                      } catch (err: any) {
                        setFeedback({ type: "error", message: err.message || "Failed to scan member pass." });
                      }
                    }}
                  />
                </div>
              )}

              {/* Member List Grid */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <span>Gym Members ({filteredMembers.length})</span>
                  </h3>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {currentlyInside.length} members currently on gym floor
                  </span>
                </div>

                {memberLoading ? (
                  <p className="text-xs text-[var(--text-muted)] py-8 text-center">Loading gym members...</p>
                ) : filteredMembers.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] py-8 text-center">
                    No matching members found.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl max-h-96 overflow-y-auto">
                    {filteredMembers.map((m) => {
                      const isInside = currentlyInsideMemberIds.has(m.id);
                      const insideRecord = currentlyInside.find((c) => c.member_id === m.id || c.id === m.id);
                      const isBusy = memberActionLoading === m.id || (insideRecord && memberActionLoading === insideRecord.attendance_id);

                      return (
                        <div key={m.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--surface-hover)]">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-[var(--text)] truncate">{m.name}</p>
                              {isInside ? (
                                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] px-2 py-0">
                                  Inside Gym
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[var(--text-muted)] text-[10px] px-2 py-0">
                                  Outside
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                              {[m.phone, m.email].filter(Boolean).join(" · ")}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isInside && insideRecord ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isBusy}
                                onClick={() => handleMemberCheckOut(insideRecord.attendance_id || insideRecord.id, m.name)}
                                className="h-8 px-3 text-[11px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200"
                              >
                                <UserX className="w-3.5 h-3.5 mr-1" />
                                <span>Check Out</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={isBusy}
                                onClick={() => handleMemberCheckIn(m.id, m.name)}
                                className="h-8 px-3 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                              >
                                <UserCheck className="w-3.5 h-3.5 mr-1" />
                                <span>Check In</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
