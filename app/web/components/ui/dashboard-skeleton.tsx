"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";

interface DashboardSkeletonProps {
  className?: string;
  showShellHeader?: boolean;
}

export function DashboardSkeleton({
  className = "",
  showShellHeader = true,
}: DashboardSkeletonProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const shimmerClass = shouldReduceMotion
    ? "bg-[#E7E4DE]"
    : "animate-pulse bg-[#E7E4DE]/80";

  return (
    <div
      className={cn("space-y-8 w-full select-none", className)}
      role="status"
      aria-label={t("ui.loading_dashboard_records")}
    >
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 01. DASHBOARD HEADER SKELETON                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showShellHeader && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div className="space-y-2.5">
            <div className={cn("h-4 w-44 rounded-md", shimmerClass)} />
            <div className={cn("h-8 w-60 rounded-xl", shimmerClass)} />
            <div className={cn("h-3.5 w-36 rounded-md", shimmerClass)} />
          </div>

          <div className="flex items-center gap-2.5">
            <div className={cn("h-10 w-28 rounded-xl", shimmerClass)} />
            <div className={cn("h-10 w-32 rounded-xl", shimmerClass)} />
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 02. FOUR METRIC STAT CARDS SKELETON                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className={cn("h-3.5 w-24 rounded-md", shimmerClass)} />
              <div className={cn("w-8 h-8 rounded-xl", shimmerClass)} />
            </div>
            <div className={cn("h-8 w-28 rounded-lg", shimmerClass)} />
            <div className="flex items-center gap-2 pt-1">
              <div className={cn("h-3 w-16 rounded-md", shimmerClass)} />
              <div className={cn("h-3 w-20 rounded-md", shimmerClass)} />
            </div>
          </div>
        ))}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 03. CHARTS ROW SKELETON                                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Revenue Chart Placeholder (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className={cn("h-4 w-32 rounded-md", shimmerClass)} />
              <div className={cn("h-3 w-48 rounded-md", shimmerClass)} />
            </div>
            <div className="flex gap-2">
              <div className={cn("h-7 w-16 rounded-lg", shimmerClass)} />
              <div className={cn("h-7 w-16 rounded-lg", shimmerClass)} />
            </div>
          </div>

          {/* Chart Bars Simulation */}
          <div className="h-52 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-[var(--border)]">
            {[35, 60, 45, 75, 55, 85, 70, 95].map((heightPct, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={cn("w-full rounded-t-lg transition-all", shimmerClass)}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between px-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
              <div key={idx} className={cn("h-3 w-6 rounded", shimmerClass)} />
            ))}
          </div>
        </div>

        {/* Attendance Activity Chart Placeholder (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className={cn("h-4 w-36 rounded-md", shimmerClass)} />
              <div className={cn("h-3 w-28 rounded-md", shimmerClass)} />
            </div>
            <div className={cn("h-6 w-20 rounded-full", shimmerClass)} />
          </div>

          {/* Radial / Donut or Attendance Area Simulation */}
          <div className="h-48 w-full flex items-center justify-center">
            <div className={cn("w-36 h-36 rounded-full border-8 border-[#FAF9F6]", shimmerClass)} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
              <div className={cn("h-3 w-16 rounded", shimmerClass)} />
              <div className={cn("h-5 w-12 rounded", shimmerClass)} />
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
              <div className={cn("h-3 w-20 rounded", shimmerClass)} />
              <div className={cn("h-5 w-14 rounded", shimmerClass)} />
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 04. RECENT ACTIVITY & QUICK ACTIONS SKELETON                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity Table Placeholder (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className={cn("h-4 w-32 rounded-md", shimmerClass)} />
            <div className={cn("h-4 w-20 rounded-md", shimmerClass)} />
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-full", shimmerClass)} />
                  <div className="space-y-1.5">
                    <div className={cn("h-3.5 w-28 rounded", shimmerClass)} />
                    <div className={cn("h-2.5 w-36 rounded", shimmerClass)} />
                  </div>
                </div>
                <div className={cn("h-5 w-16 rounded-full", shimmerClass)} />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Placeholder (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className={cn("h-4 w-28 rounded-md", shimmerClass)} />
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-[var(--border)] flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-7 h-7 rounded-lg", shimmerClass)} />
                  <div className={cn("h-3.5 w-24 rounded", shimmerClass)} />
                </div>
                <div className={cn("w-4 h-4 rounded", shimmerClass)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
