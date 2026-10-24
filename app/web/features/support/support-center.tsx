"use client";

import { useCallback, useEffect, useState } from "react";
import { LifeBuoy, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyBlock, Field, LoadingRow, Modal, Notice, inputClass } from "@/features/fitness/shared";
import { formatDateTime, supportApi, type SupportTicket } from "@/lib/operations-api";
import { useTranslation, tr, richText } from "@/lib/i18n";

const STATUS_LABEL: Record<string, string> = {
  open: "Open", in_progress: "In progress", waiting_on_customer: "Waiting on you", resolved: "Resolved", closed: "Closed",
};

function statusVariant(s: string): "active" | "expiring" | "default" {
  if (s === "resolved" || s === "closed") return "default";
  if (s === "waiting_on_customer") return "expiring";
  return "active";
}

function NewTicket({ onCreated, onClose }: { onCreated: (t: SupportTicket) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ subject: "", category: "technical", priority: "normal", message: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      onCreated(await supportApi.create(form));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title={t("support.contact_repsi_support")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <Notice kind="error">{error}</Notice>}
        <Field label={t("support.subject")} htmlFor="ticket-subject">
          <input id="ticket-subject" required minLength={4} className={inputClass} value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("support.topic")} htmlFor="ticket-category">
            <select id="ticket-category" className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="technical">{t("support.something_isn_t_working")}</option>
              <option value="billing">{t("support.billing")}</option>
              <option value="account">{t("support.account_and_access")}</option>
              <option value="data">{t("support.data_and_imports")}</option>
              <option value="feature_request">{t("support.feature_request")}</option>
              <option value="other">{t("support.other")}</option>
            </select>
          </Field>
          <Field label={t("support.priority")} htmlFor="ticket-priority">
            <select id="ticket-priority" className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">{t("support.low")}</option>
              <option value="normal">{t("support.normal")}</option>
              <option value="high">{t("support.high")}</option>
              <option value="urgent">{t("support.urgent_the_gym_can_t_operate")}</option>
            </select>
          </Field>
        </div>
        <Field label={t("support.what_happened")} htmlFor="ticket-message" hint={t("support.include_the_screen_what_you_expected")}>
          <textarea id="ticket-message" required minLength={5} rows={5} className={inputClass} value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="submit" size="sm" loading={saving}>{t("ai.send")}</Button>
        </div>
      </form>
    </Modal>
  );
}

function Thread({ ticketId, onClose, onChanged }: { ticketId: string; onClose: () => void; onChanged: () => void }) {
  const { t } = useTranslation();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  useEffect(() => {
    supportApi.get(ticketId).then(setTicket).catch((e) => setError(e.message));
  }, [ticketId]);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      setTicket(await supportApi.reply(ticketId, reply.trim()));
      setReply("");
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };
  return (
    <Modal title={ticket ? `${ticket.number} · ${ticket.subject}` : t("support.ticket")} onClose={onClose} wide>
      {!ticket ? <LoadingRow /> : (
        <div className="space-y-3">
          {error && <Notice kind="error">{error}</Notice>}
          <ol className="space-y-2 max-h-[50vh] overflow-y-auto" aria-live="polite">
            {ticket.messages?.map((m) => (
              <li key={m.id} className={`rounded-xl border px-3 py-2 text-sm ${m.from_support ? "border-[var(--primary)]/30 bg-[var(--primary-soft)]" : "border-[var(--border)]"}`}>
                <p className="text-xs text-[var(--text-muted)]">{m.from_support ? t("support.repsi_support") : m.author || t("support.you")} · {formatDateTime(m.created_at)}</p>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
              </li>
            ))}
          </ol>
          {ticket.resolution && <Notice kind="success">{t("support.resolution_resolution", undefined, { resolution: ticket.resolution })}</Notice>}
          {ticket.status !== "closed" && (
            <form onSubmit={send} className="space-y-2">
              <label htmlFor="ticket-reply" className="sr-only">{t("support.reply")}</label>
              <textarea id="ticket-reply" rows={3} className={inputClass} placeholder={t("support.write_a_reply")} value={reply} onChange={(e) => setReply(e.target.value)} />
              <div className="flex justify-between">
                <Button type="button" variant="ghost" size="sm" onClick={async () => { await supportApi.close(ticketId); onChanged(); onClose(); }}>
                  {t("support.close_ticket")}
                </Button>
                <Button type="submit" size="sm" loading={sending}>{richText(t("support.sendsend_reply"), { send: <Send aria-hidden /> })}</Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}

export function SupportCenter() {
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    supportApi.list().then(setTickets).catch((e) => { setError(e.message); setTickets([]); });
  }, []);
  useEffect(load, [load]);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight">{tr("support.support")}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{tr("support.questions_or_problems_with_repsi_our")}</p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>{richText(tr("support.plusnew_request"), { plus: <Plus aria-hidden /> })}</Button>
      </div>
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      {tickets === null ? <LoadingRow /> : tickets.length === 0 ? (
        <EmptyBlock title={tr("support.no_support_requests")}>
          <span className="inline-flex items-center gap-1">{richText(tr("support.lifebuoyraise_one_any_time"), { lifebuoy: <LifeBuoy className="h-3.5 w-3.5" aria-hidden /> })}</span>
        </EmptyBlock>
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {tickets.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => setOpen(t.id)}
                className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
                <span>
                  <span className="font-medium text-[var(--text)]">{t.subject}</span>
                  <span className="text-sm text-[var(--text-muted)]"> · {t.number} · {formatDateTime(t.last_activity_at || t.created_at)}</span>
                </span>
                <Badge variant={statusVariant(t.status)}>{STATUS_LABEL[t.status] ?? t.status}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
      {creating && <NewTicket onClose={() => setCreating(false)} onCreated={(t) => { setCreating(false); load(); setOpen(t.id); }} />}
      {open && <Thread ticketId={open} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  );
}
