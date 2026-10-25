"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Minus,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  PhoneCall,
  Clock,
  HelpCircle,
} from "lucide-react";
import {
  CURRENCIES,
  CurrencyCode,
  BillingCycle,
  GLOBAL_PLANS,
  ADDONS_LIST,
} from "@/lib/pricing-data";

export function PricingSection() {
  // Default to 1 year ("Save 35%") and INR
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const curr = CURRENCIES[currency];

  // 10-12 feature comparison rows + limits
  const comparisonRows = [
    {
      category: "Limits & Capacity",
      items: [
        { name: "Active member cap", lite: "20", starter: "50", growth: "150", pro: "400", enterprise: "400+ (Custom)" },
        { name: "Gym branches included", lite: "1", starter: "1", growth: "1", pro: "3", enterprise: "Unlimited" },
        { name: "Trainer accounts", lite: "1", starter: "3", growth: "10", pro: "30", enterprise: "Unlimited" },
        { name: "Staff logins", lite: "1", starter: "3", growth: "10", pro: "30", enterprise: "Unlimited" },
        { name: "Attendance history", lite: "3 months", starter: "1 year", growth: "3 years", pro: "Unlimited", enterprise: "Unlimited" },
        { name: "Support tier", lite: "Email", starter: "Email (24h)", growth: "WhatsApp hotline", pro: "Priority WhatsApp & Phone", enterprise: "Dedicated Manager & SLA" },
      ],
    },
    {
      category: "Operations & Member Management",
      items: [
        { name: "Member profiles & photo verification", lite: true, starter: true, growth: true, pro: true, enterprise: true },
        { name: "Digital QR pass & check-in", lite: true, starter: true, growth: true, pro: true, enterprise: true },
        { name: "Cash, UPI, card records & receipts", lite: true, starter: true, growth: true, pro: true, enterprise: true },
        { name: "Renewal queue & freeze/pause", lite: false, starter: true, growth: true, pro: true, enterprise: true },
        { name: "Dues reminders & partial payments", lite: false, starter: true, growth: true, pro: true, enterprise: true },
        { name: "Classes, batches & waitlist", lite: false, starter: false, growth: true, pro: true, enterprise: true },
        { name: "Workout builder & diet plans", lite: false, starter: false, growth: true, pro: true, enterprise: true },
        { name: "Leads CRM & follow-up queue", lite: false, starter: false, growth: true, pro: true, enterprise: true },
        { name: "Expense tracking & monthly P&L", lite: false, starter: false, growth: true, pro: true, enterprise: true },
        { name: "Trainer commissions & staff payroll", lite: false, starter: false, growth: false, pro: true, enterprise: true },
        { name: "WhatsApp broadcast automation", lite: false, starter: false, growth: false, pro: true, enterprise: true },
        { name: "REST API & webhook access", lite: false, starter: false, growth: false, pro: false, enterprise: true },
      ],
    },
  ];

  // 8 Focused FAQs
  const faqs = [
    {
      q: "What counts as an active member?",
      a: "Only members with a current, non-expired membership plan count toward your limit. Expired, inactive, or archived members are never billed. You also receive a 10% grace allowance over your member cap so front-desk check-in is never blocked.",
    },
    {
      q: "What happens if I go over my member limit?",
      a: "Member check-ins are never blocked. If you stay over capacity for 30 consecutive days, you can either buy a +50 member add-on pack or upgrade to the next plan. Repsi never auto-charges your card without your explicit confirmation.",
    },
    {
      q: "Can I upgrade or downgrade any time?",
      a: "Yes. Upgrades are instant and pro-rated — any unused days on your current subscription are credited toward your new tier. Downgrades take effect at the end of your current billing period, and zero data is deleted.",
    },
    {
      q: "What happens when the free trial ends?",
      a: "Your 14-day free trial gives you full access to all Growth plan features with up to 30 members. No credit card is required to start. When it ends, your data remains safely saved; you can simply pick a plan to keep using all features.",
    },
    {
      q: "What is your refund policy?",
      a: "We offer a 7-day money-back guarantee on all 6-month and 1-year plans if Repsi isn't the right fit for your gym. Monthly subscriptions can be cancelled anytime with zero penalty.",
    },
    {
      q: "What payment methods do you accept?",
      a: "In India, we accept UPI, Google Pay, PhonePe, credit/debit cards, and net banking via Cashfree. Globally, we support all major international credit/debit cards and bank transfers in USD, EUR, GBP, and AED.",
    },
    {
      q: "Are taxes included?",
      a: "Prices shown for India are final amounts. No GST is charged until registered. If GST applies in the future, we will notify owners well in advance of their renewal. Global prices (USD, EUR, GBP, AED) exclude local VAT or sales tax.",
    },
    {
      q: "How do founder prices work?",
      a: "The first 50 gym workspaces lock their subscription rate for life. Your price remains frozen as long as your subscription stays active, and applies to future plan upgrades at the protected founder rate.",
    },
  ];

  return (
    <div className="w-full bg-[#FAF9F6] text-[#191919] font-sans antialiased">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION                                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
        <h1 className="font-heading font-extrabold text-3xl sm:text-5xl md:text-6xl text-[#191919] tracking-tight leading-[1.12] mb-4">
          Simple, honest pricing for <br className="hidden sm:inline" />
          <span className="text-[#E25822]">modern fitness businesses.</span>
        </h1>

        <p className="text-base sm:text-lg text-[#62666D] max-w-2xl mx-auto leading-relaxed mb-8">
          Pick the plan that fits your gym size. Upgrade, downgrade, or cancel anytime.
        </p>

        {/* Currency Switcher & Billing Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Currency Selector */}
          <div className="flex items-center p-1 bg-white border border-[#E7E4DE] rounded-full shadow-xs">
            {(Object.keys(CURRENCIES) as CurrencyCode[]).map((cKey) => {
              const cItem = CURRENCIES[cKey];
              const isSelected = currency === cKey;
              return (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => setCurrency(cKey)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#191919] text-white shadow-xs"
                      : "text-[#62666D] hover:text-[#191919]"
                  }`}
                >
                  {cKey}
                </button>
              );
            })}
          </div>

          {/* Billing Cycle Toggle (Default 1 year - Save 35%) */}
          <div className="flex items-center p-1 bg-white border border-[#E7E4DE] rounded-full shadow-xs">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                billingCycle === "monthly" ? "bg-[#191919] text-white shadow-xs" : "text-[#62666D] hover:text-[#191919]"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("3months")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                billingCycle === "3months" ? "bg-[#191919] text-white shadow-xs" : "text-[#62666D] hover:text-[#191919]"
              }`}
            >
              <span>3 Mo</span>
              <span className="text-[10px] text-[#E25822] font-bold">10% OFF</span>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("6months")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                billingCycle === "6months" ? "bg-[#191919] text-white shadow-xs" : "text-[#62666D] hover:text-[#191919]"
              }`}
            >
              <span>6 Mo</span>
              <span className="text-[10px] text-[#E25822] font-bold">25% OFF</span>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === "yearly" ? "bg-[#E25822] text-white shadow-xs" : "text-[#62666D] hover:text-[#191919]"
              }`}
            >
              <span>1 Year</span>
              <span className="text-[10px] bg-white/20 text-white font-bold px-1.5 rounded-full">
                Save 35%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. PLAN CARDS (5 PAID PLANS)                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 items-stretch">
          {GLOBAL_PLANS.map((plan) => {
            const pricing = plan.pricing[currency][billingCycle];
            const isEnterprise = plan.id === "enterprise";
            const isGrowth = plan.popular;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                  isGrowth
                    ? "bg-white border-2 border-[#E25822] shadow-xl shadow-[#E25822]/10 ring-1 ring-[#E25822]/20 scale-[1.02] z-10"
                    : "bg-white border border-[#E7E4DE] shadow-xs hover:border-[#D1CDC7]"
                }`}
              >
                {isGrowth && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#E25822] text-white text-[10px] font-black tracking-wider uppercase shadow-sm">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-heading font-extrabold text-xl text-[#191919]">
                      {plan.name}
                    </h3>
                  </div>

                  <p className="text-xs text-[#62666D] min-h-[32px] leading-relaxed mb-4">
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="mb-1">
                    {isEnterprise ? (
                      <div>
                        <span className="text-xs text-[#858890] block font-medium">Custom pricing</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-[#191919]">From {curr.symbol}{pricing.perMonth}</span>
                          <span className="text-xs text-[#858890]">/mo</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-[#191919] tracking-tight">
                            {curr.symbol}{pricing.perMonth}
                          </span>
                          <span className="text-xs text-[#858890] font-medium">/ month</span>
                          {billingCycle !== "monthly" && (
                            <span className="text-xs text-[#858890] line-through ml-1">
                              {curr.symbol}{pricing.originalPerMonth}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#62666D] mt-0.5 font-medium">
                          {pricing.billedNote}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Member Cap badge */}
                  <div className="my-4 pt-3 border-t border-[#E7E4DE]/60">
                    <span className="inline-block text-[11px] font-mono font-bold text-[#E25822] bg-[#FDF1EB] border border-[#FACBB7] px-2.5 py-0.5 rounded-lg">
                      {plan.memberCapacity}
                    </span>
                  </div>

                  {/* 5-6 Highlights */}
                  <div className="space-y-2 mb-6">
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs text-[#191919]">
                        <Check className="w-3.5 h-3.5 text-[#E25822] shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-4 border-t border-[#E7E4DE]/60">
                  {isEnterprise ? (
                    <a
                      href="mailto:sales@repsi.app?subject=Enterprise%20Inquiry"
                      className="w-full h-11 rounded-full border border-[#191919] text-[#191919] hover:bg-[#191919] hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <span>Talk to us</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <Link
                      href="/signup"
                      className={`w-full h-11 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs ${
                        isGrowth
                          ? "bg-[#E25822] hover:bg-[#C94715] text-white shadow-[#E25822]/20"
                          : "bg-[#191919] hover:bg-[#333333] text-white"
                      }`}
                    >
                      <span>Start 14-day free trial</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. TRUST STRIP                                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="border-y border-[#E7E4DE] bg-white py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-medium text-[#62666D]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#E25822]" />
            14-day free trial, no card required
          </span>
          <span className="hidden sm:inline text-[#E7E4DE]">·</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#E25822]" />
            Cancel or change plan anytime
          </span>
          <span className="hidden sm:inline text-[#E7E4DE]">·</span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-[#E25822]" />
            Your gym data is never deleted
          </span>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. COMPARISON TABLE                                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#191919] mb-2">
            Compare plan features & limits
          </h2>
          <p className="text-xs sm:text-sm text-[#62666D]">
            Detailed limits and capabilities by plan tier.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-[#E7E4DE] bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-[#E7E4DE]">
                <th className="p-4 font-bold text-[#191919] w-1/3">Feature / Limit</th>
                <th className="p-4 font-bold text-[#191919] text-center">Lite</th>
                <th className="p-4 font-bold text-[#191919] text-center">Starter</th>
                <th className="p-4 font-bold text-[#E25822] text-center bg-[#FDF1EB]/50">Growth ⭐</th>
                <th className="p-4 font-bold text-[#191919] text-center">Pro</th>
                <th className="p-4 font-bold text-[#191919] text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((cat, cIdx) => (
                <React.Fragment key={cIdx}>
                  <tr className="bg-[#F5F2ED]/60 border-y border-[#E7E4DE]">
                    <td colSpan={6} className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#858890]">
                      {cat.category}
                    </td>
                  </tr>
                  {cat.items.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="border-b border-[#E7E4DE]/60 hover:bg-[#FAF9F6]/80 transition"
                    >
                      <td className="p-4 font-medium text-[#191919]">{row.name}</td>
                      {(["lite", "starter", "growth", "pro", "enterprise"] as const).map((tierKey) => {
                        const val = (row as any)[tierKey];
                        const isGrowthCol = tierKey === "growth";
                        return (
                          <td
                            key={tierKey}
                            className={`p-4 text-center ${
                              isGrowthCol ? "bg-[#FDF1EB]/20 font-semibold" : ""
                            }`}
                          >
                            {typeof val === "boolean" ? (
                              val ? (
                                <Check className="w-4 h-4 text-[#E25822] mx-auto" />
                              ) : (
                                <Minus className="w-3.5 h-3.5 text-[#B0B3BA] mx-auto" />
                              )
                            ) : (
                              <span className="text-[#191919] font-medium">{val}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. ADD-ONS TABLE                                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="font-heading font-extrabold text-2xl text-[#191919] mb-1">
            Optional add-ons ({currency})
          </h2>
          <p className="text-xs text-[#62666D]">
            Add extra members, branding, or branches without changing your plan tier.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E7E4DE] bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-[#E7E4DE]">
                <th className="p-3.5 font-bold text-[#191919]">Add-on</th>
                <th className="p-3.5 font-bold text-[#191919]">Price ({currency})</th>
                <th className="p-3.5 font-bold text-[#191919]">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E4DE]/60">
              {ADDONS_LIST.map((addon, aIdx) => (
                <tr key={aIdx} className="hover:bg-[#FAF9F6] transition">
                  <td className="p-3.5 font-bold text-[#191919]">{addon.name}</td>
                  <td className="p-3.5 font-mono font-bold text-[#E25822]">
                    {addon.priceByCurrency[currency]}
                  </td>
                  <td className="p-3.5 text-[#62666D]">{addon.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. ENTERPRISE STRIP                                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="py-12 max-w-4xl mx-auto px-4">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E4DE] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div>
            <h3 className="font-heading font-extrabold text-xl text-[#191919] mb-1">
              400+ members or multiple branches?
            </h3>
            <p className="text-xs text-[#62666D]">
              We offer custom SLA contracts, API integrations, and dedicated account management.
            </p>
          </div>
          <a
            href="mailto:sales@repsi.app?subject=Enterprise%20Inquiry%20(400+%20members)"
            className="px-6 py-2.5 rounded-full bg-[#191919] hover:bg-[#333333] text-white text-xs font-bold transition shrink-0"
          >
            Talk to us
          </a>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 7. FAQ (8 SHORT QUESTIONS)                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="py-16 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#191919] mb-2">
            Frequently asked questions
          </h2>
          <p className="text-xs text-[#62666D]">
            Everything you need to know about billing, limits, and plans.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, fIdx) => {
            const isOpen = openFaq === fIdx;
            return (
              <div
                key={fIdx}
                className="rounded-2xl border border-[#E7E4DE] bg-white overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : fIdx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF9F6]"
                >
                  <span className="font-bold text-sm text-[#191919]">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#62666D] shrink-0 transition-transform ${
                      isOpen ? "rotate-180 text-[#E25822]" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-[#62666D] leading-relaxed border-t border-[#E7E4DE]/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 8. FOUNDER OFFER (SLIM BANNER SHOWN ONCE)                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="py-6 max-w-4xl mx-auto px-4">
        <div className="rounded-2xl bg-gradient-to-r from-[#FDF1EB] via-white to-[#FAF9F6] border border-[#FACBB7] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#E25822] shrink-0" />
            <div>
              <span className="text-xs font-bold text-[#191919] block">
                Founder Offer: Locked for life for the first 50 gyms
              </span>
              <span className="text-[11px] text-[#62666D]">
                Your subscription rate is locked for life while active, with guaranteed founder rates on future plan upgrades.
              </span>
            </div>
          </div>
          <Link
            href="/signup"
            className="text-xs font-bold text-[#E25822] hover:underline shrink-0 flex items-center gap-1"
          >
            Claim founder pricing <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 9. FINAL CTA                                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="py-16 text-center max-w-2xl mx-auto px-4">
        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#191919] mb-3">
          Ready to run your gym with Repsi?
        </h2>
        <p className="text-sm text-[#62666D] mb-6">
          Set up in under 5 minutes. No credit card required.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#E25822] hover:bg-[#C94715] text-white font-bold text-sm shadow-md shadow-[#E25822]/20 transition"
        >
          <span>Start your free trial</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
