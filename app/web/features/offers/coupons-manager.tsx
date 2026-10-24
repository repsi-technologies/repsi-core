"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, TicketPercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyBlock, Field, LoadingRow, Modal, Notice, inputClass } from "@/features/fitness/shared";
import { formatMoney, offersApi, type Coupon } from "@/lib/operations-api";
import { useTranslation, richText } from "@/lib/i18n";

function describe(c: Coupon): string {
  const value = c.discount_type === "percent" ? `${c.discount_value}% off` : `${formatMoney(c.discount_value)} off`;
  const cap = c.max_discount ? ` (up to ${formatMoney(c.max_discount)})` : "";
  return value + cap;
}

function CouponForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    code: "", description: "", discount_type: "percent" as "percent" | "flat", discount_value: 10,
    max_discount: "", valid_from: "", valid_until: "", max_redemptions: "", max_per_member: 1, new_members_only: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await offersApi.create({
        code: form.code, description: form.description || undefined, discount_type: form.discount_type,
        discount_value: Number(form.discount_value), max_per_member: Number(form.max_per_member),
        new_members_only: form.new_members_only,
        max_discount: form.max_discount ? Number(form.max_discount) : undefined,
        max_redemptions: form.max_redemptions ? Number(form.max_redemptions) : undefined,
        valid_from: form.valid_from || undefined, valid_until: form.valid_until || undefined,
      });
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title={t("offers.new_coupon")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <Notice kind="error">{error}</Notice>}
        <Field label={t("organization.code")} htmlFor="coupon-code" hint={t("offers.letters_and_numbers_e_g_diwali20")}>
          <input id="coupon-code" required minLength={3} maxLength={40} spellCheck={false} autoComplete="off"
            className={`${inputClass} uppercase`} value={form.code} onChange={(e) => set("code", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("offers.type")} htmlFor="coupon-type">
            <select id="coupon-type" className={inputClass} value={form.discount_type} onChange={(e) => set("discount_type", e.target.value)}>
              <option value="percent">{t("offers.percentage")}</option>
              <option value="flat">{t("offers.fixed_amount")}</option>
            </select>
          </Field>
          <Field label={form.discount_type === "percent" ? t("offers.percent_off") : t("offers.amount_off")} htmlFor="coupon-value">
            <input id="coupon-value" type="number" min={1} max={form.discount_type === "percent" ? 100 : undefined} required
              className={inputClass} value={form.discount_value} onChange={(e) => set("discount_value", e.target.value)} />
          </Field>
          {form.discount_type === "percent" && (
            <Field label={t("offers.maximum_discount_optional")} htmlFor="coupon-cap">
              <input id="coupon-cap" type="number" min={1} className={inputClass} value={form.max_discount} onChange={(e) => set("max_discount", e.target.value)} />
            </Field>
          )}
          <Field label={t("offers.total_uses_optional")} htmlFor="coupon-max">
            <input id="coupon-max" type="number" min={1} className={inputClass} value={form.max_redemptions} onChange={(e) => set("max_redemptions", e.target.value)} />
          </Field>
          <Field label={t("offers.valid_from")} htmlFor="coupon-from">
            <input id="coupon-from" type="date" className={inputClass} value={form.valid_from} onChange={(e) => set("valid_from", e.target.value)} />
          </Field>
          <Field label={t("offers.valid_until")} htmlFor="coupon-until">
            <input id="coupon-until" type="date" className={inputClass} value={form.valid_until} onChange={(e) => set("valid_until", e.target.value)} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.new_members_only} onChange={(e) => set("new_members_only", e.target.checked)} /> {t("offers.new_members_only")}
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="submit" size="sm" loading={saving}>{t("offers.create_coupon")}</Button>
        </div>
      </form>
    </Modal>
  );
}

export function CouponsManager() {
  const { t } = useTranslation();
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    offersApi.list(true).then(setCoupons).catch((e) => { setError(e.message); setCoupons([]); });
  }, []);
  useEffect(load, [load]);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight">{t("offers.offers_and_coupons")}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t("offers.apply_a_code_when_assigning_or")}</p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>{richText(t("offers.plusnew_coupon"), { plus: <Plus aria-hidden /> })}</Button>
      </div>
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      {coupons === null ? <LoadingRow /> : coupons.length === 0 ? (
        <EmptyBlock title={t("offers.no_coupons_yet")}>{t("offers.create_one_for_a_festival_offer")}</EmptyBlock>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-secondary)] text-xs text-[var(--text-secondary)]">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">{t("organization.code")}</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">{t("offers.discount")}</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">{t("offers.valid")}</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">{t("offers.used")}</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">{t("common.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 font-mono"><TicketPercent className="inline h-4 w-4 mr-1 text-[var(--primary)]" aria-hidden />{c.code}</td>
                  <td className="px-3 py-2">{describe(c)}{c.new_members_only ? t("offers.new_members") : ""}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{c.valid_from || "now"} – {c.valid_until || t("offers.no_end")}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.redemptions}{c.max_redemptions ? ` / ${c.max_redemptions}` : ""}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      aria-label={c.is_active ? t("offers.deactivate_code", undefined, { code: c.code }) : t("offers.activate_code", undefined, { code: c.code })}
                      onClick={async () => { await offersApi.update(c.id, { is_active: !c.is_active }).catch((e) => setError(e.message)); load(); }}
                    >
                      <Badge variant={c.is_active ? "active" : "cancelled"}>{c.is_active ? t("layout.active") : t("offers.inactive")}</Badge>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {creating && <CouponForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}
    </div>
  );
}
