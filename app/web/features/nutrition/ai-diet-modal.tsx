"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Utensils, Flame, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal, Notice, Field, inputClass } from "@/features/fitness/shared";
import { aiApi } from "@/lib/ai-api";
import { repsiApi } from "@/lib/api";

interface AiDietModalProps {
  memberId: string;
  workoutTitle?: string;
  onClose: () => void;
  onAssigned: () => void;
}

export function AiDietModal({ memberId, workoutTitle, onClose, onAssigned }: AiDietModalProps) {
  const [goal, setGoal] = useState("muscle_gain");
  const [dietType, setDietType] = useState("non_veg");
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [useAi, setUseAi] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedPlan, setSuggestedPlan] = useState<any | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const answers = {
        goal,
        diet_type: dietType,
        meals_per_day: mealsPerDay,
        workout_context: workoutTitle || "General Training",
      };
      const res = await aiApi.suggestDiet(answers, useAi);
      if (res.plan) {
        setSuggestedPlan(res.plan);
      } else {
        setError(res.safety_message || "Could not generate a nutrition plan. Try different preferences.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate AI diet plan");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAndAssign = async () => {
    if (!suggestedPlan) return;
    setSaving(true);
    setError(null);
    try {
      const planToSave = {
        name: suggestedPlan.name || `${goal.replace("_", " ")} Plan`,
        description: suggestedPlan.description || `AI Nutrition Plan for ${workoutTitle || "Client"}`,
        goal: goal,
        diet_type: dietType,
        daily_calories: suggestedPlan.daily_calories,
        protein_grams: suggestedPlan.protein_grams,
        carbs_grams: suggestedPlan.carbs_grams,
        fat_grams: suggestedPlan.fat_grams,
        meals: suggestedPlan.meals || [],
      };

      const saved = await repsiApi.saveDietPlan(planToSave as any);
      await repsiApi.assignDietPlan(memberId, saved.id);
      onAssigned();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to assign diet plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={workoutTitle ? `AI Diet Plan · For ${workoutTitle}` : "AI Diet Suggestion & Assignment"}
      onClose={onClose}
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {workoutTitle && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs">
            <Dumbbell className="w-4 h-4 flex-shrink-0" />
            <span>
              Tailoring meal targets and macros to support: <strong>{workoutTitle}</strong>
            </span>
          </div>
        )}

        {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}

        {!suggestedPlan ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nutrition Goal" htmlFor="ai-diet-goal">
                <select
                  id="ai-diet-goal"
                  className={inputClass}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                >
                  <option value="muscle_gain">Muscle Gain & Hypertrophy</option>
                  <option value="fat_loss">Fat Loss & Leaning</option>
                  <option value="strength">Strength & Power</option>
                  <option value="endurance">Endurance & Cardio</option>
                  <option value="general_fitness">General Health & Balance</option>
                </select>
              </Field>

              <Field label="Dietary Preference" htmlFor="ai-diet-type">
                <select
                  id="ai-diet-type"
                  className={inputClass}
                  value={dietType}
                  onChange={(e) => setDietType(e.target.value)}
                >
                  <option value="non_veg">Non-Vegetarian (Chicken, Fish, Eggs)</option>
                  <option value="vegetarian">Vegetarian (Dairy, Plant proteins)</option>
                  <option value="eggetarian">Eggetarian</option>
                  <option value="vegan">100% Plant-Based / Vegan</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Daily Meal Frequency" htmlFor="ai-diet-meals">
                <select
                  id="ai-diet-meals"
                  className={inputClass}
                  value={mealsPerDay}
                  onChange={(e) => setMealsPerDay(Number(e.target.value))}
                >
                  <option value={3}>3 Meals / day (Standard)</option>
                  <option value={4}>4 Meals / day (Recommended)</option>
                  <option value={5}>5 Meals / day (High Intake)</option>
                </select>
              </Field>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useAi}
                    onChange={(e) => setUseAi(e.target.checked)}
                    className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <div>
                    <span className="font-semibold text-[var(--text)] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Gemini Deep Personalization
                    </span>
                    <p className="text-[10px] text-[var(--text-muted)]">Balances macros tailored for workout recovery</p>
                  </div>
                </label>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full h-10 gap-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Nutrition Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Diet Plan</span>
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Suggested Plan Header */}
            <div className="p-4 rounded-xl border border-orange-500/30 bg-gradient-to-b from-orange-500/10 via-[var(--surface)] to-[var(--surface)] space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--text)]">{suggestedPlan.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-700 dark:text-orange-300">
                  AI Generated
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{suggestedPlan.description}</p>

              {/* Macro Grid */}
              <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                <div className="p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--text-muted)]">Calories</p>
                  <p className="text-sm font-extrabold text-[var(--text)]">{suggestedPlan.daily_calories || 2200} kcal</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--text-muted)]">Protein</p>
                  <p className="text-sm font-extrabold text-blue-600">{suggestedPlan.protein_grams || 150}g</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--text-muted)]">Carbs</p>
                  <p className="text-sm font-extrabold text-amber-600">{suggestedPlan.carbs_grams || 220}g</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--text-muted)]">Fats</p>
                  <p className="text-sm font-extrabold text-emerald-600">{suggestedPlan.fat_grams || 65}g</p>
                </div>
              </div>
            </div>

            {/* Meals Preview */}
            {suggestedPlan.meals && suggestedPlan.meals.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                  Suggested Meal Schedule
                </h4>
                <div className="space-y-2 max-h-52 overflow-y-auto divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl p-3 bg-[var(--surface)]">
                  {suggestedPlan.meals.map((m: any, idx: number) => (
                    <div key={idx} className="pt-2 first:pt-0 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
                        <span>{m.name || `Meal ${idx + 1}`}</span>
                        {m.target_calories && <span className="text-[11px] text-[var(--text-muted)]">{m.target_calories} kcal</span>}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {Array.isArray(m.items)
                          ? m.items.map((it: any) => typeof it === "string" ? it : it.name).join(", ")
                          : m.description || "Balanced healthy food choices"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSuggestedPlan(null)}
                disabled={saving}
                className="w-1/3 text-xs"
              >
                Regenerate
              </Button>

              <Button
                size="sm"
                onClick={handleSaveAndAssign}
                disabled={saving}
                className="w-2/3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    <span>Assigning Plan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Save & Assign to Client</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
