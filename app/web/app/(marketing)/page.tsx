import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { ReferenceHero } from "@/components/marketing/reference-hero";
import { ProblemsSection } from "@/components/marketing/problems-section";
import { FlexCarouselFeatures } from "@/components/marketing/flex-carousel-features";
import { PricingPreviewSection } from "@/components/marketing/pricing-preview-section";
import { HomeFaqSection } from "@/components/marketing/home-faq-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { BackToTop } from "@/components/ui/back-to-top";
import { JsonLd } from "@/components/seo/json-ld";
import { HOME_FAQS } from "@/lib/home-faq";
import { constructMetadata, getFaqSchema, getWebsiteSchema } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Repsi (Rhapsy) — Gym Management Software & Fitness Club Operating System",
  description:
    "Repsi (also known as Rhapsy) is India's leading gym management software for gyms, fitness clubs, studios, and personal trainers. Manage members, QR attendance, automated WhatsApp renewals, UPI payments, workouts and diet plans. Plans from ₹199/month.",
  keywords: [
    "Rhapsy",
    "Rhapsy gym",
    "Rhapsy gym software",
    "Rhapsy app",
    "Rhapsy fitness software",
    "Repsi",
    "best gym management software",
    "gym management app",
    "fitness center management software",
    "personal trainer management software",
    "gym CRM software India",
    "gym billing and attendance software",
  ],
  path: "/",
});

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#191919] font-sans antialiased selection:bg-[#E25822] selection:text-white">
      <JsonLd data={getWebsiteSchema()} />
      <JsonLd data={getFaqSchema(HOME_FAQS)} />

      <MarketingNav />
      <main>
        {/* Hero — "You run your fitness business, we handle the rest." */}
        <ReferenceHero />
        {/* Problems in fitness management */}
        <ProblemsSection />
        {/* All REPSI features */}
        <FlexCarouselFeatures />
        {/* Pricing preview → /pricing */}
        <PricingPreviewSection />
        {/* Factual Q&A for searchers and answer engines (mirrored in FAQPage JSON-LD) */}
        <HomeFaqSection />
        <FinalCtaSection />
      </main>
      <MarketingFooter />
      <BackToTop />
    </div>
  );
}
