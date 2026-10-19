"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface RepsiBrandLoaderProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * Signature R Reveal Loader
 * Displays the official REPSI R logo in the center on #FAF9F6 cream background,
 * with Flame Orange accent slice and a fluid indeterminate progress line.
 */
export function RepsiBrandLoader({
  message = "Loading...",
  fullScreen = true,
  className = "",
}: RepsiBrandLoaderProps) {
  const shouldReduceMotion = useReducedMotion();

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF9F6] text-[#191919] select-none"
    : `flex flex-col items-center justify-center p-8 bg-[#FAF9F6] text-[#191919] select-none ${className}`;

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* REPSI Iconic R Logo Mark */}
        <div className="relative w-24 h-20 sm:w-28 sm:h-24 flex items-center justify-center">
          {/* Ambient Pulsing Aura */}
          <div className="absolute inset-0 rounded-full bg-[#E25822]/15 blur-2xl animate-pulse pointer-events-none" />

          <svg
            viewBox="-25 -5 155 115"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full relative z-10 drop-shadow-md overflow-visible"
          >
            <defs>
              <linearGradient id="repsiSlashGradLoader" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF7A45" />
                <stop offset="100%" stopColor="#E25822" />
              </linearGradient>
            </defs>

            {/* Charcoal Upper R Body & Loop */}
            <path
              d="M 0 0 L 80 0 C 105 0 118 10 118 30 C 118 46 108 55 92 58 L 120 100 L 86 100 L 62 62 L 32 62 L 32 100 L 0 100 Z M 32 20 L 32 44 L 75 44 C 84 44 90 40 90 32 C 90 24 84 20 75 20 Z"
              fill="#191919"
            />

            {/* Signature Flame Orange Diagonal Slash Leg */}
            <polygon
              points="0,55 30,55 5,100 -20,100"
              fill="url(#repsiSlashGradLoader)"
              className="filter drop-shadow-[0_2px_8px_rgba(226,88,34,0.45)]"
            />
          </svg>
        </div>

        {/* Wordmark & Status Line */}
        <div className="flex flex-col items-center space-y-3">
          <span className="font-heading font-black text-sm tracking-[0.25em] text-[#191919] uppercase">
            REPSI
          </span>

          {/* Fluid Indeterminate Flame Orange Progress Line */}
          <div className="w-40 sm:w-48 h-1.5 bg-[#E7E4DE] rounded-full overflow-hidden relative shadow-inner">
            <motion.div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-[#E25822] via-[#FF6D2E] to-[#E25822] rounded-full shadow-[0_0_8px_rgba(226,88,34,0.4)]"
              initial={
                shouldReduceMotion
                  ? { left: 0, right: 0 }
                  : { left: "-40%", width: "40%" }
              }
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      left: ["-40%", "100%"],
                    }
              }
              transition={
                shouldReduceMotion
                  ? {}
                  : {
                      repeat: Infinity,
                      duration: 1.1,
                      ease: "easeInOut",
                    }
              }
            />
          </div>

          {message && (
            <p className="text-xs font-mono text-[#858890] pt-1">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
