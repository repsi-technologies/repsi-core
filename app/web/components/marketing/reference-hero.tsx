"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";
import { motion, useReducedMotion } from "framer-motion";
import {
  Users,
  CalendarCheck,
  CreditCard,
  ArrowRight,
  Search,
  Bell,
  CheckCircle2,
  TrendingUp,
  Activity,
  Dumbbell,
  Receipt,
  Settings,
  LayoutDashboard,
  BarChart3,
  QrCode,
  ShieldCheck,
  Flame,
  Star,
  Wifi,
  Battery,
} from "lucide-react";

import { useTranslation } from "@/lib/i18n";

export function ReferenceHero() {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [showPlayStoreModal, setShowPlayStoreModal] = useState(false);

  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full bg-[#FAF9F6] text-[#191919] pt-24 sm:pt-28 lg:pt-32 pb-14 sm:pb-20 border-b border-[#E7E4DE] overflow-hidden">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 01. UPPER-RIGHT CINEMATIC RECEPTION PHOTOGRAPH WITH S-CURVE    */}
      {/* Extends to top-0 behind the transparent navbar overlay        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="hidden lg:block absolute right-0 top-0 w-[50%] xl:w-[48%] h-[480px] lg:h-[510px] xl:h-[550px] pointer-events-none select-none z-0">
        {/* Organic SVG Clipped Container */}
        <div
          className="relative w-full h-full"
          style={{
            clipPath: "url(#hero-organic-clip)",
          }}
        >
          <ImageWithSkeleton
            src="/images/hero-test.jpg"
            alt="REPSI Fitness Center Reception & Operations Hub"
            fill
            priority
            sizes="50vw"
            className="object-cover object-[60%_35%]"
          />

          {/* Gentle top scrim for navbar contrast + ambient gradient for smooth integration */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/20 pointer-events-none" />

          {/* Typographic Wall Quote from reference */}
          <div className="absolute top-28 left-16 select-none pointer-events-none opacity-50 font-heading text-[10px] xl:text-[11px] font-black tracking-widest text-white/90 leading-tight uppercase hidden xl:block">
            STRONGER<br />PEOPLE<br />BUILD<br />BRIGHTER<br />DAYS
          </div>
        </div>

        {/* Coral Orange Border along the Organic Boundary */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 10,0 C 4,18 -1,36 2,52 C 5,68 22,80 42,86 C 65,92 82,88 94,96 C 98,98 100,100 100,100"
            fill="none"
            stroke="#E25822"
            strokeWidth="3.5"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_8px_rgba(226, 88, 34,0.4)]"
          />
        </svg>
      </div>

      {/* SVG Clip Path Definition for Organic Boundary */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="hero-organic-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0.10,0 C 0.04,0.18 -0.01,0.36 0.02,0.52 C 0.05,0.68 0.22,0.80 0.42,0.86 C 0.65,0.92 0.82,0.88 0.94,0.96 C 0.98,0.98 1,1 1,1 L 1,0 Z" />
          </clipPath>
        </defs>
      </svg>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 w-full">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 02. TOP ROW: LEFT HEADLINE, SUPPORTING COPY & CTAS            */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-6 sm:mb-8">
          {/* Left Text Column */}
          <div className="lg:col-span-7 xl:col-span-7 max-w-2xl pt-2 sm:pt-4">
            {/* Page topic for search engines and screen readers; the display line below is the visual headline. */}
            <h1 className="mb-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#AC3A0E]">
              {t("hero.seo_h1", "Gym management software for gyms, studios & personal trainers")}
            </h1>

            {/* Headline — rendered visible on the server (no fade-in) because it is the LCP element. */}
            <p
              className="display-heading font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[40px] xl:text-[46px] 2xl:text-[50px] text-[#191919] leading-[1.08] tracking-tight mb-3 sm:mb-3.5"
            >
              {t("hero.headline_part1", "You run your")} <br />
              {t("hero.headline_part2", "fitness business,")} <br />
              <span className="text-[#E25822]">
                {t("hero.headline_part3", "we handle the")}{" "}
                <span className="relative inline-block whitespace-nowrap">
                  {t("hero.headline_accent", "rest.")}
                  <svg
                    className="absolute -bottom-1.5 sm:-bottom-2 left-0 w-full h-2.5 sm:h-3 text-[#E25822] overflow-visible pointer-events-none"
                    viewBox="0 0 100 12"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M 2 8 L 14 2 L 26 10 L 38 2 L 50 10 L 62 2 L 74 10 L 86 2 L 98 8"
                      stroke="currentColor"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </span>
            </p>

            {/* Supporting Copy */}
            <motion.p
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="text-xs sm:text-sm lg:text-[13px] xl:text-sm text-[#62666D] leading-relaxed max-w-xl mb-4 sm:mb-5 font-normal"
            >
              {t("hero.subheading", "Members, attendance, memberships and payments. Everything in one place, so you can focus on growing your business.")}
            </motion.p>

            {/* CTA Buttons Row: Side by Side on all screen sizes */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="flex flex-row items-center gap-2 sm:gap-3 mb-4 sm:mb-5 max-w-full"
            >
              {/* Primary CTA: Solid Coral Orange */}
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3.5 sm:px-6 rounded-full bg-[#E25822] hover:bg-[#C94715] text-white text-xs sm:text-sm font-semibold shrink-0 whitespace-nowrap transition-all duration-200 shadow-sm shadow-[#E25822]/30 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                <span>{t("hero.cta_primary", "Get Started Free")}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>

              {/* Secondary CTA: White Pill */}
              <a
                href="#why-repsi"
                onClick={(e) => handleScrollToSection(e, "why-repsi")}
                className="group inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-5 rounded-full bg-white hover:bg-[#F5F2ED] border border-[#E7E4DE] text-[#191919] text-xs sm:text-sm font-semibold shrink-0 whitespace-nowrap shadow-2xs hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 active:scale-[0.98]"
              >
                <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-[#E25822] text-white flex items-center justify-center text-[8px] sm:text-[9px] pl-0.5 transition-transform duration-200 group-hover:scale-110">
                  ▶
                </span>
                <span>{t("hero.cta_secondary", "See how it works")}</span>
              </a>
            </motion.div>

            {/* Social-Proof Row: Compact, Authentic & Aligned beneath CTA buttons */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center gap-3 pt-1 sm:pt-2 flex-wrap"
            >
              {/* Play Store pill button with icon and text (green dot removed) */}
              <button
                type="button"
                onClick={() => setShowPlayStoreModal(true)}
                title={t("hero.play_store_title", "Google Play Store App (Coming Soon)")}
                aria-label={t("hero.play_store_title", "Google Play Store App (Coming Soon)")}
                className="h-8.5 sm:h-9 px-3 rounded-full bg-white hover:bg-[#FAF9F6] border border-[#E7E4DE] hover:border-[#E25822] shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer text-[#191919]"
              >
                {/* Official Google Play authentic 4-color triangle */}
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3.609 1.814L13.793 12 3.61 22.186c-.352-.338-.61-.84-.61-1.464V3.278c0-.624.258-1.126.61-1.464z" fill="#00D2FF"/>
                  <path d="M17.18 8.613l-3.387 3.387L3.609 1.814c.266-.145.58-.214.914-.214.508 0 1.016.148 1.488.422l11.169 6.591z" fill="#00F076"/>
                  <path d="M17.18 15.387L5.011 21.978c-.472.274-.98.422-1.488.422-.334 0-.648-.069-.914-.214L13.793 12l3.387 3.387z" fill="#FF3A44"/>
                  <path d="M21.055 10.875l-3.875-2.262-3.387 3.387 3.387 3.387 3.875-2.262c.703-.414 1.145-1.16 1.145-1.975 0-.816-.442-1.562-1.145-1.975z" fill="#FFC800"/>
                </svg>
                <span className="font-heading font-bold text-[11px] sm:text-xs tracking-tight">{t("hero.play_store", "Play Store")}</span>
              </button>

              {/* Overlapping Brand Mark / Fitness Logo Avatars with subtle borders */}
              <div className="flex -space-x-2.5 items-center">
                {/* Brand Mark 1: Coral Barbell */}
                <div
                  className="w-8 h-8 rounded-full bg-[#FDF1EB] border-2 border-white shadow-2xs flex items-center justify-center text-[#E25822] ring-1 ring-black/5"
                  title="Fitness Studio"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                </div>

                {/* Brand Mark 2: Warm Charcoal Pulse */}
                <div
                  className="w-8 h-8 rounded-full bg-[#F5F2ED] border-2 border-white shadow-2xs flex items-center justify-center text-[#191919] ring-1 ring-black/5"
                  title="CrossFit & Strength"
                >
                  <Activity className="w-3.5 h-3.5" />
                </div>

                {/* Brand Mark 3: Amber Energy */}
                <div
                  className="w-8 h-8 rounded-full bg-[#FEF3C7] border-2 border-white shadow-2xs flex items-center justify-center text-[#D97706] ring-1 ring-black/5"
                  title="Health & Wellness Club"
                >
                  <Flame className="w-3.5 h-3.5" />
                </div>

                {/* Brand Mark 4: Emerald Verified Facility */}
                <div
                  className="w-8 h-8 rounded-full bg-[#E8F5E9] border-2 border-white shadow-2xs flex items-center justify-center text-[#2E7D32] ring-1 ring-black/5"
                  title="Gym & Aquatic Center"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Social-Proof Text: Authentic & Verified */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-[13px] font-bold text-[#191919] tracking-tight">
                    {t("hero.trusted_by", "Trusted by fitness businesses")}
                  </span>
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-[#62666D] font-normal leading-tight">
                  {t("hero.built_for", "Built for fitness business owners")}
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 03. LOWER ROW: NOTICEABLY TALLER MONITOR & TALLER IPHONE      */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch pt-2">
          {/* Left Column: Balanced Desktop Monitor Chassis & Foreground iPhone */}
          <div className="lg:col-span-7 bg-[#F5F2ED] border border-[#E7E4DE] rounded-[28px] sm:rounded-[32px] p-4 sm:p-5 lg:p-6 pb-6 sm:pb-7 relative shadow-sm flex flex-col justify-between">
            {/* Side-by-Side layout on mobile, docked overlay on desktop */}
            <div className="relative w-full flex flex-row items-end gap-2 xs:gap-3 sm:block sm:relative">
              {/* 1. BALANCED DESKTOP MONITOR MOCKUP CHASSIS */}
              <div className="flex-1 min-w-0 sm:w-full">
                {/* Monitor Screen Frame */}
                <div className="rounded-[16px] sm:rounded-[22px] border-[4px] sm:border-[7px] border-[#222429] bg-[#1E2024] shadow-[0_20px_45px_-10px_rgba(0,0,0,0.2)] overflow-hidden relative">
                  {/* Monitor Top Bezel with Camera Dot */}
                  <div className="w-full bg-[#222429] py-0.5 sm:py-1 flex items-center justify-center">
                    <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-[#4A4D55] ring-1 ring-black/50" />
                  </div>

                  {/* Monitor Screen: Actual Light-Theme REPSI Dashboard */}
                  <div className="bg-white p-2 sm:p-3 text-[#191919] select-none">
                  {/* Dashboard Header Bar - 100% Unobstructed across entire width */}
                  <div className="flex items-center justify-between border-b border-[#E7E4DE] pb-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 mr-1">
                        <span className="w-2 h-2 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                        <span className="w-2 h-2 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                        <span className="w-2 h-2 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                      </div>
                      <span className="font-heading font-extrabold text-xs tracking-wider text-[#191919]">
                        REPSI
                      </span>
                      <span className="hidden sm:inline-block text-[10px] text-[#858890] font-medium border-l border-[#E7E4DE] pl-2">
                        {t("hero.monitor_branch", "Central Branch • Main Facility")}
                      </span>
                    </div>

                    {/* Quick Search Bar */}
                    <div className="hidden sm:flex items-center gap-1.5 bg-[#FAF9F6] border border-[#E7E4DE] rounded-md px-2 py-1 text-[10px] text-[#62666D] w-32 md:w-36 lg:w-40">
                      <Search className="w-3 h-3 text-[#858890]" />
                      <span className="truncate">{t("hero.monitor_search", "Search members, dues...")}</span>
                    </div>

                    {/* Live Status Indicator */}
                    <div className="flex items-center gap-1 bg-[#FAF9F6] px-1.5 sm:px-2 py-0.5 rounded-full border border-[#E7E4DE] shrink-0 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-[8px] sm:text-[9.5px] font-semibold text-[#191919] whitespace-nowrap">
                        <span className="sm:hidden">{t("hero.monitor_live", "342 live")}</span>
                        <span className="hidden sm:inline">{t("hero.monitor_live_full", "Live: 342 active")}</span>
                      </span>
                    </div>
                  </div>

                  {/* Dashboard Body: Sidebar + Main Content Panels */}
                  <div className="grid grid-cols-12 gap-2 sm:gap-2.5">
                    {/* Mini Sidebar Navigation */}
                    <div className="hidden sm:flex sm:col-span-3 flex-col gap-0.5 border-r border-[#E7E4DE] pr-2">
                      <div className="bg-[#E25822] text-white text-[9.5px] font-semibold px-2 py-1 rounded-lg flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-1.5">
                          <LayoutDashboard className="w-3 h-3" />
                          <span>Overview</span>
                        </div>
                      </div>
                      <div className="text-[9.5px] text-[#62666D] hover:bg-[#FAF9F6] px-2 py-1 rounded-lg flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3" />
                          <span>Members</span>
                        </div>
                        <span className="text-[7.5px] font-mono font-bold bg-[#FAF9F6] px-1 rounded">342</span>
                      </div>
                      <div className="text-[9.5px] text-[#62666D] hover:bg-[#FAF9F6] px-2 py-1 rounded-lg flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-1.5">
                          <CalendarCheck className="w-3 h-3" />
                          <span>Attendance</span>
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <div className="text-[9.5px] text-[#62666D] hover:bg-[#FAF9F6] px-2 py-1 rounded-lg flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3 h-3" />
                          <span>Payments</span>
                        </div>
                      </div>
                      <div className="text-[9.5px] text-[#62666D] hover:bg-[#FAF9F6] px-2 py-1 rounded-lg flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-1.5">
                          <BarChart3 className="w-3 h-3" />
                          <span>Analytics</span>
                        </div>
                      </div>
                      <div className="text-[9.5px] text-[#62666D] hover:bg-[#FAF9F6] px-2 py-1 rounded-lg flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-1.5">
                          <Settings className="w-3 h-3" />
                          <span>Settings</span>
                        </div>
                      </div>

                      {/* Sidebar Footer Status */}
                      <div className="mt-auto pt-2 border-t border-[#F0EDE7] text-[7.5px] text-[#858890] flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Cloud Synced</span>
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="col-span-12 sm:col-span-9 space-y-1.5 sm:space-y-2">
                      {/* Metric Cards Row - 3 beautifully spaced cards with 100% visibility */}
                      <div className="grid grid-cols-3 gap-1 sm:gap-1.5 w-full sm:max-w-[64%]">
                        <div className="bg-[#FAF9F6] p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-[#E7E4DE]">
                          <div className="text-[7.5px] sm:text-[8.5px] text-[#62666D]">{t("hero.monitor_members", "Members")}</div>
                          <div className="text-[11px] sm:text-[13px] font-bold font-heading text-[#191919]">342</div>
                          <span className="text-[6.5px] sm:text-[7.5px] font-bold text-emerald-700">+12%</span>
                        </div>
                        <div className="bg-[#FAF9F6] p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-[#E7E4DE]">
                          <div className="text-[7.5px] sm:text-[8.5px] text-[#62666D]">{t("hero.monitor_checkins", "Check-ins")}</div>
                          <div className="text-[11px] sm:text-[13px] font-bold font-heading text-[#191919]">118</div>
                          <span className="text-[6.5px] sm:text-[7.5px] font-bold text-emerald-700">{t("hero.phone_active", "Live")}</span>
                        </div>
                        <div className="bg-[#FAF9F6] p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-[#E7E4DE]">
                          <div className="text-[7.5px] sm:text-[8.5px] text-[#62666D]">{t("hero.monitor_collection", "Collection")}</div>
                          <div className="text-[11px] sm:text-[13px] font-bold font-heading text-[#191919]">₹48.5K</div>
                          <span className="text-[6.5px] sm:text-[7.5px] font-bold text-emerald-700">{t("hero.monitor_today", "Today")}</span>
                        </div>
                      </div>

                      {/* Growth Trendline & Real-Time Sync Stream */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-0.5">
                        {/* Attendance Chart */}
                        <div className="sm:col-span-7 bg-[#FAF9F6] p-1.5 sm:p-2 rounded-xl border border-[#E7E4DE] flex flex-col justify-between">
                          <div className="flex items-center justify-between text-[8px] sm:text-[9px] mb-1">
                            <span className="font-bold text-[#191919] truncate">{t("hero.monitor_attendance", "Attendance")}</span>
                            <span className="text-[#E25822] font-mono font-bold text-[7.5px] sm:text-[9px] shrink-0">{t("hero.monitor_attendance_change", "+28 today")}</span>
                          </div>
                          <div className="h-12 sm:h-18 w-full relative">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 65">
                              <defs>
                                <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#E25822" stopOpacity="0.3" />
                                  <stop offset="100%" stopColor="#E25822" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              <line x1="0" y1="15" x2="200" y2="15" stroke="#E7E4DE" strokeDasharray="3 3" />
                              <line x1="0" y1="35" x2="200" y2="35" stroke="#E7E4DE" strokeDasharray="3 3" />
                              <line x1="0" y1="55" x2="200" y2="55" stroke="#E7E4DE" strokeDasharray="3 3" />

                              <path
                                d="M 0,50 Q 30,44 60,32 T 120,22 T 160,15 T 200,8 L 200,65 L 0,65 Z"
                                fill="url(#heroGradient)"
                              />
                              <path
                                d="M 0,50 Q 30,44 60,32 T 120,22 T 160,15 T 200,8"
                                fill="none"
                                stroke="#E25822"
                                strokeWidth="2.5"
                              />
                              <circle cx="200" cy="8" r="2.5" fill="#E25822" />
                            </svg>
                          </div>
                          <div className="flex justify-between text-[6px] sm:text-[6.5px] text-[#858890] font-mono pt-1 border-t border-[#E7E4DE]">
                            <span>Mon</span>
                            <span>Wed</span>
                            <span>Fri</span>
                            <span className="font-bold text-[#E25822]">{t("hero.monitor_today", "Today")}</span>
                          </div>
                        </div>

                        {/* Recent Operations Panel (desktop only to keep mobile side-by-side heights balanced) */}
                        <div className="hidden sm:flex sm:col-span-5 bg-[#FAF9F6] p-2 rounded-xl border border-[#E7E4DE] space-y-1.5 text-[8.5px] flex-col justify-between">
                          <span className="font-bold text-[#191919] block text-[9.5px]">{t("hero.monitor_turnstile_live", "Turnstile 01 Live")}</span>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[#191919]">
                              <span className="truncate font-medium">Arjun Kumar</span>
                              <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded text-[7.5px]">{t("hero.monitor_pass_verified", "Pass Verified")}</span>
                            </div>
                            <div className="flex justify-between items-center text-[#191919]">
                              <span className="truncate font-medium">Pooja V.</span>
                              <span className="text-[#E25822] font-semibold bg-[#FDF1EB] px-1.5 py-0.2 rounded text-[7.5px]">{t("hero.monitor_renewed", "Renewed")}</span>
                            </div>
                            <div className="flex justify-between items-center text-[#191919]">
                              <span className="truncate font-medium">Rahul M.</span>
                              <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded text-[7.5px]">{t("hero.monitor_due", "Due 3d")}</span>
                            </div>
                          </div>
                          <div className="text-[6.5px] text-[#858890] text-center pt-0.5 border-t border-[#E7E4DE]">
                            {t("hero.monitor_instant_sync", "Instant Mobile Sync Active")}
                          </div>
                        </div>
                      </div>

                      {/* Operational Quick Status Strip (desktop only) */}
                      <div className="hidden sm:flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5 text-[7.5px] w-full sm:max-w-[65%]">
                        <div className="bg-[#FAF9F6] px-2 py-0.5 rounded-lg border border-[#E7E4DE] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="truncate font-medium text-[#191919]">{t("hero.monitor_turnstile_online", "Gate 01: Turnstile Online")}</span>
                        </div>
                        <div className="bg-[#FAF9F6] px-2 py-0.5 rounded-lg border border-[#E7E4DE] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="truncate font-medium text-[#191919]">{t("hero.monitor_reminders_sent", "5 Due Reminders Sent")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monitor Stand: Desktop only, keeps bottom aligned on mobile side-by-side */}
              <div className="hidden sm:flex flex-col items-center">
                {/* Stand Neck */}
                <div className="w-12 sm:w-16 h-3 sm:h-3.5 bg-gradient-to-b from-[#B8B5AD] to-[#9C9992] shadow-inner" />
                {/* Stand Base */}
                <div className="w-36 sm:w-48 h-2 sm:h-2.5 bg-gradient-to-r from-[#D5D2CA] via-[#ECE9E2] to-[#D5D2CA] rounded-full shadow-xs border-t border-white/60" />
              </div>
            </div>

              {/* 2. HARMONIZED FOREGROUND IPHONE MOCKUP */}
              {/* Perfectly proportioned, placed side-by-side on mobile, anchored at lower right on desktop */}
              <div className="w-[120px] xs:w-[135px] sm:w-[165px] md:w-[180px] lg:w-[195px] shrink-0 sm:absolute sm:right-2 md:right-3 lg:right-4 sm:-bottom-1.5 md:-bottom-2 lg:-bottom-2.5 rounded-[24px] sm:rounded-[38px] border-[4px] sm:border-[6px] border-[#222429] bg-white shadow-[0_24px_50px_-10px_rgba(0,0,0,0.32)] z-20 overflow-hidden text-[#191919] ring-1 ring-black/10 select-none">
                {/* Dynamic Island & Speaker */}
                <div className="w-full pt-1.5 pb-1 flex justify-center bg-white">
                  <div className="w-14 h-2 bg-[#1A1A1A] rounded-full flex items-center justify-end pr-1">
                    <div className="w-1 h-1 rounded-full bg-[#333]" />
                  </div>
                </div>

                {/* Status Bar */}
                <div className="px-3 flex items-center justify-between text-[7px] text-[#62666D] font-semibold">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <Wifi className="w-2.5 h-2.5" />
                    <Battery className="w-3 h-3" />
                  </div>
                </div>

                {/* iPhone App Content (High Legibility Member Pass) */}
                <div className="p-1.5 sm:p-2.5 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[8px] sm:text-[9.5px] text-[#191919]">{t("hero.phone_digital_pass", "Digital Pass")}</span>
                    <span className="text-[6px] sm:text-[7px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                      {t("hero.phone_active", "Active")}
                    </span>
                  </div>

                  {/* QR Card */}
                  <div className="bg-[#FAF9F6] border border-[#E7E4DE] rounded-xl p-1.5 sm:p-2 text-center space-y-0.5 sm:space-y-1">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto bg-white border border-[#E7E4DE] rounded-lg p-0.5 sm:p-1 flex items-center justify-center shadow-2xs">
                      <QrCode className="w-8 h-8 sm:w-11 sm:h-11 text-[#191919]" />
                    </div>
                    <div className="text-[10px] font-bold text-[#191919] leading-tight pt-0.5">Arjun Kumar</div>
                    <div className="text-[7.5px] text-[#62666D]">REP-8842 • {t("hero.phone_pass_type", "Annual Pass")}</div>
                    <div className="text-[6.5px] text-emerald-700 font-medium">{t("hero.phone_valid_thru", "Valid thru Nov 2026")}</div>
                  </div>

                  {/* Verified Entry Badge */}
                  <div className="bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg flex items-center justify-between text-[7px] text-emerald-800 font-medium">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      <span>{t("hero.phone_verified_entry", "Turnstile 01 Verified")}</span>
                    </span>
                    <span className="font-mono text-[7px]">08:42 AM</span>
                  </div>

                  {/* Member Stats Snippet */}
                  <div className="grid grid-cols-2 gap-1 text-center pt-0.5">
                    <div className="bg-[#FAF9F6] p-1 rounded border border-[#E7E4DE]">
                      <div className="text-[6.5px] text-[#858890]">{t("hero.phone_workouts", "Workouts")}</div>
                      <div className="text-[8.5px] font-bold text-[#191919]">{t("hero.phone_workouts_count", "4 this wk")}</div>
                    </div>
                    <div className="bg-[#FAF9F6] p-1 rounded border border-[#E7E4DE]">
                      <div className="text-[6.5px] text-[#858890]">{t("hero.phone_dues", "Dues")}</div>
                      <div className="text-[8.5px] font-bold text-emerald-700">{t("hero.phone_dues_paid", "₹0 (Paid)")}</div>
                    </div>
                  </div>

                  {/* Mobile Nav Tabs */}
                  <div className="flex items-center justify-around pt-1 border-t border-[#E7E4DE] text-[7.5px] text-[#858890]">
                    <span className="font-bold text-[#E25822]">{t("hero.phone_tab_pass", "Pass")}</span>
                    <span>{t("hero.phone_tab_activity", "Activity")}</span>
                    <span>{t("hero.phone_tab_workouts", "Workouts")}</span>
                    <span>{t("hero.phone_tab_profile", "Profile")}</span>
                  </div>
                </div>

                {/* iPhone Bottom Home Indicator Bar */}
                <div className="w-full pb-1.5 pt-0.5 flex justify-center bg-white">
                  <div className="w-16 h-0.5 bg-[#1A1A1A]/70 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Primary Coral Orange Promotional Card */}
          <div className="lg:col-span-5 bg-[#E25822] rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 lg:p-6 xl:p-7 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center h-full">
              {/* Text Area */}
              <div className="md:col-span-7 space-y-3">

                <h3 className="font-heading font-extrabold text-xl sm:text-2xl lg:text-[23px] xl:text-[26px] leading-tight text-white">
                  {t("hero.promo_headline_1", "Run your")} <br />
                  {t("hero.promo_headline_2", "fitness business")} <br />
                  <span className="italic font-serif font-normal text-[#FDF1EB]">{t("hero.promo_headline_smarter", "smarter.")}</span>
                </h3>

                <p className="text-xs text-white/90 leading-relaxed font-normal">
                  {t("hero.promo_desc", "Less manual work, fewer missed payments, and happier members — all with REPSI.")}
                </p>

                {/* 3 Verified Operational Capabilities */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20">
                  <div>
                    <div className="text-xs sm:text-sm font-bold font-heading text-white">{t("hero.promo_feat_allinone", "All-in-One")}</div>
                    <div className="text-[9px] text-white/80 leading-tight">{t("hero.promo_feat_allinone_desc", "Members & dues")}</div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold font-heading text-white">{t("hero.promo_feat_digital", "100% Digital")}</div>
                    <div className="text-[9px] text-white/80 leading-tight">{t("hero.promo_feat_digital_desc", "QR check-ins")}</div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold font-heading text-white">{t("hero.promo_feat_cloud", "Cloud Sync")}</div>
                    <div className="text-[9px] text-white/80 leading-tight">{t("hero.promo_feat_cloud_desc", "Instant updates")}</div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1.5 bg-white text-[#E25822] px-5 py-2 rounded-full font-bold text-xs hover:bg-[#FAF9F6] transition-all shadow-sm active:scale-95 group"
                  >
                    <span>{t("hero.promo_cta", "Explore REPSI")}</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                  </Link>
                </div>
              </div>

              {/* Gym Sunset Weights Photo */}
              <div className="md:col-span-5 h-[180px] sm:h-[205px] lg:h-[230px] xl:h-[255px] rounded-2xl overflow-hidden relative shadow-md">
                <Image
                  src="/images/gym-sunset-weights.jpg"
                  alt="Modern Gym Weights Sunset Interior"
                  fill
                  className="object-cover object-center"
                />

                {/* Floating Bottom Badge */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-sm border border-black/5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#FDF1EB] text-[#E25822] flex items-center justify-center shrink-0 border border-[#FACBB7]">
                    <BarChart3 className="w-3.5 h-3.5 text-[#E25822]" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[#191919] leading-tight">{t("hero.promo_growth", "Real growth")}</div>
                    <div className="text-[9px] text-[#62666D] leading-tight">{t("hero.promo_results", "Real results")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Play Store "Coming Soon" Popup Modal */}
      {showPlayStoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#E7E4DE] text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF9F6] border border-[#E7E4DE] flex items-center justify-center mx-auto shadow-2xs">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3.609 1.814L13.793 12 3.61 22.186c-.352-.338-.61-.84-.61-1.464V3.278c0-.624.258-1.126.61-1.464z" fill="#00D2FF"/>
                <path d="M17.18 8.613l-3.387 3.387L3.609 1.814c.266-.145.58-.214.914-.214.508 0 1.016.148 1.488.422l11.169 6.591z" fill="#00F076"/>
                <path d="M17.18 15.387L5.011 21.978c-.472.274-.98.422-1.488.422-.334 0-.648-.069-.914-.214L13.793 12l3.387 3.387z" fill="#FF3A44"/>
                <path d="M21.055 10.875l-3.875-2.262-3.387 3.387 3.387 3.387 3.875-2.262c.703-.414 1.145-1.16 1.145-1.975 0-.816-.442-1.562-1.145-1.975z" fill="#FFC800"/>
              </svg>
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#E25822] bg-[#FDF1EB] border border-[#FACBB7] px-3 py-1 rounded-full">
                {t("hero.modal_badge", "Google Play Store")}
              </span>
              <h3 className="font-heading font-extrabold text-xl text-[#191919] mt-3">
                {t("hero.modal_title", "Android App Coming Soon!")}
              </h3>
              <p className="text-xs text-[#62666D] mt-2 leading-relaxed">
                {t("hero.modal_desc", "The REPSI mobile app is in final review and will be available on the Play Store shortly. You can use REPSI on any browser right now with zero installation!")}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/download"
                onClick={() => setShowPlayStoreModal(false)}
                className="w-full h-10 rounded-full bg-[#E25822] hover:bg-[#C94715] text-white text-xs font-semibold flex items-center justify-center transition-all shadow-sm"
              >
                {t("hero.modal_view_downloads", "View Downloads & Web App")}
              </Link>
              <button
                type="button"
                onClick={() => setShowPlayStoreModal(false)}
                className="w-full h-9 rounded-full bg-[#FAF9F6] hover:bg-[#F5F2ED] text-[#191919] text-xs font-semibold transition-all border border-[#E7E4DE] cursor-pointer"
              >
                {t("common.close", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
