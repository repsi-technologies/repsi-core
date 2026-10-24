"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, HelpCircle, X, Sparkles } from "lucide-react";
import { RepsiMascot } from "@/components/ui/repsi-mascot";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface StepItem {
  id: string;
  title: string;
  desc: string;
  href: string;
  completed: boolean;
}

interface GettingStartedDialogProps {
  workspace: string;
  isOpen: boolean;
  onClose: () => void;
  completedSteps?: Record<string, boolean>;
}

export function GettingStartedDialog({
  workspace,
  isOpen,
  onClose,
  completedSteps = {},
}: GettingStartedDialogProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const steps: StepItem[] = [
    {
      id: "profile",
      title: t("layout.gym_profile"),
      desc: t("layout.gym_name_contact_info_operating_hours"),
      href: `/${workspace}/settings`,
      completed: completedSteps.profile ?? true,
    },
    {
      id: "memberships",
      title: t("layout.add_membership_plans"),
      desc: t("layout.packages_pricing_your_members_can_purchase"),
      href: `/${workspace}/memberships`,
      completed: completedSteps.memberships ?? false,
    },
    {
      id: "trainers",
      title: t("layout.add_trainers"),
      desc: t("layout.coaches_to_manage_client_workouts_and"),
      href: `/${workspace}/trainers`,
      completed: completedSteps.trainers ?? false,
    },
    {
      id: "members",
      title: t("layout.add_members"),
      desc: t("layout.create_members_manually_or_upload_csv"),
      href: `/${workspace}/members`,
      completed: completedSteps.members ?? false,
    },
    {
      id: "attendance",
      title: t("layout.set_up_attendance"),
      desc: t("layout.qr_scanner_code_front_desk_check"),
      href: `/${workspace}/attendance`,
      completed: completedSteps.attendance ?? false,
    },
    {
      id: "website",
      title: t("layout.public_gym_website"),
      desc: "Launch repsi.app/" + workspace + " in Website Studio",
      href: `/${workspace}/website`,
      completed: completedSteps.website ?? false,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#131a16] border border-[var(--border)] dark:border-[#223127] p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] dark:hover:text-white hover:bg-[var(--surface-hover)] dark:hover:bg-[#1b2520] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Mascot */}
        <div className="flex items-center gap-4 border-b border-[var(--border)] dark:border-[#223127] pb-5">
          <RepsiMascot pose="onboarding" size="sm" animate={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--primary-dark)] bg-[#E8F8ED] dark:bg-[#163321] px-2 py-0.5 rounded">
                {t("layout.getting_started_guide")}
              </span>
              <span className="text-xs font-bold text-[var(--text-muted)]">
                {completedCount} of {steps.length} completed
              </span>
            </div>
            <h2 className="text-xl font-bold text-[var(--text)] dark:text-white mt-1">
              {t("layout.set_up_your_gym")}
            </h2>
            <p className="text-xs text-[var(--text-muted)] dark:text-[#8D9C94] mt-0.5">
              {t("layout.follow_these_recommended_steps_to_have")}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="my-5">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text)] dark:text-[#E8F0EC] mb-1.5">
            <span>{t("layout.setup_progress")}</span>
            <span className="text-[var(--primary-dark)]">{progressPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--surface-hover)] dark:bg-[#1a251e] overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Step Items List */}
        <div className="space-y-2.5">
          {steps.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                s.completed
                  ? "bg-[#F7FCF9] dark:bg-[#102317]/40 border-[var(--primary)]/20"
                  : "bg-white dark:bg-[#16201b] border-[var(--border)] dark:border-[#223127] hover:border-[var(--primary)]/40"
              }`}
            >
              <div className="flex items-start gap-3">
                {s.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-[var(--primary-dark)] shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-[#94A3B8] shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-[var(--text)] dark:text-white">
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] dark:text-[#8D9C94] mt-0.5">
                    {s.desc}
                  </p>
                </div>
              </div>

              <Link
                href={s.href}
                onClick={onClose}
                className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  s.completed
                    ? "text-[var(--primary-dark)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20"
                    : "bg-[#111714] dark:bg-white text-white dark:text-[var(--text)] hover:opacity-90"
                }`}
              >
                <span>{s.completed ? t("layout.completed") : t("layout.set_up")}</span>
                {!s.completed && <ArrowRight className="w-3 h-3" />}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--border)] dark:border-[#223127] flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)] dark:text-[#8D9C94]">
            {t("layout.you_can_reopen_this_checklist_anytime")}
          </span>
          <Button size="sm" variant="outline" onClick={onClose} className="text-xs">
            {t("common.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
