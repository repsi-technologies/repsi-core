"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, BedDouble, Plus, Repeat, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fitnessApi, type ApiExercise, type ApiPlanDay, type ApiPlanDayInput, type FitTracking } from "@/lib/fitness-api";
import { humanize, inputClass, LoadingRow, Modal } from "./shared";

export interface ItemDraft {
  key: string;
  id?: string;
  exercise_id: string;
  exercise_name: string;
  tracking_type: FitTracking;
  section: "warmup" | "main" | "cooldown";
  group_type: "superset" | "circuit" | "";
  group_label: string;
  sets: number | null;
  reps_min: number | null;
  reps_max: number | null;
  target_weight_kg: number | null;
  duration_seconds: number | null;
  distance_m: number | null;
  rest_seconds: number | null;
  tempo: string;
  notes: string;
}

export interface DayDraft {
  key: string;
  id?: string;
  name: string;
  is_rest_day: boolean;
  notes: string;
  items: ItemDraft[];
}

let seq = 0;
const key = () => `k${Date.now().toString(36)}${(seq++).toString(36)}`;

export function draftsFromDays(days: ApiPlanDay[], keepIds: boolean): DayDraft[] {
  return days.map((d) => ({
    key: key(), id: keepIds ? d.id : undefined, name: d.name, is_rest_day: d.is_rest_day, notes: d.notes || "",
    items: d.items.map((it) => ({
      key: key(), id: keepIds ? it.id : undefined, exercise_id: it.exercise_id, exercise_name: it.exercise_name,
      tracking_type: it.tracking_type, section: it.section, group_type: it.group_type || "", group_label: it.group_label || "",
      sets: it.sets ?? null, reps_min: it.reps_min ?? null, reps_max: it.reps_max ?? null, target_weight_kg: it.target_weight_kg ?? null,
      duration_seconds: it.duration_seconds ?? null, distance_m: it.distance_m ?? null, rest_seconds: it.rest_seconds ?? null,
      tempo: it.tempo || "", notes: it.notes || "",
    })),
  }));
}

export function daysToInput(days: DayDraft[]): ApiPlanDayInput[] {
  return days.map((d) => ({
    id: d.id, name: d.name.trim() || "Untitled day", is_rest_day: d.is_rest_day, notes: d.notes.trim() || null,
    items: d.is_rest_day ? [] : d.items.map((it) => ({
      id: it.id, exercise_id: it.exercise_id, section: it.section,
      group_type: it.group_label.trim() ? (it.group_type || "superset") : null, group_label: it.group_label.trim() || null,
      sets: it.sets, reps_min: it.reps_min, reps_max: it.reps_max, target_weight_kg: it.target_weight_kg,
      duration_seconds: it.duration_seconds, distance_m: it.distance_m, rest_seconds: it.rest_seconds,
      tempo: it.tempo.trim() || null, notes: it.notes.trim() || null,
    })),
  }));
}

/** Client-side mirror of the API's prescription rules, so problems show before saving. */
export function validateDays(days: DayDraft[], requireTraining: boolean): string | null {
  if (requireTraining && !days.some((d) => !d.is_rest_day && d.items.length)) return "Add at least one training day with exercises.";
  for (const d of days) {
    if (!d.name.trim()) return "Every day needs a name.";
    if (requireTraining && !d.is_rest_day && !d.items.length) return `“${d.name}” has no exercises. Add some or mark it as a rest day.`;
    for (const it of d.items) {
      if (!it.sets && !it.reps_min && !it.duration_seconds && !it.distance_m)
        return `${it.exercise_name} in “${d.name}” needs sets, reps, a duration or a distance.`;
      if (it.reps_min && it.reps_max && it.reps_min > it.reps_max) return `${it.exercise_name}: minimum reps can't exceed maximum reps.`;
    }
  }
  return null;
}

function defaultsFor(ex: ApiExercise): Partial<ItemDraft> {
  if (ex.tracking_type === "duration") return { sets: 3, duration_seconds: 30, rest_seconds: 60 };
  if (ex.tracking_type === "distance" || ex.tracking_type === "duration_distance") return { sets: 1, duration_seconds: 600 };
  return { sets: 3, reps_min: 8, reps_max: 12, rest_seconds: 90 };
}

const num = (v: string): number | null => (v === "" ? null : Number(v));

