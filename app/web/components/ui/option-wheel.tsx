"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Dumbbell,
  Users,
  Waves,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CalendarCheck,
} from "lucide-react";

interface OptionData {
  id: string;
  name: string;
  icon: any;
  headline: string;
  subtext: string;
  features: string[];
  metricLabel: string;
  metricValue: string;
  previewCardTitle: string;
  previewCardDetail: string;
}

const options: OptionData[] = [
  {
    id: "owner",
    name: "Owner",
    icon: Building2,
    headline: "Multi-branch leadership & real-time P&L insights",
    subtext: "Track membership growth, staff performance, and automated daily payouts from a single executive view.",
    features: ["Multi-location branch management", "Automated daily bank settlements", "Staff payroll & attendance logs"],
    metricLabel: "Average ROI Boost",
    metricValue: "+32%",
    previewCardTitle: "Executive P&L Dashboard",
    previewCardDetail: "Live updates across all 3 locations • Net profit up 24% this quarter",
  },
  {
    id: "trainer",
    name: "Trainer",
    icon: Dumbbell,
    headline: "Personalized coaching, schedules & client progress",
    subtext: "Empower fitness trainers with client tracking, workout logging, PT package balances, and session reminders.",
    features: ["Digital workout plan builder", "Session check-ins & logs", "Client attendance history"],
    metricLabel: "Session Retention",
    metricValue: "96.4%",
    previewCardTitle: "Trainer Schedule & Client Roster",
    previewCardDetail: "14 PT sessions completed today • 0 no-shows recorded",
  },
  {
    id: "member",
    name: "Member",
    icon: Users,
    headline: "Seamless mobile pass, class booking & renewal alerts",
    subtext: "Delight your members with a frictionless mobile app experience, instant QR entry, and auto-renewals.",
    features: ["Contactless QR code pass", "Class & slot reservations", "Instant payment receipts"],
    metricLabel: "Member CSAT Score",
    metricValue: "4.9 / 5",
    previewCardTitle: "Member Mobile Experience",
    previewCardDetail: "Active Annual VIP Pass • 18 gym visits logged this month",
  },
  {
    id: "gym",
    name: "Gym",
    icon: Building2,
    headline: "High-volume fitness facility management built for scale",
    subtext: "Handle thousands of member check-ins, automated turnstile access, and bulk membership renewals effortlessly.",
    features: ["High-speed gate turnstile sync", "Automated WhatsApp dues recovery", "Locker & equipment management"],
    metricLabel: "Turnstile Speed",
    metricValue: "< 0.4s",
    previewCardTitle: "High-Volume Gym Operations",
    previewCardDetail: "482 daily check-ins today • Peak hours: 06:00 AM - 09:00 AM",
  },
  {
    id: "studio",
    name: "Studio",
    icon: Sparkles,
    headline: "Boutique studio class scheduling & pack management",
    subtext: "Manage class capacities, session packs, instructor payouts, and waitlists for your Pilates or HIIT studio.",
    features: ["Class capacity & waitlists", "Class pack credit tracking", "Instructor commission reports"],
    metricLabel: "Class Occupancy",
    metricValue: "91%",
    previewCardTitle: "Studio Class Management",
    previewCardDetail: "Spinning & Pilates classes fully booked • 12 on waitlist",
  },
  {
    id: "pool",
    name: "Pool",
    icon: Waves,
    headline: "Aquatics center lane booking & swim coaching",
    subtext: "Manage pool lane schedules, swimming academy enrollments, instructor assignments, and safety logs.",
    features: ["Lane allocation & booking", "Swim academy batch management", "Temperature & maintenance logs"],
    metricLabel: "Batch Capacity",
    metricValue: "100%",
    previewCardTitle: "Aquatics & Swim Academy",
    previewCardDetail: "Morning batch 100% filled • 4 trainers active pool side",
  },
  {
    id: "yoga",
    name: "Yoga",
    icon: Sparkles,
    headline: "Mindful workshop registrations & recurring passes",
    subtext: "Streamline yoga shala memberships, weekend workshop tickets, retreat bookings, and online class links.",
    features: ["Workshop ticketing & passes", "Private 1-on-1 slot booking", "Hybrid online class integration"],
    metricLabel: "Workshop Sales",
    metricValue: "+45%",
    previewCardTitle: "Yoga Shala & Workshop Hub",
    previewCardDetail: "Weekend Pranayama Masterclass • 40 seats filled",
  },
];

