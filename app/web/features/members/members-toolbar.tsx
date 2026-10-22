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
  { value: "all", label: "All (except archived)" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "archived", label: "Archived" },
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
  const hasFilters = statusFilter !== "all" || planFilter !== "all" || search !== "";
  const [planOptions, setPlanOptions] = useState<Array<{ value: string; label: string }>>([{ value: "all", label: "All plans" }]);

  useEffect(() => {
    repsiApi.getMembershipPlans().then((plans) =>
      setPlanOptions([{ value: "all", label: "All plans" }, ...plans.map((p: any) => ({ value: p.id, label: p.name }))])
    );
  }, []);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Search + Filters */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:flex-1 max-w-xl">
        {/* Search */}
        <div className="flex-1 min-w-[140px]">
          <Input
            aria-label="Search members by name, phone, email or member ID"
            placeholder="Name, phone, email or ID…"
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
                ? "Status"
                : statusOptions.find((o) => o.value === statusFilter)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
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
              {planFilter === "all" ? "Plan" : planOptions.find((o) => o.value === planFilter)?.label || "Plan"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel>Filter by plan</DropdownMenuLabel>
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
            Clear
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
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        )}

        {onImportCsv && (
          <Button variant="secondary" size="sm" onClick={onImportCsv} className="border-dashed" title="Upload Excel/CSV member roster">
            <Upload className="h-3.5 w-3.5" />
            Import CSV
          </Button>
        )}

        {onInviteMember && (
          <Button size="sm" onClick={onInviteMember} className="gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-dark)]">
            <Mail className="h-3.5 w-3.5" />
            Invite Member
          </Button>
        )}

        <Button variant="secondary" size="sm" onClick={onAddMember}>
          <Plus className="h-3.5 w-3.5" />
          Add Direct
        </Button>
      </div>
    </div>
  );
}
