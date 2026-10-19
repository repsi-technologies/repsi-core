"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  CreditCard,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Receipt,
  Users,
  Clock,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface StoryItem {
  id: "attendance" | "payments" | "renewals";
  stepNumber: string;
  tabLabel: string;
  bottleneckBadge: string;
  bottleneckTitle: string;
  bottleneckDesc: string;
  solutionBadge: string;
  solutionTitle: string;
  solutionDesc: string;
  metrics: { label: string; value: string; helper: string };
  previewType: "attendance" | "payments" | "renewals";
}

const STORY_ITEMS: StoryItem[] = [
  {
    id: "attendance",
    stepNumber: "01",
    tabLabel: "Attendance & Entry",
    bottleneckBadge: "The Front Desk Bottleneck",
    bottleneckTitle: "Manual sign-in sheets and peak-hour reception queues.",
    bottleneckDesc:
      "Between 6:00 PM and 8:30 PM, front-desk staff juggle paper logbooks, unverified phone numbers, and members waiting in line. Inactive accounts and unpaid guests slip through unverified.",
    solutionBadge: "The REPSI Solution",
    solutionTitle: "0.3s Contactless QR Scan & Turnstile Gate Sync",
    solutionDesc:
      "Members scan a dynamic QR code on their smartphone or at the desk kiosk. REPSI validates active membership in 300ms, opens the turnstile, and syncs live occupancy to the manager's screen.",
    metrics: {
      label: "Check-in Speed",
      value: "0.3s",
      helper: "Average validation latency per member",
    },
    previewType: "attendance",
  },
  {
    id: "payments",
    stepNumber: "02",
    tabLabel: "Payments & Invoicing",
    bottleneckBadge: "The Front Desk Bottleneck",
    bottleneckTitle: "WhatsApp screenshot proofs and manual cash ledgers.",
    bottleneckDesc:
      "Members say 'I already sent the UPI screenshot on WhatsApp.' Staff waste hours cross-referencing bank statements, updating Excel sheets, and manually writing out tax receipts.",
    solutionBadge: "The REPSI Solution",
    solutionTitle: "Direct Cashfree UPI & Instant WhatsApp Tax Receipts",
    solutionDesc:
      "Members pay instantly via dynamic UPI QR, autopay, or payment link. Cashfree automatically reconciles settlements directly to your bank account and dispatches GST-compliant tax invoices via WhatsApp.",
    metrics: {
      label: "Reconciliation",
      value: "100%",
      helper: "Zero manual UPI screenshot verification",
    },
    previewType: "payments",
  },
  {
    id: "renewals",
    stepNumber: "03",
    tabLabel: "Expiries & Renewals",
    bottleneckBadge: "The Front Desk Bottleneck",
    bottleneckTitle: "Silent membership expiries and unnoticed churn.",
    bottleneckDesc:
      "Gyms lose up to 30% of their roster simply because nobody noticed a member's 3-month plan expired. By the time front desk realizes, the workout habit is broken and the member is gone.",
    solutionBadge: "The REPSI Solution",
    solutionTitle: "Automated WhatsApp Cadence & 1-Click Renewals",
    solutionDesc:
      "REPSI tracks expiry dates automatically. Members receive personalized WhatsApp renewal reminders at 7 days and 1 day before expiry with a 1-tap checkout link. If an expired member arrives, the turnstile flags it with a friendly renewal screen.",
    metrics: {
      label: "Retention Rate",
      value: "92.4%",
      helper: "Average on-time renewal rate across branches",
    },
    previewType: "renewals",
  },
];

