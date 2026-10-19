import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | REPSI Fitness Business Management",
  description: "Read how REPSI protects your fitness business and member data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#17191C] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B6F76] hover:text-[#E25822] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white rounded-3xl border border-[#E4E2DC] p-8 sm:p-12 shadow-xs space-y-8">
          <div className="border-b border-[#E4E2DC] pb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#E25822] bg-[#FDF1EB] mb-3">
              <Shield className="w-3.5 h-3.5 text-[#E25822]" />
              Data Security & Privacy
            </span>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#17191C]">
              Privacy Policy
            </h1>
            <p className="text-xs text-[#6B6F76] mt-2">
              Last updated: October 2026 • REPSI Technologies Pvt. Ltd.
            </p>
          </div>

          <div className="space-y-6 text-sm text-[#4A4E54] leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-heading font-bold text-lg text-[#17191C]">
                1. Overview
              </h2>
              <p>
                REPSI (“we,” “our,” or “us”) provides gym and fitness business management software. We take the privacy and confidentiality of our gym partners, staff accounts, and member data with the highest level of responsibility and security standards.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-heading font-bold text-lg text-[#17191C]">
                2. Information We Collect
              </h2>
              <p>
                When you set up a workspace on REPSI, we collect:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Business profile details: facility name, address, contact phone, and staff credentials.</li>
                <li>Member rosters: names, contact phone numbers, plan tiers, and check-in timestamps.</li>
                <li>Billing records: membership payments, transaction IDs, and settlement logs processed via secure gateway partners.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-heading font-bold text-lg text-[#17191C]">
                3. How We Use Member & Business Data
              </h2>
              <p>
                We use your data solely to operate your fitness facility workspace: authenticating check-ins at turnstiles, issuing digital WhatsApp passes, sending renewal reminders, and generating revenue analytics. We do not sell or monetize your member databases to third parties.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-heading font-bold text-lg text-[#17191C]">
                4. Data Ownership & Export
              </h2>
              <p>
                You retain complete, exclusive ownership of all member rosters and transaction histories entered into your REPSI workspace. You can export complete CSV or Excel backups at any time directly from your settings panel.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-heading font-bold text-lg text-[#17191C]">
                5. Contacting Us
              </h2>
              <p>
                If you have questions about our data practices or wish to request data deletion, please contact our data officer at{" "}
                <a href="mailto:support@repsi.app" className="text-[#E25822] font-semibold underline">
                  support@repsi.app
                </a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
