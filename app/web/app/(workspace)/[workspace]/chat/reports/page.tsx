"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Flag, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/organization/form-fields";
import { repsiApi, type ApiChatReport, type ApiChatReportDetail, type ChatReportStatus } from "@/lib/api";
import { REPORT_REASONS } from "@/features/communications/report-chat-dialog";
import { formatDate, useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STATUS_TABS: { id: ChatReportStatus | "all"; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "reviewing", label: "Reviewing" },
  { id: "resolved", label: "Resolved" },
  { id: "dismissed", label: "Dismissed" },
  { id: "all", label: "All" },
];

const STATUS_STYLE: Record<ChatReportStatus, string> = {
  open: "bg-[var(--error-soft)] text-[var(--error)]",
  reviewing: "bg-[var(--warning-soft)] text-[var(--warning)]",
  resolved: "bg-[var(--success-soft)] text-[var(--success)]",
  dismissed: "bg-[var(--surface-secondary)] text-[var(--text-muted)]",
};

const reasonLabel = (id: string) => REPORT_REASONS.find((r) => r.id === id)?.label ?? id;

/**
 * Owner/admin/manager review of chats reported by members or trainers. Managers only see a
 * conversation through a report on it (the API enforces this and audits each view).
 */
export default function ChatReportsPage() {
  const { language } = useTranslation();
  const search = useSearchParams();
  const [tab, setTab] = useState<ChatReportStatus | "all">("open");
  const [reports, setReports] = useState<ApiChatReport[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(search.get("report"));
  const [detail, setDetail] = useState<ApiChatReportDetail | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setReports(null);
    repsiApi
      .listChatReports(tab === "all" ? undefined : tab)
      .then(setReports)
      .catch((e: Error) => {
        setError(e.message);
        setReports([]);
      });
  }, [tab]);
  useEffect(load, [load]);

  useEffect(() => {
    if (!selectedId) return setDetail(null);
    setDetail(null);
    repsiApi.getChatReport(selectedId).then(setDetail).catch((e: Error) => setError(e.message));
  }, [selectedId]);

  const review = async (status: ChatReportStatus) => {
    if (!detail) return;
    setBusy(true);
    setError(null);
    try {
      await repsiApi.reviewChatReport(detail.id, { status, note: note.trim() || undefined });
      setNote("");
      setDetail(await repsiApi.getChatReport(detail.id));
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-[var(--text)]">
          <ShieldAlert className="h-5 w-5 text-[var(--primary)]" aria-hidden />
          Chat reports
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Conversations members or trainers flagged for review. You only see a chat when it has been reported.
        </p>
      </div>

      <div role="tablist" className="flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={tab === s.id}
            onClick={() => setTab(s.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              tab === s.id ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--nav-active-text)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && <FormAlert kind="error">{error}</FormAlert>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <ul className="space-y-2" aria-label="Reports">
          {reports === null ? (
            <li className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" /></li>
          ) : reports.length === 0 ? (
            <li className="rounded-[12px] border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-muted)]">
              No reports here.
            </li>
          ) : (
            reports.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  aria-current={selectedId === r.id}
                  className={cn(
                    "w-full rounded-[12px] border bg-[var(--surface)] p-3 text-left hover:border-[var(--border-strong)]",
                    selectedId === r.id ? "border-[var(--primary)]" : "border-[var(--border)]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-[var(--text)]">{reasonLabel(r.reason)}</span>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", STATUS_STYLE[r.status])}>{r.status}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                    {r.reporter_name} ({r.reporter_kind}) reported {r.reported_name} ({r.reported_kind})
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{formatDate(r.created_at, language, { dateStyle: "medium", timeStyle: "short" })}</p>
                </button>
              </li>
            ))
          )}
        </ul>

        <section className="min-h-[300px] rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-4" aria-label="Report detail">
          {!selectedId ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-sm text-[var(--text-muted)]">
              <Flag className="h-6 w-6" aria-hidden />
              Select a report to review it.
            </div>
          ) : !detail ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" /></div>
          ) : (
            <div className="space-y-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-[var(--text-muted)]">Reporter</dt><dd className="text-[var(--text)]">{detail.reporter_name} · {detail.reporter_kind}</dd></div>
                <div><dt className="text-xs text-[var(--text-muted)]">Reported</dt><dd className="text-[var(--text)]">{detail.reported_name} · {detail.reported_kind}</dd></div>
                <div><dt className="text-xs text-[var(--text-muted)]">Reason</dt><dd className="text-[var(--text)]">{reasonLabel(detail.reason)}</dd></div>
                <div><dt className="text-xs text-[var(--text-muted)]">Reported on</dt><dd className="text-[var(--text)]">{formatDate(detail.created_at, language, { dateStyle: "medium", timeStyle: "short" })}</dd></div>
              </dl>
              {detail.details && <p className="rounded-[10px] bg-[var(--background)] p-3 text-sm text-[var(--text)]">{detail.details}</p>}

              <div>
                <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">Conversation context</h2>
                <div className="max-h-72 space-y-2 overflow-y-auto rounded-[10px] bg-[var(--background)] p-3">
                  {detail.messages.length === 0 && <p className="text-xs text-[var(--text-muted)]">No messages.</p>}
                  {detail.messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "rounded-[8px] px-3 py-2 text-sm",
                        m.id === detail.message_id ? "border border-[var(--error)] bg-[var(--error-soft)]" : "bg-[var(--surface)]",
                      )}
                    >
                      <p className="text-[11px] font-semibold capitalize text-[var(--text-muted)]">
                        {m.sender_kind === "trainer" ? "Trainer" : "Member"} · {formatDate(m.created_at, language, { dateStyle: "short", timeStyle: "short" })}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-[var(--text)]">{m.body || (m.attachment_type ? `Shared ${m.attachment_type.replace("_", " ")}` : "")}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">History</h2>
                <ol className="space-y-1 text-xs text-[var(--text-muted)]">
                  {detail.events.map((e, i) => (
                    <li key={i}>
                      {formatDate(e.created_at, language, { dateStyle: "short", timeStyle: "short" })} — {e.from_status ? `${e.from_status} → ` : "filed as "}
                      <span className="font-medium text-[var(--text)]">{e.to_status}</span>
                      {e.note ? `: ${e.note}` : ""}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-2 border-t border-[var(--border)] pt-4">
                <label htmlFor="review-note" className="text-sm font-medium text-[var(--text)]">Review note (optional)</label>
                <textarea
                  id="review-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={2000}
                  rows={2}
                  className="w-full resize-none rounded-[10px] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text)]"
                />
                <div className="flex flex-wrap gap-2">
                  {detail.status === "open" && <Button size="sm" variant="outline" disabled={busy} onClick={() => review("reviewing")}>Mark reviewing</Button>}
                  <Button size="sm" disabled={busy || detail.status === "resolved"} onClick={() => review("resolved")}>Resolve</Button>
                  <Button size="sm" variant="outline" disabled={busy || detail.status === "dismissed"} onClick={() => review("dismissed")}>Dismiss</Button>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  To end the coaching relationship, unassign the trainer from the member&apos;s profile.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
