"use client";

import { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  RefreshCw,
  Power,
  Maximize2,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  Info,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCodeView } from "@/components/ui/qr-code-view";
import { ApiAttendanceQR, repsiApi } from "@/lib/api";
import { PrintableQrModal } from "./printable-qr-modal";
import { useTranslation, richText } from "@/lib/i18n";

interface QrManagementCardProps {
  workspace: string;
  gymName: string;
  activeQr: ApiAttendanceQR | null;
  onRefresh: () => Promise<void>;
}

export function QrManagementCard({
  workspace,
  gymName,
  activeQr,
  onRefresh,
}: QrManagementCardProps) {
  const { t } = useTranslation();
  const [rotating, setRotating] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const handleRotateQr = async () => {
    if (!confirm(t("attendance.regenerate_qr_code_any_old_printed"))) {
      return;
    }
    setRotating(true);
    try {
      await repsiApi.generateQr({ label: t("attendance.main_entrance_qr") });
      await onRefresh();
    } catch (e: any) {
      alert(e.message || t("attendance.failed_to_rotate_qr_code"));
    } finally {
      setRotating(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!activeQr) return;
    setToggling(true);
    try {
      await repsiApi.toggleQrStatus(activeQr.id, !activeQr.is_active);
      await onRefresh();
    } catch (e: any) {
      alert(e.message || t("attendance.failed_to_toggle_status"));
    } finally {
      setToggling(false);
    }
  };

  const qrPayload = activeQr?.payload || `repsi://gym/checkin?gym_id=${workspace}&token=default`;
  const isActive = activeQr?.is_active ?? true;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
              {t("attendance.attendance_qr_management")}
            </h2>
            {isActive ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px] gap-1 font-semibold">
                {richText(t("attendance.spanactive_pass"), { span: <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> })}</Badge>
            ) : (
              <Badge variant="expired" className="text-[11px] gap-1 font-semibold">
                {richText(t("attendance.shieldalertdeactivated"), { shieldalert: <ShieldAlert className="w-3 h-3" /> })}</Badge>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {t("attendance.secure_dynamic_qr_token_for_gym")}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleToggleStatus}
            disabled={toggling || !activeQr}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-9"
          >
            <Power className={`w-3.5 h-3.5 ${isActive ? "text-[var(--success)]" : "text-[var(--info)]"}`} />
            <span>{isActive ? t("attendance.deactivate_qr") : t("attendance.activate_qr")}</span>
          </Button>

          <Button
            onClick={handleRotateQr}
            disabled={rotating}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-9 border-emerald-500/30 text-emerald-600 hover:bg-[var(--primary-hover)]/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rotating ? "animate-spin" : ""}`} />
            <span>{t("attendance.regenerate_qr")}</span>
          </Button>

          <Button
            onClick={() => setPrintModalOpen(true)}
            size="sm"
            className="text-xs gap-1.5 h-9 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-semibold shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t("attendance.print_qr_poster")}</span>
          </Button>

          <Link href={`/${workspace}/attendance/display`}>
            <Button
              variant="secondary"
              size="sm"
              className="text-xs gap-1.5 h-9 font-semibold"
            >
              <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
              <span>{t("attendance.display_screen")}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main QR Display Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* QR Code Canvas */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-[var(--background)] border border-[var(--border)]">
          <div className={`transition-opacity duration-300 ${!isActive ? "opacity-30 blur-[1px]" : "opacity-100"}`}>
            <QrCodeView
              value={qrPayload}
              size={200}
              title={gymName}
              subtitle={t("attendance.scan_with_repsi_app_to_check")}
              showDownload={true}
              showCopy={true}
            />
          </div>

          {!isActive && (
            <div className="mt-3 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t("attendance.qr_code_is_currently_paused")}</span>
            </div>
          )}
        </div>

        {/* Security & Metadata Details */}
        <div className="md:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {t("attendance.qr_token_identifier")}
              </span>
              <p className="font-mono text-xs text-[var(--text)] truncate font-semibold">
                {activeQr?.token ? `${activeQr.token.slice(0, 16)}...` : t("attendance.generating")}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {t("attendance.created_timestamp")}
              </span>
              <p className="font-semibold text-[var(--text)]">
                {activeQr?.created_at ? new Date(activeQr.created_at).toLocaleString() : t("attendance.live")}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {t("attendance.location_label")}
              </span>
              <p className="font-semibold text-[var(--text)]">
                {activeQr?.label || t("attendance.main_reception_desk")}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {t("attendance.security_architecture")}
              </span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                {richText(t("attendance.shieldcheckrevocable_ephemeral_token"), { shieldcheck: <ShieldCheck className="w-3.5 h-3.5" /> })}</p>
            </div>
          </div>

          {/* Anti-spoofing info alert */}
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              <strong>{t("attendance.anti_abuse_protection")}</strong> {t("attendance.repsi_qr_passes_never_expose_fixed")}
            </p>
          </div>
        </div>
      </div>

      {/* Printable Poster Modal */}
      <PrintableQrModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        gymName={gymName}
        qrPayload={qrPayload}
        qrLabel={activeQr?.label || "Main Reception Desk"}
      />
    </div>
  );
}
