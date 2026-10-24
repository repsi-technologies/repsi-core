"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { repsiApi, type ApiDietMeal, type ApiDietPlan, type ApiDietPlanSave, type ApiDietVersion } from "@/lib/api";
import { EmptyBlock, Field, humanize, inputClass, LoadingRow, Modal, Notice, StatusBadge } from "@/features/fitness/shared";

const SLOTS = ["breakfast", "mid_morning", "lunch", "evening_snack", "dinner", "post_workout"];
const DIET_TYPES = ["vegetarian", "eggetarian", "vegan", "non_vegetarian"];

export function DietVersionView({ version }: { version: ApiDietVersion }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-muted)]">
        Planned {version.totals.calories} kcal · {version.totals.protein} g protein
        {version.calories_target ? ` · target ${version.calories_target} kcal` : ""}
        {version.water_ml_target ? ` · water ${version.water_ml_target} ml` : ""}
      </p>
      {version.meals.map((m, i) => (
        <div key={i}>
          <p className="text-sm font-medium text-[var(--text)]">{humanize(m.slot)}{m.time ? ` · ${m.time}` : ""}</p>
          <ul className="ml-4 list-disc text-sm text-[var(--text-secondary)]">
            {m.items.map((it, j) => (
              <li key={j}>{it.food}{it.portion ? ` — ${it.portion}` : ""}{it.calories != null ? ` (${it.calories} kcal)` : ""}</li>
            ))}
          </ul>
        </div>
      ))}
      {version.notes && <p className="text-sm text-[var(--text-secondary)]">{version.notes}</p>}
    </div>
  );
}

const num = (v: string) => (v.trim() === "" ? null : Number(v));

