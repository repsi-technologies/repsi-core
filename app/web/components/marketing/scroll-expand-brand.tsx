"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

export function ScrollExpandBrand() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Scroll tracking across the brand reveal section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  // Smooth scroll-driven container dimensions
  // Initial state: small, elegant, rounded container (~360px wide, ~190px high)
  // Final state: wide, prominent brand reveal canvas filling the viewport
  const containerWidth = useTransform(
    scrollYProgress,
    [0.1, 0.95],
    ["360px", "100%"]
  );

  const containerHeight = useTransform(
    scrollYProgress,
    [0.1, 0.95],
    ["200px", "580px"]
  );

  const containerRadius = useTransform(
    scrollYProgress,
    [0.1, 0.95],
    ["36px", "28px"]
  );

  const logoScale = useTransform(
    scrollYProgress,
    [0.1, 0.95],
    [1, 1.85]
  );

  const taglineOpacity = useTransform(
    scrollYProgress,
    [0.65, 0.95],
    [0, 1]
  );

  const taglineY = useTransform(
    scrollYProgress,
    [0.65, 0.95],
    [16, 0]
  );

  const ambientGlowOpacity = useTransform(
    scrollYProgress,
    [0.3, 0.95],
    [0, 0.9]
  );

  return (
    <section
      id="why-repsi"
      ref={containerRef}
      className="relative w-full bg-[#FAF9F6] text-[#191919] py-20 sm:py-28 lg:py-36 border-b border-[#E7E4DE] overflow-hidden"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col items-center justify-center">
        {/* Animated Brand Reveal Container */}
        <motion.div
          style={
            shouldReduceMotion
              ? {
                  width: "100%",
                  height: "540px",
                  borderRadius: "28px",
                }
              : {
                  width: containerWidth,
                  height: containerHeight,
                  borderRadius: containerRadius,
                }
          }
          className="relative bg-white border border-[#E7E4DE] shadow-xl shadow-black/[0.03] overflow-hidden flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16 transition-shadow duration-300"
        >
          {/* Subtle warm ambient radial glows (fades in as container expands) */}
          <motion.div
            style={shouldReduceMotion ? { opacity: 0.8 } : { opacity: ambientGlowOpacity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] bg-gradient-to-r from-[#FFF0EA] via-[#FFF5F1] to-[#FFF0EA] rounded-full blur-3xl pointer-events-none -z-10"
          />
          <motion.div
            style={shouldReduceMotion ? { opacity: 0.6 } : { opacity: ambientGlowOpacity }}
            className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[450px] h-[200px] bg-[#F07858]/10 rounded-full blur-3xl pointer-events-none -z-10"
          />

          {/* Centered Official REPSI Logo */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <motion.div
              style={shouldReduceMotion ? { scale: 1.4 } : { scale: logoScale }}
              className="origin-center transition-transform duration-100 flex items-center justify-center"
            >
              <Image
                src="/logos/logo-dark.png"
                alt="REPSI"
                width={380}
                height={120}
                priority
                className="w-48 sm:w-56 md:w-64 lg:w-72 h-auto object-contain select-none"
              />
            </motion.div>

            {/* Subtle Brand Tagline Revealed on Full Expansion */}
            <motion.div
              style={
                shouldReduceMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: taglineOpacity, y: taglineY }
              }
              className="mt-10 sm:mt-12 text-center select-none"
            >
              <p className="text-xs sm:text-sm md:text-base font-semibold tracking-wider uppercase text-[#62666D]">
                The Operating System for Modern Fitness Businesses
              </p>
              <div className="mt-2.5 mx-auto w-12 h-0.5 rounded-full bg-[#F07858]" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default ScrollExpandBrand;
