"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  UserCheck,
  LogOut,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { repsiApi, type ApiAccessEligibility } from "@/lib/api";
import { formatDate, getInitials } from "@/lib/utils";
import { QrCameraScanner } from "@/features/attendance/components/qr-camera-scanner";

type Feedback = { tone: "success" | "error"; message: string } | null;

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ReceptionCheckInPage() {
  const params = useParams();
  const workspace = params.workspace as string;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [preview, setPreview] = useState<ApiAccessEligibility | null>(null);
  const [previewSource, setPreviewSource] = useState<{ memberId?: string; identifier?: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [working, setWorking] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [recent, setRecent] = useState<any[]>([]);

  const loadRecent = useCallback(() => {
    repsiApi.getAttendance().then((res) => setRecent((res || []).slice(0, 8)));
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  // Server-side member search (name, phone, email or member ID)
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      repsiApi
        .listMembers({ query: q, pageSize: 6 })
        .then((res) => setResults(res.items))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const openPreview = async (source: { memberId?: string; identifier?: string }) => {
    setLoadingPreview(true);
    setOverrideOpen(false);
    setOverrideReason("");
    setFeedback(null);
    try {
      setPreview(await repsiApi.getAccessEligibility(source));
      setPreviewSource(source);
    } catch (err: any) {
      setPreview(null);
      setPreviewSource(null);
      setFeedback({ tone: "error", message: err.message || "Member not found" });
    } finally {
      setLoadingPreview(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setPreviewSource(null);
    setQuery("");
    setResults([]);
    setOverrideOpen(false);
    setOverrideReason("");
  };

  const handleCheckIn = async (withOverride: boolean) => {
    if (!preview || !previewSource) return;
    if (withOverride && overrideReason.trim().length < 3) {
      setFeedback({ tone: "error", message: "Enter a reason for the override (at least 3 characters)." });
      return;
    }
    setWorking(true);
    try {
      await repsiApi.staffCheckIn({
        // A scanned pass is redeemed here (single use); the preview only verified it.
        ...(previewSource.identifier ? { identifier: previewSource.identifier } : { memberId: preview.member.id }),
        method: previewSource.identifier ? "qr" : "manual",
        overrideReason: withOverride ? overrideReason.trim() : undefined,
      });
      setFeedback({ tone: "success", message: `${preview.member.name} checked in${withOverride ? " (override recorded)" : ""}.` });
      reset();
      loadRecent();
    } catch (err: any) {
      setFeedback({ tone: "error", message: err.message });
      openPreview({ memberId: preview.member.id });
    } finally {
      setWorking(false);
    }
  };

  const handleCheckOut = async () => {
    if (!preview?.active_visit) return;
    setWorking(true);
    try {
      const rec = await repsiApi.staffCheckOut(preview.active_visit.id);
      setFeedback({ tone: "success", message: `${preview.member.name} checked out · ${rec.duration_formatted}.` });
      reset();
      loadRecent();
    } catch (err: any) {
      setFeedback({ tone: "error", message: err.message });
    } finally {
      setWorking(false);
    }
  };

  const decision = preview?.decision;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/${workspace}/attendance`}
            aria-label="Back to attendance"
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-[var(--text-muted)]" />
          </Link>
          <div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold">RECEPTION DESK</span>
            <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight mt-1">Check-in terminal</h1>
          </div>
        </div>
        <Link href={`/${workspace}/attendance/history`}>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" /> History
          </Button>
        </Link>
      </div>

      {feedback && (
        <div
          role={feedback.tone === "error" ? "alert" : "status"}
          className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${
            feedback.tone === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
              : "bg-rose-500/10 border-rose-500/30 text-rose-600"
          }`}
        >
          {feedback.tone === "success" ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <XCircle className="h-4 w-4 flex-shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[var(--border)] bg-[var(--surface)]">
          <CardHeader>
            <CardTitle className="text-lg">Find member</CardTitle>
            <CardDescription>Search by name, phone, email or member ID.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" aria-hidden />
              <Input
                aria-label="Search members"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Priya, 98450, member ID"
                className="pl-11 h-12 text-base rounded-xl"
                autoFocus
              />
            </div>
            {searching && <p className="text-xs text-[var(--text-muted)]">Searching…</p>}
            {!searching && query.trim() && results.length === 0 && (
              <p className="text-xs text-[var(--text-muted)]">No members match “{query.trim()}”.</p>
            )}
            {results.length > 0 && (
              <ul className="border border-[var(--border)] rounded-xl overflow-hidden divide-y divide-[var(--border)] bg-[var(--background)]">
                {results.map((m) => {
                  const name = `${m.first_name} ${m.last_name || ""}`.trim();
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => openPreview({ memberId: m.id })}
                        className="w-full p-3 flex items-center gap-3 text-left hover:bg-[var(--surface-hover)] focus-visible:bg-[var(--surface-hover)] outline-none"
                      >
                        <Avatar className="h-9 w-9"><AvatarFallback>{getInitials(name)}</AvatarFallback></Avatar>
                        <span>
                          <span className="block font-semibold text-sm text-[var(--text)]">{name}</span>
                          <span className="text-xs text-[var(--text-muted)]">{m.phone || m.email || m.id}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-[var(--border)] bg-[var(--surface)]">
          <CardHeader>
            <CardTitle className="text-lg">Scan member pass</CardTitle>
            <CardDescription>Members open “My QR pass” in the REPSI app. Passes refresh every minute and work once.</CardDescription>
          </CardHeader>
          <CardContent>
            <QrCameraScanner
              busy={loadingPreview || working}
              label="Start scanner"
              manualPlaceholder="Pass code or member ID"
              onResult={(value) => openPreview(value.startsWith("rpass1.") ? { identifier: value } : { memberId: value })}
            />
          </CardContent>
        </Card>
      </div>

      {loadingPreview && (
        <div className="flex justify-center py-6" aria-busy="true"><Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" /></div>
      )}

      {preview && decision && !loadingPreview && (
        <Card className={`border-2 bg-[var(--surface)] ${decision.allowed ? "border-emerald-500" : "border-rose-500"}`}>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16"><AvatarFallback className="text-lg font-bold">{getInitials(preview.member.name)}</AvatarFallback></Avatar>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text)]">{preview.member.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant={decision.allowed ? "active" : "cancelled"}>{decision.allowed ? "Access allowed" : "Access denied"}</Badge>
                    {preview.active_visit && <Badge variant="frozen">Inside since {timeOf(preview.active_visit.check_in_time)}</Badge>}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                    {decision.valid_until ? `Membership valid until ${formatDate(decision.valid_until)}` : "No current membership"}
                    {preview.last_visit && ` · Last visit ${formatDate(preview.last_visit.check_in_time)} ${timeOf(preview.last_visit.check_in_time)}`}
                  </p>
                </div>
              </div>
              <Link href={`/${workspace}/members/${preview.member.id}`} className="text-xs text-[var(--primary-dark)] hover:underline">
                Open profile
              </Link>
            </div>

            {!decision.allowed && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-500/5 border border-rose-500/30 p-3 text-sm text-rose-600" role="alert">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{decision.reason}</span>
              </div>
            )}
            {decision.allowed && decision.warnings.includes("grace_period") && (
              <p className="text-xs text-amber-600">{decision.reason}</p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={reset}>Cancel</Button>
              {preview.active_visit ? (
                <Button size="lg" className="gap-2 font-bold" disabled={working} onClick={handleCheckOut}>
                  {working ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />} Check out
                </Button>
              ) : decision.allowed ? (
                <Button size="lg" className="gap-2 font-bold" disabled={working} onClick={() => handleCheckIn(false)}>
                  {working ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserCheck className="h-5 w-5" />} Check in
                </Button>
              ) : decision.overridable && preview.can_override ? (
                <Button variant="destructive" onClick={() => setOverrideOpen(true)} disabled={overrideOpen}>
                  Override and check in
                </Button>
              ) : (
                <span className="self-center text-xs text-[var(--text-muted)]">
                  {decision.overridable ? "A manager can override this denial." : "Resolve this on the member's profile."}
                </span>
              )}
            </div>

            {overrideOpen && (
              <div className="space-y-2 rounded-lg border border-[var(--border)] p-3">
                <label htmlFor="override-reason" className="text-xs text-[var(--text-secondary)] block">
                  Reason for override (saved to the audit log)
                </label>
                <textarea
                  id="override-reason"
                  rows={2}
                  maxLength={500}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm text-[var(--text)] outline-none resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setOverrideOpen(false)}>Back</Button>
                  <Button variant="destructive" size="sm" disabled={working} onClick={() => handleCheckIn(true)}>
                    Confirm override
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-[var(--border)] bg-[var(--surface)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-4 text-center text-xs text-[var(--text-muted)]">No check-ins yet today.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((item) => (
                <li key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm">
                  <span className="font-medium text-[var(--text)]">{item.name}</span>
                  <span className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span>In {item.checkInTime}</span>
                    {item.checkOutTime && <span>Out {item.checkOutTime}</span>}
                    <span className="uppercase">{item.method}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
