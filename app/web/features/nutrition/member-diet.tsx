"use client";

import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Check, Loader2, Salad, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/organization/form-fields";
import { DietVersionView } from "@/features/nutrition/diet-plans";
import { aiApi, SOURCE_LABEL, type WorkoutQuestion } from "@/lib/ai-api";
import { repsiApi, type ApiDietAssignment, type DietType } from "@/lib/api";
import { formatDate, useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type DietQuestion = WorkoutQuestion & { diet_of?: Record<string, string> };
type SuggestedPlan = {
  name: string; goal: string; diet_type: DietType; meals: { slot: string; time?: string; title?: string; items: { food: string; portion?: string; calories?: number; protein?: number; carbs?: number; fat?: number }[] }[];
  calories_target: number; protein_target: number; carbs_target: number; fat_target: number; water_ml_target: number; notes: string;
};

const DIET_TYPES: { id: DietType; label: string; allows: string[] }[] = [
  { id: "vegetarian", label: "Vegetarian", allows: ["vegan", "veg"] },
  { id: "eggetarian", label: "Egg + veg", allows: ["vegan", "veg", "egg"] },
  { id: "non_vegetarian", label: "Non-vegetarian", allows: ["vegan", "veg", "egg", "nonveg"] },
  { id: "vegan", label: "Vegan", allows: ["vegan"] },
];

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
        on ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--nav-active-text)]" : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
      )}
    >
      {on && <Check className="h-3.5 w-3.5" aria-hidden />}
      {children}
    </button>
  );
}

/**
 * Member diet: see the current plan, build one from the foods you have (veg / egg / non-veg / vegan),
 * then either follow it yourself or send your preferences to your trainer to make one.
 */
