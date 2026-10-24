"use client";

import { useState } from "react";
import {
  Users,
  Clock,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle2,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ApiCurrentlyInside, repsiApi } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import { useTranslation, richText } from "@/lib/i18n";

interface CurrentlyInsideTableProps {
  members: ApiCurrentlyInside[];
  onRefresh: () => Promise<void>;
}

export function CurrentlyInsideTable({ members, onRefresh }: CurrentlyInsideTableProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    (m.phone && m.phone.includes(query)) ||
    (m.member_id && m.member_id.toLowerCase().includes(query.toLowerCase()))
  );

  const handleManualCheckout = async (item: ApiCurrentlyInside) => {
    if (!confirm(t("attendance.check_out_name_session_elapsed_duration", undefined, { name: item.name, duration_formatted: item.duration_formatted }))) {
      return;
    }
    setCheckingOutId(item.attendance_id);
    try {
      await repsiApi.checkOut(item.attendance_id, "STAFF");
      await onRefresh();
    } catch (e: any) {
      alert(e.message || t("attendance.failed_to_check_out_member"));
    } finally {
      setCheckingOutId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
                {t("attendance.currently_inside_facility")}
              </h2>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-bold">
                {t("attendance.countactive", undefined, { count: members.length })}</Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {t("attendance.live_roster_of_members_working_out")}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={t("attendance.search_member_phone")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
        </div>
      </div>

      {/* Roster Table */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center space-y-2 border border-dashed border-[var(--border)] rounded-xl">
          <Users className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
          <p className="text-xs font-semibold text-[var(--text)]">
            {query ? t("attendance.no_members_match_search") : t("attendance.nobody_currently_inside")}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            {query ? t("attendance.try_searching_by_another_name_or") : t("attendance.when_members_scan_the_entrance_qr")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-[var(--border)] rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)] text-[var(--text-muted)] font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">{t("pay.member")}</th>
                <th className="py-3 px-4">{t("attendance.plan_status")}</th>
                <th className="py-3 px-4">{t("attendance.check_in_time")}</th>
                <th className="py-3 px-4">{t("attendance.active_duration")}</th>
                <th className="py-3 px-4">{t("attendance.terminal")}</th>
                <th className="py-3 px-4 text-right">{t("attendance.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((item) => (
                <tr key={item.attendance_id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  {/* Member Name & Avatar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 rounded-full border border-[var(--border)]">
                        {item.avatar_url && <AvatarImage src={item.avatar_url} />}
                        <AvatarFallback className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          {getInitials(item.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {item.person_type === "trainer" && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-blue-500/30 text-blue-600">
                              {t("navItem.trainer")}
                            </Badge>
                          )}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {item.phone || item.member_id || t("attendance.facility_pass")}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Plan & Status */}
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <p className="font-medium text-[var(--text)]">{item.plan_name || t("attendance.standard_plan")}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                        {richText(t("attendance.spanactive"), { span: <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> })}</span>
                    </div>
                  </td>

                  {/* Check In Time */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-[var(--text)] font-mono text-xs">
                      <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span>{new Date(item.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </td>

                  {/* Elapsed Duration (Live) */}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {item.duration_formatted}
                    </span>
                  </td>

                  {/* Terminal */}
                  <td className="py-3 px-4 text-[var(--text-muted)] text-[11px] font-mono">
                    {item.terminal_id || t("attendance.main_door")}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    <Button
                      onClick={() => handleManualCheckout(item)}
                      disabled={checkingOutId === item.attendance_id}
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs gap-1.5 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{checkingOutId === item.attendance_id ? t("attendance.checking_out") : t("attendance.check_out")}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
