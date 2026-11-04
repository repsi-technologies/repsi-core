"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flag, Loader2, MessageSquare, Send } from "lucide-react";
import { FormAlert } from "@/components/organization/form-fields";
import { getAuthUser } from "@/lib/auth";
import { repsiApi, type ApiChatMessage, type ApiCoachProfile, type ApiConversation } from "@/lib/api";
import { ReportChatDialog } from "@/features/communications/report-chat-dialog";

/**
 * One-to-one trainer ⇄ member chat. The backend decides who may read or send: trainers only reach
 * members currently assigned to them (with chat permission); members keep read-only history after
 * their trainer is unassigned.
 */
export default function ChatPage() {
  const [me, setMe] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ApiConversation[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ApiChatMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reporting, setReporting] = useState<{ message: ApiChatMessage | null } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isTrainer, setIsTrainer] = useState(false);
  const [picking, setPicking] = useState<ApiCoachProfile[] | null>(null);

  // Members can message any active trainer, not only their assigned one.
  const startChat = async (trainerId: string) => {
    try {
      const c = await repsiApi.openConversation({ trainer_id: trainerId });
      setPicking(null);
      setConversations((cur) => (cur?.some((x) => x.id === c.id) ? cur : [c, ...(cur ?? [])]));
      setActiveId(c.id);
    } catch (err: any) {
      setError(err.message);
    }
  };
  const openPicker = () => repsiApi.getAvailableCoaches().then(setPicking).catch((e: Error) => setError(e.message));

  const loadConversations = useCallback(async () => {
    try {
      const rows = await repsiApi.listConversations();
      setConversations(rows);
      setActiveId((cur) => cur ?? rows[0]?.id ?? null);
    } catch (err: any) {
      setError(err.message);
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    setMe(getAuthUser()?.id ?? null);
    setIsTrainer(getAuthUser()?.role === "TRAINER");
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    setMessages(null);
    repsiApi.listMessages(activeId)
      .then(async (rows) => {
        if (cancelled) return;
        setMessages(rows);
        const updated = await repsiApi.markConversationRead(activeId);
        setConversations((cur) => cur?.map((c) => (c.id === updated.id ? updated : c)) ?? cur);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, [activeId]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages]);

  const active = conversations?.find((c) => c.id === activeId) ?? null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!active || !body) return;
    setSending(true);
    setError(null);
    try {
      const msg = await repsiApi.sendMessage(active.id, body, crypto.randomUUID());
      setMessages((cur) => [...(cur ?? []), msg]);
      setDraft("");
      loadConversations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (conversations === null) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" aria-label="Loading conversations" /></div>;
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-[var(--text)]">Messages</h1>
        {!isTrainer && (
          <button type="button" onClick={openPicker} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[var(--primary)] px-3 text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]">
            <MessageSquare className="h-4 w-4" aria-hidden /> New message
          </button>
        )}
      </div>
      {picking && (
        <div className="mb-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--text)]">Message a trainer</p>
            <button type="button" onClick={() => setPicking(null)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]">Close</button>
          </div>
          {picking.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No trainers available yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {picking.map((t) => (
                <button key={t.id} type="button" onClick={() => startChat(t.id)} className="flex items-center gap-3 rounded-[10px] border border-[var(--border)] p-2.5 text-left hover:border-[var(--primary)]/50 hover:bg-[var(--background)]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-bold text-[var(--primary-dark)]">
                    {t.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[var(--text)]">{t.name}</span>
                    {t.specialization && <span className="block truncate text-xs text-[var(--text-muted)]">{t.specialization}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <div className="mb-3"><FormAlert kind="error">{error}</FormAlert></div>}
      {conversations.length === 0 ? (
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" aria-hidden />
          <p className="font-medium text-[var(--text)]">No conversations yet</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {isTrainer ? "Open a client's profile and choose Message to start a conversation." : "Choose New message to ask any trainer at your gym."}
          </p>
        </div>
      ) : (
        <div className="grid h-[70vh] min-h-[420px] grid-cols-1 overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface)] md:grid-cols-[280px_1fr]">
          <ul className={`overflow-y-auto border-[var(--border)] md:border-r ${active ? "hidden md:block" : ""}`} aria-label="Conversations">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  aria-current={c.id === activeId}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[var(--background)] ${c.id === activeId ? "bg-[var(--background)]" : ""}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-[var(--text)]">{isTrainer ? c.member_name : c.trainer_name}</span>
                      {c.assigned === false ? (
                        <span className="shrink-0 rounded-full bg-[var(--surface-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">{isTrainer ? "Question" : "Other trainer"}</span>
                      ) : !isTrainer && (
                        <span className="shrink-0 rounded-full bg-[var(--primary-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--nav-active-text)]">Your trainer</span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-[var(--text-muted)]">{c.last_message ?? "No messages yet"}</span>
                  </span>
                  {c.unread > 0 && (
                    <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-semibold text-white" aria-label={`${c.unread} unread`}>{c.unread}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {active && (
            <section className="flex min-h-0 flex-col" aria-label={`Conversation with ${isTrainer ? active.member_name : active.trainer_name}`}>
              <header className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
                <button type="button" className="text-xs text-[var(--text-muted)] md:hidden" onClick={() => setActiveId(null)}>← Back</button>
                <span className="min-w-0 flex-1 truncate font-medium text-[var(--text)]">{isTrainer ? active.member_name : active.trainer_name}</span>
                <button
                  type="button"
                  onClick={() => setReporting({ message: null })}
                  className="inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--error)]"
                >
                  <Flag className="h-3.5 w-3.5" aria-hidden />
                  Report
                </button>
              </header>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
                {messages === null ? (
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-[var(--text-muted)]" aria-label="Loading messages" />
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-[var(--text-muted)]">Say hello to start the conversation.</p>
                ) : messages.map((m) => {
                  const mine = m.sender_user_id === me;
                  return (
                    <div key={m.id} className={`group flex items-center gap-1 ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-[12px] px-3 py-2 text-sm ${mine ? "bg-[var(--primary)] text-white" : "bg-[var(--background)] text-[var(--text)]"}`}>
                        {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                        {m.attachment_type && <p className="mt-1 text-xs opacity-80">Shared {m.attachment_type.replace("_", " ")}</p>}
                        <p className="mt-1 text-[10px] opacity-70">
                          {new Date(m.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                          {mine && m.read_at ? " · Read" : ""}
                        </p>
                      </div>
                      {!mine && (
                        <button
                          type="button"
                          onClick={() => setReporting({ message: m })}
                          aria-label="Report this message"
                          title="Report this message"
                          className="rounded-[6px] p-1.5 text-[var(--text-muted)] opacity-60 hover:bg-[var(--background)] hover:text-[var(--error)] hover:opacity-100 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        >
                          <Flag className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              {active.can_send ? (
                <form onSubmit={send} className="flex gap-2 border-t border-[var(--border)] p-3">
                  <label htmlFor="chat-draft" className="sr-only">Message</label>
                  <textarea
                    id="chat-draft"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
                    rows={1}
                    maxLength={4000}
                    placeholder="Write a message…"
                    className="min-h-10 flex-1 resize-none rounded-[10px] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                  <button type="submit" disabled={sending || !draft.trim()} aria-label="Send message"
                    className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--primary)] text-white disabled:opacity-50">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              ) : (
                <p className="border-t border-[var(--border)] p-3 text-center text-xs text-[var(--text-muted)]">
                  This trainer is no longer assigned, so the conversation is read-only.
                </p>
              )}
            </section>
          )}
          {active && (
            <ReportChatDialog
              open={reporting !== null}
              onOpenChange={(o) => !o && setReporting(null)}
              conversationId={active.id}
              otherName={isTrainer ? active.member_name : active.trainer_name}
              message={reporting?.message ?? null}
            />
          )}
        </div>
      )}
    </div>
  );
}
