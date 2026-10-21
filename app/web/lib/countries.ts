/**
 * Country metadata for phone and address inputs.
 * Calling codes and number validation come from libphonenumber-js metadata;
 * display names come from the browser's Intl.DisplayNames.
 */
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  AsYouType,
  type CountryCode,
} from "libphonenumber-js/min";

export interface CountryOption {
  code: CountryCode; // ISO-3166 alpha-2
  name: string;
  dialCode: string; // "+91"
  flag: string;
}

// Countries surfaced at the top of pickers (REPSI's primary markets).
export const PRIORITY_COUNTRIES: CountryCode[] = ["IN", "AE", "US", "GB", "SG", "SA", "AU", "CA"];

export const DEFAULT_COUNTRY: CountryCode = "IN";

function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));
}

let cached: CountryOption[] | null = null;

export function getCountryOptions(): CountryOption[] {
  if (cached) return cached;
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    names = null;
  }
  const list = getCountries().map((code) => ({
    code,
    name: names?.of(code) || code,
    dialCode: `+${getCountryCallingCode(code)}`,
    flag: flagEmoji(code),
  }));
  list.sort((a, b) => a.name.localeCompare(b.name));
  const priority = PRIORITY_COUNTRIES.map((c) => list.find((o) => o.code === c)).filter(Boolean) as CountryOption[];
  cached = [...priority, ...list.filter((o) => !PRIORITY_COUNTRIES.includes(o.code))];
  return cached;
}

export function findCountry(code?: string | null): CountryOption | undefined {
  if (!code) return undefined;
  return getCountryOptions().find((c) => c.code === code.toUpperCase());
}

export function countryName(code?: string | null): string {
  return findCountry(code)?.name || code || "";
}

/** Returns the E.164 number ("+919876543210") if valid for the country, else null. */
export function toE164(national: string, country: CountryCode): string | null {
  if (!national.trim()) return null;
  const parsed = parsePhoneNumberFromString(national, country);
  return parsed && parsed.isValid() ? parsed.number : null;
}

export function isValidPhone(value: string, country: CountryCode = DEFAULT_COUNTRY): boolean {
  const parsed = parsePhoneNumberFromString(value || "", country);
  return Boolean(parsed && parsed.isValid());
}

/** Splits a stored number ("+91 98450 12345" or E.164) into country + national digits. */
export function splitPhone(value: string | null | undefined, fallback: CountryCode = DEFAULT_COUNTRY) {
  const parsed = value ? parsePhoneNumberFromString(value, fallback) : undefined;
  if (parsed && parsed.country) {
    return { country: parsed.country as CountryCode, national: parsed.nationalNumber as string };
  }
  const digits = (value || "").replace(/[^\d]/g, "");
  if ((value || "").trim().startsWith("+")) {
    // Incomplete international number: strip the calling code, preferring the current country.
    const fallbackDial = getCountryCallingCode(fallback);
    if (digits.startsWith(fallbackDial)) return { country: fallback, national: digits.slice(fallbackDial.length) };
    const match = getCountryOptions()
      .filter((o) => digits.startsWith(o.dialCode.slice(1)))
      .sort((a, b) => b.dialCode.length - a.dialCode.length)[0];
    if (match) return { country: match.code, national: digits.slice(match.dialCode.length - 1) };
  }
  return { country: fallback, national: digits };
}

export function formatNational(digits: string, country: CountryCode): string {
  return new AsYouType(country).input(digits);
}

export function formatPhone(value?: string | null): string {
  if (!value) return "";
  const parsed = parsePhoneNumberFromString(value);
  return parsed ? parsed.formatInternational() : value;
}

/** Suggested regional defaults when a business picks its country. */
export const REGION_DEFAULTS: Partial<Record<CountryCode, { timezone: string; currency: string; locale: string }>> = {
  IN: { timezone: "Asia/Kolkata", currency: "INR", locale: "en-IN" },
  AE: { timezone: "Asia/Dubai", currency: "AED", locale: "en-AE" },
  US: { timezone: "America/New_York", currency: "USD", locale: "en-US" },
  GB: { timezone: "Europe/London", currency: "GBP", locale: "en-GB" },
  SG: { timezone: "Asia/Singapore", currency: "SGD", locale: "en-SG" },
  SA: { timezone: "Asia/Riyadh", currency: "SAR", locale: "en-SA" },
  AU: { timezone: "Australia/Sydney", currency: "AUD", locale: "en-AU" },
  CA: { timezone: "America/Toronto", currency: "CAD", locale: "en-CA" },
  LK: { timezone: "Asia/Colombo", currency: "LKR", locale: "en-LK" },
  NP: { timezone: "Asia/Kathmandu", currency: "NPR", locale: "en-NP" },
  BD: { timezone: "Asia/Dhaka", currency: "BDT", locale: "en-BD" },
  MY: { timezone: "Asia/Kuala_Lumpur", currency: "MYR", locale: "en-MY" },
  QA: { timezone: "Asia/Qatar", currency: "QAR", locale: "en-QA" },
  KW: { timezone: "Asia/Kuwait", currency: "KWD", locale: "en-KW" },
  OM: { timezone: "Asia/Muscat", currency: "OMR", locale: "en-OM" },
  BH: { timezone: "Asia/Bahrain", currency: "BHD", locale: "en-BH" },
};

export const CURRENCIES = [
  "INR", "AED", "USD", "GBP", "EUR", "SGD", "SAR", "AUD", "CAD", "LKR", "NPR", "BDT",
  "MYR", "QAR", "KWD", "OMR", "BHD", "NZD", "ZAR", "JPY", "CHF",
];

export function listTimezones(): string[] {
  try {
    const fn = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    if (fn) return fn("timeZone");
  } catch {
    /* fall through */
  }
  return Object.values(REGION_DEFAULTS).map((r) => r!.timezone);
}
