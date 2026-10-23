"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus, Plus, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { repsiApi } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { EmptyBlock, Field, LoadingRow, Modal, Notice, WEEKDAYS, addDays, inputClass, isoDate } from "@/features/fitness/shared";
import { MemberSearch } from "@/features/classes/member-search";
import { bookingApi, formatDateTime, type ClassBooking, type ClassSession, type GymClass } from "@/lib/operations-api";

const MANAGER_ROLES = ["OWNER", "ADMIN", "MANAGER", "SUPER_ADMIN"];

function bookingVariant(s: string): "active" | "expiring" | "expired" | "default" {
  if (s === "booked" || s === "attended") return "active";
  if (s === "waitlisted") return "expiring";
  if (s === "no_show") return "expired";
  return "default";
}

function ClassForm({ trainers, initial, onSaved, onClose }: {
  trainers: { id: string; name: string }[];
  initial?: GymClass;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    category: initial?.category ?? "Strength",
    capacity: initial?.capacity ?? 20,
    duration_minutes: initial?.duration_minutes ?? 60,
    room: initial?.room ?? "",
    trainer_id: initial?.trainer_id ?? "",
    booking_open_hours: initial?.booking_open_hours ?? 168,
    cancel_cutoff_hours: initial?.cancel_cutoff_hours ?? 2,
    waitlist_enabled: initial?.waitlist_enabled ?? true,
    description: initial?.description ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = { ...form, trainer_id: form.trainer_id || undefined, room: form.room || undefined };
    try {
      if (initial) await bookingApi.updateClass(initial.id, body);
      else await bookingApi.createClass(body);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={initial ? "Edit class" : "New class"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <Notice kind="error">{error}</Notice>}
        <Field label="Name" htmlFor="class-name">
          <input id="class-name" required minLength={2} className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" htmlFor="class-category">
            <input id="class-category" className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)} />
          </Field>
          <Field label="Room" htmlFor="class-room">
            <input id="class-room" className={inputClass} value={form.room} onChange={(e) => set("room", e.target.value)} />
          </Field>
          <Field label="Places" htmlFor="class-capacity">
            <input id="class-capacity" type="number" min={1} max={500} className={inputClass} value={form.capacity}
              onChange={(e) => set("capacity", Number(e.target.value))} />
          </Field>
          <Field label="Length (minutes)" htmlFor="class-duration">
            <input id="class-duration" type="number" min={10} max={480} className={inputClass} value={form.duration_minutes}
              onChange={(e) => set("duration_minutes", Number(e.target.value))} />
          </Field>
          <Field label="Bookings open (hours before)" htmlFor="class-open">
            <input id="class-open" type="number" min={1} className={inputClass} value={form.booking_open_hours}
              onChange={(e) => set("booking_open_hours", Number(e.target.value))} />
          </Field>
          <Field label="Late cancel within (hours)" htmlFor="class-cutoff">
            <input id="class-cutoff" type="number" min={0} max={72} className={inputClass} value={form.cancel_cutoff_hours}
              onChange={(e) => set("cancel_cutoff_hours", Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Default trainer" htmlFor="class-trainer">
          <select id="class-trainer" className={inputClass} value={form.trainer_id} onChange={(e) => set("trainer_id", e.target.value)}>
            <option value="">No trainer</option>
            {trainers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.waitlist_enabled} onChange={(e) => set("waitlist_enabled", e.target.checked)} />
          Keep a waitlist when the class is full
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={saving}>{initial ? "Save changes" : "Create class"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ScheduleForm({ gymClass, trainers, onSaved, onClose }: {
  gymClass: GymClass;
  trainers: { id: string; name: string }[];
  onSaved: (n: number) => void;
  onClose: () => void;
}) {
  const [repeat, setRepeat] = useState(false);
  const [date, setDate] = useState(addDays(isoDate(), 1));
  const [time, setTime] = useState("07:00");
  const [until, setUntil] = useState(addDays(isoDate(), 28));
  const [days, setDays] = useState<number[]>([0, 2, 4]);
  const [trainerId, setTrainerId] = useState(gymClass.trainer_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await bookingApi.createSessions(gymClass.id, repeat
        ? { weekdays: days, start_time: time, from_date: date, until_date: until, trainer_id: trainerId || undefined }
        : { starts_at: `${date}T${time}:00`, trainer_id: trainerId || undefined });
      onSaved(created.length);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Schedule ${gymClass.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <Notice kind="error">{error}</Notice>}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} /> Repeat weekly
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Field label={repeat ? "From" : "Date"} htmlFor="session-date">
            <input id="session-date" type="date" required min={isoDate()} className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Start time" htmlFor="session-time">
            <input id="session-time" type="time" required className={inputClass} value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          {repeat && (
            <Field label="Until" htmlFor="session-until">
              <input id="session-until" type="date" required min={date} className={inputClass} value={until} onChange={(e) => setUntil(e.target.value)} />
            </Field>
          )}
        </div>
        {repeat && (
          <fieldset>
            <legend className="text-xs font-semibold text-[var(--text-secondary)] mb-1">On</legend>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d, i) => (
                <label key={d} className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs ${days.includes(i) ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]" : "border-[var(--border)]"}`}>
                  <input type="checkbox" className="sr-only" checked={days.includes(i)}
                    onChange={(e) => setDays((s) => (e.target.checked ? [...s, i] : s.filter((x) => x !== i)))} />
                  {d}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <Field label="Trainer" htmlFor="session-trainer">
          <select id="session-trainer" className={inputClass} value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
            <option value="">No trainer</option>
            {trainers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <p className="text-xs text-[var(--text-muted)]">Times are in the gym's time zone. Trainer clashes are checked automatically.</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={saving}>Schedule</Button>
        </div>
      </form>
    </Modal>
  );
}

function Roster({ session, canManage, onChanged, onClose }: {
  session: ClassSession;
  canManage: boolean;
  onChanged: () => void;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<ClassBooking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    bookingApi.sessionBookings(session.id).then(setRows).catch((e) => setError(e.message));
  }, [session.id]);
  useEffect(load, [load]);

  const act = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      load();
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Modal title={`${session.class_name} · ${formatDateTime(session.starts_at)}`} onClose={onClose} wide>
      <div className="space-y-3">
        {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
        <p className="text-sm text-[var(--text-secondary)]">
          {session.booked}/{session.capacity} booked · {session.waitlisted} waitlisted
        </p>
        {session.status === "scheduled" && (
          <MemberSearch label="Book a member" onPick={(m) => act(() => bookingApi.book(session.id, m.id))} />
        )}
        {rows === null ? <LoadingRow /> : rows.length === 0 ? (
          <EmptyBlock title="No bookings yet" />
        ) : (
          <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
            {rows.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span>
                  {b.member_name}
                  {b.waitlist_position ? <span className="text-[var(--text-muted)]"> · #{b.waitlist_position}</span> : null}
                </span>
                <span className="flex items-center gap-2">
                  <Badge variant={bookingVariant(b.status)}>{b.status.replace("_", " ")}{b.late_cancel ? " (late)" : ""}</Badge>
                  {b.status === "booked" && (
                    <Button size="sm" variant="outline" onClick={() => act(() => bookingApi.checkIn(b.id))}>Check in</Button>
                  )}
                  {(b.status === "booked" || b.status === "waitlisted") && (
                    <Button size="sm" variant="ghost" onClick={() => act(() => bookingApi.cancelBooking(b.id, "Cancelled by staff"))}>Cancel</Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        {canManage && session.status === "scheduled" && (
          <div className="flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                const reason = window.prompt("Why is this session cancelled? Booked members are told.");
                if (reason && reason.trim().length >= 3) act(() => bookingApi.cancelSession(session.id, reason.trim())).then(onClose);
              }}
            >
              <XCircle aria-hidden /> Cancel session
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function ClassesManager() {
  // Read the role after mount so server and client render the same markup.
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => setRole(getAuthUser()?.role || null), []);
  const canManage = !!role && MANAGER_ROLES.includes(role);
  const [classes, setClasses] = useState<GymClass[] | null>(null);
  const [sessions, setSessions] = useState<ClassSession[] | null>(null);
  const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([]);
  const [editing, setEditing] = useState<GymClass | "new" | null>(null);
  const [scheduling, setScheduling] = useState<GymClass | null>(null);
  const [roster, setRoster] = useState<ClassSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, s] = await Promise.all([bookingApi.listClasses(), bookingApi.listSessions({ start: isoDate(), end: addDays(isoDate(), 14) })]);
      setClasses(c);
      setSessions(s);
    } catch (e) {
      setError((e as Error).message);
      setClasses([]);
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    load();
    repsiApi.getTrainers().then((t) => setTrainers((t || []).map((x: any) => ({ id: x.id, name: x.name })))).catch(() => setTrainers([]));
  }, [load]);

  const byDay = useMemo(() => {
    const groups: Record<string, ClassSession[]> = {};
    for (const s of sessions || []) {
      const key = new Date(s.starts_at).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
      (groups[key] ||= []).push(s);
    }
    return Object.entries(groups);
  }, [sessions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Classes</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Schedule sessions, take bookings and manage waitlists.</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus aria-hidden /> New class
          </Button>
        )}
      </div>
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      {notice && <Notice kind="success" onDismiss={() => setNotice(null)}>{notice}</Notice>}

      <section aria-labelledby="classes-heading" className="space-y-3">
        <h2 id="classes-heading" className="text-base font-semibold text-[var(--text)]">Class types</h2>
        {classes === null ? <LoadingRow /> : classes.length === 0 ? (
          <EmptyBlock title="No classes yet">{canManage ? "Create a class, then schedule its sessions." : "Ask a manager to add classes."}</EmptyBlock>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {classes.map((c) => (
              <div key={c.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-[var(--text)]">{c.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{c.category} · {c.duration_minutes} min · {c.capacity} places</p>
                  </div>
                  {c.waitlist_enabled && <Badge variant="outline">Waitlist</Badge>}
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setScheduling(c)}>
                      <CalendarPlus aria-hidden /> Schedule
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>Edit</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="sessions-heading" className="space-y-3">
        <h2 id="sessions-heading" className="text-base font-semibold text-[var(--text)]">Next 14 days</h2>
        {sessions === null ? <LoadingRow /> : byDay.length === 0 ? (
          <EmptyBlock title="No sessions scheduled">Use “Schedule” on a class to add one-off or weekly sessions.</EmptyBlock>
        ) : (
          byDay.map(([day, list]) => (
            <div key={day} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{day}</h3>
              <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                {list.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setRoster(s)}
                      className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    >
                      <span>
                        <span className="font-medium text-[var(--text)]">{s.class_name}</span>
                        <span className="text-sm text-[var(--text-muted)]">
                          {" "}· {new Date(s.starts_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                          {s.room ? ` · ${s.room}` : ""}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-sm tabular-nums">
                        <Users className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                        {s.booked}/{s.capacity}
                        {s.waitlisted > 0 && <Badge variant="expiring">{s.waitlisted} waiting</Badge>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      {editing && (
        <ClassForm trainers={trainers} initial={editing === "new" ? undefined : editing} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); setNotice("Class saved."); load(); }} />
      )}
      {scheduling && (
        <ScheduleForm gymClass={scheduling} trainers={trainers} onClose={() => setScheduling(null)}
          onSaved={(n) => { setScheduling(null); setNotice(`${n} session${n === 1 ? "" : "s"} scheduled.`); load(); }} />
      )}
      {roster && <Roster session={roster} canManage={canManage} onChanged={load} onClose={() => setRoster(null)} />}
    </div>
  );
}
