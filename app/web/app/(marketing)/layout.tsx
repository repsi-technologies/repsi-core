import type { Metadata } from "next";
import { constructMetadata, getOrganizationSchema, getSoftwareAppSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { WhatsAppCta } from "@/components/marketing/whatsapp-cta";
import { ReferralTracker } from "@/components/marketing/referral-tracker";

// Section-wide defaults only. No canonical here: a canonical set in a layout is inherited by every
// child page that doesn't override it, which would point all of them at the homepage.
const { alternates: _omitCanonical, ...marketingDefaults } = constructMetadata({
  title: "Repsi — Gym Management Software",
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
void _omitCanonical;

export const metadata: Metadata = {
  ...marketingDefaults,
  title: { default: "Repsi — Gym Management Software", template: "%s | Repsi" },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgSchema = getOrganizationSchema();
  const appSchema = getSoftwareAppSchema();

  return (
    <div className="marketing-root min-h-screen font-sans antialiased">
      <ReferralTracker />
      <JsonLd data={orgSchema} />
      <JsonLd data={appSchema} />
      {children}
      <WhatsAppCta />
    </div>
  );
}
