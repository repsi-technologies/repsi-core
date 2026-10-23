"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Megaphone, RefreshCw, Search, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { memberRequest } from "@/lib/api";
import {
  communicationsApi,
  DELIVERY_STATUS_LABELS,
  SEGMENT_LABELS,
  type AudiencePreview,
  type Broadcast,
  type CommChannel,
  type CommSegment,
  type Delivery,
  type DeliveryStatus,
  type MessageTemplate,
} from "@/lib/communications-api";
import { EmptyBlock, Field, LoadingRow, Modal, Notice, inputClass } from "@/features/fitness/shared";

type Tab = "compose" | "history" | "templates" | "log";
const CHANNELS: { key: CommChannel; label: string }[] = [
  { key: "in_app", label: "In-app" },
  { key: "email", label: "Email" },
  { key: "whatsapp", label: "WhatsApp (approved template)" },
];
const DAY_SEGMENTS: CommSegment[] = ["expiring_soon", "new_members"];

function statusVariant(s: string): "active" | "expired" | "expiring" | "default" {
  if (s === "sent" || s === "completed") return "active";
  if (s === "failed" || s === "completed_with_errors") return "expired";
  if (s === "queued" || s === "sending") return "expiring";
  return "default";
}

function formatWhen(iso?: string | null) {
  return iso ? new Date(iso.endsWith("Z") ? iso : `${iso}Z`).toLocaleString() : "—";
}

function SummaryChips({ summary }: { summary: Partial<Record<DeliveryStatus, number>> }) {
  const entries = Object.entries(summary) as [DeliveryStatus, number][];
  if (!entries.length) return <span className="text-xs text-[var(--text-muted)]">No deliveries</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([s, n]) => (
        <Badge key={s} variant={statusVariant(s)}>
          {DELIVERY_STATUS_LABELS[s] ?? s}: {n}
        </Badge>
      ))}
    </div>
  );
}

interface MemberHit {
  id: string;
  first_name: string;
  last_name?: string | null;
  phone?: string | null;
}

