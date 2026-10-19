"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ArrowRight, Sparkles, SlidersHorizontal, CheckCircle2 } from "lucide-react";

export function PricingPreviewSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const shouldReduceMotion = useReducedMotion();

  const previewBundles = [
    {
      id: "owner_lite",
      name: "Owner Lite",
      tagline: "Basic business management for owners & solo trainers.",
      monthlyPrice: 199,
      annualPrice: 159,
      badge: "ENTRY PLAN",
      popular: false,
      memberCapacity: "Owner & staff only",
      features: [
        "Owner dashboard & business settings",
        "Trainer management & staff roster",
        "Roles & granular permissions",
        "Basic operational reports",
        "Audit logs & secure cloud backup",
      ],
      ctaText: "Get Started",
    },
    {
      id: "starter",
      name: "REPSI Starter",
      tagline: "Essential daily gym operations for small fitness businesses.",
      monthlyPrice: 399,
      annualPrice: 319,
      badge: "RECOMMENDED",
      popular: true,
      memberCapacity: "Up to 25 active members",
      features: [
        "Everything in Owner Lite",
        "Up to 25 active members included",
        "Member portal & digital pass access",
        "1-second QR attendance check-in",
        "Membership plans & renewals",
        "Payment tracking & receipts",
      ],
      ctaText: "Choose Starter",
    },
    {
      id: "growth",
      name: "REPSI Growth",
      tagline: "For expanding clubs needing deeper scheduling & automation.",
      monthlyPrice: 699,
      annualPrice: 559,
      badge: "MOST POPULAR",
      popular: false,
      memberCapacity: "Up to 100 active members",
      features: [
        "Everything in REPSI Starter",
        "Up to 100 active members included",
        "Class & batch slot scheduling",
        "Trainer client schedules",
        "Expense tracking & dues follow-up",
        "Advanced revenue & retention reports",
      ],
      ctaText: "Choose Growth",
    },
  ];

  return (
    <section
      id="pricing"
      className="relative w-full bg-[#FAF9F6] text-[#191919] pt-20 sm:pt-28 pb-20 sm:pb-28 border-b border-[#E7E4DE] overflow-hidden font-sans"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 01. SECTION HEADER (NO EYEBROW)                               */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <motion.h2
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#191919] tracking-tight leading-[1.14] mb-3"
          >
            Affordable pricing starting at{" "}
            <span className="text-[#F07858]">₹199/month.</span>
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-base sm:text-lg text-[#62666D] max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Start with our lightweight owner platform and choose the modules your facility needs. Zero setup fees, zero hidden contracts.
          </motion.p>

          {/* Billing Switcher */}
          <div className="mt-7 flex items-center justify-center gap-3">
            <button
              type="button"
              className={`text-xs sm:text-sm font-semibold cursor-pointer transition-colors ${
                billingCycle === "monthly" ? "text-[#191919]" : "text-[#858890]"
              }`}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </button>

            <button
              type="button"
              onClick={() =>
                setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")
              }
              className="w-13 h-7 bg-[#E7E4DE] rounded-full p-1 transition-colors relative cursor-pointer"
              aria-label="Toggle billing frequency"
            >
              <motion.div
                className="w-5 h-5 bg-[#F07858] rounded-full shadow-xs"
                animate={{ x: billingCycle === "annual" ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>

            <button
              type="button"
              className={`text-xs sm:text-sm font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                billingCycle === "annual" ? "text-[#191919]" : "text-[#858890]"
              }`}
              onClick={() => setBillingCycle("annual")}
            >
              <span>Yearly</span>
              <span className="text-[10px] font-bold text-[#F07858] bg-[#FFF0EA] border border-[#FFD2C3] px-2 py-0.5 rounded-full uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 02. PREVIEW BUNDLES (3 CLEAN CARDS)                           */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-stretch mb-12">
          {previewBundles.map((bundle) => {
            const price =
              billingCycle === "annual" ? bundle.annualPrice : bundle.monthlyPrice;

            return (
              <div
                key={bundle.id}
                className={`rounded-[28px] sm:rounded-[32px] p-7 sm:p-8 flex flex-col justify-between relative transition-all duration-200 ${
                  bundle.popular
                    ? "bg-white text-[#191919] shadow-md border-2 border-[#F07858] ring-4 ring-[#F07858]/10"
                    : "bg-white text-[#191919] shadow-xs border border-[#E7E4DE] hover:shadow-md"
                }`}
              >
                {bundle.badge && (
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10.5px] font-bold tracking-wider uppercase px-3.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap ${
                      bundle.popular
                        ? "bg-[#F07858] text-white"
                        : "bg-[#FFF0EA] text-[#F07858] border border-[#FFD2C3]"
                    }`}
                  >
                    {bundle.badge}
                  </div>
                )}

                <div>
                  <div className="mb-2">
                    <h3 className="font-heading font-extrabold text-2xl tracking-tight text-[#191919]">
                      {bundle.name}
                    </h3>
                    <div className="text-xs font-mono font-semibold text-[#858890] mt-0.5">
                      {bundle.memberCapacity}
                    </div>
                  </div>

                  <p className="text-xs text-[#62666D] mb-5 leading-relaxed min-h-[36px]">
                    {bundle.tagline}
                  </p>

                  <div className="mb-5 pb-5 border-b border-[#E7E4DE]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-heading font-extrabold tracking-tight text-[#191919]">
                        ₹{price.toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-[#62666D]">
                        / month
                      </span>
                    </div>
                    <div className="text-[11px] mt-1 font-mono text-[#858890]">
                      {billingCycle === "annual"
                        ? `Billed ₹${(price * 12).toLocaleString()}/year · Save 20%`
                        : "Billed monthly"}
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-6 text-xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#191919]">
                      Included Features:
                    </div>
                    {bundle.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-[#191919]">
                        <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#F07858]" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/signup?plan=${bundle.id}&billing=${billingCycle}`}
                    className={`group w-full inline-flex items-center justify-center gap-2 h-11 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${
                      bundle.popular
                        ? "bg-[#F07858] hover:bg-[#E76543] text-white shadow-sm shadow-[#F07858]/30"
                        : "bg-[#FAF9F6] hover:bg-[#F5F2ED] text-[#191919] border border-[#E7E4DE]"
                    }`}
                  >
                    <span>{bundle.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 03. REDIRECT CALLOUT BANNER TO /pricing                        */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="rounded-3xl bg-white border border-[#E7E4DE] p-7 sm:p-9 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center lg:text-left max-w-2xl">
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#191919]">
              Need custom modules or higher member capacity?
            </h3>
            <p className="text-xs sm:text-sm text-[#62666D] leading-relaxed">
              Use our interactive plan calculator to select individual modules (Diet Plans, Trainer Rosters, Biometric Turnstiles, Multi-branch) and calculate your exact bill in real time.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs font-medium text-[#62666D]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                24 Modular Add-ons
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Up to 1,000+ Members
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Live Instant Quote
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-[#F07858] hover:bg-[#E76543] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#F07858]/30 transition-all active:scale-95"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Explore Full Dynamic Pricing</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
