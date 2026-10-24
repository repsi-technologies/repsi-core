"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { translations } from "./translations";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  getLanguageMeta,
  isSupportedLanguage,
  normalizeLanguage,
  type LanguageCode,
  type LanguageMeta,
} from "./languages";
import { repsiApi } from "@/lib/api";
import { LANGUAGE_EVENT, persistLanguage, savedLanguage } from "./persist";

export * from "./languages";
export * from "./format";
export * from "./persist";

type Params = Record<string, string | number | null | undefined>;

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: string) => void;
  /** t(key, fallback?, params?) — params fill {name} placeholders; a numeric `count` picks `key.one` / `key.other`. */
  t: (key: string, fallback?: string, params?: Params) => string;
  languages: LanguageMeta[];
  currentLanguageMeta: LanguageMeta;
}

/** Catalogue key for a nav label: "Receipts & Day Close" -> "navItem.receipts_day_close". */
export function navLabelKey(label: string): string {
  return `navItem.${label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
}

function interpolate(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name] ?? "") : match));
}

function lookup(language: LanguageCode, key: string): string | undefined {
  return translations[language]?.[key] ?? translations[DEFAULT_LANGUAGE][key];
}

export function translate(language: LanguageCode, key: string, fallback?: string, params?: Params): string {
  let text: string | undefined;
  if (params && typeof params.count === "number") {
    const category = new Intl.PluralRules(getLanguageMeta(language).intlLocale).select(params.count);
    text = lookup(language, `${key}.${category}`) ?? lookup(language, `${key}.other`);
  }
  text ??= lookup(language, key);
  if (text === undefined && fallback === undefined && process.env.NODE_ENV !== "production") {
    console.warn(`[i18n] missing key "${key}"`);
  }
  return interpolate(text ?? fallback ?? key, params);
}

/** Language of the last render; lets code outside components (config arrays, validators) translate lazily. */
let activeLanguage: LanguageCode = DEFAULT_LANGUAGE;

/**
 * Translate outside a component, e.g. in a module-level config read during render
 * (`{ get label() { return tr("nav.members"); } }`). Prefer `useTranslation().t` inside components.
 */
export function tr(key: string, fallback?: string, params?: Params): string {
  return translate(activeLanguage, key, fallback, params);
}

/**
 * Fills {name} placeholders in a translated message with React nodes, so a sentence can keep an
 * inline link or bold value while each language orders the words its own way:
 * richText(t("forgot_password.if_an_account_exists_for_email"), { email: <strong>{email}</strong> }).
 */
export function richText(message: string, nodes: Record<string, React.ReactNode>): React.ReactNode {
  const parts = message.split(/\{(\w+)\}/);
  return parts.map((part, i) =>
    i % 2 === 1 ? <React.Fragment key={i}>{part in nodes ? nodes[part] : `{${part}}`}</React.Fragment> : part
  );
}

/** Precedence: explicit choice -> first supported browser language -> English. */
export function detectLanguage(saved: string | null, browserLanguages: readonly string[]): LanguageCode {
  if (isSupportedLanguage(saved)) return saved;
  for (const tag of browserLanguages) {
    const lang = normalizeLanguage(tag);
    if (lang !== DEFAULT_LANGUAGE || tag.toLowerCase().startsWith("en")) return lang;
  }
  return DEFAULT_LANGUAGE;
}

const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key, fallback, params) => translate(DEFAULT_LANGUAGE, key, fallback, params),
  languages: SUPPORTED_LANGUAGES,
  currentLanguageMeta: SUPPORTED_LANGUAGES[0],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  activeLanguage = language;

  useEffect(() => {
    const detected = detectLanguage(savedLanguage(), navigator.languages ?? []);
    setLanguageState(detected);
    persistLanguage(detected);

    const onChange = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      if (isSupportedLanguage(next)) setLanguageState(next);
    };
    window.addEventListener(LANGUAGE_EVENT, onChange);
    return () => window.removeEventListener(LANGUAGE_EVENT, onChange);
  }, []);

  const setLanguage = useCallback((newLang: string) => {
    if (!isSupportedLanguage(newLang)) return;
    setLanguageState(newLang);
    persistLanguage(newLang, { explicit: true });
    window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: newLang }));
    // Signed-in users keep the choice on their account; signed-out visitors only have the cookie.
    if (localStorage.getItem("repsi_auth_token")) {
      repsiApi.updateUserLanguage(newLang).catch(() => {});
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string, params?: Params) => translate(language, key, fallback, params),
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, languages: SUPPORTED_LANGUAGES, currentLanguageMeta: getLanguageMeta(language) }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  return useContext(LanguageContext);
}
