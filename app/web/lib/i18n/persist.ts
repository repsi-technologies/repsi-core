import { getLanguageMeta, isSupportedLanguage, type LanguageCode } from "./languages";

/** Set only when the person picks a language (or their account carries one). Its presence means "explicit choice". */
export const STORAGE_KEY = "repsi_preferred_locale";
export const LANGUAGE_COOKIE = "repsi_lang";
export const LANGUAGE_EVENT = "repsi_language_change";

/** The explicitly chosen language on this browser, if any. */
export function savedLanguage(): LanguageCode | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isSupportedLanguage(saved) ? saved : null;
  } catch {
    return null;
  }
}

/**
 * Applies a language to the document. `explicit` also remembers it as the person's choice, so it
 * wins over the browser language on the next visit; detected languages are applied but not saved.
 */
export function persistLanguage(lang: LanguageCode, { explicit = false }: { explicit?: boolean } = {}) {
  if (typeof window === "undefined") return;
  if (explicit) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }
  document.cookie = `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = lang;
  document.documentElement.dir = getLanguageMeta(lang).dir;
}

/**
 * Called after sign-in with the account's saved preference. A choice made on this browser wins
 * (and is returned so the caller can sync it to the account); otherwise a non-default account
 * language is applied. "en" is also the server default, so it never overrides anything.
 */
export function applyAccountLanguage(code: string | null | undefined): LanguageCode | null {
  if (typeof window === "undefined") return null;
  const local = savedLanguage();
  if (local) return local !== code ? local : null;
  if (!isSupportedLanguage(code) || code === "en") return null;
  persistLanguage(code, { explicit: true });
  window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: code }));
  return null;
}

/** Clears browser storage on sign-out but keeps the language choice (it belongs to the device, not the session). */
export function clearStorageKeepingLanguage() {
  if (typeof window === "undefined") return;
  const lang = savedLanguage();
  try {
    localStorage.clear();
    sessionStorage.clear();
  } finally {
    if (lang) {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {}
    }
  }
}
