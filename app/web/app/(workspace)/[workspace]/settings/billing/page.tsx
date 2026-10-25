"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Zap,
  Download,
  ShieldCheck,
  Building2,
  Users,
  Globe,
  Lock,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  FileText,
  Printer,
  X,
  Check,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  Smartphone,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { ShinyText } from "@/components/ui/shiny-text";
import { repsiApi } from "@/lib/api";
import {
  CURRENCIES,
  CurrencyCode,
  BillingCycle,
  GLOBAL_PLANS,
  GLOBAL_ADDONS,
} from "@/lib/pricing-data";

declare global {
  interface Window {
    Cashfree: any;
  }
}

export default function SubscriptionBillingPage(props?: { params?: Promise<{ workspace: string }> | { workspace: string } }) {
  const routeParams = useParams();
  const workspace = (routeParams?.workspace as string) || "apex-fitness";

  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [downgradeWarning, setDowngradeWarning] = useState<any>(null);

  const [selectedPlanCode, setSelectedPlanCode] = useState<string>("growth");
  // Default to 1 year and INR
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [successDetails, setSuccessDetails] = useState<any>(null);

  const curr = CURRENCIES[currency];

  const [activeSubscription, setActiveSubscription] = useState<any>({
    status: 'loading',
    trial_days_left: 0,
    plan: null,
    billing_cycle: 'yearly',
    currency: 'INR',
    next_billing_date: 'Not available',
  });

  const [usage, setUsage] = useState<any>({
    members: { current: 0, limit: 0, percentage: 0, warning_triggered: false, limit_reached: false, unlimited: false },
    trainers: { current: 0, limit: 0, percentage: 0, warning_triggered: false, limit_reached: false, unlimited: false },
    branches: { current: 0, limit: 0, percentage: 0, warning_triggered: false, limit_reached: false, unlimited: false },
  });

  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    async function loadBilling() {
      setLoading(true);
      try {
        const data = await repsiApi.getBillingSubscription();
        if (data && data.subscription) {
          setActiveSubscription(data.subscription);
          if (data.invoices && Array.isArray(data.invoices)) {
            setInvoices(data.invoices);
          }
        }
        if (data && data.usage) {
          const memberCurrent = data.usage.members?.current ?? 0;
          const memberLimit = data.usage.members?.limit ?? 150;
          const memberPct = memberLimit > 0 ? Math.round((memberCurrent / memberLimit) * 100) : 0;

          const trainerCurrent = data.usage.trainers?.current ?? 0;
          const trainerLimit = data.usage.trainers?.limit ?? 10;
          const trainerPct = trainerLimit > 0 ? Math.round((trainerCurrent / trainerLimit) * 100) : 0;

          const branchCurrent = data.usage.branches?.current ?? 1;
          const branchLimit = data.usage.branches?.limit ?? 1;
          const branchPct = branchLimit > 0 ? Math.round((branchCurrent / branchLimit) * 100) : 100;

          setUsage({
            members: {
              current: memberCurrent,
              limit: memberLimit,
              percentage: memberPct,
              warning_triggered: data.usage.members?.warning_triggered ?? (memberPct >= 90),
              limit_reached: data.usage.members?.limit_reached ?? (memberCurrent >= memberLimit),
              unlimited: data.usage.members?.unlimited ?? (memberLimit >= 999999),
            },
            trainers: {
              current: trainerCurrent,
              limit: trainerLimit,
              percentage: trainerPct,
              warning_triggered: data.usage.trainers?.warning_triggered ?? (trainerPct >= 80),
              limit_reached: data.usage.trainers?.limit_reached ?? (trainerCurrent >= trainerLimit),
              unlimited: data.usage.trainers?.unlimited ?? (trainerLimit >= 999999),
            },
            branches: {
              current: branchCurrent,
              limit: branchLimit,
              percentage: branchPct,
              warning_triggered: data.usage.branches?.warning_triggered ?? false,
              limit_reached: data.usage.branches?.limit_reached ?? (branchCurrent >= branchLimit),
              unlimited: data.usage.branches?.unlimited ?? (branchLimit >= 999999),
            },
          });
        }
      } catch (err) {
        console.warn("Could not load billing data", err);
        setActiveSubscription((previous: any) => ({ ...previous, status: "unavailable", plan: null }));
        setUsage({
          members: { current: 0, limit: 0, percentage: 0, warning_triggered: false, limit_reached: false, unlimited: false },
          trainers: { current: 0, limit: 0, percentage: 0, warning_triggered: false, limit_reached: false, unlimited: false },
          branches: { current: 0, limit: 0, percentage: 0, warning_triggered: false, limit_reached: false, unlimited: false },
        });
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    }
    loadBilling();
  }, [workspace]);

  const handleCashfreeSaaSCheckout = async (targetPlanCode: string) => {
    setIsProcessingCheckout(true);
    setCheckoutError(null);
    setDowngradeWarning(null);

    try {
      await repsiApi.createBillingCheckoutSession({
        plan_code: targetPlanCode,
        billing_cycle: billingCycle === "yearly" ? "annual" : "monthly",
        currency,
      });
      setCheckoutError("Cashfree checkout session initialized. Ready to process subscription payment.");
    } catch (err: any) {
      setCheckoutError(
        "Online automated gateway checkout is temporarily unavailable on this server. Please contact support at billing@repsi.app or view our full plans at /pricing."
      );
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background text-text p-4 md:p-8 space-y-8 max-w-6xl mx-auto font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/${workspace}/settings`}
                className="text-xs text-text-secondary hover:text-primary flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Settings
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-xs text-primary font-medium">Subscription & Billing</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text flex items-center gap-3">
              Subscription & Billing
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 ${
                  activeSubscription.status === "active"
                    ? "bg-success-soft text-success border border-success/30"
                    : "bg-warning-soft text-warning border border-warning/30"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {activeSubscription.status === "active"
                  ? "Active Subscription"
                  : activeSubscription.status === "trialing"
                    ? "14-Day Free Trial"
                    : activeSubscription.status === "loading"
                      ? "Loading billing status"
                      : "Billing status unavailable"}
              </span>
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              {curr.taxNote} Gym owners pay Repsi via Cashfree payment gateway.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPlanModal(true)}
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/10 transition transform active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              Upgrade / Change Plan
            </button>
          </div>
        </div>

        {/* TWO PAYMENT FLOWS CLARITY CARD */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span>Repsi Payment Flow Architecture</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-text-secondary">
            <div className="p-3.5 rounded-xl bg-surface-elevated border border-border">
              <strong className="text-text block mb-1">1. Platform Subscription (Owner → Repsi):</strong>
              Owners pay the Repsi subscription fee directly through this dashboard using our Cashfree API payment gateway.
            </div>
            <div className="p-3.5 rounded-xl bg-surface-elevated border border-border">
              <strong className="text-text block mb-1">2. Gym Member Fees (Member → Owner):</strong>
              Members pay gym membership fees directly to the owner via UPI ID or QR code, and submit proof for review under Payments.
            </div>
          </div>
        </div>

        {/* 14-DAY TRIAL COUNTDOWN BANNER */}
        {activeSubscription.status === "trialing" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-primary text-primary-foreground flex-shrink-0 mt-0.5 shadow-md">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-text flex items-center gap-2">
                  {activeSubscription.trial_days_left <= 1
                    ? "Trial ends tomorrow!"
                    : `${activeSubscription.trial_days_left} Days Remaining in Free Trial`}
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-primary text-primary-foreground">
                    <ShinyText text="GROWTH ACCESS" shimmerColor="rgba(255,255,255,0.9)" />
                  </span>
                </h3>
                <p className="text-xs text-text-secondary">
                  Your 14-day trial includes full Growth tier features (Classes, Workouts, Diet, CRM, QR Attendance). When trial ends, your data is preserved safely in read-only mode until a plan is selected.
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPlanModal(true)}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold transition shrink-0 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Select Paid Plan</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {/* Active Plan Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-surface-elevated border border-border relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary font-bold">
                <Sparkles className="w-4 h-4 text-primary" />
                Active Repsi Plan
              </div>
              <div className="flex items-baseline gap-3">
                <h2 className="text-3xl font-extrabold text-text tracking-tight">
                  {activeSubscription.plan?.name || "Growth Plan (Trial)"}
                </h2>
                <span className="text-xs font-semibold text-text-muted">
                  Billed {activeSubscription.billing_cycle || "yearly"} · Fixed price in {currency}
                </span>
              </div>
              <p className="text-xs text-text-secondary max-w-xl">
                {activeSubscription.plan?.description ||
                  "Complete fitness facility operations with workout logging, diet management, CRM, and P&L tracking."}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2">
              <div className="text-xs text-text-muted">Next Renewal / Expiry</div>
              <div className="text-base font-bold text-text flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {activeSubscription.next_billing_date || "14 Days Remaining"}
              </div>
              <button
                onClick={() => setShowPlanModal(true)}
                className="mt-2 text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Switch Billing Cycle or Upgrade</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Capacity Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Members */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm">
            <div className="flex items-center justify-between text-text-secondary mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Members</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-text mb-2">
              {usage?.members?.current ?? 0}{" "}
              <span className="text-sm font-normal text-text-muted">
                / {usage?.members?.unlimited ? "Unlimited" : (usage?.members?.limit ?? 150)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${usage?.members?.unlimited ? 100 : Math.min(100, usage?.members?.percentage ?? 0)}%` }}
              />
            </div>
            <div className="text-[11px] text-text-muted mt-2.5">
              10% grace allowance active · Check-ins are never blocked
            </div>
          </div>

          {/* Trainers */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm">
            <div className="flex items-center justify-between text-text-secondary mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Gym Trainers</span>
              <Building2 className="w-4 h-4 text-warning" />
            </div>
            <div className="text-2xl font-bold text-text mb-2">
              {usage?.trainers?.current ?? 0}{" "}
              <span className="text-sm font-normal text-text-muted">
                / {usage?.trainers?.unlimited ? "Unlimited" : (usage?.trainers?.limit ?? 10)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
              <div
                className="h-full bg-warning rounded-full transition-all duration-500"
                style={{ width: `${usage?.trainers?.unlimited ? 100 : Math.min(100, usage?.trainers?.percentage ?? 0)}%` }}
              />
            </div>
            <div className="text-[11px] text-text-muted mt-2.5">
              {usage?.trainers?.unlimited ? "Unlimited trainer profiles" : `${Math.max(0, (usage?.trainers?.limit ?? 10) - (usage?.trainers?.current ?? 0))} trainer slots remaining`}
            </div>
          </div>

          {/* Branches */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm">
            <div className="flex items-center justify-between text-text-secondary mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Gym Branches</span>
              <Globe className="w-4 h-4 text-info" />
            </div>
            <div className="text-2xl font-bold text-text mb-2">
              {usage?.branches?.current ?? 1}{" "}
              <span className="text-sm font-normal text-text-muted">
                / {usage?.branches?.unlimited ? "Unlimited" : (usage?.branches?.limit ?? 1)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
              <div
                className="h-full bg-info rounded-full transition-all duration-500"
                style={{ width: `${usage?.branches?.unlimited ? 100 : Math.min(100, usage?.branches?.percentage ?? 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-text-muted mt-2.5">
              Available on Pro (3 branches) & Enterprise (unlimited)
            </div>
          </div>
        </div>

        {/* ADD-ONS SECTION IN DASHBOARD */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-text flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Available Add-on Packs ({currency})
              </h3>
              <p className="text-xs text-text-secondary">Expand your capacity without changing your base tier</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GLOBAL_ADDONS.map((add, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-surface-elevated border border-border flex flex-col justify-between">
                <div>
                  <div className="font-bold text-sm text-text">{add.name}</div>
                  <div className="text-xs text-text-secondary mt-1">{add.details}</div>
                </div>
                <div className="pt-3 mt-3 border-t border-border flex items-baseline justify-between">
                  <span className="font-mono font-bold text-xs text-primary">
                    {add.priceByCurrency[currency]}
                  </span>
                  <button
                    onClick={() => setShowPlanModal(true)}
                    className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Payment Receipts */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-text flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Subscription Payment Receipts
              </h3>
              <p className="text-xs text-text-secondary">
                Official receipts from Cashfree payments for your gym accounting records
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-muted">
                  <th className="pb-3 font-semibold">Invoice #</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Plan Description</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-xs text-text-muted">
                      No invoices yet. Your trial includes 14 days of free calendar access.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-surface-elevated/40 transition">
                      <td className="py-3.5 font-mono text-xs font-semibold text-text">{inv.id}</td>
                      <td className="py-3.5 text-xs text-text-secondary">{inv.date}</td>
                      <td className="py-3.5 text-xs text-text-secondary">{inv.plan}</td>
                      <td className="py-3.5 text-xs font-bold text-text">{inv.amount}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-success-soft text-success border border-success/30">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-primary hover:text-primary-foreground text-text-secondary transition inline-flex items-center gap-1.5 text-xs font-medium border border-border cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PLAN CHANGE & CHECKOUT MODAL */}
      <AnimatePresence>
        {showPlanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="bg-surface border border-border rounded-3xl max-w-5xl w-full p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[92vh] relative font-sans"
            >
              <button
                onClick={() => setShowPlanModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-surface-elevated hover:bg-surface text-text-secondary hover:text-text transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pr-8">
                <div>
                  <h3 className="text-2xl font-bold text-text flex items-center gap-2">
                    <Zap className="w-6 h-6 text-primary" />
                    Select Repsi Subscription
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    {curr.taxNote} Pay online via Cashfree gateway.
                  </p>
                </div>

                {/* Currency and Billing Frequency Selectors */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Currency Picker */}
                  <div className="flex items-center p-1 rounded-xl bg-surface-elevated border border-border">
                    {(Object.keys(CURRENCIES) as CurrencyCode[]).map((cCode) => (
                      <button
                        key={cCode}
                        onClick={() => setCurrency(cCode)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          currency === cCode
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-text-secondary hover:text-text"
                        }`}
                      >
                        {cCode}
                      </button>
                    ))}
                  </div>

                  {/* 4 Billing Cycles */}
                  <div className="flex items-center p-1 rounded-xl bg-surface-elevated border border-border">
                    <button
                      onClick={() => setBillingCycle("monthly")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        billingCycle === "monthly" ? "bg-primary text-primary-foreground shadow-sm" : "text-text-secondary hover:text-text"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle("3months")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        billingCycle === "3months" ? "bg-primary text-primary-foreground shadow-sm" : "text-text-secondary hover:text-text"
                      }`}
                    >
                      <span>3 Mo</span>
                      <span className="text-[9px] bg-black/20 text-white font-extrabold px-1 rounded">10% OFF</span>
                    </button>
                    <button
                      onClick={() => setBillingCycle("6months")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        billingCycle === "6months" ? "bg-primary text-primary-foreground shadow-sm" : "text-text-secondary hover:text-text"
                      }`}
                    >
                      <span>6 Mo</span>
                      <span className="text-[9px] bg-black/20 text-white font-extrabold px-1 rounded">25% OFF</span>
                    </button>
                    <button
                      onClick={() => setBillingCycle("yearly")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        billingCycle === "yearly" ? "bg-primary text-primary-foreground shadow-sm" : "text-text-secondary hover:text-text"
                      }`}
                    >
                      <span>1 Year</span>
                      <span className="text-[9px] bg-black/20 text-white font-extrabold px-1 rounded">35% OFF</span>
                    </button>
                  </div>
                </div>
              </div>

              {checkoutError && (
                <div className="mb-6 p-4 rounded-xl bg-error-soft border border-error/30 text-error-foreground text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                  <button onClick={() => setCheckoutError(null)} className="underline font-semibold cursor-pointer">
                    Dismiss
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 my-6 items-stretch">
                {GLOBAL_PLANS.map((p) => {
                  const isCurrent = activeSubscription.plan?.code === p.id;
                  const isSelected = selectedPlanCode === p.id;
                  const isEnterprise = p.id === "enterprise";
                  const isFree = p.id === "free_trial";

                  const pricingInfo = p.pricing[currency][billingCycle];

                  return (
                    <motion.div key={p.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full flex flex-col">
                      <SpotlightCard
                        onClick={() => setSelectedPlanCode(p.id)}
                        spotlightColor="rgba(226, 88, 34, 0.18)"
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between flex-1 ${
                          isSelected
                            ? "bg-primary-soft/30 border-primary shadow-xl ring-1 ring-primary/40"
                            : "bg-surface-elevated border-border hover:border-border/80"
                        }`}
                      >
                        {p.badge && (
                          <span className="absolute -top-3 right-3 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow-md">
                            {p.badge}
                          </span>
                        )}

                        <div className="flex-1 flex flex-col">
                          <div className="font-bold text-base text-text mb-1 flex items-center justify-between">
                            {p.name}
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-success-soft text-success border border-success/30 font-semibold">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-text-secondary mb-3 min-h-[34px] leading-snug">{p.tagline}</div>

                          <div className="flex items-baseline gap-1 mb-1">
                            {isEnterprise ? (
                              <span className="text-xl font-black text-text">From {curr.symbol}{p.pricing[currency].yearly.perMonth}/mo</span>
                            ) : isFree ? (
                              <span className="text-2xl font-black text-text">{curr.symbol}0</span>
                            ) : (
                              <>
                                <span className="text-2xl font-black text-text">
                                  {curr.symbol}{pricingInfo.perMonth.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-text-muted">/ mo</span>
                              </>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-text-muted mb-2">
                            {isEnterprise ? "Custom contract" : isFree ? "14 days free" : pricingInfo.note}
                          </div>

                          <div className="text-[11px] font-mono text-primary font-bold mb-4 py-1 px-2 rounded-lg bg-surface border border-border inline-block">
                            Limit: {p.memberCount >= 9999 ? "Unlimited" : p.memberCapacity}
                          </div>
                        </div>

                        <div className="mt-auto pt-3 border-t border-border/60">
                          {isCurrent ? (
                            <button
                              disabled
                              className="w-full py-2.5 rounded-xl bg-surface text-text-muted border border-border text-xs font-bold text-center cursor-not-allowed"
                            >
                              Current Plan
                            </button>
                          ) : isEnterprise ? (
                            <a
                              href="mailto:sales@repsi.app?subject=Enterprise%20Plan%20Inquiry"
                              className="w-full py-2.5 rounded-xl bg-surface hover:bg-surface-elevated border border-primary text-primary text-xs font-bold transition flex items-center justify-center gap-1.5 text-center"
                            >
                              Contact Sales
                            </a>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCashfreeSaaSCheckout(p.id);
                              }}
                              disabled={isProcessingCheckout}
                              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              {isProcessingCheckout && selectedPlanCode === p.id ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Processing...</span>
                                </>
                              ) : (
                                <>
                                  <span>Pay via Gateway</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </motion.button>
                          )}
                        </div>
                      </SpotlightCard>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>
                    Need a detailed feature-by-feature comparison?{" "}
                    <Link
                      href="/pricing"
                      target="_blank"
                      className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      View full pricing table on homepage
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </span>
                </div>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="px-5 py-2 rounded-xl bg-surface-elevated hover:bg-surface text-text-secondary text-xs font-semibold transition border border-border cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAX INVOICE RECEIPT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative overflow-y-auto max-h-[90vh] font-sans">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-surface-elevated hover:bg-surface text-text-secondary hover:text-text transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-border pb-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-black text-primary-foreground text-sm">
                    R
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text leading-tight">Repsi Technologies Inc.</h2>
                    <p className="text-[11px] text-text-muted">Official SaaS Subscription Receipt</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded bg-success-soft text-success border border-success/30 font-mono text-xs font-bold uppercase">
                    {selectedInvoice.status}
                  </span>
                  <p className="text-xs font-mono text-text-muted mt-1">{selectedInvoice.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-border/50">
                <div>
                  <div className="text-text-muted font-semibold uppercase text-[10px]">Billed To:</div>
                  <div className="font-bold text-text mt-0.5">Gym Workspace: {workspace}</div>
                </div>
                <div className="text-right">
                  <div className="text-text-muted font-semibold uppercase text-[10px]">Payment Details:</div>
                  <div className="font-semibold text-text mt-0.5">Gateway: Cashfree</div>
                  <div className="text-text-secondary font-mono text-[11px]">Ref: {selectedInvoice.txRef || "REC-OK"}</div>
                  <div className="text-text-secondary">Date: {selectedInvoice.date}</div>
                </div>
              </div>
            </div>

            <table className="w-full text-left text-xs mb-6">
              <thead>
                <tr className="border-b border-border text-text-muted uppercase text-[10px] font-bold">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right font-bold">Total (Final Amount)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/30">
                  <td className="py-3 font-medium text-text">
                    {selectedInvoice.plan} - Repsi SaaS License
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-primary">
                    {selectedInvoice.amount}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-[11px] text-text-muted">{curr.taxNote}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface text-text-secondary text-xs font-semibold transition border border-border cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
