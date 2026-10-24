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
import { useTranslation, tr, richText } from "@/lib/i18n";

type Tab = "compose" | "history" | "templates" | "log";
const CHANNELS: { key: CommChannel; label: string }[] = [
  { key: "in_app", get label() { return tr("communications.in_app"); } },
  { key: "email", get label() { return tr("invite.email"); } },
  { key: "whatsapp", get label() { return tr("communications.whatsapp_approved_template"); } },
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
  const { t } = useTranslation();
  const entries = Object.entries(summary) as [DeliveryStatus, number][];
  if (!entries.length) return <span className="text-xs text-[var(--text-muted)]">{t("communications.no_deliveries")}</span>;
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
          aria-label={tr("communications.search_members_to_add")}
          className={`${inputClass} pl-9`}
          placeholder={tr("communications.search_members_by_name_or_phone")}
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
            <button type="button" aria-label={tr("communications.remove_first_name", undefined, { first_name: m.first_name })} onClick={() => onChange(selected.filter((s) => s.id !== m.id))}>
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
        <Field label={tr("communications.audience")} htmlFor="bc-segment">
          <select id="bc-segment" className={inputClass} value={segment} onChange={(e) => setSegment(e.target.value as CommSegment)}>
            {(Object.keys(SEGMENT_LABELS) as CommSegment[]).map((s) => (
              <option key={s} value={s}>{SEGMENT_LABELS[s]}</option>
            ))}
          </select>
        </Field>
        {DAY_SEGMENTS.includes(segment) && (
          <Field label={segment === "expiring_soon" ? tr("communications.ending_within_days") : tr("communications.joined_within_days")} htmlFor="bc-days">
            <input id="bc-days" type="number" min={1} max={365} className={inputClass} value={days}
              onChange={(e) => setDays(Math.min(365, Math.max(1, Number(e.target.value) || 1)))} />
          </Field>
        )}
        {segment === "selected_members" && <MemberPicker selected={picked} onChange={setPicked} />}

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[var(--text)]">{tr("communications.channels")}</legend>
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
              {tr("communications.whatsapp_goes_only_to_members_who")}
            </p>
          )}
        </fieldset>

        <Field label={channels.includes("whatsapp") ? tr("communications.template_required_for_whatsapp") : tr("communications.start_from_a_template_optional")} htmlFor="bc-template">
          <select id="bc-template" className={inputClass} value={templateId} onChange={(e) => applyTemplate(e.target.value)}>
            <option value="">{tr("communications.no_template")}</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.channel.replace("_", "-")})</option>
            ))}
          </select>
        </Field>
        <Field label={tr("members.title")} htmlFor="bc-title" hint={tr("communications.placeholders_first_name_gym_name")}>
          <input id="bc-title" className={inputClass} maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label={tr("communications.message")} htmlFor="bc-message">
          <textarea id="bc-message" rows={5} className={inputClass} maxLength={4000} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <div className="flex justify-end">
          <Button onClick={() => setConfirming(true)} disabled={invalid} className="gap-2">
            {richText(tr("communications.sendreview_send"), { send: <Send className="h-4 w-4" /> })}</Button>
        </div>
      </div>

      <aside className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 h-fit">
        <h3 className="text-sm font-semibold text-[var(--text)]">{tr("communications.recipients")}</h3>
        {previewError ? (
          <p className="text-sm text-[var(--error)]">{previewError}</p>
        ) : preview ? (
          <>
            <p className="text-3xl font-bold text-[var(--text)]">{preview.recipient_count}</p>
            <dl className="grid grid-cols-2 gap-1 text-xs text-[var(--text-secondary)]">
              <dt>{tr("communications.with_app_account")}</dt><dd className="text-right">{preview.with_app_account}</dd>
              <dt>{tr("communications.with_email")}</dt><dd className="text-right">{preview.with_email}</dd>
              <dt>{tr("communications.with_phone")}</dt><dd className="text-right">{preview.with_phone}</dd>
            </dl>
            {preview.sample.length > 0 && (
              <p className="text-xs text-[var(--text-muted)]">e.g. {preview.sample.join(", ")}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">{segment === "selected_members" ? tr("communications.pick_members_to_see_recipients") : tr("communications.loading")}</p>
        )}
      </aside>

      {confirming && preview && (
        <Modal title={tr("communications.send_this_broadcast")} onClose={() => setConfirming(false)}>
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p>
              <strong className="text-[var(--text)]">{title}</strong> {tr("communications.goes_to")}{" "}{preview.recipient_count} {tr("communications.recipient_s_via")}{" "}
              {channels.map((c) => CHANNELS.find((x) => x.key === c)?.label).join(", ")}{tr("communications.this_can_t_be_undone")}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirming(false)} disabled={sending}>{tr("common.cancel")}</Button>
              <Button onClick={send} disabled={sending}>{sending ? tr("auth.sending") : tr("communications.send_now")}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DeliveryTable({ rows }: { rows: Delivery[] }) {
  const { t } = useTranslation();
  if (!rows.length) return <EmptyBlock title={t("communications.no_deliveries_yet")} />;
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-secondary)] text-left text-xs text-[var(--text-muted)]">
          <tr>
            <th className="px-3 py-2 font-medium">{t("communications.recipient")}</th>
            <th className="px-3 py-2 font-medium">{t("communications.channel")}</th>
            <th className="px-3 py-2 font-medium">{t("common.status")}</th>
            <th className="px-3 py-2 font-medium">{t("communications.detail")}</th>
            <th className="px-3 py-2 font-medium">{t("communications.when")}</th>
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
  const { t } = useTranslation();
  const [items, setItems] = useState<Broadcast[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Broadcast | null>(null);
  const [rows, setRows] = useState<Delivery[] | null>(null);

  const load = useCallback(() => {
    setError(null);
    communicationsApi.listBroadcasts().then((r) => setItems(r.items)).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(() => {
    load();
  }, [load, refreshKey]);
  useEffect(() => {
    if (!open) return;
    setRows(null);
    communicationsApi.broadcastDeliveries(open.id).then((r) => setRows(r.items)).catch((e: Error) => setError(e.message));
  }, [open]);

  if (error) return <Notice kind="error">{error} <button className="underline" onClick={load}>{t("members.retry")}</button></Notice>;
  if (!items) return <LoadingRow />;
  if (!items.length) return <EmptyBlock title={t("communications.no_broadcasts_yet")}>{t("communications.announcements_you_send_appear_here_with")}</EmptyBlock>;
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
            {t("communications.value_recipient_countrecipients_join_value2", undefined, { value: SEGMENT_LABELS[b.audience.segment] ?? b.audience.segment, recipient_count: b.recipient_count, join: b.channels.join(", "), value2: formatWhen(b.created_at) })}</p>
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
                {richText(t("communications.refreshcwsend_queued_now"), { refreshcw: <RefreshCw className="h-3.5 w-3.5" /> })}</Button>
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
          <EmptyBlock title={tr("communications.no_templates_yet")}>{tr("communications.save_messages_you_send_often_like")}</EmptyBlock>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-[var(--text)]">{t.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{t.channel.replace("_", "-")}</Badge>
                  <Button variant="outline" size="sm"
                    onClick={() => communicationsApi.updateTemplate(t.id, { is_active: false }).then(reload).catch((e: Error) => setError(e.message))}>
                    {tr("nutrition.archive")}
                  </Button>
                </div>
              </div>
              {t.provider_template_name && <p className="text-xs text-[var(--text-muted)] mt-1">{tr("communications.approved_template_provider_template_name", undefined, { provider_template_name: t.provider_template_name })}</p>}
              <p className="text-sm text-[var(--text-secondary)] mt-2 whitespace-pre-wrap">{t.body}</p>
            </div>
          ))
        )}
      </div>
      <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 h-fit">
        <h3 className="text-sm font-semibold text-[var(--text)]">{tr("communications.new_template")}</h3>
        {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
        <Field label={tr("organization.name")} htmlFor="tpl-name"><input id="tpl-name" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label={tr("communications.channel")} htmlFor="tpl-channel">
          <select id="tpl-channel" className={inputClass} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as CommChannel })}>
            {CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
        {form.channel === "whatsapp" && (
          <Field label={tr("communications.approved_whatsapp_template_campaign_name")} htmlFor="tpl-provider" hint={tr("communications.exactly_as_approved_in_aisensy")}>
            <input id="tpl-provider" className={inputClass} value={form.provider_template_name} onChange={(e) => setForm({ ...form, provider_template_name: e.target.value })} />
          </Field>
        )}
        <Field label={tr("communications.subject_title")} htmlFor="tpl-subject"><input id="tpl-subject" className={inputClass} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
        <Field label={tr("communications.body")} htmlFor="tpl-body" hint={tr("communications.placeholders_first_name_gym_name")}>
          <textarea id="tpl-body" rows={4} className={inputClass} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </Field>
        <Button onClick={save} disabled={invalid || saving} className="w-full">{saving ? tr("nutrition.saving") : tr("communications.save_template")}</Button>
      </div>
    </div>
  );
}

