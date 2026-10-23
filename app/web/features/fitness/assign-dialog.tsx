"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { repsiApi } from "@/lib/api";
import { fitnessApi, type ApiAssignResult, type ApiFitnessContext } from "@/lib/fitness-api";
import { Field, inputClass, isoDate, LoadingRow, Modal, Notice, WEEKDAYS } from "./shared";

interface Candidate { id: string; name: string; status?: string }

export function WeekdayPicker({ value, onChange, disabled }: { value: number[]; onChange: (v: number[]) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Training weekdays">
      {WEEKDAYS.map((label, i) => {
        const on = value.includes(i);
        return (
          <button key={label} type="button" aria-pressed={on} disabled={disabled}
            onClick={() => onChange(on ? value.filter((d) => d !== i) : [...value, i].sort())}
            className={`h-9 w-11 rounded-lg border text-xs font-semibold ${on ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function AssignDialog({ ctx, programId, programName, presetMemberId, onClose, onDone }: {
  ctx: ApiFitnessContext; programId: string; programName: string; presetMemberId?: string;
  onClose: () => void; onDone: (r: ApiAssignResult) => void;
}) {
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [selected, setSelected] = useState<string[]>(presetMemberId ? [presetMemberId] : []);
  const [search, setSearch] = useState("");
  const [start, setStart] = useState(isoDate());
  const [end, setEnd] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([0, 2, 4]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiAssignResult | null>(null);

  useEffect(() => {
    let alive = true;
    // Trainers get their (small) client list; gyms search the paginated member directory server-side.
    const t = setTimeout(async () => {
      try {
        const list: Candidate[] = ctx.kind === "trainer"
          ? (await repsiApi.getCurrentTrainerClients()).map((c: { client_id: string; name: string; membership_status?: string }) => ({ id: c.client_id, name: c.name, status: c.membership_status }))
          : (await repsiApi.listMembers({ query: search.trim() || undefined, pageSize: 50, sort: "first_name" })).items.map(
              (m: { id: string; first_name: string; last_name?: string; status: string }) => ({ id: m.id, name: `${m.first_name} ${m.last_name || ""}`.trim(), status: m.status }));
        if (alive) setCandidates(list);
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    }, ctx.kind === "trainer" ? 0 : 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [ctx.kind, search]);

  const filtered = useMemo(
    () => (candidates || []).filter((c) => ctx.kind !== "trainer" || c.name.toLowerCase().includes(search.toLowerCase())),
    [candidates, search, ctx.kind],
  );

  const submit = async () => {
    if (!selected.length) return setError("Select at least one member.");
    if (end && end < start) return setError("End date can't be before the start date.");
    setSaving(true);
    setError(null);
    try {
      const r = await fitnessApi.assignProgram({
        program_id: programId, member_ids: selected, start_date: start, end_date: end || null,
        schedule_weekdays: weekdays, notes: notes.trim() || null,
      });
      setResult(r);
      onDone(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Assign “${programName}”`} onClose={onClose}>
      {result ? (
        <div className="space-y-3">
          {result.created.length > 0 && <Notice kind="success">Assigned to {result.created.map((a) => a.member_name).join(", ")}.</Notice>}
          {result.skipped.length > 0 && (
            <Notice kind="error">
              Skipped:
              <ul className="list-disc pl-4">{result.skipped.map((s) => <li key={s.member_id}>{s.member_name}: {s.reason}</li>)}</ul>
            </Notice>
          )}
          <div className="flex justify-end"><Button size="sm" onClick={onClose}>Done</Button></div>
        </div>
      ) : (
        <div className="space-y-4">
          {error && <Notice kind="error">{error}</Notice>}
          {!presetMemberId && (
            <Field label={ctx.kind === "trainer" ? "Your clients" : "Members"}>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                <input aria-label="Search members" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className={`${inputClass} pl-9`} />
              </div>
              {!candidates ? <LoadingRow /> : filtered.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] py-3">{ctx.kind === "trainer" ? "No assigned clients. Ask the gym owner to assign members to you." : "No members found."}</p>
              ) : (
                <ul className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
                  {filtered.map((c) => (
                    <li key={c.id}>
                      <label className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-[var(--nav-hover-bg)]">
                        <input type="checkbox" checked={selected.includes(c.id)}
                          onChange={(e) => setSelected(e.target.checked ? [...selected, c.id] : selected.filter((x) => x !== c.id))} />
                        <span className="flex-1">{c.name}</span>
                        {c.status && <span className="text-[11px] text-[var(--text-muted)]">{c.status}</span>}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] text-[var(--text-muted)] mt-1">{selected.length} selected. Members who already have this program active for these dates are skipped.</p>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" htmlFor="as-start"><input id="as-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} /></Field>
            <Field label="End date (optional)" htmlFor="as-end"><input id="as-end" type="date" min={start} value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} /></Field>
          </div>
          <Field label="Training days" hint={weekdays.length ? "Training days rotate through the program's workouts on these weekdays." : "No weekdays: the program runs day-by-day, including its rest days."}>
            <WeekdayPicker value={weekdays} onChange={setWeekdays} />
          </Field>
          <Field label="Notes for the member" htmlFor="as-notes"><textarea id="as-notes" rows={2} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} /></Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={saving}>{saving && <Loader2 className="animate-spin" />} Assign</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
