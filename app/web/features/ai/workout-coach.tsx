"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Dumbbell, ListChecks, RotateCcw, ShieldAlert, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { aiApi, SOURCE_LABEL, type WorkoutPlan, type WorkoutQuestion, type WorkoutSuggestion } from "@/lib/ai-api";
import { Field, LoadingRow, Notice, inputClass } from "@/features/fitness/shared";
import { findDemonstrationByName } from "@/lib/exercise-demonstrations";
import { useTranslation } from "@/lib/i18n";

type Answers = Record<string, string | number | string[]>;
type PlanExercise = WorkoutPlan["days"][number]["exercises"][number];

/** Small looping demo for a suggested exercise, from the open-source catalog when the name matches. */
function ExerciseThumb({ name }: { name: string }) {
  const demo = findDemonstrationByName(name);
  const [failed, setFailed] = useState(false);
  if (!demo || failed) {
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-elevated)] text-[var(--text-muted)]">
        <Dumbbell className="h-4 w-4" aria-hidden />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={demo.thumbUrl || demo.gifUrl}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-12 w-12 shrink-0 rounded-lg bg-black/5 object-cover"
    />
  );
}

function ExerciseRow({ x }: { x: PlanExercise }) {
  const [open, setOpen] = useState(false);
  const demo = findDemonstrationByName(x.name);
  return (
    <li className="rounded-xl border border-[var(--border)] p-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={!demo}
        aria-expanded={open}
        className="flex w-full items-center gap-3 text-left disabled:cursor-default"
      >
        <ExerciseThumb name={x.name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-[var(--text)]">{x.name}</span>
          {x.note && <span className="block text-[11px] text-[var(--text-muted)]">{x.note}</span>}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-[var(--text-secondary)]">
          {x.sets} × {x.reps}{x.rest_seconds ? ` · ${x.rest_seconds}s` : ""}
        </span>
      </button>
      {open && demo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={demo.gifUrl} alt={`${x.name} form demonstration`} className="mt-2 aspect-video w-full rounded-lg bg-white object-contain" />
      )}
    </li>
  );
}

