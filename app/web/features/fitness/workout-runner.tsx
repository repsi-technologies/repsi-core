"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays, Check, ChevronLeft, ChevronRight, CircleAlert, CloudOff, Dumbbell, Flag, Info, Loader2, Pause, Play, Plus, Timer, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  fitnessApi, type ApiExercise, type ApiPlanItem, type ApiScheduleOccurrence, type ApiSetInput, type ApiWorkoutSession, type ApiWorkoutSessionDetail,
} from "@/lib/fitness-api";
import { ExerciseDetail } from "./exercise-library";
import { addDays, EmptyBlock, formatDay, formatDuration, humanize, inputClass, isoDate, LoadingRow, Modal, Notice, prescription, startOfWeek, StatusBadge } from "./shared";

// ------------------------------------------------------------------ schedule

function occurrenceAction(o: ApiScheduleOccurrence): string {
  if (o.status === "completed") return "View";
  if (o.session_id) return o.status === "abandoned" ? "Restart" : "Resume";
  return o.status === "missed" ? "Log late" : "Start";
}

/** Opens an existing session or starts one (idempotent on the server). */
export async function openOrStartSession(o: ApiScheduleOccurrence): Promise<string> {
  if (o.session_id && o.status !== "abandoned") return o.session_id;
  return (await fitnessApi.startSession(o.assignment_id, o.date)).id;
}