export function MemberDiet() {
  const { t, language } = useTranslation();
  const [assignments, setAssignments] = useState<ApiDietAssignment[] | null>(null);
  const [questions, setQuestions] = useState<DietQuestion[]>([]);
  const [dietType, setDietType] = useState<DietType>("vegetarian");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [goal, setGoal] = useState("general_fitness");
  const [weight, setWeight] = useState("");
  const [meals, setMeals] = useState(4);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<{ plan: SuggestedPlan | null; safety_message: string | null; source: keyof typeof SOURCE_LABEL; notice?: string | null } | null>(null);
  const [busy, setBusy] = useState<null | "rules" | "ai" | "save" | "ask">(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const loadAssignments = () => repsiApi.getDietAssignments().then(setAssignments).catch(() => setAssignments([]));

  useEffect(() => {
    loadAssignments();
    aiApi.dietQuestions().then((r) => setQuestions(r.questions as DietQuestion[])).catch((e: Error) => setError(e.message));
    repsiApi.getDietPreferences().then((p) => {
      if (!p) return;
      setDietType(p.diet_type);
      setIngredients(p.ingredients);
      if (p.goal) setGoal(p.goal);
      if (p.notes) setNotes(p.notes);
    }).catch(() => {});
  }, []);

  const goalQ = questions.find((q) => q.key === "goal");
  const ingredientQ = questions.find((q) => q.key === "ingredients");
  const allowed = DIET_TYPES.find((d) => d.id === dietType)!.allows;
  const visibleFoods = useMemo(
    () => (ingredientQ?.options ?? []).filter(([k]) => allowed.includes(ingredientQ?.diet_of?.[String(k)] ?? "vegan")),
    [ingredientQ, allowed],
  );
  // Keep ticked foods consistent with the diet choice (e.g. switching to vegetarian drops chicken).
  const effectiveIngredients = ingredients.filter((k) => visibleFoods.some(([v]) => v === k));
  const active = assignments?.find((a) => a.status === "active") ?? null;
  const weightOk = Number(weight) >= 25 && Number(weight) <= 250;

  const toggleFood = (k: string) => setIngredients((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));

  const suggest = async (useAi: boolean) => {
    setBusy(useAi ? "ai" : "rules");
    setError(null);
    setFlash(null);
    try {
      const r = await aiApi.suggestDiet(
        { goal, diet_type: dietType, weight_kg: Number(weight), meals_per_day: meals, ingredients: effectiveIngredients, notes: notes.trim() || undefined },
        useAi,
      );
      setResult(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const useThisPlan = async () => {
    if (!result?.plan) return;
    setBusy("save");
    setError(null);
    try {
      const p = result.plan;
      await repsiApi.chooseMyDietPlan({
        name: p.name, goal: p.goal, diet_type: p.diet_type, meals: p.meals, notes: p.notes,
        calories_target: p.calories_target, protein_target: p.protein_target, carbs_target: p.carbs_target, water_ml_target: p.water_ml_target,
      });
      await repsiApi.saveMyDietPreferences({ diet_type: dietType, goal, ingredients: effectiveIngredients, notes: notes.trim() || undefined, ask_trainer: false });
      setFlash(t("diet.now_following", "This is now your diet plan."));
      setResult(null);
      loadAssignments();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const askTrainer = async () => {
    setBusy("ask");
    setError(null);
    try {
      const r = await repsiApi.saveMyDietPreferences({ diet_type: dietType, goal, ingredients: effectiveIngredients, notes: notes.trim() || undefined, ask_trainer: true });
      setFlash(
        r.trainers_notified > 0
          ? t("diet.trainer_asked", "Sent to your trainer. They'll assign a plan that fits your foods.")
          : t("diet.no_trainer", "Saved your preferences. You don't have a trainer yet — the gym can assign one."),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 py-2">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[var(--text)]">
          <Salad className="h-6 w-6 text-[var(--primary)]" aria-hidden />
          {t("diet.title", "My diet")}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {t("diet.subtitle", "Follow your plan, build one from the foods you have, or ask your trainer.")}
        </p>
      </div>

      {error && <FormAlert kind="error">{error}</FormAlert>}
      {flash && <FormAlert kind="success">{flash}</FormAlert>}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 text-base font-semibold text-[var(--text)]">{t("diet.current", "Current plan")}</h2>
        {assignments === null ? (
          <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
        ) : active?.version ? (
          <>
            <p className="mb-3 text-sm text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text)]">{active.title}</span>
              {" · "}
              {active.notes === "Chosen by the member" ? t("diet.chosen_by_you", "chosen by you") : t("diet.from_trainer", "from your trainer")}
              {" · "}
              {t("diet.since", "since {date}", { date: formatDate(active.start_date, language) })}
            </p>
            <DietVersionView version={active.version} />
          </>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">{t("diet.none", "No diet plan yet. Build one below or ask your trainer.")}</p>
        )}
      </section>

      <section className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-base font-semibold text-[var(--text)]">{t("diet.build", "Build a plan from what you have")}</h2>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[var(--text)]">{t("diet.food_pref", "Food preference")}</legend>
          <div className="flex flex-wrap gap-2">
            {DIET_TYPES.map((d) => (
              <Chip key={d.id} on={dietType === d.id} onClick={() => setDietType(d.id)}>{t(`diet.type_${d.id}`, d.label)}</Chip>
            ))}
          </div>
        </fieldset>

        {ingredientQ && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[var(--text)]">{t("diet.ingredients", "Foods you have at home")}</legend>
            <div className="flex flex-wrap gap-2">
              {visibleFoods.map(([k, label]) => (
                <Chip key={String(k)} on={effectiveIngredients.includes(String(k))} onClick={() => toggleFood(String(k))}>
                  {t(`diet.food_${k}`, String(label))}
                </Chip>
              ))}
            </div>
            <p className="text-xs text-[var(--text-muted)]">{t("diet.ingredients_hint", "Pick a few — meals are built from these, with common foods filling any gaps.")}</p>
          </fieldset>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-[var(--text)]">{t("diet.goal", "Goal")}</span>
            <select value={goal} onChange={(e) => setGoal(e.target.value)} className="h-10 w-full rounded-[10px] border border-[var(--border)] bg-[var(--background)] px-3 text-[var(--text)]">
              {(goalQ?.options ?? []).map(([v, label]) => <option key={String(v)} value={String(v)}>{label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-[var(--text)]">{t("diet.weight", "Body weight (kg)")}</span>
            <input type="number" inputMode="decimal" min={25} max={250} value={weight} onChange={(e) => setWeight(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[var(--border)] bg-[var(--background)] px-3 text-[var(--text)]" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-[var(--text)]">{t("diet.meals", "Meals per day")}</span>
            <select value={meals} onChange={(e) => setMeals(Number(e.target.value))} className="h-10 w-full rounded-[10px] border border-[var(--border)] bg-[var(--background)] px-3 text-[var(--text)]">
              {[3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-[var(--text)]">{t("diet.avoid", "Allergies or foods to avoid (optional)")}</span>
          <input value={notes} maxLength={200} onChange={(e) => setNotes(e.target.value)}
            className="h-10 w-full rounded-[10px] border border-[var(--border)] bg-[var(--background)] px-3 text-[var(--text)]" />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => suggest(false)} disabled={!weightOk || !!busy}>
            {busy === "rules" && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("diet.suggest", "Suggest a plan")}
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={askTrainer} disabled={!!busy}>
            {busy === "ask" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t("diet.ask_trainer", "Ask my trainer for a plan")}
          </Button>
        </div>
        {!weightOk && <p className="text-xs text-[var(--text-muted)]">{t("diet.weight_needed", "Enter your weight to get a suggestion.")}</p>}
      </section>

      {result && (
        <section className="space-y-4 rounded-2xl border border-[var(--primary)]/30 bg-[var(--surface)] p-5" aria-live="polite">
          {result.safety_message ? (
            <FormAlert kind="info">{result.safety_message}</FormAlert>
          ) : result.plan && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-[var(--text)]">{result.plan.name}</h2>
                <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-muted)]">{SOURCE_LABEL[result.source]}</span>
              </div>
              {result.notice && <p className="text-xs text-[var(--text-muted)]">{result.notice}</p>}
              <DietVersionView
                version={{
                  id: "preview", version_number: 1, meals: result.plan.meals, created_at: "", change_summary: null, notes: result.plan.notes,
                  calories_target: result.plan.calories_target, protein_target: result.plan.protein_target, carbs_target: result.plan.carbs_target,
                  fat_target: result.plan.fat_target, water_ml_target: result.plan.water_ml_target,
                  totals: result.plan.meals.flatMap((m) => m.items).reduce(
                    (a, i) => ({ calories: a.calories + (i.calories ?? 0), protein: a.protein + (i.protein ?? 0), carbs: a.carbs + (i.carbs ?? 0), fat: a.fat + (i.fat ?? 0) }),
                    { calories: 0, protein: 0, carbs: 0, fat: 0 },
                  ),
                }}
              />
              <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                <Button onClick={useThisPlan} disabled={!!busy} className="gap-1.5">
                  {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {t("diet.use_plan", "Use this as my plan")}
                </Button>
                <Button variant="outline" onClick={() => suggest(true)} disabled={!!busy} className="gap-1.5">
                  {busy === "ai" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                  {t("diet.personalise", "Personalise with AI")}
                </Button>
                <Button variant="ghost" onClick={askTrainer} disabled={!!busy} className="gap-1.5">
                  <UserRound className="h-4 w-4" />
                  {t("diet.prefer_trainer", "I'd rather my trainer decides")}
                </Button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
