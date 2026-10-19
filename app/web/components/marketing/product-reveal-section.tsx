"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Users,
  QrCode,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Search,
  ShieldCheck,
  Receipt,
  Sparkles,
} from "lucide-react";

type ProductTab = "members" | "attendance" | "payments";

export function ProductRevealSection() {
  const [activeTab, setActiveTab] = useState<ProductTab>("members");
  const shouldReduceMotion = useReducedMotion();

  const tabs: {
    id: ProductTab;
    title: string;
    tagline: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeText: string;
  }[] = [
    {
      id: "members",
      title: "Members",
      tagline: "Profiles, passes & automated renewals",
      icon: Users,
      badgeText: "1,248 Active Roster",
    },
    {
      id: "attendance",
      title: "Attendance",
      tagline: "0.3s QR gate sync & real-time logs",
      icon: QrCode,
      badgeText: "Live Turnstile Sync",
    },
    {
      id: "payments",
      title: "Payments",
      tagline: "Cashfree UPI auto-debit & receipts",
      icon: CreditCard,
      badgeText: "Instant Auto-Settlement",
    },
  ];

  return (
    <section
      id="product-reveal"
      className="relative w-full bg-[#FAF8F5] text-[#17191C] py-20 sm:py-28 lg:py-32 border-b border-[#E4E2DC] overflow-hidden"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 01. SECTION HEADER                                            */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-3.5"
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-bold tracking-[0.16em] uppercase text-[#D9532F] bg-[#FCEAE4] border border-[#F9D5CA]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F07858] animate-pulse" />
              One Workspace. Total Control.
            </span>
          </motion.div>

          <motion.h2
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[46px] text-[#17191C] tracking-tight leading-[1.12] mb-4"
          >
            Everything your fitness business needs. <br />
            <span className="text-[#F07858]">All in one place.</span>
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base text-[#6B6F76] max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Manage members, track attendance, monitor payments, and stay ahead of membership renewals from one connected workspace.
          </motion.p>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 02. THREE INTERACTIVE FEATURE SELECTORS                       */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-8 sm:mb-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-white border-[#E4E2DC] shadow-lg shadow-black/5 ring-2 ring-[#F07858]/30"
                    : "bg-white/70 hover:bg-white border-[#E4E2DC]/80 hover:border-[#E4E2DC] shadow-2xs"
                }`}
              >
                {/* Active Indicator Top Bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute top-0 left-4 right-4 h-1 bg-[#F07858] rounded-b-md"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-[#FCEAE4] text-[#F07858]"
                        : "bg-[#F7F7F5] text-[#6B6F76] group-hover:text-[#17191C]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-[#FAF8F5] text-[#6B6F76] border-[#E4E2DC]"
                    }`}
                  >
                    {tab.badgeText}
                  </span>
                </div>

                <h3
                  className={`font-heading font-bold text-base sm:text-lg mb-1 transition-colors ${
                    isActive ? "text-[#17191C]" : "text-[#17191C]/80"
                  }`}
                >
                  {tab.title}
                </h3>
                <p className="text-xs text-[#6B6F76] leading-relaxed">
                  {tab.tagline}
                </p>
              </button>
            );
          })}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 03. PRODUCT SHOWCASE STAGE: 100% LIGHT COMMAND CENTER        */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="relative rounded-[28px] sm:rounded-[32px] bg-white border border-[#E4E2DC] p-4 sm:p-7 lg:p-8 shadow-xl text-[#17191C] overflow-hidden">
          {/* Top Window Navigation Bar */}
          <div className="flex items-center justify-between border-b border-[#E4E2DC] pb-3.5 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 mr-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-xs tracking-wider text-[#17191C]">
                  REPSI
                </span>
                <span className="text-[11px] text-[#6B6F76] hidden sm:inline">
                  / Command Center
                </span>
              </div>
            </div>

            {/* Quick Filter Pill Switcher */}
            <div className="hidden sm:flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E4E2DC]">
              {(["members", "attendance", "payments"] as ProductTab[]).map((tabKey) => (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    activeTab === tabKey
                      ? "bg-[#F07858] text-white shadow-xs"
                      : "text-[#6B6F76] hover:text-[#17191C]"
                  }`}
                >
                  {tabKey}
                </button>
              ))}
            </div>

            {/* Live Operational Status */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-emerald-700">
                Gate 1 Active
              </span>
            </div>
          </div>

          {/* Dynamic Content Pane with AnimatePresence */}
          <div className="relative min-h-[380px] sm:min-h-[420px]">
            <AnimatePresence mode="wait">
              {/* ─────────────────────────────────────────────────────── */}
              {/* TAB 1: MEMBERS DIRECTORY VIEW                            */}
              {/* ─────────────────────────────────────────────────────── */}
              {activeTab === "members" && (
                <motion.div
                  key="members-view"
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {/* Top Bar with Search & KPI */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base sm:text-lg font-bold font-heading text-[#17191C]">
                        Member Directory & Passports
                      </h4>
                      <p className="text-xs text-[#6B6F76]">
                        1,248 active members • 42 renewals due this week
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4E2DC] rounded-lg px-3 py-1.5 text-xs text-[#6B6F76] w-full sm:w-60">
                        <Search className="w-3.5 h-3.5 text-[#6B6F76]" />
                        <span className="truncate">Search by name, phone, pass ID...</span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Member Records */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Member 1: Arjun */}
                    <div className="bg-[#FAF8F5] border border-[#E4E2DC] rounded-xl p-3.5 hover:border-[#F07858]/30 transition-all flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200">
                          AK
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#17191C]">Arjun Kumar</div>
                          <div className="text-[11px] text-[#6B6F76]">Annual VIP • Pass #RP-8841</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Active • 11 mos left
                        </span>
                        <div className="text-[10px] text-[#8C9097] mt-0.5">Last entry: 11:24 AM</div>
                      </div>
                    </div>

                    {/* Member 2: Priya */}
                    <div className="bg-[#FAF8F5] border border-[#E4E2DC] rounded-xl p-3.5 hover:border-[#F07858]/30 transition-all flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 border border-rose-200">
                          PN
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#17191C]">Priya Nair</div>
                          <div className="text-[11px] text-[#6B6F76]">Monthly Pro • Cashfree Auto-Pay</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-[10px] font-bold text-[#D9532F] bg-[#FCEAE4] px-2.5 py-0.5 rounded-full border border-[#F9D5CA]">
                          Renews in 3 days
                        </span>
                        <div className="text-[10px] text-[#8C9097] mt-0.5">Auto-Debit Ready</div>
                      </div>
                    </div>

                    {/* Member 3: Vikram */}
                    <div className="bg-[#FAF8F5] border border-[#E4E2DC] rounded-xl p-3.5 hover:border-[#F07858]/30 transition-all flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                          VS
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#17191C]">Vikram Singh</div>
                          <div className="text-[11px] text-[#6B6F76]">6-Month Strength • Coach Alex</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Active • 4 mos left
                        </span>
                        <div className="text-[10px] text-[#8C9097] mt-0.5">PT Session #12</div>
                      </div>
                    </div>

                    {/* Member 4: Sneha */}
                    <div className="bg-[#FAF8F5] border border-[#E4E2DC] rounded-xl p-3.5 hover:border-[#F07858]/30 transition-all flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-200">
                          SK
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#17191C]">Sneha Kapoor</div>
                          <div className="text-[11px] text-[#6B6F76]">Annual VIP • Pass #RP-9102</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Active • 10 mos left
                        </span>
                        <div className="text-[10px] text-[#8C9097] mt-0.5">Check-in: Yesterday</div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E4E2DC] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Zero paper logbooks needed. 100% digital member records.</span>
                    </div>
                    <span className="text-[#6B6F76] font-mono">
                      WhatsApp Passports Enabled
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────── */}
              {/* TAB 2: ATTENDANCE & TURNSTILE GATE VIEW                 */}
              {/* ─────────────────────────────────────────────────────── */}
              {activeTab === "attendance" && (
                <motion.div
                  key="attendance-view"
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base sm:text-lg font-bold font-heading text-[#17191C]">
                        Turnstile Gate Access & Live Occupancy
                      </h4>
                      <p className="text-xs text-[#6B6F76]">
                        Optical barrier synchronization • 300ms verification speed
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-bold">
                        Occupancy: 86 / 140
                      </span>
                    </div>
                  </div>

                  {/* Live Entry Stream Cards */}
                  <div className="space-y-2.5 pt-1">
                    <div className="bg-[#FAF8F5] border border-[#E4E2DC] rounded-xl p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono font-bold text-xs border border-emerald-200">
                          G1
                        </div>
                        <div>
                          <span className="font-bold text-[#17191C]">Arjun Kumar</span>
                          <span className="text-[#6B6F76] text-[11px] ml-2">Turnstile Gate 1 • QR Scan</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-700 font-bold text-[11px]">
                          Access Granted ✓
                        </span>
                        <span className="text-[#8C9097] text-[10px]">11:24:18 AM</span>
                      </div>
                    </div>

                    <div className="bg-[#FAF8F5] border border-[#E4E2DC] rounded-xl p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono font-bold text-xs border border-emerald-200">
                          G2
                        </div>
                        <div>
                          <span className="font-bold text-[#17191C]">Neha Sharma</span>
                          <span className="text-[#6B6F76] text-[11px] ml-2">Turnstile Gate 2 • Kiosk Face ID</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-700 font-bold text-[11px]">
                          Access Granted ✓
                        </span>
                        <span className="text-[#8C9097] text-[10px]">11:21:04 AM</span>
                      </div>
                    </div>

                    <div className="bg-[#FAF8F5] border border-[#E4E2DC] rounded-xl p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FCEAE4] text-[#D9532F] flex items-center justify-center font-mono font-bold text-xs border border-[#F9D5CA]">
                          DK
                        </div>
                        <div>
                          <span className="font-bold text-[#17191C]">Rohan Verma</span>
                          <span className="text-[#6B6F76] text-[11px] ml-2">Front Desk • Drop-in Pass</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[#D9532F] font-bold text-[11px]">
                          Fee Collected ✓
                        </span>
                        <span className="text-[#8C9097] text-[10px]">11:15:42 AM</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E4E2DC] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Zero unverified entries. Unpaid accounts automatically locked out.</span>
                    </div>
                    <span className="text-[#6B6F76] font-mono">
                      248 check-ins logged today
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────── */}
              {/* TAB 3: PAYMENTS & CASHFREE REVENUE STREAM               */}
              {/* ─────────────────────────────────────────────────────── */}
              {activeTab === "payments" && (
                <motion.div
                  key="payments-view"
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base sm:text-lg font-bold font-heading text-[#17191C]">
                        Payment Settlements & Auto-Debit
                      </h4>
                      <p className="text-xs text-[#6B6F76]">
                        Cashfree gateway integration • Instant WhatsApp invoices & receipts
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-[#D9532F] bg-[#FCEAE4] px-3 py-1 rounded-full border border-[#F9D5CA] font-bold">
                        Today: ₹48,500 Recd
                      </span>
                    </div>
                  </div>

                  {/* Transaction Ledger */}
                  <div className="space-y-2.5 pt-1">
                    <div className="bg-[#FAF8F5] border border-[#E4E2DC] rounded-xl p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200">
                          UPI
                        </div>
                        <div>
                          <span className="font-bold text-[#17191C]">Priya Nair</span>
                          <span className="text-[#6B6F76] text-[11px] ml-2">Annual Renewal Auto-Debit</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-700 font-bold text-sm">₹4,500</span>
                        <span className="text-emerald-700 text-[10px] font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Settled ✓
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#FAF8F5] border border-[#E4E2DC] rounded-xl p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs border border-blue-200">
                          CC
                        </div>
                        <div>
                          <span className="font-bold text-[#17191C]">Rahul Das</span>
                          <span className="text-[#6B6F76] text-[11px] ml-2">Personal Training 12-Pack</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-700 font-bold text-sm">₹12,000</span>
                        <span className="text-emerald-700 text-[10px] font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Settled ✓
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#FAF8F5] border border-[#E4E2DC] rounded-xl p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs border border-purple-200">
                          UPI
                        </div>
                        <div>
                          <span className="font-bold text-[#17191C]">Deepak Iyer</span>
                          <span className="text-[#6B6F76] text-[11px] ml-2">Monthly Gym Membership</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-700 font-bold text-sm">₹2,200</span>
                        <span className="text-emerald-700 text-[10px] font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Settled ✓
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E4E2DC] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <Receipt className="w-4 h-4 text-emerald-600" />
                      <span>Zero manual screenshot verification. Auto-reconciled with bank accounts.</span>
                    </div>
                    <span className="text-[#6B6F76] font-mono">
                      GST Invoices Generated
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 04. "YOUR BUSINESS, WHEREVER YOU ARE" + CLOSING CTA STRIP     */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="mt-12 sm:mt-16 bg-white rounded-3xl border border-[#E4E2DC] p-6 sm:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-2">
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#F07858] font-mono">
              ✦ Seamless Desktop & Mobile Access
            </span>
            <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#17191C] tracking-tight">
              Less admin. <span className="text-[#F07858]">More time to grow.</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#6B6F76] leading-relaxed">
              Spend your hours coaching members and expanding your fitness brand, while REPSI automates front-desk check-ins, fee collections, and renewals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 shrink-0">
            <Link
              href="/features"
              className="group inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-[#F07858] hover:bg-[#E56A4A] text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-md shadow-[#F07858]/30 hover:shadow-lg active:scale-95"
            >
              <span>Explore Features</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-white hover:bg-[#F7F7F5] border border-[#E4E2DC] text-[#17191C] text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95"
            >
              <span>Start Free Trial</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
