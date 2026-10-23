"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, ChevronDown, ChevronUp, History, Loader2, Pause, Pencil, Play, Plus, Square, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  fitnessApi, type ApiAssignment, type ApiAssignmentDetail, type ApiAssignmentEvent, type ApiFitnessContext, type ApiMeasurementType,
  type ApiProgram, type ApiScheduleOccurrence, type AssignmentStatus,
} from "@/lib/fitness-api";
import { AssignDialog, WeekdayPicker } from "./assign-dialog";
import { daysToInput, draftsFromDays, PlanEditor, validateDays, type DayDraft } from "./plan-editor";
import { PlanPreview } from "./programs";
import { AssessmentsPanel, MeasurementsPanel, ProgressView } from "./progress";
import { EmptyBlock, Field, formatDay, humanize, inputClass, LoadingRow, Modal, Notice, StatusBadge, useFitnessContext, useFitnessMeta, WEEKDAYS } from "./shared";
import { openOrStartSession, SessionRunner, WeekSchedule } from "./workout-runner";

type Tab = "plans" | "schedule" | "progress" | "measurements" | "assessments";
const TABS: { id: Tab; label: string }[] = [
  { id: "plans", label: "Workout plans" },
  { id: "schedule", label: "Schedule & sessions" },
  { id: "progress", label: "Progress" },
  { id: "measurements", label: "Measurements" },
  { id: "assessments", label: "Assessments" },
];

