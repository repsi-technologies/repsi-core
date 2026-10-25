"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, ChevronLeft, ChevronRight, Dumbbell, Loader2, Pencil, Plus, RotateCcw, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fitnessApi, type ApiExercise, type ApiExerciseInput, type ApiFitnessMeta, type FitTracking } from "@/lib/fitness-api";
import {
  DemonstrationPickerModal,
  EmptyBlock,
  ExerciseMedia,
  Field,
  humanize,
  inputClass,
  LoadingRow,
  Modal,
  Notice,
  useFitnessContext,
  useFitnessMeta,
} from "./shared";

const PAGE_SIZE = 18;
const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
const TYPES = ["strength", "hypertrophy", "endurance", "power", "cardio", "mobility"];
const TRACKING: { value: FitTracking; label: string }[] = [
  { value: "weight_reps", label: "Weight × reps" },
  { value: "reps", label: "Reps only" },
  { value: "duration", label: "Duration" },
  { value: "distance", label: "Distance" },
  { value: "duration_distance", label: "Duration & distance" },
];

export function ExerciseLibrary({ memberView = false }: { memberView?: boolean }) {
  const { ctx } = useFitnessContext();
  const meta = useFitnessMeta();
  const [filters, setFilters] = useState({ search: "", category: "", muscle: "", equipment: "", difficulty: "", scope: "", sort: "name", include_archived: false });
  const [debounced, setDebounced] = useState(filters.search);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: ApiExercise[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ApiExercise | null>(null);
  const [editing, setEditing] = useState<ApiExercise | "new" | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fitnessApi.listExercises({
        search: debounced || undefined, category: filters.category || undefined, muscle: filters.muscle || undefined,
        equipment: filters.equipment || undefined, difficulty: filters.difficulty || undefined,
        scope: (filters.scope || undefined) as "global" | "gym" | undefined, sort: filters.sort,
        include_archived: filters.include_archived || undefined, page, page_size: PAGE_SIZE,
      });
      setData(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [debounced, filters.category, filters.muscle, filters.equipment, filters.difficulty, filters.scope, filters.sort, filters.include_archived, page]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key: keyof typeof filters, value: string | boolean) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const toggleArchive = async (ex: ApiExercise) => {
    try {
      const updated = await fitnessApi.setExerciseArchived(ex.id, ex.status === "active");
      setDetail(updated);
      setFlash(`${updated.name} ${updated.status === "archived" ? "archived" : "restored"}.`);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--text-muted)]">
          {memberView ? "Exercises from your assigned workout plans, with step-by-step instructions." : "Global REPSI exercises plus your gym's own custom exercises."}
        </p>
        {ctx?.can_manage_exercises && !memberView && (
          <Button size="sm" onClick={() => setEditing("new")}><Plus /> New exercise</Button>
        )}
      </div>

      <Card className="p-3 sm:p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" aria-hidden />
          <input aria-label="Search exercises" value={filters.search} onChange={(e) => set("search", e.target.value)}
            placeholder="Search by name or description" className={`${inputClass} pl-9`} />
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
          <FilterSelect label="Category" value={filters.category} onChange={(v) => set("category", v)} options={meta?.categories} />
          <FilterSelect label="Muscle" value={filters.muscle} onChange={(v) => set("muscle", v)} options={meta?.muscles} />
          <FilterSelect label="Equipment" value={filters.equipment} onChange={(v) => set("equipment", v)} options={meta?.equipment} />
          <FilterSelect label="Difficulty" value={filters.difficulty} onChange={(v) => set("difficulty", v)} options={[...DIFFICULTIES]} />
          {!memberView && <FilterSelect label="Source" value={filters.scope} onChange={(v) => set("scope", v)} options={["global", "gym"]} labels={{ global: "REPSI library", gym: "Gym custom" }} />}
          <select aria-label="Sort" value={filters.sort} onChange={(e) => set("sort", e.target.value)} className={inputClass}>
            <option value="name">Name A–Z</option>
            <option value="-name">Name Z–A</option>
            <option value="newest">Newest</option>
            <option value="difficulty">Difficulty</option>
          </select>
          {!memberView && ctx?.can_manage_exercises && (
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] px-1">
              <input type="checkbox" checked={filters.include_archived} onChange={(e) => set("include_archived", e.target.checked)} /> Show archived
            </label>
          )}
        </div>
      </Card>

      {flash && <Notice kind="success" onDismiss={() => setFlash(null)}>{flash}</Notice>}
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error} <button className="underline ml-1" onClick={load}>Retry</button></Notice>}

      {loading && !data ? (
        <LoadingRow label="Loading exercises…" />
      ) : data && data.items.length === 0 ? (
        <EmptyBlock title={memberView ? "No exercises yet" : "No exercises match these filters"}>
          {memberView ? "Exercises appear here once your trainer assigns you a workout plan." : "Try clearing a filter or searching for a different name."}
        </EmptyBlock>
      ) : (
        <div className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
          {data?.items.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setDetail(ex)}
              className="text-left rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 hover:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-all flex flex-col justify-between group shadow-sm"
            >
              <div className="flex gap-3 items-start w-full">
                <div className="w-24 shrink-0 aspect-[4/3] rounded-lg overflow-hidden border border-[var(--border)] bg-black/20">
                  <ExerciseMedia
                    type={ex.media_type}
                    url={ex.media_url}
                    name={ex.name}
                    compact
                    showControls={false}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-bold text-sm text-[var(--text)] truncate group-hover:text-[var(--primary)] transition-colors">
                      {ex.name}
                    </p>
                    {ex.status === "archived" ? (
                      <Badge variant="outline">Archived</Badge>
                    ) : ex.scope === "gym" ? (
                      <Badge variant="lime">Gym</Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                    {ex.primary_muscles.map(humanize).join(", ")}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                    {ex.equipment.map(humanize).join(", ") || "Bodyweight"}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex flex-wrap gap-1">
                <Badge variant="outline">{humanize(ex.category)}</Badge>
                <Badge variant="outline">{humanize(ex.difficulty)}</Badge>
                {ex.equipment.slice(0, 1).map((e) => (
                  <Badge key={e} variant="default">
                    {humanize(e)}
                  </Badge>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
          <span>{data.total} exercises · page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
            <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
          </div>
        </div>
      )}

      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)} wide>
          <ExerciseDetail ex={detail} />
          {detail.can_edit && !memberView && (
            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-4">
              <Button variant="outline" size="sm" onClick={() => toggleArchive(detail)}>
                {detail.status === "active" ? <><Archive /> Archive</> : <><RotateCcw /> Restore</>}
              </Button>
              <Button size="sm" onClick={() => { setEditing(detail); setDetail(null); }}><Pencil /> Edit</Button>
            </div>
          )}
        </Modal>
      )}

      {editing && meta && (
        <ExerciseForm meta={meta} initial={editing === "new" ? null : editing} onClose={() => setEditing(null)}
          onSaved={(ex, created) => { setEditing(null); setFlash(`${ex.name} ${created ? "created" : "updated"}.`); load(); }} />
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, labels }: { label: string; value: string; onChange: (v: string) => void; options?: string[]; labels?: Record<string, string> }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
      <option value="">All {label.toLowerCase()}</option>
      {(options || []).map((o) => <option key={o} value={o}>{labels?.[o] || humanize(o)}</option>)}
    </select>
  );
}

