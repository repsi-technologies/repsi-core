import type { Metadata } from "next";
import { constructMetadata, getOrganizationSchema, getSoftwareAppSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { WhatsAppCta } from "@/components/marketing/whatsapp-cta";
import { ReferralTracker } from "@/components/marketing/referral-tracker";
import { PageImageLoadingScreen } from "@/components/ui/page-image-loading-screen";

export const metadata: Metadata = constructMetadata({
  title: "Repsi",
  description:
    "Run your gym, studio, pool or yoga business with Repsi. Manage members, payments, attendance, CRM, trainers, workouts, finances and more from one platform.",
  keywords: [
    "gym management software",
    "gym management software India",
    "gym management system",
    "gym software",
    "gym management app",
    "fitness management software",
    "gym CRM software",
    "gym billing software",
    "gym membership management software",
  ],
  path: "/",
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgSchema = getOrganizationSchema();
  const appSchema = getSoftwareAppSchema();

  return (
    <div className="min-h-screen font-sans antialiased">
      <PageImageLoadingScreen />
      <ReferralTracker />
      <JsonLd data={orgSchema} />
      <JsonLd data={appSchema} />
      {children}
      <WhatsAppCta />
    </div>
  );
}
