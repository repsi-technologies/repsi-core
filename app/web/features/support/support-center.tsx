"use client";

import { useCallback, useEffect, useState } from "react";
import { LifeBuoy, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyBlock, Field, LoadingRow, Modal, Notice, inputClass } from "@/features/fitness/shared";
import { formatDateTime, supportApi, type SupportTicket } from "@/lib/operations-api";

const STATUS_LABEL: Record<string, string> = {
  open: "Open", in_progress: "In progress", waiting_on_customer: "Waiting on you", resolved: "Resolved", closed: "Closed",
};

function statusVariant(s: string): "active" | "expiring" | "default" {
  if (s === "resolved" || s === "closed") return "default";
  if (s === "waiting_on_customer") return "expiring";
  return "active";
}

function NewTicket({ onCreated, onClose }: { onCreated: (t: SupportTicket) => void; onClose: () => void }) {
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
    <Modal title="Contact REPSI support" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <Notice kind="error">{error}</Notice>}
        <Field label="Subject" htmlFor="ticket-subject">
          <input id="ticket-subject" required minLength={4} className={inputClass} value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Topic" htmlFor="ticket-category">
            <select id="ticket-category" className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="technical">Something isn't working</option>
              <option value="billing">Billing</option>
              <option value="account">Account and access</option>
              <option value="data">Data and imports</option>
              <option value="feature_request">Feature request</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Priority" htmlFor="ticket-priority">
            <select id="ticket-priority" className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent – the gym can't operate</option>
            </select>
          </Field>
        </div>
        <Field label="What happened?" htmlFor="ticket-message" hint="Include the screen, what you expected and what you saw.">
          <textarea id="ticket-message" required minLength={5} rows={5} className={inputClass} value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={saving}>Send</Button>
        </div>
      </form>
    </Modal>
  );
}

function Thread({ ticketId, onClose, onChanged }: { ticketId: string; onClose: () => void; onChanged: () => void }) {
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
    <Modal title={ticket ? `${ticket.number} · ${ticket.subject}` : "Ticket"} onClose={onClose} wide>
      {!ticket ? <LoadingRow /> : (
        <div className="space-y-3">
          {error && <Notice kind="error">{error}</Notice>}
          <ol className="space-y-2 max-h-[50vh] overflow-y-auto" aria-live="polite">
            {ticket.messages?.map((m) => (
              <li key={m.id} className={`rounded-xl border px-3 py-2 text-sm ${m.from_support ? "border-[var(--primary)]/30 bg-[var(--primary-soft)]" : "border-[var(--border)]"}`}>
                <p className="text-xs text-[var(--text-muted)]">{m.from_support ? "REPSI Support" : m.author || "You"} · {formatDateTime(m.created_at)}</p>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
              </li>
            ))}
          </ol>
          {ticket.resolution && <Notice kind="success">Resolution: {ticket.resolution}</Notice>}
          {ticket.status !== "closed" && (
            <form onSubmit={send} className="space-y-2">
              <label htmlFor="ticket-reply" className="sr-only">Reply</label>
              <textarea id="ticket-reply" rows={3} className={inputClass} placeholder="Write a reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
              <div className="flex justify-between">
                <Button type="button" variant="ghost" size="sm" onClick={async () => { await supportApi.close(ticketId); onChanged(); onClose(); }}>
                  Close ticket
                </Button>
                <Button type="submit" size="sm" loading={sending}><Send aria-hidden /> Send reply</Button>
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
          <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Support</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Questions or problems with REPSI? Our team replies here.</p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}><Plus aria-hidden /> New request</Button>
      </div>
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      {tickets === null ? <LoadingRow /> : tickets.length === 0 ? (
        <EmptyBlock title="No support requests">
          <span className="inline-flex items-center gap-1"><LifeBuoy className="h-3.5 w-3.5" aria-hidden /> Raise one any time.</span>
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
