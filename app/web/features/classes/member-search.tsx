"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { memberRequest } from "@/lib/api";
import { inputClass } from "@/features/fitness/shared";
import { tr } from "@/lib/i18n";

export interface MemberHit {
  id: string;
  first_name: string;
  last_name?: string | null;
  phone?: string | null;
}

/** Type-ahead search over the gym's members (server-side search, 10 results). */
export function MemberSearch({ onPick, label = "Search member" }: { onPick: (m: MemberHit) => void; label?: string }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<MemberHit[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(() => {
      memberRequest(`/members?query=${encodeURIComponent(q.trim())}&page_size=10`, "GET", undefined, "Search failed")
        .then((r) => setHits(r.items || []))
        .catch(() => setHits([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" aria-hidden />
        <input
          aria-label={label}
          className={`${inputClass} pl-9`}
          placeholder={tr("classes.name_or_phone")}
          value={q}
          autoComplete="off"
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {hits.length > 0 && (
        <ul className="rounded-xl border border-[var(--border)] divide-y divide-[var(--border)] max-h-48 overflow-auto">
          {hits.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(m);
                  setQ("");
                  setHits([]);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:bg-[var(--surface-hover)]"
              >
                {m.first_name} {m.last_name} <span className="text-[var(--text-muted)]">{m.phone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
