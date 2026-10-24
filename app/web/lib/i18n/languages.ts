/**
 * Language registry: the single list that drives the switcher, validation, <html lang/dir>
 * and Intl formatting. Keep in sync with app/api/app/core/i18n.py and the mobile AppLanguage enum.
 *
 * status: "planned" languages are registered (codes are reserved) but hidden from the switcher
 * until their catalogue in ./locales is translated and reviewed.
 */
export type LanguageStatus = "planned" | "beta" | "stable";

export interface LanguageMeta {
  code: string;
  label: string;
  nativeName: string;
  badge: string;
  dir: "ltr" | "rtl";
  intlLocale: string;
  status: LanguageStatus;
}

export const LANGUAGE_REGISTRY = [
  { code: "en", label: "English", nativeName: "English", badge: "EN", dir: "ltr", intlLocale: "en-IN", status: "stable" },
  { code: "ta", label: "Tamil", nativeName: "தமிழ்", badge: "த", dir: "ltr", intlLocale: "ta-IN", status: "beta" },
  { code: "ml", label: "Malayalam", nativeName: "മലയാളം", badge: "മ", dir: "ltr", intlLocale: "ml-IN", status: "beta" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी", badge: "हि", dir: "ltr", intlLocale: "hi-IN", status: "beta" },
  { code: "kn", label: "Kannada", nativeName: "ಕನ್ನಡ", badge: "ಕ", dir: "ltr", intlLocale: "kn-IN", status: "planned" },
  { code: "te", label: "Telugu", nativeName: "తెలుగు", badge: "తె", dir: "ltr", intlLocale: "te-IN", status: "planned" },
  { code: "mr", label: "Marathi", nativeName: "मराठी", badge: "म", dir: "ltr", intlLocale: "mr-IN", status: "planned" },
  { code: "bn", label: "Bengali", nativeName: "বাংলা", badge: "বা", dir: "ltr", intlLocale: "bn-IN", status: "planned" },
  { code: "gu", label: "Gujarati", nativeName: "ગુજરાતી", badge: "ગુ", dir: "ltr", intlLocale: "gu-IN", status: "planned" },
  { code: "pa", label: "Punjabi", nativeName: "ਪੰਜਾਬੀ", badge: "ਪੰ", dir: "ltr", intlLocale: "pa-IN", status: "planned" },
  { code: "or", label: "Odia", nativeName: "ଓଡ଼ିଆ", badge: "ଓ", dir: "ltr", intlLocale: "or-IN", status: "planned" },
  { code: "ur", label: "Urdu", nativeName: "اردو", badge: "ار", dir: "rtl", intlLocale: "ur-IN", status: "planned" },
  { code: "ar", label: "Arabic", nativeName: "العربية", badge: "ع", dir: "rtl", intlLocale: "ar", status: "planned" },
] as const satisfies readonly LanguageMeta[];

export const DEFAULT_LANGUAGE = "en";

/** Languages users can pick today (beta + stable). */
export const SUPPORTED_LANGUAGES: LanguageMeta[] = LANGUAGE_REGISTRY.filter((l) => l.status !== "planned");

/** REPSI ships exactly these four; English and Tamil are listed first in the picker. */
export type LanguageCode = "en" | "ta" | "ml" | "hi";

export function isSupportedLanguage(code: unknown): code is LanguageCode {
  return typeof code === "string" && SUPPORTED_LANGUAGES.some((l) => l.code === code);
}

/** Best supported match for a BCP-47 tag ("ta-IN" -> "ta"), else the default. */
export function normalizeLanguage(tag: string | null | undefined): LanguageCode {
  const base = (tag || "").toLowerCase().trim().split(/[-_]/)[0];
  return isSupportedLanguage(base) ? base : DEFAULT_LANGUAGE;
}

export function getLanguageMeta(code: string): LanguageMeta {
  return LANGUAGE_REGISTRY.find((l) => l.code === code) ?? LANGUAGE_REGISTRY[0];
}
