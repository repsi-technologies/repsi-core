"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { aiApi, SOURCE_LABEL, type WorkoutQuestion, type WorkoutSuggestion } from "@/lib/ai-api";
import { Field, LoadingRow, Notice, inputClass } from "@/features/fitness/shared";

type Answers = Record<string, string | number | string[]>;

function Choice({ q, value, onChange }: { q: WorkoutQuestion; value: Answers[string] | undefined; onChange: (v: Answers[string]) => void }) {
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
      {multi && <p className="text-[11px] text-[var(--text-muted)]">Pick any that apply, or none.</p>}
    </fieldset>
  );
}

export function WorkoutCoach() {
  const [questions, setQuestions] = useState<WorkoutQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Answers>({ limitations: [], health_flags: [] });
  const [result, setResult] = useState<WorkoutSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<false | "rules" | "ai">(false);

  useEffect(() => {
    aiApi.workoutQuestions().then((r) => setQuestions(r.questions)).catch((e: Error) => setError(e.message));
  }, []);

  const required = (questions || []).filter((q) => q.type === "choice").map((q) => q.key);
  const complete = required.every((k) => answers[k] !== undefined);

  const suggest = async (useAi: boolean) => {
    setBusy(useAi ? "ai" : "rules");
    setError(null);
    try {
      setResult(await aiApi.suggestWorkout(answers, useAi));
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
        <div className="rounded-xl bg-[var(--primary-soft)] p-2.5 text-[var(--primary)]"><Sparkles className="h-5 w-5" /></div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">AI Coach</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Answer a few questions and get a weekly routine built from your gym&apos;s exercise library.</p>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-5">
        {questions.map((q) =>
          q.type === "text" ? (
            <Field key={q.key} label={q.label} htmlFor={`coach-${q.key}`}>
              <input id={`coach-${q.key}`} className={inputClass} maxLength={200} value={(answers[q.key] as string) || ""}
                onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })} />
            </Field>
          ) : (
            <Choice key={q.key} q={q} value={answers[q.key]} onChange={(v) => setAnswers({ ...answers, [q.key]: v })} />
          ),
        )}
        {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => suggest(false)} disabled={!complete || !!busy}>{busy === "rules" ? "Building…" : "Suggest a routine"}</Button>
          {result?.plan && (
            <Button variant="outline" className="gap-1.5" onClick={() => suggest(true)} disabled={!!busy}>
              <Sparkles className="h-4 w-4" /> {busy === "ai" ? "Personalising…" : "Personalise with AI"}
            </Button>
          )}
        </div>
      </section>

      {result && (
        <section className="space-y-4" aria-live="polite">
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
                    <h3 className="text-sm font-semibold text-[var(--text)] mb-2">{d.name}</h3>
                    <ol className="space-y-1.5 text-sm">
                      {d.exercises.map((x, i) => (
                        <li key={`${x.exercise_id}-${i}`} className="flex justify-between gap-3">
                          <span className="text-[var(--text)]">{x.name}{x.note && <span className="block text-[11px] text-[var(--text-muted)]">{x.note}</span>}</span>
                          <span className="shrink-0 text-xs text-[var(--text-secondary)]">
                            {x.sets} × {x.reps}{x.rest_seconds ? ` · ${x.rest_seconds}s rest` : ""}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
              {result.plan.tips.length > 0 && (
                <ul className="list-disc pl-5 text-sm text-[var(--text-secondary)] space-y-1">
                  {result.plan.tips.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              )}
            </>
          )}
          <p className="text-xs text-[var(--text-muted)]">{result.disclaimer}</p>
        </section>
      )}
    </div>
  );
}
