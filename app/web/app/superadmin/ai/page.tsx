"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { aiApi } from "@/lib/ai-api";

interface Totals {
  requests: number;
  model_calls: number;
  input_tokens: number;
  output_tokens: number;
  free_answers: number;
}
interface Usage {
  config: {
    configured: boolean;
    model: string;
    fallback_model: string;
    global_daily_calls: number;
    global_calls_per_minute: number;
    member_daily_calls: number;
    staff_daily_calls: number;
    plan_daily_calls: Record<string, number>;
  };
  today: Totals;
  period: Totals & { days: number };
  by_feature: { feature: string; status: string; count: number }[];
  top_workspaces: { workspace_id: string; name: string; model_calls: number; requests: number }[];
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="text-2xl font-bold text-[var(--text)]">{value}</p>
      {hint && <p className="text-xs text-[var(--text-muted)] mt-1">{hint}</p>}
    </div>
  );
}

export default function SuperAdminAiPage() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setUsage(await aiApi.adminUsage<Usage>(30));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const features = usage
    ? Object.entries(
        usage.by_feature.reduce<Record<string, Record<string, number>>>((acc, r) => {
          (acc[r.feature] ||= {})[r.status] = r.count;
          return acc;
        }, {}),
      )
    : [];
  const freeShare = usage && usage.period.requests ? Math.round((usage.period.free_answers / usage.period.requests) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">AI Usage & Limits</h1>
            {usage && <Badge variant={usage.config.configured ? "active" : "expiring"}>{usage.config.configured ? "Gemini connected" : "Not configured"}</Badge>}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Model calls are the only thing that spends quota. Help-article, calculated and cached answers are free.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-[var(--error)]/30 bg-[var(--error-soft)] px-4 py-3 text-sm text-[var(--error-foreground)]">{error}</div>}

      {usage && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Model calls today" value={`${usage.today.model_calls} / ${usage.config.global_daily_calls}`} hint="Platform daily cap" />
            <Stat label="Requests (30 days)" value={usage.period.requests} hint={`${freeShare}% answered without a model call`} />
            <Stat label="Tokens in (30 days)" value={usage.period.input_tokens.toLocaleString()} />
            <Stat label="Tokens out (30 days)" value={usage.period.output_tokens.toLocaleString()} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-sm font-semibold text-[var(--text)] mb-3">By feature (30 days)</h2>
              {features.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No AI requests yet.</p> : (
                <ul className="space-y-2 text-sm">
                  {features.map(([feature, statuses]) => (
                    <li key={feature} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-[var(--text)] capitalize">{feature}</span>
                      <span className="flex flex-wrap gap-1">
                        {Object.entries(statuses).map(([s, c]) => <Badge key={s} variant={s === "ok" ? "lime" : s === "error" ? "expired" : "outline"}>{s}: {c}</Badge>)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Top gyms by model calls</h2>
              {usage.top_workspaces.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No usage yet.</p> : (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-[var(--text-muted)]"><tr><th className="py-1 font-medium">Gym</th><th className="py-1 font-medium text-right">Model calls</th><th className="py-1 font-medium text-right">Requests</th></tr></thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {usage.top_workspaces.map((w) => (
                      <tr key={w.workspace_id}><td className="py-1.5 text-[var(--text)]">{w.name}</td><td className="py-1.5 text-right">{w.model_calls}</td><td className="py-1.5 text-right text-[var(--text-muted)]">{w.requests}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2 text-sm">
            <h2 className="text-sm font-semibold text-[var(--text)]">Limits and model</h2>
            <p className="text-[var(--text-secondary)]">Model <strong className="text-[var(--text)]">{usage.config.model}</strong>, falling back to {usage.config.fallback_model}. Platform: {usage.config.global_daily_calls}/day and {usage.config.global_calls_per_minute}/minute. Per person per day: members {usage.config.member_daily_calls}, staff {usage.config.staff_daily_calls}.</p>
            <p className="text-[var(--text-secondary)]">Per gym per day by plan: {Object.entries(usage.config.plan_daily_calls).map(([p, n]) => `${p} ${n}`).join(" · ")}.</p>
            <p className="text-xs text-[var(--text-muted)]">Change these with the GEMINI_* and AI_* environment variables on the API.</p>
          </section>
        </>
      )}
    </div>
  );
}
