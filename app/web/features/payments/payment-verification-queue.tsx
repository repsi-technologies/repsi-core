"use client";

import { AuthImage, openProtectedFile } from "@/components/ui/auth-image";
import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertTriangle, 
  ExternalLink, 
  Receipt, 
  ShieldCheck, 
  Smartphone, 
  Building2, 
  QrCode,
  FileText,
  UserCheck,
  Check,
  X,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  repsiApi, 
  ApiPaymentSubmission, 
  ApiMember 
} from "@/lib/api";
import { useTranslation, richText } from "@/lib/i18n";

export function PaymentVerificationQueue() {
  const { t } = useTranslation();
  const [submissions, setSubmissions] = useState<ApiPaymentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending_review");
  const [search, setSearch] = useState("");
  
  // Modal states
  const [selectedSub, setSelectedSub] = useState<ApiPaymentSubmission | null>(null);
  const [previewReceiptOpen, setPreviewReceiptOpen] = useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await repsiApi.getPaymentSubmissions(filterStatus === "all" ? undefined : filterStatus);
      setSubmissions(data);
    } catch (err: any) {
      console.error("Error loading submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [filterStatus]);

  const handleApprove = async () => {
    if (!selectedSub) return;
    setActionLoading(true);
    setActionError("");
    try {
      await repsiApi.approvePaymentSubmission(selectedSub.id);
      setActionSuccess(`Payment for invoice ${selectedSub.invoice_id} approved. Ledger recorded and member access activated!`);
      setApproveConfirmOpen(false);
      setSelectedSub(null);
      await loadSubmissions();
      // Notify other views
      window.dispatchEvent(new Event("repsi_storage_update"));
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      setActionError(err.message || t("payments.approval_failed_please_verify_your_permissions"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    if (!rejectionReason.trim()) {
      setActionError("Please provide a specific rejection reason for the member.");
      return;
    }
    setActionLoading(true);
    setActionError("");
    try {
      await repsiApi.rejectPaymentSubmission(selectedSub.id, rejectionReason.trim());
      setActionSuccess(`Payment submission rejected. Notification sent to member.`);
      setRejectModalOpen(false);
      setSelectedSub(null);
      setRejectionReason("");
      await loadSubmissions();
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      setActionError(err.message || t("payments.rejection_failed_please_try_again"));
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = submissions.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.invoice_id?.toLowerCase().includes(q) ||
      s.transaction_reference?.toLowerCase().includes(q) ||
      s.member_id?.toLowerCase().includes(q) ||
      s.payment_method?.toLowerCase().includes(q)
    );
  });

  const pendingCount = submissions.filter((s) => s.status === "pending_review").length;

  return (
    <div className="space-y-6">
      {/* Top Notification Banner */}
      {actionSuccess && (
        <div className="p-4 rounded-xl border border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success-foreground)] text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")} className="text-emerald-600 dark:text-emerald-400 hover:text-[var(--text)] text-xs">✕</button>
        </div>
      )}

      {/* Verification Stats & Notice */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] font-medium">{t("pay.pendingReview")}</span>
            <span className="flex h-2 w-2 rounded-full bg-[var(--info)] animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-[var(--text)] mt-2">{pendingCount}</p>
          <span className="text-[11px] text-[var(--info-foreground)] font-medium">{t("payments.awaiting_owner_trainer_verification")}</span>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
          <span className="text-xs text-[var(--text-muted)] font-medium">{t("payments.status_separation")}</span>
          <p className="text-xs font-semibold text-[var(--text)] mt-2">{t("payments.submitted_approved_activated")}</p>
          <span className="text-[11px] text-[var(--text-muted)] font-medium">{t("payments.strict_zero_trust_manual_verification")}</span>
        </div>

        <div className="p-4 rounded-xl border border-[var(--info)]/20 bg-[var(--info-soft)] shadow-xs">
          <div className="flex items-center gap-2 text-[var(--info-foreground)] text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{t("payments.audit_notice")}</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            {t("payments.manual_approval_confirms_you_verified_funds")}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {[
            { id: "pending_review", label: t("pay.pendingReview") },
            { id: "approved", label: t("pay.approved") },
            { id: "rejected", label: t("pay.rejected") },
            { id: "all", label: t("payments.all_submissions") },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === tab.id
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {tab.label}
              {tab.id === "pending_review" && pendingCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--info)] text-[var(--text-inverse)] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder={t("payments.search_invoice_or_utr")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--text)] focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2" />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSubmissions}
            className="h-8 px-2.5 border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                <th className="p-3.5">{t("payments.submission_info")}</th>
                <th className="p-3.5">{t("pay.invoiceNo")}</th>
                <th className="p-3.5">{t("payments.amount_paid_2")}</th>
                <th className="p-3.5">{t("payments.method_reference")}</th>
                <th className="p-3.5">{t("payments.date_time")}</th>
                <th className="p-3.5">{t("common.status")}</th>
                <th className="p-3.5 text-right">{t("attendance.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length > 0 ? (
                filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[var(--surface-hover)]/50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-[var(--text)] flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>{t("payments.member_substring", undefined, { substring: sub.member_id.substring(0, 8) })}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">{t("payments.sub_id_substring", undefined, { substring: sub.id.substring(0, 8) })}</span>
                    </td>

                    <td className="p-3.5 font-mono font-medium text-[var(--text-secondary)]">
                      {sub.invoice_id}
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono font-bold text-emerald-500 text-sm">
                        ₹{(sub.amount_paid ?? sub.amount ?? 0).toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-medium text-[var(--text)]">
                        {sub.payment_method === "upi" ? (
                          <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                        ) : sub.payment_method === "qr" ? (
                          <QrCode className="w-3.5 h-3.5 text-blue-500" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                        )}
                        <span className="uppercase">{sub.payment_method}</span>
                      </div>
                      {(sub.transaction_reference || sub.transaction_ref) && (
                        <span className="text-[10px] font-mono text-[var(--text-muted)] block">
                          {t("payments.ref_value", undefined, { value: sub.transaction_reference || sub.transaction_ref })}</span>
                      )}
                    </td>

                    <td className="p-3.5 text-[var(--text-muted)]">
                      {sub.payment_date || sub.submitted_at || sub.created_at ? new Date(sub.payment_date || sub.submitted_at || sub.created_at!).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) : t("payments.date_unavailable")}
                    </td>

                    <td className="p-3.5">
                      {sub.status === "pending_review" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--info-soft)] text-[var(--info-foreground)] border border-[var(--info)]/20">
                          {richText(t("payments.clockpending_review"), { clock: <Clock className="w-3 h-3" /> })}</span>
                      )}
                      {sub.status === "approved" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--success-soft)] text-[var(--success-foreground)] border border-[var(--success)]/20">
                          {richText(t("payments.checkcircle2approved"), { checkcircle2: <CheckCircle2 className="w-3 h-3" /> })}</span>
                      )}
                      {sub.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20" title={sub.rejection_reason || undefined}>
                          {richText(t("payments.xcirclerejected"), { xcircle: <XCircle className="w-3 h-3" /> })}</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSub(sub);
                            setPreviewReceiptOpen(true);
                          }}
                          className="h-7 px-2 text-xs border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] gap-1"
                        >
                          {richText(t("payments.eyereceipt"), { eye: <Eye className="w-3 h-3" /> })}</Button>

                        {sub.status === "pending_review" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedSub(sub);
                                setApproveConfirmOpen(true);
                              }}
                              className="h-10 px-3 text-xs bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-semibold gap-1"
                            >
                              {richText(t("payments.checkapprove"), { check: <Check className="w-3 h-3" /> })}</Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSub(sub);
                                setRejectionReason("");
                                setRejectModalOpen(true);
                              }}
                              className="h-7 px-2 text-xs border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 gap-1"
                            >
                              {richText(t("payments.xreject"), { x: <X className="w-3 h-3" /> })}</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--text-muted)] space-y-2">
                    <Receipt className="w-6 h-6 mx-auto opacity-40" />
                    <p className="text-xs font-semibold text-[var(--text)]">{t("payments.no_submissions_found")}</p>
                    <p className="text-[11px]">
                      {filterStatus === "pending_review"
                        ? t("payments.there_are_currently_no_manual_payment")
                        : t("payments.no_matching_payment_submissions_match_the")}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {previewReceiptOpen && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[var(--background)] rounded-2xl border border-[var(--border)] p-6 max-w-xl w-full shadow-2xl space-y-4 text-[var(--text)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-sm">{t("payments.payment_receipt_details")}</h3>
              </div>
              <button
                onClick={() => setPreviewReceiptOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">{t("payments.amount_paid_2")}</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{(selectedSub.amount_paid ?? selectedSub.amount ?? 0).toLocaleString("en-IN")}</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">{t("payments.payment_method")}</span>
                <p className="text-sm font-semibold capitalize text-[var(--text)] mt-1">{selectedSub.payment_method}</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">{t("payments.transaction_id_utr")}</span>
                <p className="font-mono text-xs text-[var(--text)] mt-1">{selectedSub.transaction_reference || selectedSub.transaction_ref || t("payments.not_provided")}</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">{t("payments.submission_date")}</span>
                <p className="text-xs text-[var(--text)] mt-1">{selectedSub.submitted_at || selectedSub.payment_date || selectedSub.created_at ? new Date(selectedSub.submitted_at || selectedSub.payment_date || selectedSub.created_at!).toLocaleString() : t("payments.date_unavailable")}</p>
              </div>
            </div>

            {selectedSub.notes && (
              <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs">
                <span className="text-[var(--text-muted)]">{t("payments.member_note")}</span>
                <p className="text-[var(--text)] mt-0.5">{selectedSub.notes}</p>
              </div>
            )}

            {/* Receipt Media Preview */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--text)]">{t("payments.uploaded_receipt_screenshot")}</span>
              <div className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col items-center justify-center min-h-[220px] max-h-[360px] overflow-auto">
                <AuthImage
                  src={repsiApi.getReceiptUrl(selectedSub.id)}
                  alt={t("payments.receipt_preview")}
                  className="max-h-[340px] max-w-full rounded"
                />
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => openProtectedFile(repsiApi.getReceiptUrl(selectedSub.id))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-xs text-[var(--text)] font-medium transition-colors"
                  >
                    {richText(t("payments.externallinkopen_original_document_new_tab"), { externallink: <ExternalLink className="w-3.5 h-3.5" /> })}</button>
                </div>
              </div>
            </div>

            {selectedSub.status === "rejected" && selectedSub.rejection_reason && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
                <span className="font-semibold">{t("payments.rejection_reason")}{" "}</span>
                {selectedSub.rejection_reason}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewReceiptOpen(false)}
                className="bg-[var(--surface)] border-[var(--border)] text-[var(--text)] text-xs"
              >
                {t("common.close")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approveConfirmOpen && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[var(--background)] rounded-2xl border border-emerald-500/40 p-6 max-w-md w-full shadow-2xl space-y-4 text-[var(--text)]">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-base">{t("payments.approve_manual_payment")}</h3>
            </div>

            <p className="text-xs text-[var(--text)]">
              {t("payments.you_are_approving_a_payment_of")}{" "}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{(selectedSub.amount_paid ?? selectedSub.amount ?? 0).toLocaleString("en-IN")}</span> {t("payments.for_invoice")}{" "}
              <span className="font-mono font-bold text-[var(--text)]">{selectedSub.invoice_id}</span>.
            </p>

            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-[var(--text)] space-y-1.5">
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">{t("payments.atomic_actions_upon_approval")}</p>
              <ul className="list-disc list-inside space-y-0.5 text-[var(--text-muted)]">
                <li>{t("payments.creates_official_payment_ledger_record")}</li>
                <li>{t("payments.marks_invoice_as_fully_paid")}</li>
                <li>{t("payments.restores_member_attendance_active_gym_access")}</li>
                <li>{t("payments.records_immutable_audit_trail_with_reviewer")}</li>
              </ul>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
                {actionError}
              </div>
            )}

            <div className="pt-2 flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApproveConfirmOpen(false)}
                disabled={actionLoading}
                className="bg-[var(--surface)] border-[var(--border)] text-[var(--text)] text-xs"
              >
                {t("common.cancel")}
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-bold text-xs gap-1.5"
              >
                {actionLoading ? (
                  <>
                    {richText(t("payments.loader2approving"), { loader2: <Loader2 className="w-3.5 h-3.5 animate-spin" /> })}</>
                ) : (
                  <>
                    {richText(t("payments.checkconfirm_activate_access"), { check: <Check className="w-3.5 h-3.5" /> })}</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <form onSubmit={handleReject} className="bg-[var(--background)] rounded-2xl border border-rose-500/40 p-6 max-w-md w-full shadow-2xl space-y-4 text-[var(--text)]">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <XCircle className="w-5 h-5" />
              <h3 className="font-bold text-base">{t("payments.reject_payment_submission")}</h3>
            </div>

            <p className="text-xs text-[var(--text)]">
              {t("payments.provide_a_clear_reason_why_this")}
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text)]">{t("pay.rejectionReason")}</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t("payments.e_g_utr_number_not_found")}
                className="w-full h-24 p-3 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-xs text-[var(--text)] focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
                {actionError}
              </div>
            )}

            <div className="pt-2 flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectModalOpen(false)}
                disabled={actionLoading}
                className="bg-[var(--surface)] border-[var(--border)] text-[var(--text)] text-xs"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionLoading || !rejectionReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-[var(--primary-foreground)] font-bold text-xs gap-1.5"
              >
                {actionLoading ? (
                  <>
                    {richText(t("payments.loader2rejecting"), { loader2: <Loader2 className="w-3.5 h-3.5 animate-spin" /> })}</>
                ) : (
                  <>
                    {richText(t("payments.xreject_submission"), { x: <X className="w-3.5 h-3.5" /> })}</>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