export function ExerciseDetail({ ex }: { ex: ApiExercise }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-3">
        <ExerciseMedia type={ex.media_type} url={ex.media_url} name={ex.name} />
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={ex.scope === "gym" ? "lime" : "outline"}>{ex.scope === "gym" ? "Gym exercise" : "REPSI library"}</Badge>
          <Badge variant="outline">{humanize(ex.category)}</Badge>
          <Badge variant="outline">{humanize(ex.difficulty)}</Badge>
          <Badge variant="outline">{humanize(ex.exercise_type)}</Badge>
          {ex.movement_pattern && <Badge variant="outline">{humanize(ex.movement_pattern)}</Badge>}
        </div>
        {ex.description && <p className="text-sm text-[var(--text-secondary)]">{ex.description}</p>}
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-[var(--text-muted)]">Primary</dt><dd>{ex.primary_muscles.map(humanize).join(", ") || "—"}</dd>
          <dt className="text-[var(--text-muted)]">Secondary</dt><dd>{ex.secondary_muscles.map(humanize).join(", ") || "—"}</dd>
          <dt className="text-[var(--text-muted)]">Equipment</dt><dd>{ex.equipment.map(humanize).join(", ") || "—"}</dd>
          <dt className="text-[var(--text-muted)]">Tracked as</dt><dd>{TRACKING.find((t) => t.value === ex.tracking_type)?.label}</dd>
        </dl>
      </div>
      <div className="space-y-4 text-sm">
        <section>
          <h4 className="font-semibold text-[var(--text)] mb-1.5">How to perform</h4>
          {ex.instructions.length ? (
            <ol className="list-decimal pl-5 space-y-1 text-[var(--text-secondary)]">{ex.instructions.map((s, i) => <li key={i}>{s}</li>)}</ol>
          ) : <p className="text-[var(--text-muted)]">No instructions added.</p>}
        </section>
        {ex.breathing && <section><h4 className="font-semibold text-[var(--text)] mb-1">Breathing</h4><p className="text-[var(--text-secondary)]">{ex.breathing}</p></section>}
        {ex.safety_tips.length > 0 && (
          <section><h4 className="font-semibold text-[var(--text)] mb-1">Safety tips</h4>
            <ul className="list-disc pl-5 space-y-1 text-[var(--text-secondary)]">{ex.safety_tips.map((s, i) => <li key={i}>{s}</li>)}</ul></section>
        )}
        {ex.common_mistakes.length > 0 && (
          <section><h4 className="font-semibold text-[var(--text)] mb-1">Common mistakes</h4>
            <ul className="list-disc pl-5 space-y-1 text-[var(--text-secondary)]">{ex.common_mistakes.map((s, i) => <li key={i}>{s}</li>)}</ul></section>
        )}
      </div>
    </div>
  );
}

