"use client";

import { useState, useEffect, useCallback, use } from "react";
import { CheckCircle2, AlertCircle, Clock, LogOut, RefreshCw, ScanLine, ShieldCheck, Loader2 } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { repsiApi, ApiAttendance } from "@/lib/api";
import { slugToGymName } from "@/lib/workspace";
import { QrCodeView } from "@/components/ui/qr-code-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCameraScanner } from "@/features/attendance/components/qr-camera-scanner";

type Result = { status: "success" | "error"; message: string } | null;

export default function MemberQRCheckinPage(props: { params: Promise<{ workspace: string }> }) {
  const params = use(props.params);
  const workspace = params.workspace;
  const gymName = slugToGymName(workspace);

  const [memberName, setMemberName] = useState("");
  const [history, setHistory] = useState<ApiAttendance[]>([]);
  const [pass, setPass] = useState<{ token: string; expires_at: number } | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);

  const loadAttendance = useCallback(async () => {
    try {
      setHistory(await repsiApi.getAttendance());
    } catch {
      /* history is secondary on this page */
    }
  }, []);

  const refreshPass = useCallback(async () => {
    try {
      setPassError(null);
      setPass(await repsiApi.getMyMemberPass());
    } catch (err: any) {
      setPass(null);
      setPassError(err.message);
    }
  }, []);

  useEffect(() => {
    setMemberName(getAuthUser()?.name || "");
    loadAttendance();
    refreshPass();
  }, [loadAttendance, refreshPass]);

  // Countdown; fetch a fresh pass a few seconds before expiry.
  useEffect(() => {
    if (!pass) return;
    const tick = () => {
      const left = Math.max(0, pass.expires_at - Math.floor(Date.now() / 1000));
      setSecondsLeft(left);
      if (left <= 5) refreshPass();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pass, refreshPass]);

  const activeSession = history.find((h) => h.status === "in");

  const handleEntranceScan = async (value: string) => {
    setBusy(true);
    setResult(null);
    try {
      await repsiApi.selfCheckInWithGymQr(value);
      setResult({ status: "success", message: `Checked in at ${gymName}. Have a great session!` });
      await loadAttendance();
    } catch (err: any) {
      setResult({ status: "error", message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleCheckOut = async () => {
    setBusy(true);
    setResult(null);
    try {
      const rec = await repsiApi.selfCheckOut();
      setResult({ status: "success", message: `Checked out · ${rec.duration_formatted}. See you next time!` });
      await loadAttendance();
    } catch (err: any) {
      setResult({ status: "error", message: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">My QR pass</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Show this pass at the front desk, or scan the QR code at the entrance to check yourself in.
          </p>
        </div>
        {activeSession ? (
          <Badge variant="active" className="gap-1.5 px-3 py-1">Inside {gymName}</Badge>
        ) : (
          <Badge variant="outline" className="px-3 py-1">Currently outside</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section aria-labelledby="pass-heading" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 text-center">
          <h2 id="pass-heading" className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--text)]">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Front-desk pass
          </h2>
          {memberName && <p className="text-lg font-semibold text-[var(--text)]">{memberName}</p>}

          {passError ? (
            <div className="space-y-3 py-6" role="alert">
              <AlertCircle className="h-8 w-8 mx-auto text-rose-500" />
              <p className="text-xs text-[var(--text-muted)]">{passError}</p>
              <Button variant="secondary" size="sm" onClick={refreshPass}><RefreshCw className="h-3.5 w-3.5" /> Try again</Button>
            </div>
          ) : pass ? (
            <>
              <div className="p-3 bg-white rounded-2xl border border-[var(--border)] max-w-[260px] mx-auto">
                <QrCodeView value={pass.token} size={200} title="Member pass" showDownload={false} showCopy={false} />
              </div>
              <p className="text-xs text-[var(--text-muted)] flex items-center justify-center gap-1" aria-live="polite">
                <Clock className="w-3.5 h-3.5" /> Refreshes in {secondsLeft}s · works once · no personal details inside
              </p>
            </>
          ) : (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" /></div>
          )}
          <p className="text-[11px] text-[var(--text-muted)]">
            Staff still check your membership when they scan it. Screenshots stop working within a minute.
          </p>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="self-heading" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
            <h2 id="self-heading" className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
              <ScanLine className="h-4 w-4 text-emerald-600" /> {activeSession ? "Check out" : "Check in at the entrance"}
            </h2>

            {result && (
              <div
                role={result.status === "error" ? "alert" : "status"}
                className={`p-3 rounded-xl border text-sm flex items-start gap-2 ${
                  result.status === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-700"
                }`}
              >
                {result.status === "success" ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
                <span>{result.message}</span>
              </div>
            )}

            {activeSession ? (
              <>
                <p className="text-xs text-[var(--text-muted)]">Inside since {activeSession.checkInTime || "—"}.</p>
                <Button onClick={handleCheckOut} disabled={busy} className="w-full">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Check out now
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-[var(--text-muted)]">
                  Point your camera at the REPSI QR code displayed at the gym entrance.
                </p>
                <QrCameraScanner busy={busy} onResult={handleEntranceScan} label="Scan entrance QR" manualPlaceholder="Code shown under the entrance QR" />
              </>
            )}
          </section>

          <section aria-labelledby="recent-heading" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 id="recent-heading" className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">My recent visits</h3>
              <Button variant="ghost" size="sm" onClick={loadAttendance} className="h-7 px-2 text-[11px] gap-1">
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-4 text-center">No visits recorded yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl max-h-56 overflow-y-auto">
                {history.slice(0, 10).map((rec) => (
                  <li key={rec.id} className="p-3 flex items-center justify-between text-xs">
                    <span className="text-[var(--text)]">
                      {rec.checkInTime}{rec.checkOutTime ? ` – ${rec.checkOutTime}` : ""}
                    </span>
                    <span className="text-[var(--text-muted)]">{rec.status === "in" ? "Inside" : rec.durationFormatted || "Completed"}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
