"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function PageImageLoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // If user already saw the loader in this tab session, skip immediately
    try {
      if (sessionStorage.getItem("repsi_initial_loaded")) {
        setIsLoading(false);
        return;
      }
    } catch {}

    const totalDuration = 1100; // 1.1s total smooth loading duration
    const startTime = performance.now();
    let animationFrameId: number;

    const update = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / totalDuration);

      // Smooth cubic ease-out curve
      const ease = 1 - Math.pow(1 - t, 3);
      const currentPct = Math.min(100, Math.round(ease * 100));

      setProgress(currentPct);

      if (t < 1) {
        animationFrameId = requestAnimationFrame(update);
      } else {
        // Reached 100%
        try {
          sessionStorage.setItem("repsi_initial_loaded", "true");
        } catch {}

        setTimeout(() => {
          setIsLoading(false);
        }, 220); // Brief hold at 100% for satisfying feedback
      }
    };

    animationFrameId = requestAnimationFrame(update);

    // Hard fallback timeout
    const fallback = setTimeout(() => {
      setProgress(100);
      setIsLoading(false);
    }, totalDuration + 400);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(fallback);
    };
  }, []);

  if (!isLoading) return null;

  // Dynamic status text
  const statusMessage =
    progress < 35
      ? "Initializing Repsi..."
      : progress < 75
      ? "Loading workspace..."
      : progress < 100
      ? "Preparing experience..."
      : "Ready";

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="repsi-page-loader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 0.99,
            transition: { duration: 0.35, ease: "easeInOut" },
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF9F6] text-[#191919] select-none"
          role="status"
          aria-live="polite"
          aria-label="Loading REPSI"
        >
          <div className="flex flex-col items-center justify-center space-y-7 max-w-sm px-6 text-center">
            {/* Animated REPSI R Mark */}
            <div className="relative w-24 h-20 sm:w-28 sm:h-24 flex items-center justify-center">
              {/* Ambient Pulsing Aura */}
              <div className="absolute inset-0 rounded-full bg-[#E25822]/15 blur-2xl animate-pulse pointer-events-none" />

              {/* REPSI Iconic R SVG */}
              <svg
                viewBox="-25 -5 155 115"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full relative z-10 drop-shadow-md overflow-visible animate-in fade-in zoom-in-95 duration-500"
              >
                <defs>
                  <linearGradient id="repsiSlashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
                  fill="url(#repsiSlashGrad)"
                  className="filter drop-shadow-[0_2px_8px_rgba(226,88,34,0.45)]"
                />
              </svg>
            </div>

            {/* Brand Title & Progress Track */}
            <div className="flex flex-col items-center space-y-3.5 w-full">
              <span className="font-heading font-black text-sm tracking-[0.25em] text-[#191919] uppercase">
                REPSI
              </span>

              {/* Progress Track */}
              <div className="w-48 sm:w-56 h-2 bg-[#E7E4DE] rounded-full overflow-hidden relative shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#E25822] via-[#FF6D2E] to-[#E25822] shadow-[0_0_12px_rgba(226,88,34,0.45)] transition-[width] duration-75 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Status Message & Live Percentage */}
              <div className="flex items-center justify-between w-48 sm:w-56 text-[11px] font-mono text-[#858890]">
                <span className="transition-all duration-150 truncate max-w-[120px]">
                  {statusMessage}
                </span>
                <span className="font-bold text-[#E25822] tabular-nums">
                  {progress}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PageImageLoadingScreen;
