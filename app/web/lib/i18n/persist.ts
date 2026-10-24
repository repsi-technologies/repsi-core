import { getLanguageMeta, isSupportedLanguage, type LanguageCode } from "./languages";

export const STORAGE_KEY = "repsi_preferred_locale";
export const LANGUAGE_COOKIE = "repsi_lang";
export const LANGUAGE_EVENT = "repsi_language_change";

/** Applies a language to the document and persists it for the next visit (and the pre-hydration script in app/layout.tsx). */
export function persistLanguage(lang: LanguageCode) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
  document.cookie = `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = lang;
  document.documentElement.dir = getLanguageMeta(lang).dir;
}

/**
 * Call after login with the account's saved preference so the user's choice follows them across devices.
 * Unknown or missing values leave the current language untouched.
 */
export function applyAccountLanguage(code: string | null | undefined) {
  if (typeof window === "undefined" || !isSupportedLanguage(code)) return;
  persistLanguage(code);
  window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: code }));
}
