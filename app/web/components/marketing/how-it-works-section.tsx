"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  Users,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from "lucide-react";

interface Step {
  number: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  details: string[];
}

export function HowItWorksSection() {
  const shouldReduceMotion = useReducedMotion();

  const steps: Step[] = [
    {
      number: "01",
      title: "Create your REPSI workspace",
      tagline: "2-minute setup for your facility",
      description:
        "Sign up and configure your fitness business profile. Set up the workspace for your gym, studio, or sports academy.",
      icon: Building2,
      details: [
        "Add facility name, logo & branch locations",
        "Set daily opening & peak training hours",
        "Invite initial front-desk & administrative staff",
        "Instant cloud activation with zero local server hardware",
      ],
    },
    {
      number: "02",
      title: "Set up your plans and members",
      tagline: "Import existing roster or start fresh",
      description:
        "Configure available membership plans and add member details. Import existing member records via CSV instead of entering them individually.",
      icon: Users,
      details: [
        "Create custom packages (Monthly, Quarterly, Annual, PT)",
        "One-click CSV / Excel member roster import",
        "Auto-generate digital member passes with unique QR codes",
        "Send automatic welcome message with digital pass to members",
      ],
    },
    {
      number: "03",
      title: "Manage daily operations",
      tagline: "Automate front desk, check-ins & collections",
      description:
        "Use REPSI to record attendance, monitor membership status and manage payment records according to your workflow.",
      icon: CalendarCheck,
      details: [
        "0.3s QR code turnstile scanning & front-desk check-in",
        "Real-time turnstile barrier sync to block expired accounts",
        "Collect payments via Cashfree UPI auto-debit or manual cash",
        "Automatic instant WhatsApp fee receipts delivered to members",
      ],
    },
    {
      number: "04",
      title: "Review and improve",
      tagline: "Live insights & proactive renewals",
      description:
        "Use available reports and dashboard insights to understand activity and identify the tasks that need attention.",
      icon: TrendingUp,
      details: [
        "Review daily check-ins, peak floor hours & capacity heatmaps",
        "Track upcoming membership expiries & send 1-click renewal links",
        "Monitor gross revenue, outstanding dues & settlement status",
        "Export monthly financial reports for tax and accountant audits",
      ],
    },
  ];

  const faqs = [
    {
      q: "Can I manage more than one staff account?",
      a: "Yes. REPSI allows you to invite managers, front-desk receptionists, and personal trainers with dedicated login accounts. You can configure individual role permissions so each team member accesses only what they need.",
    },
    {
      q: "Can I track payments made directly to my business?",
      a: "Yes. For direct payments (cash or direct UPI QR scans), staff can manually log the transaction with reference details. If you connect our Cashfree integration, online UPI and card payments are auto-reconciled with instant WhatsApp receipts.",
    },
    {
      q: "Can I control what my staff can access?",
      a: "Absolutely. Role-based access control allows you to hide financial metrics, profit-and-loss reports, and sensitive member export lists from front-desk staff or trainers, keeping your business data private.",
    },
    {
      q: "Can I use REPSI on my phone?",
      a: "Yes. REPSI is fully responsive and optimized for mobile browsers and tablets. Owners can review live attendance, approve payments, and look up member profiles directly from their smartphone from anywhere.",
    },
  ];

  return (
    <section
      id="how-it-works"
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
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-bold tracking-[0.16em] uppercase text-[#E25822] bg-[#FDF1EB] border border-[#FACBB7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E25822] animate-pulse" />
              How REPSI Works
            </span>
          </motion.div>

          <motion.h2
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[46px] text-[#17191C] tracking-tight leading-[1.12] mb-4"
          >
            From setup to smoother <br />
            <span className="text-[#E25822]">daily operations.</span>
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base text-[#6B6F76] max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Set up your workspace, organize your members and start managing your business in one place.
          </motion.p>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 02. FOUR WORKFLOW STEPS DISPLAYED DIRECTLY AS CARDS (NO DARK) */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.number}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="bg-white rounded-2xl border border-[#E4E2DC] p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Step Top Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-[#E25822] bg-[#FDF1EB] border border-[#FACBB7] px-3 py-1 rounded-full">
                      STEP {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#6B6F76] group-hover:bg-[#FDF1EB] group-hover:text-[#E25822] border border-[#E4E2DC] group-hover:border-[#FACBB7] flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="font-heading font-bold text-lg sm:text-xl text-[#17191C] leading-snug mb-1">
                    {step.title}
                  </h3>
                  <div className="text-xs font-semibold text-[#E25822] mb-3">
                    {step.tagline}
                  </div>
                  <p className="text-xs sm:text-[13px] text-[#6B6F76] leading-relaxed mb-5">
                    {step.description}
                  </p>

                  {/* Visual Light Mockup Card inside each step */}
                  {index === 0 && (
                    <div className="bg-[#FAF8F5] rounded-xl border border-[#E4E2DC] p-3.5 mb-5 space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#E4E2DC]">
                        <span className="font-bold text-[#17191C]">Facility Profile</span>
                        <span className="font-mono text-emerald-700 text-[10px] font-bold">2-Min Setup</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-white p-2 rounded-lg border border-[#E4E2DC]">
                          <div className="text-[9px] text-[#8C9097]">Facility Name</div>
                          <div className="font-semibold text-[#17191C]">Iron Forge Fitness</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-[#E4E2DC]">
                          <div className="text-[9px] text-[#8C9097]">Branch</div>
                          <div className="font-semibold text-[#17191C]">Indiranagar, BLR</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {index === 1 && (
                    <div className="bg-[#FAF8F5] rounded-xl border border-[#E4E2DC] p-3.5 mb-5 space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#E4E2DC]">
                        <span className="font-bold text-[#17191C]">Membership Catalog</span>
                        <span className="font-mono text-[#E25822] text-[10px] font-bold">CSV Import Ready</span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="bg-white p-2 rounded-lg border border-[#E4E2DC] flex items-center justify-between">
                          <span className="font-semibold text-[#17191C]">Annual VIP All-Access</span>
                          <span className="font-mono font-bold text-emerald-700">₹24,000</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-[#E4E2DC] flex items-center justify-between">
                          <span className="font-semibold text-[#17191C]">Quarterly Strength Pass</span>
                          <span className="font-mono font-bold text-emerald-700">₹7,500</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {index === 2 && (
                    <div className="bg-[#FAF8F5] rounded-xl border border-[#E4E2DC] p-3.5 mb-5 space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#E4E2DC]">
                        <span className="font-bold text-[#17191C]">Live Operations Desk</span>
                        <span className="font-mono text-emerald-700 text-[10px] font-bold">Turnstiles Active</span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="bg-white p-2 rounded-lg border border-[#E4E2DC] flex items-center justify-between">
                          <span className="font-semibold text-[#17191C]">Arjun K. • Gate 1</span>
                          <span className="font-mono text-emerald-700 font-bold">Verified 0.28s ✓</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-[#E4E2DC] flex items-center justify-between">
                          <span className="font-semibold text-[#17191C]">Priya N. • Auto-Debit</span>
                          <span className="font-mono text-emerald-700 font-bold">₹4,500 Settled ✓</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {index === 3 && (
                    <div className="bg-[#FAF8F5] rounded-xl border border-[#E4E2DC] p-3.5 mb-5 space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#E4E2DC]">
                        <span className="font-bold text-[#17191C]">Weekly Performance</span>
                        <span className="font-mono text-emerald-700 text-[10px] font-bold">+18% MoM Growth</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                        <div className="bg-white p-2 rounded-lg border border-[#E4E2DC] text-center">
                          <div className="text-[9px] text-[#8C9097]">Check-ins</div>
                          <div className="font-bold text-[#17191C] mt-0.5">1,482</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-[#E4E2DC] text-center">
                          <div className="text-[9px] text-[#8C9097]">Collections</div>
                          <div className="font-bold text-emerald-700 mt-0.5">₹3.42L</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-[#E4E2DC] text-center">
                          <div className="text-[9px] text-[#8C9097]">Retention</div>
                          <div className="font-bold text-[#E25822] mt-0.5">94%</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bullets */}
                <div className="pt-3.5 border-t border-[#F0EFEA] space-y-2">
                  {step.details.map((detail, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-2 text-xs text-[#4A4E54]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#E25822] shrink-0 mt-0.5" />
                      <span className="leading-tight">{detail}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 03. ADDRESS COMMON PRACTICAL CONCERNS (FAQ ROW)               */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="mb-14 sm:mb-18">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#E25822] font-mono">
              ✦ Common Questions & Operations
            </span>
            <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#17191C] mt-1">
              Practical details for fitness operators.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {faqs.map((faq, fIdx) => (
              <div
                key={fIdx}
                className="bg-white rounded-2xl border border-[#E4E2DC] p-5 shadow-xs"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FDF1EB] text-[#E25822] flex items-center justify-center shrink-0 mt-0.5">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <h4 className="font-heading font-bold text-sm sm:text-base text-[#17191C] leading-snug">
                    {faq.q}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-[#6B6F76] leading-relaxed pl-10">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 04. PAGE 5 CTA STRIP                                          */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="text-center bg-white rounded-3xl border border-[#E4E2DC] p-8 sm:p-10 shadow-xs max-w-4xl mx-auto">
          <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#17191C] mb-2">
            Your daily operations, organized in one place.
          </h3>
          <p className="text-xs sm:text-sm text-[#6B6F76] max-w-xl mx-auto mb-6">
            Start with the essentials and build a workflow that works for your business.
          </p>
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 h-11 px-7 rounded-full bg-[#E25822] hover:bg-[#C94715] text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-md shadow-[#E25822]/25 hover:shadow-lg active:scale-95"
          >
            <span>Create Your Workspace</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
