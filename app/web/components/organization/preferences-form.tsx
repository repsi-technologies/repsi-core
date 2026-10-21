"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarX, Copy, Plus, X } from "lucide-react";
import type { CountryCode } from "libphonenumber-js/min";

import { FormAlert, FormField, PrimaryButton, SecondaryButton, SelectInput, TextInput, Toggle } from "@/components/organization/form-fields";
import {
  ApiError,
  DAY_LABELS,
  defaultHours,
  type OpeningHours,
  type OrganizationProfile,
  type PreferencesInput,
} from "@/lib/auth-client";
import { CURRENCIES, REGION_DEFAULTS, listTimezones } from "@/lib/countries";
import { cn } from "@/lib/utils";

const LOCALES = [
  { value: "en-IN", label: "English (India)" },
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "en-AE", label: "English (UAE)" },
  { value: "en-SG", label: "English (Singapore)" },
  { value: "en-AU", label: "English (Australia)" },
  { value: "ta-IN", label: "தமிழ் (Tamil)" },
  { value: "ml-IN", label: "മലയാളം (Malayalam)" },
  { value: "kn-IN", label: "ಕನ್ನಡ (Kannada)" },
  { value: "te-IN", label: "తెలుగు (Telugu)" },
  { value: "hi-IN", label: "हिन्दी (Hindi)" },
];

export function hoursErrors(hours: OpeningHours): Partial<Record<keyof OpeningHours, string>> {
  const errs: Partial<Record<keyof OpeningHours, string>> = {};
  for (const { key } of DAY_LABELS) {
    const d = hours[key];
    if (d.closed) continue;
    if (!d.open || !d.close) errs[key] = "Set opening and closing times.";
    else if (d.open >= d.close) errs[key] = "Closing time must be after opening time.";
  }
  return errs;
}

export function OpeningHoursEditor({
  value,
  onChange,
  disabled,
  errors,
}: {
  value: OpeningHours;
  onChange: (v: OpeningHours) => void;
  disabled?: boolean;
  errors?: Partial<Record<keyof OpeningHours, string>>;
}) {
  const update = (key: keyof OpeningHours, patch: Partial<OpeningHours[keyof OpeningHours]>) =>
    onChange({ ...value, [key]: { ...value[key], ...patch } });

  return (
    <div className="space-y-2">
      <div className="divide-y divide-[var(--border)] rounded-[12px] border border-[var(--border)]">
        {DAY_LABELS.map(({ key, label, short }) => {
          const d = value[key];
          const err = errors?.[key];
          return (
            <div key={key} className="px-3 py-2.5 sm:px-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex w-[124px] items-center gap-3">
                  <Toggle checked={!d.closed} disabled={disabled} label={`${label} open`}
                    onChange={(open) => update(key, open ? { closed: false, open: d.open || "06:00", close: d.close || "22:00" } : { closed: true })} />
                  <span className="text-sm font-medium text-[var(--text)]">
                    <span className="sm:hidden">{short}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </span>
                </div>
                {d.closed ? (
                  <span className="text-sm text-[var(--text-muted)]">Closed</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <input type="time" aria-label={`${label} opening time`} value={d.open || ""} disabled={disabled}
                      onChange={(e) => update(key, { open: e.target.value })}
                      className={cn("h-9 rounded-[8px] border bg-[var(--surface)] px-2 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]", err ? "border-[var(--error,#DC2626)]" : "border-[var(--border)]")} />
                    <span className="text-sm text-[var(--text-muted)]">to</span>
                    <input type="time" aria-label={`${label} closing time`} value={d.close || ""} disabled={disabled}
                      onChange={(e) => update(key, { close: e.target.value })}
                      className={cn("h-9 rounded-[8px] border bg-[var(--surface)] px-2 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]", err ? "border-[var(--error,#DC2626)]" : "border-[var(--border)]")} />
                  </div>
                )}
              </div>
              {err && <p role="alert" className="mt-1 text-xs font-medium text-[var(--error,#DC2626)]">{err}</p>}
            </div>
          );
        })}
      </div>
      {!disabled && (
        <button type="button"
          onClick={() => {
            const mon = value.mon;
            onChange({ ...value, tue: mon, wed: mon, thu: mon, fri: mon });
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--primary-dark)] hover:underline">
          <Copy className="h-3.5 w-3.5" aria-hidden /> Copy Monday to Tuesday–Friday
        </button>
      )}
    </div>
  );
}

interface Props {
  profile?: OrganizationProfile | null;
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (data: PreferencesInput) => Promise<void>;
}

