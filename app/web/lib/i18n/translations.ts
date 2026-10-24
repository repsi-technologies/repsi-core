import en from "./locales/en.json";
import ta from "./locales/ta.json";
import ml from "./locales/ml.json";
import hi from "./locales/hi.json";
import kn from "./locales/kn.json";
import te from "./locales/te.json";
import type { LanguageCode } from "./languages";

export type { LanguageCode, LanguageMeta } from "./languages";
export { SUPPORTED_LANGUAGES } from "./languages";

/** English is the source catalogue; every other locale is checked against its keys (scripts/check-i18n.mjs). */
export type TranslationKey = keyof typeof en;

export const translations: Record<LanguageCode, Record<string, string>> = { en, ta, ml, hi, kn, te };
