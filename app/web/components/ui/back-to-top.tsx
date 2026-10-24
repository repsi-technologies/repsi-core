"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function BackToTop() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled down 300px
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 12 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          aria-label={t("ui.back_to_top")}
          className="fixed bottom-[84px] right-6 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#E25822] hover:bg-[#C94715] text-white flex items-center justify-center shadow-lg shadow-[#E25822]/30 border border-[#FACBB7] active:scale-95 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#E25822] focus:ring-offset-2"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-200" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
