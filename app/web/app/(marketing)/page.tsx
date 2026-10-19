"use client";

import { MarketingNav } from "@/components/marketing/marketing-nav";
import { ReferenceHero } from "@/components/marketing/reference-hero";
import { ProblemsSection } from "@/components/marketing/problems-section";
import { FlexCarouselFeatures } from "@/components/marketing/flex-carousel-features";
import { PricingPreviewSection } from "@/components/marketing/pricing-preview-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { BackToTop } from "@/components/ui/back-to-top";

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#191919] font-sans antialiased selection:bg-[#E25822] selection:text-white">
      {/* 00. GLOBAL MARKETING NAVIGATION */}
      <MarketingNav />

      {/* 01. PAGE 1: HERO — "You run your fitness business, we handle the rest." */}
      <ReferenceHero />

      {/* 02. PAGE 2: PROBLEMS IN FITNESS MANAGEMENT (VERTICAL ACCORDION GALLERY) */}
      <ProblemsSection />

      {/* 03. PAGE 3: FLEX CAROUSEL — ALL REPSI FEATURES */}
      <FlexCarouselFeatures />

      {/* 04. PAGE 4: PRICING PREVIEW & REDIRECT TO /pricing */}
      <PricingPreviewSection />

      {/* 05. FINAL CTA — "Ready to simplify your daily operations?" in primary color */}
      <FinalCtaSection />

      {/* 06. PAGE 6: FOOTER */}
      <MarketingFooter />

      {/* Floating Back to Top Button */}
      <BackToTop />
    </div>
  );
}
