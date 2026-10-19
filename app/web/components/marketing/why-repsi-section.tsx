"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import {
  Users,
  CalendarCheck,
  RefreshCw,
  CreditCard,
  QrCode,
  BarChart3,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Activity,
} from "lucide-react";

interface FeatureCategory {
  id: string;
  number: string;
  tag: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  highlights: string[];
}

export function WhyRepsiSection() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  // Scroll Expand animation tracking
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  });

  // Stage 1 to Stage 4 progressive transforms
  const frameWidth = useTransform(scrollYProgress, [0.1, 0.75], ["340px", "100%"]);
  const frameScale = useTransform(scrollYProgress, [0.1, 0.75], [0.94, 1.0]);
  const frameRadius = useTransform(scrollYProgress, [0.1, 0.75], ["28px", "36px"]);
  const logoPillOpacity = useTransform(scrollYProgress, [0.1, 0.45], [1, 0]);
  const platformContentOpacity = useTransform(scrollYProgress, [0.35, 0.8], [0, 1]);
  const platformContentY = useTransform(scrollYProgress, [0.35, 0.8], [24, 0]);

  // The 3 Left-Side Features
  const leftFeatures: FeatureCategory[] = [
    {
      id: "members",
      number: "01",
      tag: "DIRECTORY & PROFILES",
      title: "Member Management",
      description:
        "Organize member profiles, contact details and membership information in one place.",
      icon: Users,
      accentColor: "#C76706",
      accentBg: "#FDF5ED",
      accentBorder: "#F5D2B0",
      highlights: ["Digital profiles", "Instant search", "Emergency contacts"],
    },
    {
      id: "attendance",
      number: "02",
      tag: "ACCESS & LOGS",
      title: "Attendance Tracking",
      description:
        "Record check-ins and review attendance activity through a clear, organized workflow.",
      icon: CalendarCheck,
      accentColor: "#D97706",
      accentBg: "#FFFBEB",
      accentBorder: "#FDE68A",
      highlights: ["Quick check-in", "Daily attendance logs", "Attendance reporting"],
    },
    {
      id: "renewals",
      number: "03",
      tag: "RETENTION & PLANS",
      title: "Memberships and Renewals",
      description:
        "Track membership status, upcoming expiry dates and expired plans.",
      icon: RefreshCw,
      accentColor: "#E11D48",
      accentBg: "#FFF1F2",
      accentBorder: "#FECDD3",
      highlights: ["Membership plans", "Expiry tracking", "Renewal management"],
    },
  ];

  // The 3 Right-Side Features
  const rightFeatures: FeatureCategory[] = [
    {
      id: "payments",
      number: "04",
      tag: "BILLING & DUES",
      title: "Payments and Invoicing",
      description:
        "Review payment records, outstanding dues and submitted receipts.",
      icon: CreditCard,
      accentColor: "#2563EB",
      accentBg: "#EFF6FF",
      accentBorder: "#BFDBFE",
      highlights: ["Payment records", "Pending dues", "Receipt verification"],
    },
    {
      id: "qr-passes",
      number: "05",
      tag: "CONTACTLESS ENTRY",
      title: "Digital QR Member Passes",
      description:
        "Provide a convenient digital member pass for the supported check-in workflow.",
      icon: QrCode,
      accentColor: "#059669",
      accentBg: "#ECFDF5",
      accentBorder: "#A7F3D0",
      highlights: ["Dynamic QR pass", "Turnstile check-in", "100% Paperless"],
    },
    {
      id: "analytics",
      number: "06",
      tag: "BUSINESS INSIGHTS",
      title: "Reports and Analytics",
      description:
        "Review available business activity and operational metrics from one dashboard.",
      icon: BarChart3,
      accentColor: "#7C3AED",
      accentBg: "#F5F3FF",
      accentBorder: "#DDD6FE",
      highlights: ["Attendance summaries", "Membership activity", "Available business reports"],
    },
  ];

  return (
    <section
      id="why-repsi"
      ref={sectionRef}
      className="relative w-full bg-[#FAF9F6] text-[#191919] pt-20 sm:pt-28 lg:pt-32 pb-20 sm:pb-28 border-b border-[#E7E4DE] overflow-hidden"
    >
      {/* Anchor for any #features links */}
      <span id="features" className="absolute -top-16 opacity-0 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 01. SECTION HEADER (SPACIOUS, CLEAN & CENTERED)               */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-4"
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-bold tracking-[0.16em] uppercase text-[#C76706] bg-[#FDF5ED] border border-[#F5D2B0]">
              <Sparkles className="w-3.5 h-3.5 text-[#C76706]" />
              ONE CONNECTED SYSTEM
            </span>
          </motion.div>

          <motion.h2
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[46px] text-[#191919] tracking-tight leading-[1.14] mb-4"
          >
            One connected system. <br className="hidden sm:inline" />
            <span className="text-[#C76706]">Every feature your fitness business needs.</span>
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-base sm:text-lg text-[#62666D] leading-relaxed max-w-2xl mx-auto font-normal"
          >
            REPSI brings your members, attendance, memberships, payments and analytics
            together in one connected workspace.
          </motion.p>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 02. SCROLL EXPAND CANVAS                                      */}
        {/* STAGE 1: LOGO IN CENTER -> EXPANDS PROGRESSIVELY TO FULL GRID */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="relative mb-16 sm:mb-20 flex justify-center">
          <motion.div
            style={
              shouldReduceMotion
                ? { width: "100%", borderRadius: "36px" }
                : {
                    width: frameWidth,
                    scale: frameScale,
                    borderRadius: frameRadius,
                  }
            }
            className="bg-[#F5F2ED] border border-[#E7E4DE] shadow-sm relative overflow-hidden transition-shadow duration-300"
          >
            {/* Ambient Background Radial Glow behind the central logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#FDF5ED] via-[#FDF5ED]/40 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />

            {/* STAGE 1 LOGO REVEAL (Compact Logo Pill visible at the start) */}
            <motion.div
              style={shouldReduceMotion ? { display: "none" } : { opacity: logoPillOpacity }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none z-20"
            >
              <div className="bg-white px-8 py-5 rounded-2xl border-2 border-[#F5D2B0] shadow-lg flex flex-col items-center gap-2">
                <Image
                  src="/logos/logo-text.png"
                  alt="REPSI"
                  width={180}
                  height={50}
                  className="h-9 sm:h-10 w-auto object-contain"
                  priority
                />
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#858890] flex items-center gap-1 mt-1">
                  <span>Scroll to expand platform</span>
                  <ChevronDown className="w-3 h-3 text-[#C76706] animate-bounce" />
                </span>
              </div>
            </motion.div>

            {/* STAGE 3 & 4: FULL PLATFORM CONSTELLATION CONTAINER */}
            <motion.div
              style={
                shouldReduceMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: platformContentOpacity, y: platformContentY }
              }
              className="relative z-10 p-4 sm:p-6 lg:p-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
                {/* ───────────────────────────────────────────────────── */}
                {/* LEFT SIDE: 3 FEATURE CARDS                            */}
                {/* ───────────────────────────────────────────────────── */}
                <div className="lg:col-span-4 flex flex-col gap-4 justify-between">
                  {leftFeatures.map((feat) => {
                    const Icon = feat.icon;
                    const isHovered = activeFeature === feat.id;

                    return (
                      <div
                        key={feat.id}
                        onMouseEnter={() => setActiveFeature(feat.id)}
                        onMouseLeave={() => setActiveFeature(null)}
                        className={`rounded-2xl sm:rounded-3xl bg-white border p-4 sm:p-5 transition-all duration-300 relative group cursor-pointer ${
                          isHovered
                            ? "border-[#C76706] shadow-md -translate-y-0.5"
                            : "border-[#E7E4DE] shadow-2xs hover:border-[#F5D2B0]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105"
                              style={{
                                backgroundColor: feat.accentBg,
                                borderColor: feat.accentBorder,
                                color: feat.accentColor,
                              }}
                            >
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono font-bold tracking-wider text-[#858890] block uppercase">
                                {feat.tag}
                              </span>
                              <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#191919] leading-tight">
                                {feat.title}
                              </h3>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono font-bold text-[#858890] bg-[#FAF9F6] border border-[#E7E4DE] px-2 py-0.5 rounded-full shrink-0">
                            {feat.number}
                          </span>
                        </div>

                        <p className="text-xs text-[#62666D] leading-relaxed mb-3 font-normal">
                          {feat.description}
                        </p>

                        {/* Highlight Pills */}
                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#F0EDE7]">
                          {feat.highlights.map((item) => (
                            <span
                              key={item}
                              className="text-[10px] font-medium text-[#191919] bg-[#FAF9F6] border border-[#E7E4DE] px-2 py-0.5 rounded-md flex items-center gap-1"
                            >
                              <span
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: feat.accentColor }}
                              />
                              <span>{item}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ───────────────────────────────────────────────────── */}
                {/* CENTER: CENTRAL REPSI PLATFORM CARD                   */}
                {/* ───────────────────────────────────────────────────── */}
                <div className="lg:col-span-4 flex flex-col justify-between text-center p-6 sm:p-7 rounded-3xl bg-white border-2 border-[#F5D2B0] shadow-lg relative overflow-hidden group">
                  {/* Gentle top amber scrim */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#FDF5ED]/45 via-transparent to-white pointer-events-none" />

                  <div className="relative z-10 flex flex-col items-center">
                    {/* Top Hub Tag */}
                    <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF5ED] border border-[#F5D2B0] text-[10px] font-mono font-bold uppercase tracking-wider text-[#C76706]">
                      <Sparkles className="w-3 h-3 text-[#C76706]" />
                      <span>THE CENTRAL WORKSPACE</span>
                    </div>

                    {/* Actual REPSI Logo */}
                    <div className="w-48 sm:w-56 h-14 sm:h-16 mx-auto mb-3 flex items-center justify-center">
                      <Image
                        src="/logos/logo-text.png"
                        alt="REPSI Software Platform"
                        width={220}
                        height={60}
                        className="h-10 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                        priority
                      />
                    </div>

                    {/* Heading & Supporting Copy */}
                    <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#191919] leading-snug mb-1.5">
                      Your business. One connected workspace.
                    </h3>
                    <p className="text-xs text-[#62666D] leading-relaxed max-w-xs mb-5 font-normal">
                      Bring everyday operations together with REPSI.
                    </p>

                    {/* Accurate Status Indicator Bar */}
                    <div className="w-full bg-[#FAF9F6] border border-[#E7E4DE] rounded-2xl p-3 space-y-2 mb-5 text-left">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#191919]">Workspace Status</span>
                        <span className="flex items-center gap-1.5 text-emerald-700 font-mono font-bold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live & Connected
                        </span>
                      </div>
                      <div className="h-px bg-[#E7E4DE] w-full" />
                      <div className="grid grid-cols-2 gap-2 text-center pt-0.5">
                        <div className="bg-white rounded-lg p-1.5 border border-[#E7E4DE]">
                          <div className="text-[9px] text-[#62666D]">Sync Engine</div>
                          <div className="text-xs font-bold text-[#191919]">Real-Time</div>
                        </div>
                        <div className="bg-white rounded-lg p-1.5 border border-[#E7E4DE]">
                          <div className="text-[9px] text-[#62666D]">Access</div>
                          <div className="text-xs font-bold text-[#C76706]">Cloud Synced</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Primary Call to Action */}
                  <div className="relative z-10 pt-2">
                    <Link
                      href="/signup"
                      className="w-full inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-[#C76706] hover:bg-[#AD5702] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#C76706]/30 hover:shadow-md transition-all active:scale-95 group"
                    >
                      <span>Get Started with REPSI</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>

                {/* ───────────────────────────────────────────────────── */}
                {/* RIGHT SIDE: 3 FEATURE CARDS                           */}
                {/* ───────────────────────────────────────────────────── */}
                <div className="lg:col-span-4 flex flex-col gap-4 justify-between">
                  {rightFeatures.map((feat) => {
                    const Icon = feat.icon;
                    const isHovered = activeFeature === feat.id;

                    return (
                      <div
                        key={feat.id}
                        onMouseEnter={() => setActiveFeature(feat.id)}
                        onMouseLeave={() => setActiveFeature(null)}
                        className={`rounded-2xl sm:rounded-3xl bg-white border p-4 sm:p-5 transition-all duration-300 relative group cursor-pointer ${
                          isHovered
                            ? "border-[#C76706] shadow-md -translate-y-0.5"
                            : "border-[#E7E4DE] shadow-2xs hover:border-[#F5D2B0]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105"
                              style={{
                                backgroundColor: feat.accentBg,
                                borderColor: feat.accentBorder,
                                color: feat.accentColor,
                              }}
                            >
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono font-bold tracking-wider text-[#858890] block uppercase">
                                {feat.tag}
                              </span>
                              <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#191919] leading-tight">
                                {feat.title}
                              </h3>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono font-bold text-[#858890] bg-[#FAF9F6] border border-[#E7E4DE] px-2 py-0.5 rounded-full shrink-0">
                            {feat.number}
                          </span>
                        </div>

                        <p className="text-xs text-[#62666D] leading-relaxed mb-3 font-normal">
                          {feat.description}
                        </p>

                        {/* Highlight Pills */}
                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#F0EDE7]">
                          {feat.highlights.map((item) => (
                            <span
                              key={item}
                              className="text-[10px] font-medium text-[#191919] bg-[#FAF9F6] border border-[#E7E4DE] px-2 py-0.5 rounded-md flex items-center gap-1"
                            >
                              <span
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: feat.accentColor }}
                              />
                              <span>{item}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 03. CLOSING CALL TO ACTION                                    */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-[#E7E4DE] p-7 sm:p-10 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#191919]">
              Replace chaos with complete operational control.
            </h3>
            <p className="text-xs sm:text-sm text-[#62666D]">
              Start managing members, attendance, memberships, and payments with REPSI today.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-full bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#E7E4DE] text-[#191919] text-xs sm:text-sm font-semibold transition-all active:scale-95"
            >
              <span>View Pricing Plans</span>
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-[#C76706] hover:bg-[#AD5702] text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm shadow-[#C76706]/25 hover:shadow-md active:scale-95 group"
            >
              <span>Start for Free →</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
