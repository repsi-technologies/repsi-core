"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown } from "lucide-react";
import { navLabelKey, useTranslation } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";

export function MarketingNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const tr = (label: string) => t(navLabelKey(label), label);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      title: "Product",
      links: [
        { label: "Platform Overview", href: "/#why-repsi" },
        { label: "Members Management", href: "/features" },
        { label: "Attendance & Access", href: "/features" },
        { label: "Payments & Billing", href: "/features" },
        { label: "Trainers & PT", href: "/features" },
        { label: "Analytics & P&L", href: "/features" },
      ],
    },
    {
      title: "Features",
      href: "/features",
    },
    {
      title: "Solutions",
      links: [
        { label: "Gyms & Health Clubs", href: "/solutions/gyms" },
        { label: "Boutique Fitness Studios", href: "/solutions/studios" },
        { label: "Yoga & Pilates", href: "/solutions/yoga" },
        { label: "Swimming Pools", href: "/solutions/pools" },
        { label: "Personal Trainers", href: "/solutions/personal-trainers" },
      ],
    },
    {
      title: "Pricing",
      href: "/pricing",
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "/docs" },
        { label: "Download App", href: "/download" },
        { label: "Help Center", href: "/help" },
        { label: "Blog", href: "/blog" },
        { label: "Changelog", href: "/changelog" },
      ],
    },
  ];

  // Track window scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll and handle Escape key when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const logoSrc = "/logos/logo-dark.png";
  const defaultLinkClass =
    "text-[#191919] hover:text-[#E25822] transition-colors drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]";
  const dropdownBg = "bg-white/98 backdrop-blur-xl border-[#E7E4DE] shadow-xl";
  const dropdownItemText = "text-[#62666D] hover:text-[#191919] hover:bg-[#F5F2ED]";

  // Navbar background style:
  // Mobile (<md): fixed top bar with backdrop blur and border when scrolled
  // Desktop (md+): transparent on homepage hero, clean solid on subpages, never sticky
  const navBgClass = isHome
    ? scrolled
      ? "bg-white/95 backdrop-blur-md border-b border-[#E7E4DE] shadow-xs md:bg-transparent md:backdrop-blur-none md:border-transparent md:shadow-none"
      : "bg-white/80 backdrop-blur-md border-b border-[#E7E4DE]/60 md:bg-transparent md:backdrop-blur-none md:border-transparent md:shadow-none"
    : "bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E7E4DE] md:bg-[#FAF9F6] md:backdrop-blur-none md:shadow-none";

  // Position:
  // Mobile (<md): fixed top-0 (pinned to viewport as requested)
  // Desktop (md+): not sticky, scrolls naturally away with page (absolute on home, relative on subpages)
  const headerPositionClass = isHome
    ? "fixed md:absolute top-0 left-0 right-0 z-40 w-full"
    : "sticky md:relative top-0 left-0 right-0 z-40 w-full";

  return (
    <>
      <header
        className={`${headerPositionClass} transition-colors duration-200 ${navBgClass}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 flex h-[64px] sm:h-[76px] items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group shrink-0">
            <Image
              src={logoSrc}
              alt="REPSI"
              width={160}
              height={50}
              className="h-7 sm:h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navItems.map((item) => {
              return item.href ? (
                <Link
                  key={tr(item.title)}
                  href={item.href}
                  className={`whitespace-nowrap text-sm font-semibold transition-colors py-2 px-1 ${defaultLinkClass}`}
                >
                  {tr(item.title)}
                </Link>
              ) : (
                <div key={tr(item.title)} className="relative group">
                  <button
                    className={`flex items-center gap-1 whitespace-nowrap text-sm font-semibold transition-colors py-2 cursor-pointer ${defaultLinkClass}`}
                  >
                    <span>{tr(item.title)}</span>
                    <ChevronDown className="w-3.5 h-3.5 transition-all duration-200 group-hover:translate-y-0.5 opacity-60 group-hover:opacity-100" />
                  </button>

                  {/* Dropdown */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 -translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 ease-out z-50">
                    <div className={`rounded-xl border p-2 min-w-[210px] ${dropdownBg}`}>
                      {item.links?.map((link) => (
                        <Link
                          key={tr(link.label)}
                          href={link.href}
                          className={`block px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${dropdownItemText}`}
                        >
                          {tr(link.label)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Desktop Auth & CTA */}
          <div className="hidden sm:flex items-center gap-4 lg:gap-5">
            <LanguageSelector showLabel={false} />
            <Link
              href="/login"
              className={`text-sm font-semibold py-2 transition-colors ${
                isHome
                  ? "text-[#191919] hover:text-[#E25822] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
                  : "text-[#191919] hover:text-[#E25822]"
              }`}
            >
              {t("auth.signIn", "Sign in")}
            </Link>

            <Link
              href="/signup"
              className="group inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-[#E25822] hover:bg-[#C94715] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm shadow-[#E25822]/25 hover:shadow-md active:scale-95"
            >
              <span>{t("marketing.startFree", "Start for Free")} →</span>
            </Link>
          </div>

          {/* Mobile menu hamburger button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#191919] hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Portaled to document.body so backdrop-filter can never trap it) */}
      {mounted &&
        mobileOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] lg:hidden">
            {/* Backdrop: covers entire viewport, tap to dismiss */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer: Vertically Full & Horizontally Half screen (w-3/5 xs:w-1/2 min 240px) */}
            <div
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              className="fixed inset-y-0 right-0 w-3/5 xs:w-1/2 min-w-[240px] max-w-[320px] h-[100dvh] bg-white border-l border-[#E7E4DE] shadow-2xl flex flex-col justify-between overflow-hidden text-[#191919] animate-in slide-in-from-right duration-200"
            >
              {/* Header with Close Button */}
              <div className="flex items-center justify-between h-[64px] sm:h-[72px] px-5 border-b border-[#E7E4DE] shrink-0 bg-[#FAF9F6]">
                <span className="font-heading font-extrabold text-sm tracking-wider text-[#191919]">
                  Menu
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg text-[#191919] hover:bg-black/5 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items (Scrollable) */}
              <div className="space-y-4 px-5 py-4 flex-1 overflow-y-auto">
                {navItems.map((item) => (
                  <div key={tr(item.title)} className="space-y-1.5">
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="block text-sm font-bold text-[#191919] hover:text-[#E25822] py-1 transition-colors"
                      >
                        {tr(item.title)}
                      </Link>
                    ) : (
                      <>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#858890] pt-1">
                          {tr(item.title)}
                        </h4>
                        <div className="flex flex-col gap-1 pl-1.5 border-l-2 border-[#E7E4DE]/60 ml-0.5">
                          {item.links?.map((link) => (
                            <Link
                              key={tr(link.label)}
                              href={link.href}
                              onClick={() => setMobileOpen(false)}
                              className="block py-1 text-xs font-medium text-[#62666D] hover:text-[#E25822] transition-colors truncate"
                            >
                              {tr(link.label)}
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="p-4 sm:p-5 pt-3 border-t border-[#E7E4DE] flex flex-col gap-2 shrink-0 bg-[#FAF9F6]">
                <LanguageSelector className="self-center" />
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full min-h-[40px] flex items-center justify-center py-2 text-xs font-bold border border-[#E7E4DE] bg-white rounded-full transition-colors hover:bg-[#FAF9F6] text-[#191919] shadow-2xs"
                >
                  {t("auth.signIn", "Sign in")}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="w-full min-h-[40px] flex items-center justify-center py-2 text-xs font-bold bg-[#E25822] hover:bg-[#C94715] text-white rounded-full shadow-sm shadow-[#E25822]/30 transition-all active:scale-95"
                >
                  {t("marketing.startFree", "Start for Free")} →
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
