"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Download, RefreshCw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyBlock, Field, LoadingRow, Notice, addDays, inputClass, isoDate } from "@/features/fitness/shared";
import {
  formatMoney,
  reportsApi,
  type ReportFilters,
  type ReportGroup,
  type ReportResult,
  type ReportType,
  type SavedReport,
} from "@/lib/operations-api";
import { useTranslation, tr, richText } from "@/lib/i18n";

const REPORTS: { type: ReportType; label: string }[] = [
  { type: "revenue", get label() { return tr("reports.revenue"); } },
  { type: "memberships", get label() { return tr("navItem.memberships"); } },
  { type: "attendance", get label() { return tr("nav.attendance"); } },
  { type: "dues", get label() { return tr("reports.dues"); } },
  { type: "trainers", get label() { return tr("nav.trainers"); } },
  { type: "classes", get label() { return tr("nav.classes"); } },
];
const RANGES = [
  { days: 7, get label() { return tr("reports.last_7_days"); } },
  { days: 30, get label() { return tr("reports.last_30_days"); } },
  { days: 90, get label() { return tr("reports.last_90_days"); } },
  { days: 365, get label() { return tr("reports.last_12_months"); } },
];

function cell(value: unknown, kind: string): string {
  if (value === null || value === undefined || value === "") return "—";
  if (kind === "money" && typeof value === "number") return formatMoney(value);
  if (kind === "number" && typeof value === "number") return value.toLocaleString();
  return String(value);
}

function SummaryTiles({ report }: { report: ReportResult }) {
  const entries = Object.entries(report.summary).filter(([, v]) => typeof v === "number" || typeof v === "string");
  if (!entries.length) return null;
  const isMoney = (k: string) => /collected|refunds|net|expenses|profit|outstanding|average_payment/.test(k);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {entries.slice(0, 8).map(([k, v]) => (
        <div key={k} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)] capitalize">{k.replace(/_/g, " ")}</p>
          <p className="mt-1 text-xl font-semibold text-[var(--text)] tabular-nums">
            {typeof v === "number" && isMoney(k) ? formatMoney(v) : typeof v === "number" ? v.toLocaleString() : String(v)}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ReportsCenter() {
  const { t } = useTranslation();
  const [type, setType] = useState<ReportType>("revenue");
  const [range, setRange] = useState(30);
  const [groupBy, setGroupBy] = useState<ReportGroup>("day");
  const [report, setReport] = useState<ReportResult | null>(null);
  const [saved, setSaved] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filters: ReportFilters = { start: addDays(isoDate(), -(range - 1)), end: isoDate(), group_by: groupBy };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await reportsApi.run(type, { start: addDays(isoDate(), -(range - 1)), end: isoDate(), group_by: groupBy }));
    } catch (e) {
      setError((e as Error).message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [type, range, groupBy]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    reportsApi.saved().then(setSaved).catch(() => setSaved([]));
  }, []);

  const exportAs = async (format: "csv" | "xlsx" | "pdf") => {
    setBusy(format);
    setError(null);
    try {
      await reportsApi.export(type, format, filters);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const saveView = async () => {
    const name = window.prompt("Name this report view", `${REPORTS.find((r) => r.type === type)?.label} – last ${range} days`);
    if (!name) return;
    try {
      const row = await reportsApi.save(name, type, { relative_days: range, group_by: groupBy });
      setSaved((s) => [...s, row]);
      setNotice(t("reports.report_view_saved"));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const openSaved = (s: SavedReport) => {
    setType(s.report_type);
    if (s.filters.relative_days) setRange(s.filters.relative_days);
    if (s.filters.group_by) setGroupBy(s.filters.group_by);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight">{t("navItem.reports")}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t("reports.built_from_your_gym_s_own")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => exportAs("csv")} loading={busy === "csv"}>
            <Download aria-hidden /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportAs("xlsx")} loading={busy === "xlsx"}>
            {richText(t("reports.downloadexcel"), { download: <Download aria-hidden /> })}</Button>
          <Button variant="outline" size="sm" onClick={() => exportAs("pdf")} loading={busy === "pdf"}>
            <Download aria-hidden /> PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={saveView}>
            {richText(t("reports.savesave_view"), { save: <Save aria-hidden /> })}</Button>
        </div>
      </div>

      <div role="tablist" aria-label={t("reports.report_type")} className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
        {REPORTS.map((r) => (
          <button
            key={r.type}
            role="tab"
            aria-selected={type === r.type}
            onClick={() => setType(r.type)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              type === r.type ? "bg-[var(--primary-soft)] text-[var(--primary-dark)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
        <Field label={t("reports.period")} htmlFor="report-range">
          <select id="report-range" className={inputClass} value={range} onChange={(e) => setRange(Number(e.target.value))}>
            {RANGES.map((r) => (
              <option key={r.days} value={r.days}>{r.label}</option>
            ))}
          </select>
        </Field>
        <Field label={t("reports.group_by")} htmlFor="report-group">
          <select id="report-group" className={inputClass} value={groupBy} onChange={(e) => setGroupBy(e.target.value as ReportGroup)}>
            <option value="day">{t("reports.day")}</option>
            <option value="week">{t("reports.week")}</option>
            <option value="month">{t("reports.month")}</option>
          </select>
        </Field>
        <div className="flex items-end">
          <Button variant="ghost" size="sm" onClick={load}>
            {richText(t("reports.refreshcwrefresh"), { refreshcw: <RefreshCw aria-hidden /> })}</Button>
        </div>
      </div>

      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      {notice && <Notice kind="success" onDismiss={() => setNotice(null)}>{notice}</Notice>}

      {saved.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label={t("reports.saved_report_views")}>
          {saved.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] pl-3 pr-1 py-0.5 text-xs">
              <button type="button" className="hover:underline" onClick={() => openSaved(s)}>{s.name}</button>
              <button
                type="button"
                aria-label={t("reports.delete_saved_view_name", undefined, { name: s.name })}
                className="rounded-full p-1 hover:bg-[var(--surface-hover)]"
                onClick={async () => {
                  await reportsApi.removeSaved(s.id).catch((e) => setError(e.message));
                  setSaved((list) => list.filter((x) => x.id !== s.id));
                }}
              >
                <Trash2 className="h-3 w-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingRow label={t("reports.running_report")} />
      ) : !report ? null : (
        <div className="space-y-4">
          <SummaryTiles report={report} />
          {report.rows.length === 0 ? (
            <EmptyBlock title={t("reports.nothing_in_this_period")}>{t("reports.try_a_longer_period_or_a")}</EmptyBlock>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <table className="w-full text-sm">
                <caption className="sr-only">{report.title}</caption>
                <thead className="bg-[var(--surface-secondary)] text-xs text-[var(--text-secondary)]">
                  <tr>
                    {report.columns.map((c) => (
                      <th key={c.key} scope="col" className={`px-3 py-2 font-medium ${c.kind === "text" || c.kind === "date" ? "text-left" : "text-right"}`}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {report.rows.map((r, i) => (
                    <tr key={i}>
                      {report.columns.map((c) => (
                        <td key={c.key} className={`px-3 py-2 ${c.kind === "text" || c.kind === "date" ? "text-left" : "text-right tabular-nums"}`}>
                          {cell(r[c.key], c.kind)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden /> {report.filters.start} to {report.filters.end}
          </p>
        </div>
      )}
    </div>
  );
}