function DeliveryLog() {
  const { t } = useTranslation();
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
        <select aria-label={t("members.filter_by_status")} className={`${inputClass} w-auto`} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as DeliveryStatus | ""); }}>
          <option value="">{t("communications.all_statuses")}</option>
          {(Object.keys(DELIVERY_STATUS_LABELS) as DeliveryStatus[]).map((s) => <option key={s} value={s}>{DELIVERY_STATUS_LABELS[s]}</option>)}
        </select>
        <select aria-label={t("communications.filter_by_channel")} className={`${inputClass} w-auto`} value={channel} onChange={(e) => { setPage(1); setChannel(e.target.value as CommChannel | ""); }}>
          <option value="">{t("communications.all_channels")}</option>
          {CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>
      {error ? <Notice kind="error">{error}</Notice> : data ? (
        <>
          <DeliveryTable rows={data.items} />
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>{data.total} deliveries</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>{t("members.previous")}</Button>
              <Button variant="outline" size="sm" disabled={page * 50 >= data.total} onClick={() => setPage(page + 1)}>{t("members.next")}</Button>
            </div>
          </div>
        </>
      ) : <LoadingRow />}
    </div>
  );
}

export function BroadcastCenter() {
  const { t } = useTranslation();
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
    { key: "compose", label: t("communications.compose") },
    { key: "history", label: t("members.history") },
    { key: "templates", label: t("communications.templates") },
    { key: "log", label: t("communications.delivery_log") },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[var(--primary-soft)] p-2.5 text-[var(--primary)]"><Megaphone className="h-5 w-5" /></div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">{t("navItem.broadcasts")}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t("communications.announcements_to_selected_member_groups_with")}</p>
        </div>
      </div>
      {gate && <Notice kind="error">{gate}</Notice>}
      {sent && (
        <Notice kind="success" onDismiss={() => setSent(null)}>
          {t("communications.title_sent_to_recipient_countrecipient_s", undefined, { title: sent.title, recipient_count: sent.recipient_count })}</Notice>
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