export function PreferencesForm({ profile, submitLabel, disabled, onSubmit }: Props) {
  const timezones = useMemo(() => listTimezones(), []);
  const [form, setForm] = useState<PreferencesInput>(() => fromProfile(profile));
  const [hourErrs, setHourErrs] = useState<Partial<Record<keyof OpeningHours, string>>>({});
  const [newDate, setNewDate] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => setForm(fromProfile(profile)), [profile]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = hoursErrors(form.opening_hours);
    setHourErrs(errs);
    if (Object.keys(errs).length) return setError("Fix the highlighted opening hours.");
    setSaving(true);
    setError("");
    try {
      await onSubmit(form);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const addDate = () => {
    if (!newDate) return;
    if (form.closed_dates.some((d) => d.date === newDate)) return setError("That date is already listed.");
    setForm((f) => ({
      ...f,
      closed_dates: [...f.closed_dates, { date: newDate, label: newLabel.trim() || "Closed" }].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    setNewDate("");
    setNewLabel("");
    setError("");
    setSaved(false);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {error && <FormAlert>{error}</FormAlert>}

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField id="pref-tz" label="Time zone" required>
          <SelectInput id="pref-tz" value={form.timezone} disabled={disabled}
            onChange={(e) => { setForm((f) => ({ ...f, timezone: e.target.value })); setSaved(false); }}>
            {!timezones.includes(form.timezone) && <option value={form.timezone}>{form.timezone}</option>}
            {timezones.map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
          </SelectInput>
        </FormField>
        <FormField id="pref-currency" label="Currency" required>
          <SelectInput id="pref-currency" value={form.currency} disabled={disabled}
            onChange={(e) => { setForm((f) => ({ ...f, currency: e.target.value })); setSaved(false); }}>
            {!CURRENCIES.includes(form.currency) && <option>{form.currency}</option>}
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </SelectInput>
        </FormField>
        <FormField id="pref-locale" label="Language & format" required>
          <SelectInput id="pref-locale" value={form.locale} disabled={disabled}
            onChange={(e) => { setForm((f) => ({ ...f, locale: e.target.value })); setSaved(false); }}>
            {!LOCALES.some((l) => l.value === form.locale) && <option value={form.locale}>{form.locale}</option>}
            {LOCALES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </SelectInput>
        </FormField>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--text)]">Opening hours</h3>
        <p className="text-xs text-[var(--text-muted)]">Default hours for every branch. Branches can override them.</p>
        <OpeningHoursEditor value={form.opening_hours} disabled={disabled} errors={hourErrs}
          onChange={(h) => { setForm((f) => ({ ...f, opening_hours: h })); setHourErrs({}); setSaved(false); }} />
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">Holidays & closed days</h3>
          <p className="text-xs text-[var(--text-muted)]">Dates when the business is closed regardless of opening hours.</p>
        </div>
        {form.closed_dates.length === 0 ? (
          <p className="flex items-center gap-2 rounded-[10px] border border-dashed border-[var(--border)] px-3 py-3 text-sm text-[var(--text-muted)]">
            <CalendarX className="h-4 w-4" aria-hidden /> No closed dates added.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {form.closed_dates.map((d) => (
              <li key={d.date} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] py-1 pl-3 pr-1 text-sm">
                <span className="tabular-nums">{new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="text-[var(--text-muted)]">· {d.label}</span>
                {!disabled && (
                  <button type="button" aria-label={`Remove ${d.label}`}
                    onClick={() => { setForm((f) => ({ ...f, closed_dates: f.closed_dates.filter((x) => x.date !== d.date) })); setSaved(false); }}
                    className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[var(--surface-hover)]">
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {!disabled && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <TextInput type="date" aria-label="Closed date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="sm:w-44" />
            <TextInput aria-label="Reason" placeholder="Reason (e.g. Diwali)" value={newLabel} maxLength={80}
              onChange={(e) => setNewLabel(e.target.value)} className="sm:flex-1"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDate(); } }} />
            <SecondaryButton type="button" onClick={addDate} disabled={!newDate}>
              <Plus className="h-4 w-4" aria-hidden /> Add date
            </SecondaryButton>
          </div>
        )}
      </div>

      {!disabled && (
        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          {saved && <span role="status" className="text-sm text-emerald-700">Saved</span>}
          <PrimaryButton type="submit" loading={saving}>{submitLabel}</PrimaryButton>
        </div>
      )}
    </form>
  );
}

function fromProfile(p?: OrganizationProfile | null): PreferencesInput {
  const region = REGION_DEFAULTS[(p?.country_code || "IN") as CountryCode] || REGION_DEFAULTS.IN!;
  return {
    timezone: p?.timezone || region.timezone,
    currency: p?.currency || region.currency,
    locale: p?.locale || region.locale,
    opening_hours: p?.opening_hours || defaultHours(),
    closed_dates: p?.closed_dates || [],
  };
}
