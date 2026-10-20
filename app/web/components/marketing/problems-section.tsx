"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import {
  AccordionGallery,
  AccordionGalleryItem,
} from "@/components/ui/accordion-gallery";

export function ProblemsSection() {
  const shouldReduceMotion = useReducedMotion();

  const problemItems: AccordionGalleryItem[] = [
    {
      id: "records",
      number: "01",
      tag: "MEMBER INFORMATION",
      title: "Member information is scattered.",
      descriptionPoints: [
        "Member details are spread across notebooks, spreadsheets and messaging apps.",
        "Important contact information and membership history become difficult to find when you need it most.",
      ],
      summary: "Notebooks, Excel sheets & messaging chats",
      imageSrc: "/images/scattered-records.jpg",
      imageAlt: "Member records, notebook, spreadsheet and phone scattered on a fitness reception desk",
      badgeText: "3+ disconnected apps just to check member status",
      accentColor: "#E25822",
      accentBg: "#FDF1EB",
      accentBorder: "#FACBB7",
    },
    {
      id: "attendance",
      number: "02",
      tag: "DAILY ATTENDANCE",
      title: "Manual attendance tracking takes time.",
      descriptionPoints: [
        "Repetitive check-ins slow down daily front-desk operations during peak rush hours.",
        "Inconsistent paper records make attendance harder to review and reconcile accurately.",
      ],
      summary: "Manual registers cause front-desk queues",
      imageSrc: "/images/manual-attendance.jpg",
      imageAlt: "Front-desk receptionist checking members into a fitness center using a paper register binder",
      badgeText: "Entry bottlenecks during 6–8 PM rush hour",
      accentColor: "#D97706",
      accentBg: "#FFFBEB",
      accentBorder: "#FDE68A",
    },
    {
      id: "payments",
      number: "03",
      tag: "PAYMENT FOLLOW-UP",
      title: "Payments need constant follow-up.",
      descriptionPoints: [
        "Payment statuses are difficult to track across different notebooks, registers and bank records.",
        "Staff spend hours following up on pending payments and verifying unconfirmed receipts.",
      ],
      summary: "Unclear dues & unverified UPI receipts",
      imageSrc: "/images/payment-followup.jpg",
      imageAlt: "Gym reception desk with payment receipts, pending dues register notebook and transaction receipt",
      badgeText: "Unverified UPI receipts & uncollected dues",
      accentColor: "#E11D48",
      accentBg: "#FFF1F2",
      accentBorder: "#FECDD3",
    },
    {
      id: "renewals",
      number: "04",
      tag: "MEMBERSHIP RENEWALS",
      title: "Membership renewals get missed.",
      descriptionPoints: [
        "Expiry dates are difficult to monitor manually on paper calendars and static sheets.",
        "Missed reminders lead to lapsed memberships and lost recurring renewal opportunities.",
      ],
      summary: "Overlooked expiry dates reduce retention",
      imageSrc: "/images/renewal-calendar.jpg",
      imageAlt: "Paper desk calendar with sticky notes highlighting membership renewal deadlines and client files",
      badgeText: "Overdue memberships go unnoticed for weeks",
      accentColor: "#7C3AED",
      accentBg: "#F5F3FF",
      accentBorder: "#DDD6FE",
    },
  ];

  return (
    <section
      id="problems"
      className="relative w-full bg-[#FAF9F6] text-[#191919] pt-12 sm:pt-24 lg:pt-32 pb-14 sm:pb-24 lg:pb-28 border-b border-[#E7E4DE] overflow-hidden"
    >
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 01. SECTION HEADER (NO EYEBROWS)                              */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-14">
          <motion.h2
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="font-heading font-extrabold text-2xl sm:text-4xl md:text-5xl lg:text-[46px] text-[#191919] tracking-tight leading-[1.18] sm:leading-[1.14] mb-3 sm:mb-4"
          >
            Behind every great fitness business, <br className="hidden sm:inline" />
            <span className="text-[#E25822]">there’s a lot to manage.</span>
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-sm sm:text-lg text-[#62666D] leading-relaxed max-w-2xl mx-auto font-normal px-1 sm:px-0"
          >
            Members, attendance, payments, renewals, staff and daily operations can
            quickly become overwhelming across disconnected tools — until{" "}
            <strong className="text-[#191919] font-semibold">Repsi brings your entire fitness business all into one place</strong>.
          </motion.p>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 02. VERTICAL ACCORDION GALLERY                                */}
        {/* ───────────────────────────────────────────────────────────── */}

        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <AccordionGallery items={problemItems} defaultOpenId="records" />
        </motion.div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 03. REPSI ALL-IN-ONE-PLACE TRANSITION BANNER                  */}
        {/* ───────────────────────────────────────────────────────────── */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 sm:mt-12 text-center"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-5 py-3 rounded-2xl bg-white border border-[#FACBB7] shadow-xs text-xs sm:text-sm">
            <span className="font-heading font-extrabold text-[#E25822] tracking-wider uppercase">REPSI</span>
            <span className="text-[#D0CDC7] hidden sm:inline">•</span>
            <span className="text-[#191919] font-medium">
              Eliminating daily friction so your fitness business runs <span className="text-[#E25822] font-bold">all in one place</span>.
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
