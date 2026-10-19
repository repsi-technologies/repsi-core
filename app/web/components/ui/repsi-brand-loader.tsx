"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface RepsiBrandLoaderProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * Signature R Reveal Loader (Idea 1)
 * Displays the custom REPSI R logo in the center on #FAF9F6 cream background.
 * The coral-orange diagonal accent draws in first, followed by the charcoal R body,
 * with a thin coral-orange progress line beneath.
 */
export function RepsiBrandLoader({
  message = "Loading workspace...",
  fullScreen = true,
  className = "",
}: RepsiBrandLoaderProps) {
  const shouldReduceMotion = useReducedMotion();

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF9F6] text-[#191919] select-none"
    : `flex flex-col items-center justify-center p-8 bg-[#FAF9F6] text-[#191919] select-none ${className}`;

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <div className="flex flex-col items-center justify-center space-y-5">
        {/* REPSI R Animated Logo */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm"
          >
            {/* Charcoal R Body: Vertical Stem + Upper Loop */}
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
                delay: shouldReduceMotion ? 0 : 0.12,
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

            {/* Subtle glow / dot accent at intersection */}
            <motion.circle
              cx="50"
              cy="56"
              r="2.5"
              fill="#C76706"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.2 }}
            />
          </svg>
        </div>

        {/* Wordmark & Status Line */}
        <div className="flex flex-col items-center space-y-2.5">
          <motion.span
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="font-heading font-black text-sm tracking-[0.2em] text-[#191919] uppercase"
          >
            REPSI
          </motion.span>

          {/* Thin Coral-Orange Progress Line */}
          <div className="w-32 sm:w-36 h-[2.5px] bg-[#E7E4DE] rounded-full overflow-hidden relative">
            <motion.div
              className="absolute top-0 bottom-0 bg-[#C76706] rounded-full"
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
            <motion.p
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-xs font-medium text-[#62666D]"
            >
              {message}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
