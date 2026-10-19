"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface PageImageLoadingScreenProps {
  maxDurationMs?: number;
}

export function PageImageLoadingScreen({
  maxDurationMs = 800,
}: PageImageLoadingScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(25);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // If user already saw the loader in this tab session, skip immediately
    try {
      if (sessionStorage.getItem("repsi_initial_loaded")) {
        setIsLoading(false);
        return;
      }
    } catch {
      // sessionStorage not accessible (e.g. strict private mode)
    }

    let current = 25;
    const intervalTime = 35; // smooth updates
    const totalSteps = Math.max(1, Math.floor(maxDurationMs / intervalTime));
    const stepIncrement = (100 - 25) / totalSteps;

    const interval = setInterval(() => {
      current += stepIncrement;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setProgress(100);

        try {
          sessionStorage.setItem("repsi_initial_loaded", "true");
        } catch {}

        setTimeout(() => {
          setIsLoading(false);
        }, 180);
      } else {
        setProgress(Math.round(current));
      }
    }, intervalTime);

    // Hard fallback: absolutely guarantee removal after maxDurationMs + 300ms
    const fallbackTimer = setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setIsLoading(false);
      try {
        sessionStorage.setItem("repsi_initial_loaded", "true");
      } catch {}
    }, maxDurationMs + 300);

    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimer);
    };
  }, [maxDurationMs]);

  if (!isLoading) return null;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="repsi-page-loader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.35, ease: "easeOut" },
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF9F6] text-[#191919] select-none"
          role="status"
          aria-live="polite"
          aria-label="Loading REPSI application"
        >
          <div className="flex flex-col items-center justify-center space-y-6 max-w-sm px-6 text-center">
            {/* Animated REPSI R Mark */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
              <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-xs"
              >
                {/* Charcoal R Body */}
                <motion.path
                  d="M 28 82 V 18 H 54 C 68 18 78 26 78 38 C 78 50 68 58 54 58 H 28"
                  stroke="#191919"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1, pathLength: 1 }
                      : { opacity: 0, pathLength: 0 }
                  }
                  animate={{ opacity: 1, pathLength: 1 }}
                  transition={{
                    duration: 0.55,
                    delay: shouldReduceMotion ? 0 : 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />

                {/* Signature Coral-Orange Diagonal Slash Leg */}
                <motion.path
                  d="M 50 56 L 76 82"
                  stroke="#C76706"
                  strokeWidth="11"
                  strokeLinecap="round"
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1, pathLength: 1, scale: 1 }
                      : { opacity: 0, pathLength: 0, scale: 0.85 }
                  }
                  animate={{ opacity: 1, pathLength: 1, scale: 1 }}
                  transition={{
                    duration: 0.45,
                    delay: shouldReduceMotion ? 0 : 0.02,
                    ease: "easeOut",
                  }}
                />

                {/* Dot Accent at Leg Origin */}
                <motion.circle
                  cx="50"
                  cy="56"
                  r="2.5"
                  fill="#C76706"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.2 }}
                />
              </svg>
            </div>

            {/* Brand Title & Progress Bar */}
            <div className="flex flex-col items-center space-y-3 w-full">
              <span className="font-heading font-black text-sm tracking-[0.25em] text-[#191919] uppercase">
                REPSI
              </span>

              {/* Progress Track */}
              <div className="w-40 sm:w-48 h-1.5 bg-[#E7E4DE] rounded-full overflow-hidden relative shadow-inner">
                <motion.div
                  className="absolute top-0 bottom-0 left-0 bg-[#C76706] rounded-full"
                  initial={{ width: "25%" }}
                  animate={{ width: `${Math.max(10, progress)}%` }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                />
              </div>

              <div className="flex items-center justify-between w-40 sm:w-48 text-[11px] font-mono text-[#858890]">
                <span>
                  {progress < 100 ? "Loading Repsi..." : "Ready"}
                </span>
                <span className="font-bold text-[#C76706]">{progress}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PageImageLoadingScreen;
