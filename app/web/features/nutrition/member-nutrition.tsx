"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { repsiApi, type ApiAdherence, type ApiDietAssignment, type ApiDietPlan } from "@/lib/api";
import { EmptyBlock, Field, inputClass, LoadingRow, Notice, StatusBadge } from "@/features/fitness/shared";
import { DietVersionView } from "@/features/nutrition/diet-plans";
import { useTranslation } from "@/lib/i18n";

/** Staff view of one member's diet: active plan, adherence and assignment history. */
export function MemberNutrition({ memberId }: { memberId: string }) {
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState<ApiDietAssignment[] | null>(null);
  const [adherence, setAdherence] = useState<ApiAdherence | null>(null);
  const [plans, setPlans] = useState<ApiDietPlan[]>([]);
  const [planId, setPlanId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [a, adh] = await Promise.all([repsiApi.getDietAssignments(memberId), repsiApi.getDietAdherence(memberId, 7)]);
      setAssignments(a);
      setAdherence(adh);
    } catch (err) {
      setError((err as Error).message);
      setAssignments([]);
    }
  }, [memberId]);

  useEffect(() => {
    load();
    repsiApi.listDietPlans().then(setPlans).catch(() => setPlans([]));
  }, [load]);

  const assign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId) return;
    setBusy(true);
    setError(null);
    try {
      await repsiApi.assignDietPlan(memberId, planId);
      setPlanId("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (assignments === null) return <LoadingRow label={t("nutrition.loading_nutrition")} />;
  const active = assignments.find((a) => a.status === "active");

  return (
    <div className="space-y-4">
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      <Card className="p-4">
        <form onSubmit={assign} className="flex flex-wrap items-end gap-2">
          <Field label={active ? t("nutrition.replace_diet_plan") : t("nutrition.assign_a_diet_plan")} htmlFor="assign-diet">
            <select id="assign-diet" className={inputClass} value={planId} onChange={(e) => setPlanId(e.target.value)}>
              <option value="">{t("nutrition.choose_a_plan")}</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Button type="submit" size="sm" disabled={!planId || busy}>{t("nutrition.assign")}</Button>
        </form>
        {active && <p className="mt-2 text-xs text-[var(--text-muted)]">{t("nutrition.assigning_a_new_plan_ends_the")}</p>}
      </Card>

      {adherence && adherence.planned_meals > 0 && (
        <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-5">
          {([["Adherence (7d)", adherence.adherence_pct != null ? `${adherence.adherence_pct}%` : "—"], ["Followed", adherence.followed],
            ["Modified", adherence.modified], ["Skipped", adherence.skipped], ["Not logged", adherence.not_logged]] as [string, string | number][]).map(([label, v]) => (
            <div key={label}>
              <p className="text-xs text-[var(--text-muted)]">{label}</p>
              <p className="text-lg font-semibold text-[var(--text)]">{v}</p>
            </div>
          ))}
        </Card>
      )}

      {active?.version ? (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="font-semibold text-[var(--text)]">{active.title}</h3>
            <span className="text-xs text-[var(--text-muted)]">{t("nutrition.vversion_number_since_start_date", undefined, { version_number: active.version.version_number, start_date: active.start_date })}</span>
          </div>
          <DietVersionView version={active.version} />
        </Card>
      ) : (
        <EmptyBlock title={t("nutrition.no_diet_plan_assigned")}>{t("nutrition.pick_a_plan_above_to_give")}</EmptyBlock>
      )}

      {assignments.length > 1 && (
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">{t("nutrition.history")}</h3>
          <ul className="space-y-1 text-sm">
            {assignments.filter((a) => a.id !== active?.id).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2 text-[var(--text-secondary)]">
                <span>{a.title}</span>
                {a.version && <span className="text-xs">v{a.version.version_number}</span>}
                <span className="text-xs">{a.start_date} → {a.ended_on ?? "—"}</span>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
