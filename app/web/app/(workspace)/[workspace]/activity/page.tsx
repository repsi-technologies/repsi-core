"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { repsiApi, type ApiAuditLog } from "@/lib/api";

const ACTION_GROUPS = [
  { value: "", label: "All activity" },
  { value: "attendance.", label: "Attendance" },
  { value: "attendance.override", label: "Access overrides" },
  { value: "attendance.corrected", label: "Attendance corrections" },
  { value: "staff.", label: "Staff & permissions" },
  { value: "trainer.", label: "Trainer assignments" },
  { value: "members_exported", label: "Member exports" },
];

const PAGE_SIZE = 50;

function describe(log: ApiAuditLog): string {
  return log.action.replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function summarizeDetails(details: ApiAuditLog["details"]): string | null {
  if (!details || typeof details === "string") return details || null;
  const d = details as Record<string, any>;
  const parts: string[] = [];
  if (d.reason) parts.push(`Reason: ${d.reason}`);
  if (d.override_reason) parts.push(`Override: ${d.override_reason}`);
  if (d.denial_code) parts.push(`Denied as ${String(d.denial_code).toLowerCase().replace(/_/g, " ")}`);
  if (d.before && d.after) {
    const changed = Object.keys(d.after).filter((k) => JSON.stringify(d.before[k]) !== JSON.stringify(d.after[k]));
    if (changed.length) parts.push(`Changed: ${changed.join(", ")}`);
  }
  if (typeof d.rows === "number") parts.push(`${d.rows} rows`);
  return parts.length ? parts.join(" · ") : null;
}

export default function WorkspaceActivityPage() {
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ApiAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await repsiApi.getAuditLogs({ action: action || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, page, pageSize: PAGE_SIZE });
      setItems(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [action, dateFrom, dateTo, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [action, dateFrom, dateTo]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const inputClass = "rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text)]";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Activity &amp; audit log</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Staff actions on attendance, access overrides, corrections, team permissions and exports. Entries can&apos;t be edited or deleted.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-[var(--text-muted)] flex flex-col gap-1">
          Type
          <select value={action} onChange={(e) => setAction(e.target.value)} className={inputClass}>
            {ACTION_GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </label>
        <label className="text-xs text-[var(--text-muted)] flex flex-col gap-1">
          From
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputClass} />
        </label>
        <label className="text-xs text-[var(--text-muted)] flex flex-col gap-1">
          To
          <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} className={inputClass} />
        </label>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        {error ? (
          <div role="alert" className="p-6 text-center space-y-3">
            <ShieldAlert className="h-6 w-6 text-rose-500 mx-auto" />
            <p className="text-sm text-[var(--text)]">{error}</p>
            <Button variant="secondary" size="sm" onClick={load}>Try again</Button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-10" aria-busy="true"><Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" /></div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Activity className="h-6 w-6 text-[var(--text-muted)] mx-auto" />
            <p className="text-xs font-semibold text-[var(--text)]">No activity for these filters</p>
            <p className="text-[11px] text-[var(--text-muted)]">Check-ins recorded by staff, overrides, corrections and team changes appear here.</p>
          </div>
        ) : (
          <ol className="space-y-5">
            {items.map((log) => {
              const summary = summarizeDetails(log.details);
              return (
                <li key={log.id} className="flex items-start gap-4 text-sm">
                  <span className="w-8 h-8 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                    <Activity className="h-4 w-4 text-[var(--primary)]" aria-hidden />
                  </span>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="font-medium text-[var(--text)] flex flex-wrap items-center gap-2">
                      {describe(log)}
                      {log.outcome !== "success" && <Badge variant="cancelled">{log.outcome}</Badge>}
                    </p>
                    {summary && <p className="text-xs text-[var(--text-secondary)] mt-0.5 break-words">{summary}</p>}
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      by <strong>{log.actor_name || "System"}</strong> · {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {!error && total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>{total} entries</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span>Page {page} of {pageCount}</span>
            <Button variant="secondary" size="sm" disabled={page >= pageCount || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
