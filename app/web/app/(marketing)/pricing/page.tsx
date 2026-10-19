"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { PricingSection } from "@/components/marketing/pricing-section";
import { RepsiMascot } from "@/components/ui/repsi-mascot";
import { BackToTop } from "@/components/ui/back-to-top";

export default function FullPricingPage() {
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<
    "all" | "core" | "members" | "operations" | "communication" | "finance" | "advanced"
  >("all");

  const catalogCategories = [
    {
      id: "core",
      name: "1. Core Platform Modules",
      description: "Essential workspace foundations included with the ₹199 base fee or free.",
      items: [
        { module: "Owner dashboard & business settings", price: "₹199 / month", note: "Base workspace platform" },
        { module: "Trainer management & staff roster", price: "Free", note: "Included in base" },
        { module: "Roles & granular staff permissions", price: "Free", note: "Included in base" },
        { module: "Branch management", price: "₹49 / branch", note: "Single branch included; ₹49 per additional" },
        { module: "Subscription & billing management", price: "Included", note: "Cashfree mandate management" },
        { module: "Notifications centre", price: "Free", note: "In-app operational alerts" },
        { module: "Audit logs & security", price: "Included", note: "Role-based action timestamps" },
        { module: "Data export & backup tools", price: "Included", note: "CSV / Excel downloads" },
      ],
    },
    {
      id: "members",
      name: "2. Member Management Modules",
      description: "Member records, digital portal, onboarding, documents, and progress tracking.",
      items: [
        { module: "Member profiles & directory", price: "₹99 / month (up to 25 members)", note: "Scales with capacity tier" },
        { module: "Member portal / login", price: "₹49 / month", note: "Optional self-serve access" },
        { module: "Member registration & onboarding", price: "Free", note: "Walk-in & QR self-registration" },
        { module: "Member status management", price: "Free", note: "Active, expired & frozen states" },
        { module: "Member documents & waivers", price: "₹29 / month", note: "Cloud ID & health records storage" },
        { module: "Member progress tracking", price: "₹49 / month", note: "Body measurements & weigh-in logs" },
        { module: "Member feedback & assessments", price: "₹49 / month", note: "Trainer reviews & fitness scores" },
      ],
    },
    {
      id: "operations",
      name: "3. Fitness Business Operations",
      description: "Daily floor operations from check-ins to scheduling, diet, and leads.",
      items: [
        { module: "Attendance management", price: "₹49 / month", note: "1-second QR check-in & reception desk" },
        { module: "Membership plans & renewals", price: "₹49 / month", note: "Custom duration plans & renewal queue" },
        { module: "Membership expiry tracking", price: "Free", note: "Automated status transitions" },
        { module: "Payment records & receipt verification", price: "₹49 / month", note: "UPI, card & cash with instant receipts" },
        { module: "Payment reminders", price: "₹29 / mo + messaging", note: "WhatsApp & SMS dues follow-up" },
        { module: "Trainer schedules & rosters", price: "₹49 / month", note: "Personal training shifts & client assignments" },
        { module: "Class & batch management", price: "₹49 / month", note: "Group fitness, yoga & spinning slots" },
        { module: "Workout plans & routines", price: "₹49 / month", note: "Structured routine builder" },
        { module: "Diet & nutrition plans", price: "₹49 / month", note: "Calorie & macro targets" },
        { module: "Equipment management", price: "₹29 / month", note: "Machine service & warranty logs" },
        { module: "Enquiries & lead management", price: "₹49 / month", note: "Walk-in pipeline & trial conversions" },
        { module: "Offers & promotional discounts", price: "₹29 / month", note: "Coupon codes & seasonal discounts" },
      ],
    },
    {
      id: "communication",
      name: "4. Communication Modules",
      description: "Direct notifications across in-app, email, WhatsApp, and SMS.",
      items: [
        { module: "In-app notifications", price: "Free", note: "Bell alert center for all staff & members" },
        { module: "Email notifications", price: "Free", note: "Within generous fair-use limits" },
        { module: "WhatsApp reminders", price: "₹0 fee + message charges", note: "Direct Meta Cloud API messaging" },
        { module: "SMS notifications", price: "₹0 fee + SMS charges", note: "Direct DLT-approved SMS gateways" },
        { module: "WhatsApp OTP verification", price: "Usage-based", note: "At cost per delivered verification" },
        { module: "SMS OTP verification", price: "Usage-based", note: "At cost per delivered verification" },
        { module: "Automated renewal reminders", price: "₹29 / mo + messaging", note: "3-day, 1-day, and same-day alerts" },
        { module: "Bulk announcements", price: "₹29 / mo + messaging", note: "Broadcast holiday & class schedule updates" },
      ],
    },
    {
      id: "finance",
      name: "5. Finance and Reporting",
      description: "Clear cashflow tracking, P&L, dues collections, and trainer payouts.",
      items: [
        { module: "Revenue dashboard (Basic)", price: "Free", note: "Monthly collection summary" },
        { module: "Payment history & logs", price: "Included", note: "Included with payment tracking" },
        { module: "Outstanding dues tracking", price: "₹29 / month", note: "Overdue balances queue with 1-click follow-up" },
        { module: "Expense tracking", price: "₹49 / month", note: "Log rent, electricity, and maintenance" },
        { module: "Income & expense reports", price: "₹49 / month", note: "Consolidated P&L and cashflow statements" },
        { module: "Trainer commission tracking", price: "₹49 / month", note: "Auto-calculate PT commission percentages" },
        { module: "GST Invoice generation", price: "₹29 / month", note: "Downloadable compliant PDF invoices" },
        { module: "Advanced analytics & heatmaps", price: "₹99 / month", note: "Peak-hour traffic & retention radar" },
        { module: "Data export (CSV / Excel)", price: "Included", note: "Zero lock-in full exports" },
      ],
    },
    {
      id: "advanced",
      name: "6. Advanced and Optional Modules",
      description: "Multi-branch expansion, white-label, APIs, and dedicated concierge onboarding.",
      items: [
        { module: "Multiple branches", price: "₹49 / additional branch", note: "Unified database & centralized owner control" },
        { module: "Custom branding", price: "₹99 / month", note: "Display your logo on member passes & invoices" },
        { module: "Custom domain (yourgym.com)", price: "₹99 / mo + domain costs", note: "SSL certificate & custom DNS setup" },
        { module: "REST API & Webhooks access", price: "₹99 / month", note: "Biometric turnstile integrations & custom portals" },
        { module: "Advanced third-party integrations", price: "₹49+ / month", note: "Accounting and external hardware" },
        { module: "AI-generated workout suggestions", price: "Usage-based", note: "Token-based AI workout assistance" },
        { module: "AI-generated business reports", price: "Usage-based", note: "Token-based natural language summaries" },
        { module: "Automated business insights", price: "₹99 / mo + AI usage", note: "Member churn predictions" },
        { module: "Priority support & phone onboarding", price: "₹199 / month", note: "Dedicated WhatsApp hotline & staff training" },
        { module: "White-label mobile application", price: "Custom pricing", note: "Dedicated App Store & Play Store listing" },
      ],
    },
  ];

  const activeMemberCapacityTiers = [
    { tier: "Owner-only (0 members)", price: "₹199 base", desc: "For personal trainers or solo facilities without member logins." },
    { tier: "Up to 25 members", price: "₹99 / month", desc: "Ideal for boutique studios, private training gyms, and launch setups." },
    { tier: "Up to 50 members", price: "₹149 / month", desc: "For neighborhood fitness centers and personal training studios." },
    { tier: "Up to 100 members", price: "₹249 / month", desc: "For standard gym facilities with active daily floor traffic." },
    { tier: "Up to 250 members", price: "₹499 / month", desc: "For high-capacity fitness centers and expanding clubs." },
    { tier: "Up to 500 members", price: "₹899 / month", desc: "For established gyms, multi-floor centers, and wellness clubs." },
    { tier: "Up to 1,000 members", price: "₹1,499 / month", desc: "For premier clubs, multi-batch studios, and fitness chains." },
  ];

  const exampleBills = [
    {
      title: "Owner-Only Setup",
      subtitle: "For personal trainers and solo studio owners",
      total: "₹199",
      period: "/ month",
      breakdown: [
        { item: "Owner dashboard & workspace", amount: "₹199" },
        { item: "Basic business settings", amount: "Included" },
        { item: "Trainer & staff management", amount: "Free" },
        { item: "Roles & permissions", amount: "Free" },
        { item: "Basic reports & export", amount: "Included" },
      ],
      idealFor: "Solo trainers managing clients directly without member logins.",
    },
    {
      title: "Small Studio",
      subtitle: "Daily operations for small gyms & boutique spaces",
      total: "₹396",
      period: "/ month",
      breakdown: [
        { item: "Base workspace platform", amount: "₹199" },
        { item: "Up to 25 active members", amount: "₹99" },
        { item: "Attendance management", amount: "₹49" },
        { item: "Membership plans & renewals", amount: "₹49" },
      ],
      idealFor: "CrossFit boxes, yoga studios, and neighborhood fitness centers.",
      recommended: true,
    },
    {
      title: "Growing Fitness Business",
      subtitle: "Comprehensive operations, dues follow-up & P&L",
      total: "₹694",
      period: "/ month",
      breakdown: [
        { item: "Base workspace platform", amount: "₹199" },
        { item: "Up to 100 active members", amount: "₹249" },
        { item: "Attendance management", amount: "₹49" },
        { item: "Membership plans & renewals", amount: "₹49" },
        { item: "Payment tracking & verification", amount: "₹49" },
        { item: "Advanced analytics & reports", amount: "₹99" },
      ],
      idealFor: "Established gyms scaling revenue with multi-trainer staff.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#191919] font-sans antialiased selection:bg-[#E25822] selection:text-white flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* HERO BANNER (NO EYEBROW) */}
        <section className="pt-28 pb-8 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl md:text-6xl text-[#191919] tracking-tight leading-[1.12] mb-4">
            Pay only for what <br className="hidden sm:inline" />
            <span className="text-[#E25822]">your fitness business uses.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#62666D] max-w-2xl mx-auto leading-relaxed">
            Choose an affordable pre-configured bundle or build your custom subscription module-by-module. Upgrade capacity as your gym grows.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-5 text-xs font-semibold text-[#62666D]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#E25822]" />
              14-Day Free Trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#E25822]" />
              No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#E25822]" />
              Data Safely Preserved on Downgrade
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#E25822]" />
              Cancel or Switch Anytime
            </span>
          </div>
        </section>

        {/* 01. INTERACTIVE PRICING SECTION (BUNDLES + DYNAMIC BUILDER) */}
        <PricingSection />

        {/* 02. SECTION: REAL-WORLD EXAMPLE CUSTOMER BILLS */}
        <section className="py-20 bg-white border-y border-[#E7E4DE]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#191919] mb-2">
                Example Customer Bills
              </h2>
              <p className="text-sm text-[#62666D]">
                See how different fitness facilities configure REPSI to keep monthly operational costs remarkably low.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {exampleBills.map((bill, bIdx) => (
                <div
                  key={bIdx}
                  className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 ${
                    bill.recommended
                      ? "bg-[#FAF9F6] border-2 border-[#E25822] ring-4 ring-[#E25822]/10 shadow-md"
                      : "bg-[#FAF9F6] border border-[#E7E4DE] shadow-xs hover:shadow-md"
                  }`}
                >
                  <div>
                    {bill.recommended && (
                      <div className="text-[10px] font-mono font-bold text-white bg-[#E25822] px-3 py-0.5 rounded-full uppercase tracking-wider inline-block mb-3">
                        Most Popular Starter
                      </div>
                    )}
                    <h3 className="font-heading font-extrabold text-2xl text-[#191919]">
                      {bill.title}
                    </h3>
                    <p className="text-xs text-[#62666D] mt-1 mb-5 leading-relaxed">
                      {bill.subtitle}
                    </p>

                    <div className="py-4 border-y border-[#E7E4DE] mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-heading font-extrabold text-[#191919] tracking-tight">
                          {bill.total}
                        </span>
                        <span className="text-xs font-medium text-[#62666D]">
                          {bill.period}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#858890] mt-1">
                        Before applicable taxes · Billed monthly
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#191919]">
                        Configuration Breakdown:
                      </div>
                      {bill.breakdown.map((row, rIdx) => (
                        <div
                          key={rIdx}
                          className="flex justify-between items-center text-xs text-[#191919] py-1 border-b border-[#F0EDE7] last:border-0"
                        >
                          <span className="text-[#62666D]">{row.item}</span>
                          <span className="font-mono font-bold">{row.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E7E4DE] space-y-3">
                    <p className="text-[11px] text-[#62666D] italic">
                      Ideal for: {bill.idealFor}
                    </p>
                    <Link
                      href="/signup"
                      className="w-full inline-flex items-center justify-center gap-1.5 h-11 rounded-full bg-white hover:bg-[#F5F2ED] border border-[#E7E4DE] text-[#191919] text-xs font-semibold shadow-2xs transition-all"
                    >
                      <span>Get Started with This Setup</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 03. SECTION: FULL MODULAR CATALOG PRICE LIST (SECTIONS 1 TO 7) */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#191919] mb-2">
              REPSI Launch Module Catalog & Pricing
            </h2>
            <p className="text-sm text-[#62666D]">
              Complete transparency on all standalone modules, capacity pricing, and messaging charges. All prices are monthly and before applicable taxes.
            </p>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              <button
                type="button"
                onClick={() => setSelectedCatalogCategory("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCatalogCategory === "all"
                    ? "bg-[#191919] text-white"
                    : "bg-white text-[#62666D] border border-[#E7E4DE] hover:bg-[#F5F2ED]"
                }`}
              >
                All Sections
              </button>
              {catalogCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCatalogCategory(c.id as typeof selectedCatalogCategory)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedCatalogCategory === c.id
                      ? "bg-[#191919] text-white"
                      : "bg-white text-[#62666D] border border-[#E7E4DE] hover:bg-[#F5F2ED]"
                  }`}
                >
                  {c.name.split(". ")[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Module Tables */}
          <div className="space-y-8">
            {catalogCategories
              .filter(
                (cat) =>
                  selectedCatalogCategory === "all" || selectedCatalogCategory === cat.id
              )
              .map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-3xl border border-[#E7E4DE] overflow-hidden shadow-xs"
                >
                  <div className="p-5 sm:p-6 bg-[#FAF9F6] border-b border-[#E7E4DE] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#191919]">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-[#62666D] mt-0.5">{cat.description}</p>
                    </div>
                    <span className="text-[11px] font-mono text-[#858890] shrink-0">
                      {cat.items.length} Modules Listed
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#E7E4DE] bg-[#FAF9F6]/50 text-[#858890] font-mono text-[11px] uppercase tracking-wider">
                          <th className="py-3 px-5 font-semibold">Module / Feature</th>
                          <th className="py-3 px-5 font-semibold">Minimum Launch Price</th>
                          <th className="py-3 px-5 font-semibold">Operational Scope & Rules</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EDE7]">
                        {cat.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#FAF9F6]/60 transition-colors">
                            <td className="py-3.5 px-5 font-bold text-[#191919]">
                              {item.module}
                            </td>
                            <td className="py-3.5 px-5 font-mono font-bold text-[#E25822] whitespace-nowrap">
                              {item.price}
                            </td>
                            <td className="py-3.5 px-5 text-[#62666D]">
                              {item.note}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
          </div>

          {/* 04. SECTION 7: ACTIVE-MEMBER CAPACITY PRICING TABLE */}
          <div className="mt-12 bg-white rounded-3xl border border-[#E7E4DE] p-6 sm:p-8 shadow-xs">
            <div className="max-w-2xl mb-6">
              <h3 className="font-heading font-extrabold text-2xl text-[#191919]">
                7. Active-Member Capacity Pricing
              </h3>
              <p className="text-xs text-[#62666D] mt-1 leading-relaxed">
                Keep active-member capacity separate from individual functional modules. Only pay for members who currently hold valid, non-expired memberships.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeMemberCapacityTiers.map((t, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E7E4DE] flex flex-col justify-between"
                >
                  <div>
                    <div className="text-sm font-bold text-[#191919]">{t.tier}</div>
                    <p className="text-[11px] text-[#62666D] mt-1 leading-relaxed">
                      {t.desc}
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-[#E7E4DE] flex items-baseline justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#858890]">
                      Monthly
                    </span>
                    <span className="font-mono font-extrabold text-sm text-[#E25822]">
                      {t.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 05. SECTION: REPSI PRICING PRINCIPLES */}
          <div className="mt-12 rounded-3xl bg-[#FAF9F6] border border-[#E7E4DE] p-6 sm:p-8">
            <h3 className="font-heading font-extrabold text-xl text-[#191919] mb-4">
              How REPSI Dynamic Modular Pricing Operates
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#62666D] leading-relaxed">
              <div className="space-y-1.5 p-4 rounded-2xl bg-white border border-[#E7E4DE]">
                <div className="font-bold text-[#191919] text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>1. Safe Data Preservation</span>
                </div>
                <p>
                  When you remove or disable an optional module (e.g., Diet Plans or Class Schedules), REPSI preserves all historical records, notes, and receipts safely. Only the active UI tool is disabled.
                </p>
              </div>

              <div className="space-y-1.5 p-4 rounded-2xl bg-white border border-[#E7E4DE]">
                <div className="font-bold text-[#191919] text-sm flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#E25822]" />
                  <span>2. Bundle vs. Build Your Own</span>
                </div>
                <p>
                  Pre-configured bundles offer deep discounts on popular combinations. If you customize an existing bundle by adding or removing modules, our calculator transparently recalculates your custom bill.
                </p>
              </div>

              <div className="space-y-1.5 p-4 rounded-2xl bg-white border border-[#E7E4DE]">
                <div className="font-bold text-[#191919] text-sm flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>3. Active Members Only</span>
                </div>
                <p>
                  You are never billed for inactive, graduated, or archived members. Only individuals with current active gym memberships count against your chosen member tier limit.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 06. MASCOT ADVISOR BANNER */}
        <section className="mx-auto max-w-4xl px-4 pb-20">
          <div className="bg-gradient-to-r from-[#FDF1EB] via-white to-[#FAF9F6] border border-[#FACBB7] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xs">
            <RepsiMascot pose="help" size="sm" />
            <div className="space-y-1 text-center sm:text-left flex-1">
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#191919]">
                Need guidance choosing the right modules for your facility?
              </h3>
              <p className="text-xs text-[#62666D] leading-relaxed">
                Our fitness business advisors can help configure your exact module list, migrate existing Excel data, and get your reception running in under 24 hours.
              </p>
            </div>
            <a
              href="https://wa.me/918667783321?text=Hi%20Repsi%20team,%20I'd%20like%20guidance%20on%20choosing%20the%20right%20modular%20pricing%20for%20my%20gym"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full bg-[#E25822] hover:bg-[#C94715] text-white text-xs font-semibold transition-all shrink-0 shadow-sm shadow-[#E25822]/30 flex items-center gap-2"
            >
              <span>Chat with an Advisor</span>
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
