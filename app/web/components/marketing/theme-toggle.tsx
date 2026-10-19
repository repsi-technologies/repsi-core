"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

interface ThemeToggleProps {
  className?: string;
  isHome?: boolean;
  compact?: boolean;
}

export function ThemeToggle({
  className = "",
  isHome = false,
  compact = false,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`h-9 w-[68px] rounded-full border border-white/10 bg-white/5 animate-pulse ${className}`}
        aria-hidden="true"
      />
    );
  }

  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === "dark";

  // If compact (e.g. mobile bar), render a sleek single-icon glowing button
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden group ${
          isDark
            ? "border-[var(--primary)]/30 bg-[var(--surface)]/90 text-[var(--primary-dark)] hover:border-[var(--primary)]/60 shadow-[0_0_16px_rgba(199, 103, 6,0.18)]"
            : "border-[var(--border)] bg-[var(--surface)] text-[var(--primary)] hover:bg-[var(--surface-secondary)] shadow-xs"
        } ${className}`}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
        <motion.div
          key={isDark ? "dark-icon" : "light-icon"}
          initial={{ rotate: -45, scale: 0.7, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 45, scale: 0.7, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? (
            <Moon className="h-4 w-4 fill-[var(--primary)]/20 text-[var(--primary-dark)]" />
          ) : (
            <Sun className="h-4 w-4 fill-[var(--primary)]/20 text-[var(--primary)]" />
          )}
        </motion.div>
      </button>
    );
  }

  // Full Dual-Icon Segmented Glass Pill Toggle
  return (
    <div
      role="radiogroup"
      aria-label="Color theme selection"
      className={`relative inline-flex h-9 p-0.5 rounded-full border transition-all duration-300 select-none items-center ${
        isHome
          ? isDark
            ? "border-[var(--primary)]/25 bg-[var(--background)]/85 shadow-[0_0_20px_rgba(199, 103, 6,0.12)] backdrop-blur-md"
            : "border-white/20 bg-black/25 shadow-inner backdrop-blur-md"
          : isDark
          ? "border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md shadow-xs"
          : "border-slate-200 bg-slate-100/80 backdrop-blur-md shadow-inner"
      } ${className}`}
    >
      {/* Sliding background thumb */}
      <motion.div
        className={`absolute top-0.5 bottom-0.5 w-[31px] rounded-full transition-colors ${
          isDark
            ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] shadow-[0_0_12px_rgba(199, 103, 6,0.45)]"
            : "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
        }`}
        animate={{
          left: isDark ? "35px" : "2px",
        }}
        transition={{
          type: "spring",
          stiffness: 450,
          damping: 30,
        }}
      />

      {/* Light Option Button */}
      <button
        type="button"
        role="radio"
        aria-checked={!isDark}
        onClick={() => setTheme("light")}
        className={`relative z-10 flex h-8 w-[31px] items-center justify-center rounded-full transition-colors cursor-pointer ${
          !isDark
            ? "text-[var(--primary)]"
            : isHome
            ? "text-zinc-400 hover:text-white"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
        title="Light Mode"
        aria-label="Light Mode"
      >
        <Sun className="h-3.5 w-3.5 transition-transform duration-200" />
      </button>

      {/* Dark Option Button */}
      <button
        type="button"
        role="radio"
        aria-checked={isDark}
        onClick={() => setTheme("dark")}
        className={`relative z-10 flex h-8 w-[31px] items-center justify-center rounded-full transition-colors cursor-pointer ${
          isDark
            ? "text-[var(--primary-foreground)]"
            : isHome
            ? "text-zinc-400 hover:text-white"
            : "text-zinc-400 hover:text-zinc-700"
        }`}
        title="Dark Mode"
        aria-label="Dark Mode"
      >
        <Moon className="h-3.5 w-3.5 transition-transform duration-200" />
      </button>
    </div>
  );
}
