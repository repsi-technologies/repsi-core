"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { repsiApi } from "@/lib/api";
import { AssessmentsPanel, MeasurementsPanel, ProgressView } from "./progress";
import { LoadingRow, Notice, useFitnessContext, useFitnessMeta } from "./shared";

type Tab = "progress" | "measurements" | "assessments";

interface TrainerInfo { trainer_id: string; name: string; specialization?: string | null; email?: string | null; phone?: string | null }

/** Member self-service: own progress, measurements and the trainer's shared assessments. */
export function MemberProgress() {
  const { ctx, error } = useFitnessContext();
  const meta = useFitnessMeta();
  const [tab, setTab] = useState<Tab>("progress");
  const [refresh, setRefresh] = useState(0);
  const [trainers, setTrainers] = useState<TrainerInfo[] | null>(null);
  const memberId = ctx?.member_id || null;

  useEffect(() => {
    if (memberId) repsiApi.getClientTrainers(memberId).then(setTrainers).catch(() => setTrainers([]));
  }, [memberId]);

  if (error) return <Notice kind="error">{error}</Notice>;
  if (!ctx) return <LoadingRow />;
  if (!memberId) return <Notice kind="error">Progress tracking is available on member accounts.</Notice>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">My progress</h1>
          <p className="text-sm text-[var(--text-muted)]">Measurements, strength, consistency and personal records from your logged workouts.</p>
        </div>
        {trainers && trainers.length > 0 && (
          <Card className="p-3 flex items-center gap-2 text-sm">
            <UserRound className="h-4 w-4 text-[var(--text-muted)]" />
            <span>Trainer: <strong>{trainers.map((t) => t.name).join(", ")}</strong></span>
          </Card>
        )}
      </div>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-[var(--border)]">
        {([["progress", "Progress"], ["measurements", "Measurements"], ["assessments", "Assessments"]] as [Tab, string][]).map(([id, label]) => (
          <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 ${tab === id ? "border-[var(--primary)] font-semibold text-[var(--text)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "progress" && <ProgressView memberId={memberId} refreshKey={refresh} />}
      {tab === "measurements" && (
        // Members may remove only entries they recorded themselves; the API enforces the same rule.
        <MeasurementsPanel memberId={memberId} types={meta?.measurement_types || []}
          canRemove={(m) => m.recorded_by_role === "member"} onSaved={() => setRefresh((r) => r + 1)} />
      )}
      {tab === "assessments" && <AssessmentsPanel memberId={memberId} staff={false} />}
    </div>
  );
}
