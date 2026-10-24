"use client";

import React from "react";
import { RepsiRLogo } from "@/components/ui/repsi-r-logo";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useTranslation, richText } from "@/lib/i18n";

export interface RepsiBrandLoaderProps {
  /** Optional status text (hidden by default when showText is false) */
  message?: string;
  /** Actual numeric progress (0 to 100). If omitted, an indeterminate animation is used */
  progress?: number;
  /** Whether to render any textual brand labels or messages (defaults to false for minimal aesthetic) */
  showText?: boolean;
  /** Error message if initialization fails */
  error?: string | null;
  /** Retry callback if initialization encounters an error */
  onRetry?: () => void;
  /** Fullscreen fixed overlay vs inline container */
  fullScreen?: boolean;
  /** Color theme variant: 'light' (#FAF9F6 background) vs 'dark' (#17191C background) */
  variant?: "light" | "dark";
  /** Trigger exit fade-out transition */
  isExiting?: boolean;
  /** Optional container class name */
  className?: string;
}

/**
 * Premium Minimal REPSI Application Loading Screen
 *
 * Ultra-clean aesthetic:
 * - Standalone authentic R Lettermark with Flame Orange (#E25822) slash
 * - Thin rounded progress track with smooth continuous loading motion
 * - Pure, minimal design with zero distracting text clutter
 * - GPU-accelerated keyframe animation
 */
export function RepsiBrandLoader({
  message,
  progress,
  showText = false,
  error = null,
  onRetry,
  fullScreen = true,
  variant = "light",
  isExiting = false,
  className = "",
}: RepsiBrandLoaderProps) {
  const isDark = variant === "dark";
  const { t } = useTranslation();

  const containerBg = isDark ? "bg-[#17191C] text-[#FAF9F6]" : "bg-[#FAF9F6] text-[#191919]";

  const containerBase = fullScreen
    ? `fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none p-6 ${containerBg}`
    : `flex flex-col items-center justify-center p-8 select-none ${containerBg}`;

  const exitStyle = isExiting
    ? "opacity-0 pointer-events-none transition-opacity duration-300 ease-out"
    : "opacity-100 transition-opacity duration-200 ease-in";

  const hasNumericProgress = typeof progress === "number" && !isNaN(progress);
  const clampedProgress = hasNumericProgress ? Math.min(100, Math.max(0, Math.round(progress!))) : 0;

  return (
    <div
      className={`${containerBase} ${exitStyle} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={error ? t("ui.initialization_error_error", undefined, { error }) : t("common.loadingApp", "Loading REPSI")}
    >
      <div className="flex flex-col items-center justify-center max-w-sm w-full mx-auto text-center px-4">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 01. REPSI R LOGO (AUTHENTIC LETTERMARK & FLAME ORANGE SLASH)  */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center">
          <RepsiRLogo
            size={120}
            variant={variant}
            animated={!error}
            priority={true}
          />
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 02. OPTIONAL TEXT (ONLY IF EXPLICITLY ENABLED)                */}
        {/* ───────────────────────────────────────────────────────────── */}
        {showText && (
          <div className="flex flex-col items-center mt-5 w-full animate-repsi-brand-reveal">
            <h2
              className={`font-heading font-black text-xl sm:text-2xl uppercase tracking-[0.3em] pl-[0.3em] leading-none ${
                isDark ? "text-[#FAF9F6]" : "text-[#191919]"
              }`}
            >
              REPSI
            </h2>

            <p
              className={`font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] uppercase pl-[0.25em] mt-1.5 ${
                isDark ? "text-[#9BA1AC]" : "text-[#858890]"
              }`}
            >
              {t("ui.gym_management_platform")}
            </p>

            {message && (
              <p
                className={`text-xs font-medium mt-3 ${
                  isDark ? "text-[#C5C9D1]" : "text-[#62666D]"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 03. LOADING INDICATOR OR ERROR STATE                          */}
        {/* ───────────────────────────────────────────────────────────── */}
        {error ? (
          // Error / Offline / Timeout Fallback State
          <div className="mt-6 flex flex-col items-center space-y-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 max-w-xs animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#E25822] hover:bg-[#C94715] text-white transition-colors cursor-pointer shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E25822]"
              >
                {richText(t("ui.refreshcwretry"), { refreshcw: <RefreshCw className="w-3.5 h-3.5" /> })}</button>
            )}
          </div>
        ) : (
          // Pure Minimal Progress Track
          <div className="flex flex-col items-center mt-7 w-full animate-repsi-indicator-reveal">
            {/* Thin Rounded Progress Track */}
            <div
              className={`w-44 sm:w-52 h-1 sm:h-1.5 rounded-full overflow-hidden relative shadow-inner ${
                isDark ? "bg-[#252830]" : "bg-[#E7E4DE]"
              }`}
            >
              {hasNumericProgress ? (
                // Smooth fill with Flame Orange gradient
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF7A45] to-[#E25822] transition-[width] duration-200 ease-out shadow-[0_0_8px_rgba(226,88,34,0.4)]"
                  style={{ width: `${clampedProgress}%` }}
                />
              ) : (
                // Indeterminate Mode: Continuous GPU-accelerated sweep (never stuck)
                <div className="absolute top-0 bottom-0 bg-gradient-to-r from-[#E25822] via-[#FF7A45] to-[#E25822] rounded-full shadow-[0_0_8px_rgba(226,88,34,0.4)] animate-repsi-sweep" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RepsiBrandLoader;
