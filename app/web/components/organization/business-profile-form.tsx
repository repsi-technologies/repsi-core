"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import type { CountryCode } from "libphonenumber-js/min";

import { PhoneInput } from "@/components/ui/phone-input";
import { CountrySelect } from "@/components/ui/country-select";
import { FormAlert, FormField, PrimaryButton, SelectInput, TextInput } from "@/components/organization/form-fields";
import { ApiError, apiUrl, type BusinessProfileInput, type OrganizationProfile } from "@/lib/auth-client";
import { countryName, findCountry, isValidPhone, splitPhone } from "@/lib/countries";

export const BUSINESS_TYPES = [
  "Gym & Fitness center",
  "Yoga studio",
  "CrossFit / Functional training",
  "Personal training studio",
  "Martial arts academy",
  "Dance studio",
  "Swimming & aquatics",
  "Sports academy",
  "Other",
];

export const BUSINESS_SIZES = ["Just starting", "Under 100 members", "100–500 members", "500–1,000 members", "1,000+ members"];

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const LOGO_MAX = 2 * 1024 * 1024;

type Errors = Partial<Record<keyof BusinessProfileInput | "form" | "logo", string>>;

interface Props {
  profile?: OrganizationProfile | null;
  defaultEmail?: string;
  /** Prefills the contact phone (e.g. the owner's verified mobile) for a new business. */
  defaultPhone?: string | null;
  /** Show the workspace URL field (only editable before setup is complete). */
  showSlug?: boolean;
  submitLabel: string;
  disabled?: boolean;
  /** Persists the profile; resolves once saved. Errors are shown inline. */
  onSubmit: (data: BusinessProfileInput) => Promise<void>;
  /** Uploads a logo; when the organization doesn't exist yet the file is passed to onSubmit's caller via pendingLogo. */
  onLogoUpload?: (file: File) => Promise<void>;
  onLogoRemove?: () => Promise<void>;
  pendingLogo?: File | null;
  onPendingLogo?: (file: File | null) => void;
}