function Choice({ q, value, onChange }: { q: WorkoutQuestion; value: Answers[string] | undefined; onChange: (v: Answers[string]) => void }) {
  const { t } = useTranslation();
  const multi = q.type === "multi";
  const selected = multi ? ((value as string[]) || []) : value;
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-[var(--text)]">{q.label}</legend>
      <div className="flex flex-wrap gap-2">
        {(q.options || []).map(([v, label]) => {
          const on = multi ? (selected as string[]).includes(String(v)) : selected === v;
          return (
            <button
              key={String(v)}
              type="button"
              aria-pressed={on}
              onClick={() => {
                if (!multi) return onChange(v);
                const cur = selected as string[];
                onChange(on ? cur.filter((x) => x !== v) : [...cur, String(v)]);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                on ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]" : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {multi && <p className="text-[11px] text-[var(--text-muted)]">{t("ai.pick_any_that_apply_or_none")}</p>}
    </fieldset>
  );
}

export function WorkoutCoach() {
  const { t } = useTranslation();
  const { workspace } = useParams<{ workspace: string }>();
  const resultRef = useRef<HTMLElement>(null);
  const [questions, setQuestions] = useState<WorkoutQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Answers>({ limitations: [], health_flags: [] });
  const [result, setResult] = useState<WorkoutSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<false | "rules" | "ai">(false);

  useEffect(() => {
    aiApi.workoutQuestions().then((r) => setQuestions(r.questions)).catch((e: Error) => setError(e.message));
  }, []);

  const required = (questions || []).filter((q) => q.type === "choice").map((q) => q.key);
  const answered = required.filter((k) => answers[k] !== undefined).length;
  const complete = answered === required.length;

  const suggest = async (useAi: boolean) => {
    setBusy(useAi ? "ai" : "rules");
    setError(null);
    try {
      setResult(await aiApi.suggestWorkout(answers, useAi));
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!questions) return error ? <Notice kind="error">{error}</Notice> : <LoadingRow />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[var(--primary-soft)] p-2.5 text-[var(--primary)]"><BrainCircuit className="h-5 w-5" /></div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">{t("navItem.ai_coach")}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t("ai.answer_a_few_questions_and_get")}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-5">
        {required.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>{t("ai.coach_progress", "{done} of {total} answered", { done: answered, total: required.length })}</span>
              {complete && <span className="font-medium text-[var(--primary)]">{t("ai.coach_ready", "Ready to build")}</span>}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-elevated)]" role="progressbar" aria-valuemin={0} aria-valuemax={required.length} aria-valuenow={answered}>
              <div className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300" style={{ width: `${(answered / required.length) * 100}%` }} />
            </div>
          </div>
        )}
        {questions.map((q) =>
          q.type === "text" ? (
            <Field key={q.key} label={q.label} htmlFor={`coach-${q.key}`}>
              <input id={`coach-${q.key}`} className={inputClass} maxLength={200} value={(answers[q.key] as string) || ""}
                onChange={(e) => { const v = e.target.value; setAnswers((cur) => ({ ...cur, [q.key]: v })); }} />
            </Field>
          ) : (
            <Choice key={q.key} q={q} value={answers[q.key]} onChange={(v) => setAnswers((cur) => ({ ...cur, [q.key]: v }))} />
          ),
        )}
        {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => suggest(false)} disabled={!complete || !!busy}>{busy === "rules" ? t("ai.building") : t("ai.suggest_a_routine")}</Button>
          {result?.plan && (
            <Button variant="outline" className="gap-1.5" onClick={() => suggest(true)} disabled={!!busy}>
              <BrainCircuit className="h-4 w-4" /> {busy === "ai" ? t("ai.personalising") : t("ai.personalise_with_ai")}
            </Button>
          )}
          {result && (
            <Button
              variant="ghost"
              className="gap-1.5"
              disabled={!!busy}
              onClick={() => { setResult(null); setAnswers({ limitations: [], health_flags: [] }); }}
            >
              <RotateCcw className="h-4 w-4" /> {t("ai.start_over", "Start over")}
            </Button>
          )}
        </div>
      </section>

      {result && (
        <section ref={resultRef} className="space-y-4 scroll-mt-4" aria-live="polite">
          {result.safety_message ? (
            <div role="alert" className="flex gap-3 rounded-2xl border border-[var(--warning)]/30 bg-[var(--warning-soft)] p-4 text-sm text-[var(--warning-foreground)]">
              <ShieldAlert className="h-5 w-5 shrink-0" /> {result.safety_message}
            </div>
          ) : result.plan && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-[var(--text)]">{result.plan.title}</h2>
                <Badge variant={result.source === "ai" || result.source === "cached" ? "lime" : "outline"}>{SOURCE_LABEL[result.source]}</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{result.plan.overview}</p>
              {result.notice && <p className="text-xs text-[var(--text-muted)]">{result.notice}</p>}
              <div className="grid gap-3 md:grid-cols-2">
                {result.plan.days.map((d) => (
                  <div key={d.name} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <h3 className="text-sm font-semibold text-[var(--text)]">{d.name}</h3>
                    {d.focus && <p className="mb-2 text-xs text-[var(--text-muted)]">{d.focus}</p>}
                    <ol className="space-y-1.5">
                      {d.exercises.map((x, i) => <ExerciseRow key={`${x.exercise_id}-${i}`} x={x} />)}
                    </ol>
                  </div>
                ))}
              </div>
              {result.plan.tips.length > 0 && (
                <ul className="list-disc pl-5 text-sm text-[var(--text-secondary)] space-y-1">
                  {result.plan.tips.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              )}
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-sm">
                <ListChecks className="h-5 w-5 shrink-0 text-[var(--primary)]" aria-hidden />
                <p className="min-w-0 flex-1 text-[var(--text-secondary)]">
                  {t("ai.coach_next_step", "Share this routine with your trainer to have it scheduled, then log each session from My workouts.")}
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/${workspace}/member/workout`}>{t("fitness.myWorkouts", "My workouts")}</Link>
                </Button>
              </div>
            </>
          )}
          <p className="text-xs text-[var(--text-muted)]">{result.disclaimer}</p>
        </section>
      )}
    </div>
  );
}
