"use client";

import React, { useState, useMemo } from "react";
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
  Lightbulb,
} from "lucide-react";

export type BillingCycle = "monthly" | "annual";

interface BundlePlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  badge: string | null;
  popular: boolean;
  memberCapacity: string;
  memberCount: number;
  modulesIncluded: string[];
  features: string[];
  ctaText: string;
}

interface MemberTier {
  id: string;
  label: string;
  count: number;
  price: number;
}

interface ModuleItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "operations" | "finance" | "advanced";
  icon: React.ComponentType<{ className?: string }>;
}

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const [activeTab, setActiveTab] = useState<"bundles" | "custom">("bundles");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [moduleCategoryFilter, setModuleCategoryFilter] = useState<
    "all" | "operations" | "finance" | "advanced"
  >("all");
  const shouldReduceMotion = useReducedMotion();

  // ─────────────────────────────────────────────────────────────────────────
  // 1. REPSI READY-MADE PRICING BUNDLES
  // ─────────────────────────────────────────────────────────────────────────
  const bundles: BundlePlan[] = [
    {
      id: "owner_lite",
      name: "Owner Lite",
      tagline: "For owners who need basic business management without a member portal.",
      monthlyPrice: 199,
      annualPrice: 159,
      badge: "ENTRY PLAN",
      popular: false,
      memberCapacity: "Owner-only (0 members)",
      memberCount: 0,
      modulesIncluded: ["dashboard", "trainers", "roles", "reports_basic", "audit", "export"],
      features: [
        "Owner dashboard & business settings",
        "Trainer management & staff roster",
        "Roles & granular permissions",
        "Basic operational reports",
        "Audit logs & secure database",
        "Data export & cloud backup",
      ],
      ctaText: "Choose Owner Lite",
    },
    {
      id: "starter",
      name: "REPSI Starter",
      tagline: "For small fitness businesses that need essential daily operations.",
      monthlyPrice: 399,
      annualPrice: 319,
      badge: "RECOMMENDED",
      popular: true,
      memberCapacity: "Up to 25 active members",
      memberCount: 25,
      modulesIncluded: [
        "dashboard",
        "trainers",
        "roles",
        "member_portal",
        "attendance",
        "memberships",
        "payments",
        "reports_basic",
      ],
      features: [
        "Everything in Owner Lite",
        "Up to 25 active members included",
        "Member portal & digital pass access",
        "QR attendance check-in workflow",
        "Membership plans & renewal queues",
        "Payment tracking & receipt verification",
        "Basic revenue & dues summaries",
      ],
      ctaText: "Choose Starter",
    },
    {
      id: "growth",
      name: "REPSI Growth",
      tagline: "For growing gyms that need deeper automation, schedules, and control.",
      monthlyPrice: 699,
      annualPrice: 559,
      badge: "MOST POPULAR",
      popular: false,
      memberCapacity: "Up to 100 active members",
      memberCount: 100,
      modulesIncluded: [
        "dashboard",
        "trainers",
        "roles",
        "member_portal",
        "attendance",
        "memberships",
        "payments",
        "classes",
        "schedules",
        "expenses",
        "dues",
        "reports_advanced",
      ],
      features: [
        "Everything in REPSI Starter",
        "Up to 100 active members included",
        "Class, batch & slot scheduling",
        "Trainer assignments & schedules",
        "Expense tracking & P&L insights",
        "Outstanding dues follow-up queue",
        "Automated expiry alerts (fair-use)",
        "Advanced retention & revenue reports",
      ],
      ctaText: "Choose Growth",
    },
    {
      id: "scale",
      name: "REPSI Scale",
      tagline: "For larger facilities with high member volume and multi-branch operations.",
      monthlyPrice: 1299,
      annualPrice: 1039,
      badge: "HIGH CAPACITY",
      popular: false,
      memberCapacity: "Up to 250 active members",
      memberCount: 250,
      modulesIncluded: [
        "dashboard",
        "trainers",
        "roles",
        "member_portal",
        "attendance",
        "memberships",
        "payments",
        "classes",
        "schedules",
        "expenses",
        "dues",
        "reports_advanced",
        "branches_extra",
        "commissions",
        "analytics",
        "priority",
      ],
      features: [
        "Everything in REPSI Growth",
        "Up to 250 active members included",
        "Multi-branch support (1 branch + 1 extra)",
        "Trainer commission & payout tracking",
        "Advanced analytics & trend forecasts",
        "Automated business insights & CSV export",
        "Priority WhatsApp & phone onboarding",
      ],
      ctaText: "Choose Scale",
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // 2. MODULAR PRICING SPECIFICATION (BUILD YOUR OWN PLAN)
  // ─────────────────────────────────────────────────────────────────────────
  const memberTiers: MemberTier[] = [
    { id: "m0", label: "Owner-only (0 members)", count: 0, price: 0 },
    { id: "m25", label: "Up to 25 members", count: 25, price: 99 },
    { id: "m50", label: "Up to 50 members", count: 50, price: 149 },
    { id: "m100", label: "Up to 100 members", count: 100, price: 249 },
    { id: "m250", label: "Up to 250 members", count: 250, price: 499 },
    { id: "m500", label: "Up to 500 members", count: 500, price: 899 },
    { id: "m1000", label: "Up to 1,000 members", count: 1000, price: 1499 },
  ];

  const availableModules: ModuleItem[] = [
    // Operations & Members
    {
      id: "member_portal",
      name: "Member Portal & Login",
      description: "Self-serve mobile app access for members with digital QR pass.",
      price: 49,
      category: "operations",
      icon: Smartphone,
    },
    {
      id: "attendance",
      name: "Attendance Management",
      description: "1-second QR check-in & manual reception check-in workflow.",
      price: 49,
      category: "operations",
      icon: CalendarCheck,
    },
    {
      id: "memberships",
      name: "Membership Plans & Renewals",
      description: "Custom plans, expiry tracking, and renewal reminder queues.",
      price: 49,
      category: "operations",
      icon: Users,
    },
    {
      id: "payments",
      name: "Payment Records & Receipts",
      description: "Record UPI, card & cash with instant digital GST receipts.",
      price: 49,
      category: "operations",
      icon: CreditCard,
    },
    {
      id: "classes",
      name: "Class & Batch Management",
      description: "Group fitness, yoga, and spinning class capacity scheduling.",
      price: 49,
      category: "operations",
      icon: Layers,
    },
    {
      id: "schedules",
      name: "Trainer Schedules",
      description: "Assign personal trainers, track shift hours, and client rosters.",
      price: 49,
      category: "operations",
      icon: Clock,
    },
    {
      id: "workouts",
      name: "Workout Plans",
      description: "Structured workout templates & personal training logs.",
      price: 49,
      category: "operations",
      icon: Dumbbell,
    },
    {
      id: "diets",
      name: "Diet & Nutrition Plans",
      description: "Diet builder with calorie/macro targets assigned to members.",
      price: 49,
      category: "operations",
      icon: Apple,
    },
    {
      id: "progress",
      name: "Member Progress & Assessments",
      description: "Body measurement logs, weigh-in tracking, and fitness assessments.",
      price: 49,
      category: "operations",
      icon: TrendingUp,
    },
    {
      id: "documents",
      name: "Member Documents & IDs",
      description: "Store signed waivers, ID proofs, and medical records securely.",
      price: 29,
      category: "operations",
      icon: FileText,
    },

    // Finance & Management
    {
      id: "expenses",
      name: "Expense & Outflow Tracking",
      description: "Log facility rent, equipment maintenance, and monthly bills.",
      price: 49,
      category: "finance",
      icon: CreditCard,
    },
    {
      id: "dues",
      name: "Outstanding Dues Tracking",
      description: "Overdue balances queue with 1-click WhatsApp follow-up.",
      price: 29,
      category: "finance",
      icon: Zap,
    },
    {
      id: "invoices",
      name: "GST Invoice Generation",
      description: "Automatic compliant GST invoices & printable PDF receipts.",
      price: 29,
      category: "finance",
      icon: FileText,
    },
    {
      id: "reminders",
      name: "Payment & Renewal Reminders",
      description: "Automated payment dues reminders and membership expiry alerts.",
      price: 29,
      category: "finance",
      icon: MessageSquare,
    },
    {
      id: "commissions",
      name: "Trainer Commissions",
      description: "Auto-calculate trainer share on personal training packages.",
      price: 49,
      category: "finance",
      icon: Users,
    },
    {
      id: "leads",
      name: "Enquiries & Lead Pipeline",
      description: "Capture walk-in inquiries and track trial workout conversions.",
      price: 49,
      category: "finance",
      icon: Users,
    },
    {
      id: "offers",
      name: "Offers & Promotional Discounts",
      description: "Create coupon codes, seasonal discounts, and festival deals.",
      price: 29,
      category: "finance",
      icon: Percent,
    },
    {
      id: "equipment",
      name: "Equipment Management",
      description: "Log gym machine maintenance logs and warranty expirations.",
      price: 29,
      category: "finance",
      icon: Dumbbell,
    },

    // Advanced & Scale
    {
      id: "analytics",
      name: "Advanced Analytics",
      description: "Peak-hour heatmaps, member retention radar, and revenue trends.",
      price: 99,
      category: "advanced",
      icon: BarChart3,
    },
    {
      id: "branding",
      name: "Custom Branding",
      description: "Display your facility's custom logo on passes and receipts.",
      price: 99,
      category: "advanced",
      icon: Sparkles,
    },
    {
      id: "domain",
      name: "Custom Domain Setup",
      description: "Connect your custom gym web address (e.g., yourgym.com).",
      price: 99,
      category: "advanced",
      icon: Globe,
    },
    {
      id: "api_access",
      name: "API & Webhook Access",
      description: "REST endpoints and webhooks for custom biometrics and websites.",
      price: 99,
      category: "advanced",
      icon: Code2,
    },
    {
      id: "insights",
      name: "Automated Business Insights",
      description: "Smart churn forecasting and revenue optimization recommendations.",
      price: 99,
      category: "advanced",
      icon: Lightbulb,
    },
    {
      id: "priority",
      name: "Priority Phone & Concierge Support",
      description: "Direct WhatsApp support line with dedicated onboarding manager.",
      price: 199,
      category: "advanced",
      icon: ShieldCheck,
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // 3. BUILDER INTERACTIVE STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [selectedMemberTierId, setSelectedMemberTierId] = useState<string>("m25");
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([
    "attendance",
    "memberships",
    "payments",
    "member_portal",
  ]);
  const [extraBranches, setExtraBranches] = useState<number>(0);

  const displayedModules = useMemo(() => {
    if (moduleCategoryFilter === "all") return availableModules;
    return availableModules.filter((m) => m.category === moduleCategoryFilter);
  }, [moduleCategoryFilter, availableModules]);

  const selectedTier = useMemo(
    () => memberTiers.find((t) => t.id === selectedMemberTierId) || memberTiers[0],
    [selectedMemberTierId]
  );

  const toggleModule = (id: string) => {
    setSelectedModuleIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const loadBundleToBuilder = (b: BundlePlan) => {
    // Map bundle member count to closest tier
    const matchedTier =
      memberTiers.find((t) => t.count === b.memberCount) || memberTiers[1];
    setSelectedMemberTierId(matchedTier.id);

    // Map modules included
    const validModuleIds = availableModules
      .filter((m) => b.modulesIncluded.includes(m.id))
      .map((m) => m.id);
    setSelectedModuleIds(validModuleIds);

    // Branches
    setExtraBranches(b.id === "scale" ? 1 : 0);
    setActiveTab("custom");
  };

  // Dynamic calculations
  const baseWorkspacePrice = 199;
  const memberPrice = selectedTier.price;
  const modulesPrice = useMemo(() => {
    return selectedModuleIds.reduce((sum, id) => {
      const mod = availableModules.find((m) => m.id === id);
      return sum + (mod ? mod.price : 0);
    }, 0);
  }, [selectedModuleIds]);
  const branchesPrice = extraBranches * 49;

  const rawMonthlyTotal = baseWorkspacePrice + memberPrice + modulesPrice + branchesPrice;
  const rawAnnualMonthly = Math.round(rawMonthlyTotal * 0.8);

  const currentDisplayMonthly =
    billingCycle === "annual" ? rawAnnualMonthly : rawMonthlyTotal;
  const currentDisplayYearlyTotal = rawAnnualMonthly * 12;

  // Smart bundle comparison check
  const bundleSavingsTip = useMemo(() => {
    for (const b of bundles) {
      if (b.id === "owner_lite") continue;
      const bPrice = billingCycle === "annual" ? b.annualPrice : b.monthlyPrice;
      if (rawMonthlyTotal > bPrice && selectedTier.count <= b.memberCount) {
        const allCovered = selectedModuleIds.every((mId) =>
          b.modulesIncluded.includes(mId)
        );
        if (allCovered) {
          const savings =
            (billingCycle === "annual" ? rawAnnualMonthly : rawMonthlyTotal) - bPrice;
          return {
            bundleName: b.name,
            bundlePrice: bPrice,
            savings: Math.max(0, savings),
            bundle: b,
          };
        }
      }
    }
    return null;
  }, [rawMonthlyTotal, rawAnnualMonthly, billingCycle, selectedTier, selectedModuleIds]);

  const pricingFaqs = [
    {
      q: "How does the modular pricing work?",
      a: "Every workspace starts with our core Owner Dashboard platform for just ₹199/month. You then choose your active member limit and select only the operational modules you actually need. You never pay for features your gym doesn't use.",
    },
    {
      q: "Can I switch between ready-made bundles and custom plans?",
      a: "Yes! You can pick an affordable pre-configured bundle like REPSI Starter (₹399/mo) or REPSI Growth (₹699/mo), or switch to 'Build Your Own Plan' to customize individual add-ons at any time.",
    },
    {
      q: "What happens to my data if I disable a module later?",
      a: "REPSI strictly preserves all your historical records, member notes, and payment receipts safely. If you disable a module like Diet Plans or Class Scheduling, the interface is hidden, but none of your existing records are ever deleted.",
    },
    {
      q: "What are active members and how are they counted?",
      a: "An active member is any person registered with an active or non-expired membership pass in your gym. Expired, inactive, or archived members do not count against your tier limits.",
    },
    {
      q: "Are there setup fees or cancellation penalties?",
      a: "None. REPSI operates with 100% transparent pricing. There are zero setup costs, zero hidden onboarding charges, and you can cancel or switch plans anytime without penalties.",
    },
  ];

  return (
    <section
      id="pricing"
      className="relative w-full bg-[#FAF9F6] text-[#191919] py-20 sm:pt-28 lg:pt-32 pb-20 sm:pb-28 border-b border-[#E7E4DE] overflow-hidden font-sans"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 01. SECTION HEADER (NO EYEBROWS)                              */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <motion.h2
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[48px] text-[#191919] tracking-tight leading-[1.14] mb-4"
          >
            Affordable bundles or <br className="hidden sm:inline" />
            <span className="text-[#E25822]">build your own plan.</span>
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-base sm:text-lg text-[#62666D] max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Start at just <span className="font-bold text-[#191919]">₹199/month</span>. Choose an all-in-one bundle or select only the modules your gym needs today.
          </motion.p>

          {/* Pricing Controls: Mode Switcher (Bundles vs Custom) & Billing Frequency */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {/* View Mode Selector */}
            <div className="inline-flex p-1.5 rounded-full bg-white border border-[#E7E4DE] shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab("bundles")}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "bundles"
                    ? "bg-[#E25822] text-white shadow-xs"
                    : "text-[#62666D] hover:text-[#191919]"
                }`}
              >
                Ready-Made Bundles
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("custom")}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "custom"
                    ? "bg-[#E25822] text-white shadow-xs"
                    : "text-[#62666D] hover:text-[#191919]"
                }`}
              >
                <span>Build Your Own</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500 text-white uppercase">
                  Dynamic
                </span>
              </button>
            </div>

            {/* Billing Switcher (Monthly / Annual) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={`text-xs sm:text-sm font-semibold cursor-pointer transition-colors ${
                  billingCycle === "monthly" ? "text-[#191919]" : "text-[#858890]"
                }`}
                onClick={() => setBillingCycle("monthly")}
              >
                Monthly
              </button>

              <button
                type="button"
                onClick={() =>
                  setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")
                }
                className="w-13 h-7 bg-[#E7E4DE] rounded-full p-1 transition-colors relative cursor-pointer"
                aria-label="Toggle billing frequency"
              >
                <motion.div
                  className="w-5 h-5 bg-[#E25822] rounded-full shadow-sm"
                  animate={{ x: billingCycle === "annual" ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>

              <button
                type="button"
                className={`text-xs sm:text-sm font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                  billingCycle === "annual" ? "text-[#191919]" : "text-[#858890]"
                }`}
                onClick={() => setBillingCycle("annual")}
              >
                <span>Yearly</span>
                <span className="text-[10px] font-bold text-[#E25822] bg-[#FDF1EB] border border-[#FACBB7] px-2 py-0.5 rounded-full uppercase">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 1: 4 REPSI PRICING BUNDLES                                */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "bundles" && (
          <div className="space-y-10 mb-16 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {bundles.map((bundle) => {
                const price =
                  billingCycle === "annual"
                    ? bundle.annualPrice
                    : bundle.monthlyPrice;

                return (
                  <div
                    key={bundle.id}
                    className={`rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 flex flex-col justify-between relative transition-all duration-200 ${
                      bundle.popular
                        ? "bg-white text-[#191919] shadow-md border-2 border-[#E25822] ring-4 ring-[#E25822]/10"
                        : "bg-white text-[#191919] shadow-sm border border-[#E7E4DE] hover:shadow-md"
                    }`}
                  >
                    {/* Badge Slot */}
                    {bundle.badge && (
                      <div
                        className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10.5px] font-bold tracking-wider uppercase px-3.5 py-0.5 rounded-full shadow-sm whitespace-nowrap ${
                          bundle.popular
                            ? "bg-[#E25822] text-white"
                            : "bg-[#FDF1EB] text-[#E25822] border border-[#FACBB7]"
                        }`}
                      >
                        {bundle.badge}
                      </div>
                    )}

                    <div>
                      {/* Name & Tagline */}
                      <div className="mb-2">
                        <h3 className="font-heading font-extrabold text-2xl tracking-tight text-[#191919]">
                          {bundle.name}
                        </h3>
                        <div className="text-[11px] font-mono font-semibold text-[#858890] mt-0.5">
                          {bundle.memberCapacity}
                        </div>
                      </div>

                      <p className="text-xs text-[#62666D] mb-5 leading-relaxed min-h-[36px]">
                        {bundle.tagline}
                      </p>

                      {/* Price Display */}
                      <div className="mb-5 pb-5 border-b border-[#E7E4DE]">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-[#191919]">
                            ₹{price.toLocaleString()}
                          </span>
                          <span className="text-xs font-medium text-[#62666D]">
                            / month
                          </span>
                        </div>
                        <div className="text-[11px] mt-1 font-mono text-[#858890]">
                          {billingCycle === "annual"
                            ? `Billed ₹${(price * 12).toLocaleString()}/year · Save 20%`
                            : "Billed monthly"}
                        </div>
                      </div>

                      {/* Features List */}
                      <div className="space-y-2.5 mb-6 text-xs">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#191919]">
                          Included in this bundle:
                        </div>
                        {bundle.features.map((feat, fIdx) => (
                          <div
                            key={fIdx}
                            className="flex items-start gap-2 text-[#191919]"
                          >
                            <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#E25822]" />
                            <span className="leading-snug">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 space-y-2">
                      <Link
                        href={`/signup?plan=${bundle.id}&billing=${billingCycle}`}
                        className={`group w-full inline-flex items-center justify-center gap-2 h-11 rounded-full text-xs font-semibold transition-all duration-200 active:scale-[0.98] ${
                          bundle.popular
                            ? "bg-[#E25822] hover:bg-[#C94715] text-white shadow-sm shadow-[#E25822]/30 hover:shadow-md"
                            : "bg-[#FAF9F6] hover:bg-[#F5F2ED] text-[#191919] border border-[#E7E4DE]"
                        }`}
                      >
                        <span>{bundle.ctaText}</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => loadBundleToBuilder(bundle)}
                        className="w-full text-center text-[11px] font-semibold text-[#858890] hover:text-[#E25822] transition-colors py-1 cursor-pointer"
                      >
                        Customize this bundle →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Transition Banner to Custom Builder */}
            <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E7E4DE] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-xs font-bold text-[#E25822] uppercase tracking-wider">
                  Prefer a custom setup?
                </div>
                <h4 className="font-heading font-extrabold text-lg sm:text-xl text-[#191919]">
                  Select the exact modules and member limits your gym needs.
                </h4>
                <p className="text-xs text-[#62666D]">
                  Pay only for what you use, starting from ₹199/month for owner dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("custom")}
                className="shrink-0 h-11 px-6 rounded-full bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#E7E4DE] text-[#191919] text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                Open Plan Builder →
              </button>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 2: INTERACTIVE BUILD YOUR OWN PLAN CALCULATOR             */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "custom" && (
          <div className="mb-16 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Configuration Controls (Spans 8 cols on lg) */}
              <div className="lg:col-span-8 space-y-8">
                {/* 1. Base Workspace Box */}
                <div className="bg-white rounded-3xl border border-[#E7E4DE] p-6 sm:p-7 shadow-xs">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-[#E25822] bg-[#FDF1EB] border border-[#FACBB7] px-2.5 py-0.5 rounded-full">
                        Required Core Platform
                      </span>
                      <h3 className="font-heading font-extrabold text-xl text-[#191919] mt-2">
                        Owner Dashboard & Business Settings
                      </h3>
                      <p className="text-xs text-[#62666D] mt-1 leading-relaxed">
                        Includes security infrastructure, roles & permissions, trainer management, notifications center, and audit logs.
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-2xl font-heading font-extrabold text-[#191919]">
                        ₹199
                      </div>
                      <div className="text-[10px] font-mono text-[#858890]">
                        / month base
                      </div>
                    </div>
                  </div>

                  {/* Free Essentials List */}
                  <div className="pt-3 border-t border-[#F0EDE7] flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#62666D]">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Trainer management included
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Roles & permissions included
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Data export & backup included
                    </span>
                  </div>
                </div>

                {/* 2. Active Member Capacity Selector */}
                <div className="bg-white rounded-3xl border border-[#E7E4DE] p-6 sm:p-7 shadow-xs space-y-4">
                  <div>
                    <h4 className="font-heading font-extrabold text-lg text-[#191919]">
                      Select Active Member Capacity
                    </h4>
                    <p className="text-xs text-[#62666D] mt-0.5">
                      Keep member limits separate from modules. Upgrade or downgrade anytime.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {memberTiers.map((tier) => {
                      const isSelected = selectedMemberTierId === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setSelectedMemberTierId(tier.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                            isSelected
                              ? "bg-[#FDF1EB] border-[#E25822] ring-2 ring-[#E25822]/20 shadow-xs"
                              : "bg-[#FAF9F6] border-[#E7E4DE] hover:bg-white hover:border-[#D5D2CA]"
                          }`}
                        >
                          <div className="text-xs font-bold text-[#191919] leading-tight">
                            {tier.label}
                          </div>
                          <div className="text-[11px] font-mono font-semibold text-[#E25822] mt-1">
                            {tier.price === 0 ? "Included" : `+₹${tier.price}/mo`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Modular Features Selector */}
                <div className="bg-white rounded-3xl border border-[#E7E4DE] p-6 sm:p-7 shadow-xs space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="font-heading font-extrabold text-lg text-[#191919]">
                        Select Operations & Business Modules
                      </h4>
                      <p className="text-xs text-[#62666D] mt-0.5">
                        Toggle any module on or off. Selected modules update your bill immediately.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedModuleIds(availableModules.map((m) => m.id))
                        }
                        className="text-[11px] font-semibold text-[#E25822] hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-[#858890] text-xs">·</span>
                      <button
                        type="button"
                        onClick={() => setSelectedModuleIds([])}
                        className="text-[11px] font-semibold text-[#858890] hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#F0EDE7]">
                    {[
                      { id: "all", label: "All Modules", count: availableModules.length },
                      {
                        id: "operations",
                        label: "Operations & Members",
                        count: availableModules.filter((m) => m.category === "operations").length,
                      },
                      {
                        id: "finance",
                        label: "Finance & Sales",
                        count: availableModules.filter((m) => m.category === "finance").length,
                      },
                      {
                        id: "advanced",
                        label: "Advanced & Growth",
                        count: availableModules.filter((m) => m.category === "advanced").length,
                      },
                    ].map((tab) => {
                      const isActive = moduleCategoryFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setModuleCategoryFilter(tab.id as typeof moduleCategoryFilter)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isActive
                              ? "bg-[#191919] text-white shadow-2xs"
                              : "bg-[#FAF9F6] text-[#62666D] hover:bg-[#F5F2ED] border border-[#E7E4DE]"
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                              isActive ? "bg-white/20 text-white" : "bg-[#E7E4DE] text-[#62666D]"
                            }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {displayedModules.map((mod) => {
                      const isChecked = selectedModuleIds.includes(mod.id);
                      const IconComponent = mod.icon;

                      return (
                        <div
                          key={mod.id}
                          onClick={() => toggleModule(mod.id)}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            isChecked
                              ? "bg-white border-[#E25822] ring-1 ring-[#E25822]/30 shadow-xs"
                              : "bg-[#FAF9F6] border-[#E7E4DE] hover:bg-white hover:border-[#D5D2CA]"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isChecked
                                ? "bg-[#E25822] border-[#E25822] text-white"
                                : "bg-white border-[#D5D2CA]"
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[#191919] truncate">
                                {mod.name}
                              </span>
                              <span className="text-xs font-mono font-bold text-[#E25822] shrink-0">
                                +₹{mod.price}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#62666D] leading-relaxed mt-0.5 line-clamp-2">
                              {mod.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Additional Branch Stepper */}
                  <div className="pt-4 border-t border-[#F0EDE7] flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-[#191919]">
                        Additional Gym Branches
                      </div>
                      <div className="text-[11px] text-[#62666D]">
                        ₹49/month per additional location.
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setExtraBranches((b) => Math.max(0, b - 1))}
                        disabled={extraBranches === 0}
                        className="w-8 h-8 rounded-full border border-[#E7E4DE] bg-[#FAF9F6] hover:bg-white text-[#191919] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="font-mono font-bold text-sm text-[#191919] w-6 text-center">
                        {extraBranches}
                      </span>

                      <button
                        type="button"
                        onClick={() => setExtraBranches((b) => b + 1)}
                        className="w-8 h-8 rounded-full border border-[#E7E4DE] bg-[#FAF9F6] hover:bg-white text-[#191919] flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Sticky Summary Receipt & Instant Checkout (4 cols on lg) */}
              <div className="lg:col-span-4 sticky top-24 space-y-4">
                <div className="bg-white rounded-3xl border-2 border-[#191919] p-6 sm:p-7 shadow-lg relative overflow-hidden">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#E25822] mb-1">
                    Your Custom Plan Total
                  </div>

                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-4xl sm:text-5xl font-heading font-extrabold text-[#191919] tracking-tight">
                      ₹{currentDisplayMonthly.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium text-[#62666D]">
                      / month
                    </span>
                  </div>

                  <div className="text-xs font-mono text-[#858890] pb-4 border-b border-[#E7E4DE]">
                    {billingCycle === "annual"
                      ? `Billed ₹${currentDisplayYearlyTotal.toLocaleString()}/year · 20% discount applied`
                      : "Billed monthly"}
                  </div>

                  {/* Smart Bundle Comparison Tip */}
                  {bundleSavingsTip && (
                    <div className="my-4 p-3 rounded-2xl bg-[#FDF1EB] border border-[#FACBB7] text-xs text-[#191919] space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-[#E25822]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Bundle Recommendation</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#62666D]">
                        The <span className="font-bold text-[#191919]">{bundleSavingsTip.bundleName}</span> bundle includes all your selected features for{" "}
                        <span className="font-bold text-[#191919]">₹{bundleSavingsTip.bundlePrice}/mo</span>!
                      </p>
                      <button
                        type="button"
                        onClick={() => loadBundleToBuilder(bundleSavingsTip.bundle)}
                        className="w-full text-center text-xs font-bold text-white bg-[#E25822] hover:bg-[#C94715] py-1.5 rounded-full shadow-2xs transition-all cursor-pointer"
                      >
                        Switch to {bundleSavingsTip.bundleName}
                      </button>
                    </div>
                  )}

                  {/* Breakdown List */}
                  <div className="space-y-2 py-4 text-xs">
                    <div className="flex justify-between items-center text-[#191919]">
                      <span className="text-[#62666D]">Core Owner Platform</span>
                      <span className="font-mono font-bold">₹199/mo</span>
                    </div>

                    <div className="flex justify-between items-center text-[#191919]">
                      <span className="text-[#62666D] truncate max-w-[170px]">
                        Members ({selectedTier.count})
                      </span>
                      <span className="font-mono font-bold">
                        {memberPrice === 0 ? "Included" : `+₹${memberPrice}/mo`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[#191919]">
                      <span className="text-[#62666D]">
                        Selected Modules ({selectedModuleIds.length})
                      </span>
                      <span className="font-mono font-bold">+₹{modulesPrice}/mo</span>
                    </div>

                    {extraBranches > 0 && (
                      <div className="flex justify-between items-center text-[#191919]">
                        <span className="text-[#62666D]">
                          Extra Branches ({extraBranches})
                        </span>
                        <span className="font-mono font-bold">+₹{branchesPrice}/mo</span>
                      </div>
                    )}
                  </div>

                  {/* CTA Checkout */}
                  <div className="pt-2 space-y-2">
                    <Link
                      href={`/signup?plan=custom&billing=${billingCycle}&members=${selectedTier.count}&modules=${selectedModuleIds.join(",")}`}
                      className="group w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-[#E25822] hover:bg-[#C94715] text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#E25822]/30 transition-all duration-200 active:scale-95"
                    >
                      <span>Start 14-Day Free Trial</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>

                    <p className="text-[11px] text-center text-[#858890]">
                      No card required · Zero automatic charges
                    </p>
                  </div>
                </div>

                {/* Reset or Switch View */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab("bundles")}
                    className="text-xs font-semibold text-[#858890] hover:text-[#191919] transition-colors cursor-pointer"
                  >
                    ← Back to ready-made bundles
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 03. PRICING FAQ ACCORDION                                      */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto pt-6 border-t border-[#E7E4DE]">
          <div className="text-center mb-8">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#E25822]">
              Frequently Asked Questions
            </span>
            <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#191919] mt-1">
              Everything you need to know about pricing.
            </h3>
          </div>

          <div className="space-y-3">
            {pricingFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-[#E7E4DE] overflow-hidden shadow-2xs"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="font-heading font-bold text-sm sm:text-base text-[#191919]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#858890] transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-[#E25822]" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 sm:px-5 pb-4 pt-0 text-xs sm:text-sm text-[#62666D] leading-relaxed border-t border-[#F0EDE7]">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
