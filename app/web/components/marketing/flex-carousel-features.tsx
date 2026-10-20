"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Users,
  CalendarCheck,
  RefreshCw,
  CreditCard,
  QrCode,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
} from "lucide-react";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";

export interface FeatureDetail {
  id: string;
  number: string;
  tag: string;
  title: string;
  shortDesc: string;
  longDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  badgeText: string;
  highlights: string[];
  imageSrc: string;
  imageAlt: string;
}

export function FlexCarouselFeatures() {
  const [activeStep, setActiveStep] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const featureDetails: FeatureDetail[] = [
    {
      id: "members",
      number: "01",
      tag: "CENTRAL DIRECTORY",
      title: "Member Management",
      shortDesc: "Organize member profiles, contact information, and membership records.",
      longDesc:
        "Keep all member records, medical notes, emergency contacts, and active plans organized in a central, searchable directory. No more spreadsheets or lost paper files.",
      icon: Users,
      accentColor: "#E25822",
      accentBg: "#FDF1EB",
      accentBorder: "#FACBB7",
      badgeText: "3+ disconnected apps replaced with 1 directory",
      highlights: [
        "Comprehensive digital member profiles",
        "Instant search by name, phone or member ID",
        "Emergency contacts & health notes",
        "Active membership history & records",
      ],
      imageSrc: "/images/scattered-records.jpg",
      imageAlt: "Member Management in Repsi",
    },
    {
      id: "attendance",
      number: "02",
      tag: "FRONT-DESK CHECK-IN",
      title: "Attendance Tracking",
      shortDesc: "Record and review member attendance efficiently.",
      longDesc:
        "Fast check-in workflow for front-desk staff or automated turnstiles. Eliminate rush-hour entry bottlenecks and get accurate attendance counts in real time.",
      icon: CalendarCheck,
      accentColor: "#D97706",
      accentBg: "#FFFBEB",
      accentBorder: "#FDE68A",
      badgeText: "1-second check-in eliminates reception queues",
      highlights: [
        "1-second QR or manual front-desk check-in",
        "Real-time live gym occupancy count",
        "Daily attendance logs & peak-hour metrics",
        "Automated alerts for lapsed members",
      ],
      imageSrc: "/images/manual-attendance.jpg",
      imageAlt: "Attendance Tracking in Repsi",
    },
    {
      id: "renewals",
      number: "03",
      tag: "AUTOMATED RETENTION",
      title: "Memberships & Renewals",
      shortDesc: "Manage membership plans, expiry dates, and renewal workflows.",
      longDesc:
        "Monitor expiring memberships before they lapse. Automate renewal reminders via WhatsApp and keep retention rates high with customizable plan structures.",
      icon: RefreshCw,
      accentColor: "#E11D48",
      accentBg: "#FFF1F2",
      accentBorder: "#FECDD3",
      badgeText: "Automated WhatsApp expiry reminders",
      highlights: [
        "Flexible daily, monthly and annual plan tiers",
        "Upcoming expiry notifications & alerts",
        "1-click WhatsApp renewal reminder triggers",
        "Overdue and grace-period management",
      ],
      imageSrc: "/images/renewal-calendar.jpg",
      imageAlt: "Memberships & Renewals in Repsi",
    },
    {
      id: "payments",
      number: "04",
      tag: "INSTANT RECONCILIATION",
      title: "Payments & Receipts",
      shortDesc: "Track payment records, review submitted receipts, and manage confirmation workflows.",
      longDesc:
        "Record payments made through UPI, cards or cash with instant digital receipts. Eliminate disputed dues and reconcile daily front-desk collections effortlessly.",
      icon: CreditCard,
      accentColor: "#059669",
      accentBg: "#ECFDF5",
      accentBorder: "#A7F3D0",
      badgeText: "Zero disputed dues with instant GST receipts",
      highlights: [
        "UPI, card, bank transfer and cash recording",
        "Instant digital payment receipts with GST breakdown",
        "Clear pending dues and installment tracking",
        "Daily collection summaries for owners",
      ],
      imageSrc: "/images/payment-followup.jpg",
      imageAlt: "Payments & Receipts in Repsi",
    },
    {
      id: "passes",
      number: "05",
      tag: "TOUCHLESS ACCESS",
      title: "Digital Member Passes",
      shortDesc: "Present QR-based member identification or check-in functionality.",
      longDesc:
        "Give your members modern digital membership cards on their phones. Fast QR code scanning verifies membership validity on the spot without physical plastic cards.",
      icon: QrCode,
      accentColor: "#2563EB",
      accentBg: "#EFF6FF",
      accentBorder: "#BFDBFE",
      badgeText: "Zero plastic RFID printing costs",
      highlights: [
        "Dynamic digital pass accessible on any smartphone",
        "Instant validity check with colored status indicators",
        "Touchless scan at the entrance or reception",
        "Zero printing costs for plastic RFID cards",
      ],
      imageSrc: "/images/reception-turnstile.jpg",
      imageAlt: "Digital Member Passes in Repsi",
    },
    {
      id: "analytics",
      number: "06",
      tag: "BUSINESS INTELLIGENCE",
      title: "Reports & Analytics",
      shortDesc: "Display real business summaries and operational reports supported by the application.",
      longDesc:
        "Understand your gym's revenue, active member count, retention trends, and trainer performance. Make data-backed decisions with exportable reports.",
      icon: BarChart3,
      accentColor: "#7C3AED",
      accentBg: "#F5F3FF",
      accentBorder: "#DDD6FE",
      badgeText: "Actionable retention & collection analytics",
      highlights: [
        "Daily, monthly, and annual collection summaries",
        "Active member growth and retention graphs",
        "Peak-hour facility utilization reports",
        "1-click CSV/Excel report exports",
      ],
      imageSrc: "/images/gym-sunset-weights.jpg",
      imageAlt: "Reports & Analytics in Repsi",
    },
  ];

  // Synchronize window scrolling through the pinned section to drive activeStep
  useEffect(() => {
    let ticking = false;

    const handleWindowScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const el = sectionRef.current;
          if (!el) {
            ticking = false;
            return;
          }

          const rect = el.getBoundingClientRect();
          const totalScrollable = el.offsetHeight - window.innerHeight;

          if (totalScrollable <= 0) {
            ticking = false;
            return;
          }

          // Distance scrolled into the pinned section
          const scrolled = -rect.top;
          const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));
          setScrollProgress(progress);

          // Map scroll progress evenly across all modules
          const count = featureDetails.length;
          const step = Math.min(count - 1, Math.floor(progress * count));
          setActiveStep(step);

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    handleWindowScroll();

    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, [featureDetails.length]);

  // Jump to specific step by smoothly scrolling the window
  const scrollToStep = useCallback(
    (stepIndex: number) => {
      const el = sectionRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const currentScrollTop = window.scrollY;
      const sectionTop = currentScrollTop + rect.top;
      const totalScrollable = el.offsetHeight - window.innerHeight;

      if (totalScrollable > 0) {
        // Place scroll position in the center of the step's segment
        const stepProgress = (stepIndex + 0.45) / featureDetails.length;
        const targetScrollY = sectionTop + stepProgress * totalScrollable;
        window.scrollTo({
          top: targetScrollY,
          behavior: "smooth",
        });
      }
      setActiveStep(stepIndex);
    },
    [featureDetails.length]
  );

  const activeFeature = featureDetails[activeStep] || featureDetails[0];
  const ActiveIcon = activeFeature.icon;

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative w-full bg-[#FAF9F6] border-b border-[#E7E4DE]"
      style={{ height: "420vh" }}
    >
      {/* ───────────────────────────────────────────────────────────── */}
      {/* PINNED STICKY VIEWPORT CONTAINER (Locked on screen during scroll) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden py-3 sm:py-5 lg:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 01. SECTION HEADER WITH REPSI BRANDING                         */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto shrink-0 mb-2 sm:mb-4">
          {/* Repsi Brand Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF1EB] border border-[#FACBB7] text-[#E25822] text-[11px] sm:text-xs font-bold tracking-wider uppercase mb-2 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E25822] animate-pulse" />
            <span>Repsi All-In-One Platform</span>
          </div>

          <h2 className="font-heading font-extrabold text-xl sm:text-3xl md:text-4xl lg:text-[40px] text-[#191919] tracking-tight leading-[1.14]">
            Everything your fitness business needs is Repsi,{" "}
            <br className="hidden sm:inline" />
            <span className="text-[#E25822]">all in one place.</span>
          </h2>

          <p className="hidden md:block text-xs sm:text-sm text-[#62666D] leading-relaxed max-w-2xl mx-auto font-normal mt-1">
            Manage your members, attendance, memberships, payments and daily operations
            from one connected workspace.
          </p>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 02. UNIFIED STAGE: IMAGE + CONTENT BOTH VISIBLE SIMULTANEOUSLY  */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl border border-[#E7E4DE] bg-white shadow-lg overflow-hidden flex-1 flex flex-col justify-center p-3.5 sm:p-5 lg:p-7 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-center h-full">
            {/* ───────────────────────────────────────────────────────────── */}
            {/* LEFT / LOWER CONTENT: TITLE, BENEFIT & VERIFIED CAPABILITIES  */}
            {/* ───────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-3 sm:space-y-4 min-h-0 overflow-y-auto no-scrollbar">
              <div className="space-y-2 sm:space-y-3">
                {/* Active Module Eyebrow Pill */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
                    style={{
                      backgroundColor: activeFeature.accentBg,
                      color: activeFeature.accentColor,
                      border: `1px solid ${activeFeature.accentBorder}`,
                    }}
                  >
                    <ActiveIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase text-[#858890] block">
                      MODULE {activeFeature.number} OF 06 &bull; {activeFeature.tag}
                    </span>
                    <h3 className="font-heading font-extrabold text-lg sm:text-2xl text-[#191919] leading-snug">
                      {activeFeature.title}
                    </h3>
                  </div>
                </div>

                {/* Module Long Benefit Description */}
                <p className="text-xs sm:text-sm text-[#4A4D53] leading-relaxed font-normal">
                  {activeFeature.longDesc}
                </p>
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* VERIFIED CAPABILITIES & MODULE BENEFITS (ALL 4 POINTS)        */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="bg-[#FAF9F6] rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#E7E4DE] shadow-2xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#E7E4DE]">
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-[#858890]">
                    Verified Capabilities & Benefits
                  </span>
                  <span
                    className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: activeFeature.accentBg,
                      color: activeFeature.accentColor,
                      borderColor: activeFeature.accentBorder,
                    }}
                  >
                    Repsi Module {activeFeature.number}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  {activeFeature.highlights.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-[#191919] font-medium leading-snug"
                    >
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] mt-0.5"
                        style={{
                          backgroundColor: activeFeature.accentBg,
                          color: activeFeature.accentColor,
                        }}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span className="break-words">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* SCROLL INSTRUCTION + PREV/NEXT QUICK STEP BUTTONS             */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="flex items-center justify-between pt-1 border-t border-[#F0EDE7] text-xs">
                <div className="flex items-center gap-2 text-[#62666D]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E25822] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E25822]" />
                  </span>
                  <span className="font-medium text-[#191919]">
                    Scroll to advance: Module {activeStep + 1} of {featureDetails.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollToStep(Math.max(0, activeStep - 1))}
                    disabled={activeStep === 0}
                    aria-label="Previous module"
                    className="p-1.5 rounded-lg border border-[#E7E4DE] bg-white text-[#191919] hover:border-[#FACBB7] hover:text-[#E25822] disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToStep(Math.min(featureDetails.length - 1, activeStep + 1))}
                    disabled={activeStep === featureDetails.length - 1}
                    aria-label="Next module"
                    className="p-1.5 rounded-lg border border-[#E7E4DE] bg-white text-[#191919] hover:border-[#FACBB7] hover:text-[#E25822] disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* RIGHT: SMOOTH VISUAL SHOWCASE CARD WITH FLOATING BADGE         */}
            {/* ───────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-6 h-full flex items-center justify-center min-h-[220px] sm:min-h-[280px]">
              <div className="relative w-full h-[220px] sm:h-[300px] lg:h-[380px] rounded-xl sm:rounded-2xl overflow-hidden border border-[#E7E4DE] bg-[#F5F2ED] shadow-sm">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature.id}
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="relative w-full h-full"
                  >
                    <ImageWithSkeleton
                      src={activeFeature.imageSrc}
                      alt={activeFeature.imageAlt}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 600px"
                      className="object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

                    {/* Top Floating Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-white/60 shadow-xs">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: activeFeature.accentColor }}
                      />
                      <span className="text-[10px] sm:text-xs font-mono font-bold text-[#191919]">
                        MODULE {activeFeature.number} &bull; {activeFeature.tag}
                      </span>
                    </div>

                    {/* Bottom Operational Benefit Callout Badge */}
                    <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-white/95 backdrop-blur-md px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-white/60 shadow-xs flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: activeFeature.accentColor }}
                      />
                      <span className="text-xs font-semibold text-[#191919] truncate">
                        {activeFeature.badgeText}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 03. BOTTOM MODULE SWITCHER PILLS (01 TO 06)                   */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="w-full flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto py-1 sm:py-2 no-scrollbar shrink-0">
          {featureDetails.map((f, idx) => {
            const isActive = idx === activeStep;
            const FIcon = f.icon;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => scrollToStep(idx)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? "bg-[#E25822] text-white border-[#E25822] shadow-sm shadow-[#E25822]/20 scale-[1.02]"
                    : "bg-white text-[#62666D] border-[#E7E4DE] hover:border-[#FACBB7] hover:text-[#191919]"
                }`}
                aria-label={`Jump to module ${f.number}: ${f.title}`}
              >
                <FIcon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-[#858890]"}`} />
                <span>
                  {f.number}. {f.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FlexCarouselFeatures;
