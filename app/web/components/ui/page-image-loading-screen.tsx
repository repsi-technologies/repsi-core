"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface PageImageLoadingScreenProps {
  criticalImages?: string[];
  maxWaitMs?: number;
}

const DEFAULT_CRITICAL_IMAGES = [
  "/images/hero-test.jpg",
  "/images/scattered-records.jpg",
  "/images/manual-attendance.jpg",
  "/images/payment-followup.jpg",
  "/images/renewal-calendar.jpg",
  "/images/gym-sunset-weights.jpg",
  "/logos/logo-dark.png",
];

export function PageImageLoadingScreen({
  criticalImages = DEFAULT_CRITICAL_IMAGES,
  maxWaitMs = 1800,
}: PageImageLoadingScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(20);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let mounted = true;
    let loadedCount = 0;
    const startTime = Date.now();
    const minDisplayMs = 600; // Guarantee the R animation has time to draw smoothly
    const total = criticalImages.length;

    const completeLoading = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDisplayMs - elapsed);
      setProgress(100);

      setTimeout(() => {
        if (mounted) setIsLoading(false);
      }, remaining);
    };

    if (total === 0) {
      completeLoading();
      return;
    }

    const checkComplete = () => {
      loadedCount++;
      if (!mounted) return;
      const pct = Math.min(95, Math.round(20 + (loadedCount / total) * 75));
      setProgress(pct);

      if (loadedCount >= total) {
        completeLoading();
      }
    };

    // Preload each critical image
    criticalImages.forEach((src) => {
      const img = new Image();
      img.src = src;
      if (img.complete) {
        checkComplete();
      } else {
        img.onload = checkComplete;
        img.onerror = checkComplete; // Don't block on 404/network hiccups
      }
    });

    // Safety timeout: ensure loading screen never traps the user
    const timer = setTimeout(() => {
      if (mounted) {
        completeLoading();
      }
    }, maxWaitMs);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [criticalImages, maxWaitMs]);

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="repsi-page-loader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
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
                    delay: shouldReduceMotion ? 0 : 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />

                {/* Signature Coral-Orange Diagonal Slash Leg */}
                <motion.path
                  d="M 50 56 L 76 82"
                  stroke="#F07858"
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
                  fill="#F07858"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.2 }}
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
                  className="absolute top-0 bottom-0 left-0 bg-[#F07858] rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${Math.max(10, progress)}%` }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              </div>

              <div className="flex items-center justify-between w-40 sm:w-48 text-[11px] font-mono text-[#858890]">
                <span>
                  {progress < 100 ? "Loading workspace..." : "Ready"}
                </span>
                <span className="font-bold text-[#F07858]">{progress}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PageImageLoadingScreen;
