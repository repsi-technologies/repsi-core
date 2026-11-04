import { staticFile } from "remotion";
import captures from "./captures.json";

// Every visual in the film is one of three real sources:
//  - the live website, captured by capture/capture-site.mjs (public/site, sizes below in CSS px, captured at 3x);
//  - the signed-in product, captured by capture/capture-live.mjs or capture.mjs (public/screens, 1440x900 / 390x844);
//  - REPSI's own gym photography from the repo (public/photos).
export type Img = { src: string; w: number; h: number };
export type Rect = [number, number, number, number];
export type View = { img: Img; rect: Rect; bare?: boolean; phone?: boolean };

const site = (name: string, w: number, h: number): Img => ({ src: staticFile(`site/${name}.png`), w, h });
export const SITE = {
  hero: site("desktop-hero", 1440, 900),
  top: site("desktop-section-01", 1440, 1027),
  problems: site("desktop-section-02", 1440, 1324),
  pricing: site("desktop-section-04", 1440, 1975),
  cta: site("desktop-section-06", 1440, 634),
  phoneHero: site("phone-hero", 390, 844),
  phoneProblems: site("phone-section-02", 390, 1191),
};

const photo = (name: string, w: number, h: number): Img => ({ src: staticFile(`photos/${name}.jpg`), w, h });
export const PHOTO = {
  core: photo("athlete-core", 4680, 3120),
  barbell: photo("general_fitness", 900, 560),
  dumbbells: photo("muscle_gain", 900, 560),
  ropes: photo("fat_loss", 900, 560),
  deadlift: photo("strength", 900, 560),
  group: photo("endurance", 900, 560),
  stretch: photo("mobility", 900, 560),
};

// Regions of the website captures, in CSS px of the capture.
export const CROP = {
  dashScreen: [151, 583, 560, 885] as Rect,
  dashMembers: [151, 583, 470, 790] as Rect,
  dashAttendance: [300, 700, 600, 890] as Rect,
  phoneMock: [565, 600, 772, 937] as Rect,
  growthCard: [938, 531, 1318, 1053] as Rect,
  starterCard: [528, 532, 909, 1053] as Rect,
  proCard: [120, 1083, 500, 1603] as Rect,
  proWhatsApp: [120, 1290, 500, 1530] as Rect,
  growthList: [950, 770, 1300, 955] as Rect,
  proList: [135, 1322, 500, 1505] as Rect,
};

const captured = new Set(captures as string[]);
const product = (id: string, phone = false): Img | null =>
  captured.has(id) ? { src: staticFile(`screens/${id}.png`), w: phone ? 390 : 1440, h: phone ? 844 : 900 } : null;

/**
 * `rect` of a signed-in product capture when it exists, otherwise the matching region of the live website.
 * Captures come from a real workspace, so every rect here is chosen to leave out member names, phone numbers,
 * emails and payment IDs; screens that can't be cropped clear of them are not used at all.
 */
export function screen(id: string, rect: Rect, fallback: View, phone = false): View {
  const img = product(id, phone);
  return img ? { img, rect, phone } : fallback;
}

// Product regions, in CSS px of the 1440x900 / 390x844 captures.
export const PRODUCT = {
  analytics: [222, 138, 700, 520] as Rect, // retention and LTV cards over the at-risk member alerts (sample data built into the page)
  notifications: [385, 83, 900, 450] as Rect, // notification channel settings
  attendanceHub: [0, 57, 390, 330] as Rect, // Attendance Command Hub header and QR / scan / manual entry actions
  paymentsPhone: [0, 57, 390, 640] as Rect, // Payments & Billing on a phone: collect button and collection KPIs
};
