"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, Lightbulb, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { aiApi, SOURCE_LABEL, type AiSummary, type InsightsResponse, type ReminderGroup, type ReportType } from "@/lib/ai-api";
import { communicationsApi } from "@/lib/communications-api";
import { EmptyBlock, LoadingRow, Modal, Notice } from "@/features/fitness/shared";

const REPORTS: { key: ReportType; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "revenue", label: "Revenue" },
  { key: "attendance", label: "Attendance" },
  { key: "memberships", label: "Memberships" },
];

function SourceBadge({ source }: { source: AiSummary["source"] }) {
  return <Badge variant={source === "ai" || source === "cached" ? "lime" : "outline"}>{SOURCE_LABEL[source]}</Badge>;
}

function SummaryBlock({ data }: { data: AiSummary }) {
  return (
    <div className="space-y-3">
      <p className="text-[15px] leading-relaxed text-[var(--text)]">{data.summary}</p>
      {data.highlights.length > 0 && (
        <ul className="space-y-1.5">
          {data.highlights.map((h, i) => (
            <li key={i} className="flex gap-2 text-sm text-[var(--text-secondary)]">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
              {h}
            </li>
          ))}
        </ul>
      )}
      {data.actions.length > 0 && (
        <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
          <p className="text-xs font-semibold text-[var(--text)] mb-1.5 flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> Suggested next steps</p>
          <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
            {data.actions.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}
      {data.notice && <p className="text-xs text-[var(--text-muted)]">{data.notice}</p>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <p className="text-[11px] text-[var(--text-muted)]">{label}</p>
      <p className="text-lg font-bold text-[var(--text)]">{value}</p>
    </div>
  );
}

function Reminders() {
  const [groups, setGroups] = useState<ReminderGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<ReminderGroup | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    aiApi.reminders().then((r) => setGroups(r.groups)).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const send = async (g: ReminderGroup) => {
    setBusy(true);
    try {
      const b = await communicationsApi.sendBroadcast({
        title: g.suggested_title,
        message: g.suggested_message,
        channels: ["in_app"],
        audience: { segment: "selected_members", member_ids: g.members.map((m) => m.member_id) },
      });
      setDone(`Reminder sent to ${b.recipient_count} member(s). Track delivery in Broadcasts > History.`);
      setSending(null);
    } catch (e) {
      setError((e as Error).message);
      setSending(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3" aria-labelledby="reminders-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="reminders-title" className="flex items-center gap-2 text-base font-semibold text-[var(--text)]"><BellRing className="h-4 w-4" /> Smart reminders</h2>
        <Badge variant="outline">Calculated · no AI cost</Badge>
      </div>
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      {done && <Notice kind="success" onDismiss={() => setDone(null)}>{done}</Notice>}
      {!groups ? <LoadingRow /> : groups.length === 0 ? (
        <EmptyBlock title="Nothing to follow up today">No unpaid balances, renewals, freezes or inactive members right now.</EmptyBlock>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {groups.map((g) => (
            <div key={g.key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[var(--text)]">{g.label}</h3>
                <Badge variant="expiring">{g.count}</Badge>
              </div>
              <ul className="text-xs text-[var(--text-secondary)] space-y-0.5 max-h-28 overflow-auto">
                {g.members.slice(0, 8).map((m) => <li key={m.member_id}>{m.name} · <span className="text-[var(--text-muted)]">{m.detail}</span></li>)}
                {g.count > 8 && <li className="text-[var(--text-muted)]">+{g.count - 8} more</li>}
              </ul>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setSending(g)}>
                <Send className="h-3.5 w-3.5" /> Send reminder
              </Button>
            </div>
          ))}
        </div>
      )}
      {sending && (
        <Modal title={`Remind: ${sending.label}`} onClose={() => setSending(null)}>
          <div className="space-y-3 text-sm">
            <p className="text-[var(--text-secondary)]">An in-app message goes to {Math.min(sending.count, sending.members.length)} member(s) with an app account:</p>
            <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
              <p className="font-semibold text-[var(--text)]">{sending.suggested_title}</p>
              <p className="text-[var(--text-secondary)] mt-1">{sending.suggested_message}</p>
            </div>
            <p className="text-xs text-[var(--text-muted)]">To edit the text or use email/WhatsApp, use Broadcasts.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSending(null)} disabled={busy}>Cancel</Button>
              <Button onClick={() => send(sending)} disabled={busy}>{busy ? "Sending…" : "Send"}</Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

export function InsightsPanel() {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportType>("revenue");
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    aiApi.insights().then(setInsights).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(() => {
    setSummary(null);
    setSummaryError(null);
    aiApi.reportSummary(report).then(setSummary).catch((e: Error) => setSummaryError(e.message));
  }, [report]);

  const m = insights?.metrics;
  const cur = m?.currency || "INR";

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[var(--primary-soft)] p-2.5 text-[var(--primary)]"><Sparkles className="h-5 w-5" /></div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">AI Insights</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Your last 30 days in plain language. Figures are calculated by REPSI; AI only writes the summary and never sees member names.</p>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4" aria-labelledby="insights-title">
        <div className="flex items-center justify-between gap-2">
          <h2 id="insights-title" className="text-base font-semibold text-[var(--text)]">Business summary</h2>
          {insights && <SourceBadge source={insights.source} />}
        </div>
        {error ? <Notice kind="error">{error}</Notice> : !insights ? <LoadingRow label="Summarizing…" /> : (
          <>
            <SummaryBlock data={insights} />
            {m && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Metric label="Collected (30 days)" value={`${cur} ${m.revenue.collected_last_30d.toLocaleString()}`} />
                <Metric label="Outstanding dues" value={`${cur} ${m.revenue.outstanding_dues.toLocaleString()}`} />
                <Metric label="New members (30 days)" value={m.members.new_last_30d} />
                <Metric label="Visits (30 days)" value={m.attendance.visits_last_30d} />
              </div>
            )}
          </>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4" aria-labelledby="report-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="report-title" className="text-base font-semibold text-[var(--text)]">Report summaries</h2>
          {summary && <SourceBadge source={summary.source} />}
        </div>
        <div role="tablist" className="flex gap-1 overflow-x-auto">
          {REPORTS.map((r) => (
            <button key={r.key} role="tab" aria-selected={report === r.key} onClick={() => setReport(r.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${report === r.key ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text)]"}`}>
              {r.label}
            </button>
          ))}
        </div>
        {summaryError ? <Notice kind="error">{summaryError}</Notice> : summary ? <SummaryBlock data={summary} /> : <LoadingRow label="Reading the report…" />}
      </section>

      <Reminders />
    </div>
  );
}
