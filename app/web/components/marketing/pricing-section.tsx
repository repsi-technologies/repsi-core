"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Check,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Layers,
  Users,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Building2,
  ShieldCheck,
  HelpCircle,
  Smartphone,
  FileText,
  Dumbbell,
  Apple,
  Clock,
  Zap,
  TrendingUp,
  Percent,
  MessageSquare,
  Globe,
  Code2,
  CheckCircle2,
  Lock,
} from "lucide-react";
import {
  CURRENCIES,
  CurrencyCode,
  BillingCycle,
  GLOBAL_PLANS,
  GLOBAL_ADDONS,
} from "@/lib/pricing-data";

export function PricingSection() {
  // Default to 1 year and INR (or USD for global)
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [activeTab, setActiveTab] = useState<"plans" | "addons" | "limits" | "rules">("plans");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const curr = CURRENCIES[currency];

  const limits = [
    { label: "Active members", lite: "20", starter: "50", growth: "150", pro: "400", enterprise: "400+" },
    { label: "Gym branches", lite: "1", starter: "1", growth: "1", pro: "3", enterprise: "Unlimited" },
    { label: "Trainer accounts", lite: "1", starter: "3", growth: "10", pro: "30", enterprise: "Unlimited" },
    { label: "Staff logins", lite: "1", starter: "3", growth: "10", pro: "30", enterprise: "Unlimited" },
    { label: "Membership plans", lite: "3", starter: "10", growth: "Unlimited", pro: "Unlimited", enterprise: "Unlimited" },
    { label: "Active classes & batches", lite: "—", starter: "—", growth: "20", pro: "Unlimited", enterprise: "Unlimited" },
    { label: "Attendance history", lite: "3 months", starter: "1 year", growth: "3 years", pro: "Unlimited", enterprise: "Unlimited" },
    { label: "Cloud file storage", lite: "100 MB", starter: "1 GB", growth: "5 GB", pro: "20 GB", enterprise: "Custom" },
    { label: "Data export formats", lite: "CSV", starter: "CSV", growth: "CSV, Excel, PDF", pro: "CSV, Excel, PDF", enterprise: "+ Full API" },
    { label: "AI credits / month", lite: "—", starter: "—", growth: "—", pro: "200 credits", enterprise: "Custom" },
    { label: "Support level", lite: "Self-serve (email)", starter: "Email (24h SLA)", growth: "WhatsApp support", pro: "Priority phone + WhatsApp", enterprise: "Dedicated Manager" },
  ];

  const rules = [
    {
      title: "1. Fair Member Cap & Grace Period",
      desc: "Only active, non-expired members count. You receive a 10% grace allowance over your member cap, and member check-ins are never blocked. After 30 consecutive days over the cap, the system gently prompts the owner to buy a member pack or upgrade. Repsi never auto-charges your card.",
    },
    {
      title: "2. Fixed Currency Pricing (No Live Jitter)",
      desc: "Prices are fixed per currency and do not fluctuate daily with live forex rates. We review rates quarterly. Emerging markets (Bangladesh, Sri Lanka, Nepal, Philippines, Indonesia, Africa) qualify for a 50% regional discount via payment provider detection.",
    },
    {
      title: "3. Transparent Taxes & Exclusions",
      desc: "Indian prices are final amounts (no GST charged until registered). Global prices (USD, EUR, GBP, AED) exclude local VAT/Sales Tax, which is handled transparently through Merchant of Record providers (Paddle / Lemon Squeezy).",
    },
    {
      title: "4. Instant Upgrades with Pro-Rata Credit",
      desc: "Upgrade anytime with instant activation. The unused portion of your existing subscription period is credited towards your new tier on Cashfree.",
    },
    {
      title: "5. Safe Downgrade & Data Preservation",
      desc: "Downgrades take effect at the end of the paid billing period. If active members exceed the lower cap, downgrade requires archiving excess members first. Zero data is deleted on downgrade; higher features become read-only.",
    },
    {
      title: "6. 7-Day Refund Policy",
      desc: "Full money-back guarantee within 7 days of purchase on all 6-month and 1-year plans. Monthly plans are non-refundable but can be cancelled anytime with no recurring fee.",
    },
    {
      title: "7. Lifetime Founder Offer",
      desc: "The first 50 registered gym workspaces worldwide lock these launch prices permanently for life. Even when public prices rise, your rate remains permanently frozen.",
    },
    {
      title: "8. Global Feature Parity",
      desc: "All plan limits (members, branches, trainers, storage) remain identical everywhere in the world. Only the currency and regional purchasing power price list changes.",
    },
  ];

  const faqs = [
    {
      q: "How does payment work for gym owners and gym members?",
      a: "Gym owners pay Repsi for the platform subscription using our Cashfree API payment gateway (or global cards). Meanwhile, gym members pay their gym fees directly to the gym owner using the gym's own UPI ID or Merchant QR code, and submit proof for instant verification on the owner dashboard.",
    },
    {
      q: "Are prices converted live based on daily exchange rates?",
      a: "No. We maintain fixed, predictable price lists per currency (INR, USD, EUR, GBP, AED). Continuous 1:1 live conversion changes daily, which looks unprofessional and creates payment gateway micro-fee issues. Prices are reviewed quarterly.",
    },
    {
      q: "How are taxes handled for international customers?",
      a: "Global prices (USD, EUR, GBP, AED) are listed excluding tax. VAT or sales tax in the US, EU, and UK depends on the buyer's country and whether you are a registered business, handled via Merchant-of-Record compliance.",
    },
    {
      q: "What happens if our gym exceeds the active member limit?",
      a: "Repsi gives a 10% grace limit and never blocks your front-desk QR check-in. If you stay over capacity for more than 30 days, you can simply add a +50 member pack without moving up a full plan tier.",
    },
  ];

  return (
    <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* HEADER, CURRENCY SELECTOR & BILLING TOGGLE                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FDF1EB] border border-[#FACBB7] text-[#E25822] text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Global Multi-Currency Pricing · Transparent & Predictable</span>
        </div>

        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#191919] tracking-tight leading-[1.14] mb-3">
          Predictable gym software pricing starting at{" "}
          <span className="text-[#E25822]">
            {curr.symbol}
            {GLOBAL_PLANS.find((p) => p.id === "lite")?.pricing[currency].yearly.perMonth}/mo.
          </span>
        </h2>

        <p className="text-sm sm:text-base text-[#62666D] max-w-2xl mx-auto leading-relaxed">
          {curr.taxNote} Pay online through the website on your dashboard via Cashfree.
        </p>

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

        {/* 4 Billing Cycles Switcher */}
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
            <span>1 Year (Recommended)</span>
            <span className="text-[10px] bg-white/20 text-white font-bold px-1.5 py-0.2 rounded-full">
              35% OFF
            </span>
          </button>
        </div>

        <div className="mt-3 text-xs font-medium text-[#858890]">
          ⚡ Founder offer: The first 50 gyms worldwide get these prices locked for life.
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* NAVIGATION TABS: PLANS | ADD-ONS | LIMITS | RULES             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex justify-center mb-10 border-b border-[#E7E4DE] pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("plans")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
              activeTab === "plans"
                ? "bg-[#191919] text-white"
                : "bg-white text-[#62666D] border border-[#E7E4DE] hover:bg-[#F5F2ED]"
            }`}
          >
            All Plans & Tiers
          </button>
          <button
            onClick={() => setActiveTab("addons")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
              activeTab === "addons"
                ? "bg-[#191919] text-white"
                : "bg-white text-[#62666D] border border-[#E7E4DE] hover:bg-[#F5F2ED]"
            }`}
          >
            Add-on Packs ({currency})
          </button>
          <button
            onClick={() => setActiveTab("limits")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
              activeTab === "limits"
                ? "bg-[#191919] text-white"
                : "bg-white text-[#62666D] border border-[#E7E4DE] hover:bg-[#F5F2ED]"
            }`}
          >
            Feature Limits Matrix
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
              activeTab === "rules"
                ? "bg-[#191919] text-white"
                : "bg-white text-[#62666D] border border-[#E7E4DE] hover:bg-[#F5F2ED]"
            }`}
          >
            Global Rules & Tax Policies
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 01. TAB: PLANS GRID                                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "plans" && (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch">
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

          {/* TWO PAYMENT FLOWS CALLOUT */}
          <div className="bg-[#FAF9F6] border border-[#E7E4DE] rounded-3xl p-6 sm:p-8">
            <h3 className="font-heading font-extrabold text-xl text-[#191919] mb-3">
              How Payments Operate in Repsi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#62666D] leading-relaxed">
              <div className="p-4 rounded-2xl bg-white border border-[#E7E4DE]">
                <div className="font-bold text-[#191919] text-sm mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#E25822]" />
                  <span>Gym Owner → Repsi (Platform Subscription)</span>
                </div>
                <p>
                  Gym owners pay their platform subscription through the Cashfree gateway (or international cards) directly on their dashboard under <strong>Settings → Billing</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E7E4DE]">
                <div className="font-bold text-[#191919] text-sm mb-1.5 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Gym Member → Gym Owner (Gym Fees & Dues)</span>
                </div>
                <p>
                  Members pay their gym fees directly to the gym owner using the gym's UPI ID or QR code. The member submits proof, and the owner approves it with instant receipt generation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 02. TAB: ADD-ON PACKS                                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "addons" && (
        <div className="bg-white rounded-3xl border border-[#E7E4DE] overflow-hidden shadow-xs">
          <div className="p-6 bg-[#FAF9F6] border-b border-[#E7E4DE] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-heading font-extrabold text-xl text-[#191919]">
                Optional Platform Add-ons ({currency})
              </h3>
              <p className="text-xs text-[#62666D] mt-1">
                Add-ons follow the plan's billing cycle and discount (10% off for 3mo, 25% off for 6mo, 35% off for 1yr).
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-primary px-3 py-1 bg-white border border-[#E7E4DE] rounded-full">
              Currency: {currency}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E7E4DE] bg-[#FAF9F6]/50 text-[#858890] font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-5 font-semibold">Add-on Item</th>
                  <th className="py-3 px-5 font-semibold">Monthly Price</th>
                  <th className="py-3 px-5 font-semibold">Annual Price (35% off)</th>
                  <th className="py-3 px-5 font-semibold">Available On</th>
                  <th className="py-3 px-5 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE7]">
                {GLOBAL_ADDONS.map((add, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF9F6]/60 transition-colors">
                    <td className="py-4 px-5 font-bold text-[#191919]">{add.name}</td>
                    <td className="py-4 px-5 font-mono font-bold text-[#E25822]">
                      {add.priceByCurrency[currency].monthly}
                    </td>
                    <td className="py-4 px-5 font-mono font-bold text-emerald-600">
                      {add.priceByCurrency[currency].yearly}
                    </td>
                    <td className="py-4 px-5 text-[#191919] font-medium">{add.availableOn}</td>
                    <td className="py-4 px-5 text-[#62666D] max-w-xs">{add.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 03. TAB: LIMITS MATRIX                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "limits" && (
        <div className="bg-white rounded-3xl border border-[#E7E4DE] overflow-hidden shadow-xs">
          <div className="p-6 bg-[#FAF9F6] border-b border-[#E7E4DE]">
            <h3 className="font-heading font-extrabold text-xl text-[#191919]">
              Feature & Capacity Limits Matrix
            </h3>
            <p className="text-xs text-[#62666D] mt-1">
              Soft cap on members with a 10% grace allowance; hard cap on staff logins and branches. Limits are identical worldwide.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E7E4DE] bg-[#FAF9F6]/50 text-[#858890] font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-5 font-semibold">Limit / Metric</th>
                  <th className="py-3 px-5 font-semibold">Lite</th>
                  <th className="py-3 px-5 font-semibold">Starter</th>
                  <th className="py-3 px-5 font-semibold text-[#E25822]">Growth ⭐</th>
                  <th className="py-3 px-5 font-semibold">Pro</th>
                  <th className="py-3 px-5 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE7]">
                {limits.map((l, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF9F6]/60 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-[#191919]">{l.label}</td>
                    <td className="py-3.5 px-5 font-mono">{l.lite}</td>
                    <td className="py-3.5 px-5 font-mono">{l.starter}</td>
                    <td className="py-3.5 px-5 font-mono font-bold text-[#E25822] bg-[#FDF1EB]/30">{l.growth}</td>
                    <td className="py-3.5 px-5 font-mono">{l.pro}</td>
                    <td className="py-3.5 px-5 font-mono font-bold text-indigo-600">{l.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 04. TAB: RULES & POLICIES                                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "rules" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.map((rule, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-[#E7E4DE] p-6 shadow-xs space-y-2">
              <h4 className="font-heading font-extrabold text-base text-[#191919]">
                {rule.title}
              </h4>
              <p className="text-xs text-[#62666D] leading-relaxed">
                {rule.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FAQ SECTION                                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h3 className="font-heading font-extrabold text-2xl text-[#191919] text-center mb-6">
          Frequently Asked Questions
        </h3>

        <div className="space-y-3">
          {faqs.map((faq, fIdx) => (
            <div
              key={fIdx}
              className="bg-white border border-[#E7E4DE] rounded-2xl overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === fIdx ? null : fIdx)}
                className="w-full py-4 px-5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-[#191919] cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#858890] transition-transform ${
                    openFaq === fIdx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaq === fIdx && (
                <div className="px-5 pb-4 text-xs text-[#62666D] leading-relaxed border-t border-[#F0EDE7] pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
