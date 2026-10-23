"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, Loader2, Lock, MessageSquare, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { repsiApi } from "@/lib/api";
import { MemberTraining } from "@/features/fitness/member-training";
import { Field, inputClass, LoadingRow, Modal, Notice, StatusBadge } from "@/features/fitness/shared";

interface Client { client_id: string; name: string; email?: string | null; phone?: string | null; membership_status?: string; assigned_at?: string }
interface Note { id: string; content: string; created_at: string }
interface PtSession { id: string; title: string; scheduled_at: string; status: string; duration_minutes: number }

type Tab = "training" | "notes" | "sessions";

export default function TrainerClientDetailPage(props: { params: Promise<{ workspace: string; id: string }> }) {
  const { workspace, id: clientId } = use(props.params);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("training");

  useEffect(() => {
    repsiApi.getCurrentTrainerClients()
      .then((all: Client[]) => setClient(all.find((c) => c.client_id === clientId) || null))
      .catch(() => setClient(null))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <LoadingRow label="Loading client…" />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <Link href={`/${workspace}/trainer/clients`} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]">
        <ChevronLeft className="h-4 w-4" /> My clients
      </Link>

      {!client ? (
        <Notice kind="error">This member isn&apos;t one of your active clients. Ask the gym owner to assign them to you.</Notice>
      ) : (
        <>
          <Card className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar className="h-14 w-14 border-2 border-[var(--primary)]">
                <AvatarFallback className="font-bold">{client.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-[var(--text)] truncate">{client.name}</h1>
                  {client.membership_status && <StatusBadge status={client.membership_status} />}
                </div>
                <p className="text-xs text-[var(--text-muted)] truncate">{[client.email, client.phone].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            <Link href={`/${workspace}/chat`}><Button size="sm" variant="outline"><MessageSquare /> Message</Button></Link>
          </Card>

          <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-[var(--border)]">
            {([["training", "Training"], ["notes", "Private notes"], ["sessions", "1:1 sessions"]] as [Tab, string][]).map(([id, label]) => (
              <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}
                className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 ${tab === id ? "border-[var(--primary)] font-semibold text-[var(--text)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"}`}>
                {label}
              </button>
            ))}
          </div>

          {tab === "training" && <MemberTraining memberId={clientId} />}
          {tab === "notes" && <NotesTab clientId={clientId} />}
          {tab === "sessions" && <SessionsTab clientId={clientId} clientName={client.name} />}
        </>
      )}
    </div>
  );
}

function NotesTab({ clientId }: { clientId: string }) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    repsiApi.getClientNotes(clientId).then(setNotes).catch(() => setNotes([]));
  }, [clientId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await repsiApi.createClientNote(clientId, text.trim());
      setNotes([created, ...(notes || [])]);
      setText("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
      <Card className="p-4">
        <form onSubmit={add} className="space-y-3">
          <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2"><Lock className="h-4 w-4" /> Private trainer note</h3>
          <p className="text-xs text-[var(--text-muted)]">Visible to trainers and gym staff only — never to the member.</p>
          {error && <Notice kind="error">{error}</Notice>}
          <textarea aria-label="Note" rows={4} value={text} onChange={(e) => setText(e.target.value)} className={inputClass}
            placeholder="e.g. Reported wrist discomfort during overhead press" />
          <Button type="submit" size="sm" disabled={saving || !text.trim()}>{saving && <Loader2 className="animate-spin" />} Save note</Button>
        </form>
      </Card>
      <Card className="p-4">
        {!notes ? <LoadingRow /> : notes.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No notes yet.</p> : (
          <ul className="space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl border border-[var(--border)] p-3">
                <p className="text-xs text-[var(--text-muted)]">{new Date(n.created_at).toLocaleString()}</p>
                <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{n.content}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SessionsTab({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [sessions, setSessions] = useState<PtSession[] | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("1-on-1 Personal Training");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    repsiApi.getTrainerSessions(clientId).then(setSessions).catch(() => setSessions([]));
  }, [clientId]);
  useEffect(load, [load]);

  const schedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time || !title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await repsiApi.createTrainerSession({ title: title.trim(), client_id: clientId, scheduled_at: new Date(time).toISOString(), duration_minutes: duration });
      setOpen(false);
      setTime("");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">In-person sessions on your trainer calendar.</p>
        <Button size="sm" onClick={() => setOpen(true)}><Plus /> Schedule session</Button>
      </div>
      {!sessions ? <LoadingRow /> : sessions.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No sessions scheduled.</p> : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <Card className="p-3 flex items-center justify-between gap-2 text-sm">
                <span>
                  <span className="block font-medium text-[var(--text)]">{s.title}</span>
                  <span className="block text-xs text-[var(--text-muted)] flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(s.scheduled_at).toLocaleString()} · {s.duration_minutes} min</span>
                </span>
                <StatusBadge status={s.status.toLowerCase()} />
              </Card>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <Modal title={`Schedule session for ${clientName}`} onClose={() => setOpen(false)}>
          <form onSubmit={schedule} className="space-y-3">
            {error && <Notice kind="error">{error}</Notice>}
            <Field label="Title" htmlFor="pt-title"><input id="pt-title" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date & time" htmlFor="pt-time"><input id="pt-time" type="datetime-local" required value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} /></Field>
              <Field label="Duration (min)" htmlFor="pt-dur"><input id="pt-dur" type="number" min={5} max={480} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass} /></Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Schedule</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
