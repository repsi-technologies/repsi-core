"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  Users,
  CalendarCheck,
  RefreshCw,
  CreditCard,
  QrCode,
  BarChart3,
  ArrowRight,
  Check,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { FlexCarousel, type FlexCarouselItem, type FlexCarouselRef } from "@/components/ui/flex-carousel";
import { useTranslation } from "@/lib/i18n";

interface FeatureDetail {
  id: string;
  number: string;
  title: string;
  shortDesc: string;
  longDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  highlights: string[];
}

export function FlexCarouselFeatures() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<FlexCarouselRef>(null);
  const carouselBoxRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const activeIndexRef = useRef(0);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const featureDetails: FeatureDetail[] = [
    {
      id: "members",
      number: "01",
      title: t("features_section.members_title", "Member Management"),
      shortDesc: t("features_section.members_short", "Organize member profiles, contact information, and membership records."),
      longDesc: t("features_section.members_long", "Keep all member records, medical notes, emergency contacts, and active plans organized in a central, searchable directory. No more spreadsheets or lost paper files."),
      icon: Users,
      accentColor: "#E25822",
      accentBg: "#FDF1EB",
      accentBorder: "#FACBB7",
      highlights: [
        t("features_section.members_h1", "Comprehensive digital member profiles"),
        t("features_section.members_h2", "Instant search by name, phone or member ID"),
        t("features_section.members_h3", "Emergency contacts & health notes"),
        t("features_section.members_h4", "Active membership history & records"),
      ],
    },
    {
      id: "attendance",
      number: "02",
      title: t("features_section.attendance_title", "Attendance Tracking"),
      shortDesc: t("features_section.attendance_short", "Record and review member attendance efficiently."),
      longDesc: t("features_section.attendance_long", "Fast check-in workflow for front-desk staff or automated turnstiles. Eliminate rush-hour entry bottlenecks and get accurate attendance counts in real time."),
      icon: CalendarCheck,
      accentColor: "#D97706",
      accentBg: "#FFFBEB",
      accentBorder: "#FDE68A",
      highlights: [
        t("features_section.attendance_h1", "1-second QR or manual front-desk check-in"),
        t("features_section.attendance_h2", "Real-time live gym occupancy count"),
        t("features_section.attendance_h3", "Daily attendance logs & peak-hour metrics"),
        t("features_section.attendance_h4", "Automated alerts for lapsed members"),
      ],
    },
    {
      id: "renewals",
      number: "03",
      title: t("features_section.renewals_title", "Memberships & Renewals"),
      shortDesc: t("features_section.renewals_short", "Manage membership plans, expiry dates, and renewal workflows."),
      longDesc: t("features_section.renewals_long", "Monitor expiring memberships before they lapse. Automate renewal reminders via WhatsApp and keep retention rates high with customizable plan structures."),
      icon: RefreshCw,
      accentColor: "#E11D48",
      accentBg: "#FFF1F2",
      accentBorder: "#FECDD3",
      highlights: [
        t("features_section.renewals_h1", "Flexible daily, monthly and annual plan tiers"),
        t("features_section.renewals_h2", "Upcoming expiry notifications & alerts"),
        t("features_section.renewals_h3", "1-click WhatsApp renewal reminder triggers"),
        t("features_section.renewals_h4", "Overdue and grace-period management"),
      ],
    },
    {
      id: "payments",
      number: "04",
      title: t("features_section.payments_title", "Payments & Invoicing"),
      shortDesc: t("features_section.payments_short", "Track cash, UPI and card fees with automated receipt generation."),
      longDesc: t("features_section.payments_long", "Streamline fee collections, manage partial payments, and issue professional receipts instantly. Keep your financial books clean and audit-ready."),
      icon: CreditCard,
      accentColor: "#059669",
      accentBg: "#ECFDF5",
      accentBorder: "#A7F3D0",
      highlights: [
        t("features_section.payments_h1", "UPI, card and cash payment logging"),
        t("features_section.payments_h2", "Automated PDF and WhatsApp receipts"),
        t("features_section.payments_h3", "Pending dues tracking & reminder queues"),
        t("features_section.payments_h4", "GST-ready billing and tax invoicing"),
      ],
    },
    {
      id: "passes",
      number: "05",
      title: t("features_section.qr_title", "Digital QR Passes"),
      shortDesc: t("features_section.qr_short", "Frictionless digital entry passes directly on members' phones."),
      longDesc: t("features_section.qr_long", "Provide members with dynamic QR access codes for seamless check-in at front desk or turnstile scanners. Eliminates plastic cards and entry disputes."),
      icon: QrCode,
      accentColor: "#2563EB",
      accentBg: "#EFF6FF",
      accentBorder: "#BFDBFE",
      highlights: [
        t("features_section.qr_h1", "Dynamic anti-screenshot digital QR passes"),
        t("features_section.qr_h2", "Instant photo and status verification"),
        t("features_section.qr_h3", "Works seamlessly with gym turnstiles"),
        t("features_section.qr_h4", "Zero plastic card printing expenses"),
      ],
    },
    {
      id: "analytics",
      number: "06",
      title: t("features_section.reports_title", "Reports & Financials"),
      shortDesc: t("features_section.reports_short", "Actionable insights into revenue, member growth, and gym operations."),
      longDesc: t("features_section.reports_long", "Clear, visual dashboards showing daily revenue collections, member retention trends, and class attendance to help you make informed business decisions."),
      icon: BarChart3,
      accentColor: "#7C3AED",
      accentBg: "#F5F3FF",
      accentBorder: "#DDD6FE",
      highlights: [
        t("features_section.reports_h1", "Real-time daily collection dashboards"),
        t("features_section.reports_h2", "Monthly revenue & P&L summaries"),
        t("features_section.reports_h3", "Member retention and churn analysis"),
        t("features_section.reports_h4", "CSV and Excel exports for accounting"),
      ],
    },
  ];

  // Scroll to move on laptop/desktop: only advance once the content below the image is fully visible
  useEffect(() => {
    let lastStepTime = 0;
    let accumulatedDelta = 0;

    const handleWheel = (e: WheelEvent) => {
      const el = carouselBoxRef.current;
      if (!el) return;

      // Only on laptop/desktop screens (non-mobile)
      if (window.innerWidth < 768) return;

      const rect = el.getBoundingClientRect();
      const isContentBelowImageVisible = rect.bottom <= window.innerHeight + 15 && rect.top >= -80;

      if (!isContentBelowImageVisible) {
        accumulatedDelta = 0;
        return;
      }

      const currentIdx = activeIndexRef.current;

      if (e.deltaY > 0) {
        if (currentIdx < featureDetails.length - 1) {
          e.preventDefault();
          accumulatedDelta += e.deltaY;
          const now = performance.now();
          if (accumulatedDelta > 40 && now - lastStepTime > 300) {
            lastStepTime = now;
            accumulatedDelta = 0;
            carouselRef.current?.step(1);
          }
        }
      } else if (e.deltaY < 0) {
        if (currentIdx > 0) {
          e.preventDefault();
          accumulatedDelta += e.deltaY;
          const now = performance.now();
          if (accumulatedDelta < -40 && now - lastStepTime > 300) {
            lastStepTime = now;
            accumulatedDelta = 0;
            carouselRef.current?.step(-1);
          }
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [featureDetails.length]);

  // Official React Bits FlexCarousel items
  const carouselItems: FlexCarouselItem[] = [
    {
      src: "/images/scattered-records.jpg",
      alt: t("features_section.members_title", "Member Management"),
      title: t("features_section.members_title", "Member Management"),
      subtitle: t("features_section.members_short", "Digital profiles, instant search & contact records"),
    },
    {
      src: "/images/manual-attendance.jpg",
      alt: t("features_section.attendance_title", "Attendance Tracking"),
      title: t("features_section.attendance_title", "Attendance Tracking"),
      subtitle: t("features_section.attendance_short", "1-second QR check-in & live facility occupancy"),
    },
    {
      src: "/images/renewal-calendar.jpg",
      alt: t("features_section.renewals_title", "Memberships & Renewals"),
      title: t("features_section.renewals_title", "Memberships & Renewals"),
      subtitle: t("features_section.renewals_short", "Expiry alerts, auto-renewals & WhatsApp reminders"),
    },
    {
      src: "/images/payment-followup.jpg",
      alt: t("features_section.payments_title", "Payments & Invoicing"),
      title: t("features_section.payments_title", "Payments & Invoicing"),
      subtitle: t("features_section.payments_short", "UPI, card & cash tracking with digital receipts"),
    },
    {
      src: "/images/reception-turnstile.jpg",
      alt: t("features_section.qr_title", "Digital QR Passes"),
      title: t("features_section.qr_title", "Digital QR Passes"),
      subtitle: t("features_section.qr_short", "Contactless smartphone QR entry passes"),
    },
    {
      src: "/images/gym-sunset-weights.jpg",
      alt: t("features_section.reports_title", "Reports & Financials"),
      title: t("features_section.reports_title", "Reports & Financials"),
      subtitle: t("features_section.reports_short", "Daily collection metrics & member retention graphs"),
    },
  ];

  const handleCarouselChange = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const activeFeature = featureDetails[activeIndex] || featureDetails[0];
  const ActiveIcon = activeFeature.icon;

  return (
    <section
      id="features"
      className="relative w-full bg-[#FAF9F6] text-[#191919] pt-8 sm:pt-12 lg:pt-14 pb-12 sm:pb-16 border-b border-[#E7E4DE] overflow-hidden"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 01. SECTION HEADER (NO EYEBROWS)                              */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
          <motion.h2
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-[40px] text-[#191919] tracking-tight leading-[1.14] mb-2 sm:mb-3"
          >
            {t("features_section.section_title", "Everything your gym needs, built into one platform.")}
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-xs sm:text-sm text-[#62666D] leading-relaxed max-w-xl mx-auto font-normal"
          >
            {t("features_section.section_subtitle", "Designed from real gym floor workflows to help you save time, reduce missed payments, and give members a seamless experience.")}
          </motion.p>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 02. SINGLE UNIFIED FRAME: FLEX CAROUSEL + FEATURE CAPABILITIES */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div
          ref={carouselBoxRef}
          onMouseEnter={() => {
            isHoveredRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveredRef.current = false;
          }}
          className="group relative w-full rounded-[32px] sm:rounded-[36px] overflow-hidden border border-[#E7E4DE] bg-white shadow-xl shadow-black/[0.03]"
        >
          {/* ───────────────────────────────────────────────────────────── */}
          {/* 02A. MOBILE NORMAL CAROUSEL (TOUCH SWIPEABLE & LIGHTWEIGHT)  */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div
            className="md:hidden relative w-full bg-[#FAF9F6] p-4 flex flex-col gap-3 select-none"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const touchEndX = e.changedTouches[0].clientX;
              const diff = touchStartX.current - touchEndX;
              if (Math.abs(diff) > 40) {
                if (diff > 0) {
                  // Swipe left -> next
                  setActiveIndex((prev) => Math.min(featureDetails.length - 1, prev + 1));
                } else {
                  // Swipe right -> prev
                  setActiveIndex((prev) => Math.max(0, prev - 1));
                }
              }
              touchStartX.current = null;
            }}
          >
            {/* Slide Image Card with Badge & Direct Arrow Controls */}
            <div className="relative w-full h-[260px] xs:h-[290px] rounded-2xl overflow-hidden shadow-sm border border-[#E7E4DE]">
              <Image
                src={(carouselItems[activeIndex] || carouselItems[0]).src}
                alt={(carouselItems[activeIndex] || carouselItems[0]).alt || ""}
                fill
                priority
                className="object-cover object-center transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10 pointer-events-none" />

              {/* Top Pill with Feature Number & Category */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-white/60 text-[10px] font-bold text-[#191919] shadow-xs">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: activeFeature.accentColor }}
                />
                <span>FEATURE {activeFeature.number} / 06</span>
              </div>

              {/* Bottom Card Title & Subtitle */}
              <div className="absolute bottom-3 left-3.5 right-3.5 text-white space-y-0.5">
                <h3 className="font-heading font-extrabold text-base xs:text-lg drop-shadow-sm">
                  {(carouselItems[activeIndex] || carouselItems[0]).title}
                </h3>
                <p className="text-[11px] text-white/90 line-clamp-1 drop-shadow-sm font-normal">
                  {(carouselItems[activeIndex] || carouselItems[0]).subtitle}
                </p>
              </div>

              {/* Mobile Carousel Left/Right Floating Quick Nav */}
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeIndex === 0}
                aria-label="Previous slide"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-[#191919] flex items-center justify-center disabled:opacity-20 shadow-md transition-opacity cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => Math.min(featureDetails.length - 1, prev + 1))}
                disabled={activeIndex === featureDetails.length - 1}
                aria-label="Next slide"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-[#191919] flex items-center justify-center disabled:opacity-20 shadow-md transition-opacity cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Pagination Dots & Navigation Controls */}
            <div className="flex items-center justify-between px-1 pt-1">
              {/* 6 Dots */}
              <div className="flex items-center gap-1.5">
                {featureDetails.map((f, i) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      i === activeIndex ? "w-6 bg-[#E25822]" : "w-2 bg-[#E7E4DE]"
                    }`}
                    aria-label={`Jump to feature ${i + 1}`}
                  />
                ))}
              </div>

              {/* Prev / Next buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeIndex === 0}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#E7E4DE] bg-white text-[#191919] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIndex((prev) => Math.min(featureDetails.length - 1, prev + 1))}
                  disabled={activeIndex === featureDetails.length - 1}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#E25822] text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* 02B. DESKTOP FLEX CAROUSEL WITH WEBGL LIQUID DISTORTION (md+) */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="hidden md:block relative w-full h-[330px] lg:h-[360px] overflow-hidden">
            <FlexCarousel
              ref={carouselRef}
              items={carouselItems}
              preset="liquid"
              intro="rise"
              cardHeight={0.72}
              gap={16}
              radius={20}
              fit="portrait"
              focusOnClick={true}
              captions={true}
              captureWheel={false}
              circular={false}
              onChange={handleCarouselChange}
              className="h-full w-full"
            />

            {/* Previous arrow navigation */}
            <button
              type="button"
              onClick={() => carouselRef.current?.step(-1)}
              disabled={activeIndex === 0}
              aria-label="Previous feature"
              className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#191919] hover:text-[#E25822] border border-[#E7E4DE] shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 backdrop-blur-sm ${
                activeIndex === 0
                  ? "opacity-20 cursor-not-allowed pointer-events-none"
                  : "opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>

            {/* Next arrow navigation */}
            <button
              type="button"
              onClick={() => carouselRef.current?.step(1)}
              disabled={activeIndex === featureDetails.length - 1}
              aria-label="Next feature"
              className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#191919] hover:text-[#E25822] border border-[#E7E4DE] shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 backdrop-blur-sm ${
                activeIndex === featureDetails.length - 1
                  ? "opacity-20 cursor-not-allowed pointer-events-none"
                  : "opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
              }`}
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>

            {/* Interactive instruction cue */}
            <div className="absolute top-3.5 right-3.5 z-20 pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-[#E7E4DE] text-[10px] font-semibold text-[#62666D] shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E25822] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E25822]" />
              </span>
              <span>Scroll to move</span>
            </div>
          </div>

          {/* Lower Section: Seamlessly Integrated Feature Capabilities Drawer within the same frame */}
          <div className="border-t border-[#E7E4DE] bg-[#FCFBF9] p-4 sm:p-5 lg:p-6 transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-center">
              {/* Left: Active Feature Title & Info */}
              <div className="md:col-span-7 space-y-2">
                <div className="flex items-center gap-2.5">
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
                    <span className="font-mono text-[9px] font-bold text-[#858890] uppercase block">
                      FEATURE {activeFeature.number} OF 06
                    </span>
                    <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#191919]">
                      {activeFeature.title}
                    </h3>
                  </div>
                </div>

                <p className="text-xs sm:text-[13px] text-[#62666D] leading-relaxed max-w-xl font-normal">
                  {activeFeature.longDesc}
                </p>
              </div>

              {/* Right: Verified Capabilities Checklist */}
              <div className="md:col-span-5 bg-white rounded-xl p-3 sm:p-3.5 border border-[#E7E4DE] shadow-2xs space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-[#858890] block mb-1">
                  Verified Capabilities
                </span>
                <div className="space-y-1">
                  {activeFeature.highlights.map((h) => (
                    <div key={h} className="flex items-start gap-2 text-[11px] sm:text-xs text-[#191919] font-medium leading-tight">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] mt-0.5"
                        style={{
                          backgroundColor: activeFeature.accentBg,
                          color: activeFeature.accentColor,
                        }}
                      >
                        <Check className="w-2 h-2 stroke-[3]" />
                      </span>
                      <span className="break-words">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FlexCarouselFeatures;
