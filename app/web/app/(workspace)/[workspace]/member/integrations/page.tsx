"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Footprints, HeartPulse, Info, Loader2, RefreshCw, Smartphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/organization/form-fields";
import { repsiApi, type ApiHealthSummary } from "@/lib/api";
import { formatDate, useTranslation } from "@/lib/i18n";

const SOURCE_LABEL: Record<string, string> = {
  health_connect: "Health Connect (Android)",
  google_fit: "Google Fit",
  apple_health: "Apple Health",
  manual: "Entered manually",
};

/**
 * Health apps. Google retired the Google Fit APIs; on Android, step and workout data now flows
 * through Health Connect, which only exists on the phone. So the website can't connect it
 * directly: the REPSI Android app syncs it, and this page shows what has been synced.
 */
export default function HealthIntegrationsPage() {
  const { t, language } = useTranslation();
  const { workspace } = useParams<{ workspace: string }>();
  const [summary, setSummary] = useState<ApiHealthSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    repsiApi
      .getMyHealthSummary(14)
      .then(setSummary)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const erase = async () => {
    setDeleting(true);
    setError(null);
    try {
      const r = await repsiApi.deleteMyHealthData();
      setNotice(t("health.erased", "Removed {count} days of synced activity. Also turn off REPSI in Health Connect on your phone to stop new syncs.", { count: r.deleted }));
      setConfirming(false);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const connected = Boolean(summary?.last_synced_at);
  const sources = [...new Set((summary?.days ?? []).map((d) => d.source))];
  const maxSteps = Math.max(1, ...(summary?.days ?? []).map((d) => d.steps));

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">{t("health.title", "Health apps")}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {t("health.subtitle", "Steps and activity from your phone, synced by the REPSI app.")}
        </p>
      </div>

      {error && <FormAlert kind="error">{error}</FormAlert>}
      {notice && <FormAlert kind="success">{notice}</FormAlert>}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <HeartPulse className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" aria-hidden />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-[var(--text)]">{t("health.hc_title", "Health Connect (includes Google Fit data)")}</h2>
                {!loading && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      connected ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--surface-secondary)] text-[var(--text-muted)]"
                    }`}
                  >
                    {connected ? t("health.syncing", "Syncing") : t("health.not_connected", "Not connected")}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {connected && summary?.last_synced_at
                  ? t("health.last_sync", "Last synced {when} from {sources}.", {
                      when: formatDate(summary.last_synced_at, language, { dateStyle: "medium", timeStyle: "short" }),
                      sources: sources.map((s) => SOURCE_LABEL[s] ?? s).join(", ") || "—",
                    })
                  : t("health.how_to", "Open the REPSI app on your Android phone, tap “Connect Health Connect” on the Home tab and allow the requested data. Google Fit writes to Health Connect, so its data comes through too.")}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden />
            {t("common.refresh", "Refresh")}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" /></div>
        ) : connected && summary ? (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [t("health.today", "Steps today"), summary.today_steps.toLocaleString()],
                [t("health.avg", "Daily average"), summary.average_steps.toLocaleString()],
                [t("health.distance", "Distance (14 days)"), `${(summary.total_distance_meters / 1000).toFixed(1)} km`],
                [t("health.calories", "Active kcal (14 days)"), Math.round(summary.total_active_calories).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 rounded-xl bg-[var(--background-secondary)] p-3">
                  <p className="truncate text-xs text-[var(--text-muted)]">{label}</p>
                  <p className="mt-0.5 truncate text-lg font-bold tabular-nums text-[var(--text)]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5" aria-label={t("health.chart", "Daily steps, last 14 days")} role="img">
              <div className="flex h-28 items-end gap-1">
                {summary.days.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center justify-end" title={`${formatDate(d.day, language)} · ${d.steps.toLocaleString()} steps`}>
                    <div className="w-full rounded-t-[4px] bg-[var(--primary)]/80" style={{ height: `${Math.max(4, (d.steps / maxSteps) * 100)}%` }} />
                  </div>
                ))}
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Footprints className="h-3.5 w-3.5" aria-hidden /> {t("health.chart", "Daily steps, last 14 days")}
              </p>
            </div>
            <div className="mt-5 border-t border-[var(--border)] pt-4">
              {confirming ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-[var(--text)]">{t("health.confirm", "Remove all synced activity from REPSI?")}</p>
                  <Button size="sm" variant="destructive" onClick={erase} disabled={deleting}>
                    {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {t("health.remove", "Remove data")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>{t("common.cancel", "Cancel")}</Button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--error)] hover:underline">
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {t("health.disconnect", "Disconnect and remove synced data")}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-[var(--background-secondary)] p-4 text-sm">
            <Smartphone className="h-5 w-5 shrink-0 text-[var(--primary)]" aria-hidden />
            <p className="min-w-0 flex-1 text-[var(--text-secondary)]">
              {t("health.need_app", "Syncing needs the REPSI Android app — browsers can't read Health Connect.")}
            </p>
            <Link href="/download" className="font-semibold text-[var(--link)] hover:underline">{t("health.get_app", "Get the app")}</Link>
          </div>
        )}
      </section>

      <p className="flex gap-2 text-xs text-[var(--text-muted)]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {t("health.privacy", "REPSI only reads daily totals (steps, distance and active calories). Your gym's staff can't see them. Running and GPS workouts are on the Activity page.")}
        {" "}
        <Link href={`/${workspace}/member/running`} className="font-medium text-[var(--link)] hover:underline">{t("nav.activity_running", "Activity")}</Link>
      </p>
    </div>
  );
}
