"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { FormAlert } from "@/components/organization/form-fields";
import { getAuthUser } from "@/lib/auth";
import { repsiApi, type ApiChatMessage, type ApiConversation } from "@/lib/api";

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
  const endRef = useRef<HTMLDivElement>(null);
  const isTrainer = getAuthUser()?.role === "TRAINER";

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
      <h1 className="mb-4 text-xl font-semibold text-[var(--text)]">Messages</h1>
      {error && <div className="mb-3"><FormAlert kind="error">{error}</FormAlert></div>}
      {conversations.length === 0 ? (
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" aria-hidden />
          <p className="font-medium text-[var(--text)]">No conversations yet</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {isTrainer ? "Open a client's profile and choose Message to start a conversation." : "Once a trainer is assigned to you, you can message them here."}
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
                    <span className="block truncate text-sm font-medium text-[var(--text)]">{isTrainer ? c.member_name : c.trainer_name}</span>
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
                <span className="font-medium text-[var(--text)]">{isTrainer ? active.member_name : active.trainer_name}</span>
              </header>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
                {messages === null ? (
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-[var(--text-muted)]" aria-label="Loading messages" />
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-[var(--text-muted)]">Say hello to start the conversation.</p>
                ) : messages.map((m) => {
                  const mine = m.sender_user_id === me;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-[12px] px-3 py-2 text-sm ${mine ? "bg-[var(--primary)] text-white" : "bg-[var(--background)] text-[var(--text)]"}`}>
                        {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                        {m.attachment_type && <p className="mt-1 text-xs opacity-80">Shared {m.attachment_type.replace("_", " ")}</p>}
                        <p className="mt-1 text-[10px] opacity-70">
                          {new Date(m.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                          {mine && m.read_at ? " · Read" : ""}
                        </p>
                      </div>
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
        </div>
      )}
    </div>
  );
}
