"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft, Copy, Eye, Layers, Loader2, Plus, RotateCcw, Search, Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  fitnessApi, type ApiPlanDay, type ApiProgram, type ApiProgramDetail, type ApiProgramSave, type FitDifficulty,
} from "@/lib/fitness-api";
import { AssignDialog } from "./assign-dialog";
import { daysToInput, draftsFromDays, PlanEditor, validateDays, type DayDraft } from "./plan-editor";
import {
  EmptyBlock, Field, formatDay, humanize, inputClass, LoadingRow, Modal, Notice, prescription, StatusBadge, useFitnessContext, useFitnessMeta, WorkoutExerciseCard,
} from "./shared";

export function ProgramsList({ basePath }: { basePath: string }) {
  const { ctx } = useFitnessContext();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState<ApiProgram[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<ApiProgram | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fitnessApi.listPrograms({ search: search || undefined, status: status || undefined, page_size: 100 });
      setData(res.items);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const act = async (p: ApiProgram, action: "duplicate" | "archive" | "restore") => {
    if (action === "archive" && !window.confirm(`Archive “${p.name}”? Existing member plans keep working; it can't be assigned again until restored.`)) return;
    try {
      const res = await fitnessApi.programAction(p.id, action);
      if (action === "duplicate") return router.push(`${basePath}/programs/${res.id}`);
      setFlash(`${p.name} ${action === "archive" ? "archived" : "restored"}.`);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" aria-hidden />
          <input aria-label="Search programs" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search programs" className={`${inputClass} pl-9`} />
        </div>
        <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} sm:w-44`}>
          <option value="">Active programs</option><option value="published">Published</option><option value="draft">Drafts</option><option value="archived">Archived</option>
        </select>
        {ctx?.can_manage_programs && (
          <Link href={`${basePath}/programs/new`}><Button size="sm" className="w-full sm:w-auto"><Plus /> New program</Button></Link>
        )}
      </div>
      {flash && <Notice kind="success" onDismiss={() => setFlash(null)}>{flash}</Notice>}
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      {!data ? <LoadingRow label="Loading programs…" /> : data.length === 0 ? (
        <EmptyBlock title="No workout programs yet">
          {ctx?.can_manage_programs ? "Create a reusable program, publish it, then assign it to members." : "Programs published by your gym will appear here."}
        </EmptyBlock>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => (
            <Card key={p.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`${basePath}/programs/${p.id}`} className="font-semibold text-[var(--text)] hover:underline block truncate">{p.name}</Link>
                  <p className="text-xs text-[var(--text-muted)]">
                    {[humanize(p.objective), humanize(p.difficulty), p.duration_weeks ? `${p.duration_weeks} wk` : ""].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Training days" value={p.training_days} />
                <Stat label="Exercises" value={p.exercise_count} />
                <Stat label="Active plans" value={p.active_assignments} />
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                {p.current_version_number ? `v${p.current_version_number}` : "Never published"}{p.has_unpublished_changes ? " · unpublished changes" : ""}
                {p.created_by_name ? ` · by ${p.created_by_name}` : ""}
              </p>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link href={`${basePath}/programs/${p.id}`}><Button variant="outline" size="sm"><Eye /> {p.can_edit ? "Open" : "Preview"}</Button></Link>
                {ctx?.can_assign && p.status === "published" && <Button size="sm" onClick={() => setAssigning(p)}><UserPlus /> Assign</Button>}
                {ctx?.can_manage_programs && <Button variant="ghost" size="sm" onClick={() => act(p, "duplicate")}><Copy /> Duplicate</Button>}
                {p.can_edit && (p.status === "archived"
                  ? <Button variant="ghost" size="sm" onClick={() => act(p, "restore")}><RotateCcw /> Restore</Button>
                  : <Button variant="ghost" size="sm" onClick={() => act(p, "archive")}><Archive /> Archive</Button>)}
              </div>
            </Card>
          ))}
        </div>
      )}
      {assigning && ctx && (
        <AssignDialog ctx={ctx} programId={assigning.id} programName={assigning.name} onClose={() => setAssigning(null)} onDone={() => load()} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-[var(--surface-elevated)] py-2">
      <p className="text-base font-bold text-[var(--text)]">{value}</p>
      <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

export function PlanPreview({ days }: { days: ApiPlanDay[] }) {
  if (!days.length) return <EmptyBlock title="No days in this plan" />;
  return (
    <div className="space-y-4">
      {days.map((d, i) => (
        <div key={d.id} className="rounded-xl border border-[var(--border)] p-3.5 sm:p-4 bg-[var(--surface-elevated)]/40">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-[var(--text)]">Day {i + 1}: {d.name}</p>
              {d.notes && <p className="text-xs text-[var(--text-muted)] mt-0.5">{d.notes}</p>}
            </div>
            {d.is_rest_day && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)]">Rest day</span>}
          </div>
          {d.items.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic">No exercises scheduled for this day.</p>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {d.items.map((it, j) => (
                <WorkoutExerciseCard key={it.id} item={it} index={j} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const DIFFS: FitDifficulty[] = ["beginner", "intermediate", "advanced"];

export function ProgramEditor({ programId, basePath }: { programId: string; basePath: string }) {
  const isNew = programId === "new";
  const router = useRouter();
  const { ctx } = useFitnessContext();
  const meta = useFitnessMeta();
  const [program, setProgram] = useState<ApiProgramDetail | null>(null);
  const [form, setForm] = useState({ name: "", description: "", objective: "", difficulty: "beginner" as FitDifficulty, duration_weeks: "" as string, change_note: "" });
  const [days, setDays] = useState<DayDraft[]>([]);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [version, setVersion] = useState<{ number: number; days: ApiPlanDay[] } | null>(null);

  const hydrate = (p: ApiProgramDetail) => {
    setProgram(p);
    setForm({ name: p.name, description: p.description || "", objective: p.objective || "", difficulty: p.difficulty,
      duration_weeks: p.duration_weeks ? String(p.duration_weeks) : "", change_note: "" });
    setDays(draftsFromDays(p.days, false));
    setDirty(false);
  };

  useEffect(() => {
    if (isNew) {
      setDays([{ key: "d1", name: "Day 1", is_rest_day: false, notes: "", items: [] }]);
      return;
    }
    fitnessApi.getProgram(programId).then(hydrate).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
  }, [programId, isNew]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const canEdit = isNew ? !!ctx?.can_manage_programs : !!program?.can_edit && program.status !== "archived";

  const save = async (publish: boolean) => {
    if (form.name.trim().length < 2) return setError("Program name is required.");
    const problem = validateDays(days, publish);
    if (problem) return setError(problem);
    const payload: ApiProgramSave = {
      name: form.name.trim(), description: form.description.trim() || null, objective: form.objective || null,
      difficulty: form.difficulty, duration_weeks: form.duration_weeks ? Number(form.duration_weeks) : null,
      days: daysToInput(days), change_note: form.change_note.trim() || null, publish,
    };
    setSaving(true);
    setError(null);
    try {
      const saved = isNew ? await fitnessApi.createProgram(payload) : await fitnessApi.updateProgram(programId, payload);
      setDirty(false);
      if (isNew) return router.replace(`${basePath}/programs/${saved.id}`);
      hydrate(saved);
      setFlash(publish ? `Published version ${saved.current_version_number}. Members already on earlier versions keep their plans.` : "Draft saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const action = async (a: "publish" | "discard-draft") => {
    if (a === "discard-draft" && !window.confirm("Discard unpublished changes and go back to the published version?")) return;
    try {
      hydrate(await fitnessApi.programAction(programId, a));
      setFlash(a === "publish" ? "Published." : "Unpublished changes discarded.");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const viewVersion = async (versionId: string, number: number) => {
    try {
      const v = await fitnessApi.getProgramVersion(programId, versionId);
      setVersion({ number, days: v.days });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (loading) return <LoadingRow label="Loading program…" />;
  if (!isNew && !program) return <Notice kind="error">{error || "Program not found."}</Notice>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={basePath} className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"><ArrowLeft className="h-3.5 w-3.5" /> Workouts</Link>
          <h1 className="text-xl font-bold text-[var(--text)] mt-1">{isNew ? "New program" : program?.name}</h1>
          {program && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
              <StatusBadge status={program.status} />
              {program.current_version_number && <span>Published v{program.current_version_number}</span>}
              {program.has_unpublished_changes && <span className="text-[var(--warning-foreground)]">Editing draft v{program.editing_version_number}</span>}
              <span>{program.active_assignments} active member plans</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {program?.has_unpublished_changes && canEdit && <Button variant="ghost" size="sm" onClick={() => action("discard-draft")}>Discard draft</Button>}
          {ctx?.can_assign && program?.status === "published" && <Button variant="outline" size="sm" onClick={() => setAssigning(true)}><UserPlus /> Assign</Button>}
          {canEdit && (
            <>
              <Button variant="secondary" size="sm" disabled={saving} onClick={() => save(false)}>{saving && <Loader2 className="animate-spin" />} Save draft</Button>
              <Button size="sm" disabled={saving} onClick={() => save(true)}><Send /> Save & publish</Button>
            </>
          )}
        </div>
      </div>

      {flash && <Notice kind="success" onDismiss={() => setFlash(null)}>{flash}</Notice>}
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      {program && !canEdit && (
        <Notice kind="success">{program.status === "archived" ? "This program is archived. Restore it from the programs list to edit." : "Read-only preview. Only the creator or gym managers can edit this program."}</Notice>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5 min-w-0">
          <Card className="p-4 grid gap-3 sm:grid-cols-2">
            <Field label="Program name *" htmlFor="pg-name"><input id="pg-name" value={form.name} disabled={!canEdit} maxLength={150} onChange={(e) => { setForm({ ...form, name: e.target.value }); setDirty(true); }} className={inputClass} /></Field>
            <Field label="Objective" htmlFor="pg-obj">
              <select id="pg-obj" value={form.objective} disabled={!canEdit} onChange={(e) => { setForm({ ...form, objective: e.target.value }); setDirty(true); }} className={inputClass}>
                <option value="">Not set</option>{meta?.objectives.map((o) => <option key={o} value={o}>{humanize(o)}</option>)}
              </select>
            </Field>
            <Field label="Difficulty" htmlFor="pg-diff">
              <select id="pg-diff" value={form.difficulty} disabled={!canEdit} onChange={(e) => { setForm({ ...form, difficulty: e.target.value as FitDifficulty }); setDirty(true); }} className={inputClass}>
                {DIFFS.map((d) => <option key={d} value={d}>{humanize(d)}</option>)}
              </select>
            </Field>
            <Field label="Duration (weeks)" htmlFor="pg-weeks"><input id="pg-weeks" type="number" min={1} max={104} value={form.duration_weeks} disabled={!canEdit} onChange={(e) => { setForm({ ...form, duration_weeks: e.target.value }); setDirty(true); }} className={inputClass} /></Field>
            <div className="sm:col-span-2"><Field label="Description" htmlFor="pg-desc"><textarea id="pg-desc" rows={2} value={form.description} disabled={!canEdit} onChange={(e) => { setForm({ ...form, description: e.target.value }); setDirty(true); }} className={inputClass} /></Field></div>
            {!isNew && canEdit && <div className="sm:col-span-2"><Field label="Change note (saved with this version)" htmlFor="pg-note"><input id="pg-note" value={form.change_note} maxLength={500} onChange={(e) => setForm({ ...form, change_note: e.target.value })} className={inputClass} placeholder="e.g. Added a conditioning day" /></Field></div>}
          </Card>
          <section aria-label="Program days">
            <h2 className="text-sm font-bold text-[var(--text)] mb-2 flex items-center gap-2"><Layers className="h-4 w-4" /> Training days</h2>
            {canEdit ? <PlanEditor days={days} onChange={(d) => { setDays(d); setDirty(true); }} /> : <PlanPreview days={program?.days || []} />}
          </section>
        </div>
        {program && (
          <aside className="space-y-3">
            <Card className="p-4">
              <h2 className="text-sm font-bold text-[var(--text)] mb-1">Version history</h2>
              <p className="text-[11px] text-[var(--text-muted)] mb-3">Publishing creates a new version. Members keep the version they were assigned.</p>
              <ul className="space-y-2">
                {program.versions.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-semibold text-[var(--text)]">v{v.version_number} <span className="font-normal text-[var(--text-muted)]">· {v.status === "draft" ? "draft" : v.published_at ? formatDay(v.published_at.slice(0, 10), { day: "numeric", month: "short", year: "numeric" }) : ""}</span></p>
                      <p className="text-[var(--text-muted)]">{v.assignment_count} member plan{v.assignment_count === 1 ? "" : "s"}{v.change_note ? ` · ${v.change_note}` : ""}</p>
                    </div>
                    {v.status === "published" && <Button variant="ghost" size="sm" onClick={() => viewVersion(v.id, v.version_number)}>View</Button>}
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        )}
      </div>
      {version && <Modal title={`Version ${version.number}`} onClose={() => setVersion(null)} wide><PlanPreview days={version.days} /></Modal>}
      {assigning && ctx && program && (
        <AssignDialog ctx={ctx} programId={program.id} programName={program.name} onClose={() => setAssigning(false)}
          onDone={() => fitnessApi.getProgram(program.id).then(hydrate)} />
      )}
    </div>
  );
}

