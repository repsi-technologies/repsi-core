"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, AlertCircle, CheckCircle2 } from "lucide-react";

export interface AccordionGalleryItem {
  id: string;
  number: string;
  tag: string;
  title: string;
  descriptionPoints: string[];
  summary: string;
  imageSrc: string;
  imageAlt: string;
  badgeText: string;
  accentColor?: string;
  accentBg?: string;
  accentBorder?: string;
}

export interface AccordionGalleryProps {
  items: AccordionGalleryItem[];
  defaultOpenId?: string;
  className?: string;
}

export function AccordionGallery({
  items,
  defaultOpenId,
  className = "",
}: AccordionGalleryProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string>(
    defaultOpenId || (items.length > 0 ? items[0].id : "")
  );

  const toggleItem = (id: string) => {
    setActiveId((prev) => (prev === id ? "" : id));
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleItem(id);
    }
  };

  return (
    <div
      className={`w-full flex flex-col gap-3 sm:gap-4 lg:gap-5 ${className}`}
      role="region"
      aria-label="Operational Challenges Accordion Gallery"
    >
      {items.map((item) => {
        const isActive = activeId === item.id;
        const accentColor = item.accentColor || "#E25822";
        const accentBg = item.accentBg || "#FDF1EB";
        const accentBorder = item.accentBorder || "#FACBB7";

        return (
          <div
            key={item.id}
            className={`rounded-xl sm:rounded-2xl lg:rounded-3xl border transition-all duration-300 overflow-hidden bg-white ${
              isActive
                ? "border-[#E25822] shadow-md shadow-[#E25822]/10 ring-1 ring-[#E25822]/20"
                : "border-[#E7E4DE] shadow-2xs hover:border-[#FACBB7] hover:shadow-xs"
            }`}
          >
            {/* Header / Clickable Accordion Bar */}
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              aria-expanded={isActive}
              aria-controls={`accordion-panel-${item.id}`}
              id={`accordion-header-${item.id}`}
              className="w-full text-left p-3.5 sm:p-5 lg:p-6 flex items-center justify-between gap-3 sm:gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E25822] transition-colors"
            >
              <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
                {/* Number Badge */}
                <span
                  className="font-mono text-[11px] sm:text-xs md:text-[13px] font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shrink-0 border transition-colors self-center"
                  style={{
                    backgroundColor: isActive ? accentBg : "#FAF9F6",
                    borderColor: isActive ? accentBorder : "#E7E4DE",
                    color: isActive ? accentColor : "#858890",
                  }}
                >
                  {item.number}
                </span>

                <div className="min-w-0 flex-1">
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase text-[#858890] block mb-0.5">
                    {item.tag}
                  </span>
                  <h3
                    className={`font-heading font-extrabold text-sm sm:text-base md:text-lg lg:text-xl tracking-tight transition-colors whitespace-normal break-words leading-snug ${
                      isActive ? "text-[#191919]" : "text-[#191919]/90 group-hover:text-[#E25822]"
                    }`}
                  >
                    {item.title}
                  </h3>
                </div>
              </div>

              {/* Right Summary Pill + Animated Chevron */}
              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                <span className="hidden md:inline-block text-xs text-[#62666D] font-normal px-2.5 py-1 rounded-full bg-[#FAF9F6] border border-[#E7E4DE]">
                  {item.summary}
                </span>

                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border transition-all duration-300 shrink-0 ${
                    isActive
                      ? "bg-[#FDF1EB] text-[#E25822] border-[#FACBB7] rotate-180"
                      : "bg-[#FAF9F6] text-[#62666D] border-[#E7E4DE]"
                  }`}
                  aria-hidden="true"
                >
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            </button>

            {/* Expandable Accordion Body */}
            <AnimatePresence initial={false}>
              {isActive && (
                <motion.div
                  id={`accordion-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`accordion-header-${item.id}`}
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1, height: "auto" }
                      : { opacity: 0, height: 0 }
                  }
                  animate={{ opacity: 1, height: "auto" }}
                  exit={
                    shouldReduceMotion
                      ? { opacity: 0, height: "auto" }
                      : { opacity: 0, height: 0 }
                  }
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-3.5 pb-3.5 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 pt-1 border-t border-[#F0EDE7]">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-center pt-2.5 sm:pt-3">
                      {/* Left: Detailed Problem Description & Pain Points */}
                      <div className="lg:col-span-6 space-y-3 sm:space-y-4">
                        <div className="space-y-2 sm:space-y-2.5">
                          {item.descriptionPoints.map((point, idx) => (
                            <div key={idx} className="flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E25822] shrink-0 mt-2" />
                              <p className="text-xs sm:text-base text-[#62666D] leading-relaxed font-normal">
                                {point}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Friction Callout Box */}
                        <div className="p-3 sm:p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E7E4DE] flex items-center gap-2 sm:gap-2.5 text-xs text-[#191919]">
                          <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E25822] shrink-0" />
                          <span className="font-medium text-[11px] sm:text-xs leading-snug">
                            Operational friction: {item.badgeText}
                          </span>
                        </div>
                      </div>

                      {/* Right: Crisp Rounded Editorial Photograph */}
                      <div className="lg:col-span-6">
                        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl sm:rounded-2xl overflow-hidden border border-[#E7E4DE] bg-[#F5F2ED] shadow-xs">
                          <ImageWithSkeleton
                            src={item.imageSrc}
                            alt={item.imageAlt}
                            fill
                            sizes="(max-width: 1024px) 100vw, 600px"
                            className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />

                          {/* Floating Bottom Badge */}
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-auto bg-white/95 backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl border border-white/40 shadow-xs flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full animate-pulse shrink-0"
                              style={{ backgroundColor: accentColor }}
                            />
                            <span className="text-[11px] sm:text-xs font-semibold text-[#191919] truncate">
                              {item.badgeText}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
