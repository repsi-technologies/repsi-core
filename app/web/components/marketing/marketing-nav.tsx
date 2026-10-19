"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowRight, ChevronDown } from "lucide-react";

export function MarketingNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Transparent overlay on homepage so hero reception image shows through; standard relative on subpages
  const headerClass = isHome
    ? `absolute top-0 left-0 right-0 z-50 w-full ${
        mobileOpen
          ? "bg-white/95 backdrop-blur-md border-b border-[#E7E4DE]"
          : "bg-transparent border-b border-transparent"
      } text-[#191919] transition-colors`
    : "relative z-50 w-full bg-[#FAF9F6] border-b border-[#E7E4DE] text-[#191919] transition-colors";

  const logoSrc = "/logos/logo-dark.png";
  const defaultLinkClass =
    "text-[#191919] hover:text-[#F07858] transition-colors drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]";
  const dropdownBg = "bg-white/98 backdrop-blur-xl border-[#E7E4DE] shadow-xl";
  const dropdownItemText = "text-[#62666D] hover:text-[#191919] hover:bg-[#F5F2ED]";

  return (
    <header className={headerClass}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 flex h-[72px] sm:h-[76px] items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src={logoSrc}
            alt="REPSI"
            width={160}
            height={50}
            className="h-7 sm:h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            priority
          />
        </Link>

        {/* Desktop Nav with Clear Visibility & Pricing Contrast */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-8">
          {navItems.map((item) => {
            return item.href ? (
              <Link
                key={item.title}
                href={item.href}
                className={`text-sm font-semibold transition-colors py-2 px-1 ${defaultLinkClass}`}
              >
                {item.title}
              </Link>
            ) : (
              <div key={item.title} className="relative group">
                <button
                  className={`flex items-center gap-1 text-sm font-semibold transition-colors py-2 cursor-pointer ${defaultLinkClass}`}
                >
                  <span>{item.title}</span>
                  <ChevronDown className="w-3.5 h-3.5 transition-all duration-200 group-hover:translate-y-0.5 opacity-60 group-hover:opacity-100" />
                </button>

                {/* Dropdown */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 -translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 ease-out z-50">
                  <div className={`rounded-xl border p-2 min-w-[210px] ${dropdownBg}`}>
                    {item.links?.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className={`block px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${dropdownItemText}`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Auth & CTA (Search removed as requested) */}
        <div className="hidden sm:flex items-center gap-4 lg:gap-5">
          <Link
            href="/login"
            className={`text-sm font-semibold py-2 transition-colors ${
              isHome
                ? "text-[#191919] hover:text-[#F07858] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
                : "text-[#191919] hover:text-[#F07858]"
            }`}
          >
            Sign In
          </Link>

          <Link
            href="/signup"
            className="group inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-[#F07858] hover:bg-[#E76543] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm shadow-[#F07858]/25 hover:shadow-md active:scale-95"
          >
            <span>Start for Free →</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#191919] hover:bg-black/5 transition-colors"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            aria-haspopup="dialog"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="md:hidden border-b border-[#E7E4DE] bg-white px-6 pt-3 pb-8 space-y-6 shadow-xl h-[calc(100dvh-4.5rem)] overflow-y-auto text-[#191919]"
        >
          <div className="space-y-6">
            {navItems.map((item) => (
              <div key={item.title} className="space-y-3">
                {item.href ? (
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block text-base font-bold text-[#191919] hover:text-[#F07858] py-1"
                  >
                    {item.title}
                  </Link>
                ) : (
                  <>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#858890]">
                      {item.title}
                    </h4>
                    <div className="flex flex-col gap-1">
                      {item.links?.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className="block py-2 text-sm font-medium text-[#62666D] hover:text-[#F07858] transition-colors"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-[#E7E4DE] flex flex-col gap-3 pb-4">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full min-h-[44px] flex items-center justify-center py-2.5 text-xs font-bold border border-[#E7E4DE] rounded-full transition-colors hover:bg-[#FAF9F6] text-[#191919]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="w-full min-h-[44px] flex items-center justify-center py-2.5 text-xs font-bold bg-[#F07858] hover:bg-[#E76543] text-white rounded-full shadow-sm transition-all"
            >
              Start for Free →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