export function ReceptionStorySection() {
  const [activeTab, setActiveTab] = useState<"attendance" | "payments" | "renewals">("attendance");

  const activeItem = STORY_ITEMS.find((item) => item.id === activeTab) || STORY_ITEMS[0];

  return (
    <section
      id="how-it-works"
      className="relative bg-[#17191C] pt-20 sm:pt-28 pb-24 sm:pb-32 px-5 sm:px-8 lg:px-12 text-white overflow-hidden border-t border-white/5"
    >
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-[#E25822]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[450px] h-[350px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header: The Reception Journey */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-[0.16em] uppercase text-[#E25822] bg-[#E25822]/10 border border-[#E25822]/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E25822]" />
            From the entrance to reception
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-[#F7F7F5] leading-tight">
            Where fitness businesses <br className="hidden sm:inline" />
            <span className="text-[#E25822]">lose time and revenue.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#A6A8AC] leading-relaxed">
            Walk into reception at 7:00 PM on a Monday. Here are the three operational bottlenecks gym owners deal with every day—and how REPSI automates them in real time.
          </p>
        </div>

        {/* 3 Step Interactive Tab Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 sm:mb-12 border-b border-white/10 pb-4">
          {STORY_ITEMS.map((item) => {
            const isActive = item.id === activeTab;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`text-left p-4 sm:p-5 rounded-2xl transition-all duration-200 cursor-pointer relative ${
                  isActive
                    ? "bg-[#24272B] border border-white/15 shadow-xl shadow-black/40"
                    : "bg-white/[0.02] hover:bg-white/[0.05] border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-mono font-bold tracking-wider ${
                      isActive ? "text-[#E25822]" : "text-[#70747A]"
                    }`}
                  >
                    STEP {item.stepNumber}
                  </span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#E25822] animate-pulse" />
                  )}
                </div>
                <h3
                  className={`text-base sm:text-lg font-bold font-heading ${
                    isActive ? "text-white" : "text-[#A6A8AC]"
                  }`}
                >
                  {item.tabLabel}
                </h3>
              </button>
            );
          })}
        </div>

        {/* Main Problem / Solution Showcase Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch"
          >
            {/* Left Column: Problem vs Solution Narrative */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              {/* Problem Section (Red/Amber) */}
              <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-red-400">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{activeItem.bottleneckBadge}</span>
                </div>
                <h4 className="text-lg font-bold text-white">
                  {activeItem.bottleneckTitle}
                </h4>
                <p className="text-sm text-[#A6A8AC] leading-relaxed">
                  {activeItem.bottleneckDesc}
                </p>
              </div>

              {/* Solution Section (Green/Orange) */}
              <div className="p-6 rounded-2xl bg-[#24272B] border border-white/10 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#E25822]">
                    <CheckCircle2 className="w-4 h-4 text-[#E25822] shrink-0" />
                    <span>{activeItem.solutionBadge}</span>
                  </div>
                  <h4 className="text-xl font-bold font-heading text-white">
                    {activeItem.solutionTitle}
                  </h4>
                  <p className="text-sm text-[#A6A8AC] leading-relaxed">
                    {activeItem.solutionDesc}
                  </p>
                </div>

                {/* Key Metric Pill */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold font-heading text-white">
                      {activeItem.metrics.value}
                    </div>
                    <div className="text-xs text-[#70747A]">
                      {activeItem.metrics.label} • {activeItem.metrics.helper}
                    </div>
                  </div>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E25822] hover:text-[#F9872D] transition-colors"
                  >
                    <span>Test workflow</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: High-Fidelity Real REPSI Product UI Mockup */}
            <div className="lg:col-span-7 bg-[#24272B] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col justify-center">
              {/* Product UI Top Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs font-mono text-[#70747A] ml-2">
                    repsi.app/workspace/frontdesk
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#E25822] bg-[#E25822]/10 px-2.5 py-1 rounded-md border border-[#E25822]/20">
                  REPSI Live OS
                </span>
              </div>

              {/* Render Respective High-Fidelity UI */}
              {activeItem.previewType === "attendance" && (
                <div className="space-y-4">
                  {/* Gate Controller Status */}
                  <div className="bg-[#17191C] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Turnstile Gate 01 • Main Entrance</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <div className="text-xs text-[#70747A]">
                          Dynamic QR Reader • 12ms network sync
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      DOOR UNLOCKED
                    </span>
                  </div>

                  {/* Real Member Validation Cards */}
                  <div className="space-y-2.5">
                    <div className="bg-[#1E2125] p-3.5 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E25822] text-white flex items-center justify-center font-bold text-sm">
                          AS
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">
                            Arjun Sharma
                          </div>
                          <div className="text-xs text-[#A6A8AC]">
                            Annual VIP Tier • Valid till Nov 2026
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>0.3s Verified</span>
                        </div>
                        <div className="text-[11px] text-[#70747A]">07:14 PM</div>
                      </div>
                    </div>

                    <div className="bg-[#1E2125] p-3.5 rounded-xl border border-white/10 flex items-center justify-between opacity-80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-700 text-white flex items-center justify-center font-bold text-sm">
                          NP
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">
                            Neha Patel
                          </div>
                          <div className="text-xs text-[#A6A8AC]">
                            Monthly Yoga Pass • 18 Check-ins this month
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </div>
                        <div className="text-[11px] text-[#70747A]">07:12 PM</div>
                      </div>
                    </div>
                  </div>

                  {/* Live Capacity Meter */}
                  <div className="bg-[#17191C] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#70747A] uppercase tracking-wider font-semibold">
                        Live Gym Headcount
                      </div>
                      <div className="text-lg font-bold text-white mt-0.5">
                        48 Members Currently Checked In
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-[#E25822] bg-[#E25822]/10 px-2.5 py-1 rounded-md">
                        60% Peak Capacity
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeItem.previewType === "payments" && (
                <div className="space-y-4">
                  {/* Payment Inflow Alert */}
                  <div className="bg-[#17191C] p-4 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>+₹4,500.00 Received</span>
                          <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            Auto-Settled
                          </span>
                        </div>
                        <div className="text-xs text-[#70747A]">
                          Cashfree UPI • HDFC Settlement A/C ****4921
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs font-mono text-[#70747A]">
                      Just now
                    </div>
                  </div>

                  {/* Real WhatsApp Tax Invoice Card */}
                  <div className="bg-[#1E2125] p-4 rounded-xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">
                          Automated WhatsApp Dispatch
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400">
                        Delivered ✓✓
                      </span>
                    </div>

                    <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-lg text-xs text-[#F7F7F5] space-y-1 font-mono">
                      <p className="text-emerald-400 font-bold">
                        REPSI Tax Invoice #REP-2026-0842
                      </p>
                      <p className="text-[#A6A8AC]">
                        Member: Rahul Verma (+91 98765 43210)
                      </p>
                      <p className="text-[#A6A8AC]">
                        Plan: 3-Month Crossfit Membership • ₹4,500
                      </p>
                      <p className="text-[#A6A8AC]">
                        GSTIN: 33AAACR2984M1Z2 (18% GST Compliant)
                      </p>
                    </div>
                  </div>

                  {/* Settlement Total */}
                  <div className="bg-[#17191C] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#70747A] uppercase tracking-wider font-semibold">
                        Today's Automated Collection
                      </div>
                      <div className="text-xl font-bold font-heading text-white mt-0.5">
                        ₹42,500.00
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      0 Disputed Receipts
                    </span>
                  </div>
                </div>
              )}

              {activeItem.previewType === "renewals" && (
                <div className="space-y-4">
                  {/* Upcoming Expiry Automation */}
                  <div className="bg-[#17191C] p-4 rounded-xl border border-[#E25822]/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E25822]/10 text-[#E25822] flex items-center justify-center font-bold">
                        <CalendarCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">
                          Automated WhatsApp Expiry Cadence
                        </div>
                        <div className="text-xs text-[#70747A]">
                          Triggered at T-7 days and T-1 day before expiry
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#E25822] bg-[#E25822]/10 px-3 py-1 rounded-full border border-[#E25822]/20">
                      ACTIVE CADENCE
                    </span>
                  </div>

                  {/* WhatsApp Automated Message Preview */}
                  <div className="bg-[#1E2125] p-4 rounded-xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#A6A8AC]">
                      <span>WhatsApp Preview (Sent to Priya M.)</span>
                      <span className="text-emerald-400 font-mono">1-Tap Pay Link</span>
                    </div>

                    <div className="bg-[#17191C] p-3.5 rounded-lg border border-white/10 text-xs space-y-2">
                      <p className="text-[#F7F7F5]">
                        "Hi Priya! Your 3-Month Pilates Membership at Apex Studio expires in 3 days (Oct 24). Tap below to renew in 10 seconds and keep your preferred slot:"
                      </p>
                      <div className="inline-block bg-[#E25822] text-white font-bold text-xs px-3 py-1.5 rounded-lg">
                        Renew Now • ₹5,200 ↗
                      </div>
                    </div>
                  </div>

                  {/* Retention Metric */}
                  <div className="bg-[#17191C] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#70747A] uppercase tracking-wider font-semibold">
                        On-Time Retention Rate
                      </div>
                      <div className="text-xl font-bold font-heading text-white mt-0.5">
                        92.4% Retained
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400">
                        +₹1,42,800 Retained
                      </div>
                      <div className="text-[11px] text-[#70747A]">This Month</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
