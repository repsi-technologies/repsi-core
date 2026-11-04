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
import { constructMetadata, getFaqSchema, getWebsiteSchema, getOrganizationSchema, getSoftwareAppSchema } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Repsi (Rhapsy) — Modern Gym Management Software & Fitness Club OS",
  description:
    "Repsi (also known as Rhapsy) is India's premier gym management platform. Automate member QR check-in, WhatsApp renewal reminders, UPI collections, trainer scheduling, and diet planning. Fast, reliable, and multi-tenant.",
  keywords: [
    "Rhapsy",
    "Rhapsy gym",
    "Rhapsy gym software",
    "Rhapsy app",
    "Rhapsy fitness software",
    "Rhapsy gym management",
    "Repsi",
    "repsi.app",
    "gym management software",
    "best gym management software India",
    "gym management app",
    "fitness center management software",
    "gym CRM software",
    "gym billing and attendance software",
  ],
  path: "/",
});

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#191919] font-sans antialiased selection:bg-[#E25822] selection:text-white">
      <JsonLd data={getWebsiteSchema()} />
      <JsonLd data={getOrganizationSchema()} />
      <JsonLd data={getSoftwareAppSchema()} />
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
