"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, RotateCcw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { memberRequest } from "@/lib/api";
import { EmptyBlock, Field, LoadingRow, Modal, Notice, inputClass, isoDate } from "@/features/fitness/shared";
import { financeApi, formatDateTime, formatMoney, type DueItem, type Reconciliation } from "@/lib/operations-api";
import { useTranslation, richText } from "@/lib/i18n";

interface PaymentRow {
  id: string;
  member_id: string;
  amount: number;
  method: string;
  status: string;
  paid_at: string;
  receipt_number?: string | null;
  refunded_amount?: number;
}

const METHODS = ["cash", "upi", "card", "netbanking", "cheque"];

function RefundDialog({ payment, onDone, onClose }: { payment: PaymentRow; onDone: () => void; onClose: () => void }) {
  const { t } = useTranslation();
  const refundable = payment.amount - (payment.refunded_amount || 0);
  const [amount, setAmount] = useState(String(refundable));
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState("original_method");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await financeApi.refund(payment.id, { amount: Number(amount), reason, method });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title={`Refund ${payment.receipt_number || "payment"}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <Notice kind="error">{error}</Notice>}
        <p className="text-sm text-[var(--text-secondary)]">{t("payments.up_to_valuecan_be_refunded_the", undefined, { value: formatMoney(refundable) })}</p>
        <Field label={t("common.amount")} htmlFor="refund-amount">
          <input id="refund-amount" type="number" min={0.01} step="0.01" max={refundable} required className={inputClass}
            value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label={t("payments.paid_back_by")} htmlFor="refund-method">
          <select id="refund-method" className={inputClass} value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="original_method">{t("payments.same_method_as_the_payment")}</option>
            <option value="cash">{t("payments.cash")}</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">{t("payments.bank_transfer")}</option>
            <option value="card">{t("payments.card")}</option>
          </select>
        </Field>
        <Field label={t("organization.reason")} htmlFor="refund-reason">
          <textarea id="refund-reason" required minLength={3} rows={2} className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="submit" variant="destructive" size="sm" loading={saving}>{t("payments.record_refund")}</Button>
        </div>
      </form>
    </Modal>
  );
}

function DayClose({ onClosed }: { onClosed: () => void }) {
  const { t } = useTranslation();
  const [day, setDay] = useState(isoDate());
  const [expected, setExpected] = useState<Record<string, number> | null>(null);
  const [counted, setCounted] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setExpected(null);
    financeApi.expected(day).then((r) => {
      setExpected(r.expected);
      setCounted(Object.fromEntries(METHODS.filter((m) => m in r.expected || m === "cash").map((m) => [m, String(r.expected[m] ?? 0)])));
    }).catch((e) => setError(e.message));
  }, [day]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await financeApi.closeDay(day, Object.fromEntries(Object.entries(counted).map(([k, v]) => [k, Number(v) || 0])), notes || undefined);
      onClosed();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
      <h2 className="text-base font-semibold text-[var(--text)]">{t("payments.close_the_day")}</h2>
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      <Field label={t("payments.business_day")} htmlFor="close-day">
        <input id="close-day" type="date" max={isoDate()} className={`${inputClass} max-w-xs`} value={day} onChange={(e) => setDay(e.target.value)} />
      </Field>
      {expected === null ? <LoadingRow /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.keys(counted).map((m) => (
            <Field key={m} label={`${m.toUpperCase()} counted (system: ${formatMoney(expected[m] ?? 0)})`} htmlFor={`count-${m}`}>
              <input id={`count-${m}`} type="number" step="0.01" min={0} className={inputClass} value={counted[m]}
                onChange={(e) => setCounted({ ...counted, [m]: e.target.value })} />
            </Field>
          ))}
        </div>
      )}
      <Field label={t("payments.notes")} htmlFor="close-notes">
        <input id="close-notes" className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <Button type="submit" size="sm" loading={saving}>{t("payments.close_day")}</Button>
    </form>
  );
}

export function FinanceTools() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<PaymentRow[] | null>(null);
  const [dues, setDues] = useState<{ total: number; by_age: Record<string, number>; items: DueItem[] } | null>(null);
  const [history, setHistory] = useState<Reconciliation[]>([]);
  const [refunding, setRefunding] = useState<PaymentRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    memberRequest("/payments/", "GET", undefined, "Could not load payments").then(setPayments).catch((e) => { setError(e.message); setPayments([]); });
    financeApi.dues().then(setDues).catch(() => setDues({ total: 0, by_age: {}, items: [] }));
    financeApi.history().then(setHistory).catch(() => setHistory([]));
  }, []);
  useEffect(load, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight">{t("payments.receipts_refunds_and_day_close")}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">{t("payments.download_receipts_refund_payments_chase_dues")}</p>
      </div>
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      {notice && <Notice kind="success" onDismiss={() => setNotice(null)}>{notice}</Notice>}

      <section aria-labelledby="dues-heading" className="space-y-2">
        <h2 id="dues-heading" className="text-base font-semibold text-[var(--text)]">
          {t("ai.outstanding_dues")}{" "}{dues && <span className="text-[var(--text-muted)] font-normal">· {formatMoney(dues.total)}</span>}
        </h2>
        {dues === null ? <LoadingRow /> : dues.items.length === 0 ? <EmptyBlock title={t("payments.no_outstanding_dues")} /> : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-secondary)] text-xs text-[var(--text-secondary)]">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">{t("pay.member")}</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">{t("payments.invoice")}</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">{t("members.balance")}</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">{t("payments.overdue")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {dues.items.map((d) => (
                  <tr key={d.invoice_id}>
                    <td className="px-3 py-2">{d.member_name}<span className="block text-xs text-[var(--text-muted)]">{d.phone}</span></td>
                    <td className="px-3 py-2">{d.invoice_number}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatMoney(d.balance)}</td>
                    <td className="px-3 py-2 text-right"><Badge variant={d.days_overdue > 30 ? "expired" : d.days_overdue > 0 ? "expiring" : "default"}>{d.days_overdue} days</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="payments-heading" className="space-y-2">
        <h2 id="payments-heading" className="text-base font-semibold text-[var(--text)]">{t("payments.recent_payments")}</h2>
        {payments === null ? <LoadingRow /> : payments.length === 0 ? <EmptyBlock title={t("payments.no_payments_yet")} /> : (
          <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <span className="font-medium tabular-nums">{formatMoney(p.amount)}</span>
                  <span className="text-[var(--text-muted)]"> · {p.method.toUpperCase()} · {formatDateTime(p.paid_at)}</span>
                  {p.receipt_number && <span className="block text-xs text-[var(--text-muted)]">{p.receipt_number}</span>}
                </span>
                <span className="flex items-center gap-2">
                  {(p.refunded_amount || 0) > 0 && <Badge variant="expiring">{t("payments.refunded_value", undefined, { value: formatMoney(p.refunded_amount) })}</Badge>}
                  <Button size="sm" variant="outline" aria-label={`Download receipt ${p.receipt_number || ""}`}
                    onClick={() => financeApi.downloadReceipt(p.id, p.receipt_number).catch((e) => setError(e.message))}>
                    {richText(t("payments.downloadreceipt"), { download: <Download aria-hidden /> })}</Button>
                  {p.status !== "refunded" && (
                    <Button size="sm" variant="ghost" onClick={() => setRefunding(p)}>{richText(t("payments.rotateccwrefund"), { rotateccw: <RotateCcw aria-hidden /> })}</Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DayClose onClosed={() => { setNotice(t("payments.day_closed")); load(); }} />

      <section aria-labelledby="history-heading" className="space-y-2">
        <h2 id="history-heading" className="text-base font-semibold text-[var(--text)]">{t("payments.day_close_history")}</h2>
        {history.length === 0 ? <EmptyBlock title={t("payments.no_days_closed_yet")} /> : (
          <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span><Wallet className="inline h-4 w-4 mr-1 text-[var(--text-muted)]" aria-hidden />{h.business_date}</span>
                <span className="flex items-center gap-2 tabular-nums">
                  {formatMoney(h.total_counted)} counted
                  <Badge variant={h.total_variance === 0 ? "active" : "expired"}>
                    {h.total_variance === 0 ? t("payments.balanced") : t("payments.variance_value", undefined, { value: formatMoney(h.total_variance) })}
                  </Badge>
                  {h.status === "reopened" && <Badge variant="outline">{t("payments.reopened")}</Badge>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {refunding && <RefundDialog payment={refunding} onClose={() => setRefunding(null)}
        onDone={() => { setRefunding(null); setNotice(t("payments.refund_recorded_and_the_member_was")); load(); }} />}
    </div>
  );
}
