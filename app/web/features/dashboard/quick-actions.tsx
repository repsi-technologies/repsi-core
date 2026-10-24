"use client";

import Link from "next/link";
import {
  UserPlus,
  Users,
  CreditCard,
  CheckCircle2,
  UserCheck,
  Dumbbell,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface QuickActionsProps {
  workspace?: string;
}

export function QuickActions({ workspace = "default" }: QuickActionsProps) {
  const { t } = useTranslation();
  const actions = [
    {
      label: t("dashboard.add_member"),
      description: t("dashboard.register_gym_member"),
      href: `/${workspace}/members/new`,
      icon: UserPlus,
      primary: true,
    },
    {
      label: t("dashboard.add_trainer"),
      description: t("dashboard.onboard_trainer_profile"),
      href: `/${workspace}/trainers?new=true`,
      icon: UserCheck,
    },
    {
      label: t("dashboard.create_membership"),
      description: t("dashboard.package_pricing_plan"),
      href: `/${workspace}/memberships?new=true`,
      icon: CreditCard,
    },
    {
      label: t("dashboard.check_attendance"),
      description: t("dashboard.live_qr_or_manual_scan"),
      href: `/${workspace}/attendance`,
      icon: CheckCircle2,
    },
    {
      label: t("dashboard.add_lead"),
      description: t("dashboard.capture_inquiry_in_crm"),
      href: `/${workspace}/crm?new=true`,
      icon: Users,
    },
    {
      label: t("dashboard.create_workout"),
      description: t("dashboard.protocol_or_routine_template"),
      href: `/${workspace}/workouts?new=true`,
      icon: Dumbbell,
    },
  ];

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-3.5 sm:mb-4">
        <h2 className="text-sm sm:text-base font-bold text-[var(--text)] tracking-tight">{t("dashboard.quick_actions")}</h2>
        <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--primary-dark)] bg-[var(--primary)]/10 px-2 sm:px-2.5 py-0.5 rounded-full">
          {t("dashboard.shortcuts")}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`flex items-center gap-2.5 sm:gap-3 rounded-xl p-2.5 sm:p-3 text-left transition-all duration-150 border cursor-pointer ${
                action.primary
                  ? "bg-[var(--primary)]/10 border-[var(--primary)]/40 hover:bg-[var(--primary)]/20 hover:border-[var(--primary)]"
                  : "bg-[var(--background)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--primary)]/30"
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  action.primary
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--primary-dark)]"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div
                  className={`text-xs font-bold truncate ${
                    action.primary
                      ? "text-[var(--primary-dark)]"
                      : "text-[var(--text)]"
                  }`}
                >
                  {action.label}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">
                  {action.description}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
