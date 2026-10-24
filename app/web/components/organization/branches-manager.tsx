"use client";

import { useEffect, useState } from "react";
import { Building, Clock, Mail, MapPin, Pencil, Phone, Plus, Star } from "lucide-react";
import type { CountryCode } from "libphonenumber-js/min";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountrySelect } from "@/components/ui/country-select";
import { FormAlert, FormField, PrimaryButton, SecondaryButton, TextInput, Toggle } from "@/components/organization/form-fields";
import { OpeningHoursEditor, hoursErrors } from "@/components/organization/preferences-form";
import { ApiError, defaultHours, orgApi, type Branch, type BranchInput, type OpeningHours } from "@/lib/auth-client";
import { findCountry, formatPhone, isValidPhone, splitPhone } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { useTranslation, richText } from "@/lib/i18n";

interface Props {
  canEdit: boolean;
  defaultCountry?: string | null;
  businessHours?: OpeningHours | null;
  onChange?: (branches: Branch[]) => void;
}

export function BranchesManager({ canEdit, defaultCountry, businessHours, onChange }: Props) {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Branch | "new" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const list = await orgApi.branches(canEdit && showInactive);
      setBranches(list);
      onChange?.(list.filter((b) => b.is_active));
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("organization.couldn_t_load_branches"));
      setBranches([]);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  async function toggleActive(b: Branch) {
    setBusyId(b.id);
    try {
      await orgApi.setBranchActive(b.id, !b.is_active);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("organization.couldn_t_update_the_branch"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && <FormAlert>{error}</FormAlert>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {canEdit && (
          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            {richText(t("organization.inputshow_deactivated_branches"), { input: <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]" /> })}</label>
        )}
        {canEdit && (
          <PrimaryButton type="button" onClick={() => setEditing("new")} className="ml-auto">
            {richText(t("organization.plusadd_branch"), { plus: <Plus className="h-4 w-4" aria-hidden /> })}</PrimaryButton>
        )}
      </div>

      {branches === null ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-[12px] bg-[var(--background)]" />)}
        </div>
      ) : branches.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[var(--border)] px-6 py-10 text-center">
          <Building className="mx-auto h-8 w-8 text-[var(--text-muted)]" aria-hidden />
          <p className="mt-2 text-sm font-medium">{t("organization.no_branches_yet")}</p>
          <p className="text-sm text-[var(--text-muted)]">
            {canEdit ? t("organization.add_your_first_location_to_start") : t("organization.you_haven_t_been_assigned_to")}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {branches.map((b) => (
            <li key={b.id} className={cn("flex flex-col rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-4", !b.is_active && "opacity-60")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-semibold text-[var(--text)]">
                    <span className="truncate">{b.name}</span>
                    {b.is_primary && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary-dark)]">
                        {richText(t("organization.starprimary"), { star: <Star className="h-3 w-3" aria-hidden /> })}</span>
                    )}
                    {!b.is_active && <span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-[11px]">{t("organization.deactivated")}</span>}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">{t("organization.code_code", undefined, { code: b.code })}</p>
                </div>
                {canEdit && b.is_active && (
                  <button type="button" onClick={() => setEditing(b)} aria-label={t("organization.edit_name", undefined, { name: b.name })}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]">
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
              <dl className="mt-3 space-y-1.5 text-sm text-[var(--text-secondary)]">
                {(b.address_line1 || b.city) && (
                  <div className="flex gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>{[b.address_line1, b.address_line2, b.city, b.state, b.postal_code].filter(Boolean).join(", ")}</span></div>
                )}
                {b.phone && <div className="flex gap-2"><Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{formatPhone(b.phone)}</div>}
                {b.email && <div className="flex min-w-0 gap-2"><Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /><span className="truncate">{b.email}</span></div>}
                <div className="flex gap-2"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  {b.opening_hours ? t("organization.custom_hours") : t("organization.uses_business_hours")}</div>
              </dl>
              {canEdit && !b.is_primary && (
                <div className="mt-auto pt-3">
                  <button type="button" disabled={busyId === b.id} onClick={() => toggleActive(b)}
                    className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--primary-dark)] disabled:opacity-50">
                    {b.is_active ? t("organization.deactivate_branch") : t("organization.reactivate_branch")}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <BranchDialog
          branch={editing === "new" ? null : editing}
          defaultCountry={defaultCountry || "IN"}
          businessHours={businessHours}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function BranchDialog({
  branch,
  defaultCountry,
  businessHours,
  onClose,
  onSaved,
}: {
  branch: Branch | null;
  defaultCountry: string;
  businessHours?: OpeningHours | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const country = branch?.country_code || defaultCountry;
  const split = branch?.phone ? splitPhone(branch.phone, country as CountryCode) : null;
  const [form, setForm] = useState({
    name: branch?.name || "",
    code: branch?.code || "",
    address_line1: branch?.address_line1 || "",
    address_line2: branch?.address_line2 || "",
    city: branch?.city || "",
    state: branch?.state || "",
    postal_code: branch?.postal_code || "",
    country_code: country,
    phone: split ? `${findCountry(split.country)?.dialCode} ${split.national}` : "",
    phone_country: split?.country || country,
    email: branch?.email || "",
    is_primary: branch?.is_primary || false,
  });
  const [customHours, setCustomHours] = useState(Boolean(branch?.opening_hours));
  const [hours, setHours] = useState<OpeningHours>(branch?.opening_hours || businessHours || defaultHours());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form, v: string | boolean) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "", form: "" }));
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Enter a branch name.";
    if (form.phone && !isValidPhone(form.phone, form.phone_country as CountryCode)) errs.phone = "Enter a valid phone number.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email.";
    const hErr = customHours ? hoursErrors(hours) : {};
    if (Object.keys(hErr).length) errs.hours = "Fix the opening hours.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload: BranchInput = {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      address_line1: form.address_line1 || undefined,
      address_line2: form.address_line2 || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      postal_code: form.postal_code || undefined,
      country_code: form.country_code,
      phone: form.phone ? splitPhone(form.phone, form.phone_country as CountryCode).national : undefined,
      phone_country: form.phone_country,
      email: form.email || undefined,
      opening_hours: customHours ? hours : null,
      is_primary: form.is_primary,
    };
    setSaving(true);
    try {
      if (branch) await orgApi.updateBranch(branch.id, payload);
      else await orgApi.createBranch(payload);
      onSaved();
    } catch (err) {
      const api = err instanceof ApiError ? err : null;
      setErrors({ ...(api?.fieldErrors || {}), form: api?.message || t("organization.couldn_t_save_the_branch") });
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-24px)] overflow-y-auto rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:max-w-[600px] sm:p-6">
        <DialogHeader>
          <DialogTitle>{branch ? t("organization.edit_branch") : t("organization.add_branch")}</DialogTitle>
          <DialogDescription>{t("organization.location_details_your_team_and_members")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} noValidate className="mt-2 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="br-name" label={t("organization.branch_name")} required error={errors.name} className="sm:col-span-2">
              <TextInput id="br-name" value={form.name} invalid={Boolean(errors.name)} placeholder={t("organization.anna_nagar")}
                onChange={(e) => set("name", e.target.value)} autoFocus />
            </FormField>
            <FormField id="br-code" label={t("organization.code")} error={errors.code} hint={t("organization.auto_generated_if_empty")}>
              <TextInput id="br-code" value={form.code} invalid={Boolean(errors.code)} maxLength={20}
                onChange={(e) => set("code", e.target.value.toUpperCase())} />
            </FormField>
            <FormField id="br-addr1" label={t("organization.street_address")} className="sm:col-span-3">
              <TextInput id="br-addr1" value={form.address_line1} autoComplete="address-line1" onChange={(e) => set("address_line1", e.target.value)} />
            </FormField>
            <FormField id="br-addr2" label={t("organization.area_landmark")} className="sm:col-span-3">
              <TextInput id="br-addr2" value={form.address_line2} autoComplete="address-line2" onChange={(e) => set("address_line2", e.target.value)} />
            </FormField>
            <FormField id="br-city" label={t("organization.city")}>
              <TextInput id="br-city" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </FormField>
            <FormField id="br-state" label={t("organization.state")}>
              <TextInput id="br-state" value={form.state} onChange={(e) => set("state", e.target.value)} />
            </FormField>
            <FormField id="br-postal" label={t("organization.postal_code")} error={errors.postal_code}>
              <TextInput id="br-postal" value={form.postal_code} invalid={Boolean(errors.postal_code)} onChange={(e) => set("postal_code", e.target.value)} />
            </FormField>
            <FormField id="br-country" label={t("organization.country")} required className="sm:col-span-3">
              <CountrySelect id="br-country" value={form.country_code} onChange={(c) => set("country_code", c.code)} />
            </FormField>
            <FormField id="br-phone" label={t("organization.branch_phone")} error={errors.phone} className="sm:col-span-2">
              <PhoneInput id="br-phone" value={form.phone} error={Boolean(errors.phone)} defaultCountry={form.phone_country}
                onChange={(v) => set("phone", v)} onCountryChange={(c) => setForm((f) => ({ ...f, phone_country: c.code }))} />
            </FormField>
            <FormField id="br-email" label={t("organization.branch_email")} error={errors.email}>
              <TextInput id="br-email" type="email" value={form.email} invalid={Boolean(errors.email)} onChange={(e) => set("email", e.target.value)} />
            </FormField>
          </div>

          <div className="space-y-3 rounded-[12px] border border-[var(--border)] p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{t("organization.custom_opening_hours")}</p>
                <p className="text-xs text-[var(--text-muted)]">{t("organization.off_this_branch_follows_the_business")}</p>
              </div>
              <Toggle checked={customHours} onChange={setCustomHours} label={t("organization.custom_opening_hours")} />
            </div>
            {customHours && <OpeningHoursEditor value={hours} onChange={setHours} errors={hoursErrors(hours)} />}
            {errors.hours && <p role="alert" className="text-xs font-medium text-[var(--error,#DC2626)]">{errors.hours}</p>}
          </div>

          {!branch?.is_primary && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_primary} onChange={(e) => set("is_primary", e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
              {t("organization.make_this_the_primary_branch")}
            </label>
          )}

          {errors.form && <FormAlert>{errors.form}</FormAlert>}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <SecondaryButton type="button" onClick={onClose}>{t("common.cancel")}</SecondaryButton>
            <PrimaryButton type="submit" loading={saving}>{branch ? t("organization.save_branch") : t("organization.add_branch")}</PrimaryButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