function slugify(v: string) {
  return v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export function BusinessProfileForm({
  profile,
  defaultEmail,
  defaultPhone,
  showSlug,
  submitLabel,
  disabled,
  onSubmit,
  onLogoUpload,
  onLogoRemove,
  pendingLogo,
  onPendingLogo,
}: Props) {
  const [form, setForm] = useState<BusinessProfileInput>(() => fromProfile(profile, defaultEmail, defaultPhone));
  const [slugTouched, setSlugTouched] = useState(Boolean(profile?.slug));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(fromProfile(profile, defaultEmail, defaultPhone));
    setSlugTouched(Boolean(profile?.slug));
  }, [profile, defaultEmail, defaultPhone]);

  useEffect(() => {
    if (!pendingLogo) return setPreview(null);
    const url = URL.createObjectURL(pendingLogo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingLogo]);

  const set = <K extends keyof BusinessProfileInput>(key: K, value: BusinessProfileInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined, form: undefined }));
    setSaved(false);
  };

  function validate(): boolean {
    const e: Errors = {};
    if (form.name.trim().length < 2) e.name = "Enter your business name.";
    if (showSlug && form.slug && !/^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$/.test(form.slug))
      e.slug = "Use 3–60 lowercase letters, numbers or hyphens.";
    if (form.business_email && !/^\S+@\S+\.\S+$/.test(form.business_email)) e.business_email = "Enter a valid email.";
    if (!isValidPhone(form.phone, form.phone_country as CountryCode)) e.phone = "Enter a valid phone number for the selected country.";
    if (form.address_line1.trim().length < 3) e.address_line1 = "Enter the street address.";
    if (form.city.trim().length < 2) e.city = "Enter the city.";
    if (!form.country_code) e.country_code = "Select a country.";
    if (form.postal_code && !/^[A-Za-z0-9][A-Za-z0-9 -]{1,18}$/.test(form.postal_code)) e.postal_code = "Enter a valid postal code.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    setSaving(true);
    try {
      const national = splitPhone(form.phone, form.phone_country as CountryCode).national;
      await onSubmit({
        ...form,
        phone: national,
        slug: showSlug ? form.slug || undefined : undefined,
        business_email: form.business_email || undefined,
        country: countryName(form.country_code),
      });
      setSaved(true);
    } catch (err) {
      const api = err instanceof ApiError ? err : null;
      const fe = api?.fieldErrors || {};
      setErrors({ ...Object.fromEntries(Object.entries(fe)), form: api?.message || "Couldn't save. Please try again." } as Errors);
    } finally {
      setSaving(false);
    }
  }

  async function pickLogo(file: File | undefined) {
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) return setErrors((e) => ({ ...e, logo: "Use a PNG, JPG or WebP image." }));
    if (file.size > LOGO_MAX) return setErrors((e) => ({ ...e, logo: "Logo must be 2 MB or smaller." }));
    setErrors((e) => ({ ...e, logo: undefined }));
    if (onLogoUpload && profile) {
      setLogoBusy(true);
      try {
        await onLogoUpload(file);
      } catch (err) {
        setErrors((e) => ({ ...e, logo: err instanceof ApiError ? err.message : "Upload failed." }));
      } finally {
        setLogoBusy(false);
      }
    } else {
      onPendingLogo?.(file);
    }
  }

  const logoSrc = preview || (profile?.logo_url ? apiUrl(profile.logo_url) : null);

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {errors.form && <FormAlert>{errors.form}</FormAlert>}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-dashed border-[var(--border-strong,#C9C7C1)] bg-[var(--background)]">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="Business logo preview" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus className="h-6 w-6 text-[var(--text-muted)]" aria-hidden />
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--text)]">Business logo <span className="text-xs font-normal text-[var(--text-muted)]">(optional)</span></p>
          <p className="text-xs text-[var(--text-muted)]">PNG, JPG or WebP, up to 2 MB. Square images look best.</p>
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept={LOGO_TYPES.join(",")} className="sr-only" id="logo-file"
              onChange={(e) => {
                pickLogo(e.target.files?.[0]);
                e.target.value = "";
              }} />
            <label htmlFor="logo-file"
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-medium hover:bg-[var(--surface-hover)] focus-within:ring-2 focus-within:ring-[var(--ring)]">
              {logoBusy ? "Uploading…" : logoSrc ? "Replace" : "Upload logo"}
            </label>
            {logoSrc && (
              <button type="button" disabled={logoBusy}
                onClick={async () => {
                  if (pendingLogo) return onPendingLogo?.(null);
                  if (onLogoRemove) {
                    setLogoBusy(true);
                    try { await onLogoRemove(); } finally { setLogoBusy(false); }
                  }
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-xs font-medium text-[var(--text-muted)] hover:text-rose-600">
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
              </button>
            )}
          </div>
          {errors.logo && <p role="alert" className="text-xs font-medium text-[var(--error,#DC2626)]">{errors.logo}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="biz-name" label="Business name" required error={errors.name} className="sm:col-span-2">
          <TextInput id="biz-name" value={form.name} invalid={Boolean(errors.name)} disabled={disabled}
            autoComplete="organization" placeholder="Iron Temple Fitness"
            onChange={(e) => {
              set("name", e.target.value);
              if (showSlug && !slugTouched) set("slug", slugify(e.target.value));
            }} />
        </FormField>

        {showSlug && (
          <FormField id="biz-slug" label="Workspace URL" required error={errors.slug} hint="Your team signs in at this address. You can't change it after setup."
            className="sm:col-span-2">
            <div className="flex items-stretch overflow-hidden rounded-[8px] border border-[var(--border)] focus-within:ring-2 focus-within:ring-[var(--ring)]">
              <span className="flex items-center bg-[var(--background)] px-3 text-sm text-[var(--text-muted)]">repsi.app/</span>
              <input id="biz-slug" value={form.slug || ""} aria-invalid={Boolean(errors.slug) || undefined}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                }}
                className="h-10 min-w-0 flex-1 bg-[var(--surface)] px-2 text-sm outline-none" />
            </div>
          </FormField>
        )}

        <FormField id="biz-type" label="Business type" required>
          <SelectInput id="biz-type" value={form.gym_type || BUSINESS_TYPES[0]} disabled={disabled}
            onChange={(e) => set("gym_type", e.target.value)}>
            {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
          </SelectInput>
        </FormField>

        <FormField id="biz-size" label="Approximate members">
          <SelectInput id="biz-size" value={form.business_size || ""} disabled={disabled}
            onChange={(e) => set("business_size", e.target.value)}>
            <option value="">Select…</option>
            {BUSINESS_SIZES.map((t) => <option key={t}>{t}</option>)}
          </SelectInput>
        </FormField>

        <FormField id="biz-email" label="Business email" error={errors.business_email}>
          <TextInput id="biz-email" type="email" value={form.business_email || ""} invalid={Boolean(errors.business_email)}
            disabled={disabled} autoComplete="email" placeholder="hello@yourgym.com"
            onChange={(e) => set("business_email", e.target.value)} />
        </FormField>

        <FormField id="biz-phone" label="Contact phone" required error={errors.phone}>
          <PhoneInput id="biz-phone" value={form.phone} error={Boolean(errors.phone)} disabled={disabled}
            defaultCountry={form.phone_country}
            onChange={(v) => set("phone", v)}
            onCountryChange={(c) => setForm((f) => ({ ...f, phone_country: c.code }))} />
        </FormField>
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-[var(--text)]">Address</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="biz-addr1" label="Street address" required error={errors.address_line1} className="sm:col-span-2">
            <TextInput id="biz-addr1" value={form.address_line1} invalid={Boolean(errors.address_line1)} disabled={disabled}
              autoComplete="address-line1" placeholder="Building, street" onChange={(e) => set("address_line1", e.target.value)} />
          </FormField>
          <FormField id="biz-addr2" label="Area / landmark" className="sm:col-span-2">
            <TextInput id="biz-addr2" value={form.address_line2 || ""} disabled={disabled} autoComplete="address-line2"
              onChange={(e) => set("address_line2", e.target.value)} />
          </FormField>
          <FormField id="biz-city" label="City" required error={errors.city}>
            <TextInput id="biz-city" value={form.city} invalid={Boolean(errors.city)} disabled={disabled}
              autoComplete="address-level2" onChange={(e) => set("city", e.target.value)} />
          </FormField>
          <FormField id="biz-state" label="State / region">
            <TextInput id="biz-state" value={form.state || ""} disabled={disabled} autoComplete="address-level1"
              onChange={(e) => set("state", e.target.value)} />
          </FormField>
          <FormField id="biz-postal" label="Postal code" error={errors.postal_code}>
            <TextInput id="biz-postal" value={form.postal_code || ""} invalid={Boolean(errors.postal_code)} disabled={disabled}
              autoComplete="postal-code" onChange={(e) => set("postal_code", e.target.value)} />
          </FormField>
          <FormField id="biz-country" label="Country" required error={errors.country_code}>
            <CountrySelect id="biz-country" value={form.country_code} invalid={Boolean(errors.country_code)} disabled={disabled}
              onChange={(c) => set("country_code", c.code)} />
          </FormField>
        </div>
      </fieldset>

      {!disabled && (
        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          {saved && <span role="status" className="text-sm text-emerald-700">Saved</span>}
          <PrimaryButton type="submit" loading={saving}>{submitLabel}</PrimaryButton>
        </div>
      )}
    </form>
  );
}

function fromProfile(p?: OrganizationProfile | null, defaultEmail?: string, defaultPhone?: string | null): BusinessProfileInput {
  const country = p?.country_code || "IN";
  const phone = p?.phone || defaultPhone || "";
  const split = phone ? splitPhone(phone, country as CountryCode) : null;
  return {
    name: p?.name || "",
    slug: p?.slug || "",
    business_email: p?.business_email || defaultEmail || "",
    phone: split ? `${findCountry(split.country)?.dialCode || ""} ${split.national}` : "",
    phone_country: split ? split.country : country,
    gym_type: p?.gym_type || BUSINESS_TYPES[0],
    business_types: p?.business_types || [],
    business_size: p?.business_size || "",
    address_line1: p?.address_line1 || "",
    address_line2: p?.address_line2 || "",
    city: p?.city || "",
    state: p?.state || "",
    postal_code: p?.postal_code || "",
    country_code: country,
  };
}
