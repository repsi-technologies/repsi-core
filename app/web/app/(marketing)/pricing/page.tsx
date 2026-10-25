"use client";

import React from "react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { PricingSection } from "@/components/marketing/pricing-section";
import { BackToTop } from "@/components/ui/back-to-top";

export default function FullPricingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#191919] font-sans antialiased selection:bg-[#E25822] selection:text-white flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* Streamlined, single-job Pricing Page */}
        <PricingSection />
      </main>

      <MarketingFooter />
      <BackToTop />
    </div>
  );
}
