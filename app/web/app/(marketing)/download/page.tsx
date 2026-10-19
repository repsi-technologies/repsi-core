"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Smartphone,
  Monitor,
  Globe,
  Download,
  Apple,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  WifiOff,
  RefreshCw,
  QrCode,
  Layers,
  Sparkles,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

type PlatformCategory = "all" | "mobile" | "desktop" | "web";

export default function DownloadPage() {
  const [selectedCategory, setSelectedCategory] = useState<PlatformCategory>("all");
  const [downloadModal, setDownloadModal] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const platforms = [
    {
      id: "android",
      category: "mobile",
      name: "Android App",
      platform: "Android 8.0+",
      version: "v2.4.0 (Latest)",
      badge: "Google Play Store",
      icon: (
        <svg className="w-8 h-8 fill-current text-[#3DDC84]" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.105-.1818.043-.4146-.139-.5196-.182-.105-.415-.043-.52.139l-2.024 3.506c-1.464-.666-3.111-1.042-4.887-1.042s-3.423.376-4.887 1.042l-2.024-3.506c-.105-.182-.338-.244-.52-.139-.182.105-.244.3378-.139.5196l1.996 3.4572C3.12 10.923 1.11 14.186 1 18h22c-.11-3.814-2.12-7.077-5.118-8.6786" />
        </svg>
      ),
      description: "Dedicated mobile experience for gym owners, front-desk staff, and personal trainers on any Android phone or tablet.",
      highlights: [
        "1-second QR camera attendance check-in",
        "Instant push notifications for dues & renewals",
        "WhatsApp digital receipt dispatch",
        "Trainer client schedules & workout logging",
      ],
      primaryAction: {
        label: "Get on Google Play",
        href: "https://play.google.com/store/apps",
        type: "store",
      },
      secondaryAction: {
        label: "Download Direct APK (68 MB)",
        href: "#download-apk",
        type: "direct",
      },
    },
    {
      id: "ios",
      category: "mobile",
      name: "iOS & iPadOS",
      platform: "iOS 15.0+ / iPadOS",
      version: "v2.4.0 (Latest)",
      badge: "Apple App Store",
      icon: <Apple className="w-8 h-8 text-[#191919]" />,
      description: "Fluid native iOS application optimized for iPhone and reception iPads with biometric FaceID sign-in.",
      highlights: [
        "Apple Wallet digital gym pass integration",
        "Front-desk iPad kiosk & self-check-in station",
        "FaceID / TouchID biometric security",
        "Offline check-in sync when reception Wi-Fi drops",
      ],
      primaryAction: {
        label: "Download on App Store",
        href: "https://apps.apple.com/app",
        type: "store",
      },
      secondaryAction: {
        label: "View in TestFlight",
        href: "#testflight",
        type: "direct",
      },
    },
    {
      id: "windows",
      category: "desktop",
      name: "Windows Desktop",
      platform: "Windows 10 / 11 (64-bit)",
      version: "v2.4.0 (Setup & Portable)",
      badge: "Desktop Reception",
      icon: (
        <svg className="w-8 h-8 fill-current text-[#0078D4]" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.901-1.8" />
        </svg>
      ),
      description: "Built for reception desks and heavy front-desk operations. Directly connects to turnstile gates, biometric readers, and thermal receipt printers.",
      highlights: [
        "USB & LAN turnstile gate controller integration",
        "ESC/POS 58mm & 80mm thermal receipt printing",
        "Full offline SQLite database with auto-cloud sync",
        "Multi-monitor reception & member photo preview",
      ],
      primaryAction: {
        label: "Download for Windows (.exe)",
        href: "#download-windows-exe",
        type: "installer",
      },
      secondaryAction: {
        label: "Portable Edition (.zip)",
        href: "#download-windows-zip",
        type: "direct",
      },
    },
    {
      id: "mac",
      category: "desktop",
      name: "macOS",
      platform: "macOS 12.0+ (Universal)",
      version: "v2.4.0 (Apple Silicon & Intel)",
      badge: "Universal Binary",
      icon: <Apple className="w-8 h-8 text-[#191919]" />,
      description: "Blazing fast native desktop app for Mac computers. Designed for MacBook front desks and gym owner workstations.",
      highlights: [
        "Native Apple Silicon (M1/M2/M3/M4) performance",
        "Full keyboard shortcuts for rapid front-desk entry",
        "Multi-window dashboard & analytics view",
        "Automatic background updates",
      ],
      primaryAction: {
        label: "Download for Apple Silicon (.dmg)",
        href: "#download-mac-arm",
        type: "installer",
      },
      secondaryAction: {
        label: "Download for Intel Mac (.dmg)",
        href: "#download-mac-intel",
        type: "direct",
      },
    },
    {
      id: "linux",
      category: "desktop",
      name: "Linux Desktop",
      platform: "Ubuntu, Debian, Fedora, Arch",
      version: "v2.4.0 (.deb & AppImage)",
      badge: "Open Platform",
      icon: (
        <svg className="w-8 h-8 fill-current text-[#E95420]" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.53 1.03 1.53 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
      ),
      description: "Ideal for low-power kiosk hardware, Linux mini-PCs, Raspberry Pi 4/5, and embedded turnstile controllers.",
      highlights: [
        "Debian package (.deb) for easy apt installation",
        "Standalone AppImage — runs on any Linux distro",
        "GPIO & serial port scanner interface support",
        "Lightweight footprint (under 95 MB RAM)",
      ],
      primaryAction: {
        label: "Download .deb Package (64-bit)",
        href: "#download-linux-deb",
        type: "installer",
      },
      secondaryAction: {
        label: "Download .AppImage",
        href: "#download-linux-appimage",
        type: "direct",
      },
    },
    {
      id: "web",
      category: "web",
      name: "Web Application",
      platform: "Chrome, Edge, Safari, Firefox",
      version: "Cloud v2.4 (Always Updated)",
      badge: "Zero Install",
      icon: <Globe className="w-8 h-8 text-[#E25822]" />,
      description: "Access your entire gym management workspace instantly from any browser. No downloads, installations, or manual updates required.",
      highlights: [
        "100% cloud-hosted with automatic encrypted backups",
        "PWA installable directly to your desktop or Chromebook",
        "Instant access on any computer or mobile device",
        "Real-time synchronized data with all native apps",
      ],
      primaryAction: {
        label: "Launch Web Dashboard",
        href: "/login",
        type: "web",
      },
      secondaryAction: {
        label: "Create Free Gym Account",
        href: "/signup",
        type: "signup",
      },
    },
  ];

  const filteredPlatforms =
    selectedCategory === "all"
      ? platforms
      : platforms.filter((p) => p.category === selectedCategory);

  const handleDownloadClick = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    setDownloadModal(name);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#191919] font-sans antialiased selection:bg-[#E25822] selection:text-white flex flex-col">
      <MarketingNav />

      <main className="flex-1 pt-12 sm:pt-16 pb-20">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 01. HERO BANNER (NO EYEBROW)                                  */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-5 mb-12 sm:mb-16">
          <motion.h1
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="font-heading font-extrabold text-3xl sm:text-5xl md:text-6xl text-[#191919] tracking-tight leading-[1.12]"
          >
            Download REPSI on <br className="hidden sm:inline" />
            <span className="text-[#E25822]">every device.</span>
          </motion.h1>

          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-base sm:text-lg text-[#62666D] max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Manage members, verify daily attendance, dispatch payment receipts, and review business analytics from your mobile phone, reception desk, or web browser.
          </motion.p>

          {/* Key Value Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-2 text-xs sm:text-sm text-[#62666D] font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#E25822]" />
              Real-time Cloud Sync
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#E25822]" />
              Offline Reception Mode
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#E25822]" />
              14-Day Free Trial Included
            </span>
          </div>

          {/* Category Filter Tabs */}
          <div className="pt-6 flex items-center justify-center gap-2">
            <div className="inline-flex p-1.5 rounded-full bg-white border border-[#E7E4DE] shadow-xs">
              {(
                [
                  { id: "all", label: "All Platforms" },
                  { id: "mobile", label: "Mobile (Android / iOS)" },
                  { id: "desktop", label: "Desktop (Win / Mac / Linux)" },
                  { id: "web", label: "Web App" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    selectedCategory === tab.id
                      ? "bg-[#E25822] text-white shadow-xs"
                      : "text-[#62666D] hover:text-[#191919]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 02. PLATFORMS GRID (RESPONSIVE 2-3 COLS)                      */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch">
            {filteredPlatforms.map((p) => (
              <div
                key={p.id}
                className="rounded-[28px] sm:rounded-[32px] bg-white border border-[#E7E4DE] p-7 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-[#FACBB7] transition-all duration-200"
              >
                <div>
                  {/* Card Header: Icon & Badge */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#FAF9F6] border border-[#E7E4DE] flex items-center justify-center shadow-2xs">
                      {p.icon}
                    </div>
                    <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-[#FDF1EB] text-[#E25822] border border-[#FACBB7]">
                      {p.badge}
                    </span>
                  </div>

                  {/* Title & Compatibility */}
                  <div className="mb-3">
                    <h3 className="font-heading font-extrabold text-2xl text-[#191919] tracking-tight">
                      {p.name}
                    </h3>
                    <div className="text-xs font-mono text-[#858890] mt-0.5">
                      {p.platform} · {p.version}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-[#62666D] leading-relaxed mb-6 font-normal min-h-[44px]">
                    {p.description}
                  </p>

                  {/* Capabilities List */}
                  <div className="space-y-2.5 mb-8 pb-6 border-b border-[#F0EDE7]">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#191919]">
                      Key Capabilities:
                    </div>
                    {p.highlights.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-start gap-2 text-xs sm:text-[13px] text-[#191919]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E25822] shrink-0 mt-0.5" />
                        <span className="leading-snug">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download / Action Buttons */}
                <div className="space-y-2.5 pt-1">
                  {p.primaryAction.type === "web" ? (
                    <Link
                      href={p.primaryAction.href}
                      className="group w-full inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-[#E25822] hover:bg-[#C94715] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#E25822]/30 transition-all duration-200 active:scale-95"
                    >
                      <span>{p.primaryAction.label}</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleDownloadClick(e, p.name)}
                      className="group w-full inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-[#E25822] hover:bg-[#C94715] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#E25822]/30 transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{p.primaryAction.label}</span>
                    </button>
                  )}

                  {p.secondaryAction.type === "signup" ? (
                    <Link
                      href={p.secondaryAction.href}
                      className="w-full inline-flex items-center justify-center h-10 px-4 rounded-full bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#E7E4DE] text-[#191919] text-xs font-semibold transition-all active:scale-95"
                    >
                      {p.secondaryAction.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleDownloadClick(e, `${p.name} (Alternate)`)}
                      className="w-full inline-flex items-center justify-center h-10 px-4 rounded-full bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#E7E4DE] text-[#191919] text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                    >
                      {p.secondaryAction.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 03. SYSTEM ARCHITECTURE & OFFLINE-FIRST FEATURES              */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="rounded-[32px] sm:rounded-[36px] bg-white border border-[#E7E4DE] p-8 sm:p-12 shadow-sm">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-[#191919] tracking-tight">
                Built for reception resilience.
              </h2>
              <p className="text-xs sm:text-sm text-[#62666D] mt-2">
                Never stop checking members in, even when the internet goes down.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="space-y-2 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-[#FDF1EB] border border-[#FACBB7] flex items-center justify-center text-[#E25822] mx-auto sm:mx-0">
                  <WifiOff className="w-5 h-5" />
                </div>
                <h4 className="font-heading font-bold text-base text-[#191919]">
                  Offline Check-in Queue
                </h4>
                <p className="text-xs text-[#62666D] leading-relaxed">
                  Desktop apps automatically cache verified passes locally. Check-ins work with zero latency without active Wi-Fi.
                </p>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-[#FDF1EB] border border-[#FACBB7] flex items-center justify-center text-[#E25822] mx-auto sm:mx-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <h4 className="font-heading font-bold text-base text-[#191919]">
                  Instant Cloud Reconciliation
                </h4>
                <p className="text-xs text-[#62666D] leading-relaxed">
                  As soon as connection is restored, all queued attendance logs, receipts, and notes automatically sync with the cloud.
                </p>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-[#FDF1EB] border border-[#FACBB7] flex items-center justify-center text-[#E25822] mx-auto sm:mx-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-heading font-bold text-base text-[#191919]">
                  Hardware Turnstile Support
                </h4>
                <p className="text-xs text-[#62666D] leading-relaxed">
                  Native relay drivers for barcode tripods, flap barriers, and RFID turnstile gates on Windows and Linux workstations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 04. FAQ SECTION                                               */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="text-center mb-8">
            <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#191919]">
              Download & installation FAQs.
            </h3>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Are the mobile apps included in the subscription?",
                a: "Yes! Member and Trainer mobile apps on iOS and Android are included with the Growth plan and above. There are no additional per-device licensing fees.",
              },
              {
                q: "Can I run the Windows app and the Web app at the same time?",
                a: "Absolutely. You can run the Windows desktop application on your front-desk reception computer while gym owners and trainers access REPSI from their web browsers or phones simultaneously in real time.",
              },
              {
                q: "How does the offline check-in feature work?",
                a: "The Windows and Linux desktop applications maintain an encrypted local copy of active member barcodes and passes. If your internet connection drops, members can still scan in seamlessly. All attendance logs are safely uploaded once the connection returns.",
              },
              {
                q: "Do you provide automatic updates?",
                a: "Yes. Desktop apps automatically check for security and feature updates on startup. Mobile apps update seamlessly through the Google Play Store and Apple App Store.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#E7E4DE] p-5 shadow-2xs"
              >
                <h4 className="font-heading font-bold text-sm sm:text-base text-[#191919] mb-1.5">
                  {faq.q}
                </h4>
                <p className="text-xs sm:text-sm text-[#62666D] leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 05. DOWNLOAD TRIGGER MODAL / TOAST                            */}
        {/* ───────────────────────────────────────────────────────────── */}
        {downloadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E7E4DE] space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FDF1EB] border border-[#FACBB7] text-[#E25822] flex items-center justify-center mx-auto">
                <Download className="w-6 h-6 animate-bounce" />
              </div>

              <div>
                <h3 className="font-heading font-bold text-xl text-[#191919]">
                  Starting download for {downloadModal}
                </h3>
                <p className="text-xs sm:text-sm text-[#62666D] mt-1.5 leading-relaxed">
                  Your installer is downloading. Need an account? You can get started with a 14-day free trial in under 2 minutes.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/signup"
                  onClick={() => setDownloadModal(null)}
                  className="w-full h-11 rounded-full bg-[#E25822] hover:bg-[#C94715] text-white text-xs sm:text-sm font-semibold flex items-center justify-center transition-all shadow-sm"
                >
                  Create Free Account
                </Link>
                <button
                  type="button"
                  onClick={() => setDownloadModal(null)}
                  className="w-full h-10 rounded-full bg-[#FAF9F6] hover:bg-[#F5F2ED] text-[#191919] text-xs font-semibold transition-all border border-[#E7E4DE] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <MarketingFooter />
    </div>
  );
}