export function WeekSchedule({ memberId, onOpen, refreshKey = 0, canStart }: {
  memberId?: string; onOpen: (o: ApiScheduleOccurrence) => void; refreshKey?: number; canStart: boolean;
}) {
  const [weekStart, setWeekStart] = useState(startOfWeek(isoDate()));
  const [view, setView] = useState<"week" | "day">("week");
  const [day, setDay] = useState(isoDate());
  const [rows, setRows] = useState<ApiScheduleOccurrence[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setRows(null);
    fitnessApi.schedule({ member_id: memberId, date_from: weekStart, date_to: addDays(weekStart, 6) })
      .then((r) => alive && setRows(r))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [memberId, weekStart, refreshKey]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = isoDate();
  const shown = view === "day" ? [day] : days;

  const shift = (n: number) => {
    setWeekStart(addDays(weekStart, n * 7));
    setDay(addDays(day, n * 7));
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {formatDay(weekStart, { day: "numeric", month: "short" })} – {formatDay(addDays(weekStart, 6), { day: "numeric", month: "short", year: "numeric" })}</h3>
        <div className="flex items-center gap-1">
          <div className="flex rounded-lg border border-[var(--border)] p-0.5 mr-1" role="group" aria-label="Calendar view">
            {(["week", "day"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
                className={`px-2.5 py-1 text-xs rounded-md ${view === v ? "bg-[var(--primary-soft)] text-[var(--primary-dark)] font-semibold" : "text-[var(--text-muted)]"}`}>{humanize(v)}</button>
            ))}
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Previous week" onClick={() => shift(-1)}><ChevronLeft /></Button>
          <Button variant="ghost" size="sm" onClick={() => { setWeekStart(startOfWeek(today)); setDay(today); }}>Today</Button>
          <Button variant="ghost" size="icon-sm" aria-label="Next week" onClick={() => shift(1)}><ChevronRight /></Button>
        </div>
      </div>
      {view === "day" && (
        <div className="flex gap-1 overflow-x-auto" role="tablist">
          {days.map((d) => (
            <button key={d} role="tab" aria-selected={d === day} type="button" onClick={() => setDay(d)}
              className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs ${d === day ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "border border-[var(--border)] text-[var(--text-secondary)]"}`}>
              {formatDay(d, { weekday: "short", day: "numeric" })}
            </button>
          ))}
        </div>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      {!rows ? <LoadingRow /> : (
        <ul className="divide-y divide-[var(--border)]">
          {shown.map((d) => {
            const occ = rows.filter((r) => r.date === d);
            return (
              <li key={d} className={`py-2.5 flex flex-col gap-1.5 sm:flex-row sm:items-start ${d === today ? "bg-[var(--primary-soft)]/30 -mx-2 px-2 rounded-lg" : ""}`}>
                <span className={`w-28 shrink-0 text-xs font-semibold ${d === today ? "text-[var(--primary-dark)]" : "text-[var(--text-muted)]"}`}>{formatDay(d)}</span>
                <div className="flex-1 space-y-1.5">
                  {occ.length === 0 ? <span className="text-xs text-[var(--text-muted)]">No workout scheduled</span> : occ.map((o) => (
                    <div key={`${o.assignment_id}-${o.date}`} className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text)]">{o.day_name}</span>
                      <span className="text-xs text-[var(--text-muted)]">{o.assignment_title}{o.is_rest_day ? "" : ` · ${o.exercise_count} exercises`}</span>
                      <StatusBadge status={o.status} />
                      {!o.is_rest_day && (o.session_id || (canStart && o.date <= today && ["today", "missed"].includes(o.status))) && (
                        <Button size="sm" variant={o.status === "completed" ? "ghost" : "outline"} className="h-8 px-3" onClick={() => onOpen(o)}>
                          {occurrenceAction(o)}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------ session runner

type Draft = Record<string, ApiSetInput>; // key: `${item_id}:${set_number}`
const draftKey = (sessionId: string) => `repsi-workout-draft-${sessionId}`;
const k = (itemId: string, n: number) => `${itemId}:${n}`;

function readLocal(sessionId: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(sessionId));
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function writeLocal(sessionId: string, draft: Draft | null) {
  try {
    if (draft) window.localStorage.setItem(draftKey(sessionId), JSON.stringify(draft));
    else window.localStorage.removeItem(draftKey(sessionId));
  } catch {
    // Storage may be unavailable (private mode); the server copy is the source of truth.
  }
}

function fromServer(s: ApiWorkoutSessionDetail): Draft {
  const d: Draft = {};
  s.sets.forEach((x) => {
    if (!x.item_id) return;
    d[k(x.item_id, x.set_number)] = {
      item_id: x.item_id, set_number: x.set_number, reps: x.reps, weight_kg: x.weight_kg, duration_seconds: x.duration_seconds,
      distance_m: x.distance_m, rest_seconds: x.rest_seconds, rpe: x.rpe, completed: x.completed,
    };
  });
  return d;
}

const numOrNull = (v: string) => (v === "" ? null : Number(v));

export function SessionRunner({ sessionId, onClose, readOnlyFeedback }: { sessionId: string; onClose: (changed: boolean) => void; readOnlyFeedback?: boolean }) {
  const [session, setSession] = useState<ApiWorkoutSessionDetail | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [extraSets, setExtraSets] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [save, setSave] = useState<"idle" | "dirty" | "saving" | "saved" | "offline">("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState<number | null>(null);
  const [info, setInfo] = useState<ApiExercise | null>(null);
  const [notes, setNotes] = useState("");
  const [restored, setRestored] = useState(false);
  const changed = useRef(false);
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const open = session ? ["in_progress", "paused"].includes(session.status) : false;

  useEffect(() => {
    fitnessApi.getSession(sessionId).then((s) => {
      setSession(s);
      setNotes(s.member_notes || "");
      setElapsed(s.active_seconds);
      const server = fromServer(s);
      const local = ["in_progress", "paused"].includes(s.status) ? readLocal(sessionId) : null;
      if (local && Object.keys(local).length) {
        // Unsaved edits from an interrupted visit win over the server copy for the same set.
        setDraft({ ...server, ...local });
        setSave("dirty");
        setRestored(true);
      } else {
        setDraft(server);
        writeLocal(sessionId, null);
      }
      const firstOpen = s.items.findIndex((it) => !s.sets.some((x) => x.item_id === it.id && x.completed));
      setIndex(firstOpen === -1 ? 0 : firstOpen);
    }).catch((e: Error) => setError(e.message));
  }, [sessionId]);

  // Active-time clock; pauses with the session.
  useEffect(() => {
    if (session?.status !== "in_progress") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [session?.status]);

  useEffect(() => {
    if (rest === null || rest <= 0) return;
    const t = setTimeout(() => setRest((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  const flush = useCallback(async (): Promise<boolean> => {
    const sets = Object.values(draftRef.current);
    if (!sets.length) return true;
    setSave("saving");
    try {
      const s = await fitnessApi.saveSets(sessionId, sets, notes || null);
      changed.current = true;
      setSession(s);
      writeLocal(sessionId, null);
      setSave("saved");
      return true;
    } catch (e) {
      const msg = (e as Error).message;
      // Keep the edits locally so a refresh or reconnect can restore them.
      writeLocal(sessionId, draftRef.current);
      setSave("offline");
      setError(msg);
      return false;
    }
  }, [sessionId, notes]);

  useEffect(() => {
    if (save !== "dirty" || !open) return;
    writeLocal(sessionId, draftRef.current);
    const t = setTimeout(flush, 1200);
    return () => clearTimeout(t);
  }, [draft, save, flush, open, sessionId]);

  useEffect(() => {
    if (save !== "offline") return;
    const retry = () => flush();
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [save, flush]);

  const update = (item: ApiPlanItem, n: number, patch: Partial<ApiSetInput>) => {
    const key = k(item.id, n);
    const current = draft[key] || { item_id: item.id, set_number: n, completed: false };
    const next = { ...current, ...patch };
    if (patch.completed && !current.completed) {
      if (item.tracking_type === "weight_reps" && next.reps == null && item.reps_min) next.reps = item.reps_max || item.reps_min;
      if (item.tracking_type === "weight_reps" && next.weight_kg == null && item.target_weight_kg) next.weight_kg = item.target_weight_kg;
      if (item.rest_seconds) setRest(item.rest_seconds);
    }
    setDraft({ ...draft, [key]: next });
    setSave("dirty");
    setError(null);
  };

  const transition = async (action: "pause" | "resume" | "complete" | "abandon") => {
    if (action === "abandon" && !window.confirm("Abandon this workout? Logged sets are kept and you can restart it later.")) return;
    if (action === "complete") {
      const done = Object.values(draft).filter((x) => x.completed).length;
      if (!done) return setError("Mark at least one set as done before finishing.");
      if (!window.confirm(`Finish workout with ${done} completed set${done === 1 ? "" : "s"}?`)) return;
    }
    setBusy(true);
    setError(null);
    try {
      if (save === "dirty" || save === "offline") {
        if (!(await flush())) return;
      }
      const s = await fitnessApi.sessionAction(sessionId, action);
      changed.current = true;
      setSession(s);
      setElapsed(s.active_seconds);
      if (action === "complete" || action === "abandon") writeLocal(sessionId, null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const showInfo = async (item: ApiPlanItem) => {
    try {
      setInfo(await fitnessApi.getExercise(item.exercise_id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const item = session?.items[index];
  const setCount = (it: ApiPlanItem) => {
    const logged = Object.values(draft).filter((x) => x.item_id === it.id).map((x) => x.set_number);
    return Math.max(it.sets || 1, ...logged, 0) + (extraSets[it.id] || 0);
  };
  const doneFor = (it: ApiPlanItem) => Object.values(draft).filter((x) => x.item_id === it.id && x.completed).length;
  const progress = useMemo(() => {
    if (!session) return 0;
    const total = session.items.reduce((acc, it) => acc + (it.sets || 1), 0);
    const done = Object.values(draft).filter((x) => x.completed).length;
    return total ? Math.min(100, Math.round((100 * done) / total)) : 0;
  }, [session, draft]);

  const saveLabel = { idle: "", dirty: "Unsaved changes…", saving: "Saving…", saved: "All changes saved", offline: "Couldn't save — kept on this device, will retry" }[save];

  return (
    <Modal title={session ? `${session.day_name} · ${formatDay(session.scheduled_date)}` : "Workout"} onClose={() => onClose(changed.current)} wide>
      {!session ? (error ? <Notice kind="error">{error}</Notice> : <LoadingRow label="Loading workout…" />) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={session.status} />
            <span className="flex items-center gap-1 text-sm tabular-nums text-[var(--text)]"><Timer className="h-4 w-4" /> {formatDuration(elapsed)}</span>
            <div className="flex-1 min-w-[120px]">
              <div className="h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Sets completed">
                <div className="h-full bg-[var(--primary)] transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <span className="text-xs text-[var(--text-muted)]">{progress}%</span>
          </div>
          {restored && <Notice kind="success" onDismiss={() => setRestored(false)}>Restored unsaved sets from your last visit. They&apos;ll be saved automatically.</Notice>}
          {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
          {session.trainer_feedback && <Notice kind="success"><strong>Trainer feedback:</strong> {session.trainer_feedback}</Notice>}
          {rest !== null && rest > 0 && open && (
            <div className="flex items-center justify-between rounded-xl bg-[var(--info-soft)] px-3 py-2 text-sm text-[var(--info-foreground)]" role="timer" aria-live="polite">
              <span>Rest: <strong className="tabular-nums">{formatDuration(rest)}</strong></span>
              <button type="button" className="text-xs underline" onClick={() => setRest(null)}>Skip</button>
            </div>
          )}

          {session.items.length === 0 ? <EmptyBlock title="This workout's exercises were removed from the plan">Logged sets are kept in history.</EmptyBlock> : (
            <>
              <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Exercises">
                {session.items.map((it, i) => {
                  const done = doneFor(it) >= (it.sets || 1);
                  return (
                    <button key={it.id} type="button" role="tab" aria-selected={i === index} onClick={() => setIndex(i)}
                      className={`shrink-0 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs border ${i === index ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)] font-semibold" : "border-[var(--border)] text-[var(--text-secondary)]"}`}>
                      {done && <Check className="h-3 w-3" aria-label="done" />}{i + 1}. {it.exercise_name}
                    </button>
                  );
                })}
              </div>

              {item && (
                <div className="rounded-xl border border-[var(--border)] p-3 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[var(--text)]">{item.exercise_name}
                        {item.group_label && <span className="ml-2 text-[10px] rounded bg-[var(--primary-soft)] px-1.5 text-[var(--primary-dark)]">{humanize(item.group_type)} {item.group_label}</span>}
                        {item.section !== "main" && <span className="ml-2 text-[10px] uppercase text-[var(--text-muted)]">{humanize(item.section)}</span>}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">Target: {prescription(item) || "—"}</p>
                      {item.notes && <p className="text-xs italic text-[var(--text-secondary)] mt-0.5">{item.notes}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => showInfo(item)}><Info /> How to</Button>
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: setCount(item) }, (_, i) => i + 1).map((n) => {
                      const s = draft[k(item.id, n)];
                      const t = item.tracking_type;
                      return (
                        <div key={n} className={`flex flex-wrap items-end gap-2 rounded-lg p-2 ${s?.completed ? "bg-[var(--success-soft)]" : "bg-[var(--surface-elevated)]"}`}>
                          <span className="w-12 text-xs font-semibold text-[var(--text-muted)] pb-2.5">Set {n}</span>
                          {(t === "weight_reps") && <SetField label="kg" step="0.5" value={s?.weight_kg} placeholder={item.target_weight_kg} disabled={!open} onChange={(v) => update(item, n, { weight_kg: v })} />}
                          {(t === "weight_reps" || t === "reps") && <SetField label="Reps" value={s?.reps} placeholder={item.reps_max || item.reps_min} disabled={!open} onChange={(v) => update(item, n, { reps: v })} />}
                          {(t === "duration" || t === "duration_distance") && <SetField label="Seconds" value={s?.duration_seconds} placeholder={item.duration_seconds} disabled={!open} onChange={(v) => update(item, n, { duration_seconds: v })} />}
                          {(t === "distance" || t === "duration_distance") && <SetField label="Metres" value={s?.distance_m} placeholder={item.distance_m} disabled={!open} onChange={(v) => update(item, n, { distance_m: v })} />}
                          <SetField label="RPE" value={s?.rpe} min={1} max={10} disabled={!open} onChange={(v) => update(item, n, { rpe: v })} />
                          <label className="flex items-center gap-1.5 pb-2.5 text-xs font-semibold text-[var(--text)]">
                            <input type="checkbox" className="h-5 w-5" checked={!!s?.completed} disabled={!open} onChange={(e) => update(item, n, { completed: e.target.checked })} /> Done
                          </label>
                        </div>
                      );
                    })}
                    {open && <Button variant="ghost" size="sm" onClick={() => setExtraSets({ ...extraSets, [item.id]: (extraSets[item.id] || 0) + 1 })}><Plus /> Add set</Button>}
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" size="sm" disabled={index === 0} onClick={() => setIndex(index - 1)}><ChevronLeft /> Previous</Button>
                    <Button variant="outline" size="sm" disabled={index >= session.items.length - 1} onClick={() => setIndex(index + 1)}>Next <ChevronRight /></Button>
                  </div>
                </div>
              )}
            </>
          )}

          <label className="block text-xs font-semibold text-[var(--text-secondary)]">How did it go? (shared with your trainer)
            <textarea rows={2} maxLength={2000} value={notes} disabled={!open} onChange={(e) => { setNotes(e.target.value); setSave("dirty"); }} className={`${inputClass} mt-1`} />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]" aria-live="polite">
              {save === "offline" && <CloudOff className="h-3.5 w-3.5" />}{saveLabel}
            </span>
            {open ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => transition("abandon")}><XCircle /> Abandon</Button>
                {session.status === "in_progress"
                  ? <Button variant="outline" size="sm" disabled={busy} onClick={() => transition("pause")}><Pause /> Pause</Button>
                  : <Button variant="outline" size="sm" disabled={busy} onClick={() => transition("resume")}><Play /> Resume</Button>}
                {save !== "saved" && save !== "idle" && <Button variant="secondary" size="sm" disabled={busy || save === "saving"} onClick={flush}>Save now</Button>}
                <Button size="sm" disabled={busy} onClick={() => transition("complete")}>{busy ? <Loader2 className="animate-spin" /> : <Flag />} Finish workout</Button>
              </div>
            ) : (
              <div className="text-sm text-[var(--text-secondary)]">
                {session.status === "completed" ? `Completed · ${session.completed_sets} sets · ${session.total_volume_kg} kg volume · ${formatDuration(session.duration_seconds)}` : "This workout was abandoned. Restart it from the schedule."}
              </div>
            )}
          </div>
          {!readOnlyFeedback && <FeedbackBox session={session} onSaved={(s) => { setSession(s); changed.current = true; }} />}
        </div>
      )}
      {info && <Modal title={info.name} onClose={() => setInfo(null)} wide><ExerciseDetail ex={info} /></Modal>}
    </Modal>
  );
}

