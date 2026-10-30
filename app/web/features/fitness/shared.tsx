"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ImageOff, Loader2, X, BrainCircuit } from "lucide-react";
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

import { findDemonstrationByName, searchDemonstrations, OPEN_SOURCE_ATTRIBUTION, type ExerciseDemonstration } from "@/lib/exercise-demonstrations";
import { Dumbbell, Info, Maximize2, Pause, Play, RefreshCw, Sparkles, Video } from "lucide-react";

/** Exercise demonstration with loading, pause/play, fallback, auto-matching, and attribution. */
export function ExerciseMedia({
  type,
  url,
  name,
  className = "",
  autoPlay = true,
  showControls = true,
  compact = false,
  onSelectMedia,
}: {
  type?: FitMediaType | string | null;
  url?: string | null;
  name: string;
  className?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  compact?: boolean;
  onSelectMedia?: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [showAttribution, setShowAttribution] = useState(false);

  // Auto-match demonstration from open-source catalog if no media was explicitly configured
  const matched = !url ? findDemonstrationByName(name) : null;
  const effectiveUrl = url || matched?.gifUrl || null;
  const effectiveType = type || (matched ? "gif" : null);
  const thumbUrl = matched?.thumbUrl || (effectiveUrl && effectiveUrl.endsWith(".gif") ? effectiveUrl.replace(/\.gif$/, ".thumb.webp") : null);

  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // A cached image can finish before onLoad is attached; don't leave the overlay up for it.
    const img = imgRef.current;
    setState(img?.complete && img.naturalWidth > 0 ? "ready" : "loading");
  }, [effectiveUrl]);

  const box = `relative w-full ${compact ? "aspect-[4/3]" : "aspect-video"} rounded-xl overflow-hidden bg-[var(--surface-elevated)] border border-[var(--border)] group select-none ${className}`;

  if (!effectiveUrl || !effectiveType) {
    return (
      <div className={`${box} flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-[var(--surface-elevated)] to-[var(--surface)] border-dashed`}>
        <div className="h-10 w-10 rounded-full bg-[var(--primary-soft)] text-[var(--primary-dark)] flex items-center justify-center mb-1.5 shadow-sm">
          <Dumbbell className="h-5 w-5" aria-hidden />
        </div>
        <p className="text-xs font-semibold text-[var(--text)] truncate max-w-[90%]">{name}</p>
        <span className="text-[11px] text-[var(--text-muted)] mt-0.5">Form demonstration placeholder</span>
        {onSelectMedia && (
          <button
            type="button"
            onClick={onSelectMedia}
            className="mt-2 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm"
          >
            <Sparkles className="h-3 w-3" /> Select demonstration
          </button>
        )}
      </div>
    );
  }

  if (effectiveType === "youtube") {
    const embed = youtubeEmbed(effectiveUrl);
    if (!embed) return <div className={`${box} flex items-center justify-center text-xs text-[var(--text-muted)]`}>Invalid video link</div>;
    return (
      <div className={box}>
        <iframe
          src={embed}
          title={`${name} demonstration`}
          className="absolute inset-0 h-full w-full"
          loading="lazy"
          allow="accelerometer; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <div className={box}>
      {/* Loading indicator with thumb placeholder */}
      {state === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface-elevated)] z-10 transition-opacity duration-300">
          {thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbUrl} alt="" className="absolute inset-0 h-full w-full object-cover blur-sm opacity-40 scale-105" />
          ) : null}
          <div className="relative z-20 flex items-center gap-1.5 text-xs text-[var(--text-muted)] bg-[var(--surface)]/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-[var(--border)] shadow-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--primary)]" />
            <span>Loading form demonstration…</span>
          </div>
        </div>
      )}

      {/* Error state with retry */}
      {state === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--text-muted)] p-3 text-center bg-[var(--surface-elevated)]">
          <ImageOff className="h-6 w-6 text-[var(--text-muted)]" aria-hidden />
          <span className="text-xs">Demonstration temporarily unavailable</span>
          <button
            type="button"
            onClick={() => {
              setState("loading");
              const img = new Image();
              img.src = effectiveUrl;
              img.onload = () => setState("ready");
              img.onerror = () => setState("error");
            }}
            className="text-[11px] font-medium text-[var(--primary)] underline flex items-center gap-1 hover:opacity-80"
          >
            <RefreshCw className="h-3 w-3" /> Retry loading
          </button>
        </div>
      ) : effectiveType === "video" ? (
        <video
          src={effectiveUrl}
          controls
          muted
          playsInline
          loop
          preload="metadata"
          className="absolute inset-0 h-full w-full object-contain bg-black"
          onLoadedData={() => setState("ready")}
          onError={() => setState("error")}
          aria-label={`${name} demonstration video`}
        />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={isPlaying ? effectiveUrl : (thumbUrl || effectiveUrl)}
            alt={`${name} proper form demonstration`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain bg-black/40 transition-transform duration-200"
            onLoad={() => setState("ready")}
            onError={() => setState("error")}
          />
          {!isPlaying && state === "ready" && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
              <span className="h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center shadow-lg border border-white/20">
                <Play className="h-5 w-5 ml-0.5 fill-current" />
              </span>
            </div>
          )}
        </>
      )}

      {/* Interactive Controls Overlay */}
      {showControls && state === "ready" && (
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-90 transition-opacity">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="p-1 rounded-md bg-black/60 text-white/90 hover:text-white hover:bg-black/90 transition-colors"
              title={isPlaying ? "Pause animation loop" : "Play animation loop"}
              aria-label={isPlaying ? "Pause animation loop" : "Play animation loop"}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            </button>
            <span className="text-[10px] font-medium text-white/80 tracking-wide uppercase">Loop</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowAttribution((s) => !s)}
              className="p-1 rounded-md bg-black/60 text-white/70 hover:text-white hover:bg-black/90 transition-colors text-[10px]"
              title="Demonstration source attribution"
              aria-label="Demonstration source attribution"
            >
              <Info className="h-3 w-3" />
            </button>
            {onSelectMedia && (
              <button
                type="button"
                onClick={onSelectMedia}
                className="px-2 py-0.5 rounded-md bg-[var(--primary)] text-white text-[10px] font-semibold hover:opacity-90 transition-opacity flex items-center gap-1"
                title="Change or select demonstration"
              >
                <Sparkles className="h-2.5 w-2.5" /> Change
              </button>
            )}
          </div>
        </div>
      )}

      {/* Attribution overlay */}
      {showAttribution && (
        <div className="absolute inset-0 z-30 bg-black/90 p-3 flex flex-col justify-between text-white text-xs">
          <div className="flex items-start justify-between">
            <p className="font-semibold text-sm">Exercise Demonstration</p>
            <button type="button" onClick={() => setShowAttribution(false)} className="text-white/60 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[11px] text-white/80 leading-relaxed my-auto">
            {OPEN_SOURCE_ATTRIBUTION}
          </p>
          <p className="text-[10px] text-white/50">Verified human movement with proper anatomical mechanics.</p>
        </div>
      )}
    </div>
  );
}

