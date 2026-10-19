"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Users,
  CalendarCheck,
  CreditCard,
  RefreshCw,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface ModuleData {
  number: string;
  title: string;
  tagline: string;
  description: string;
  problemSolved: string;
  icon: React.ComponentType<{ className?: string }>;
  highlights: string[];
}

export function FeaturesBenefitsSection() {
  const shouldReduceMotion = useReducedMotion();

  const modules: ModuleData[] = [
    {
      number: "01",
      title: "Member Management",
      tagline: "Centralized profiles & member passports",
      description:
        "Keep member profiles, contact details, membership plans, joining dates and renewal dates organized in one place.",
      problemSolved:
        "Member details scattered across notebooks, spreadsheets and messaging apps.",
      icon: Users,
      highlights: [
        "Digital member passes with QR codes",
        "Instant search by name, phone or pass ID",
        "WhatsApp member card delivery",
        "Emergency contact & health notes",
      ],
    },
    {
      number: "02",
      title: "Attendance Tracking",
      tagline: "Fast QR gate sync & daily logbooks",
      description:
        "Record daily check-ins and review attendance activity without relying on manual registers.",
      problemSolved:
        "Time-consuming attendance records and difficulty reviewing who visited.",
      icon: CalendarCheck,
      highlights: [
        "0.3s turnstile barrier synchronization",
        "Front-desk tablet & kiosk check-in",
        "Real-time facility occupancy monitor",
        "Automated peak-hours activity analytics",
      ],
    },
    {
      number: "03",
      title: "Payment Management",
      tagline: "Automated collection & invoice receipts",
      description:
        "Track payment records, outstanding fees and submitted receipts. Make payment verification easier for owners and staff.",
      problemSolved:
        "Unclear payment status and repeated follow-ups.",
      icon: CreditCard,
      highlights: [
        "Cashfree UPI auto-debit integration",
        "Automated WhatsApp payment receipts",
        "Zero manual screenshot verification",
        "Instant GST-compliant tax invoices",
      ],
    },
    {
      number: "04",
      title: "Memberships & Renewals",
      tagline: "Expiring pass alerts & zero churn",
      description:
        "View active memberships, upcoming expiries and expired plans to help staff follow up at the right time.",
      problemSolved:
        "Members being overlooked when their memberships expire.",
      icon: RefreshCw,
      highlights: [
        "Automated 7-day and 3-day renewal alerts",
        "Proactive WhatsApp renewal payment links",
        "Expired member auto-lockout at gate",
        "Custom tier packages (Monthly, Annual, PT)",
      ],
    },
    {
      number: "05",
      title: "Reports & Analytics",
      tagline: "Data-driven business decisions",
      description:
        "Understand membership activity, attendance patterns, recorded payments and other available business metrics.",
      problemSolved:
        "Making decisions without a clear view of business activity.",
      icon: BarChart3,
      highlights: [
        "Monthly recurring revenue (MRR) breakdown",
        "Member retention & renewal rate KPIs",
        "Hourly attendance flow heatmaps",
        "One-click Excel & CSV report exports",
      ],
    },
    {
      number: "06",
      title: "Staff & Access Management",
      tagline: "Role-based permissions & security",
      description:
        "Organize staff access according to the roles and permissions supported by REPSI.",
      problemSolved:
        "Giving every staff member unnecessary access to business information.",
      icon: ShieldCheck,
      highlights: [
        "Role-based privileges (Manager, Front Desk, Trainer)",
        "Financial data masking for junior staff",
        "Audit trail logs for all staff actions",
        "Multi-staff simultaneous logins",
      ],
    },
  ];

  return (
    <section
      id="features"
      className="relative w-full bg-[#FAF8F5] text-[#17191C] py-20 sm:py-28 lg:py-32 border-b border-[#E4E2DC] overflow-hidden"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 01. SECTION HEADER                                            */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-3.5"
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-bold tracking-[0.16em] uppercase text-[#C76706] bg-[#FDF5ED] border border-[#F5D2B0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C76706] animate-pulse" />
              Features & Business Benefits
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
            <span className="text-[#C76706]">Nothing scattered.</span>
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base text-[#6B6F76] max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Manage your members, daily operations and payments from one connected workspace.
          </motion.p>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 02. SIX FEATURE MODULES DISPLAYED AS CLEAN LIGHT CARDS        */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch">
          {modules.map((mod, index) => {
            const Icon = mod.icon;

            return (
              <motion.div
                key={mod.number}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="bg-white rounded-2xl border border-[#E4E2DC] p-6 sm:p-7 shadow-xs hover:shadow-md hover:border-[#C76706]/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar with Number & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-[#C76706] bg-[#FDF5ED] border border-[#F5D2B0] px-2.5 py-0.5 rounded-full">
                      MODULE {mod.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] group-hover:bg-[#FDF5ED] text-[#6B6F76] group-hover:text-[#C76706] border border-[#E4E2DC] group-hover:border-[#F5D2B0] flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="font-heading font-bold text-lg text-[#17191C] leading-snug mb-1">
                    {mod.title}
                  </h3>
                  <div className="text-xs font-semibold text-[#C76706] mb-3">
                    {mod.tagline}
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-[13px] text-[#6B6F76] leading-relaxed mb-4">
                    {mod.description}
                  </p>

                  {/* Problem Solved Callout Box */}
                  <div className="bg-[#FAF8F5] rounded-xl border border-[#E4E2DC] p-3 text-xs mb-5">
                    <div className="flex items-start gap-1.5 text-[#17191C]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C76706] shrink-0 mt-1.5" />
                      <div>
                        <span className="font-bold text-[#A3432B]">Problem Solved: </span>
                        <span className="text-[#6B6F76] leading-relaxed">{mod.problemSolved}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Capability Highlights */}
                <div className="pt-4 border-t border-[#F0EFEA] space-y-2">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#17191C] mb-2">
                    Key Capabilities:
                  </div>
                  {mod.highlights.map((highlight, hIdx) => (
                    <div key={hIdx} className="flex items-center gap-2 text-xs text-[#4A4E54]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C76706] shrink-0" />
                      <span className="leading-tight">{highlight}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 03. PAGE 4 CTA STRIP                                          */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="mt-14 sm:mt-18 text-center bg-white rounded-3xl border border-[#E4E2DC] p-8 sm:p-10 shadow-xs">
          <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#17191C] mb-2">
            See what REPSI can simplify for your business.
          </h3>
          <p className="text-xs sm:text-sm text-[#6B6F76] max-w-xl mx-auto mb-6">
            Explore all features in detail or start your free 14-day trial with full access.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/features"
              className="group inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-[#C76706] hover:bg-[#AD5702] text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-md shadow-[#C76706]/25 hover:shadow-lg active:scale-95"
            >
              <span>Explore All Features</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-white hover:bg-[#F7F7F5] border border-[#E4E2DC] text-[#17191C] text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95"
            >
              <span>Get Started Free</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
