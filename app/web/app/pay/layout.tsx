// Central REPSI checkout (repsi.app/pay): the one place gym owners buy and manage their subscription,
// reached from the web dashboard and from the desktop app through a single-use handoff link.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "REPSI Billing",
  robots: { index: false, follow: false },
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F9F8] text-[var(--text)] flex flex-col">
      <header className="px-4 py-5 sm:px-8 flex items-center justify-between max-w-5xl w-full mx-auto">
        <Link href="/" className="inline-block transition-opacity hover:opacity-80">
          <Image src="/logos/logo-dark.png" alt="REPSI" width={120} height={40} className="h-6 sm:h-7 w-auto object-contain" priority />
        </Link>
        <span className="text-xs text-[var(--text-muted)]">Secure checkout</span>
      </header>
      <main className="flex-1 px-4 pb-12 sm:px-8 max-w-5xl w-full mx-auto">{children}</main>
      <footer className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
        Payments are processed by Cashfree. Need help? <a className="underline" href="mailto:billing@repsi.app">billing@repsi.app</a>
      </footer>
    </div>
  );
}
