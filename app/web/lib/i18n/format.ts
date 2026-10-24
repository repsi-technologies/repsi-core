import { getLanguageMeta } from "./languages";

/**
 * Locale-aware formatters. Language picks the words and digits grouping; currency and timezone
 * stay workspace settings. Digits are always Latin (nu: latn) so amounts, phones and OTPs read
 * the same in every language.
 */
function intlLocale(language: string): string {
  return `${getLanguageMeta(language).intlLocale}-u-nu-latn`;
}

type DateInput = Date | string | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: DateInput, language: string, options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }, timeZone?: string): string {
  const d = toDate(value);
  return d ? new Intl.DateTimeFormat(intlLocale(language), { ...options, timeZone }).format(d) : "";
}

export function formatTime(value: DateInput, language: string, timeZone?: string): string {
  return formatDate(value, language, { hour: "2-digit", minute: "2-digit" }, timeZone);
}

export function formatNumber(value: number, language: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(intlLocale(language), options).format(value);
}

export function formatCurrency(value: number, language: string, currency = "INR"): string {
  return formatNumber(value, language, { style: "currency", currency, maximumFractionDigits: 2 });
}

export function formatRelative(value: DateInput, language: string, now: Date = new Date()): string {
  const d = toDate(value);
  if (!d) return "";
  const seconds = Math.round((d.getTime() - now.getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
  const rtf = new Intl.RelativeTimeFormat(intlLocale(language), { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(seconds, "second");
}