const lines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

function ExerciseForm({ meta, initial, onClose, onSaved }: { meta: ApiFitnessMeta; initial: ApiExercise | null; onClose: () => void; onSaved: (ex: ApiExercise, created: boolean) => void }) {
  const [f, setF] = useState({
    name: initial?.name || "", description: initial?.description || "", category: initial?.category || meta.categories[0],
    movement_pattern: initial?.movement_pattern || "", primary_muscles: initial?.primary_muscles || [], secondary_muscles: initial?.secondary_muscles || [],
    equipment: initial?.equipment || [], difficulty: initial?.difficulty || "beginner", exercise_type: initial?.exercise_type || "strength",
    tracking_type: initial?.tracking_type || ("weight_reps" as FitTracking), instructions: (initial?.instructions || []).join("\n"),
    breathing: initial?.breathing || "", safety_tips: (initial?.safety_tips || []).join("\n"), common_mistakes: (initial?.common_mistakes || []).join("\n"),
    media_type: initial?.media_type || "", media_url: initial?.media_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const up = (k: keyof typeof f, v: unknown) => setF((s) => ({ ...s, [k]: v }));
  const toggle = (k: "primary_muscles" | "secondary_muscles" | "equipment", v: string) =>
    up(k, f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return setError("Exercise name is required.");
    if (!f.primary_muscles.length) return setError("Select at least one primary muscle group.");
    if (!!f.media_type !== !!f.media_url.trim()) return setError("Provide both a media type and a media URL, or neither.");
    if (f.media_url && !f.media_url.startsWith("https://")) return setError("Media must be an https:// URL.");
    const payload: ApiExerciseInput = {
      name: f.name.trim(), description: f.description.trim() || null, category: f.category, movement_pattern: f.movement_pattern || null,
      primary_muscles: f.primary_muscles, secondary_muscles: f.secondary_muscles.filter((m) => !f.primary_muscles.includes(m)),
      equipment: f.equipment, difficulty: f.difficulty as ApiExerciseInput["difficulty"], exercise_type: f.exercise_type,
      tracking_type: f.tracking_type, instructions: lines(f.instructions), breathing: f.breathing.trim() || null,
      safety_tips: lines(f.safety_tips), common_mistakes: lines(f.common_mistakes),
      media_type: (f.media_type || null) as ApiExerciseInput["media_type"], media_url: f.media_url.trim() || null,
    };
    setSaving(true);
    setError(null);
    try {
      const saved = initial ? await fitnessApi.updateExercise(initial.id, payload) : await fitnessApi.createExercise(payload);
      onSaved(saved, !initial);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const chips = (k: "primary_muscles" | "secondary_muscles" | "equipment", options: string[]) => (
    <div className="flex flex-wrap gap-1.5" role="group">
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={f[k].includes(o)} onClick={() => toggle(k, o)}
          className={`rounded-full border px-2.5 py-1 text-xs ${f[k].includes(o) ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}>
          {humanize(o)}
        </button>
      ))}
    </div>
  );

  return (
    <Modal title={initial ? `Edit ${initial.name}` : "New gym exercise"} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Notice kind="error">{error}</Notice>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name *" htmlFor="ex-name"><input id="ex-name" required maxLength={150} value={f.name} onChange={(e) => up("name", e.target.value)} className={inputClass} /></Field>
          <Field label="Category *" htmlFor="ex-cat">
            <select id="ex-cat" value={f.category} onChange={(e) => up("category", e.target.value)} className={inputClass}>
              {meta.categories.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}
            </select>
          </Field>
          <Field label="Difficulty" htmlFor="ex-diff">
            <select id="ex-diff" value={f.difficulty} onChange={(e) => up("difficulty", e.target.value)} className={inputClass}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{humanize(d)}</option>)}
            </select>
          </Field>
          <Field label="Exercise type" htmlFor="ex-type">
            <select id="ex-type" value={f.exercise_type} onChange={(e) => up("exercise_type", e.target.value)} className={inputClass}>
              {TYPES.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
            </select>
          </Field>
          <Field label="Movement pattern" htmlFor="ex-pattern">
            <select id="ex-pattern" value={f.movement_pattern} onChange={(e) => up("movement_pattern", e.target.value)} className={inputClass}>
              <option value="">Not set</option>
              {meta.movement_patterns.map((m) => <option key={m} value={m}>{humanize(m)}</option>)}
            </select>
          </Field>
          <Field label="Tracking" htmlFor="ex-track" hint="What members log for each set.">
            <select id="ex-track" value={f.tracking_type} onChange={(e) => up("tracking_type", e.target.value)} className={inputClass}>
              {TRACKING.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Description" htmlFor="ex-desc"><textarea id="ex-desc" rows={2} value={f.description} onChange={(e) => up("description", e.target.value)} className={inputClass} /></Field>
        <Field label="Primary muscles *">{chips("primary_muscles", meta.muscles)}</Field>
        <Field label="Secondary muscles">{chips("secondary_muscles", meta.muscles)}</Field>
        <Field label="Equipment">{chips("equipment", meta.equipment)}</Field>
        <Field label="Instructions" htmlFor="ex-steps" hint="One step per line; shown as a numbered list.">
          <textarea id="ex-steps" rows={4} value={f.instructions} onChange={(e) => up("instructions", e.target.value)} className={inputClass} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Safety tips" htmlFor="ex-safety" hint="One per line."><textarea id="ex-safety" rows={3} value={f.safety_tips} onChange={(e) => up("safety_tips", e.target.value)} className={inputClass} /></Field>
          <Field label="Common mistakes" htmlFor="ex-mistakes" hint="One per line."><textarea id="ex-mistakes" rows={3} value={f.common_mistakes} onChange={(e) => up("common_mistakes", e.target.value)} className={inputClass} /></Field>
        </div>
        <Field label="Breathing guidance" htmlFor="ex-breath"><input id="ex-breath" value={f.breathing} onChange={(e) => up("breathing", e.target.value)} className={inputClass} /></Field>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
          <div>
            <p className="text-xs font-bold text-[var(--text)]">Exercise Demonstration Media</p>
            <p className="text-[11px] text-[var(--text-muted)]">Attach an open-source looping GIF or your custom video.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
            Pick from GIF Library
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <Field label="Media type" htmlFor="ex-mt">
            <select id="ex-mt" value={f.media_type} onChange={(e) => up("media_type", e.target.value)} className={inputClass}>
              <option value="">None</option><option value="image">Image</option><option value="gif">GIF</option><option value="video">Video file</option><option value="youtube">YouTube</option>
            </select>
          </Field>
          <Field label="Media URL" htmlFor="ex-mu" hint="https link to media your gym hosts or a YouTube video. Images: .jpg/.png/.webp; video: .mp4/.webm.">
            <input id="ex-mu" type="url" inputMode="url" value={f.media_url} onChange={(e) => up("media_url", e.target.value)} placeholder="https://" className={inputClass} />
          </Field>
        </div>
        {f.media_type && f.media_url.startsWith("https://") && (
          <ExerciseMedia
            type={f.media_type}
            url={f.media_url}
            name={f.name || "Preview"}
            className="max-w-sm"
            onSelectMedia={() => setShowPicker(true)}
          />
        )}
        <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" disabled={saving}>{saving && <Loader2 className="animate-spin" />} {initial ? "Save changes" : "Create exercise"}</Button>
        </div>
      </form>
      {showPicker && (
        <DemonstrationPickerModal
          currentName={f.name}
          onSelect={(demo) => {
            up("media_type", "gif");
            up("media_url", demo.gifUrl);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </Modal>
  );
}
