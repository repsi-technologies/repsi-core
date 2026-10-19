import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service | REPSI Fitness Business Management",
  description: "Terms and conditions of using the REPSI fitness management platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#17191C] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B6F76] hover:text-[#C76706] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white rounded-3xl border border-[#E4E2DC] p-8 sm:p-12 shadow-xs space-y-8">
          <div className="border-b border-[#E4E2DC] pb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#C76706] bg-[#FDF5ED] mb-3">
              <FileText className="w-3.5 h-3.5 text-[#C76706]" />
              Terms of Agreement
            </span>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#17191C]">
              Terms of Service & Cancellation Policy
            </h1>
            <p className="text-xs text-[#6B6F76] mt-2">
              Effective Date: October 2026 • REPSI Technologies Pvt. Ltd.
            </p>
          </div>

          <div className="space-y-6 text-sm text-[#4A4E54] leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-heading font-bold text-lg text-[#17191C]">
                1. Acceptance of Terms
              </h2>
              <p>
                By signing up for an account or using the REPSI fitness workspace, you agree to these Terms of Service. If you are entering into this agreement on behalf of a business, gym, or fitness studio, you represent that you have the authority to bind such entity.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-heading font-bold text-lg text-[#17191C]">
                2. Subscription & Free Trial
              </h2>
              <p>
                REPSI provides a 14-day free trial on new accounts with no payment card required. Following the trial, continued access to write operations and active turnstile gate synchronization requires an active subscription to either Starter or Growth tier.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-heading font-bold text-lg text-[#17191C]">
                3. Cancellation & Refund Policy
              </h2>
              <p>
                You may cancel your monthly or annual subscription at any time directly through your workspace settings with zero cancellation fee. Upon cancellation, your access remains active until the end of your prepaid billing period. We do not provide prorated refunds for partial months of service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-heading font-bold text-lg text-[#17191C]">
                4. Availability & Support
              </h2>
              <p>
                We strive for 99.9% platform uptime for all cloud gate controllers and database sync. Official customer support is available via WhatsApp and email at{" "}
                <a href="mailto:support@repsi.app" className="text-[#C76706] font-semibold underline">
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
