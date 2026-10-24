"use client";

import { useEffect, useState } from "react";
import { repsiApi } from "@/lib/api";
import { Search, SlidersHorizontal, Plus, Download, Mail, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MemberStatus } from "@/types";
import { useTranslation, tr, richText } from "@/lib/i18n";

interface MembersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: MemberStatus | "all";
  onStatusFilterChange: (value: MemberStatus | "all") => void;
  /** Membership plan id, or "all" */
  planFilter: string;
  onPlanFilterChange: (value: string) => void;
  onAddMember: () => void;
  onInviteMember?: () => void;
  onImportCsv?: () => void;
  onExportCsv?: () => void;
  totalCount: number;
  filteredCount: number;
}

const statusOptions: Array<{ value: MemberStatus | "all"; label: string }> = [
  { value: "all", get label() { return tr("members.all_except_archived"); } },
  { value: "active", get label() { return tr("layout.active"); } },
  { value: "inactive", get label() { return tr("members.inactive"); } },
  { value: "suspended", get label() { return tr("members.suspended"); } },
  { value: "archived", get label() { return tr("members.archived"); } },
];

export function MembersToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  planFilter,
  onPlanFilterChange,
  onAddMember,
  onInviteMember,
  onImportCsv,
  onExportCsv,
  totalCount,
  filteredCount,
}: MembersToolbarProps) {
  const { t } = useTranslation();
  const hasFilters = statusFilter !== "all" || planFilter !== "all" || search !== "";
  const [planOptions, setPlanOptions] = useState<Array<{ value: string; label: string }>>([{ value: "all", label: t("members.all_plans") }]);

  useEffect(() => {
    repsiApi.getMembershipPlans().then((plans) =>
      setPlanOptions([{ value: "all", label: t("members.all_plans") }, ...plans.map((p: any) => ({ value: p.id, label: p.name }))])
    );
  }, []);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Search + Filters */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:flex-1 max-w-xl">
        {/* Search */}
        <div className="flex-1 min-w-[140px]">
          <Input
            aria-label={t("members.search_members_by_name_phone_email")}
            placeholder={t("members.name_phone_email_or_id")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            startIcon={<Search className="h-3.5 w-3.5" />}
            className="h-9"
          />
        </div>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className={statusFilter !== "all" ? "border-[var(--primary)] text-[var(--primary-dark)] dark:text-[var(--primary-hover)]" : ""}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {statusFilter === "all"
                ? t("common.status")
                : statusOptions.find((o) => o.value === statusFilter)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel>{t("members.filter_by_status")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((opt) => (
              <DropdownMenuCheckboxItem
                key={opt.value}
                checked={statusFilter === opt.value}
                onCheckedChange={() => onStatusFilterChange(opt.value)}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Plan Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className={planFilter !== "all" ? "border-[var(--primary)] text-[var(--primary-dark)] dark:text-[var(--primary-hover)]" : ""}
            >
              {planFilter === "all" ? t("members.plan") : planOptions.find((o) => o.value === planFilter)?.label || t("members.plan")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel>{t("members.filter_by_plan")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {planOptions.map((opt) => (
              <DropdownMenuCheckboxItem
                key={opt.value}
                checked={planFilter === opt.value}
                onCheckedChange={() => onPlanFilterChange(opt.value)}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={() => {
              onSearchChange("");
              onStatusFilterChange("all");
              onPlanFilterChange("all");
            }}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors whitespace-nowrap cursor-pointer"
          >
            {t("members.clear")}
          </button>
        )}
      </div>

      {/* Right: Count + Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap mr-1">
          {hasFilters
            ? `${filteredCount} of ${totalCount}`
            : `${totalCount} members`}
        </span>

        {onExportCsv && (
          <Button variant="secondary" size="sm" onClick={onExportCsv} title="Download CSV of all members">
            {richText(t("members.downloadexport"), { download: <Download className="h-3.5 w-3.5" /> })}</Button>
        )}

        {onImportCsv && (
          <Button variant="secondary" size="sm" onClick={onImportCsv} className="border-dashed" title="Upload Excel/CSV member roster">
            {richText(t("members.uploadimport_csv"), { upload: <Upload className="h-3.5 w-3.5" /> })}</Button>
        )}

        {onInviteMember && (
          <Button size="sm" onClick={onInviteMember} className="gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-dark)]">
            {richText(t("members.mailinvite_member"), { mail: <Mail className="h-3.5 w-3.5" /> })}</Button>
        )}

        <Button variant="secondary" size="sm" onClick={onAddMember}>
          {richText(t("members.plusadd_direct"), { plus: <Plus className="h-3.5 w-3.5" /> })}</Button>
      </div>
    </div>
  );
}
