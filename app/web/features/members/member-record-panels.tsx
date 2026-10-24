"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Trash2, Snowflake, Play, CalendarPlus, XCircle, RefreshCcw, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  repsiApi,
  type ApiAccountStatus,
  type ApiMemberHistoryItem,
  type ApiMemberNote,
  type ApiMembershipDetail,
} from "@/lib/api";
import { useTranslation, tr, richText } from "@/lib/i18n";

type BadgeVariant = "active" | "expiring" | "expired" | "frozen" | "cancelled" | "outline";

export const ACCOUNT_STATUS_META: Record<string, { label: string; variant: BadgeVariant; help: string }> = {
  active: { get label() { return tr("layout.active"); }, variant: "active", help: "Normal gym and app access." },
  inactive: { get label() { return tr("members.inactive"); }, variant: "expired", help: "No current relationship with the gym. Access is disabled." },
  suspended: { get label() { return tr("members.suspended"); }, variant: "cancelled", help: "Access blocked by staff. A reason is required." },
  archived: { get label() { return tr("members.archived"); }, variant: "outline", help: "Hidden from the default directory; records are kept. A reason is required." },
  // Values written by older versions of the app
  expiring: { get label() { return tr("members.expiring"); }, variant: "expiring", help: "" },
  expired: { get label() { return tr("members.expired"); }, variant: "expired", help: "" },
  frozen: { get label() { return tr("members.frozen"); }, variant: "frozen", help: "" },
  cancelled: { get label() { return tr("members.cancelled"); }, variant: "cancelled", help: "" },
};

const ACCOUNT_TRANSITIONS: Record<string, ApiAccountStatus[]> = {
  active: ["inactive", "suspended", "archived"],
  inactive: ["active", "suspended", "archived"],
  suspended: ["active", "inactive", "archived"],
  archived: ["active", "inactive"],
};

const PERIOD_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  scheduled: { get label() { return tr("members.scheduled"); }, variant: "outline" },
  active: { get label() { return tr("layout.active"); }, variant: "active" },
  frozen: { get label() { return tr("members.frozen"); }, variant: "frozen" },
  expired: { get label() { return tr("members.expired"); }, variant: "expired" },
  cancelled: { get label() { return tr("members.cancelled"); }, variant: "cancelled" },
};

const inputClass =
  "w-full px-3 py-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

function todayIso(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function humanize(eventType: string): string {
  return eventType.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-[var(--text)] mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-500" role="alert">
      <span className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5" />{message}</span>
      {onRetry && <Button variant="ghost" size="sm" onClick={onRetry}>{t("members.retry")}</Button>}
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex justify-center py-8" aria-busy="true">
      <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
    </div>
  );
}

/* ---------------- Account status ---------------- */

