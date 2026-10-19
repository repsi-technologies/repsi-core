"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Phone } from "lucide-react";
import { HalftoneReveal } from "@/components/animations/halftone-reveal";
import { Lanyard } from "@/components/ui/lanyard";

// Scalable vector asset for Halftone Reveal of REPSI in brand orange with mechanical grommet at "I"
const REPSI_ORANGE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="340" viewBox="0 0 1600 340"><rect width="100%" height="100%" fill="%23FAF9F6"/><text x="50%" y="76%" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="280" fill="%23F07858" text-anchor="middle" letter-spacing="-0.035em">REPSI</text><circle cx="1100" cy="54" r="14" fill="%23FAF9F6" stroke="%23F07858" stroke-width="6"/><circle cx="1100" cy="54" r="6" fill="%23FAF9F6"/></svg>`;

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();
  const [hasWebGl, setHasWebGl] = React.useState(true);

  React.useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) setHasWebGl(false);
    } catch {
      setHasWebGl(false);
    }
  }, []);

  return (
    <footer className="relative bg-[#FAF9F6] text-[#191919] border-t border-[#E7E4DE] overflow-hidden pt-16 sm:pt-20 pb-8 sm:pb-10 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 01. UPPER FOOTER: FOUR CLEAN COLUMNS                          */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 sm:pb-16 border-b border-[#E7E4DE]">
          {/* Brand Column (Spans 5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <Link
              href="/"
              className="inline-block group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C76706] rounded-md"
            >
              <Image
                src="/logos/logo-dark.png"
                alt="REPSI"
                width={140}
                height={42}
                className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                priority
              />
            </Link>

            <p className="text-sm text-[#62666D] leading-relaxed max-w-sm font-normal">
              A smarter way to manage your fitness business. Members, attendance, memberships and payments in one place.
            </p>

            {/* Verified Contact Details */}
            <div className="space-y-2 pt-1 text-xs text-[#62666D]">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#C76706] shrink-0" />
                <a
                  href="mailto:contact@repsi.app"
                  className="font-medium hover:text-[#C76706] transition-colors focus:outline-none focus-visible:underline"
                >
                  contact@repsi.app
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C76706] shrink-0" />
                <a
                  href="tel:+918667783321"
                  className="font-medium hover:text-[#C76706] transition-colors focus:outline-none focus-visible:underline"
                >
                  +91 86677 83321
                </a>
              </div>
            </div>

            {/* Verified Social Media Accounts */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://linkedin.com/company/repsi"
                target="_blank"
                rel="noreferrer"
                aria-label="REPSI on LinkedIn"
                className="w-8 h-8 rounded-lg bg-white border border-[#E7E4DE] flex items-center justify-center text-[#62666D] hover:text-[#C76706] hover:border-[#F5D2B0] shadow-2xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C76706]"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </a>
              <a
                href="https://instagram.com/respi.app"
                target="_blank"
                rel="noreferrer"
                aria-label="REPSI on Instagram"
                className="w-8 h-8 rounded-lg bg-white border border-[#E7E4DE] flex items-center justify-center text-[#62666D] hover:text-[#C76706] hover:border-[#F5D2B0] shadow-2xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C76706]"
              >
                <svg
                  className="w-3.5 h-3.5 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://wa.me/918667783321"
                target="_blank"
                rel="noreferrer"
                aria-label="REPSI on WhatsApp"
                className="w-8 h-8 rounded-lg bg-white border border-[#E7E4DE] flex items-center justify-center text-[#62666D] hover:text-[#C76706] hover:border-[#F5D2B0] shadow-2xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C76706]"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.15 4.201 4.293-1.126z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation Columns (Right 7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* 01. PRODUCT */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#191919]">
                Product
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#62666D]">
                <li>
                  <Link
                    href="/features"
                    className="hover:text-[#C76706] transition-colors focus:outline-none focus-visible:underline"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <a
                    href="#why-repsi"
                    className="hover:text-[#C76706] transition-colors focus:outline-none focus-visible:underline"
                  >
                    Why REPSI?
                  </a>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-[#C76706] transition-colors focus:outline-none focus-visible:underline"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/download"
                    className="hover:text-[#C76706] transition-colors focus:outline-none focus-visible:underline"
                  >
                    Download
                  </Link>
                </li>
              </ul>
            </div>

            {/* 02. RESOURCES */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#191919]">
                Resources
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#62666D]">
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-[#C76706] transition-colors focus:outline-none focus-visible:underline"
                  >
                    FAQs
                  </a>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-[#C76706] transition-colors focus:outline-none focus-visible:underline"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    className="hover:text-[#C76706] transition-colors focus:outline-none focus-visible:underline"
                  >
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>

            {/* 03. LEGAL */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#191919]">
                Legal
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#62666D]">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-[#C76706] transition-colors focus:outline-none focus-visible:underline"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-[#C76706] transition-colors focus:outline-none focus-visible:underline"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms#cancellation"
                    className="hover:text-[#C76706] transition-colors focus:outline-none focus-visible:underline"
                  >
                    Cancellation
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 02. OVERSIZED WORDMARK IN ORANGE WITH HALFTONE REVEAL & 3D LANYARD */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div
          className="relative w-full h-[260px] sm:h-[320px] md:h-[380px] lg:h-[440px] xl:h-[480px] overflow-hidden select-none flex items-center justify-center my-4 sm:my-6"
          aria-hidden="true"
        >
          {/* Halftone Reveal Canvas Component from ReactBits */}
          {hasWebGl ? (
            <div className="w-full h-full relative flex items-center justify-center cursor-crosshair">
              <HalftoneReveal
                src={REPSI_ORANGE_SVG}
                mode="duotone"
                shape="dot"
                cellSize={5}
                dotScale={1.12}
                inkColor="#C76706"
                accentColor="#C76706"
                paperColor="#FAF9F6"
                revealRadius={190}
                softness={0.45}
                wander={true}
                clickBurst={true}
                fit="contain"
                className="w-full h-full"
              />
            </div>
          ) : (
            <span className="font-heading font-black text-[clamp(6.5rem,27vw,24rem)] leading-[0.72] tracking-[-0.04em] text-[#C76706] select-none text-center whitespace-nowrap pointer-events-none drop-shadow-xs">
              REPSI
            </span>
          )}

          {/* Interactive 3D Lanyard Pass physically connected into the "I" on REPSI covering the whole width */}
          {hasWebGl && (
            <div
              className="absolute inset-0 w-full h-full z-20 pointer-events-auto"
              title="Interactive 3D REPSI VIP Badge: Drag, swing or click to flip!"
            >
              <Lanyard
                frontImage="/images/lanyard-badge-front.svg"
                backImage="/images/lanyard-badge-back.svg"
                imageFit="contain"
                cardColor="#101217"
                finish="holographic"
                orientation="portrait"
                anchor={0.6875}
                size={0.36}
                strapColor="#C76706"
                strapLength={0.34}
                strapWidth={0.7}
                metal="silver"
                gravity={0.9}
                damping={0.55}
                elasticity={0.6}
                breeze={0.4}
                interactive={true}
                className="w-full h-full cursor-grab active:cursor-grabbing"
              />
            </div>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 03. THIN BOTTOM BAR (SUBTLE & RESTRAINED)                     */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="pt-5 border-t border-[#E7E4DE] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#62666D]">
          <p>© {currentYear} REPSI Technologies. All rights reserved.</p>

          <p className="font-mono font-semibold tracking-wider uppercase text-[10px] sm:text-[11px] text-[#858890]">
            BUILT FOR BETTER OPERATIONS.
          </p>

          <div className="flex items-center gap-5">
            <Link
              href="/privacy"
              className="hover:text-[#C76706] transition-colors focus:outline-none focus-visible:underline"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-[#C76706] transition-colors focus:outline-none focus-visible:underline"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