/** Staff view of one member's training. Every call is re-authorised by the API (trainer must be assigned). */
export function MemberTraining({ memberId }: { memberId: string }) {
  const { ctx, error: ctxError } = useFitnessContext();
  const meta = useFitnessMeta();
  const [tab, setTab] = useState<Tab>("plans");
  const [refresh, setRefresh] = useState(0);

  if (ctxError) return <Notice kind="error">{ctxError}</Notice>;
  if (!ctx) return <LoadingRow />;

  return (
    <div className="space-y-4">
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-[var(--border)]">
        {TABS.map((t) => (
          <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 ${tab === t.id ? "border-[var(--primary)] font-semibold text-[var(--text)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "plans" && <PlansTab ctx={ctx} memberId={memberId} refresh={refresh} onChanged={() => setRefresh((r) => r + 1)} />}
      {tab === "schedule" && <ScheduleTab memberId={memberId} />}
      {tab === "progress" && <ProgressView memberId={memberId} refreshKey={refresh} />}
      {tab === "measurements" && (
        <MeasurementsPanel memberId={memberId} types={meta?.measurement_types || ([] as ApiMeasurementType[])}
          canRemove={() => true} onSaved={() => setRefresh((r) => r + 1)} />
      )}
      {tab === "assessments" && <AssessmentsPanel memberId={memberId} staff />}
    </div>
  );
}

function PlansTab({ ctx, memberId, refresh, onChanged }: { ctx: ApiFitnessContext; memberId: string; refresh: number; onChanged: () => void }) {
  const [items, setItems] = useState<ApiAssignment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [assigning, setAssigning] = useState<ApiProgram | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApiAssignmentDetail | null>(null);
  const [editing, setEditing] = useState<ApiAssignmentDetail | null>(null);
  const [rescheduling, setRescheduling] = useState<ApiAssignment | null>(null);
  const [history, setHistory] = useState<{ a: ApiAssignment; events: ApiAssignmentEvent[] } | null>(null);

  const load = useCallback(() => {
    fitnessApi.listAssignments({ member_id: memberId, page_size: 100 }).then((r) => setItems(r.items)).catch((e: Error) => setError(e.message));
  }, [memberId]);
  useEffect(load, [load, refresh]);

  const toggle = async (a: ApiAssignment) => {
    if (expanded === a.id) return setExpanded(null);
    setExpanded(a.id);
    setDetail(null);
    try {
      setDetail(await fitnessApi.getAssignment(a.id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const setStatus = async (a: ApiAssignment, status: AssignmentStatus) => {
    const verb = { active: "Resume", paused: "Pause", completed: "Mark complete", cancelled: "Cancel" }[status];
    const reason = window.prompt(`${verb} “${a.title}”? Optional reason (kept in the plan history):`, "");
    if (reason === null) return;
    try {
      await fitnessApi.updateAssignment(a.id, { status, reason: reason.trim() || null });
      setFlash(`${a.title}: ${humanize(status)}.`);
      load();
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const openHistory = async (a: ApiAssignment) => {
    try {
      setHistory({ a, events: await fitnessApi.getAssignmentEvents(a.id) });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const openEditor = async (a: ApiAssignment) => {
    try {
      setEditing(await fitnessApi.getAssignment(a.id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--text-muted)]">Each plan is this member&apos;s own copy. Changes here never affect the reusable program or other members.</p>
        {ctx.can_assign && <Button size="sm" onClick={() => setChoosing(true)}><Plus /> Assign program</Button>}
      </div>
      {flash && <Notice kind="success" onDismiss={() => setFlash(null)}>{flash}</Notice>}
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      {!items ? <LoadingRow /> : items.length === 0 ? <EmptyBlock title="No workout plans assigned yet">{ctx.can_assign ? "Assign a published program to get started." : ""}</EmptyBlock> : (
        items.map((a) => {
          const editable = ctx.can_assign && ["active", "paused"].includes(a.status);
          return (
            <Card key={a.id} className="p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--text)]">{a.title} {a.is_customized && <span className="text-xs font-normal text-[var(--text-muted)]">· customised</span>}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatDay(a.start_date, { day: "numeric", month: "short", year: "numeric" })} – {a.end_date ? formatDay(a.end_date, { day: "numeric", month: "short", year: "numeric" }) : "ongoing"}
                    {" · "}{a.schedule_weekdays.length ? a.schedule_weekdays.map((d) => WEEKDAYS[d]).join(", ") : "every day in sequence"}
                    {a.program_version_number ? ` · program v${a.program_version_number}` : ""}
                    {a.trainer_name ? ` · trainer ${a.trainer_name}` : ""}{a.assigned_by_name ? ` · assigned by ${a.assigned_by_name}` : ""}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              {a.stats && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-center">
                  <MiniStat label="Adherence" value={a.stats.adherence_pct == null ? "—" : `${a.stats.adherence_pct}%`} />
                  <MiniStat label="Completed" value={a.stats.completed} />
                  <MiniStat label="Missed / overdue" value={a.stats.missed} />
                  <MiniStat label="Next workout" value={a.stats.next_date ? formatDay(a.stats.next_date, { day: "numeric", month: "short" }) : "—"} />
                </div>
              )}
              {a.newer_version_available && editable && (
                <p className="text-xs text-[var(--text-muted)]">A newer version of this program is published. This member stays on their current plan; assign the program again to move them.</p>
              )}
              {a.notes && <p className="text-xs text-[var(--text-secondary)]"><strong>Notes:</strong> {a.notes}</p>}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => toggle(a)}>{expanded === a.id ? <ChevronUp /> : <ChevronDown />} Plan</Button>
                {editable && <Button variant="outline" size="sm" onClick={() => openEditor(a)}><Pencil /> Customise</Button>}
                {editable && <Button variant="ghost" size="sm" onClick={() => setRescheduling(a)}><CalendarClock /> Reschedule</Button>}
                {editable && a.status === "active" && <Button variant="ghost" size="sm" onClick={() => setStatus(a, "paused")}><Pause /> Pause</Button>}
                {editable && a.status === "paused" && <Button variant="ghost" size="sm" onClick={() => setStatus(a, "active")}><Play /> Resume</Button>}
                {editable && <Button variant="ghost" size="sm" onClick={() => setStatus(a, "completed")}><Square /> Complete</Button>}
                {editable && <Button variant="ghost" size="sm" onClick={() => setStatus(a, "cancelled")}><XCircle /> Cancel</Button>}
                <Button variant="ghost" size="sm" onClick={() => openHistory(a)}><History /> History</Button>
              </div>
              {expanded === a.id && (detail?.id === a.id ? <PlanPreview days={detail.days} /> : <LoadingRow />)}
            </Card>
          );
        })
      )}

      {choosing && <ProgramChooser onClose={() => setChoosing(false)} onPick={(p) => { setChoosing(false); setAssigning(p); }} />}
      {assigning && (
        <AssignDialog ctx={ctx} programId={assigning.id} programName={assigning.name} presetMemberId={memberId}
          onClose={() => setAssigning(null)} onDone={() => { load(); onChanged(); }} />
      )}
      {editing && <CustomiseDialog assignment={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setFlash("Plan updated for this member only."); setExpanded(null); load(); onChanged(); }} />}
      {rescheduling && <RescheduleDialog assignment={rescheduling} onClose={() => setRescheduling(null)} onSaved={() => { setRescheduling(null); setFlash("Schedule updated."); load(); onChanged(); }} />}
      {history && (
        <Modal title={`History · ${history.a.title}`} onClose={() => setHistory(null)}>
          <ol className="space-y-3">
            {history.events.map((e) => (
              <li key={e.id} className="text-sm border-l-2 border-[var(--border)] pl-3">
                <p className="font-medium text-[var(--text)]">{humanize(e.event_type)}</p>
                <p className="text-xs text-[var(--text-muted)]">{new Date(e.created_at + (e.created_at.endsWith("Z") ? "" : "Z")).toLocaleString()} · {e.actor_name || "System"}</p>
                <EventDetails details={e.details} />
              </li>
            ))}
          </ol>
        </Modal>
      )}
    </div>
  );
}

function EventDetails({ details }: { details?: Record<string, unknown> | null }) {
  if (!details) return null;
  const d = details as Record<string, unknown>;
  const lines: string[] = [];
  if (Array.isArray(d.replaced)) (d.replaced as { from: string; to: string }[]).forEach((r) => lines.push(`Replaced ${r.from} → ${r.to}`));
  if (Array.isArray(d.added) && d.added.length) lines.push(`Added ${(d.added as string[]).join(", ")}`);
  if (Array.isArray(d.removed) && d.removed.length) lines.push(`Removed ${(d.removed as string[]).join(", ")}`);
  if (typeof d.modified === "number" && d.modified) lines.push(`${d.modified} prescription change${d.modified === 1 ? "" : "s"}`);
  if (d.from && d.to) lines.push(`${humanize(String(d.from))} → ${humanize(String(d.to))}`);
  if (d.program) lines.push(`${d.program} v${d.version}`);
  if (d.changes && typeof d.changes === "object") {
    Object.entries(d.changes as Record<string, unknown>).forEach(([key, v]) => {
      lines.push(Array.isArray(v) ? `${humanize(key)}: ${JSON.stringify(v[0])} → ${JSON.stringify(v[1])}` : `${humanize(key)} ${v}`);
    });
  }
  if (d.reason) lines.push(`Reason: ${d.reason}`);
  return <ul className="text-xs text-[var(--text-secondary)] mt-0.5">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>;
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-[var(--surface-elevated)] py-2">
      <p className="text-sm font-bold text-[var(--text)] tabular-nums">{value}</p>
      <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

function ProgramChooser({ onClose, onPick }: { onClose: () => void; onPick: (p: ApiProgram) => void }) {
  const [items, setItems] = useState<ApiProgram[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fitnessApi.listPrograms({ status: "published", page_size: 100 }).then((r) => setItems(r.items)).catch((e: Error) => setError(e.message));
  }, []);
  return (
    <Modal title="Choose a program" onClose={onClose}>
      {error && <Notice kind="error">{error}</Notice>}
      {!items ? <LoadingRow /> : items.length === 0 ? <EmptyBlock title="No published programs">Create and publish a program in Workouts first.</EmptyBlock> : (
        <ul className="divide-y divide-[var(--border)]">
          {items.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onPick(p)} className="w-full text-left py-2.5 px-1 hover:bg-[var(--nav-hover-bg)] rounded-lg">
                <span className="block text-sm font-medium text-[var(--text)]">{p.name}</span>
                <span className="block text-xs text-[var(--text-muted)]">{humanize(p.difficulty)} · {p.training_days} training days · {p.exercise_count} exercises</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function CustomiseDialog({ assignment, onClose, onSaved }: { assignment: ApiAssignmentDetail; onClose: () => void; onSaved: () => void }) {
  const [days, setDays] = useState<DayDraft[]>(() => draftsFromDays(assignment.days, true));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    const problem = validateDays(days, true);
    if (problem) return setError(problem);
    setSaving(true);
    setError(null);
    try {
      await fitnessApi.updateAssignmentPlan(assignment.id, daysToInput(days), reason.trim() || undefined);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title={`Customise ${assignment.member_name}'s plan`} onClose={onClose} wide>
      <div className="space-y-3">
        <p className="text-xs text-[var(--text-muted)]">Substitute exercises, change volume or add days for this member only. Logged workouts keep the prescription they were done with.</p>
        {error && <Notice kind="error">{error}</Notice>}
        <PlanEditor days={days} onChange={setDays} />
        <Field label="Reason for change (kept in history)" htmlFor="cu-reason"><input id="cu-reason" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} placeholder="e.g. Knee discomfort — swapped back squat for goblet squat" /></Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={saving} onClick={save}>{saving && <Loader2 className="animate-spin" />} Save plan</Button>
        </div>
      </div>
    </Modal>
  );
}

function RescheduleDialog({ assignment, onClose, onSaved }: { assignment: ApiAssignment; onClose: () => void; onSaved: () => void }) {
  const [start, setStart] = useState(assignment.start_date);
  const [end, setEnd] = useState(assignment.end_date || "");
  const [weekdays, setWeekdays] = useState(assignment.schedule_weekdays);
  const [notes, setNotes] = useState(assignment.notes || "");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    if (end && end < start) return setError("End date can't be before the start date.");
    setSaving(true);
    setError(null);
    try {
      await fitnessApi.updateAssignment(assignment.id, {
        start_date: start, end_date: end || null, clear_end_date: !end, schedule_weekdays: weekdays,
        notes: notes.trim() || null, reason: reason.trim() || null,
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title={`Reschedule ${assignment.title}`} onClose={onClose}>
      <div className="space-y-3">
        {error && <Notice kind="error">{error}</Notice>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" htmlFor="rs-start"><input id="rs-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} /></Field>
          <Field label="End date" htmlFor="rs-end"><input id="rs-end" type="date" min={start} value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} /></Field>
        </div>
        <Field label="Training days" hint="Logged workouts stay on the dates they were done."><WeekdayPicker value={weekdays} onChange={setWeekdays} /></Field>
        <Field label="Notes for the member" htmlFor="rs-notes"><textarea id="rs-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} /></Field>
        <Field label="Reason (kept in history)" htmlFor="rs-reason"><input id="rs-reason" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} /></Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={saving} onClick={save}>{saving && <Loader2 className="animate-spin" />} Save</Button>
        </div>
      </div>
    </Modal>
  );
}

function ScheduleTab({ memberId }: { memberId: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const open = async (o: ApiScheduleOccurrence) => {
    try {
      setOpenId(await openOrStartSession(o));
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-muted)]">Open a session to review logged sets and leave feedback the member will see. Sessions you start here are recorded as logged by you.</p>
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      <WeekSchedule memberId={memberId} onOpen={open} refreshKey={refresh} canStart />
      <SessionHistory memberId={memberId} refreshKey={refresh} onOpen={setOpenId} />
      {openId && <SessionRunner sessionId={openId} onClose={() => { setOpenId(null); setRefresh((r) => r + 1); }} />}
    </div>
  );
}

function SessionHistory({ memberId, refreshKey, onOpen }: { memberId: string; refreshKey: number; onOpen: (id: string) => void }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: { id: string; day_name: string; scheduled_date: string; status: string; completed_sets: number; total_volume_kg: number; trainer_feedback?: string | null; member_notes?: string | null }[]; total: number } | null>(null);
  useEffect(() => {
    fitnessApi.listSessions({ member_id: memberId, page, page_size: 10 }).then(setData).catch(() => setData({ items: [], total: 0 }));
  }, [memberId, page, refreshKey]);
  return (
    <Card className="p-4">
      <h3 className="text-sm font-bold text-[var(--text)] mb-2">Session history</h3>
      {!data ? <LoadingRow /> : data.items.length === 0 ? <EmptyBlock title="No sessions logged yet" /> : (
        <>
          <ul className="divide-y divide-[var(--border)]">
            {data.items.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => onOpen(s.id)} className="w-full text-left py-2.5 px-1 flex flex-wrap items-center justify-between gap-2 hover:bg-[var(--nav-hover-bg)] rounded-lg">
                  <span>
                    <span className="block text-sm font-medium text-[var(--text)]">{s.day_name} · {formatDay(s.scheduled_date)}</span>
                    <span className="block text-xs text-[var(--text-muted)]">{s.completed_sets} sets · {s.total_volume_kg} kg{s.member_notes ? ` · “${s.member_notes}”` : ""}{s.trainer_feedback ? " · feedback given" : ""}</span>
                  </span>
                  <StatusBadge status={s.status} />
                </button>
              </li>
            ))}
          </ul>
          {data.total > 10 && (
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page * 10 >= data.total} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