/** Comprehensive Workout Exercise Card displaying animation GIF, name, muscles, equipment, and sets/reps. */
export function WorkoutExerciseCard({
  item,
  index,
  onSelectDemonstration,
  onViewDetails,
  compact = false,
  className = "",
}: {
  item: Partial<ApiPlanItem> & { exercise_name: string; name?: string };
  index?: number;
  onSelectDemonstration?: () => void;
  onViewDetails?: () => void;
  compact?: boolean;
  className?: string;
}) {
  const name = item.exercise_name || item.name || "Exercise";
  const matched = !item.media_url ? findDemonstrationByName(name) : null;
  const effectiveUrl = item.media_url || matched?.gifUrl || null;
  const effectiveType = item.media_type || (matched ? "gif" : null);

  const primaryMuscles = item.primary_muscles?.length
    ? item.primary_muscles
    : (matched?.muscle ? [matched.muscle] : []);
  const equipment = item.equipment?.length
    ? item.equipment
    : (matched?.equipment ? [matched.equipment] : []);

  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--border-strong,var(--primary))] transition-all shadow-sm ${
        compact ? "p-3" : "p-3.5 sm:p-4"
      } ${className}`}
    >
      <div className={`grid gap-3 ${compact ? "grid-cols-[80px_1fr]" : "sm:grid-cols-[140px_1fr]"}`}>
        {/* Looping GIF Demonstration Preview */}
        <div className="relative cursor-pointer shrink-0" onClick={onViewDetails}>
          <ExerciseMedia
            type={effectiveType}
            url={effectiveUrl}
            name={name}
            compact
            showControls={false}
            className="w-full h-full shadow-sm"
          />
        </div>

        {/* Exercise Details, Target Muscles, Equipment, Sets/Reps */}
        <div className="flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-baseline gap-1.5 min-w-0">
                {typeof index === "number" && (
                  <span className="text-xs font-bold text-[var(--primary)] tabular-nums shrink-0">
                    {index + 1}.
                  </span>
                )}
                <h4
                  onClick={onViewDetails}
                  className="font-bold text-sm text-[var(--text)] truncate hover:text-[var(--primary)] cursor-pointer"
                  title={name}
                >
                  {name}
                </h4>
              </div>

              {item.section && item.section !== "main" && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)]">
                  {humanize(item.section)}
                </span>
              )}
            </div>

            {/* Target Muscles & Equipment Badges alongside the animation */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {primaryMuscles.slice(0, 2).map((m) => (
                <span
                  key={m}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary-dark)] font-semibold border border-[var(--primary)]/20"
                >
                  {humanize(m)}
                </span>
              ))}
              {equipment.slice(0, 2).map((eq) => (
                <span
                  key={eq}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]"
                >
                  {humanize(eq)}
                </span>
              ))}
              {item.group_label && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--primary-soft)] text-[var(--primary-dark)] font-medium">
                  {humanize(item.group_type || "group")} {item.group_label}
                </span>
              )}
            </div>
          </div>

          {/* Sets, Reps, Prescription & Notes */}
          <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 font-semibold text-[var(--text)]">
              <span className="tabular-nums">
                {prescription({
                  sets: item.sets,
                  reps_min: item.reps_min,
                  reps_max: item.reps_max,
                  target_weight_kg: item.target_weight_kg,
                  duration_seconds: item.duration_seconds,
                  distance_m: item.distance_m,
                  rest_seconds: item.rest_seconds,
                  tempo: item.tempo,
                }) || "3 sets · Prescribed form"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onSelectDemonstration && (
                <button
                  type="button"
                  onClick={onSelectDemonstration}
                  className="text-[11px] text-[var(--primary)] hover:underline flex items-center gap-1 font-medium"
                >
                  <BrainCircuit className="h-3 w-3" /> Change GIF
                </button>
              )}
              {onViewDetails && (
                <button
                  type="button"
                  onClick={onViewDetails}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Details →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Modal for trainers to search, preview, and select or replace an exercise demonstration GIF. */
export function DemonstrationPickerModal({
  currentName,
  onSelect,
  onClose,
}: {
  currentName?: string;
  onSelect: (demo: ExerciseDemonstration) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(currentName || "");
  const [category, setCategory] = useState("all");
  const [equipment, setEquipment] = useState("all");
  const [preview, setPreview] = useState<ExerciseDemonstration | null>(null);

  const results = searchDemonstrations({
    query: query.trim() || undefined,
    category: category !== "all" ? category : undefined,
    equipment: equipment !== "all" ? equipment : undefined,
  });

  return (
    <Modal title="Select Exercise Demonstration GIF" onClose={onClose} wide>
      <div className="space-y-4">
        <p className="text-xs text-[var(--text-muted)]">
          Choose from free, open-source looping exercise demonstration GIFs featuring proper form, correct equipment, and anatomical focus.
        </p>

        {/* Search & Filters */}
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises by name…"
            className={inputClass}
            autoFocus
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
            aria-label="Category filter"
          >
            <option value="all">All Categories</option>
            <option value="chest">Chest</option>
            <option value="back">Back</option>
            <option value="legs">Legs</option>
            <option value="shoulders">Shoulders</option>
            <option value="arms">Arms</option>
            <option value="core">Core</option>
            <option value="cardio">Cardio</option>
            <option value="mobility">Mobility</option>
          </select>
          <select
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className={inputClass}
            aria-label="Equipment filter"
          >
            <option value="all">All Equipment</option>
            <option value="barbell">Barbell</option>
            <option value="dumbbell">Dumbbell</option>
            <option value="cable">Cable</option>
            <option value="bodyweight">Bodyweight</option>
            <option value="kettlebell">Kettlebell</option>
            <option value="machine">Machine</option>
          </select>
        </div>

        {/* Results Grid with live looping previews */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 max-h-[50vh] overflow-y-auto p-1">
          {results.length === 0 ? (
            <div className="col-span-full py-8 text-center text-sm text-[var(--text-muted)]">
              No matching exercise demonstrations found. Try clearing filters or searching another keyword.
            </div>
          ) : (
            results.map((demo) => (
              <div
                key={demo.id}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-2.5 flex flex-col justify-between hover:border-[var(--primary)] transition-all cursor-pointer shadow-sm"
                onClick={() => setPreview(demo)}
              >
                <div>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black/20 mb-2 border border-[var(--border)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={demo.thumbUrl || demo.gifUrl}
                      alt={demo.name}
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <p className="font-bold text-xs text-[var(--text)] truncate">{demo.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] capitalize">
                    {demo.category} · {demo.equipment} · {demo.muscle}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[var(--primary)]">Preview</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(demo);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    Select
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Preview Details */}
        {preview && (
          <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-soft)]/20 p-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-20 aspect-video rounded-lg overflow-hidden shrink-0 border border-[var(--border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.gifUrl} alt="" className="h-full w-full object-contain bg-black" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text)]">{preview.name}</p>
                <p className="text-[11px] text-[var(--text-muted)] capitalize">
                  {preview.category} · {preview.equipment} · {preview.muscle}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelect(preview);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-bold shadow-sm"
              >
                Use this demonstration
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
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