function PlanEditor({ plan, onClose, onSaved }: { plan: ApiDietPlan | null; onClose: () => void; onSaved: (p: ApiDietPlan) => void }) {
  const v = plan?.current_version;
  const [name, setName] = useState(plan?.name ?? "");
  const [goal, setGoal] = useState(plan?.goal ?? "");
  const [dietType, setDietType] = useState(plan?.diet_type ?? "");
  const [kcal, setKcal] = useState(v?.calories_target?.toString() ?? "");
  const [protein, setProtein] = useState(v?.protein_target?.toString() ?? "");
  const [water, setWater] = useState(v?.water_ml_target?.toString() ?? "");
  const [notes, setNotes] = useState(v?.notes ?? "");
  const [summary, setSummary] = useState("");
  const [meals, setMeals] = useState<ApiDietMeal[]>(v?.meals ?? [{ slot: "breakfast", items: [{ food: "" }] }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setMeal = (i: number, patch: Partial<ApiDietMeal>) => setMeals((ms) => ms.map((m, k) => (k === i ? { ...m, ...patch } : m)));
  const setItem = (i: number, j: number, patch: Record<string, unknown>) =>
    setMeal(i, { items: meals[i].items.map((it, k) => (k === j ? { ...it, ...patch } : it)) });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const cleaned = meals.map((m) => ({ ...m, items: m.items.filter((it) => it.food.trim()) })).filter((m) => m.items.length);
    if (!cleaned.length) {
      setError("Add at least one food.");
      setSaving(false);
      return;
    }
    const body: ApiDietPlanSave = {
      name, goal: goal || null, diet_type: dietType || null, meals: cleaned, calories_target: num(kcal),
      protein_target: num(protein), water_ml_target: num(water), notes: notes || null, change_summary: summary || null,
    };
    try {
      onSaved(await repsiApi.saveDietPlan(body, plan?.id));
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <Modal title={plan ? `Revise ${plan.name}` : "New diet plan"} onClose={onClose} wide>
      <form onSubmit={save} className="space-y-4">
        {error && <Notice kind="error">{error}</Notice>}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Name" htmlFor="dp-name"><input id="dp-name" required maxLength={150} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Goal" htmlFor="dp-goal"><input id="dp-goal" maxLength={100} className={inputClass} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Fat loss, muscle gain…" /></Field>
          <Field label="Diet type" htmlFor="dp-type">
            <select id="dp-type" className={inputClass} value={dietType} onChange={(e) => setDietType(e.target.value)}>
              <option value="">Not specified</option>
              {DIET_TYPES.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
            </select>
          </Field>
          <Field label="Calories target (kcal)" htmlFor="dp-kcal"><input id="dp-kcal" type="number" min={0} inputMode="numeric" className={inputClass} value={kcal} onChange={(e) => setKcal(e.target.value)} /></Field>
          <Field label="Protein target (g)" htmlFor="dp-protein"><input id="dp-protein" type="number" min={0} inputMode="numeric" className={inputClass} value={protein} onChange={(e) => setProtein(e.target.value)} /></Field>
          <Field label="Water target (ml)" htmlFor="dp-water"><input id="dp-water" type="number" min={0} inputMode="numeric" className={inputClass} value={water} onChange={(e) => setWater(e.target.value)} /></Field>
        </div>

        {meals.map((m, i) => (
          <fieldset key={i} className="space-y-2 rounded-[10px] border border-[var(--border)] p-3">
            <legend className="sr-only">Meal {i + 1}</legend>
            <div className="flex flex-wrap items-end gap-2">
              <Field label="Meal" htmlFor={`slot-${i}`}>
                <select id={`slot-${i}`} className={inputClass} value={m.slot} onChange={(e) => setMeal(i, { slot: e.target.value })}>
                  {SLOTS.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
                </select>
              </Field>
              <Field label="Time" htmlFor={`time-${i}`}><input id={`time-${i}`} type="time" className={inputClass} value={m.time ?? ""} onChange={(e) => setMeal(i, { time: e.target.value || null })} /></Field>
              <Button type="button" variant="ghost" size="sm" aria-label="Remove meal" onClick={() => setMeals((ms) => ms.filter((_, k) => k !== i))}><Trash2 /></Button>
            </div>
            {m.items.map((it, j) => (
              <div key={j} className="grid grid-cols-2 gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                <input aria-label="Food" placeholder="Food (e.g. Idli)" className={`${inputClass} col-span-2 sm:col-span-1`} value={it.food} onChange={(e) => setItem(i, j, { food: e.target.value })} />
                <input aria-label="Portion" placeholder="Portion" className={inputClass} value={it.portion ?? ""} onChange={(e) => setItem(i, j, { portion: e.target.value || null })} />
                <input aria-label="Calories" placeholder="kcal" type="number" min={0} className={inputClass} value={it.calories ?? ""} onChange={(e) => setItem(i, j, { calories: num(e.target.value) })} />
                <input aria-label="Protein grams" placeholder="Protein g" type="number" min={0} className={inputClass} value={it.protein ?? ""} onChange={(e) => setItem(i, j, { protein: num(e.target.value) })} />
                <Button type="button" variant="ghost" size="sm" aria-label="Remove food" onClick={() => setMeal(i, { items: m.items.filter((_, k) => k !== j) })}><Trash2 /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setMeal(i, { items: [...m.items, { food: "" }] })}><Plus /> Add food</Button>
          </fieldset>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setMeals((ms) => [...ms, { slot: "lunch", items: [{ food: "" }] }])}><Plus /> Add meal</Button>

        <Field label="Notes for the member" htmlFor="dp-notes"><textarea id="dp-notes" maxLength={2000} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        {plan && <Field label="What changed?" htmlFor="dp-summary" hint="Saved as a new version; members on older versions keep theirs."><input id="dp-summary" maxLength={255} className={inputClass} value={summary} onChange={(e) => setSummary(e.target.value)} /></Field>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : plan ? "Save new version" : "Create plan"}</Button>
        </div>
      </form>
    </Modal>
  );
}

/** Diet plan library for owners, managers and trainers with nutrition permissions. */
export function DietPlansPage() {
  const [plans, setPlans] = useState<ApiDietPlan[] | null>(null);
  const [selected, setSelected] = useState<ApiDietPlan | null>(null);
  const [editing, setEditing] = useState<ApiDietPlan | null | "new">(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    repsiApi.listDietPlans().then(setPlans).catch((err) => { setError(err.message); setPlans([]); });
  }, []);
  useEffect(load, [load]);

  const open = async (id: string) => {
    try { setSelected(await repsiApi.getDietPlan(id)); } catch (err) { setError((err as Error).message); }
  };

  const archive = async (p: ApiDietPlan) => {
    try {
      await repsiApi.setDietPlanStatus(p.id, "archived");
      setSelected(null);
      load();
    } catch (err) { setError((err as Error).message); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-[var(--text)]">Diet plans</h1>
        <Button size="sm" onClick={() => setEditing("new")}><Plus /> New diet plan</Button>
      </div>
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      {plans === null ? <LoadingRow label="Loading diet plans…" /> : plans.length === 0 ? (
        <EmptyBlock title="No diet plans yet">Create a plan with meals and portions, then assign it from a member&apos;s Nutrition tab.</EmptyBlock>
      ) : (
        <div className="grid gap-4 md:grid-cols-[320px_1fr]">
          <ul className="space-y-2">
            {plans.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => open(p.id)} aria-current={selected?.id === p.id}
                  className={`w-full rounded-[10px] border p-3 text-left ${selected?.id === p.id ? "border-[var(--primary)]" : "border-[var(--border)]"} bg-[var(--surface)]`}>
                  <span className="block font-medium text-[var(--text)]">{p.name}</span>
                  <span className="block text-xs text-[var(--text-muted)]">{[p.goal, p.diet_type && humanize(p.diet_type)].filter(Boolean).join(" · ") || "—"}</span>
                </button>
              </li>
            ))}
          </ul>
          {selected?.current_version ? (
            <Card className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-[var(--text)]">{selected.name}</h2>
                <StatusBadge status={selected.status} />
                <span className="text-xs text-[var(--text-muted)]">v{selected.current_version.version_number}</span>
                {selected.can_edit && (
                  <span className="ml-auto flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(selected)}>Revise</Button>
                    <Button size="sm" variant="outline" onClick={() => archive(selected)}>Archive</Button>
                  </span>
                )}
              </div>
              <DietVersionView version={selected.current_version} />
              {selected.versions && selected.versions.length > 1 && (
                <details className="text-sm text-[var(--text-secondary)]">
                  <summary className="cursor-pointer">Version history ({selected.versions.length})</summary>
                  <ul className="mt-2 space-y-1">
                    {selected.versions.map((ver) => (
                      <li key={ver.id}>v{ver.version_number} · {new Date(ver.created_at).toLocaleDateString()}{ver.change_summary ? ` — ${ver.change_summary}` : ""}</li>
                    ))}
                  </ul>
                </details>
              )}
            </Card>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">Select a plan to see its meals.</p>
          )}
        </div>
      )}
      {editing && (
        <PlanEditor
          plan={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(p) => { setEditing(null); setSelected(p); load(); }}
        />
      )}
    </div>
  );
}
