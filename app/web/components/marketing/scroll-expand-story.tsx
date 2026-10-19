"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  BellRing,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Users,
} from "lucide-react";

export function ScrollExpandStory() {
  const imageSectionRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Scroll animation starting directly from the image
  const { scrollYProgress } = useScroll({
    target: imageSectionRef,
    offset: ["start end", "center center"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [0.94, 1.0]);
  const imageRadius = useTransform(scrollYProgress, [0, 1], ["32px", "24px"]);

  return (
    <section
      id="reality-of-operations"
      className="relative w-full bg-[#FAF8F5] text-[#17191C] pt-16 sm:pt-20 lg:pt-24 pb-16 sm:pb-24 border-b border-[#E4E2DC] overflow-hidden"
    >
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 01. SECTION HEADER (IN NORMAL DOCUMENT FLOW — NO OVERLAPS)    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10 sm:mb-14">
        {/* 1. Section Label */}
        <div className="mb-3.5">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-[0.16em] uppercase text-[#E25822] bg-[#FDF1EB] border border-[#FACBB7]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E25822] animate-pulse" />
            THE REALITY OF FITNESS OPERATIONS
          </span>
        </div>

        {/* 2. Heading */}
        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[48px] text-[#17191C] tracking-tight leading-[1.12] mb-3.5">
          Behind every great fitness business, <br />
          <span className="text-[#E25822]">there&apos;s a lot to manage.</span>
        </h2>

        {/* 3. Supporting Text */}
        <p className="text-sm sm:text-base text-[#6B6F76] font-normal max-w-xl mx-auto leading-relaxed">
          Scroll down to see the everyday challenges REPSI helps solve.
        </p>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 02. RECEPTION IMAGE: SCROLL REVEAL ANCHOR (LIGHT & VIBRANT)   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div
        ref={imageSectionRef}
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14"
      >
        <motion.div
          style={
            shouldReduceMotion
              ? { borderRadius: "24px" }
              : { scale: imageScale, borderRadius: imageRadius }
          }
          className="relative w-full h-[320px] sm:h-[440px] md:h-[500px] lg:h-[540px] overflow-hidden shadow-xl border border-[#E4E2DC] bg-[#EFECE6]"
        >
          {/* Fitness Reception Photograph with clear focal point */}
          <Image
            src="/images/reception-turnstile.jpg"
            alt="Modern Fitness Facility Reception and Turnstile Entrance"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1100px"
            className="object-cover object-[60%_35%]"
          />

          {/* Gentle warm ambient vignette (keeps photo bright and natural) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

          {/* Clean Floating Badge at bottom */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#E4E2DC] shadow-lg flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-[#E25822] animate-pulse" />
            <span className="text-xs font-bold text-[#17191C]">
              Peak Front-Desk Hours: 7:00 PM
            </span>
          </div>
        </motion.div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 03. THREE OPERATIONAL CHALLENGE CARDS (100% LIGHT THEME)      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#E25822]">
            ✦ Everyday Front Desk Friction
          </span>
          <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#17191C] mt-1">
            Where fitness businesses lose time & revenue.
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {/* Problem 01: Attendance */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="bg-white rounded-2xl border border-[#E4E2DC] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold tracking-wider text-rose-700 uppercase bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                  Problem 01
                </span>
                <span className="text-[11px] text-[#A6A8AC] font-medium">Registers</span>
              </div>

              <h4 className="font-heading font-bold text-base sm:text-lg text-[#17191C] leading-snug mb-2">
                Attendance scattered across registers.
              </h4>

              <p className="text-xs sm:text-[13px] text-[#6B6F76] leading-relaxed mb-4">
                Paper sign-in sheets and reception queues while unpaid drop-ins slip through without active passes.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center gap-2 text-xs text-rose-800 font-medium">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Queue: 6+ members waiting to enter</span>
            </div>
          </motion.div>

          {/* Problem 02: Payments */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="bg-white rounded-2xl border border-[#E4E2DC] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold tracking-wider text-amber-800 uppercase bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  Problem 02
                </span>
                <span className="text-[11px] text-[#A6A8AC] font-medium">Reconciliation</span>
              </div>

              <h4 className="font-heading font-bold text-base sm:text-lg text-[#17191C] leading-snug mb-2">
                Payments that need follow-up.
              </h4>

              <p className="text-xs sm:text-[13px] text-[#6B6F76] leading-relaxed mb-4">
                Chasing UPI screenshots on WhatsApp, verifying cash, and manually calculating revenue after hours.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-2 text-xs text-amber-900 font-medium">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>₹24,500 pending collection this month</span>
            </div>
          </motion.div>

          {/* Problem 03: Renewals */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: 0.25 }}
            className="bg-white rounded-2xl border border-[#E4E2DC] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#E25822] uppercase bg-[#FDF1EB] border border-[#FACBB7] px-2.5 py-1 rounded-full">
                  Problem 03
                </span>
                <span className="text-[11px] text-[#A6A8AC] font-medium">Retention</span>
              </div>

              <h4 className="font-heading font-bold text-base sm:text-lg text-[#17191C] leading-snug mb-2">
                Membership renewals that get missed.
              </h4>

              <p className="text-xs sm:text-[13px] text-[#6B6F76] leading-relaxed mb-4">
                Expired plans continue unbilled because front-desk staff have no automated notification workflow.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#FDF1EB]/70 border border-[#FACBB7] flex items-center gap-2 text-xs text-[#A3432B] font-medium">
              <BellRing className="w-4 h-4 text-[#E25822] shrink-0" />
              <span>18 expired accounts active unbilled</span>
            </div>
          </motion.div>
        </div>

        {/* Transition Link leading to Page 3 */}
        <div className="mt-10 text-center">
          <a
            href="#why-repsi"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#E25822] hover:text-[#AC3A0E] transition-colors"
          >
            <span>See how REPSI turns chaos into clarity</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
