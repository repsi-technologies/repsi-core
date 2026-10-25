"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { fitnessApi, type ApiFitnessOverview } from "@/lib/fitness-api";
import { ExerciseLibrary } from "./exercise-library";
import { ProgramsList } from "./programs";
import { EmptyBlock, formatDay, LoadingRow, Notice } from "./shared";

type HubTab = "overview" | "programs" | "exercises";

export function WorkoutsHub({ basePath, memberHref, title }: { basePath: string; memberHref: (memberId: string) => string; title: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const tab = (params.get("tab") as HubTab) || "overview";
  const setTab = (t: HubTab) => router.replace(`${basePath}?tab=${t}`, { scroll: false });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[var(--text)]">{title}</h1>
        <p className="text-sm text-[var(--text-muted)]">Exercise library, reusable programs, member plans and adherence.</p>
      </div>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-[var(--border)]">
        {([["overview", "Overview"], ["programs", "Programs"], ["exercises", "Exercise library"]] as [HubTab, string][]).map(([id, label]) => (
          <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 ${tab === id ? "border-[var(--primary)] font-semibold text-[var(--text)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "overview" && <Overview memberHref={memberHref} basePath={basePath} />}
      {tab === "programs" && <ProgramsList basePath={basePath} />}
      {tab === "exercises" && <ExerciseLibrary />}
    </div>
  );
}

function Overview({ memberHref, basePath }: { memberHref: (id: string) => string; basePath: string }) {
  const [data, setData] = useState<ApiFitnessOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fitnessApi.overview().then(setData).catch((e: Error) => setError(e.message));
  }, []);
  if (error) return <Notice kind="error">{error}</Notice>;
  if (!data) return <LoadingRow label="Loading training overview…" />;
  const tiles = [
    { label: data.scope === "gym" ? "Members with plans" : "Clients with plans", value: data.members_with_plans },
    { label: "Active plans", value: data.active_assignments },
    { label: "Workouts completed (30d)", value: data.sessions_completed_30d },
    { label: "Adherence (30d)", value: data.adherence_pct == null ? "—" : `${data.adherence_pct}%` },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4">
            <p className="text-xs text-[var(--text-muted)]">{t.label}</p>
            <p className="text-2xl font-bold text-[var(--text)] tabular-nums">{t.value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <h2 className="text-sm font-bold text-[var(--text)] mb-1">{data.scope === "gym" ? "Members on workout plans" : "Your clients on workout plans"}</h2>
        <p className="text-xs text-[var(--text-muted)] mb-3">Last 30 days. Lowest adherence first. Missed = scheduled days that passed without a completed workout.</p>
        {data.members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center space-y-3">
            <p className="font-semibold text-base text-[var(--text)]">No active workout plans</p>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
              Assign a workout plan to keep members motivated. You can pick from our pre-built Beginner, Intermediate, or Chest Hypertrophy templates in the Programs tab.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <Link
                href={`${basePath}?tab=programs`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90"
              >
                Browse Programs & Templates
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--text-muted)]">
                  <th className="py-1.5 pr-3">Member</th>{data.scope === "gym" && <th className="pr-3">Trainer</th>}
                  <th className="pr-3">Plans</th><th className="pr-3">Done</th><th className="pr-3">Missed</th><th className="pr-3">Adherence</th><th className="pr-3">Last workout</th>
                </tr>
              </thead>
              <tbody>
                {data.members.map((m) => (
                  <tr key={m.member_id} className="border-t border-[var(--border)]">
                    <td className="py-2 pr-3"><Link href={memberHref(m.member_id)} className="font-medium text-[var(--text)] hover:underline">{m.member_name}</Link></td>
                    {data.scope === "gym" && <td className="pr-3 text-[var(--text-muted)]">{m.trainer_name || "—"}</td>}
                    <td className="pr-3 tabular-nums">{m.active_assignments}</td>
                    <td className="pr-3 tabular-nums">{m.completed_30d}</td>
                    <td className="pr-3 tabular-nums">{m.missed_30d}</td>
                    <td className="pr-3 tabular-nums">{m.adherence_pct == null ? "—" : `${m.adherence_pct}%`}</td>
                    <td className="pr-3 text-[var(--text-muted)] whitespace-nowrap">{m.last_session_date ? formatDay(m.last_session_date) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
