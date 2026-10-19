"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles, Clock, MessageSquare } from "lucide-react";

export function FinalCtaSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative w-full bg-[#FAF9F6] text-white py-16 sm:py-20 lg:py-24 border-b border-[#E7E4DE] overflow-hidden font-sans">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="relative rounded-[28px] sm:rounded-[36px] bg-[#E25822] text-white p-8 sm:p-12 lg:p-16 shadow-xl shadow-[#E25822]/20 overflow-hidden">
          {/* Subtle soft white ambient glow accents */}
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-black/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-5">
            {/* Headline */}
            <motion.h2
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-[42px] text-white tracking-tight leading-[1.15]"
            >
              Ready to simplify your daily operations?
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="text-sm sm:text-base md:text-lg text-white/90 max-w-xl mx-auto leading-relaxed font-normal"
            >
              Bring your members, attendance, memberships and payments together with REPSI.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="flex flex-wrap items-center justify-center gap-3.5 pt-2"
            >
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-white hover:bg-[#FAF9F6] text-[#E25822] text-xs sm:text-sm font-bold shadow-md shadow-black/10 transition-all duration-200 active:scale-95"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>

              <a
                href="#pricing"
                className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs sm:text-sm font-semibold backdrop-blur-sm transition-all duration-200 active:scale-95"
              >
                <span>Explore Pricing</span>
              </a>
            </motion.div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-white/20 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs text-white/85">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-white shrink-0" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-white shrink-0" />
                <span>Instant setup in 2 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
