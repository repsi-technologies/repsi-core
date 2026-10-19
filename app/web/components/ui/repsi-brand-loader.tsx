"use client";

import React from "react";

export interface RepsiBrandLoaderProps {
  /** Main status line (defaults to "Preparing your workspace...") */
  message?: string;
  /** Numeric progress (0 to 100). If omitted, an indeterminate animation is used */
  progress?: number;
  /** Fullscreen fixed overlay vs inline container */
  fullScreen?: boolean;
  /** Show the subtle illustrative concept note */
  showConceptNote?: boolean;
  /** Trigger exit fade-out transition */
  isExiting?: boolean;
  /** Optional container class name */
  className?: string;
}

/**
 * Premium Minimal Loading Screen for REPSI
 *
 * Implements:
 * 1. Black/Charcoal R reveal followed by the Flame Orange diagonal stroke (500–700 ms)
 * 2. Single expanding orange energy glow behind the logo (no continuous bounce)
 * 3. Exact screen layout with spaced "R E P S I" heading, "GYM MANAGEMENT PLATFORM" subline,
 *    and thin rounded progress track
 * 4. High-performance GPU CSS animations (guaranteed zero-stuck, zero hydration hang)
 * 5. Full accessibility support with `prefers-reduced-motion`
 */
export function RepsiBrandLoader({
  message = "Preparing your workspace...",
  progress,
  fullScreen = true,
  showConceptNote = true,
  isExiting = false,
  className = "",
}: RepsiBrandLoaderProps) {
  const containerBase = fullScreen
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF9F6] text-[#191919] select-none p-6"
    : "flex flex-col items-center justify-center p-8 bg-[#FAF9F6] text-[#191919] select-none";

  const exitStyle = isExiting
    ? "opacity-0 pointer-events-none transition-opacity duration-300 ease-out"
    : "opacity-100 transition-opacity duration-200 ease-in";

  return (
    <div
      className={`${containerBase} ${exitStyle} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`${message} Loading`}
    >
      <div className="flex flex-col items-center justify-center space-y-7 max-w-sm w-full mx-auto">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 01. ANIMATED REPSI R LOGO MARK & SUBTLE ENERGY PULSE          */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="relative w-24 h-20 sm:w-28 sm:h-24 flex items-center justify-center">
          {/* Subtle Orange Energy Pulse (Expands ONCE behind the logo) */}
          <div className="absolute inset-0 rounded-full bg-[#E25822] blur-2xl pointer-events-none animate-repsi-pulse" />

          {/* Logo Container: Fade + Scale from 96% to 100% */}
          <div className="w-full h-full relative z-10 flex items-center justify-center animate-repsi-logo">
            <svg
              viewBox="-25 -5 155 115"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-sm overflow-visible"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="repsiSlashGradLoader" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF7A45" />
                  <stop offset="100%" stopColor="#E25822" />
                </linearGradient>
              </defs>

              {/* 1. Black/Charcoal R Body (Appears first) */}
              <path
                d="M 0 0 L 80 0 C 105 0 118 10 118 30 C 118 46 108 55 92 58 L 120 100 L 86 100 L 62 62 L 32 62 L 32 100 L 0 100 Z M 32 20 L 32 44 L 75 44 C 84 44 90 40 90 32 C 90 24 84 20 75 20 Z"
                fill="#191919"
                className="animate-repsi-body"
              />

              {/* 2. Flame Orange Diagonal Stroke (Follows smoothly with 220ms delay) */}
              <polygon
                points="0,55 30,55 5,100 -20,100"
                fill="url(#repsiSlashGradLoader)"
                className="filter drop-shadow-[0_2px_8px_rgba(226,88,34,0.4)] animate-repsi-slash"
              />
            </svg>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 02. EXACT SCREEN LAYOUT: HEADINGS & STATUS                    */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center space-y-3 w-full text-center">
          {/* R E P S I */}
          <h2 className="font-heading font-black text-xl sm:text-2xl text-[#191919] uppercase tracking-[0.35em] pl-[0.35em] leading-none">
            R E P S I
          </h2>

          {/* GYM MANAGEMENT PLATFORM */}
          <p className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] text-[#858890] uppercase pl-[0.25em]">
            GYM MANAGEMENT PLATFORM
          </p>

          {/* Preparing your workspace... */}
          {message && (
            <p className="text-xs sm:text-sm text-[#555860] font-medium pt-2">
              {message}
            </p>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* 03. PROGRESS INDICATOR (THIN ROUNDED TRACK - NEVER STUCK)     */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="w-48 sm:w-56 h-1 sm:h-1.5 bg-[#E7E4DE] rounded-full overflow-hidden relative shadow-inner mt-2">
            {typeof progress === "number" ? (
              // Actual progress mode
              <div
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#FF7A45] to-[#E25822] rounded-full shadow-[0_0_8px_rgba(226,88,34,0.35)] transition-[width] duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            ) : (
              // Indeterminate smooth continuous sweep (never stuck)
              <div className="absolute top-0 bottom-0 bg-gradient-to-r from-[#E25822] via-[#FF7A45] to-[#E25822] rounded-full shadow-[0_0_8px_rgba(226,88,34,0.35)] animate-repsi-track" />
            )}
          </div>

          {/* Loading status label */}
          <p className="text-[11px] font-mono tracking-wider text-[#858890] uppercase pt-1">
            Loading
          </p>

          {/* Illustrative preview footnote */}
          {showConceptNote && (
            <p className="text-[10px] text-[#A0A3A9] text-center max-w-xs pt-3 font-normal leading-relaxed">
              Concept preview; the progress shown is illustrative, not live REPSI loading progress.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
