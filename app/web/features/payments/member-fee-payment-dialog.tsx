"use client";

import { AuthImage } from "@/components/ui/auth-image";
import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  QrCode, 
  Copy, 
  Check, 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
  Info,
  Loader2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  repsiApi, 
  ApiPaymentInstructions, 
  ApiPaymentSubmission 
} from "@/lib/api";
import { useTranslation, richText } from "@/lib/i18n";

interface MemberFeePaymentDialogProps {
  invoice: {
    id: string;
    amount: number;
    amount_paid?: number;
    outstanding_balance?: number;
    due_date?: string;
    plan_name?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function MemberFeePaymentDialog({ invoice, onClose, onSuccess }: MemberFeePaymentDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"instructions" | "submit" | "submitted">("instructions");
  const [instructions, setInstructions] = useState<ApiPaymentInstructions | null>(null);
  const [loadingInstructions, setLoadingInstructions] = useState(true);
  const [instructionsError, setInstructionsError] = useState("");

  // Copy helpers
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Submission Form State
  const amountDue = invoice.outstanding_balance ?? (invoice.amount - (invoice.amount_paid || 0));
  const [amountPaid, setAmountPaid] = useState<number>(amountDue);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "qr" | "phone" | "bank_transfer">("upi");
  const [transactionRef, setTransactionRef] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdSubmission, setCreatedSubmission] = useState<ApiPaymentSubmission | null>(null);

  useEffect(() => {
    async function fetchInstructions() {
      try {
        setLoadingInstructions(true);
        const data = await repsiApi.getInvoicePaymentInstructions(invoice.id);
        setInstructions(data);
      } catch (err: any) {
        setInstructionsError(err.message || t("payments.failed_to_load_payment_instructions_from"));
      } finally {
        setLoadingInstructions(false);
      }
    }
    fetchInstructions();
  }, [invoice.id]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setSubmitError("File exceeds maximum allowed size (10MB).");
        return;
      }
      setReceiptFile(file);
      setSubmitError("");
      if (file.type.startsWith("image/")) {
        setReceiptPreview(URL.createObjectURL(file));
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!receiptFile) {
      setSubmitError("Please upload your payment receipt or transaction screenshot.");
      return;
    }

    if (amountPaid <= 0) {
      setSubmitError("Please enter a valid amount paid.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await repsiApi.submitPaymentReceipt({
        invoice_id: invoice.id,
        amount_paid: amountPaid,
        payment_method: paymentMethod,
        transaction_reference: transactionRef.trim() || undefined,
        payment_date: new Date().toISOString(),
        receipt_file: receiptFile,
        notes: notes.trim() || undefined,
      });

      setCreatedSubmission(res);
      setStep("submitted");
      onSuccess();
    } catch (err: any) {
      setSubmitError(err.message || t("payments.failed_to_submit_receipt_proof_please"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 max-w-xl w-full shadow-2xl space-y-5 text-[var(--text)] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[var(--primary)]" />
            <div>
              <h3 className="font-bold text-sm">{t("payments.pay_membership_fee")}</h3>
              <p className="text-[11px] text-[var(--text-secondary)]">{t("pay.invoiceNo")}{invoice.id} • {invoice.plan_name || t("payments.gym_membership")}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text)] p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount Due Banner */}
        <div className="p-4 rounded-xl bg-[var(--primary-soft)] dark:bg-[var(--primary)]/10 border border-[var(--primary)]/25 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[var(--text-secondary)] font-medium">{t("memberPay.outstanding")}</span>
            <p className="text-2xl font-bold text-[var(--primary-dark)] mt-0.5">₹{amountDue.toLocaleString("en-IN")}</p>
          </div>
          <div className="text-right text-[11px] text-[var(--text-secondary)]">
            <span>{t("payments.direct_to_gym_account")}</span>
            <p className="text-emerald-500 font-semibold">{t("payments.zero_gateway_charges")}</p>
          </div>
        </div>

