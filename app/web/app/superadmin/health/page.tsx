"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { repsiApi } from "@/lib/api";

interface HealthMetric {
  component: string;
  status: string;
  latency_ms?: number | null;
  uptime_pct?: number | null;
  details: string;
}

function variantFor(status: string): "active" | "expiring" | "expired" | "default" {
  if (status === "HEALTHY" || status === "CONFIGURED" || status === "OPERATIONAL") return "active";
  if (status === "DOWN" || status === "DEGRADED") return "expired";
  if (status === "NOT_CONFIGURED") return "expiring";
  return "default";
}

export default function SuperAdminHealthPage() {
  const [healthData, setHealthData] = useState<{ overall_status: string; timestamp: string; metrics: HealthMetric[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repsiApi.getSuperAdminSystemHealth();
      if (!data) throw new Error("No health data returned");
      setHealthData(data);
    } catch (err) {
      setHealthData(null);
      setError((err as Error).message || "Could not reach the API health endpoint.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">System Health</h1>
            {healthData && <Badge variant={variantFor(healthData.overall_status)}>{healthData.overall_status}</Badge>}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Live checks from the API: database round trip, provider configuration, notification queue and cache.
            {healthData && ` Checked ${new Date(healthData.timestamp).toLocaleTimeString()}.`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadHealth} disabled={loading} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-[var(--error)]/30 bg-[var(--error-soft)] px-4 py-3 text-sm text-[var(--error-foreground)]">
          Health check failed: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(healthData?.metrics || []).map((m) => (
          <div key={m.component} className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-semibold text-[var(--text)]">{m.component}</span>
                <Badge variant={variantFor(m.status)}>{m.status.replace(/_/g, " ")}</Badge>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{m.details}</p>
            </div>
            {m.latency_ms !== null && m.latency_ms !== undefined && (
              <div className="pt-3 border-t border-[var(--border)] text-[11px] font-mono text-[var(--text-muted)]">
                Latency: <strong className="text-[var(--text)]">{m.latency_ms} ms</strong>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-[var(--text-muted)]">Uptime isn&apos;t measured in-process; use an external monitor polling <code>/health</code>.</p>
    </div>
  );
}
