"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, Loader2, Table2, Trash2, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fitnessApi, type ApiAssessment, type ApiMeasurement, type ApiMeasurementType, type ApiProgress, type FitDifficulty } from "@/lib/fitness-api";
import { addDays, EmptyBlock, Field, formatDay, formatDuration, humanize, inputClass, isoDate, LoadingRow, Notice, StatusBadge } from "./shared";

const RANGES = [
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "6 months", days: 182 },
  { label: "1 year", days: 365 },
];

const axisTick = { fontSize: 11, fill: "var(--text-muted)" };
const shortDate = (iso: string) => formatDay(iso, { day: "numeric", month: "short" });

function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string; unit: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-[var(--text)] mb-0.5">{formatDay(label, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-[var(--text-muted)]">
          {p.name}: <span className="font-bold text-[var(--text)] tabular-nums">{p.value} {unit}</span>
        </p>
      ))}
    </div>
  );
}

function ChartCard({ title, subtitle, controls, table, children }: { title: string; subtitle?: string; controls?: React.ReactNode; table: React.ReactNode; children: React.ReactNode }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Card className="p-4 space-y-3 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[var(--text)]">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {controls}
          <Button variant="ghost" size="icon-sm" aria-label={showTable ? "Show chart" : "Show data table"} aria-pressed={showTable} onClick={() => setShowTable((v) => !v)}>
            <Table2 />
          </Button>
        </div>
      </div>
      {showTable ? <div className="max-h-64 overflow-auto">{table}</div> : children}
    </Card>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-xs">
      <thead><tr className="text-left text-[var(--text-muted)]">{head.map((h) => <th key={h} className="py-1 pr-3 font-semibold">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-[var(--border)]">{r.map((c, j) => <td key={j} className="py-1 pr-3 tabular-nums">{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="text-2xl font-bold text-[var(--text)] tabular-nums mt-0.5">{value}</p>
      {hint && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{hint}</p>}
    </Card>
  );
}

export function ProgressView({ memberId, refreshKey = 0 }: { memberId: string; refreshKey?: number }) {
  const [rangeDays, setRangeDays] = useState(90);
  const [custom, setCustom] = useState<{ from: string; to: string } | null>(null);
  const [data, setData] = useState<ApiProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const [strengthMetric, setStrengthMetric] = useState<"top_weight_kg" | "estimated_1rm_kg">("top_weight_kg");

  const range = useMemo(() => custom || { from: addDays(isoDate(), -(rangeDays - 1)), to: isoDate() }, [custom, rangeDays]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fitnessApi.progress(memberId, { date_from: range.from, date_to: range.to });
      setData(res);
      setMetric((m) => (m && res.measurements[m] ? m : Object.keys(res.measurements).includes("weight") ? "weight" : Object.keys(res.measurements)[0] || ""));
      setExerciseId((e) => (e && res.strength.some((s) => s.exercise_id === e) ? e : res.strength[0]?.exercise_id || ""));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [memberId, range.from, range.to]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const series = data && metric ? data.measurements[metric] : null;
  const strength = data?.strength.find((s) => s.exercise_id === exerciseId);
  const strengthPoints = (strength?.points || []).filter((p) => p[strengthMetric] !== null && p[strengthMetric] !== undefined);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Date range">
        {RANGES.map((r) => (
          <Button key={r.days} size="sm" variant={!custom && rangeDays === r.days ? "default" : "outline"} onClick={() => { setCustom(null); setRangeDays(r.days); }}>{r.label}</Button>
        ))}
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <input type="date" aria-label="From date" value={range.from} max={range.to} onChange={(e) => e.target.value && setCustom({ from: e.target.value, to: range.to })} className={`${inputClass} w-auto py-1.5`} />
          <span>to</span>
          <input type="date" aria-label="To date" value={range.to} min={range.from} max={isoDate()} onChange={(e) => e.target.value && setCustom({ from: range.from, to: e.target.value })} className={`${inputClass} w-auto py-1.5`} />
        </div>
        {loading && data && <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" aria-label="Updating" />}
      </div>

      {error && <Notice kind="error">{error} <button className="underline ml-1" onClick={load}>Retry</button></Notice>}
      {!data ? (loading ? <LoadingRow label="Loading progress…" /> : null) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Workout adherence" value={data.adherence.rate_pct === null || data.adherence.rate_pct === undefined ? "—" : `${data.adherence.rate_pct}%`} hint={data.adherence.scheduled ? `${data.adherence.completed} of ${data.adherence.scheduled} scheduled workouts` : "No workouts were due in this range"} />
            <Tile label="Completed workouts" value={String(data.adherence.completed)} />
            <Tile label="Missed workouts" value={String(data.adherence.missed)} hint="Past scheduled days with no completed session" />
            <Tile label="Personal records" value={String(data.personal_records.length)} hint="All-time bests" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title={series ? `${series.label} (${series.unit})` : "Body measurements"}
              subtitle="Only dates with a recorded value are plotted."
              controls={Object.keys(data.measurements).length > 0 && (
                <select aria-label="Measurement" value={metric} onChange={(e) => setMetric(e.target.value)} className={`${inputClass} w-auto py-1.5`}>
                  {Object.entries(data.measurements).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              )}
              table={series ? <DataTable head={["Date", `${series.label} (${series.unit})`]} rows={[...series.points].reverse().map((p) => [p.date, p.value])} /> : null}
            >
              {!series ? <EmptyBlock title="No measurements in this range">Record weight or body measurements to see trends.</EmptyBlock> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={series.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="var(--divider)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={shortDate} tick={axisTick} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} width={40} domain={["auto", "auto"]} unit={series.unit === "%" ? "%" : ""} />
                    <Tooltip content={<ChartTooltip unit={series.unit} />} />
                    <Line type="monotone" dataKey="value" name={series.label} stroke="var(--primary)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard
              title={strength ? `${strength.exercise_name}` : "Strength progression"}
              subtitle={strengthMetric === "estimated_1rm_kg" ? "Estimated 1RM (Epley formula, sets of 12 reps or fewer) — an estimate, not a tested max." : "Heaviest completed set per workout (kg)."}
              controls={data.strength.length > 0 && (
                <>
                  <select aria-label="Exercise" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)} className={`${inputClass} w-auto py-1.5 max-w-[180px]`}>
                    {data.strength.map((s) => <option key={s.exercise_id} value={s.exercise_id}>{s.exercise_name}</option>)}
                  </select>
                  <select aria-label="Strength metric" value={strengthMetric} onChange={(e) => setStrengthMetric(e.target.value as typeof strengthMetric)} className={`${inputClass} w-auto py-1.5`}>
                    <option value="top_weight_kg">Top set</option><option value="estimated_1rm_kg">Est. 1RM</option>
                  </select>
                </>
              )}
              table={strength ? <DataTable head={["Date", "Top set", "Reps", "Est. 1RM", "Volume"]} rows={[...strength.points].reverse().map((p) => [p.date, `${p.top_weight_kg} kg`, p.top_set_reps, p.estimated_1rm_kg ? `${p.estimated_1rm_kg} kg` : "—", `${p.volume_kg} kg`])} /> : null}
            >
              {!strength || strengthPoints.length === 0 ? <EmptyBlock title="No weighted sets logged in this range">Complete workouts with weight × reps to see strength trends.</EmptyBlock> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={strengthPoints} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="var(--divider)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={shortDate} tick={axisTick} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} width={40} domain={["auto", "auto"]} />
                    <Tooltip content={<ChartTooltip unit="kg" />} />
                    <Line type="monotone" dataKey={strengthMetric} name={strengthMetric === "top_weight_kg" ? "Top set" : "Est. 1RM"} stroke="var(--primary)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <ChartCard title="Training consistency" subtitle="Workouts scheduled vs completed per week (weeks starting Monday)."
            table={<DataTable head={["Week of", "Scheduled", "Completed"]} rows={[...data.weekly].reverse().map((w) => [w.week_start, w.scheduled, w.completed])} />}>
            {data.weekly.every((w) => w.scheduled === 0 && w.completed === 0) ? <EmptyBlock title="No scheduled workouts in this range" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.weekly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
                  <CartesianGrid stroke="var(--divider)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week_start" tickFormatter={shortDate} tick={axisTick} axisLine={false} tickLine={false} minTickGap={16} />
                  <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<ChartTooltip unit="workouts" />} cursor={{ fill: "var(--surface-soft)" }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-secondary)" }} />
                  <Bar dataKey="scheduled" name="Scheduled" fill="var(--text-muted)" fillOpacity={0.35} radius={[4, 4, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="completed" name="Completed" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="p-4">
              <h3 className="text-sm font-bold text-[var(--text)] mb-1 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Before & after</h3>
              <p className="text-xs text-[var(--text-muted)] mb-3">First vs latest value recorded in this range. Changes describe what was measured; they don&apos;t show what caused them.</p>
              {data.measurement_summary.length === 0 ? <EmptyBlock title="No measurements in this range" /> : (
                <DataTable head={["Measure", "First", "Latest", "Change"]} rows={data.measurement_summary.map((s) => [
                  s.label, `${s.first} ${s.unit} (${shortDate(s.first_date)})`, `${s.last} ${s.unit} (${shortDate(s.last_date)})`,
                  s.entries < 2 ? "Need 2+ entries" : `${s.change > 0 ? "+" : ""}${s.change} ${s.unit}`,
                ])} />
              )}
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-bold text-[var(--text)] mb-3 flex items-center gap-2"><Award className="h-4 w-4" /> Personal records</h3>
              {data.personal_records.length === 0 ? <EmptyBlock title="No personal records yet">Records come from completed sets in finished workouts.</EmptyBlock> : (
                <DataTable head={["Exercise", "Record", "Value", "Date"]} rows={data.personal_records.map((r) => [
                  r.exercise_name, humanize(r.kind),
                  r.unit === "s" ? formatDuration(r.value) : `${r.value} ${r.unit}${r.reps && r.unit === "kg" ? ` × ${r.reps}` : ""}`, r.achieved_on,
                ])} />
              )}
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="text-sm font-bold text-[var(--text)] mb-3">Workout history</h3>
            {data.recent_sessions.length === 0 ? <EmptyBlock title="No workouts logged in this range" /> : (
              <ul className="divide-y divide-[var(--border)]">
                {data.recent_sessions.map((s) => (
                  <li key={s.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-medium text-[var(--text)]">{s.day_name} <span className="text-xs text-[var(--text-muted)]">· {s.assignment_title}</span></p>
                      <p className="text-xs text-[var(--text-muted)]">{formatDay(s.scheduled_date)} · {s.completed_sets} sets · {s.total_volume_kg} kg volume · {formatDuration(s.duration_seconds ?? s.active_seconds)}</p>
                      {s.trainer_feedback && <p className="text-xs mt-1 text-[var(--text-secondary)]"><strong>Trainer feedback:</strong> {s.trainer_feedback}</p>}
                    </div>
                    <StatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export function MeasurementsPanel({ memberId, types, canRemove, onSaved }: {
  memberId: string; types: ApiMeasurementType[]; canRemove: (m: ApiMeasurement) => boolean; onSaved?: () => void;
}) {
  const [date, setDate] = useState(isoDate());
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<ApiMeasurement[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(() => {
    fitnessApi.listMeasurements(memberId).then(setHistory).catch((e: Error) => setError(e.message));
  }, [memberId]);
  useEffect(load, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entries = Object.entries(values).filter(([, v]) => v.trim() !== "");
    if (!entries.length) return setError("Enter at least one measurement.");
    for (const [k, v] of entries) {
      const t = types.find((x) => x.key === k)!;
      const n = Number(v);
      if (Number.isNaN(n)) return setError(`${t.label} must be a number.`);
      if ((t.min_value != null && n < t.min_value) || (t.max_value != null && n > t.max_value)) return setError(`${t.label} must be between ${t.min_value} and ${t.max_value} ${t.unit}.`);
    }
    setSaving(true);
    setError(null);
    try {
      await fitnessApi.recordMeasurements(memberId, { measured_on: date, values: entries.map(([metric, v]) => ({ metric, value: Number(v) })), notes: notes.trim() || null });
      setValues({});
      setNotes("");
      setFlash("Measurements saved.");
      load();
      onSaved?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (m: ApiMeasurement) => {
    if (!window.confirm(`Remove ${m.metric} ${m.value} ${m.unit} from ${m.measured_on}? It stays in the audit history.`)) return;
    try {
      await fitnessApi.removeMeasurement(memberId, m.id);
      load();
      onSaved?.();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const label = (k: string) => types.find((t) => t.key === k)?.label || humanize(k);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
      <Card className="p-4">
        <form onSubmit={submit} className="space-y-3" noValidate>
          <h3 className="text-sm font-bold text-[var(--text)]">Record measurements</h3>
          {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
          {flash && <Notice kind="success" onDismiss={() => setFlash(null)}>{flash}</Notice>}
          <Field label="Date" htmlFor="ms-date"><input id="ms-date" type="date" max={isoDate()} value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} /></Field>
          <div className="grid grid-cols-2 gap-2">
            {types.map((t) => (
              <Field key={t.key} label={`${t.label} (${t.unit})`} htmlFor={`ms-${t.key}`}>
                <input id={`ms-${t.key}`} type="number" inputMode="decimal" step="0.1" min={t.min_value ?? undefined} max={t.max_value ?? undefined}
                  value={values[t.key] || ""} onChange={(e) => setValues({ ...values, [t.key]: e.target.value })} className={inputClass} />
              </Field>
            ))}
          </div>
          <Field label="Notes" htmlFor="ms-notes"><input id="ms-notes" maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} /></Field>
          <p className="text-[11px] text-[var(--text-muted)]">Leave fields blank to skip them. Entering a value for a date that already has one replaces it (the old entry is kept in history).</p>
          <Button type="submit" size="sm" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Save</Button>
        </form>
      </Card>
      <Card className="p-4 min-w-0">
        <h3 className="text-sm font-bold text-[var(--text)] mb-3">Measurement history</h3>
        {!history ? <LoadingRow /> : history.length === 0 ? <EmptyBlock title="No measurements recorded yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-[var(--text-muted)]"><th className="py-1 pr-3">Date</th><th className="pr-3">Measure</th><th className="pr-3">Value</th><th className="pr-3">Recorded by</th><th /></tr></thead>
              <tbody>
                {history.map((m) => (
                  <tr key={m.id} className="border-t border-[var(--border)]">
                    <td className="py-1.5 pr-3 whitespace-nowrap">{m.measured_on}</td>
                    <td className="pr-3">{label(m.metric)}</td>
                    <td className="pr-3 tabular-nums whitespace-nowrap">{m.value} {m.unit}</td>
                    <td className="pr-3 text-xs text-[var(--text-muted)]">{m.recorded_by_name || "—"}{m.recorded_by_role ? ` (${m.recorded_by_role})` : ""}</td>
                    <td className="text-right">{canRemove(m) && <Button variant="ghost" size="icon-sm" aria-label={`Remove ${label(m.metric)} on ${m.measured_on}`} onClick={() => remove(m)}><Trash2 /></Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export function AssessmentsPanel({ memberId, staff }: { memberId: string; staff: boolean }) {
  const [items, setItems] = useState<ApiAssessment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ assessed_on: isoDate(), goals: "", fitness_level: "" as FitDifficulty | "", limitations: "", resting_heart_rate: "", summary: "", private_notes: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fitnessApi.listAssessments(memberId).then(setItems).catch((e: Error) => setError(e.message));
  }, [memberId]);
  useEffect(load, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.goals.trim() && !form.summary.trim() && !form.private_notes.trim()) return setError("Add goals, a summary or notes.");
    setSaving(true);
    setError(null);
    try {
      await fitnessApi.recordAssessment(memberId, {
        assessed_on: form.assessed_on, goals: form.goals.trim() || null, fitness_level: form.fitness_level || null,
        limitations: form.limitations.trim() || null, resting_heart_rate: form.resting_heart_rate ? Number(form.resting_heart_rate) : null,
        summary: form.summary.trim() || null, private_notes: form.private_notes.trim() || null,
      });
      setForm({ ...form, goals: "", limitations: "", resting_heart_rate: "", summary: "", private_notes: "" });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`grid gap-4 ${staff ? "lg:grid-cols-[minmax(0,380px)_1fr]" : ""}`}>
      {staff && (
        <Card className="p-4">
          <form onSubmit={submit} className="space-y-3" noValidate>
            <h3 className="text-sm font-bold text-[var(--text)]">New assessment</h3>
            {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
            <div className="grid grid-cols-2 gap-2">
              <Field label="Date" htmlFor="as-date"><input id="as-date" type="date" max={isoDate()} value={form.assessed_on} onChange={(e) => setForm({ ...form, assessed_on: e.target.value })} className={inputClass} /></Field>
              <Field label="Fitness level" htmlFor="as-level">
                <select id="as-level" value={form.fitness_level} onChange={(e) => setForm({ ...form, fitness_level: e.target.value as FitDifficulty | "" })} className={inputClass}>
                  <option value="">Not set</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
                </select>
              </Field>
            </div>
            <Field label="Goals" htmlFor="as-goals"><textarea id="as-goals" rows={2} maxLength={2000} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} className={inputClass} /></Field>
            <Field label="Injuries / limitations" htmlFor="as-lim"><textarea id="as-lim" rows={2} maxLength={2000} value={form.limitations} onChange={(e) => setForm({ ...form, limitations: e.target.value })} className={inputClass} /></Field>
            <Field label="Resting heart rate (bpm)" htmlFor="as-hr"><input id="as-hr" type="number" min={25} max={220} value={form.resting_heart_rate} onChange={(e) => setForm({ ...form, resting_heart_rate: e.target.value })} className={inputClass} /></Field>
            <Field label="Summary (shared with member)" htmlFor="as-sum"><textarea id="as-sum" rows={2} maxLength={4000} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={inputClass} /></Field>
            <Field label="Private notes (staff only)" htmlFor="as-priv" hint="Never shown to the member."><textarea id="as-priv" rows={2} maxLength={4000} value={form.private_notes} onChange={(e) => setForm({ ...form, private_notes: e.target.value })} className={inputClass} /></Field>
            <Button type="submit" size="sm" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Save assessment</Button>
          </form>
        </Card>
      )}
      <Card className="p-4 min-w-0">
        <h3 className="text-sm font-bold text-[var(--text)] mb-3">{staff ? "Assessment history" : "Your assessments"}</h3>
        {!staff && error && <Notice kind="error">{error}</Notice>}
        {!items ? <LoadingRow /> : items.length === 0 ? <EmptyBlock title="No assessments yet" /> : (
          <ul className="space-y-3">
            {items.map((a) => (
              <li key={a.id} className="rounded-xl border border-[var(--border)] p-3 text-sm space-y-1">
                <p className="text-xs text-[var(--text-muted)]">{formatDay(a.assessed_on, { day: "numeric", month: "short", year: "numeric" })}{a.assessed_by_name ? ` · ${a.assessed_by_name}` : ""}{a.fitness_level ? ` · ${humanize(a.fitness_level)}` : ""}{a.resting_heart_rate ? ` · RHR ${a.resting_heart_rate} bpm` : ""}</p>
                {a.goals && <p><strong>Goals:</strong> {a.goals}</p>}
                {a.limitations && <p><strong>Limitations:</strong> {a.limitations}</p>}
                {a.summary && <p><strong>Summary:</strong> {a.summary}</p>}
                {staff && a.private_notes && <p className="rounded-lg bg-[var(--warning-soft)] px-2 py-1 text-[var(--warning-foreground)]"><strong>Private:</strong> {a.private_notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
