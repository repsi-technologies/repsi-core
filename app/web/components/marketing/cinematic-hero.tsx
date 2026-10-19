"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { BlurText } from "@/components/ui/blur-text";

export function CinematicHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Scroll tracking for fade-out of scroll cue and subtle parallax shift
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 700], [0, 60]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToContent = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById("how-it-works") || document.getElementById("dashboard-showcase") || document.getElementById("features");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }
  };

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[100svh] min-h-[640px] bg-[#17191C] overflow-hidden flex items-center"
      aria-label="REPSI Fitness Business Management Hero"
    >
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 01. FULL-BLEED CINEMATIC PHOTOGRAPH BACKGROUND                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <motion.div
        style={{
          y: shouldReduceMotion ? 0 : backgroundY,
        }}
        className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden"
      >
        <div className="relative w-full h-full animate-cinematic-zoom">
          <Image
            src="/images/hero-bg.png"
            alt="REPSI Fitness Management Architecture & Centre"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[72%_center] sm:object-[62%_center] lg:object-center transition-transform duration-700"
          />
        </div>
      </motion.div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 02. REFINED CONTRAST GRADIENT OVERLAYS                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Stronger charcoal gradient on left, smoothly fading right to preserve equipment & lighting */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(23, 25, 28, 0.98) 0%, rgba(23, 25, 28, 0.94) 28%, rgba(23, 25, 28, 0.78) 50%, rgba(23, 25, 28, 0.35) 75%, rgba(23, 25, 28, 0.05) 100%)",
        }}
      />

      {/* Mobile-focused vertical density overlay to guarantee legibility */}
      <div
        className="absolute inset-0 z-10 pointer-events-none sm:hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgba(23, 25, 28, 0.75) 0%, rgba(23, 25, 28, 0.85) 55%, rgba(23, 25, 28, 0.96) 100%)",
        }}
      />

      {/* Top subtle gradient for transparent navbar readability */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(23, 25, 28, 0.7) 0%, rgba(23, 25, 28, 0.25) 15%, transparent 30%)",
        }}
      />

      {/* Bottom gradient blending seamlessly into following section */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, #17191C 0%, rgba(23, 25, 28, 0.85) 6%, rgba(23, 25, 28, 0.2) 20%, transparent 40%)",
        }}
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 03. LEFT-ALIGNED HERO CONTENT (BALANCED 3-LINE HEADLINE)      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-20 sm:pt-24 lg:pt-28 pb-8">
        <div className="max-w-[640px]">
          {/* Eyebrow Badge: Explicit Software Positioning */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 sm:mb-5"
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase text-[#F07858] bg-[#F07858]/10 border border-[#F07858]/25 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F07858] animate-pulse" />
              Fitness Business Management Software
            </span>
          </motion.div>

          {/* Balanced 3-Line Headline with Line-Staggered Blur Text */}
          <h1 className="font-heading font-bold text-3xl sm:text-5xl md:text-6xl lg:text-[64px] xl:text-[68px] text-[#F7F7F5] leading-[1.1] tracking-tight mb-4 sm:mb-5">
            <BlurText
              animateBy="lines"
              segments={[
                {
                  text: "You run your",
                  className: "text-[#F7F7F5]",
                  breakAfter: true,
                },
                {
                  text: "fitness business,",
                  className: "text-[#F7F7F5]",
                  breakAfter: true,
                },
                {
                  text: "we handle the rest.",
                  className: "text-[#F07858]",
                  breakAfter: false,
                },
              ]}
              delay={0.1}
              lineDelay={0.16}
              duration={0.65}
            />
          </h1>

          {/* Supporting Copy */}
          <motion.p
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-sm sm:text-base md:text-lg text-[#F7F7F5]/85 sm:text-[#A6A8AC] leading-relaxed max-w-xl mb-7 sm:mb-8 font-normal"
          >
            Manage members, attendance, memberships and payments from one place, so you can focus on growing your fitness business.
          </motion.p>

          {/* CTA Buttons: Clear Visual Hierarchy */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 mb-8 sm:mb-10"
          >
            {/* Primary CTA: Solid Orange #F07858 with subtle arrow hover */}
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-[#F07858] hover:bg-[#F58F73] text-white text-sm font-semibold transition-all duration-200 shadow-[0_4px_24px_rgba(240,120,88,0.35)] hover:shadow-[0_8px_32px_rgba(240,120,88,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            >
              <span>Get Started Free</span>
              <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            {/* Quieter Secondary CTA: Concrete action "See how it works" */}
            <a
              href="#how-it-works"
              onClick={handleScrollToContent}
              className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-white/15 hover:border-white/30 bg-white/[0.04] hover:bg-white/[0.08] text-[#F7F7F5]/85 hover:text-white text-sm font-medium backdrop-blur-xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            >
              <span>See how it works</span>
            </a>
          </motion.div>

          {/* Micro-Features / Ticker List */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1.5 text-xs sm:text-sm font-medium text-[#A6A8AC]"
          >
            <span className="text-[#F7F7F5]/90 hover:text-white transition-colors">Members</span>
            <span className="text-white/20 select-none">·</span>
            <span className="text-[#F7F7F5]/90 hover:text-white transition-colors">Attendance</span>
            <span className="text-white/20 select-none">·</span>
            <span className="text-[#F7F7F5]/90 hover:text-white transition-colors">Payments</span>
            <span className="text-white/20 select-none">·</span>
            <span className="text-[#F7F7F5]/90 hover:text-white transition-colors">Analytics</span>
          </motion.div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 04. SCROLL CUE (FADES OUT ON SCROLL)                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0.8 } : { opacity: 0, y: 10 }}
        animate={{
          opacity: isScrolled ? 0 : 0.8,
          y: isScrolled ? 8 : 0,
        }}
        transition={{ duration: 0.35, delay: shouldReduceMotion ? 0 : 0.95 }}
        className="absolute bottom-6 sm:bottom-8 left-5 sm:left-8 lg:left-12 z-20 pointer-events-none flex items-center gap-3"
      >
        <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] uppercase text-[#A6A8AC]">
          Scroll to explore
        </span>
        <div className="w-12 h-[1.5px] bg-white/15 relative overflow-hidden rounded-full">
          <div className="absolute top-0 bottom-0 left-0 w-5 bg-[#F07858] rounded-full animate-scroll-cue" />
        </div>
      </motion.div>
    </section>
  );
}
