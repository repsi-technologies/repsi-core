"use client";

import { useEffect, useState } from "react";
import type { CountryCode } from "libphonenumber-js/min";
import { CountrySelect } from "@/components/ui/country-select";
import {
  DEFAULT_COUNTRY,
  findCountry,
  formatNational,
  isValidPhone,
  splitPhone,
  type CountryOption,
} from "@/lib/countries";
import { cn } from "@/lib/utils";

export interface PhoneInputProps {
  id?: string;
  /** "+<calling code> <national number>", e.g. "+91 9845012345", or "" when empty. */
  value: string;
  onChange: (val: string) => void;
  /** Fired when the country changes; `country.code` is the ISO code to send to the API. */
  onCountryChange?: (country: CountryOption) => void;
  onBlur?: () => void;
  /** Initial/default country (ISO alpha-2) when `value` has no calling code. */
  defaultCountry?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  /** Kept for backwards compatibility; the input always follows the theme tokens. */
  forceLight?: boolean;
  "aria-describedby"?: string;
}

export { isValidPhone };

export function PhoneInput({
  id = "phone",
  value,
  onChange,
  onCountryChange,
  onBlur,
  defaultCountry,
  placeholder,
  className = "",
  required = false,
  disabled = false,
  error = false,
  ...rest
}: PhoneInputProps) {
  const fallback = (findCountry(defaultCountry)?.code || DEFAULT_COUNTRY) as CountryCode;
  const [country, setCountry] = useState<CountryCode>(() => splitPhone(value, fallback).country);
  const national = value ? splitPhone(value, country).national : "";

  // Follow external country changes (e.g. a form reset or loaded record).
  useEffect(() => {
    if (value) {
      const parsed = splitPhone(value, country);
      if (parsed.country !== country && value.startsWith("+")) setCountry(parsed.country);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const opt = findCountry(country);
    if (opt && onCountryChange) onCountryChange(opt);
    // Notify once on mount so callers know the initial country.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = (digits: string, c: CountryCode) => {
    const dial = findCountry(c)?.dialCode || "";
    onChange(digits ? `${dial} ${digits}` : "");
  };

  return (
    <div
      className={cn(
        "flex h-10 w-full items-stretch overflow-hidden rounded-[8px] border bg-[var(--surface)] transition-colors focus-within:ring-2 focus-within:ring-[var(--ring)] focus-within:border-[var(--ring)]",
        error ? "border-[var(--error,#DC2626)] focus-within:ring-[var(--error,#DC2626)]" : "border-[var(--border)]",
        disabled && "opacity-60",
        className
      )}
    >
      <div className="flex shrink-0 items-stretch border-r border-[var(--border)] bg-[var(--background)]">
        <CountrySelect
          display="dial"
          value={country}
          disabled={disabled}
          onChange={(opt) => {
            setCountry(opt.code);
            onCountryChange?.(opt);
            emit(national, opt.code);
          }}
        />
      </div>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        required={required}
        disabled={disabled}
        aria-invalid={error || undefined}
        aria-describedby={rest["aria-describedby"]}
        placeholder={placeholder || (country === "IN" ? "98450 12345" : "Phone number")}
        value={national ? formatNational(national, country) : ""}
        onChange={(e) => {
          let raw = e.target.value;
          // Pasted international numbers ("+91 98450...") switch the country automatically.
          if (raw.trim().startsWith("+")) {
            const parsed = splitPhone(raw, country);
            setCountry(parsed.country);
            const opt = findCountry(parsed.country);
            if (opt) onCountryChange?.(opt);
            emit(parsed.national.slice(0, 15), parsed.country);
            return;
          }
          raw = raw.replace(/\D/g, "").replace(/^0+/, "").slice(0, 15);
          emit(raw, country);
        }}
        onBlur={onBlur}
        className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
      />
    </div>
  );
}

/** Country code embedded in a PhoneInput value, for sending alongside the number. */
export function phoneCountry(value: string, fallback: string = DEFAULT_COUNTRY): string {
  return splitPhone(value, (findCountry(fallback)?.code || DEFAULT_COUNTRY) as CountryCode).country;
}
