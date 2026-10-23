"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ImageOff, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fitnessApi, type ApiFitnessContext, type ApiFitnessMeta, type ApiPlanItem, type FitMediaType } from "@/lib/fitness-api";

export const inputClass =
  "w-full px-3 py-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-60";

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function humanize(value?: string | null): string {
  if (!value) return "";
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Local calendar date as YYYY-MM-DD (not UTC), matching how the API reports schedule dates. */
export function isoDate(d: Date = new Date()): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

export function startOfWeek(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const offset = (d.getDay() + 6) % 7; // Monday = 0
  return addDays(iso, -offset);
}

export function formatDay(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, opts);
}

export function formatDuration(seconds?: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s ? `${s}s` : ""}`.trim();
  return `${s}s`;
}

/** "3 × 8–12 @ 60 kg · rest 90s" style prescription summary. */
export function prescription(it: Pick<ApiPlanItem, "sets" | "reps_min" | "reps_max" | "target_weight_kg" | "duration_seconds" | "distance_m" | "rest_seconds" | "tempo">): string {
  const parts: string[] = [];
  const reps = it.reps_min ? (it.reps_max && it.reps_max !== it.reps_min ? `${it.reps_min}–${it.reps_max}` : `${it.reps_min}`) : "";
  if (it.sets && reps) parts.push(`${it.sets} × ${reps}`);
  else if (it.sets) parts.push(`${it.sets} sets`);
  else if (reps) parts.push(`${reps} reps`);
  if (it.duration_seconds) parts.push(formatDuration(it.duration_seconds));
  if (it.distance_m) parts.push(it.distance_m >= 1000 ? `${(it.distance_m / 1000).toFixed(2)} km` : `${it.distance_m} m`);
  if (it.target_weight_kg) parts.push(`@ ${it.target_weight_kg} kg`);
  if (it.tempo) parts.push(`tempo ${it.tempo}`);
  if (it.rest_seconds) parts.push(`rest ${formatDuration(it.rest_seconds)}`);
  return parts.join(" · ");
}

type BadgeVariant = "active" | "expiring" | "expired" | "frozen" | "cancelled" | "outline" | "lime" | "default";

const STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  active: { label: "Active", variant: "active" },
  published: { label: "Published", variant: "active" },
  draft: { label: "Draft", variant: "expiring" },
  archived: { label: "Archived", variant: "outline" },
  paused: { label: "Paused", variant: "frozen" },
  completed: { label: "Completed", variant: "active" },
  cancelled: { label: "Cancelled", variant: "cancelled" },
  in_progress: { label: "In progress", variant: "lime" },
  abandoned: { label: "Abandoned", variant: "cancelled" },
  missed: { label: "Missed", variant: "expired" },
  today: { label: "Today", variant: "lime" },
  upcoming: { label: "Upcoming", variant: "outline" },
  rest: { label: "Rest day", variant: "default" },
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: humanize(status), variant: "default" as BadgeVariant };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} shadow-2xl my-4 max-h-[calc(100vh-2rem)] flex flex-col`}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-base font-bold text-[var(--text)]">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-[var(--text-secondary)]">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

export function Notice({ kind, children, onDismiss }: { kind: "error" | "success"; children: React.ReactNode; onDismiss?: () => void }) {
  const Icon = kind === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
        kind === "error"
          ? "border-[var(--error)]/30 bg-[var(--error-soft)] text-[var(--error-foreground)]"
          : "border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success-foreground)]"
      }`}
    >
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function LoadingRow({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--text-muted)]" role="status">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function EmptyBlock({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
      <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
      {children && <div className="mt-1 text-xs text-[var(--text-muted)]">{children}</div>}
    </div>
  );
}

function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname === "youtu.be") id = u.pathname.slice(1);
    else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2];
    else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2];
    else id = u.searchParams.get("v") || "";
    return /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

/** Exercise demonstration with loading, fallback and error states. Only renders URLs the gym attached. */
export function ExerciseMedia({ type, url, name, className = "" }: { type?: FitMediaType | string | null; url?: string | null; name: string; className?: string }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const box = `relative w-full aspect-video rounded-xl overflow-hidden bg-[var(--surface-elevated)] border border-[var(--border)] ${className}`;

  if (!url || !type) {
    return (
      <div className={`${box} flex flex-col items-center justify-center gap-1 text-[var(--text-muted)]`}>
        <ImageOff className="h-6 w-6" aria-hidden />
        <span className="text-xs">No demonstration media yet</span>
      </div>
    );
  }
  if (type === "youtube") {
    const embed = youtubeEmbed(url);
    if (!embed) return <div className={`${box} flex items-center justify-center text-xs text-[var(--text-muted)]`}>Invalid video link</div>;
    return (
      <div className={box}>
        <iframe src={embed} title={`${name} demonstration`} className="absolute inset-0 h-full w-full" loading="lazy"
          allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      </div>
    );
  }
  return (
    <div className={box}>
      {state === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" /></div>
      )}
      {state === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[var(--text-muted)]">
          <ImageOff className="h-6 w-6" aria-hidden />
          <span className="text-xs">Media couldn&apos;t be loaded</span>
        </div>
      ) : type === "video" ? (
        <video src={url} controls muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-contain bg-black"
          onLoadedData={() => setState("ready")} onError={() => setState("error")} aria-label={`${name} demonstration video`} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- gym-hosted media on arbitrary hosts; next/image needs per-host config
        <img src={url} alt={`${name} demonstration`} loading="lazy" className="absolute inset-0 h-full w-full object-contain"
          onLoad={() => setState("ready")} onError={() => setState("error")} />
      )}
    </div>
  );
}

/** Server-resolved role/permissions for the fitness module (UX only: the API enforces them). */
export function useFitnessContext() {
  const [ctx, setCtx] = useState<ApiFitnessContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fitnessApi.context()
      .then((c) => alive && setCtx(c))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);
  return { ctx, error };
}

export function useFitnessMeta() {
  const [meta, setMeta] = useState<ApiFitnessMeta | null>(null);
  useEffect(() => {
    let alive = true;
    fitnessApi.meta().then((m) => alive && setMeta(m)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return meta;
}
