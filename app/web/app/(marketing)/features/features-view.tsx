"use client";

import Link from "next/link";
import { 
  Users, 
  CreditCard, 
  CalendarCheck, 
  Dumbbell, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Smartphone,
  Lock,
  Layers
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { useTranslation } from "@/lib/i18n";

const deepFeatures = [
  {
    id: "members",
    title: "Member Lifecycle & Digital KYC",
    badge: "Core Platform",
    description: "From sign-up and paperless KYC documentation to automated renewal nudges and membership freezing, manage the entire lifecycle with zero friction.",
    bullets: [
      "Instant biometric / ID photo registration",
      "Digital waivers, health declaration, and medical emergency contacts",
      "Automated WhatsApp & SMS notifications before plan expiry",
      "Seamless membership transfer, upgrades, and freeze periods",
    ],
    icon: Users,
    stat: "99.4%",
    statLabel: "Member retention tracking accuracy",
  },
  {
    id: "attendance",
    title: "Smart Hardware Attendance & Access Control",
    badge: "Hardware Sync",
    description: "Plug-and-play integrations with facial recognition terminals, biometric turnstiles, and QR scanners. Prevent unpaid gym access automatically.",
    bullets: [
      "Sub-second verification with multi-vendor biometric hardware",
      "Automatic access lockout for expired or overdue memberships",
      "Live crowd density and peak-hour heatmaps",
      "Emergency one-click facility unlock protocols",
    ],
    icon: CalendarCheck,
    stat: "< 0.3s",
    statLabel: "Turnstile latency response",
  },
  {
    id: "billing",
    title: "Automated Payments, UPI & GST Invoicing",
    badge: "Finances",
    description: "Never chase renewals again. Enable UPI autopay, recurring card mandates, and automated tax-compliant GST receipts instantly.",
    bullets: [
      "Dynamic UPI QR code generation on front-desk displays",
      "Automated WhatsApp payment links with one-tap payment",
      "Instant HSN/SAC GST invoices with serial tracking",
      "Staff cash collection audit trails and day-end reconciliation",
    ],
    icon: CreditCard,
    stat: "4.2x",
    statLabel: "Faster renewal collections",
  },
  {
    id: "training",
    title: "Workout Programming & PT Scheduling",
    badge: "Coaching Suite",
    description: "Empower your trainers to build structured workout splits, log body composition progression, and schedule 1-on-1 personal training slots.",
    bullets: [
      "500+ exercise library with muscle group animations",
      "Trainer commission calculation based on session attendance",
      "Diet plan builder with macronutrient targets",
      "PT session package deduction and expiry tracking",
    ],
    icon: Dumbbell,
    stat: "65%",
    statLabel: "Higher personal training booking rate",
  },
  {
    id: "insights",
    title: "Owner Analytics & Multi-Branch P&L",
    badge: "Intelligence",
    description: "Real-time visibility into your fitness business cashflow, member cohort churn, trainer utilization, and expense categorization.",
    bullets: [
      "Real-time revenue, expense, and net EBITDA dashboards",
      "Member churn risk prediction powered by attendance algorithms",
      "Multi-location consolidated reports in one central portal",
      "Automated daily business health reports sent via WhatsApp",
    ],
    icon: BarChart3,
    stat: "100%",
    statLabel: "Financial clarity across all branches",
  },
];

export function FeaturesView() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text)]">
      <MarketingNav />

      <main className="flex-1 pt-12 pb-24 px-4 sm:px-6">
        {/* Hero Section */}
        <div className="mx-auto max-w-4xl text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/25 mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>{t("marketing_features.badge", "Engineered for Performance")}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            {t("marketing_features.hero_title", "Every feature designed to boost gym profitability")}
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            {t("marketing_features.hero_subtitle", "From single boutique studios to 50-branch fitness franchises, REPSI replaces 6 fragmented tools with one cohesive operating system.")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] font-semibold text-sm transition-all shadow-md active:scale-95"
            >
              <span>{t("marketing_features.cta_trial", "Explore With Free Trial")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] font-medium text-sm transition-all"
            >
              <span>{t("marketing_features.cta_demo", "View Interactive Demo")}</span>
            </Link>
          </div>
        </div>

        {/* Feature Sections */}
        <div className="mx-auto max-w-6xl space-y-20">
          {deepFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            const isReversed = idx % 2 === 1;

            return (
              <div
                key={feat.id}
                className={`flex flex-col ${
                  isReversed ? "lg:flex-row-reverse" : "lg:flex-row"
                } items-center gap-12 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12 transition-all hover:border-[var(--text-secondary)]/30`}
              >
                {/* Text Content */}
                <div className="flex-1 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                      {feat.badge}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {feat.title}
                  </h2>

                  <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                    {feat.description}
                  </p>

                  <ul className="space-y-3 pt-2">
                    {feat.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-[var(--primary-dark)] flex-shrink-0 mt-1" />
                        <span className="text-sm text-[var(--text)]">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stat / Visual Card */}
                <div className="w-full lg:w-96 flex flex-col justify-center items-center rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 text-center">
                  <div className="text-5xl font-black text-[var(--accent)] mb-2 tracking-tight">
                    {feat.stat}
                  </div>
                  <div className="text-sm font-medium text-[var(--text-secondary)] mb-6">
                    {feat.statLabel}
                  </div>
                  <div className="w-full pt-6 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary-dark)]" />
                      SOC2 Compliant
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[var(--accent)]" />
                      Instant Sync
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Banner */}
        <div className="mx-auto max-w-4xl mt-24 rounded-3xl border border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--background)] p-10 text-center space-y-6">
          <h3 className="text-3xl font-extrabold tracking-tight">
            See REPSI in action on your gym floor
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-xl mx-auto">
            Set up your gym workspace in under 3 minutes. Test turnstiles, member payments, and class scheduling without writing a single line of code.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-3.5 rounded-xl bg-[var(--accent)] text-black font-bold text-sm hover:brightness-110 transition-all shadow-md"
            >
              {t("final_cta.get_started", "Get Started Free")}
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] font-medium text-sm hover:bg-[var(--surface-hover)] transition-all"
            >
              {t("final_cta.explore_pricing", "View Pricing Tiers")}
            </Link>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