function SetField({ label, value, onChange, placeholder, step = "1", min = 0, max, disabled }: {
  label: string; value?: number | null; onChange: (v: number | null) => void; placeholder?: number | null; step?: string; min?: number; max?: number; disabled?: boolean;
}) {
  return (
    <label className="text-[10px] font-semibold text-[var(--text-muted)]">{label}
      <input type="number" inputMode="decimal" step={step} min={min} max={max} value={value ?? ""} placeholder={placeholder ? String(placeholder) : ""} disabled={disabled}
        onChange={(e) => onChange(numOrNull(e.target.value))} className={`${inputClass} block w-20 px-2 py-2 mt-0.5`} />
    </label>
  );
}

/** Staff-only: shown when SessionRunner is opened by a trainer/owner (readOnlyFeedback=false). */
function FeedbackBox({ session, onSaved }: { session: ApiWorkoutSessionDetail; onSaved: (s: ApiWorkoutSessionDetail) => void }) {
  const [text, setText] = useState(session.trainer_feedback || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const submit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      onSaved(await fitnessApi.setFeedback(session.id, text.trim()));
      setMsg({ kind: "success", text: "Feedback saved. The member can see it." });
    } catch (e) {
      setMsg({ kind: "error", text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-2 border-t border-[var(--border)] pt-3">
      <label className="block text-xs font-semibold text-[var(--text-secondary)]">Feedback for the member
        <textarea rows={2} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} className={`${inputClass} mt-1`} />
      </label>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <Button size="sm" variant="secondary" disabled={saving || !text.trim()} onClick={submit}>{saving && <Loader2 className="animate-spin" />} Save feedback</Button>
    </div>
  );
}

// ------------------------------------------------------------------ member "my workouts" page

export function MemberWorkouts() {
  const [refresh, setRefresh] = useState(0);
  const [today, setToday] = useState<ApiScheduleOccurrence[] | null>(null);
  const [unfinished, setUnfinished] = useState<ApiWorkoutSession[]>([]);
  const [history, setHistory] = useState<ApiWorkoutSession[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const d = isoDate();
    Promise.all([
      fitnessApi.schedule({ date_from: d, date_to: d }),
      fitnessApi.listSessions({ status: "in_progress", page_size: 5 }),
      fitnessApi.listSessions({ status: "paused", page_size: 5 }),
      fitnessApi.listSessions({ page_size: 10 }),
    ]).then(([t, a, b, h]) => {
      setToday(t);
      setUnfinished([...a.items, ...b.items]);
      setHistory(h.items);
    }).catch((e: Error) => setError(e.message));
  }, [refresh]);

  const openOccurrence = async (o: ApiScheduleOccurrence) => {
    setStarting(true);
    setError(null);
    try {
      setOpenId(await openOrStartSession(o));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStarting(false);
    }
  };

  const todays = (today || []).filter((o) => !o.is_rest_day);
  return (
    <div className="space-y-4">
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      {unfinished.length > 0 && (
        <Card className="p-4 border-[var(--warning)]/40">
          <p className="text-sm font-semibold text-[var(--text)] flex items-center gap-2"><CircleAlert className="h-4 w-4 text-[var(--warning)]" /> Unfinished workout</p>
          {unfinished.map((s) => (
            <div key={s.id} className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm">{s.day_name} · {formatDay(s.scheduled_date)} · {s.completed_sets} sets logged</span>
              <Button size="sm" onClick={() => setOpenId(s.id)}><Play /> Resume</Button>
            </div>
          ))}
        </Card>
      )}
      <Card className="p-4">
        <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2"><Dumbbell className="h-4 w-4" /> Today&apos;s workout</h2>
        {!today ? <LoadingRow /> : todays.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-muted)]">{today.some((o) => o.is_rest_day) ? "Rest day — recover well." : "Nothing scheduled today. Check your week below."}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {todays.map((o) => (
              <div key={o.assignment_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] p-3">
                <div>
                  <p className="font-semibold text-[var(--text)]">{o.day_name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{o.assignment_title} · {o.exercise_count} exercises</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={o.status} />
                  <Button size="sm" disabled={starting} onClick={() => openOccurrence(o)}>
                    {starting ? <Loader2 className="animate-spin" /> : <Play />} {o.status === "completed" ? "View" : o.session_id && o.status !== "abandoned" ? "Resume" : "Start workout"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <WeekSchedule onOpen={openOccurrence} refreshKey={refresh} canStart />
      <Card className="p-4">
        <h3 className="text-sm font-bold text-[var(--text)] mb-2">Recent workouts</h3>
        {!history ? <LoadingRow /> : history.length === 0 ? <EmptyBlock title="No workouts logged yet" /> : (
          <ul className="divide-y divide-[var(--border)]">
            {history.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => setOpenId(s.id)} className="w-full py-2.5 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-[var(--nav-hover-bg)] rounded-lg px-1">
                  <span>
                    <span className="block text-sm font-medium text-[var(--text)]">{s.day_name}</span>
                    <span className="block text-xs text-[var(--text-muted)]">{formatDay(s.scheduled_date)} · {s.completed_sets} sets · {s.total_volume_kg} kg{s.trainer_feedback ? " · has trainer feedback" : ""}</span>
                  </span>
                  <StatusBadge status={s.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {openId && <SessionRunner sessionId={openId} readOnlyFeedback onClose={() => { setOpenId(null); setRefresh((r) => r + 1); }} />}
    </div>
  );
}
