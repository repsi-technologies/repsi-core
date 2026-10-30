"use client";

import { openProtectedFile } from "@/components/ui/auth-image";
import { PaymentMethodsCard } from "@/features/payments/payment-methods-card";
import { useState, useEffect, use } from "react";
import { 
  Banknote, 
  CheckCircle2, 
  XCircle,
  Clock,
  Download, 
  Receipt, 
  CreditCard, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  RefreshCw
} from "lucide-react";
import { repsiApi, ApiPaymentSubmission } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MemberFeePaymentDialog } from "@/features/payments/member-fee-payment-dialog";

export default function MemberPaymentsPage(props: { params: Promise<{ workspace: string }> }) {
  const params = use(props.params);
  const [payments, setPayments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<ApiPaymentSubmission[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Invoice for demo / member
  const [selectedInvoice, setSelectedInvoice] = useState<{
    id: string;
    amount: number;
    amount_paid?: number;
    outstanding_balance?: number;
    due_date?: string;
    plan_name?: string;
  } | null>(null);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payData, subData, invData] = await Promise.all([
        repsiApi.getPayments(),
        repsiApi.getPaymentSubmissions().catch(() => []),
        repsiApi.getInvoices(),
      ]);
      setPayments(payData);
      setSubmissions(subData);
      setInvoices(invData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("repsi_storage_update", handleUpdate);
    return () => window.removeEventListener("repsi_storage_update", handleUpdate);
  }, []);

  const pendingSub = submissions.find((s) => s.status === "pending_review");
  const rejectedSub = submissions.find((s) => s.status === "rejected");

  // The member's real dues: the invoice a receipt is about, else the oldest one with a balance.
  const owing = invoices
    .filter((i) => (i.outstanding_balance ?? i.total_amount - (i.amount_paid ?? 0)) > 0 && i.status !== "paid" && i.status !== "void")
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));
  const inv = invoices.find((i) => i.id === (pendingSub?.invoice_id || rejectedSub?.invoice_id)) ?? owing[0];
  const currentInvoice = inv
    ? {
        id: inv.id as string,
        number: inv.invoice_number as string,
        amount: Number(inv.total_amount),
        amount_paid: Number(inv.amount_paid ?? 0),
        outstanding_balance: Number(inv.outstanding_balance ?? inv.total_amount - (inv.amount_paid ?? 0)),
        due_date: inv.due_date ? new Date(inv.due_date).toLocaleDateString(undefined, { dateStyle: "medium" }) : undefined,
        plan_name: (inv.notes as string) || "Membership fee",
      }
    : null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">My Membership & Payments</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Pay membership fees directly via owner UPI/QR/Bank transfer, track verification, and download tax receipts.
        </p>
      </div>

      <PaymentMethodsCard />

      {/* Outstanding Invoice Banner */}
      {loading ? null : !currentInvoice ? (
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-muted)]">
          No dues right now. When the gym bills you, the invoice appears here and you can pay it with the details above.
        </div>
      ) : (
      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[var(--text-muted)]">Invoice #{currentInvoice.number}</span>
              {pendingSub ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Clock className="w-3 h-3" />
                  Receipt Verification Pending
                </span>
              ) : rejectedSub ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <XCircle className="w-3 h-3" />
                  Receipt Rejected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <AlertCircle className="w-3 h-3" />
                  Payment Due
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-[var(--text)] mt-1">{currentInvoice.plan_name}</h2>
            {currentInvoice.due_date && <p className="text-xs text-[var(--text-muted)]">Due by {currentInvoice.due_date}</p>}
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-[var(--text-muted)]">Outstanding Balance</span>
            <p className="text-2xl font-extrabold text-[var(--text)] mt-0.5">
              ₹{currentInvoice.outstanding_balance.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Status Message or Action */}
        {pendingSub ? (
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-500">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Payment Receipt Submitted on {pendingSub.submitted_at || pendingSub.payment_date || pendingSub.created_at ? new Date(pendingSub.submitted_at || pendingSub.payment_date || pendingSub.created_at!).toLocaleDateString() : "date unavailable"}</span>
            </div>
            <p className="text-xs text-zinc-400">
              Your receipt for ₹{pendingSub.amount_paid ?? pendingSub.amount ?? 0} is currently under review by the gym owner or trainer. Gym check-in access will activate automatically upon approval.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedInvoice(currentInvoice);
                  setPaymentDialogOpen(true);
                }}
                className="h-7 text-xs border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                View Submitted Details / Instructions
              </Button>
            </div>
          </div>
        ) : rejectedSub ? (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>Previous Receipt Rejected: {rejectedSub.rejection_reason || "Invalid proof"}</span>
            </div>
            <p className="text-xs text-zinc-400">
              Please inspect the gym&apos;s payment instructions and submit a corrected receipt or screenshot.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setSelectedInvoice(currentInvoice);
                setPaymentDialogOpen(true);
              }}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-bold text-xs gap-1.5"
            >
              Resubmit Corrected Payment Proof →
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-xs text-[var(--text-muted)]">
              Support direct UPI, QR code scanning, GPay/PhonePe number, and Bank Transfer.
            </div>
            <Button
              onClick={() => {
                setSelectedInvoice(currentInvoice);
                setPaymentDialogOpen(true);
              }}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-bold text-xs gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              Pay Membership Fee & Submit Receipt
            </Button>
          </div>
        )}
      </div>

      )}

      {/* Past Submissions Tracker */}
      {submissions.length > 0 && (
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="text-sm font-bold text-[var(--text)]">My Submitted Payment Receipts</h3>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">{submissions.length} Total</span>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {submissions.map((sub) => (
              <div key={sub.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--text)]">Invoice #{sub.invoice_id}</span>
                    <span className="text-xs font-semibold text-emerald-500">₹{(sub.amount_paid ?? sub.amount ?? 0).toLocaleString("en-IN")}</span>
                    <span className="text-[10px] uppercase text-[var(--text-muted)] font-medium">via {sub.payment_method}</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Submitted: {sub.submitted_at || sub.payment_date || sub.created_at ? new Date(sub.submitted_at || sub.payment_date || sub.created_at!).toLocaleString() : "date unavailable"}
                    {sub.transaction_reference && ` • Ref: ${sub.transaction_reference}`}
                  </p>
                  {sub.rejection_reason && (
                    <p className="text-[11px] text-rose-400 font-medium">Rejection Reason: {sub.rejection_reason}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {sub.status === "pending_review" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Pending Review
                    </span>
                  )}
                  {sub.status === "approved" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Approved & Active
                    </span>
                  )}
                  {sub.status === "rejected" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      Rejected
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => openProtectedFile(repsiApi.getReceiptUrl(sub.id))}
                    className="p-1 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                    title="View Uploaded Receipt"
                    aria-label="View uploaded receipt"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official Transaction History */}
      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[var(--primary-dark)] dark:text-[var(--primary-hover)]" />
            <h2 className="text-sm font-bold text-[var(--text)]">Official Payment Ledger & Tax Receipts</h2>
          </div>
          <span className="text-xs font-medium text-emerald-600">GST Compliant</span>
        </div>

        {payments.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {payments.map((pay) => (
              <div key={pay.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-[var(--text)]">{pay.plan || "Gym Membership"}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{pay.id} • {pay.date} via {pay.method.toUpperCase()}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[var(--text)]">{formatCurrency(pay.amount)}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                    {pay.status}
                  </span>
                  <button
                    className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                    title="Download Receipt PDF"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="p-8 text-center space-y-2">
              <Receipt className="h-6 w-6 text-[var(--text-muted)] mx-auto opacity-40" />
              <p className="text-xs font-semibold text-[var(--text)]">No finalized transactions yet</p>
              <p className="text-[11px] text-[var(--text-muted)]">Verified payment receipts will appear here after approval.</p>
            </div>
          )
        )}
      </div>

      {/* Payment Dialog */}
      {paymentDialogOpen && selectedInvoice && (
        <MemberFeePaymentDialog
          invoice={selectedInvoice}
          onClose={() => setPaymentDialogOpen(false)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}