function MemberPicker({ selected, onChange }: { selected: MemberHit[]; onChange: (m: MemberHit[]) => void }) {
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
  const ids = new Set(selected.map((m) => m.id));
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" aria-hidden />
        <input
          aria-label="Search members to add"
          className={`${inputClass} pl-9`}
          placeholder="Search members by name or phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {hits.length > 0 && (
        <ul className="rounded-xl border border-[var(--border)] divide-y divide-[var(--border)] max-h-48 overflow-auto">
          {hits.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                disabled={ids.has(m.id)}
                onClick={() => onChange([...selected, m])}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-hover)] disabled:opacity-50"
              >
                {m.first_name} {m.last_name} <span className="text-[var(--text-muted)]">{m.phone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-1.5">
        {selected.map((m) => (
          <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary-dark)] px-2.5 py-0.5 text-xs">
            {m.first_name} {m.last_name}
            <button type="button" aria-label={`Remove ${m.first_name}`} onClick={() => onChange(selected.filter((s) => s.id !== m.id))}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function Compose({ templates, onSent }: { templates: MessageTemplate[]; onSent: (b: Broadcast) => void }) {
  const [segment, setSegment] = useState<CommSegment>("all_members");
  const [days, setDays] = useState(7);
  const [picked, setPicked] = useState<MemberHit[]>([]);
  const [channels, setChannels] = useState<CommChannel[]>(["in_app"]);
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  const audience = useMemo(
    () => ({
      segment,
      ...(DAY_SEGMENTS.includes(segment) ? { days } : {}),
      ...(segment === "selected_members" ? { member_ids: picked.map((m) => m.id) } : {}),
    }),
    [segment, days, picked],
  );
  const whatsappTemplates = templates.filter((t) => t.channel === "whatsapp");

  useEffect(() => {
    if (segment === "selected_members" && picked.length === 0) {
      setPreview(null);
      return;
    }
    let live = true;
    communicationsApi
      .previewAudience(audience)
      .then((p) => live && (setPreview(p), setPreviewError(null)))
      .catch((e: Error) => live && (setPreview(null), setPreviewError(e.message)));
    return () => {
      live = false;
    };
  }, [audience, segment, picked.length]);

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (t) {
      setTitle(t.subject || t.name);
      setMessage(t.body);
    }
  };
  const toggle = (c: CommChannel) => setChannels((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  const invalid =
    title.trim().length < 2 ||
    message.trim().length < 2 ||
    channels.length === 0 ||
    !preview?.recipient_count ||
    (channels.includes("whatsapp") && !whatsappTemplates.some((t) => t.id === templateId));

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const b = await communicationsApi.sendBroadcast({
        title: title.trim(),
        message: message.trim(),
        channels,
        audience,
        template_id: templateId || null,
      });
      setConfirming(false);
      setTitle("");
      setMessage("");
      setTemplateId("");
      onSent(b);
    } catch (e) {
      setError((e as Error).message);
      setConfirming(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
        <Field label="Audience" htmlFor="bc-segment">
          <select id="bc-segment" className={inputClass} value={segment} onChange={(e) => setSegment(e.target.value as CommSegment)}>
            {(Object.keys(SEGMENT_LABELS) as CommSegment[]).map((s) => (
              <option key={s} value={s}>{SEGMENT_LABELS[s]}</option>
            ))}
          </select>
        </Field>
        {DAY_SEGMENTS.includes(segment) && (
          <Field label={segment === "expiring_soon" ? "Ending within (days)" : "Joined within (days)"} htmlFor="bc-days">
            <input id="bc-days" type="number" min={1} max={365} className={inputClass} value={days}
              onChange={(e) => setDays(Math.min(365, Math.max(1, Number(e.target.value) || 1)))} />
          </Field>
        )}
        {segment === "selected_members" && <MemberPicker selected={picked} onChange={setPicked} />}

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[var(--text)]">Channels</legend>
          <div className="flex flex-wrap gap-3">
            {CHANNELS.map((c) => (
              <label key={c.key} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input type="checkbox" checked={channels.includes(c.key)} onChange={() => toggle(c.key)} />
                {c.label}
              </label>
            ))}
          </div>
          {channels.includes("whatsapp") && (
            <p className="text-xs text-[var(--text-muted)]">
              WhatsApp goes only to members who opted in, using an approved template. Without provider credentials,
              deliveries are logged as &ldquo;Provider not configured&rdquo;.
            </p>
          )}
        </fieldset>

        <Field label={channels.includes("whatsapp") ? "Template (required for WhatsApp)" : "Start from a template (optional)"} htmlFor="bc-template">
          <select id="bc-template" className={inputClass} value={templateId} onChange={(e) => applyTemplate(e.target.value)}>
            <option value="">No template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.channel.replace("_", "-")})</option>
            ))}
          </select>
        </Field>
        <Field label="Title" htmlFor="bc-title" hint="Placeholders: {{first_name}}, {{gym_name}}">
          <input id="bc-title" className={inputClass} maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Message" htmlFor="bc-message">
          <textarea id="bc-message" rows={5} className={inputClass} maxLength={4000} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <div className="flex justify-end">
          <Button onClick={() => setConfirming(true)} disabled={invalid} className="gap-2">
            <Send className="h-4 w-4" /> Review &amp; send
          </Button>
        </div>
      </div>

      <aside className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 h-fit">
        <h3 className="text-sm font-semibold text-[var(--text)]">Recipients</h3>
        {previewError ? (
          <p className="text-sm text-[var(--error)]">{previewError}</p>
        ) : preview ? (
          <>
            <p className="text-3xl font-bold text-[var(--text)]">{preview.recipient_count}</p>
            <dl className="grid grid-cols-2 gap-1 text-xs text-[var(--text-secondary)]">
              <dt>With app account</dt><dd className="text-right">{preview.with_app_account}</dd>
              <dt>With email</dt><dd className="text-right">{preview.with_email}</dd>
              <dt>With phone</dt><dd className="text-right">{preview.with_phone}</dd>
            </dl>
            {preview.sample.length > 0 && (
              <p className="text-xs text-[var(--text-muted)]">e.g. {preview.sample.join(", ")}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">{segment === "selected_members" ? "Pick members to see recipients." : "Loading…"}</p>
        )}
      </aside>

      {confirming && preview && (
        <Modal title="Send this broadcast?" onClose={() => setConfirming(false)}>
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p>
              <strong className="text-[var(--text)]">{title}</strong> goes to {preview.recipient_count} recipient(s) via{" "}
              {channels.map((c) => CHANNELS.find((x) => x.key === c)?.label).join(", ")}. This can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirming(false)} disabled={sending}>Cancel</Button>
              <Button onClick={send} disabled={sending}>{sending ? "Sending…" : "Send now"}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DeliveryTable({ rows }: { rows: Delivery[] }) {
  if (!rows.length) return <EmptyBlock title="No deliveries yet" />;
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-secondary)] text-left text-xs text-[var(--text-muted)]">
          <tr>
            <th className="px-3 py-2 font-medium">Recipient</th>
            <th className="px-3 py-2 font-medium">Channel</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Detail</th>
            <th className="px-3 py-2 font-medium">When</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
          {rows.map((d) => (
            <tr key={d.id}>
              <td className="px-3 py-2 text-[var(--text)]">{d.recipient_name || "—"}<div className="text-xs text-[var(--text-muted)]">{d.destination}</div></td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">{d.channel.replace("_", "-")}</td>
              <td className="px-3 py-2"><Badge variant={statusVariant(d.status)}>{DELIVERY_STATUS_LABELS[d.status] ?? d.status}</Badge></td>
              <td className="px-3 py-2 text-xs text-[var(--text-muted)]">{d.error || (d.provider ? `via ${d.provider}` : "")}</td>
              <td className="px-3 py-2 text-xs text-[var(--text-muted)] whitespace-nowrap">{formatWhen(d.sent_at || d.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function History({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<Broadcast[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Broadcast | null>(null);
  const [rows, setRows] = useState<Delivery[] | null>(null);

  const load = useCallback(() => {
    setError(null);
    communicationsApi.listBroadcasts().then((r) => setItems(r.items)).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load, refreshKey]);
  useEffect(() => {
    if (!open) return;
    setRows(null);
    communicationsApi.broadcastDeliveries(open.id).then((r) => setRows(r.items)).catch((e: Error) => setError(e.message));
  }, [open]);

  if (error) return <Notice kind="error">{error} <button className="underline" onClick={load}>Retry</button></Notice>;
  if (!items) return <LoadingRow />;
  if (!items.length) return <EmptyBlock title="No broadcasts yet">Announcements you send appear here with their delivery status.</EmptyBlock>;
  return (
    <div className="space-y-3">
      {items.map((b) => (
        <button key={b.id} type="button" onClick={() => setOpen(b)}
          className="w-full text-left rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] outline-none">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-[var(--text)]">{b.title}</h3>
            <Badge variant={statusVariant(b.status)}>{b.status.replace(/_/g, " ")}</Badge>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {SEGMENT_LABELS[b.audience.segment] ?? b.audience.segment} · {b.recipient_count} recipients · {b.channels.join(", ")} · {formatWhen(b.created_at)}
          </p>
          <div className="mt-2"><SummaryChips summary={b.summary} /></div>
        </button>
      ))}
      {open && (
        <Modal title={open.title} onClose={() => setOpen(null)} wide>
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{open.message}</p>
            {open.summary.queued ? (
              <Button variant="outline" size="sm" className="gap-1.5"
                onClick={() => communicationsApi.retryBroadcast(open.id).then((b) => { setOpen(b); load(); }).catch((e: Error) => setError(e.message))}>
                <RefreshCw className="h-3.5 w-3.5" /> Send queued now
              </Button>
            ) : null}
            {rows ? <DeliveryTable rows={rows} /> : <LoadingRow />}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Templates({ templates, reload }: { templates: MessageTemplate[]; reload: () => void }) {
  const [form, setForm] = useState({ name: "", channel: "in_app" as CommChannel, category: "announcement" as MessageTemplate["category"], subject: "", body: "", provider_template_name: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await communicationsApi.createTemplate({
        ...form,
        subject: form.subject || null,
        provider_template_name: form.channel === "whatsapp" ? form.provider_template_name : null,
      });
      setForm({ ...form, name: "", subject: "", body: "", provider_template_name: "" });
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const invalid = form.name.trim().length < 2 || form.body.trim().length < 2 || (form.channel === "whatsapp" && !form.provider_template_name.trim());
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {templates.length === 0 ? (
          <EmptyBlock title="No templates yet">Save messages you send often, like holiday hours or renewal nudges.</EmptyBlock>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-[var(--text)]">{t.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{t.channel.replace("_", "-")}</Badge>
                  <Button variant="outline" size="sm"
                    onClick={() => communicationsApi.updateTemplate(t.id, { is_active: false }).then(reload).catch((e: Error) => setError(e.message))}>
                    Archive
                  </Button>
                </div>
              </div>
              {t.provider_template_name && <p className="text-xs text-[var(--text-muted)] mt-1">Approved template: {t.provider_template_name}</p>}
              <p className="text-sm text-[var(--text-secondary)] mt-2 whitespace-pre-wrap">{t.body}</p>
            </div>
          ))
        )}
      </div>
      <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 h-fit">
        <h3 className="text-sm font-semibold text-[var(--text)]">New template</h3>
        {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
        <Field label="Name" htmlFor="tpl-name"><input id="tpl-name" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Channel" htmlFor="tpl-channel">
          <select id="tpl-channel" className={inputClass} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as CommChannel })}>
            {CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
        {form.channel === "whatsapp" && (
          <Field label="Approved WhatsApp template / campaign name" htmlFor="tpl-provider" hint="Exactly as approved in AiSensy">
            <input id="tpl-provider" className={inputClass} value={form.provider_template_name} onChange={(e) => setForm({ ...form, provider_template_name: e.target.value })} />
          </Field>
        )}
        <Field label="Subject / title" htmlFor="tpl-subject"><input id="tpl-subject" className={inputClass} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
        <Field label="Body" htmlFor="tpl-body" hint="Placeholders: {{first_name}}, {{gym_name}}">
          <textarea id="tpl-body" rows={4} className={inputClass} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </Field>
        <Button onClick={save} disabled={invalid || saving} className="w-full">{saving ? "Saving…" : "Save template"}</Button>
      </div>
    </div>
  );
}

function DeliveryLog() {
  const [status, setStatus] = useState<DeliveryStatus | "">("");
  const [channel, setChannel] = useState<CommChannel | "">("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: Delivery[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setData(null);
    communicationsApi
      .listDeliveries({ page, status: status || undefined, channel: channel || undefined })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [page, status, channel]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select aria-label="Filter by status" className={`${inputClass} w-auto`} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as DeliveryStatus | ""); }}>
          <option value="">All statuses</option>
          {(Object.keys(DELIVERY_STATUS_LABELS) as DeliveryStatus[]).map((s) => <option key={s} value={s}>{DELIVERY_STATUS_LABELS[s]}</option>)}
        </select>
        <select aria-label="Filter by channel" className={`${inputClass} w-auto`} value={channel} onChange={(e) => { setPage(1); setChannel(e.target.value as CommChannel | ""); }}>
          <option value="">All channels</option>
          {CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>
      {error ? <Notice kind="error">{error}</Notice> : data ? (
        <>
          <DeliveryTable rows={data.items} />
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>{data.total} deliveries</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page * 50 >= data.total} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </>
      ) : <LoadingRow />}
    </div>
  );
}

export function BroadcastCenter() {
  const [tab, setTab] = useState<Tab>("compose");
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [gate, setGate] = useState<string | null>(null);
  const [sent, setSent] = useState<Broadcast | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadTemplates = useCallback(() => {
    communicationsApi.listTemplates().then(setTemplates).catch((e: Error) => setGate(e.message));
  }, []);
  useEffect(() => {
    loadTemplates();
    communicationsApi
      .getEntitlements()
      .then((e) => {
        if (!e.features.member_broadcasts) setGate(`Broadcasts aren't included in your ${e.plan.name} plan. Upgrade in Subscription & Billing to use them.`);
      })
      .catch(() => undefined);
  }, [loadTemplates]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "compose", label: "Compose" },
    { key: "history", label: "History" },
    { key: "templates", label: "Templates" },
    { key: "log", label: "Delivery log" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[var(--primary-soft)] p-2.5 text-[var(--primary)]"><Megaphone className="h-5 w-5" /></div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Broadcasts</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Announcements to selected member groups, with delivery status for every recipient.</p>
        </div>
      </div>
      {gate && <Notice kind="error">{gate}</Notice>}
      {sent && (
        <Notice kind="success" onDismiss={() => setSent(null)}>
          &ldquo;{sent.title}&rdquo; sent to {sent.recipient_count} recipient(s). Email/WhatsApp deliveries finish in the background; see History.
        </Notice>
      )}
      <div role="tablist" className="flex gap-1 border-b border-[var(--border)] overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${tab === t.key ? "border-[var(--primary)] text-[var(--text)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "compose" && <Compose templates={templates} onSent={(b) => { setSent(b); setRefreshKey((k) => k + 1); setTab("history"); }} />}
      {tab === "history" && <History refreshKey={refreshKey} />}
      {tab === "templates" && <Templates templates={templates} reload={loadTemplates} />}
      {tab === "log" && <DeliveryLog />}
    </div>
  );
}
