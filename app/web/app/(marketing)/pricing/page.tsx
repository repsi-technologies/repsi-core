"use client";

import React from "react";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Layers,
  Users,
  CalendarCheck,
  CreditCard,
  Building2,
  HelpCircle,
  Smartphone,
  Zap,
  Lock,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { PricingSection } from "@/components/marketing/pricing-section";
import { RepsiMascot } from "@/components/ui/repsi-mascot";
import { BackToTop } from "@/components/ui/back-to-top";

export default function FullPricingPage() {
  const whatEachPlanAdds = [
    {
      plan: "Free Trial (14 Days)",
      cap: "Up to 30 active members",
      price: "₹0 for 14 days",
      badge: "Full Growth features",
      bullets: [
        "All Growth entitlements for 14 full days",
        "Zero credit card required at sign-up",
        "Safe transition to read-only mode after trial (no data deletion)",
      ],
    },
    {
      plan: "Lite",
      cap: "Up to 20 active members",
      price: "₹129 / $5.8 / €5.2 / £4.6 / AED 21.4 per month (billed yearly)",
      badge: "Foundations",
      bullets: [
        "Member profiles: create, edit, search, archive, photo, emergency contact",
        "Up to 3 membership plans with manual renewal",
        "Manual and QR check-in with 3-month history",
        "Cash/UPI payment records, receipts, and pending-dues list",
        "Basic dashboard: revenue, active members, new joins, expiry alerts",
        "1 trainer profile, 1 staff login, fixed roles",
        "In-app notifications, email & Google login, CSV export",
        "All 4 languages always included",
      ],
    },
    {
      plan: "Starter",
      cap: "Up to 50 active members",
      price: "₹325 / $12.3 / €10.4 / £9.1 / AED 44.8 per month (billed yearly)",
      badge: "Adds to Lite",
      bullets: [
        "Renewal queue, freeze/pause, day passes, trial memberships, grace periods",
        "Member portal with dynamic QR card",
        "Access validation, duplicate check-in prevention, 1-year history",
        "Partial payments, push reminders for renewals and dues, GST invoice setup",
        "Member documents and waivers storage",
        "Basic reports (growth, collections, dues), dashboard date ranges",
        "Discount coupons, public gym profile page",
        "Trainer-to-member assignment",
      ],
    },
    {
      plan: "Growth ⭐ Best Seller",
      cap: "Up to 150 active members",
      price: "₹649 / $25.3 / €22.1 / £18.8 / AED 94.3 per month (billed yearly)",
      badge: "Adds to Starter",
      bullets: [
        "Workout builder, exercise library with GIFs, workout logging",
        "Diet plans, food database, calories and macros",
        "Body measurements and progress charts",
        "Trainer portal, PT sessions and packages",
        "Classes, batches, booking, waitlist",
        "Leads CRM: pipeline, follow-ups, trial conversion",
        "Expenses and P&L statements",
        "Dues follow-up queue, installments, refunds, online reconciliation",
        "Member-trainer chat, bulk announcements",
        "Live occupancy and peak-hour analytics",
        "Retention and churn reports, Excel/PDF export",
        "Bulk import, duplicate detection, medical notes",
        "Custom roles and permissions, referral tracking",
        "Full mobile member app with inactivity alerts",
        "Equipment register, audit logs (90 days)",
      ],
    },
    {
      plan: "Pro",
      cap: "Up to 400 active members",
      price: "₹1,299 / $51.3 / €44.2 / £37.7 / AED 187.8 per month (billed yearly)",
      badge: "Adds to Growth",
      bullets: [
        "3 branches included, consolidated reports, branch-level pricing",
        "Trainer commissions, automated payroll, financial audit trail",
        "Staff shifts, attendance, leave, tasks",
        "Trainer performance reports, advanced analytics, custom widgets",
        "WhatsApp automation, group chat and media",
        "Progress photos, before/after comparison",
        "Inventory and POS retail management",
        "Equipment maintenance logs & lockers",
        "Challenges, leaderboards, badges, retention campaigns",
        "Recurring payments, biometric turnstile integration, MFA",
        "AI assistant (200 credits/month)",
        "Audit logs (1 year), priority phone & WhatsApp support",
      ],
    },
    {
      plan: "Enterprise",
      cap: "400+ active members",
      price: "From ₹2,599 / $97 / €84 / £71 / AED 357 per month (billed yearly)",
      badge: "Adds to Pro",
      bullets: [
        "Unlimited branches, franchise-level settings",
        "Full REST API and real-time webhooks",
        "Custom branding and custom domain included",
        "Custom SQL reports, higher AI credits",
        "Dedicated account manager, enterprise SLA, custom contract",
        "Full legacy data migration & hands-on staff onboarding",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#191919] font-sans antialiased selection:bg-[#E25822] selection:text-white flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* HERO BANNER */}
        <section className="pt-28 pb-8 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FDF1EB] border border-[#FACBB7] text-[#E25822] text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Final Pricing · Zero Hidden Surprises</span>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl md:text-6xl text-[#191919] tracking-tight leading-[1.12] mb-4">
            Simple, honest pricing for <br className="hidden sm:inline" />
            <span className="text-[#E25822]">modern fitness businesses.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#62666D] max-w-2xl mx-auto leading-relaxed">
            Prices are final amounts. No GST is charged until you register. Owners can pay directly through the website on their dashboard via Cashfree.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-5 text-xs font-semibold text-[#62666D]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#E25822]" />
              14-Day Free Trial (Growth Features)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#E25822]" />
              10% Grace on Member Cap
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#E25822]" />
              No Data Deleted on Downgrade
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#E25822]" />
              Founder Offer: First 50 Gyms Locked for Life
            </span>
          </div>
        </section>

        {/* 01. INTERACTIVE PRICING SECTION */}
        <PricingSection />

        {/* 02. SECTION: WHAT EACH PLAN ADDS */}
        <section className="py-20 bg-white border-y border-[#E7E4DE]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#191919] mb-2">
                What Each Plan Adds
              </h2>
              <p className="text-sm text-[#62666D]">
                Every higher tier includes all functionality from the plans below it.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {whatEachPlanAdds.map((tier, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl p-6 bg-[#FAF9F6] border border-[#E7E4DE] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E25822] bg-[#FDF1EB] border border-[#FACBB7] px-2.5 py-0.5 rounded-full">
                        {tier.badge}
                      </span>
                      <span className="text-xs font-mono text-[#858890]">{tier.cap}</span>
                    </div>

                    <h3 className="font-heading font-extrabold text-xl text-[#191919] mb-1">
                      {tier.plan}
                    </h3>
                    <div className="text-xs font-semibold text-[#E25822] font-mono mb-4 pb-3 border-b border-[#E7E4DE]">
                      {tier.price}
                    </div>

                    <ul className="space-y-2 text-xs text-[#191919]">
                      {tier.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#E25822]" />
                          <span className="leading-snug">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-5 mt-5 border-t border-[#E7E4DE]">
                    <Link
                      href="/signup"
                      className="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-full bg-white hover:bg-[#F5F2ED] border border-[#E7E4DE] text-[#191919] text-xs font-semibold shadow-2xs transition"
                    >
                      <span>Get Started with {tier.plan.split(" ")[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 03. MASCOT ADVISOR BANNER */}
        <section className="mx-auto max-w-4xl px-4 py-20">
          <div className="bg-gradient-to-r from-[#FDF1EB] via-white to-[#FAF9F6] border border-[#FACBB7] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xs">
            <RepsiMascot pose="help" size="sm" />
            <div className="space-y-1 text-center sm:text-left flex-1">
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#191919]">
                Are you among the first 50 gyms?
              </h3>
              <p className="text-xs text-[#62666D] leading-relaxed">
                Lock these launch prices permanently for life. We will also help migrate your member records from Excel, configure your QR code, and train your staff in under 24 hours.
              </p>
            </div>
            <a
              href="https://wa.me/918667783321?text=Hi%20Repsi%20team,%20I'd%20like%20to%20claim%20the%20Founder%20Offer%20pricing%20for%20my%20gym"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full bg-[#E25822] hover:bg-[#C94715] text-white text-xs font-semibold transition-all shrink-0 shadow-sm shadow-[#E25822]/30 flex items-center gap-2"
            >
              <span>Claim Founder Offer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>
      </main>

      <MarketingFooter />
      <BackToTop />
    </div>
  );
}