export function OptionWheel() {
  const [selectedId, setSelectedId] = useState<string>("owner");
  const activeOption = options.find((o) => o.id === selectedId) || options[0];

  return (
    <section className="relative bg-[#FFFFFF] py-24 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] text-[var(--text)]">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[var(--primary-dark)] bg-[var(--surface-hover)] px-3.5 py-1.5 rounded-full border border-[var(--border)] mb-4">
            Adaptive Platform
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text)]">
            Repsi adapts to the <span className="text-[var(--primary-dark)]">way you work.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[var(--text-muted)]">
            Select a role or business type below to explore customized features and workflows.
          </p>
        </div>

        {/* Horizontal Option Selector / Wheel Pills */}
        <div className="flex flex-wrap justify-center items-center gap-2.5 mb-12">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedId === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedId(opt.id)}
                className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--primary)]/25 scale-105"
                    : "bg-[var(--surface-hover)] text-[var(--text)] hover:bg-[#E5EAE6] border border-[var(--border)]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-[var(--primary-dark)]"}`} />
                <span>{opt.name}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Display Panel */}
        <div className="bg-[#F7F7F5] border border-[var(--border)] rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeOption.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Details */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary-dark)] bg-[var(--primary)]/10 px-3 py-1 rounded-full border border-[var(--primary)]/20">
                  <activeOption.icon className="w-3.5 h-3.5" />
                  <span>{activeOption.name} Mode</span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-extrabold text-[var(--text)] leading-tight">
                  {activeOption.headline}
                </h3>

                <p className="text-base text-[var(--text-muted)] leading-relaxed">
                  {activeOption.subtext}
                </p>

                <div className="space-y-3 pt-2">
                  {activeOption.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[var(--primary)]/15 flex items-center justify-center text-[var(--primary-dark)]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-semibold text-[var(--text)]">{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex items-center gap-6 border-t border-[var(--border)]">
                  <div>
                    <div className="text-xs text-[var(--text-muted)] font-medium">{activeOption.metricLabel}</div>
                    <div className="text-2xl font-black text-[var(--primary-dark)]">{activeOption.metricValue}</div>
                  </div>
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#17191C] text-[var(--primary-foreground)] text-xs font-bold hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition-colors ml-auto">
                    <span>Explore {activeOption.name} Features</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Visual Card */}
              <div className="lg:col-span-6 bg-white border border-[var(--border)] rounded-2xl p-6 shadow-md space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary-dark)]">
                      <activeOption.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[var(--text)]">
                        {activeOption.previewCardTitle}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)]">{activeOption.previewCardDetail}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[var(--primary-dark)] bg-[var(--primary)]/10 px-2.5 py-1 rounded-lg">
                    Active Profile
                  </span>
                </div>

                {/* Mock Data Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#F7F7F5] p-4 rounded-xl border border-[var(--border)]">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)]">System Status</span>
                    <div className="text-sm font-bold text-[var(--text)] mt-1">100% Operational</div>
                  </div>
                  <div className="bg-[#F7F7F5] p-4 rounded-xl border border-[var(--border)]">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)]">Auto Payment Sync</span>
                    <div className="text-sm font-bold text-[var(--primary-dark)] mt-1">Cashfree Gateway</div>
                  </div>
                </div>

                <div className="bg-[var(--surface-hover)] p-4 rounded-xl border border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-[var(--primary-dark)]" />
                    <span className="text-xs font-semibold text-[var(--text)]">
                      Configured for {activeOption.name} workflows
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[var(--primary-dark)]">Ready</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
