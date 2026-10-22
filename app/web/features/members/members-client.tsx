"use client";

import { useState, useEffect, useCallback } from "react";
import { MembersToolbar } from "./members-toolbar";
import { MembersTable, type ServerSort } from "./members-table";
import { AddMemberDialog } from "./add-member-dialog";
import { InviteDialog } from "@/components/invite-dialog";
import { CsvImportModal } from "./csv-import-modal";
import { RenewalAlertsCard } from "./renewal-alerts-card";
import { Button } from "@/components/ui/button";
import type { Member, MemberStatus, MembershipPlanName } from "@/types";
import { repsiApi } from "@/lib/api";

interface MembersClientProps {
  initialMembers: Member[];
}

const PAGE_SIZES = [25, 50, 100];

function toMember(m: any): Member {
  return {
    id: m.id,
    name: `${m.first_name || ""} ${m.last_name || ""}`.trim(),
    email: m.email,
    phone: m.phone || "",
    status: m.status as MemberStatus,
    plan: (m.plan_name as MembershipPlanName) || "Monthly",
    repsiAccess: m.repsi_access,
    userId: m.user_id,
    joined: m.joined_date,
    expiry: m.membership_end_date,
  };
}

export function MembersClient({ initialMembers }: MembersClientProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [total, setTotal] = useState(initialMembers.length);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MemberStatus | "all">("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [sort, setSort] = useState<ServerSort>({ column: "created_at", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Any filter change returns to the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, planFilter, sort, pageSize]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await repsiApi.listMembers({
        query: debouncedSearch,
        status: statusFilter,
        planId: planFilter,
        sort: `${sort.direction === "desc" ? "-" : ""}${sort.column}`,
        page,
        pageSize,
      });
      setMembers(res.items.map(toMember));
      setTotal(res.total);
    } catch (err: any) {
      setLoadError(err.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, planFilter, sort, page, pageSize]);

  useEffect(() => {
    fetchMembers();
    window.addEventListener("repsi_storage_update", fetchMembers);
    return () => window.removeEventListener("repsi_storage_update", fetchMembers);
  }, [fetchMembers]);

  const handleExportCsv = async () => {
    try {
      const token = localStorage.getItem("repsi_auth_token");
      const res = await fetch(repsiApi.getExportMembersCsvUrl(), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to export members");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `repsi_members_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Failed to export members");
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}"? This removes their membership, payment and attendance history. To keep records, archive the member from their profile instead.`)) {
      return;
    }
    try {
      await repsiApi.deleteMember(id);
      fetchMembers();
    } catch (err: any) {
      alert(err.message || "Failed to delete member");
    }
  };

  const hasFilters = debouncedSearch !== "" || statusFilter !== "all" || planFilter !== "all";
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(total, page * pageSize);

  return (
    <div className="space-y-5">
      <RenewalAlertsCard />

      <MembersToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        planFilter={planFilter}
        onPlanFilterChange={setPlanFilter}
        onAddMember={() => setAddDialogOpen(true)}
        onInviteMember={() => setInviteDialogOpen(true)}
        onImportCsv={() => setCsvModalOpen(true)}
        onExportCsv={handleExportCsv}
        totalCount={total}
        filteredCount={total}
      />

      {loadError ? (
        <div role="alert" className="rounded-[12px] border border-rose-500/30 bg-rose-500/5 p-6 text-center text-sm text-rose-500">
          <p>{loadError}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={fetchMembers}>Try again</Button>
        </div>
      ) : !loading && members.length === 0 && hasFilters ? (
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)]">
          No members match these filters.
        </div>
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : ""} aria-busy={loading}>
          <MembersTable
            members={members}
            onAddMember={() => setAddDialogOpen(true)}
            onImportCsv={() => setCsvModalOpen(true)}
            onDeleteMember={handleDeleteMember}
            serverSort={sort}
            onServerSortChange={setSort}
            footer={
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
                <span>
                  {firstRow}–{lastRow} of {total} member{total !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1">
                    Rows
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-1 text-[var(--text)]"
                    >
                      {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <span>Page {page} of {pageCount}</span>
                  <Button variant="secondary" size="sm" disabled={page >= pageCount || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            }
          />
        </div>
      )}

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        defaultRole="member"
      />

      <AddMemberDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={async (data) => {
          await repsiApi.createMember({
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: data.password,
            plan: data.plan,
            startDate: data.startDate,
          });
          fetchMembers();
        }}
      />

      <CsvImportModal
        open={csvModalOpen}
        onOpenChange={setCsvModalOpen}
        onSuccess={fetchMembers}
      />
    </div>
  );
}
