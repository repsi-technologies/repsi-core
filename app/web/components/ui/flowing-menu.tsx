"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface FlowingMenuItem {
  label: string;
  description: string;
  icon?: React.ReactNode;
}

interface FlowingMenuProps {
  items: FlowingMenuItem[];
  className?: string;
  theme?: "light" | "dark";
}

export function FlowingMenu({ items, className = "", theme = "light" }: FlowingMenuProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const borderClass = theme === "light" ? "border-[var(--border)]" : "border-[#3A3F45]";
  const textClass = theme === "light" ? "text-[var(--text)]" : "text-[#F7F7F5]";
  const descClass = theme === "light" ? "text-[var(--text-muted)]" : "text-[#9CA3AF]";
  const iconBg = theme === "light" ? "bg-[var(--surface-hover)] border-[var(--border)] text-[var(--primary-dark)]" : "bg-[#24272B] border-[#3A3F45] text-[var(--primary-dark)]";

  return (
    <div className={`space-y-0 ${className}`}>
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
          className={`group relative border-b ${borderClass} cursor-pointer overflow-hidden`}
        >
          {/* Background gradient on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/5 via-[var(--primary-hover)]/10 to-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: hoveredIndex === i ? 1 : 0,
              x: hoveredIndex === i ? 0 : -20,
            }}
            transition={{ duration: 0.3 }}
          />

          <div className="relative flex items-center justify-between py-6 md:py-8 px-4 md:px-8">
            <div className="flex items-center gap-4 md:gap-6">
              {item.icon && (
                <div className={`w-12 h-12 rounded-xl border ${iconBg} flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)] group-hover:border-[var(--primary)] transition-all duration-300 shadow-sm`}>
                  {item.icon}
                </div>
              )}
              <div>
                <h3 className={`text-xl md:text-2xl font-extrabold ${textClass} tracking-tight group-hover:text-[var(--primary-dark)] transition-colors duration-300`}>
                  {item.label}
                </h3>
                <AnimatePresence>
                  {hoveredIndex === i && (
                    <motion.p
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`text-sm ${descClass} overflow-hidden font-medium`}
                    >
                      {item.description}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <motion.div
              animate={{
                x: hoveredIndex === i ? 0 : -8,
                opacity: hoveredIndex === i ? 1 : 0.4,
              }}
              transition={{ duration: 0.25 }}
            >
              <ArrowRight className="w-6 h-6 text-[var(--primary-dark)]" />
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
