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
      className={`w-full flex flex-col gap-4 sm:gap-5 ${className}`}
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
            onMouseEnter={() => setActiveId(item.id)}
            className={`rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden bg-white ${
              isActive
                ? "border-[#E25822] shadow-md shadow-[#E25822]/10 ring-1 ring-[#E25822]/20"
                : "border-[#E7E4DE] shadow-2xs hover:border-[#FACBB7] hover:shadow-xs"
            }`}
          >
            {/* Header / Clickable & Hoverable Accordion Bar */}
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              onMouseEnter={() => setActiveId(item.id)}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              aria-expanded={isActive}
              aria-controls={`accordion-panel-${item.id}`}
              id={`accordion-header-${item.id}`}
              className="w-full text-left p-4 sm:p-5 lg:p-6 flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E25822] transition-colors"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                {/* Number Badge */}
                <span
                  className="font-mono text-xs sm:text-[13px] font-bold px-3 py-1 rounded-full shrink-0 border transition-colors"
                  style={{
                    backgroundColor: isActive ? accentBg : "#FAF9F6",
                    borderColor: isActive ? accentBorder : "#E7E4DE",
                    color: isActive ? accentColor : "#858890",
                  }}
                >
                  {item.number}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase text-[#858890] truncate">
                      {item.tag}
                    </span>
                  </div>
                  <h3
                    className={`font-heading font-extrabold text-base sm:text-lg lg:text-xl tracking-tight transition-colors truncate sm:whitespace-normal ${
                      isActive ? "text-[#191919]" : "text-[#191919]/90 group-hover:text-[#E25822]"
                    }`}
                  >
                    {item.title}
                  </h3>
                </div>
              </div>

              {/* Right Summary Pill + Animated Chevron */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden md:inline-block text-xs text-[#62666D] font-normal px-2.5 py-1 rounded-full bg-[#FAF9F6] border border-[#E7E4DE]">
                  {item.summary}
                </span>

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isActive
                      ? "bg-[#FDF1EB] text-[#E25822] border-[#FACBB7] rotate-180"
                      : "bg-[#FAF9F6] text-[#62666D] border-[#E7E4DE]"
                  }`}
                  aria-hidden="true"
                >
                  <ChevronDown className="w-4 h-4" />
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
                  <div className="px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 pt-1 border-t border-[#F0EDE7]">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center pt-3">
                      {/* Left: Detailed Problem Description & Pain Points */}
                      <div className="lg:col-span-6 space-y-4">
                        <div className="space-y-2.5">
                          {item.descriptionPoints.map((point, idx) => (
                            <div key={idx} className="flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E25822] shrink-0 mt-2" />
                              <p className="text-sm sm:text-base text-[#62666D] leading-relaxed font-normal">
                                {point}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Friction Callout Box */}
                        <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E7E4DE] flex items-center gap-2.5 text-xs text-[#191919]">
                          <AlertCircle className="w-4 h-4 text-[#E25822] shrink-0" />
                          <span className="font-medium">
                            Operational friction: {item.badgeText}
                          </span>
                        </div>
                      </div>

                      {/* Right: Crisp Rounded Editorial Photograph */}
                      <div className="lg:col-span-6">
                        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-[#E7E4DE] bg-[#F5F2ED] shadow-sm">
                          <ImageWithSkeleton
                            src={item.imageSrc}
                            alt={item.imageAlt}
                            fill
                            sizes="(max-width: 1024px) 100vw, 600px"
                            className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />

                          {/* Floating Bottom Badge */}
                          <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-auto bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/40 shadow-md flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full animate-pulse"
                              style={{ backgroundColor: accentColor }}
                            />
                            <span className="text-xs font-semibold text-[#191919] truncate">
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
