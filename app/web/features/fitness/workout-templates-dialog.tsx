"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronRight, Dumbbell, Flame, Layers, Loader2, Sparkles, UserPlus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  fitnessApi,
  type ApiFitnessContext,
  type ApiProgram,
  type ApiWorkoutTemplate,
  type ApiWorkoutTemplateDay,
} from "@/lib/fitness-api";
import { humanize, Modal, Notice } from "./shared";

interface Props {
  ctx: ApiFitnessContext;
  onClose: () => void;
  onInstalled: () => void;
  onSelectForAssign: (program: ApiProgram) => void;
}

export function WorkoutTemplatesDialog({ ctx, onClose, onInstalled, onSelectForAssign }: Props) {
  const [templates, setTemplates] = useState<ApiWorkoutTemplate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [installingKey, setInstallingKey] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>("chest_hypertrophy_sculpt");
  const [activeDayIdx, setActiveDayIdx] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fitnessApi
      .listTemplates()
      .then((res) => {
        setTemplates(res);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const handleInstallAll = async () => {
    setSeeding(true);
    setError(null);
    try {
      await fitnessApi.seedTemplates();
      setSuccess("All default templates (Beginner, Intermediate, Chest Split) installed and published to your gym!");
      onInstalled();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSeeding(false);
    }
  };

  const handleInstallOne = async (t: ApiWorkoutTemplate, assignAfter = false) => {
    setInstallingKey(t.key);
    setError(null);
    try {
      const p = await fitnessApi.instantiateTemplate(t.key);
      setSuccess(`Installed '${t.name}' into your gym library.`);
      onInstalled();
      if (assignAfter) {
        onSelectForAssign(p);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setInstallingKey(null);
    }
  };

  return (
    <Modal title="Default Workout Templates" onClose={onClose}>
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {/* Banner */}
        <div className="rounded-xl border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary-soft)]/50 via-[var(--surface)] to-[var(--surface-elevated)] p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--primary)]" />
                <h3 className="font-bold text-sm text-[var(--text)]">Curated Starter Programs</h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Install ready-to-assign programs with pre-grouped supersets, rest periods, exercise demonstration media, and directional cues.
              </p>
            </div>
            {ctx.can_manage_programs && (
              <Button size="sm" onClick={handleInstallAll} disabled={seeding} className="shrink-0 gap-1.5">
                {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
                Install All 3 Templates
              </Button>
            )}
          </div>
        </div>

        {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
        {success && <Notice kind="success" onDismiss={() => setSuccess(null)}>{success}</Notice>}

        {loading ? (
          <div className="py-8 text-center text-xs text-[var(--text-muted)]">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[var(--primary)]" />
            Loading template catalog…
          </div>
        ) : (
          <div className="space-y-3">
            {templates?.map((t) => {
              const isExpanded = expandedKey === t.key;
              const dayIdx = activeDayIdx[t.key] ?? 0;
              const currentDay: ApiWorkoutTemplateDay | undefined = t.days[dayIdx];
              const isChest = t.key === "chest_hypertrophy_sculpt";

              return (
                <Card
                  key={t.key}
                  className={`overflow-hidden border transition-all ${
                    isExpanded ? "border-[var(--primary)]/40 ring-1 ring-[var(--primary)]/10" : "border-[var(--border)]"
                  }`}
                >
                  {/* Header Row */}
                  <div
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-[var(--surface-elevated)]/40"
                    onClick={() => setExpandedKey(isExpanded ? null : t.key)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isChest
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                              : t.difficulty === "beginner"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {t.badge || humanize(t.difficulty)}
                        </span>
                        <h4 className="font-semibold text-sm text-[var(--text)]">{t.name}</h4>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2">{t.description}</p>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] pt-0.5">
                        <span>{t.training_days} Training Days</span>
                        <span>•</span>
                        <span>{t.exercise_count} Total Exercises</span>
                        <span>•</span>
                        <span>{t.duration_weeks ? `${t.duration_weeks} Weeks` : "Flexible"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {ctx.can_assign && (
                        <Button
                          size="sm"
                          variant="default"
                          className="gap-1.5 h-8 text-xs"
                          disabled={installingKey === t.key}
                          onClick={() => handleInstallOne(t, true)}
                        >
                          {installingKey === t.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                          Assign to Member
                        </Button>
                      )}
                      {ctx.can_manage_programs && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          disabled={installingKey === t.key}
                          onClick={() => handleInstallOne(t, false)}
                        >
                          Install
                        </Button>
                      )}
                      <button
                        type="button"
                        aria-label="Expand template details"
                        className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]"
                        onClick={() => setExpandedKey(isExpanded ? null : t.key)}
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail (Days & Grouped Exercises) */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border)] bg-[var(--surface-elevated)]/25 p-4 space-y-3">
                      {/* Day Tabs */}
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {t.days.map((day, idx) => (
                          <button
                            key={day.name}
                            type="button"
                            onClick={() => setActiveDayIdx({ ...activeDayIdx, [t.key]: idx })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                              dayIdx === idx
                                ? "bg-[var(--primary)] text-white shadow-sm"
                                : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]"
                            }`}
                          >
                            {day.name.split("-")[0].trim()}
                          </button>
                        ))}
                      </div>

                      {/* Day Heading and Coach Notes */}
                      {currentDay && (
                        <div className="space-y-3">
                          <div className="rounded-lg bg-[var(--surface)] p-3 border border-[var(--border)]">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-xs text-[var(--text)]">{currentDay.name}</span>
                              <span className="text-[11px] text-[var(--text-muted)]">{currentDay.exercise_count} exercises</span>
                            </div>
                            {currentDay.notes && (
                              <p className="text-xs text-[var(--text-secondary)] mt-1.5 flex items-start gap-1.5 italic">
                                <span className="font-semibold not-italic text-[var(--primary)]">Coach Direction:</span>
                                {currentDay.notes}
                              </p>
                            )}
                          </div>

                          {/* Exercise List with Grouping */}
                          <div className="space-y-2">
                            {currentDay.exercises.map((ex, exIdx) => {
                              const isSuperset = ex.group_type === "superset" && ex.group_label;

                              return (
                                <div
                                  key={`${ex.name}-${exIdx}`}
                                  className={`rounded-lg p-3 text-xs border ${
                                    isSuperset
                                      ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20"
                                      : "border-[var(--border)] bg-[var(--surface)]"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-sm text-[var(--text)]">{ex.name}</span>
                                        {isSuperset && (
                                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                            <Zap className="h-3 w-3" /> SUPERSET {ex.group_label}
                                          </span>
                                        )}
                                        <span className="rounded bg-[var(--surface-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] uppercase">
                                          {ex.section}
                                        </span>
                                      </div>
                                      {ex.notes && (
                                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">{ex.notes}</p>
                                      )}
                                    </div>

                                    {/* Prescription Tag */}
                                    <div className="text-right shrink-0">
                                      <span className="font-semibold text-xs text-[var(--text)]">
                                        {ex.sets ? `${ex.sets} sets` : ""}
                                        {ex.reps_min ? ` × ${ex.reps_min}${ex.reps_max && ex.reps_max !== ex.reps_min ? `-${ex.reps_max}` : ""} reps` : ""}
                                        {ex.duration_seconds ? ` × ${ex.duration_seconds}s` : ""}
                                      </span>
                                      <p className="text-[10px] text-[var(--text-muted)]">
                                        {ex.rest_seconds === 0 ? "No rest (Superset)" : ex.rest_seconds ? `${ex.rest_seconds}s rest` : ""}
                                        {ex.target_weight_kg ? ` · ${ex.target_weight_kg}kg` : ""}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