export function MemberStatusDialog({
  memberId,
  currentStatus,
  onClose,
  onChanged,
}: {
  memberId: string;
  currentStatus: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const targets = ACCOUNT_TRANSITIONS[currentStatus] || (["active", "inactive", "suspended", "archived"] as ApiAccountStatus[]);
  const [target, setTarget] = useState<ApiAccountStatus>(targets[0]);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reasonRequired = target === "suspended" || target === "archived";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reasonRequired && !reason.trim()) {
      setError(t("members.please_give_a_reason_for_this"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await repsiApi.changeMemberStatus(memberId, target, reason.trim() || undefined);
      onChanged();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t("members.change_account_status")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 text-xs">
        <p className="text-[var(--text-muted)]">
          {richText(t("members.current_value_account_status_controls_access"), { value: <strong className="text-[var(--text)]">{ACCOUNT_STATUS_META[currentStatus]?.label || currentStatus}</strong> })}</p>
        <fieldset className="space-y-2">
          <legend className="sr-only">{t("members.new_status")}</legend>
          {targets.map((s) => (
            <label key={s} className="flex items-start gap-2 rounded-lg border border-[var(--border)] p-3 cursor-pointer has-[:checked]:border-[var(--primary)]">
              <input type="radio" name="status" value={s} checked={target === s} onChange={() => setTarget(s)} className="mt-0.5" />
              <span>
                <span className="block text-sm font-semibold text-[var(--text)]">{ACCOUNT_STATUS_META[s].label}</span>
                <span className="text-[var(--text-muted)]">{ACCOUNT_STATUS_META[s].help}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <div>
          <label htmlFor="status-reason" className="text-[var(--text-secondary)] block mb-1">
            {t("organization.reason")}{" "}{reasonRequired ? "(required)" : "(optional)"}
          </label>
          <textarea id="status-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputClass} resize-none`} maxLength={1000} />
        </div>
        {error && <InlineError message={error} />}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="submit" variant={target === "active" ? "default" : "destructive"} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("members.mark")}{" "}{ACCOUNT_STATUS_META[target].label.toLowerCase()}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- Memberships ---------------- */

type MembershipAction = "freeze" | "extend" | "cancel" | "renew";

function MembershipActionDialog({
  action,
  membership,
  onClose,
  onDone,
}: {
  action: MembershipAction;
  membership: ApiMembershipDetail;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { t } = useTranslation();
  const today = todayIso();
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(addDaysIso(today, 7));
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"after_current" | "immediate">("after_current");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titles: Record<MembershipAction, string> = {
    freeze: "Freeze membership",
    extend: "Extend validity",
    cancel: "Cancel membership",
    renew: "Renew membership",
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (action === "freeze") {
        await repsiApi.freezeMembership(membership.id, { start_date: start, end_date: end, reason: reason || undefined });
        onDone("Membership frozen.");
      } else if (action === "extend") {
        const res = await repsiApi.extendMembership(membership.id, days, reason);
        onDone(`Extended to ${formatDate(res.end_date)}.`);
      } else if (action === "cancel") {
        await repsiApi.cancelMembership(membership.id, reason);
        onDone("Membership cancelled.");
      } else {
        const res = await repsiApi.renewMembershipPeriod(membership.id, { mode });
        onDone(`Renewed: ${formatDate(res.start_date)} – ${formatDate(res.end_date)}. Record the payment separately.`);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={titles[action]} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 text-xs">
        <p className="text-[var(--text-muted)]">
          {membership.plan_name || t("members.membership")} · {formatDate(membership.start_date)} – {formatDate(membership.end_date)}
        </p>

        {action === "freeze" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="freeze-start" className="text-[var(--text-secondary)] block mb-1">{t("members.start")}</label>
                <input id="freeze-start" type="date" required min={today} value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="freeze-end" className="text-[var(--text-secondary)] block mb-1">{t("members.resume_on")}</label>
                <input id="freeze-end" type="date" required min={addDaysIso(start, 1)} value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
              </div>
            </div>
            <p className="text-[var(--text-muted)]">
              {t("members.freeze_days_remainingfreeze_day_s_remaining", undefined, { freeze_days_remaining: membership.freeze_days_remaining })}</p>
          </>
        )}

        {action === "extend" && (
          <div>
            <label htmlFor="extend-days" className="text-[var(--text-secondary)] block mb-1">{t("members.days_to_add")}</label>
            <input id="extend-days" type="number" min={1} max={365} required value={days} onChange={(e) => setDays(Number(e.target.value))} className={inputClass} />
            <p className="mt-1 text-[var(--text-muted)]">{t("members.new_end_date_value", undefined, { value: formatDate(addDaysIso(membership.end_date, days || 0)) })}</p>
          </div>
        )}

        {action === "renew" && (
          <fieldset className="space-y-2">
            <legend className="text-[var(--text-secondary)] mb-1">{t("members.when_should_the_new_period_start")}</legend>
            {[
              { v: "after_current" as const, label: t("members.after_the_current_period"), help: `Starts ${formatDate(addDaysIso(membership.end_date, 1))} (or today if already expired).` },
              { v: "immediate" as const, label: t("members.immediately"), help: "Starts today; the current period ends yesterday." },
            ].map((o) => (
              <label key={o.v} className="flex items-start gap-2 rounded-lg border border-[var(--border)] p-3 cursor-pointer has-[:checked]:border-[var(--primary)]">
                <input type="radio" name="mode" checked={mode === o.v} onChange={() => setMode(o.v)} className="mt-0.5" />
                <span>
                  <span className="block text-sm font-semibold text-[var(--text)]">{o.label}</span>
                  <span className="text-[var(--text-muted)]">{o.help}</span>
                </span>
              </label>
            ))}
            <p className="text-[var(--text-muted)]">{t("members.uses_the_plan_s_current_price")}</p>
          </fieldset>
        )}

        {action !== "renew" && (
          <div>
            <label htmlFor="action-reason" className="text-[var(--text-secondary)] block mb-1">
              {t("organization.reason")}{" "}{action === "freeze" ? "(optional)" : "(required)"}
            </label>
            <textarea
              id="action-reason"
              rows={2}
              required={action !== "freeze"}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`${inputClass} resize-none`}
              maxLength={1000}
            />
          </div>
        )}

        {error && <InlineError message={error} />}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>{t("common.back")}</Button>
          <Button type="submit" variant={action === "cancel" ? "destructive" : "default"} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {titles[action]}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AssignMembershipDialog({ memberId, onClose, onDone }: { memberId: string; onClose: () => void; onDone: (message: string) => void }) {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<any[] | null>(null);
  const [planId, setPlanId] = useState("");
  const [start, setStart] = useState(todayIso());
  const [price, setPrice] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    repsiApi.getMembershipPlans().then((all) => {
      const active = all.filter((p: any) => p.is_active);
      setPlans(active);
      if (active[0]) {
        setPlanId(active[0].id);
        setPrice(active[0].price);
      }
    });
  }, []);

  const plan = plans?.find((p) => p.id === planId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || price === "") return;
    setSaving(true);
    setError(null);
    try {
      const res = await repsiApi.assignMembership({ member_id: memberId, plan_id: plan.id, start_date: start, price_paid: Number(price) });
      onDone(`${plan.name} assigned: ${formatDate(res.start_date)} – ${formatDate(res.end_date)}. Record the payment to mark it paid.`);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t("members.assign_membership_plan")} onClose={onClose}>
      {plans === null ? (
        <LoadingRow />
      ) : plans.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">{t("members.no_active_plans_create_one_on")}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="assign-plan" className="text-[var(--text-secondary)] block mb-1">{t("members.plan")}</label>
            <select
              id="assign-plan"
              value={planId}
              onChange={(e) => {
                setPlanId(e.target.value);
                setPrice(plans.find((p) => p.id === e.target.value)?.price ?? "");
              }}
              className={inputClass}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{t("members.name_duration_monthsmo_value", undefined, { name: p.name, duration_months: p.duration_months, value: formatCurrency(p.price) })}</option>
              ))}
            </select>
            {plan?.description && <p className="mt-1 text-[var(--text-muted)]">{plan.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="assign-start" className="text-[var(--text-secondary)] block mb-1">{t("members.start_date_2")}</label>
              <input id="assign-start" type="date" required value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="assign-price" className="text-[var(--text-secondary)] block mb-1">{t("members.amount_due")}</label>
              <input id="assign-price" type="number" min={0} step="0.01" required value={price} onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))} className={inputClass} />
            </div>
          </div>
          {plan && price !== "" && Number(price) < plan.price && (
            <p className="text-[var(--text-muted)]">{t("members.discount_of_valueoff_the_list_price", undefined, { value: formatCurrency(plan.price - Number(price)) })}</p>
          )}
          <p className="text-[var(--text-muted)]">{t("members.the_end_date_is_calculated_by")}</p>
          {error && <InlineError message={error} />}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} {t("members.assign_plan")}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function MembershipsPanel({ memberId, onChanged }: { memberId: string; onChanged?: () => void }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ApiMembershipDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [dialog, setDialog] = useState<{ action: MembershipAction; membership: ApiMembershipDetail } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await repsiApi.getMemberMemberships(memberId);
      setItems(await Promise.all(list.map((m) => repsiApi.getMembershipDetail(m.id))));
    } catch (err: any) {
      setError(err.message);
    }
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  const done = (message: string) => {
    setNotice(message);
    load();
    onChanged?.();
  };

  const unfreeze = async (m: ApiMembershipDetail) => {
    if (!confirm(t("members.resume_this_membership_now_days_actually"))) return;
    setBusyId(m.id);
    try {
      const res = await repsiApi.unfreezeMembership(m.id);
      done(`Membership resumed. Valid until ${formatDate(res.end_date)}.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)]">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base font-semibold">{t("members.membership_periods")}</CardTitle>
        <Button size="sm" onClick={() => setAssignOpen(true)}>{t("members.assign_plan")}</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {notice && (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-600" role="status">{notice}</p>
        )}
        {error && <InlineError message={error} onRetry={load} />}
        {items === null && !error && <LoadingRow />}
        {items?.length === 0 && (
          <p className="py-6 text-center text-xs text-[var(--text-muted)]">{t("members.no_memberships_yet_use_assign_plan")}</p>
        )}
        {items?.map((m) => {
          const meta = PERIOD_STATUS_META[m.effective_status] || { label: m.effective_status, variant: "outline" as BadgeVariant };
          const canFreeze = m.status === "active" && m.effective_status !== "expired" && !m.freezes.some((f) => !f.resumed_at);
          const hasOpenFreeze = m.freezes.some((f) => !f.resumed_at);
          return (
            <div key={m.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-[var(--text)]">{m.plan_name || t("members.membership")}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatDate(m.start_date)} – {formatDate(m.end_date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.payment_status === "paid" ? "active" : m.payment_status === "partial" ? "expiring" : "expired"}>
                    {m.payment_status === "paid" ? t("members.paid") : m.payment_status === "partial" ? t("members.partially_paid") : t("members.unpaid")}
                  </Badge>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div><dt className="text-[var(--text-muted)]">{t("members.price")}</dt><dd className="font-medium text-[var(--text)]">{formatCurrency(m.price_paid)}</dd></div>
                <div><dt className="text-[var(--text-muted)]">{t("members.paid")}</dt><dd className="font-medium text-[var(--text)]">{formatCurrency(m.amount_paid)}</dd></div>
                <div><dt className="text-[var(--text-muted)]">{t("members.balance")}</dt><dd className="font-medium text-[var(--text)]">{formatCurrency(m.balance_due)}</dd></div>
                <div><dt className="text-[var(--text-muted)]">{t("members.freeze_days_left")}</dt><dd className="font-medium text-[var(--text)]">{m.freeze_days_remaining}</dd></div>
              </dl>
              {hasOpenFreeze && (
                <p className="text-xs text-[var(--text-muted)]">
                  {m.freezes.filter((f) => !f.resumed_at).map((f) => `Frozen ${formatDate(f.start_date)} – ${formatDate(f.end_date)}${f.reason ? ` · ${f.reason}` : ""}`).join("; ")}
                </p>
              )}
              {(m.status === "active" || m.status === "frozen" || m.status === "expired") && (
                <div className="flex flex-wrap gap-2">
                  {canFreeze && (
                    <Button size="sm" variant="secondary" onClick={() => setDialog({ action: "freeze", membership: m })}>
                      {richText(t("members.snowflakefreeze"), { snowflake: <Snowflake className="h-3.5 w-3.5" /> })}</Button>
                  )}
                  {hasOpenFreeze && (
                    <Button size="sm" variant="secondary" disabled={busyId === m.id} onClick={() => unfreeze(m)}>
                      <Play className="h-3.5 w-3.5" /> {m.status === "frozen" ? t("members.resume") : t("members.cancel_scheduled_freeze")}
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setDialog({ action: "extend", membership: m })}>
                    {richText(t("members.calendarplusextend"), { calendarplus: <CalendarPlus className="h-3.5 w-3.5" /> })}</Button>
                  {m.status !== "frozen" && (
                    <Button size="sm" variant="secondary" onClick={() => setDialog({ action: "renew", membership: m })}>
                      {richText(t("members.refreshccwrenew"), { refreshccw: <RefreshCcw className="h-3.5 w-3.5" /> })}</Button>
                  )}
                  {m.status !== "expired" && (
                    <Button size="sm" variant="ghost" className="text-[var(--error)]" onClick={() => setDialog({ action: "cancel", membership: m })}>
                      {richText(t("members.xcirclecancel"), { xcircle: <XCircle className="h-3.5 w-3.5" /> })}</Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
      {assignOpen && <AssignMembershipDialog memberId={memberId} onClose={() => setAssignOpen(false)} onDone={done} />}
      {dialog && <MembershipActionDialog action={dialog.action} membership={dialog.membership} onClose={() => setDialog(null)} onDone={done} />}
    </Card>
  );
}

/* ---------------- Notes ---------------- */

export function NotesPanel({ memberId, currentUserId, canModerate }: { memberId: string; currentUserId?: string; canModerate: boolean }) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<ApiMemberNote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setNotes(await repsiApi.getMemberNotes(memberId));
    } catch (err: any) {
      setError(err.message);
    }
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await repsiApi.addMemberNote(memberId, draft.trim());
      setDraft("");
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editing || !editing.body.trim()) return;
    try {
      await repsiApi.updateMemberNote(memberId, editing.id, editing.body.trim());
      setEditing(null);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const remove = async (noteId: string) => {
    if (!confirm(t("members.delete_this_note_this_can_t"))) return;
    try {
      await repsiApi.deleteMemberNote(memberId, noteId);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)]">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("members.internal_notes")}</CardTitle>
        <p className="text-xs text-[var(--text-muted)]">{t("members.visible_to_gym_staff_only_never")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={add} className="space-y-2">
          <label htmlFor="new-note" className="sr-only">{t("members.new_note")}</label>
          <textarea id="new-note" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("members.add_a_note_for_the_team")} className={`${inputClass} resize-none`} maxLength={5000} />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={saving || !draft.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t("members.add_note")}
            </Button>
          </div>
        </form>
        {error && <InlineError message={error} onRetry={load} />}
        {notes === null && !error && <LoadingRow />}
        {notes?.length === 0 && <p className="py-4 text-center text-xs text-[var(--text-muted)]">{t("members.no_notes_yet")}</p>}
        <ul className="space-y-3">
          {notes?.map((n) => {
            const canChange = canModerate || n.author_user_id === currentUserId;
            const isEditing = editing?.id === n.id;
            return (
              <li key={n.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-sm">
                {isEditing ? (
                  <div className="space-y-2">
                    <label htmlFor={`edit-${n.id}`} className="sr-only">{t("members.edit_note")}</label>
                    <textarea id={`edit-${n.id}`} rows={3} value={editing.body} onChange={(e) => setEditing({ id: n.id, body: e.target.value })} className={`${inputClass} resize-none`} />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>{t("common.cancel")}</Button>
                      <Button size="sm" onClick={saveEdit}>{t("members.save")}</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap text-[var(--text)]">{n.body}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <span>
                        {n.author_name || t("organization.staff")} · {formatDate(n.created_at)}
                        {n.updated_at !== n.created_at && " · edited"}
                      </span>
                      {canChange && (
                        <span className="flex gap-1">
                          <Button size="icon-sm" variant="ghost" aria-label={t("members.edit_note")} onClick={() => setEditing({ id: n.id, body: n.body })}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" aria-label={t("members.delete_note")} className="text-[var(--error)]" onClick={() => remove(n.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </span>
                      )}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

/* ---------------- History ---------------- */

export function HistoryPanel({ memberId }: { memberId: string }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ApiMemberHistoryItem[] | null>(null);
  const [source, setSource] = useState<"" | "member" | "membership">("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setItems(null);
    try {
      setItems(await repsiApi.getMemberHistory(memberId, source || undefined));
    } catch (err: any) {
      setError(err.message);
    }
  }, [memberId, source]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)]">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base font-semibold">{t("members.history")}</CardTitle>
        <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          {t("members.show")}
          <select value={source} onChange={(e) => setSource(e.target.value as typeof source)} className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-1 text-xs text-[var(--text)]">
            <option value="">{t("members.everything")}</option>
            <option value="member">{t("members.account_notes")}</option>
            <option value="membership">{t("members.membership_changes")}</option>
          </select>
        </label>
      </CardHeader>
      <CardContent>
        {error && <InlineError message={error} onRetry={load} />}
        {items === null && !error && <LoadingRow />}
        {items?.length === 0 && <p className="py-6 text-center text-xs text-[var(--text-muted)]">{t("members.no_recorded_activity_yet")}</p>}
        <ol className="relative space-y-4 border-l border-[var(--border)] pl-4">
          {items?.map((h) => (
            <li key={h.id} className="text-xs">
              <span className="absolute -left-[5px] mt-1 h-2.5 w-2.5 rounded-full bg-[var(--primary)]" aria-hidden />
              <p className="text-sm font-medium text-[var(--text)]">
                {humanize(h.event_type)}
                {h.from_status && h.to_status && h.from_status !== h.to_status && (
                  <span className="font-normal text-[var(--text-muted)]"> · {h.from_status} → {h.to_status}</span>
                )}
              </p>
              {h.new_end_date && (
                <p className="text-[var(--text-secondary)]">
                  {h.previous_end_date ? t("members.end_date_value_value2", undefined, { value: formatDate(h.previous_end_date), value2: formatDate(h.new_end_date) }) : t("members.valid_until_value", undefined, { value: formatDate(h.new_end_date) })}
                </p>
              )}
              {h.reason && <p className="text-[var(--text-secondary)]">{t("members.reason_reason", undefined, { reason: h.reason })}</p>}
              <p className="text-[var(--text-muted)]">{h.actor_name || t("members.system")} · {new Date(h.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

/* ---------------- Payments ---------------- */

export function PaymentsPanel({ memberId }: { memberId: string }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await repsiApi.getMemberPayments(memberId));
    } catch (err: any) {
      setError(err.message);
    }
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)]">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("members.payment_history")}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <InlineError message={error} onRetry={load} />}
        {items === null && !error && <LoadingRow />}
        {items?.length === 0 && <p className="py-6 text-center text-xs text-[var(--text-muted)]">{t("members.no_payments_recorded_for_this_member")}</p>}
        {!!items?.length && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                  <th className="py-2 pr-3 font-medium">{t("common.date")}</th>
                  <th className="py-2 pr-3 font-medium">{t("common.amount")}</th>
                  <th className="py-2 pr-3 font-medium">{t("pay.method")}</th>
                  <th className="py-2 pr-3 font-medium">{t("members.reference")}</th>
                  <th className="py-2 font-medium">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDate(p.paid_at)}</td>
                    <td className="py-2 pr-3 font-medium text-[var(--text)]">{formatCurrency(p.amount)}</td>
                    <td className="py-2 pr-3 uppercase">{p.method}</td>
                    <td className="py-2 pr-3 font-mono">{p.transaction_ref || "—"}</td>
                    <td className="py-2">
                      <Badge variant={p.status === "success" ? "active" : p.status === "pending" ? "expiring" : "cancelled"}>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
