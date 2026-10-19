"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
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
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<FlexCarouselRef>(null);
  const carouselBoxRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();

  // Scroll to move: when user scrolls the page, smoothly advance the carousel
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const handleWindowScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const deltaY = currentY - lastY;
          lastY = currentY;

          const el = carouselBoxRef.current;
          if (el && !isHoveredRef.current && Math.abs(deltaY) > 0.5) {
            const rect = el.getBoundingClientRect();
            const inView = rect.top < window.innerHeight && rect.bottom > 0;
            if (inView) {
              carouselRef.current?.scrollBy(deltaY * 0.18);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, []);

  const featureDetails: FeatureDetail[] = [
    {
      id: "members",
      number: "01",
      title: "Member Management",
      shortDesc: "Organize member profiles, contact information, and membership records.",
      longDesc:
        "Keep all member records, medical notes, emergency contacts, and active plans organized in a central, searchable directory. No more spreadsheets or lost paper files.",
      icon: Users,
      accentColor: "#F07858",
      accentBg: "#FFF0EA",
      accentBorder: "#FFD2C3",
      highlights: [
        "Comprehensive digital member profiles",
        "Instant search by name, phone or member ID",
        "Emergency contacts & health notes",
        "Active membership history & records",
      ],
    },
    {
      id: "attendance",
      number: "02",
      title: "Attendance Tracking",
      shortDesc: "Record and review member attendance efficiently.",
      longDesc:
        "Fast check-in workflow for front-desk staff or automated turnstiles. Eliminate rush-hour entry bottlenecks and get accurate attendance counts in real time.",
      icon: CalendarCheck,
      accentColor: "#D97706",
      accentBg: "#FFFBEB",
      accentBorder: "#FDE68A",
      highlights: [
        "1-second QR or manual front-desk check-in",
        "Real-time live gym occupancy count",
        "Daily attendance logs & peak-hour metrics",
        "Automated alerts for lapsed members",
      ],
    },
    {
      id: "renewals",
      number: "03",
      title: "Memberships & Renewals",
      shortDesc: "Manage membership plans, expiry dates, and renewal workflows.",
      longDesc:
        "Monitor expiring memberships before they lapse. Automate renewal reminders via WhatsApp and keep retention rates high with customizable plan structures.",
      icon: RefreshCw,
      accentColor: "#E11D48",
      accentBg: "#FFF1F2",
      accentBorder: "#FECDD3",
      highlights: [
        "Flexible daily, monthly and annual plan tiers",
        "Upcoming expiry notifications & alerts",
        "1-click WhatsApp renewal reminder triggers",
        "Overdue and grace-period management",
      ],
    },
    {
      id: "payments",
      number: "04",
      title: "Payments & Receipts",
      shortDesc: "Track payment records, review submitted receipts, and manage confirmation workflows.",
      longDesc:
        "Record payments made through UPI, cards or cash with instant digital receipts. Eliminate disputed dues and reconcile daily front-desk collections effortlessly.",
      icon: CreditCard,
      accentColor: "#059669",
      accentBg: "#ECFDF5",
      accentBorder: "#A7F3D0",
      highlights: [
        "UPI, card, bank transfer and cash recording",
        "Instant digital payment receipts with GST breakdown",
        "Clear pending dues and installment tracking",
        "Daily collection summaries for owners",
      ],
    },
    {
      id: "passes",
      number: "05",
      title: "Digital Member Passes",
      shortDesc: "Present QR-based member identification or check-in functionality.",
      longDesc:
        "Give your members modern digital membership cards on their phones. Fast QR code scanning verifies membership validity on the spot without physical plastic cards.",
      icon: QrCode,
      accentColor: "#2563EB",
      accentBg: "#EFF6FF",
      accentBorder: "#BFDBFE",
      highlights: [
        "Dynamic digital pass accessible on any smartphone",
        "Instant validity check with colored status indicators",
        "Touchless scan at the entrance or reception",
        "Zero printing costs for plastic RFID cards",
      ],
    },
    {
      id: "analytics",
      number: "06",
      title: "Reports & Analytics",
      shortDesc: "Display real business summaries and operational reports supported by the application.",
      longDesc:
        "Understand your gym's revenue, active member count, retention trends, and trainer performance. Make data-backed decisions with exportable reports.",
      icon: BarChart3,
      accentColor: "#7C3AED",
      accentBg: "#F5F3FF",
      accentBorder: "#DDD6FE",
      highlights: [
        "Daily, monthly, and annual collection summaries",
        "Active member growth and retention graphs",
        "Peak-hour facility utilization reports",
        "1-click CSV/Excel report exports",
      ],
    },
  ];

  // Official React Bits FlexCarousel items
  const carouselItems: FlexCarouselItem[] = [
    {
      src: "/images/scattered-records.jpg",
      alt: "Member Management",
      title: "Member Management",
      subtitle: "Digital profiles, instant search & contact records",
    },
    {
      src: "/images/manual-attendance.jpg",
      alt: "Attendance Tracking",
      title: "Attendance Tracking",
      subtitle: "1-second QR check-in & live facility occupancy",
    },
    {
      src: "/images/renewal-calendar.jpg",
      alt: "Memberships & Renewals",
      title: "Memberships & Renewals",
      subtitle: "Expiry alerts, auto-renewals & WhatsApp reminders",
    },
    {
      src: "/images/payment-followup.jpg",
      alt: "Payments & Receipts",
      title: "Payments & Receipts",
      subtitle: "UPI, card & cash tracking with digital receipts",
    },
    {
      src: "/images/reception-turnstile.jpg",
      alt: "Digital Member Passes",
      title: "Digital Member Passes",
      subtitle: "Contactless smartphone QR entry passes",
    },
    {
      src: "/images/gym-sunset-weights.jpg",
      alt: "Reports & Analytics",
      title: "Reports & Analytics",
      subtitle: "Daily collection metrics & member retention graphs",
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
      className="relative w-full bg-[#FAF9F6] text-[#191919] pt-20 sm:pt-28 lg:pt-32 pb-20 sm:pb-28 border-b border-[#E7E4DE] overflow-hidden"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 01. SECTION HEADER (NO EYEBROW PER USER REQUEST)              */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <motion.h2
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[46px] text-[#191919] tracking-tight leading-[1.14] mb-4"
          >
            Everything your fitness business needs. <br className="hidden sm:inline" />
            <span className="text-[#F07858]">All in one place.</span>
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-base sm:text-lg text-[#62666D] leading-relaxed max-w-2xl mx-auto font-normal"
          >
            Manage your members, attendance, memberships, payments and daily operations
            from one connected workspace.
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
          {/* Upper Section: Flex Carousel with WebGL Liquid Distortion */}
          <div className="relative w-full h-[440px] sm:h-[500px] lg:h-[540px] overflow-hidden">
            <FlexCarousel
              ref={carouselRef}
              items={carouselItems}
              preset="liquid"
              intro="rise"
              cardHeight={0.65}
              gap={18}
              radius={24}
              fit="portrait"
              focusOnClick={true}
              captions={true}
              captureWheel={true}
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
              className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-[#191919] hover:text-[#F07858] border border-[#E7E4DE] shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 backdrop-blur-sm ${
                activeIndex === 0
                  ? "opacity-20 cursor-not-allowed pointer-events-none"
                  : "opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Next arrow navigation */}
            <button
              type="button"
              onClick={() => carouselRef.current?.step(1)}
              disabled={activeIndex === featureDetails.length - 1}
              aria-label="Next feature"
              className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-[#191919] hover:text-[#F07858] border border-[#E7E4DE] shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 backdrop-blur-sm ${
                activeIndex === featureDetails.length - 1
                  ? "opacity-20 cursor-not-allowed pointer-events-none"
                  : "opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Interactive instruction cue */}
            <div className="absolute top-4 right-4 z-20 pointer-events-none hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E7E4DE] text-[11px] font-semibold text-[#62666D] shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F07858] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F07858]" />
              </span>
              <span>Scroll to move</span>
            </div>
          </div>

          {/* Lower Section: Seamlessly Integrated Feature Capabilities Drawer within the same frame */}
          <div className="border-t border-[#E7E4DE] bg-[#FCFBF9] p-6 sm:p-8 lg:p-10 transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
              {/* Left: Active Feature Title & Info */}
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                    style={{
                      backgroundColor: activeFeature.accentBg,
                      color: activeFeature.accentColor,
                      border: `1px solid ${activeFeature.accentBorder}`,
                    }}
                  >
                    <ActiveIcon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#858890] uppercase block">
                      FEATURE {activeFeature.number} OF 06
                    </span>
                    <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#191919]">
                      {activeFeature.title}
                    </h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#62666D] leading-relaxed max-w-xl font-normal">
                  {activeFeature.longDesc}
                </p>
              </div>

              {/* Right: Verified Capabilities Checklist */}
              <div className="md:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-[#E7E4DE] shadow-2xs space-y-2">
                <span className="text-[11px] font-mono font-bold uppercase text-[#858890] block mb-2">
                  Verified Capabilities
                </span>
                <div className="space-y-1.5">
                  {activeFeature.highlights.map((h) => (
                    <div key={h} className="flex items-start gap-2 text-xs text-[#191919] font-medium leading-snug">
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] mt-0.5"
                        style={{
                          backgroundColor: activeFeature.accentBg,
                          color: activeFeature.accentColor,
                        }}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
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
