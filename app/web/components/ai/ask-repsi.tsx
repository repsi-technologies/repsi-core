"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { aiApi, SOURCE_LABEL, type AssistantAnswer } from "@/lib/ai-api";
import { getWorkspaceFromPath } from "@/lib/workspace";
import { getAuthUser } from "@/lib/auth";

interface Turn {
  q: string;
  a?: AssistantAnswer;
  error?: string;
}

const STARTERS = ["How do I add a member?", "How do I record a payment?", "Who owes dues?", "How do I send an announcement?"];
const MEMBER_STARTERS = ["Where is my QR pass?", "When does my membership end?", "Suggest a workout for me"];

/** Floating help assistant. Each question is sent on its own (no chat history), keeping AI calls tiny. */
export function AskRepsi() {
  const pathname = usePathname();
  const workspace = getWorkspaceFromPath(pathname);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const role = getAuthUser()?.role;
    setIsMember(role === "USER" || role === "MEMBER");
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns]);

  if (!workspace) return null;

  const ask = async (q: string) => {
    const text = q.trim();
    if (text.length < 2 || busy) return;
    setQuestion("");
    setBusy(true);
    setTurns((t) => [...t.slice(-5), { q: text }]);
    try {
      const a = await aiApi.ask(text);
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, a } : x)));
    } catch (e) {
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, error: (e as Error).message } : x)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close REPSI assistant" : "Ask REPSI"}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
      >
        {open ? <X className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        <span className="hidden sm:inline">{open ? "Close" : "Ask REPSI"}</span>
      </button>

      {open && (
        <section
          aria-label="REPSI assistant"
          className="fixed bottom-20 right-3 left-3 sm:left-auto sm:right-5 z-40 sm:w-[380px] max-h-[70vh] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]"
        >
          <header className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-sm font-semibold text-[var(--text)]">Ask REPSI</p>
            <p className="text-[11px] text-[var(--text-muted)]">Help with using REPSI. Don&apos;t share personal details here.</p>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm" aria-live="polite">
            {turns.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {(isMember ? MEMBER_STARTERS : STARTERS).map((s) => (
                  <button key={s} type="button" onClick={() => ask(s)}
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {turns.map((t, i) => (
              <div key={i} className="space-y-1.5">
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--primary-soft)] px-3 py-2 text-[var(--text)]">{t.q}</p>
                {t.error ? (
                  <p className="text-xs text-[var(--error)]">{t.error}</p>
                ) : t.a ? (
                  <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-[var(--surface-secondary)] px-3 py-2 space-y-2">
                    <p className="text-[var(--text)] whitespace-pre-wrap">{t.a.answer}</p>
                    {t.a.links.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {t.a.links.map((l) => (
                          <Link key={l.path} href={`/${workspace}${l.path}`} onClick={() => setOpen(false)}
                            className="text-xs font-semibold text-[var(--link)] hover:underline">
                            Open {l.title} →
                          </Link>
                        ))}
                      </div>
                    )}
                    {t.a.notice && <p className="text-[11px] text-[var(--text-muted)]">{t.a.notice}</p>}
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-disabled)]">{SOURCE_LABEL[t.a.source]}</p>
                  </div>
                ) : (
                  <p className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><Loader2 className="h-3 w-3 animate-spin" /> Thinking…</p>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form
            className="flex items-center gap-2 border-t border-[var(--border)] p-3"
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
          >
            <label htmlFor="ask-repsi-input" className="sr-only">Your question</label>
            <input
              id="ask-repsi-input"
              value={question}
              maxLength={500}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="How do I…"
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
            <button type="submit" disabled={busy || question.trim().length < 2} aria-label="Send question"
              className="rounded-xl bg-[var(--primary)] p-2 text-white disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