        {/* STEP 1: PAYMENT INSTRUCTIONS */}
        {step === "instructions" && (
          <div className="space-y-4">
            {loadingInstructions ? (
              <div className="p-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--primary)]" />
                <p className="text-xs text-[var(--text-secondary)]">{t("payments.loading_gym_payment_details")}</p>
              </div>
            ) : instructionsError ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {instructionsError}
              </div>
            ) : instructions ? (
              <>
                {/* Reference Tag Highlight */}
                {instructions.narration_reference && (
                  <div className="p-3.5 rounded-xl border border-[var(--info)]/25 bg-[var(--info-soft)] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[var(--info-foreground)] font-semibold">{t("payments.transfer_reference_code")}</span>
                      <p className="font-mono font-bold text-[var(--text)] text-sm mt-0.5">{instructions.narration_reference}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{t("payments.mention_this_code_in_your_upi")}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(instructions.narration_reference!, "ref")}
                      className="h-8 px-2.5 bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--info-foreground)] hover:text-[var(--text)] text-xs gap-1"
                    >
                      {copiedKey === "ref" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === "ref" ? t("payments.copied") : t("common.copy")}
                    </Button>
                  </div>
                )}

                {/* Available Methods Tabs/Panels */}
                <div className="space-y-3">
                  {/* UPI Section */}
                  {instructions.upi_id && (
                    <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-semibold text-[var(--text)]">
                          <Smartphone className="w-4 h-4 text-[var(--primary)]" />
                          <span>{t("payments.upi_transfer_gpay_phonepe_paytm_bhim")}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(instructions.upi_id!, "upi")}
                          className="h-7 px-2 bg-[var(--surface-hover)] border-[var(--border)] text-xs gap-1"
                        >
                          {copiedKey === "upi" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedKey === "upi" ? t("payments.copied") : t("settings.copy_upi_id")}
                        </Button>
                      </div>
                      <div className="p-2.5 rounded bg-[var(--background-secondary)] font-mono text-[var(--primary-dark)] font-bold flex items-center justify-between">
                        <span>{instructions.upi_id}</span>
                        {instructions.account_name && (
                          <span className="text-[var(--text-secondary)] font-sans text-[11px] font-normal">({instructions.account_name})</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Merchant QR Section */}
                  {instructions.has_qr_code && (
                    <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2 text-xs">
                      <div className="flex items-center gap-2 font-semibold text-[var(--text)]">
                        <QrCode className="w-4 h-4 text-blue-500" />
                        <span>{t("payments.gym_merchant_qr_code")}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--background-secondary)] flex flex-col items-center justify-center">
                        <AuthImage
                          src={repsiApi.getMerchantQrUrl()}
                          alt={t("payments.gym_qr_code")}
                          className="max-h-48 max-w-full rounded-lg border border-[var(--border)] shadow-md"
                        />
                        <span className="text-[10px] text-[var(--text-secondary)] mt-2">{t("payments.scan_using_any_payment_app_gpay")}</span>
                      </div>
                    </div>
                  )}

                  {/* Phone Payment Section */}
                  {instructions.payment_phone && (
                    <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-semibold text-[var(--text)]">
                          <Smartphone className="w-4 h-4 text-indigo-400" />
                          <span>{t("payments.payment_contact_number")}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(instructions.payment_phone!, "phone")}
                          className="h-7 px-2 bg-[var(--surface-hover)] border-[var(--border)] text-xs gap-1"
                        >
                          {copiedKey === "phone" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedKey === "phone" ? t("payments.copied") : t("payments.copy_number")}
                        </Button>
                      </div>
                      <p className="font-mono text-[var(--text)] text-sm font-semibold">{instructions.payment_phone}</p>
                    </div>
                  )}

                  {/* Bank Transfer Section */}
                  {instructions.bank_details?.account_number && (
                    <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-3 text-xs">
                      <div className="flex items-center gap-2 font-semibold text-[var(--text)]">
                        <Building2 className="w-4 h-4 text-[var(--info-foreground)]" />
                        <span>{t("payments.direct_bank_transfer_neft_imps_rtgs")}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-[var(--background-secondary)]">
                          <span className="text-[var(--text-muted)]">{t("payments.account_holder")}</span>
                          <p className="font-semibold text-[var(--text)] mt-0.5">{instructions.bank_details.account_holder_name}</p>
                        </div>
                        <div className="p-2 rounded bg-[var(--background-secondary)]">
                          <span className="text-[var(--text-muted)]">{t("memberPay.bankName")}</span>
                          <p className="font-semibold text-[var(--text)] mt-0.5">{instructions.bank_details.bank_name}</p>
                        </div>
                        <div className="p-2 rounded bg-[var(--background-secondary)] flex items-center justify-between">
                          <div>
                            <span className="text-[var(--text-muted)]">{t("memberPay.accountNo")}</span>
                            <p className="font-mono font-semibold text-[var(--text)] mt-0.5">{instructions.bank_details.account_number}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(instructions.bank_details!.account_number, "bank_acc")}
                            className="text-[var(--text-secondary)] hover:text-[var(--text)] p-1"
                          >
                            {copiedKey === "bank_acc" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="p-2 rounded bg-[var(--background-secondary)] flex items-center justify-between">
                          <div>
                            <span className="text-[var(--text-muted)]">{t("memberPay.ifsc")}</span>
                            <p className="font-mono font-semibold text-[var(--text)] mt-0.5">{instructions.bank_details.ifsc_code}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(instructions.bank_details!.ifsc_code, "ifsc")}
                            className="text-[var(--text-secondary)] hover:text-[var(--text)] p-1"
                          >
                            {copiedKey === "ifsc" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Important Notice */}
                <div className="p-3 rounded-lg bg-[var(--surface-secondary)]/60 border border-[var(--border)] text-[11px] text-[var(--text-secondary)] flex items-start gap-2">
                  <Info className="w-4 h-4 text-[var(--text-secondary)] shrink-0 mt-0.5" />
                  <span>
                    {t("payments.after_completing_the_transfer_in_your")}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={onClose} className="bg-[var(--surface-secondary)] border-[var(--border)] text-xs">
                    {t("common.cancel")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setStep("submit")}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-bold text-xs"
                  >
                    {t("payments.i_have_paid_submit_receipt")}
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* STEP 2: RECEIPT SUBMISSION FORM */}
        {step === "submit" && (
          <form onSubmit={handleSubmitProof} className="space-y-4">
            <div className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-xs flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">{t("payments.paying_for_invoice")}</span>
              <span className="font-mono font-bold text-[var(--text)]">{invoice.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">{t("payments.amount_paid")}</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text)] text-xs font-mono font-bold focus:outline-none focus:border-[var(--primary)]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">{t("memberPay.chooseMethod")}</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text)] text-xs focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="upi">{t("payments.upi_transfer")}</option>
                  <option value="qr">{t("payments.scanned_gym_qr_code")}</option>
                  <option value="phone">{t("payments.phone_payment_gpay_phonepe")}</option>
                  <option value="bank_transfer">{t("payments.direct_bank_transfer")}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">{t("payments.transaction_id_utr_optional")}</label>
              <input
                type="text"
                placeholder={t("payments.e_g_428910284920_or_upi_ref")}
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text)] text-xs font-mono focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            {/* File Upload Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                {t("payments.payment_receipt_screenshot")}{" "}<span className="text-rose-400">*</span>
              </label>
              <div className="p-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/50 flex flex-col items-center justify-center text-center space-y-2 cursor-pointer hover:border-[var(--primary)] transition-colors">
                <input
                  type="file"
                  id="receiptUpload"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="receiptUpload" className="cursor-pointer space-y-1">
                  <Upload className="w-6 h-6 mx-auto text-[var(--primary)]" />
                  <p className="text-xs font-semibold text-[var(--text)]">
                    {receiptFile ? receiptFile.name : t("payments.click_to_select_receipt_screenshot")}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">{t("payments.png_jpg_webp_or_pdf_up")}</p>
                </label>
              </div>

              {receiptPreview && (
                <div className="mt-2 p-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center">
                  <img src={receiptPreview} alt={t("payments.screenshot_preview")} className="max-h-40 rounded object-contain" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">{t("payments.note_for_gym_staff_optional")}</label>
              <input
                type="text"
                placeholder={t("payments.e_g_paid_via_nitheesh_s")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text)] text-xs focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            {submitError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {submitError}
              </div>
            )}

            <div className="p-3 rounded-lg bg-[var(--info-soft)] border border-[var(--info)]/20 text-[11px] text-[var(--text-secondary)] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[var(--info-foreground)] shrink-0 mt-0.5" />
              <span>
                <strong>{t("payments.verification_notice")}</strong> {t("payments.submitting_a_receipt_records_your_proof")}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep("instructions")}
                disabled={isSubmitting}
                className="bg-[var(--surface-secondary)] border-[var(--border)] text-xs text-[var(--text-secondary)]"
              >
                {t("payments.back_to_details")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !receiptFile}
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-bold text-xs gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    {richText(t("payments.loader2submitting_proof"), { loader2: <Loader2 className="w-3.5 h-3.5 animate-spin" /> })}</>
                ) : (
                  <>
                    {richText(t("payments.checkcircle2submit_payment_receipt"), { checkcircle2: <CheckCircle2 className="w-3.5 h-3.5" /> })}</>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: SUBMITTED SUCCESS BANNER */}
        {step === "submitted" && createdSubmission && (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-[var(--text)]">{t("payments.payment_receipt_submitted")}</h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                {t("payments.your_payment_proof_for_invoice")}{" "}<span className="font-mono text-[var(--text)]">#{invoice.id}</span> {t("payments.has_been_securely_recorded")}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-left space-y-1.5 max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{t("payments.submitted_amount")}</span>
                <span className="font-bold text-[var(--text)]">₹{(createdSubmission.amount_paid ?? createdSubmission.amount ?? 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{t("payments.status")}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--info-soft)] text-[var(--info-foreground)] border border-[var(--info)]/20">
                  {richText(t("payments.clockpending_owner_verification"), { clock: <Clock className="w-3 h-3 inline mr-1" /> })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{t("payments.submission_time")}</span>
                <span className="text-[var(--text-secondary)]">{createdSubmission.submitted_at || createdSubmission.payment_date || createdSubmission.created_at ? new Date(createdSubmission.submitted_at || createdSubmission.payment_date || createdSubmission.created_at!).toLocaleTimeString() : t("payments.time_unavailable")}</span>
              </div>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
              {t("payments.your_gym_owner_or_authorized_trainer")}
            </p>

            <div className="pt-2">
              <Button
                onClick={onClose}
                className="bg-[var(--surface-hover)] hover:bg-zinc-700 text-[var(--text)] font-semibold text-xs px-6"
              >
                {t("payments.close_view_status")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
