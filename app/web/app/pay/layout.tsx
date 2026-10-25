// Central REPSI checkout (repsi.app/pay): the one place gym owners buy and manage their subscription,
// reached from the web dashboard and from the desktop app through a single-use handoff link.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "REPSI Billing",
  robots: { index: false, follow: false },
};

import { Lock } from "lucide-react";

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[var(--text)] flex flex-col antialiased">
      <header className="px-4 py-4 sm:px-8 flex items-center justify-between max-w-7xl w-full mx-auto">
        <Link href="/" className="inline-block transition-opacity hover:opacity-80">
          <Image src="/logos/logo-dark.png" alt="REPSI" width={120} height={40} className="h-6 sm:h-7 w-auto object-contain" priority />
        </Link>
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 border border-emerald-200">
            <Lock className="size-3" aria-hidden /> 256-bit SSL Secure Checkout
          </span>
        </div>
      </header>
      <main className="flex-1 px-4 pb-20 sm:px-8 max-w-7xl w-full mx-auto">{children}</main>
      <footer className="px-4 py-6 text-xs text-[var(--text-muted)] border-t border-[var(--border)] bg-white/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>
            Cancel anytime · No long-term lock-in · Payments processed securely via <strong>Cashfree</strong>
          </p>
          <p>
            Need help or corporate invoicing?{" "}
            <a className="underline hover:text-[var(--text)] font-medium" href="mailto:billing@repsi.app">
              billing@repsi.app
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
