/**
 * REPSI colour themes. Each id is also the class next-themes puts on <html>;
 * `dark` marks themes that should switch Tailwind's `dark:` variant on
 * (see the @custom-variant in globals.css).
 */
export const THEMES = [
  { id: "light", label: "Light", dark: false, swatch: ["#F7F7F5", "#FFFFFF", "#E25822"] },
  { id: "gray", label: "Gray", dark: false, swatch: ["#E6E7E9", "#F3F4F5", "#E25822"] },
  { id: "dark", label: "Dark", dark: true, swatch: ["#17191C", "#24272B", "#E25822"] },
  { id: "midnight", label: "Midnight", dark: true, swatch: ["#000000", "#111214", "#E25822"] },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const THEME_IDS: string[] = THEMES.map((t) => t.id);

export const DARK_THEME_IDS: string[] = THEMES.filter((t) => t.dark).map((t) => t.id);

/** True when the resolved next-themes value renders on a dark background. */
export function isDarkTheme(theme: string | undefined | null): boolean {
  return Boolean(theme && DARK_THEME_IDS.includes(theme));
}