export function PlanEditor({ days, onChange, disabled }: { days: DayDraft[]; onChange: (d: DayDraft[]) => void; disabled?: boolean }) {
  const [picker, setPicker] = useState<{ dayKey: string; replaceKey?: string } | null>(null);

  const updateDay = (dk: string, patch: Partial<DayDraft>) => onChange(days.map((d) => (d.key === dk ? { ...d, ...patch } : d)));
  const updateItem = (dk: string, ik: string, patch: Partial<ItemDraft>) =>
    onChange(days.map((d) => (d.key === dk ? { ...d, items: d.items.map((it) => (it.key === ik ? { ...it, ...patch } : it)) } : d)));
  const move = <T,>(arr: T[], i: number, dir: -1 | 1): T[] => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return arr;
    const copy = [...arr];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  };

  const onPick = (ex: ApiExercise) => {
    if (!picker) return;
    const day = days.find((d) => d.key === picker.dayKey);
    if (!day) return;
    if (picker.replaceKey) {
      updateItem(day.key, picker.replaceKey, { exercise_id: ex.id, exercise_name: ex.name, tracking_type: ex.tracking_type });
    } else {
      const item: ItemDraft = {
        key: key(), exercise_id: ex.id, exercise_name: ex.name, tracking_type: ex.tracking_type, section: "main", group_type: "",
        group_label: "", sets: null, reps_min: null, reps_max: null, target_weight_kg: null, duration_seconds: null, distance_m: null,
        rest_seconds: null, tempo: "", notes: "", ...defaultsFor(ex),
      };
      updateDay(day.key, { items: [...day.items, item] });
    }
    setPicker(null);
  };

  return (
    <div className="space-y-4">
      {days.map((d, di) => (
        <div key={d.key} className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] p-3">
            <span className="text-xs font-bold text-[var(--text-muted)] w-14">Day {di + 1}</span>
            <input aria-label={`Day ${di + 1} name`} value={d.name} disabled={disabled} onChange={(e) => updateDay(d.key, { name: e.target.value })}
              className={`${inputClass} flex-1 min-w-[140px]`} maxLength={150} />
            <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <input type="checkbox" checked={d.is_rest_day} disabled={disabled || d.items.length > 0}
                onChange={(e) => updateDay(d.key, { is_rest_day: e.target.checked })} />
              <BedDouble className="h-3.5 w-3.5" /> Rest day
            </label>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Move day up" disabled={disabled || di === 0} onClick={() => onChange(move(days, di, -1))}><ArrowUp /></Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Move day down" disabled={disabled || di === days.length - 1} onClick={() => onChange(move(days, di, 1))}><ArrowDown /></Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove day" disabled={disabled} onClick={() => onChange(days.filter((x) => x.key !== d.key))}><Trash2 /></Button>
            </div>
          </div>
          {!d.is_rest_day && (
            <div className="p-3 space-y-2">
              {d.items.length === 0 && <p className="text-xs text-[var(--text-muted)]">No exercises yet.</p>}
              {d.items.map((it, ii) => (
                <div key={it.key} className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--text)] flex-1 min-w-[140px]">{ii + 1}. {it.exercise_name}</span>
                    <select aria-label="Section" value={it.section} disabled={disabled} onChange={(e) => updateItem(d.key, it.key, { section: e.target.value as ItemDraft["section"] })} className={`${inputClass} w-auto`}>
                      <option value="warmup">Warm-up</option><option value="main">Main</option><option value="cooldown">Cool-down</option>
                    </select>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="Replace exercise" title="Replace exercise" disabled={disabled} onClick={() => setPicker({ dayKey: d.key, replaceKey: it.key })}><Repeat /></Button>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={disabled || ii === 0} onClick={() => updateDay(d.key, { items: move(d.items, ii, -1) })}><ArrowUp /></Button>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="Move down" disabled={disabled || ii === d.items.length - 1} onClick={() => updateDay(d.key, { items: move(d.items, ii, 1) })}><ArrowDown /></Button>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove exercise" disabled={disabled} onClick={() => updateDay(d.key, { items: d.items.filter((x) => x.key !== it.key) })}><Trash2 /></Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
                    <NumInput label="Sets" value={it.sets} disabled={disabled} onChange={(v) => updateItem(d.key, it.key, { sets: v })} />
                    <NumInput label="Reps min" value={it.reps_min} disabled={disabled} onChange={(v) => updateItem(d.key, it.key, { reps_min: v })} />
                    <NumInput label="Reps max" value={it.reps_max} disabled={disabled} onChange={(v) => updateItem(d.key, it.key, { reps_max: v })} />
                    <NumInput label="Weight kg" value={it.target_weight_kg} step="0.5" disabled={disabled} onChange={(v) => updateItem(d.key, it.key, { target_weight_kg: v })} />
                    <NumInput label="Time (s)" value={it.duration_seconds} disabled={disabled} onChange={(v) => updateItem(d.key, it.key, { duration_seconds: v })} />
                    <NumInput label="Dist (m)" value={it.distance_m} disabled={disabled} onChange={(v) => updateItem(d.key, it.key, { distance_m: v })} />
                    <NumInput label="Rest (s)" value={it.rest_seconds} disabled={disabled} onChange={(v) => updateItem(d.key, it.key, { rest_seconds: v })} />
                    <label className="text-[10px] font-semibold text-[var(--text-muted)] space-y-0.5">Tempo
                      <input value={it.tempo} disabled={disabled} maxLength={20} placeholder="3-1-1" onChange={(e) => updateItem(d.key, it.key, { tempo: e.target.value })} className={`${inputClass} px-2`} />
                    </label>
                    <label className="text-[10px] font-semibold text-[var(--text-muted)] space-y-0.5" title="Exercises sharing a group label form a superset or circuit">Group
                      <div className="flex gap-1">
                        <input value={it.group_label} disabled={disabled} maxLength={10} placeholder="A" onChange={(e) => updateItem(d.key, it.key, { group_label: e.target.value.toUpperCase() })} className={`${inputClass} px-2 w-12`} />
                        <select aria-label="Group type" value={it.group_type || "superset"} disabled={disabled || !it.group_label} onChange={(e) => updateItem(d.key, it.key, { group_type: e.target.value as ItemDraft["group_type"] })} className={`${inputClass} px-1`}>
                          <option value="superset">SS</option><option value="circuit">Circ</option>
                        </select>
                      </div>
                    </label>
                  </div>
                  <input aria-label="Coaching notes" value={it.notes} disabled={disabled} maxLength={1000} placeholder="Coaching notes (visible to the member)"
                    onChange={(e) => updateItem(d.key, it.key, { notes: e.target.value })} className={inputClass} />
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setPicker({ dayKey: d.key })}><Plus /> Add exercise</Button>
            </div>
          )}
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" disabled={disabled || days.length >= 28}
        onClick={() => onChange([...days, { key: key(), name: `Day ${days.length + 1}`, is_rest_day: false, notes: "", items: [] }])}>
        <Plus /> Add day
      </Button>
      {picker && <ExercisePicker onClose={() => setPicker(null)} onPick={onPick} title={picker.replaceKey ? "Replace exercise" : "Add exercise"} />}
    </div>
  );
}

function NumInput({ label, value, onChange, step = "1", disabled }: { label: string; value: number | null; onChange: (v: number | null) => void; step?: string; disabled?: boolean }) {
  return (
    <label className="text-[10px] font-semibold text-[var(--text-muted)] space-y-0.5">{label}
      <input type="number" inputMode="decimal" min={0} step={step} value={value ?? ""} disabled={disabled}
        onChange={(e) => onChange(num(e.target.value))} className={`${inputClass} px-2`} />
    </label>
  );
}

export function ExercisePicker({ onClose, onPick, title }: { onClose: () => void; onPick: (ex: ApiExercise) => void; title: string }) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<ApiExercise[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      fitnessApi.listExercises({ search: search || undefined, page_size: 40 })
        .then((r) => alive && setItems(r.items))
        .catch((e: Error) => alive && setError(e.message));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [search]);
  return (
    <Modal title={title} onClose={onClose}>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" aria-hidden />
        <input autoFocus aria-label="Search exercises" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises" className={`${inputClass} pl-9`} />
      </div>
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
      {!items ? <LoadingRow /> : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--text-muted)]">No exercises found.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)] max-h-[50vh] overflow-y-auto">
          {items.map((ex) => (
            <li key={ex.id}>
              <button type="button" onClick={() => onPick(ex)} className="w-full text-left px-2 py-2.5 hover:bg-[var(--nav-hover-bg)] rounded-lg">
                <span className="block text-sm font-medium text-[var(--text)]">{ex.name}</span>
                <span className="block text-xs text-[var(--text-muted)]">{humanize(ex.category)} · {ex.primary_muscles.map(humanize).join(", ")}{ex.scope === "gym" ? " · Gym" : ""}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
