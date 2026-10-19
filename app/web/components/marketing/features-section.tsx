"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Users,
  CalendarCheck,
  RefreshCw,
  CreditCard,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Search,
  Filter,
  Plus,
  Lock,
  Download,
  Receipt,
  QrCode,
  Sparkles,
  Info,
} from "lucide-react";

type FeatureKey =
  | "members"
  | "attendance"
  | "memberships"
  | "payments"
  | "reports"
  | "staff";

interface FeatureModule {
  id: FeatureKey;
  number: string;
  name: string;
  headline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  capabilities: string[];
  disclaimer?: string;
}

export function FeaturesSection() {
  const [activeTab, setActiveTab] = useState<FeatureKey>("members");
  const shouldReduceMotion = useReducedMotion();

  const modules: FeatureModule[] = [
    {
      id: "members",
      number: "01",
      name: "Member management",
      headline: "Every member, organized.",
      description:
        "Keep member profiles, contact details, membership information and available history easy to access.",
      icon: Users,
      capabilities: [
        "Digital member profiles with photo, phone, and joining date",
        "Unique QR code member pass for instant verification",
        "Search members by name, phone number, or pass status",
        "Emergency contact information and member notes",
      ],
    },
    {
      id: "attendance",
      number: "02",
      name: "Attendance",
      headline: "Know who showed up.",
      description:
        "Record and review attendance using the check-in workflow available in REPSI.",
      icon: CalendarCheck,
      capabilities: [
        "Front-desk QR scan and manual 1-click check-in workflow",
        "Live attendance log showing who checked in and when",
        "Review daily, weekly, and monthly attendance history",
        "Monitor active member attendance consistency over time",
      ],
    },
    {
      id: "memberships",
      number: "03",
      name: "Memberships and renewals",
      headline: "Stay ahead of membership expiry.",
      description:
        "Review membership status, upcoming expiries and expired plans so your team can follow up.",
      icon: RefreshCw,
      capabilities: [
        "Clear status indicators for Active, Expiring Soon, and Expired",
        "7-day and 3-day upcoming expiry visibility for front-desk staff",
        "Track renewal dates and membership plan categories",
        "Follow up proactively before members lapse",
      ],
    },
    {
      id: "payments",
      number: "04",
      name: "Payment management",
      headline: "Make payment tracking clearer.",
      description:
        "Review recorded payments, outstanding dues and submitted receipts using the supported payment verification workflow.",
      icon: CreditCard,
      disclaimer:
        "Direct UPI payments are manually reviewed and verified by staff, unless connected via a supported payment gateway integration.",
      capabilities: [
        "Record cash, UPI, card, and bank transfer payments",
        "Track outstanding dues and uncollected balances per member",
        "Review submitted payment receipts and verify transactions",
        "Generate and download digital payment receipts",
      ],
    },
    {
      id: "reports",
      number: "05",
      name: "Reports and analytics",
      headline: "Understand your business activity.",
      description:
        "Use the available dashboard metrics and reports to review operational activity.",
      icon: BarChart3,
      capabilities: [
        "Daily, weekly, and monthly check-in volume metrics",
        "Active member counts and new membership additions",
        "Recorded collection summaries and overdue balances",
        "Export operational reports for business reviews",
      ],
    },
    {
      id: "staff",
      number: "06",
      name: "Staff and access management",
      headline: "Give your team the right access.",
      description:
        "Organize staff accounts and permissions according to the roles supported by REPSI.",
      icon: ShieldCheck,
      capabilities: [
        "Pre-defined roles: Owner, Manager, and Front Desk staff",
        "Grant front desk access to check-ins and member records",
        "Keep sensitive business settings restricted to owners",
        "Multi-login support for shared reception terminals",
      ],
    },
  ];

  const currentModule = modules.find((m) => m.id === activeTab) || modules[0];

  return (
    <section
      id="features"
      className="relative w-full bg-[#FAF9F6] text-[#191919] py-20 sm:py-28 lg:py-32 border-b border-[#E7E4DE] overflow-hidden"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 01. SECTION OPENING                                           */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-4"
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-bold tracking-[0.16em] uppercase text-[#F07858] bg-[#FFF0EA] border border-[#FFD2C3]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F07858] animate-pulse" />
              BUILT FOR YOUR DAILY OPERATIONS
            </span>
          </motion.div>

          <motion.h2
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[48px] text-[#191919] tracking-tight leading-[1.14] mb-4"
          >
            Everything your fitness business needs. <br className="hidden sm:inline" />
            <span className="text-[#F07858]">All in one place.</span>
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-base sm:text-lg text-[#62666D] max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Manage members, track activity and organize your daily operations from one connected workspace.
          </motion.p>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 02. INTERACTIVE FEATURE SELECTOR TABS                         */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeTab === mod.id;

            return (
              <button
                key={mod.id}
                onClick={() => setActiveTab(mod.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#F07858] text-white shadow-sm shadow-[#F07858]/30"
                    : "bg-white text-[#62666D] hover:text-[#191919] hover:bg-[#F5F2ED] border border-[#E7E4DE]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{mod.name}</span>
              </button>
            );
          })}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 03. TWO-COLUMN FEATURE SHOWCASE (TEXT LEFT, PREVIEW RIGHT)    */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-[28px] sm:rounded-[36px] border border-[#E7E4DE] p-6 sm:p-9 lg:p-11 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Feature Details */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="font-mono text-xs font-bold text-[#F07858] bg-[#FFF0EA] border border-[#FFD2C3] px-3 py-1 rounded-full uppercase">
                  Module {currentModule.number}
                </span>
                <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#191919] mt-3.5 mb-2 leading-tight">
                  “{currentModule.headline}”
                </h3>
                <p className="text-sm sm:text-base text-[#62666D] leading-relaxed">
                  {currentModule.description}
                </p>
              </div>

              {/* Capability Checklist */}
              <div className="space-y-3 pt-3 border-t border-[#F0EDE7]">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#858890] mb-1">
                  Supported Capabilities:
                </div>
                {currentModule.capabilities.map((cap, cIdx) => (
                  <div key={cIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#191919]">
                    <CheckCircle2 className="w-4 h-4 text-[#F07858] shrink-0 mt-0.5" />
                    <span className="leading-snug">{cap}</span>
                  </div>
                ))}
              </div>

              {/* Disclaimer for Payment Module */}
              {currentModule.disclaimer && (
                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E7E4DE] flex items-start gap-2.5 text-xs text-[#62666D]">
                  <Info className="w-4 h-4 text-[#F07858] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{currentModule.disclaimer}</span>
                </div>
              )}
            </div>

            {/* Right Column: Real Product UI Preview */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                {/* 01. MEMBERS TAB UI */}
                {activeTab === "members" && (
                  <motion.div
                    key="tab-members"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#FAF9F6] rounded-2xl border border-[#E7E4DE] p-4 sm:p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DE]">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#F07858]" />
                        <span className="text-sm font-bold text-[#191919]">Member Directory</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-[#62666D] bg-white border border-[#E7E4DE] px-2.5 py-0.5 rounded-full">
                        342 Members
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="bg-white p-3 rounded-xl border border-[#E7E4DE] flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#FFF0EA] text-[#F07858] font-bold text-xs flex items-center justify-center border border-[#FFD2C3]">
                            AS
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#191919]">Arjun Sharma</div>
                            <div className="text-[11px] text-[#62666D]">+91 98765 43210 • Annual Plan</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          Active Pass
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-[#E7E4DE] flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200">
                            PV
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#191919]">Pooja Verma</div>
                            <div className="text-[11px] text-[#62666D]">+91 94450 12890 • 3-Month Plan</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          Active Pass
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-[#E7E4DE] flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 font-bold text-xs flex items-center justify-center border border-amber-200">
                            RM
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#191919]">Rahul Mehta</div>
                            <div className="text-[11px] text-[#62666D]">+91 98201 55670 • Monthly Plan</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                          Expires in 3d
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 02. ATTENDANCE TAB UI */}
                {activeTab === "attendance" && (
                  <motion.div
                    key="tab-attendance"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#FAF9F6] rounded-2xl border border-[#E7E4DE] p-4 sm:p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DE]">
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4 text-[#F07858]" />
                        <span className="text-sm font-bold text-[#191919]">Today&apos;s Check-in Log</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        118 Recorded
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="bg-white p-3 rounded-xl border border-[#E7E4DE] flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <div>
                            <div className="text-xs font-bold text-[#191919]">Siddharth Rao</div>
                            <div className="text-[11px] text-[#62666D]">Front-desk QR Check-in</div>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-semibold text-[#191919]">
                          08:42 AM
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-[#E7E4DE] flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <div>
                            <div className="text-xs font-bold text-[#191919]">Divya Nair</div>
                            <div className="text-[11px] text-[#62666D]">Manual Check-in by Staff</div>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-semibold text-[#191919]">
                          08:35 AM
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-[#E7E4DE] flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <div>
                            <div className="text-xs font-bold text-[#191919]">Kavita Iyer</div>
                            <div className="text-[11px] text-[#62666D]">Front-desk QR Check-in</div>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-semibold text-[#191919]">
                          08:12 AM
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 03. MEMBERSHIPS TAB UI */}
                {activeTab === "memberships" && (
                  <motion.div
                    key="tab-memberships"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#FAF9F6] rounded-2xl border border-[#E7E4DE] p-4 sm:p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DE]">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-[#F07858]" />
                        <span className="text-sm font-bold text-[#191919]">Renewal Status</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        9 Expiring Soon
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="bg-white p-3 rounded-xl border border-[#E7E4DE] flex items-center justify-between shadow-2xs">
                        <div>
                          <div className="text-xs font-bold text-[#191919]">Vikas Jain</div>
                          <div className="text-[11px] text-[#62666D]">Quarterly Plan • Expires in 2 days</div>
                        </div>
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                          Follow Up
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-[#E7E4DE] flex items-center justify-between shadow-2xs">
                        <div>
                          <div className="text-xs font-bold text-[#191919]">Ananya Deshmukh</div>
                          <div className="text-[11px] text-[#62666D]">Annual Plan • Expires in 5 days</div>
                        </div>
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                          Follow Up
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-[#E7E4DE] flex items-center justify-between shadow-2xs">
                        <div>
                          <div className="text-xs font-bold text-[#191919]">Deepak Malhotra</div>
                          <div className="text-[11px] text-[#62666D]">Monthly Plan • Expired Yesterday</div>
                        </div>
                        <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                          Lapsed
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 04. PAYMENTS TAB UI */}
                {activeTab === "payments" && (
                  <motion.div
                    key="tab-payments"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#FAF9F6] rounded-2xl border border-[#E7E4DE] p-4 sm:p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DE]">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#F07858]" />
                        <span className="text-sm font-bold text-[#191919]">Payment Records</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-[#191919] bg-white border border-[#E7E4DE] px-2.5 py-0.5 rounded-full">
                        ₹48,500 Recorded
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="bg-white p-3 rounded-xl border border-[#E7E4DE] flex items-center justify-between shadow-2xs">
                        <div>
                          <div className="text-xs font-bold text-[#191919]">Sunil Chhetri</div>
                          <div className="text-[11px] text-[#62666D]">UPI Transfer • Receipt Verified</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-emerald-700">+₹4,500</div>
                          <span className="text-[10px] text-emerald-700 font-medium">Recorded</span>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-[#E7E4DE] flex items-center justify-between shadow-2xs">
                        <div>
                          <div className="text-xs font-bold text-[#191919]">Meera Kapoor</div>
                          <div className="text-[11px] text-[#62666D]">Cash Receipt • Front-desk collected</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-emerald-700">+₹2,000</div>
                          <span className="text-[10px] text-emerald-700 font-medium">Recorded</span>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-[#E7E4DE] flex items-center justify-between shadow-2xs">
                        <div>
                          <div className="text-xs font-bold text-[#191919]">Gaurav Sen</div>
                          <div className="text-[11px] text-[#62666D]">Pending Quarterly Due</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-amber-700">₹3,500</div>
                          <span className="text-[10px] text-amber-800 font-medium">Due Pending</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 05. REPORTS TAB UI */}
                {activeTab === "reports" && (
                  <motion.div
                    key="tab-reports"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#FAF9F6] rounded-2xl border border-[#E7E4DE] p-4 sm:p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DE]">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#F07858]" />
                        <span className="text-sm font-bold text-[#191919]">Operational Overview</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-[#62666D] bg-white border border-[#E7E4DE] px-2.5 py-0.5 rounded-full">
                        This Month
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3.5 rounded-xl border border-[#E7E4DE] shadow-2xs">
                        <div className="text-[11px] text-[#62666D]">Total Active Members</div>
                        <div className="text-xl font-heading font-extrabold text-[#191919] mt-1">342</div>
                        <div className="text-[10px] text-emerald-700 mt-0.5">+24 this month</div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-[#E7E4DE] shadow-2xs">
                        <div className="text-[11px] text-[#62666D]">Total Check-ins</div>
                        <div className="text-xl font-heading font-extrabold text-[#191919] mt-1">2,840</div>
                        <div className="text-[10px] text-emerald-700 mt-0.5">Consistent visits</div>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#E7E4DE] flex items-center justify-between shadow-2xs text-xs">
                      <span className="font-medium text-[#191919]">Monthly Member Retention</span>
                      <span className="font-bold text-[#F07858]">92.4%</span>
                    </div>
                  </motion.div>
                )}

                {/* 06. STAFF TAB UI */}
                {activeTab === "staff" && (
                  <motion.div
                    key="tab-staff"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#FAF9F6] rounded-2xl border border-[#E7E4DE] p-4 sm:p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DE]">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#F07858]" />
                        <span className="text-sm font-bold text-[#191919]">Team Roles & Access</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        3 Accounts
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="bg-white p-3 rounded-xl border border-[#E7E4DE] flex items-center justify-between shadow-2xs">
                        <div>
                          <div className="text-xs font-bold text-[#191919]">Owner Account</div>
                          <div className="text-[11px] text-[#62666D]">Full administrative access</div>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          Full Control
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-[#E7E4DE] flex items-center justify-between shadow-2xs">
                        <div>
                          <div className="text-xs font-bold text-[#191919]">Front Desk Staff</div>
                          <div className="text-[11px] text-[#62666D]">Check-ins, members & dues</div>
                        </div>
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                          Operations Access
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 04. FEATURE CTA STRIP                                         */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="mt-12 sm:mt-16 text-center bg-white rounded-3xl border border-[#E7E4DE] p-8 sm:p-12 shadow-2xs">
          <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#191919] mb-2.5">
            See what REPSI can simplify.
          </h3>
          <p className="text-sm sm:text-base text-[#62666D] max-w-xl mx-auto mb-7">
            Start organizing your members, attendance, and payments with a free 14-day trial.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-11 px-7 rounded-full bg-[#F07858] hover:bg-[#E76543] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm shadow-[#F07858]/25 hover:shadow-md active:scale-95"
            >
              <span>Get Started Free</span>
            </Link>

            <Link
              href="/features"
              className="group inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-white hover:bg-[#F5F2ED] border border-[#E7E4DE] text-[#191919] text-xs sm:text-sm font-semibold transition-all active:scale-95"
            >
              <span>View All Features</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
