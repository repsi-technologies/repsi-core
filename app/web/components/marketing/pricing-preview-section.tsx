"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ArrowRight, Sparkles, SlidersHorizontal, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import {
  CURRENCIES,
  CurrencyCode,
  BillingCycle,
  GLOBAL_PLANS,
} from "@/lib/pricing-data";

export function PricingPreviewSection() {
  // Default to 1 year and INR (with seamless toggle to USD, EUR, GBP, AED)
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const shouldReduceMotion = useReducedMotion();

  const curr = CURRENCIES[currency];

  return (
    <section
      id="pricing"
      className="relative w-full bg-[#FAF9F6] text-[#191919] pt-20 sm:pt-28 pb-20 sm:pb-28 border-b border-[#E7E4DE] overflow-hidden font-sans"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 01. SECTION HEADER                                            */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FDF1EB] border border-[#FACBB7] text-[#E25822] text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Final Global Pricing · Fixed Rates Per Currency</span>
          </div>

          <motion.h2
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#191919] tracking-tight leading-[1.14] mb-3"
          >
            Predictable gym software starting at{" "}
            <span className="text-[#E25822]">
              {curr.symbol}
              {GLOBAL_PLANS.find((p) => p.id === "lite")?.pricing[currency].yearly.perMonth}/mo.
            </span>
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-base sm:text-lg text-[#62666D] max-w-2xl mx-auto leading-relaxed font-normal"
          >
            {curr.taxNote} Only active members count, with a 10% grace cap and zero check-in blocks.
          </motion.p>

          {/* Currency Switcher */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 p-1 bg-white border border-[#E7E4DE] rounded-full max-w-fit mx-auto shadow-xs">
            {(Object.keys(CURRENCIES) as CurrencyCode[]).map((cKey) => {
              const cItem = CURRENCIES[cKey];
              const isSelected = currency === cKey;
              return (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => setCurrency(cKey)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? "bg-[#191919] text-white shadow-xs"
                      : "text-[#62666D] hover:text-[#191919] hover:bg-[#F5F2ED]"
                  }`}
                >
                  <span>{cItem.symbol}</span>
                  <span>{cKey}</span>
                </button>
              );
            })}
          </div>

          {/* 4 Billing Cycles with Discounts */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 p-1.5 bg-white border border-[#E7E4DE] rounded-full max-w-xl mx-auto shadow-xs">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-[#191919] text-white shadow-xs"
                  : "text-[#62666D] hover:text-[#191919]"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("3months")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                billingCycle === "3months"
                  ? "bg-[#191919] text-white shadow-xs"
                  : "text-[#62666D] hover:text-[#191919]"
              }`}
            >
              <span>3 Months</span>
              <span className="text-[10px] text-[#E25822] font-bold">10% OFF</span>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("6months")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                billingCycle === "6months"
                  ? "bg-[#191919] text-white shadow-xs"
                  : "text-[#62666D] hover:text-[#191919]"
              }`}
            >
              <span>6 Months</span>
              <span className="text-[10px] text-[#E25822] font-bold">25% OFF</span>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-[#E25822] text-white shadow-sm shadow-[#E25822]/30"
                  : "text-[#62666D] hover:text-[#191919]"
              }`}
            >
              <span>1 Year (Best Value)</span>
              <span className="text-[10px] bg-white/20 text-white font-bold px-1.5 py-0.2 rounded-full">
                35% OFF
              </span>
            </button>
          </div>

          <div className="mt-3 text-xs font-medium text-[#858890]">
            ⚡ Founder Offer: First 50 gyms worldwide lock these prices for life.
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 02. PLAN CARDS GRID                                           */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch mb-12">
          {GLOBAL_PLANS.map((plan) => {
            const pricingInfo = plan.pricing[currency][billingCycle];
            const isFree = plan.id === "free_trial";

            return (
              <div
                key={plan.id}
                className={`rounded-[28px] p-6 sm:p-7 flex flex-col justify-between relative transition-all duration-200 ${
                  plan.popular
                    ? "bg-white text-[#191919] shadow-lg border-2 border-[#E25822] ring-4 ring-[#E25822]/10"
                    : "bg-white text-[#191919] shadow-xs border border-[#E7E4DE] hover:shadow-md"
                }`}
              >
                {plan.badge && (
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10.5px] font-bold tracking-wider uppercase px-3.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap ${
                      plan.popular
                        ? "bg-[#E25822] text-white"
                        : "bg-[#FDF1EB] text-[#E25822] border border-[#FACBB7]"
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="mb-2">
                    <h3 className="font-heading font-extrabold text-2xl tracking-tight text-[#191919]">
                      {plan.name}
                    </h3>
                    <div className="text-xs font-mono font-semibold text-[#858890] mt-0.5">
                      {plan.memberCapacity}
                    </div>
                  </div>

                  <p className="text-xs text-[#62666D] mb-5 leading-relaxed min-h-[36px]">
                    {plan.tagline}
                  </p>

                  <div className="mb-5 pb-5 border-b border-[#E7E4DE]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-heading font-extrabold tracking-tight text-[#191919]">
                        {isFree ? `${curr.symbol}0` : `${curr.symbol}${pricingInfo.perMonth.toLocaleString()}`}
                      </span>
                      <span className="text-xs font-medium text-[#62666D]">
                        {isFree ? "for 14 days" : "/ month"}
                      </span>
                    </div>
                    <div className="text-[11px] mt-1 font-mono text-[#858890]">
                      {pricingInfo.note}
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-6 text-xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#191919]">
                      Included Features:
                    </div>
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-[#191919]">
                        <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#E25822]" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={
                      plan.id === "enterprise"
                        ? "/contact"
                        : `/signup?plan=${plan.id}&billing=${billingCycle}&currency=${currency}`
                    }
                    className={`group w-full inline-flex items-center justify-center gap-2 h-11 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${
                      plan.popular
                        ? "bg-[#E25822] hover:bg-[#C94715] text-white shadow-sm shadow-[#E25822]/30"
                        : "bg-[#FAF9F6] hover:bg-[#F5F2ED] text-[#191919] border border-[#E7E4DE]"
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 03. FULL COMPARISON & DASHBOARD BILLING BANNER                */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="rounded-3xl bg-white border border-[#E7E4DE] p-7 sm:p-9 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center lg:text-left max-w-2xl">
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#191919]">
              Compare all 245 features, limits & add-ons
            </h3>
            <p className="text-xs sm:text-sm text-[#62666D] leading-relaxed">
              Explore the complete side-by-side comparison matrix, add-on packs (+50 member packs, extra branches, WhatsApp), and multi-currency pricing. Existing gym owners can manage subscriptions and pay directly via Cashfree from their dashboard under <strong>Settings → Billing</strong>.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs font-medium text-[#62666D]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Fixed prices per currency
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                10% Grace over cap
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Online checkout on Dashboard
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-[#E25822] hover:bg-[#C94715] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#E25822]/30 transition-all active:scale-95"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>View Full /pricing Details</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
