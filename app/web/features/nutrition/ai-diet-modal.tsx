"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Utensils, Flame, Dumbbell, ShieldCheck, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal, Notice, Field, inputClass } from "@/features/fitness/shared";
import { aiApi } from "@/lib/ai-api";
import { repsiApi } from "@/lib/api";

interface AiDietModalProps {
  memberId?: string;
  workoutTitle?: string;
  onClose: () => void;
  onAssigned: () => void;
}

export function AiDietModal({ memberId, workoutTitle, onClose, onAssigned }: AiDietModalProps) {
  const [goal, setGoal] = useState("muscle_gain");
  const [dietType, setDietType] = useState("non_veg");
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [weightKg, setWeightKg] = useState(70);
  const [workoutFocus, setWorkoutFocus] = useState(workoutTitle || "Chest Hypertrophy & Upper Body");
  const [allergies, setAllergies] = useState("");
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
        weight_kg: Number(weightKg) || 70,
        workout_context: workoutFocus || workoutTitle || "General Training",
        notes: allergies.trim() || undefined,
      };
      const res = await aiApi.suggestDiet(answers, useAi);
      if (res.plan) {
        setSuggestedPlan(res.plan);
      } else {
        setError(res.safety_message || "Could not generate a nutrition plan. Try adjusting your preferences.");
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
        name: suggestedPlan.name || `${goal.replace("_", " ").toUpperCase()} Plan`,
        description: suggestedPlan.description || `AI Nutrition Plan supporting ${workoutFocus}`,
        goal: goal,
        diet_type: dietType,
        daily_calories: suggestedPlan.daily_calories,
        protein_grams: suggestedPlan.protein_grams,
        carbs_grams: suggestedPlan.carbs_grams,
        fat_grams: suggestedPlan.fat_grams,
        meals: suggestedPlan.meals || [],
      };

      const saved = await repsiApi.saveDietPlan(planToSave as any);
      if (memberId) {
        await repsiApi.assignDietPlan(memberId, saved.id);
      }
      onAssigned();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save/assign diet plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={workoutTitle ? `AI Diet Plan · For ${workoutTitle}` : "AI Nutrition & Meal Planner"}
      onClose={onClose}
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {workoutTitle ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300 text-xs">
            <Dumbbell className="w-4 h-4 flex-shrink-0" />
            <span>
              Tailoring meal targets and macros to support: <strong>{workoutTitle}</strong>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Configure your exact dietary choices, calorie goals, body weight, and workout target for an optimal meal schedule.
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
                  <option value="muscle_gain">Muscle Gain & Hypertrophy Surplus</option>
                  <option value="fat_loss">Fat Loss & Caloric Deficit</option>
                  <option value="strength">Strength & Athletic Power</option>
                  <option value="endurance">Endurance & Conditioning</option>
                  <option value="general_fitness">Healthy Maintenance & Wellness</option>
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
                  <option value="vegetarian">Vegetarian (Paneer, Pulses, Dairy)</option>
                  <option value="eggetarian">Eggetarian (Vegetarian + Eggs)</option>
                  <option value="vegan">100% Plant-Based / Vegan</option>
                  <option value="keto">High-Protein Keto / Low Carb</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Body Weight (kg)" htmlFor="ai-diet-weight">
                <input
                  id="ai-diet-weight"
                  type="number"
                  min={30}
                  max={200}
                  className={inputClass}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value) || 70)}
                  placeholder="70"
                />
              </Field>

              <Field label="Daily Meal Frequency" htmlFor="ai-diet-meals">
                <select
                  id="ai-diet-meals"
                  className={inputClass}
                  value={mealsPerDay}
                  onChange={(e) => setMealsPerDay(Number(e.target.value))}
                >
                  <option value={3}>3 Meals / day (Standard)</option>
                  <option value={4}>4 Meals / day (Recommended)</option>
                  <option value={5}>5 Meals / day (High Intake / Bodybuilding)</option>
                </select>
              </Field>

              <Field label="Training / Muscle Target" htmlFor="ai-diet-focus">
                <select
                  id="ai-diet-focus"
                  className={inputClass}
                  value={workoutFocus}
                  onChange={(e) => setWorkoutFocus(e.target.value)}
                >
                  <option value="Chest Hypertrophy & Upper Body">Chest & Upper Body Focus</option>
                  <option value="Upper / Lower Split">Upper / Lower Split</option>
                  <option value="Push / Pull / Legs">Push / Pull / Legs</option>
                  <option value="Full Body Athletic">Full Body Athletic</option>
                  <option value="Legs & Glutes Focus">Legs & Glutes Focus</option>
                </select>
              </Field>
            </div>

            <Field label="Food Exclusions & Allergies (Optional)" htmlFor="ai-diet-allergies">
              <input
                id="ai-diet-allergies"
                type="text"
                className={inputClass}
                placeholder="e.g. Lactose intolerant, no peanuts, avoid shellfish"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
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
                    AI Deep Macro Personalization
                  </span>
                  <p className="text-[10px] text-[var(--text-muted)]">Balances protein/carb ratios based on weight ({weightKg}kg) and target focus</p>
                </div>
              </label>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full h-10 gap-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Tailored Nutrition Plan...</span>
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
                  AI Tailored
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{suggestedPlan.description}</p>

              {/* Macro Grid */}
              <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                <div className="p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--text-muted)]">Daily Calories</p>
                  <p className="text-sm font-extrabold text-[var(--text)]">{suggestedPlan.daily_calories || 2200} kcal</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--text-muted)]">Target Protein</p>
                  <p className="text-sm font-extrabold text-blue-600">{suggestedPlan.protein_grams || 150}g</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--text-muted)]">Target Carbs</p>
                  <p className="text-sm font-extrabold text-amber-600">{suggestedPlan.carbs_grams || 220}g</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--text-muted)]">Target Fats</p>
                  <p className="text-sm font-extrabold text-emerald-600">{suggestedPlan.fat_grams || 65}g</p>
                </div>
              </div>
            </div>

            {/* Meals Preview */}
            {suggestedPlan.meals && suggestedPlan.meals.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                  Recommended Daily Meal Schedule ({suggestedPlan.meals.length} meals)
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl p-3 bg-[var(--surface)]">
                  {suggestedPlan.meals.map((m: any, idx: number) => (
                    <div key={idx} className="pt-2 first:pt-0 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                          {m.name || `Meal ${idx + 1}`}
                        </span>
                        {m.target_calories && <span className="text-[11px] font-mono text-[var(--text-muted)]">{m.target_calories} kcal</span>}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] pl-3">
                        {Array.isArray(m.items)
                          ? m.items.map((it: any) => typeof it === "string" ? it : it.name).join(", ")
                          : m.description || "Nutrient-dense clean meal"}
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
                Modify Choices
              </Button>

              <Button
                size="sm"
                onClick={handleSaveAndAssign}
                disabled={saving}
                className="w-2/3 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    <span>Saving Plan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>{memberId ? "Save & Assign to Member" : "Save to Diet Plans"}</span>
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
