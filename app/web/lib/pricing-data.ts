export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED";
export type BillingCycle = "monthly" | "3months" | "6months" | "yearly";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  taxNote: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: {
    code: "INR",
    symbol: "₹",
    label: "INR (India)",
    taxNote: "Prices are final amounts. No GST charged until registered.",
  },
  USD: {
    code: "USD",
    symbol: "$",
    label: "USD (Global)",
    taxNote: "Excludes local sales tax / VAT where applicable.",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    label: "EUR (Europe)",
    taxNote: "Excludes EU VAT (handled via MoR for business/consumer).",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    label: "GBP (United Kingdom)",
    taxNote: "Excludes UK VAT.",
  },
  AED: {
    code: "AED",
    symbol: "AED ",
    label: "AED (United Arab Emirates)",
    taxNote: "Excludes UAE 5% VAT.",
  },
};

export interface PlanCyclePricing {
  perMonth: number;
  total: number;
  note: string;
  billedNote: string;
  originalPerMonth?: number;
}

export interface PlanData {
  id: string;
  name: string;
  tagline: string;
  badge: string | null;
  popular: boolean;
  memberCapacity: string;
  memberCount: number;
  pricing: Record<CurrencyCode, Record<BillingCycle, PlanCyclePricing>>;
  features: string[];
  ctaText: string;
}

export const GLOBAL_PLANS: PlanData[] = [
  {
    id: "lite",
    name: "Lite",
    tagline: "Essential attendance, payments, and member profiles for small facilities.",
    badge: null,
    popular: false,
    memberCapacity: "Up to 20 active members",
    memberCount: 20,
    pricing: {
      INR: {
        monthly: { perMonth: 199, total: 199, note: "Billed monthly", billedNote: "billed ₹199 monthly", originalPerMonth: 199 },
        "3months": { perMonth: 179, total: 537, note: "Save 10%", billedNote: "billed ₹537 every 3 months", originalPerMonth: 199 },
        "6months": { perMonth: 149, total: 894, note: "Save 25%", billedNote: "billed ₹894 every 6 months", originalPerMonth: 199 },
        yearly: { perMonth: 129, total: 1548, note: "Save 35%", billedNote: "billed ₹1,548 yearly", originalPerMonth: 199 },
      },
      USD: {
        monthly: { perMonth: 9, total: 9, note: "Billed monthly", billedNote: "billed $9 monthly", originalPerMonth: 9 },
        "3months": { perMonth: 8, total: 24, note: "Save 10%", billedNote: "billed $24 every 3 months", originalPerMonth: 9 },
        "6months": { perMonth: 7, total: 40, note: "Save 25%", billedNote: "billed $40 every 6 months", originalPerMonth: 9 },
        yearly: { perMonth: 6, total: 70, note: "Save 35%", billedNote: "billed $70 yearly", originalPerMonth: 9 },
      },
      EUR: {
        monthly: { perMonth: 8, total: 8, note: "Billed monthly", billedNote: "billed €8 monthly", originalPerMonth: 8 },
        "3months": { perMonth: 7, total: 22, note: "Save 10%", billedNote: "billed €22 every 3 months", originalPerMonth: 8 },
        "6months": { perMonth: 6, total: 36, note: "Save 25%", billedNote: "billed €36 every 6 months", originalPerMonth: 8 },
        yearly: { perMonth: 5, total: 62, note: "Save 35%", billedNote: "billed €62 yearly", originalPerMonth: 8 },
      },
      GBP: {
        monthly: { perMonth: 7, total: 7, note: "Billed monthly", billedNote: "billed £7 monthly", originalPerMonth: 7 },
        "3months": { perMonth: 6, total: 19, note: "Save 10%", billedNote: "billed £19 every 3 months", originalPerMonth: 7 },
        "6months": { perMonth: 5, total: 32, note: "Save 25%", billedNote: "billed £32 every 6 months", originalPerMonth: 7 },
        yearly: { perMonth: 5, total: 55, note: "Save 35%", billedNote: "billed £55 yearly", originalPerMonth: 7 },
      },
      AED: {
        monthly: { perMonth: 33, total: 33, note: "Billed monthly", billedNote: "billed AED 33 monthly", originalPerMonth: 33 },
        "3months": { perMonth: 30, total: 89, note: "Save 10%", billedNote: "billed AED 89 every 3 months", originalPerMonth: 33 },
        "6months": { perMonth: 25, total: 149, note: "Save 25%", billedNote: "billed AED 149 every 6 months", originalPerMonth: 33 },
        yearly: { perMonth: 21, total: 257, note: "Save 35%", billedNote: "billed AED 257 yearly", originalPerMonth: 33 },
      },
    },
    features: [
      "Member profiles & photo verification",
      "Manual and QR check-in (3-month history)",
      "Cash, UPI & card payment records with receipts",
      "Up to 3 active membership plans",
      "Basic dashboard: joins, expiries & dues",
      "1 trainer account & 1 staff login",
    ],
    ctaText: "Start 14-day free trial",
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "For neighborhood gyms that need renewal queues, member portal, and basic reports.",
    badge: null,
    popular: false,
    memberCapacity: "Up to 50 active members",
    memberCount: 50,
    pricing: {
      INR: {
        monthly: { perMonth: 499, total: 499, note: "Billed monthly", billedNote: "billed ₹499 monthly", originalPerMonth: 499 },
        "3months": { perMonth: 449, total: 1347, note: "Save 10%", billedNote: "billed ₹1,347 every 3 months", originalPerMonth: 499 },
        "6months": { perMonth: 375, total: 2250, note: "Save 25%", billedNote: "billed ₹2,250 every 6 months", originalPerMonth: 499 },
        yearly: { perMonth: 325, total: 3900, note: "Save 35%", billedNote: "billed ₹3,900 yearly", originalPerMonth: 499 },
      },
      USD: {
        monthly: { perMonth: 19, total: 19, note: "Billed monthly", billedNote: "billed $19 monthly", originalPerMonth: 19 },
        "3months": { perMonth: 17, total: 51, note: "Save 10%", billedNote: "billed $51 every 3 months", originalPerMonth: 19 },
        "6months": { perMonth: 14, total: 85, note: "Save 25%", billedNote: "billed $85 every 6 months", originalPerMonth: 19 },
        yearly: { perMonth: 12, total: 148, note: "Save 35%", billedNote: "billed $148 yearly", originalPerMonth: 19 },
      },
      EUR: {
        monthly: { perMonth: 16, total: 16, note: "Billed monthly", billedNote: "billed €16 monthly", originalPerMonth: 16 },
        "3months": { perMonth: 14, total: 43, note: "Save 10%", billedNote: "billed €43 every 3 months", originalPerMonth: 16 },
        "6months": { perMonth: 12, total: 72, note: "Save 25%", billedNote: "billed €72 every 6 months", originalPerMonth: 16 },
        yearly: { perMonth: 10, total: 125, note: "Save 35%", billedNote: "billed €125 yearly", originalPerMonth: 16 },
      },
      GBP: {
        monthly: { perMonth: 14, total: 14, note: "Billed monthly", billedNote: "billed £14 monthly", originalPerMonth: 14 },
        "3months": { perMonth: 13, total: 38, note: "Save 10%", billedNote: "billed £38 every 3 months", originalPerMonth: 14 },
        "6months": { perMonth: 11, total: 63, note: "Save 25%", billedNote: "billed £63 every 6 months", originalPerMonth: 14 },
        yearly: { perMonth: 9, total: 109, note: "Save 35%", billedNote: "billed £109 yearly", originalPerMonth: 14 },
      },
      AED: {
        monthly: { perMonth: 69, total: 69, note: "Billed monthly", billedNote: "billed AED 69 monthly", originalPerMonth: 69 },
        "3months": { perMonth: 62, total: 186, note: "Save 10%", billedNote: "billed AED 186 every 3 months", originalPerMonth: 69 },
        "6months": { perMonth: 52, total: 311, note: "Save 25%", billedNote: "billed AED 311 every 6 months", originalPerMonth: 69 },
        yearly: { perMonth: 45, total: 538, note: "Save 35%", billedNote: "billed AED 538 yearly", originalPerMonth: 69 },
      },
    },
    features: [
      "Member portal with digital QR access card",
      "Renewal queue, membership freeze & pause",
      "Partial payments & automated dues reminders",
      "Member health waivers & document vault",
      "Collections, growth & dues tracking reports",
      "3 trainer accounts & 3 staff logins",
    ],
    ctaText: "Start 14-day free trial",
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Workouts, diet plans, classes, CRM pipeline, and P&L statements.",
    badge: "MOST POPULAR",
    popular: true,
    memberCapacity: "Up to 150 active members",
    memberCount: 150,
    pricing: {
      INR: {
        monthly: { perMonth: 999, total: 999, note: "Billed monthly", billedNote: "billed ₹999 monthly", originalPerMonth: 999 },
        "3months": { perMonth: 899, total: 2697, note: "Save 10%", billedNote: "billed ₹2,697 every 3 months", originalPerMonth: 999 },
        "6months": { perMonth: 749, total: 4494, note: "Save 25%", billedNote: "billed ₹4,494 every 6 months", originalPerMonth: 999 },
        yearly: { perMonth: 649, total: 7788, note: "Save 35%", billedNote: "billed ₹7,788 yearly", originalPerMonth: 999 },
      },
      USD: {
        monthly: { perMonth: 39, total: 39, note: "Billed monthly", billedNote: "billed $39 monthly", originalPerMonth: 39 },
        "3months": { perMonth: 35, total: 105, note: "Save 10%", billedNote: "billed $105 every 3 months", originalPerMonth: 39 },
        "6months": { perMonth: 29, total: 175, note: "Save 25%", billedNote: "billed $175 every 6 months", originalPerMonth: 39 },
        yearly: { perMonth: 25, total: 304, note: "Save 35%", billedNote: "billed $304 yearly", originalPerMonth: 39 },
      },
      EUR: {
        monthly: { perMonth: 34, total: 34, note: "Billed monthly", billedNote: "billed €34 monthly", originalPerMonth: 34 },
        "3months": { perMonth: 31, total: 92, note: "Save 10%", billedNote: "billed €92 every 3 months", originalPerMonth: 34 },
        "6months": { perMonth: 26, total: 153, note: "Save 25%", billedNote: "billed €153 every 6 months", originalPerMonth: 34 },
        yearly: { perMonth: 22, total: 265, note: "Save 35%", billedNote: "billed €265 yearly", originalPerMonth: 34 },
      },
      GBP: {
        monthly: { perMonth: 29, total: 29, note: "Billed monthly", billedNote: "billed £29 monthly", originalPerMonth: 29 },
        "3months": { perMonth: 26, total: 78, note: "Save 10%", billedNote: "billed £78 every 3 months", originalPerMonth: 29 },
        "6months": { perMonth: 22, total: 131, note: "Save 25%", billedNote: "billed £131 every 6 months", originalPerMonth: 29 },
        yearly: { perMonth: 19, total: 226, note: "Save 35%", billedNote: "billed £226 yearly", originalPerMonth: 29 },
      },
      AED: {
        monthly: { perMonth: 145, total: 145, note: "Billed monthly", billedNote: "billed AED 145 monthly", originalPerMonth: 145 },
        "3months": { perMonth: 131, total: 392, note: "Save 10%", billedNote: "billed AED 392 every 3 months", originalPerMonth: 145 },
        "6months": { perMonth: 109, total: 653, note: "Save 25%", billedNote: "billed AED 653 every 6 months", originalPerMonth: 145 },
        yearly: { perMonth: 94, total: 1131, note: "Save 35%", billedNote: "billed AED 1,131 yearly", originalPerMonth: 145 },
      },
    },
    features: [
      "Workout builder with GIF library & client logs",
      "Diet plans, calorie/macro database & logs",
      "Classes, batches & waitlist management",
      "Leads CRM pipeline & follow-up queue",
      "Expense tracking & monthly P&L statements",
      "10 trainer accounts & 10 staff logins",
    ],
    ctaText: "Start 14-day free trial",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Multi-branch gyms with commissions, WhatsApp broadcast, and shift rosters.",
    badge: null,
    popular: false,
    memberCapacity: "Up to 400 active members",
    memberCount: 400,
    pricing: {
      INR: {
        monthly: { perMonth: 1999, total: 1999, note: "Billed monthly", billedNote: "billed ₹1,999 monthly", originalPerMonth: 1999 },
        "3months": { perMonth: 1799, total: 5397, note: "Save 10%", billedNote: "billed ₹5,397 every 3 months", originalPerMonth: 1999 },
        "6months": { perMonth: 1499, total: 8994, note: "Save 25%", billedNote: "billed ₹8,994 every 6 months", originalPerMonth: 1999 },
        yearly: { perMonth: 1299, total: 15588, note: "Save 35%", billedNote: "billed ₹15,588 yearly", originalPerMonth: 1999 },
      },
      USD: {
        monthly: { perMonth: 79, total: 79, note: "Billed monthly", billedNote: "billed $79 monthly", originalPerMonth: 79 },
        "3months": { perMonth: 71, total: 213, note: "Save 10%", billedNote: "billed $213 every 3 months", originalPerMonth: 79 },
        "6months": { perMonth: 59, total: 355, note: "Save 25%", billedNote: "billed $355 every 6 months", originalPerMonth: 79 },
        yearly: { perMonth: 51, total: 616, note: "Save 35%", billedNote: "billed $616 yearly", originalPerMonth: 79 },
      },
      EUR: {
        monthly: { perMonth: 68, total: 68, note: "Billed monthly", billedNote: "billed €68 monthly", originalPerMonth: 68 },
        "3months": { perMonth: 61, total: 184, note: "Save 10%", billedNote: "billed €184 every 3 months", originalPerMonth: 68 },
        "6months": { perMonth: 51, total: 306, note: "Save 25%", billedNote: "billed €306 every 6 months", originalPerMonth: 68 },
        yearly: { perMonth: 44, total: 530, note: "Save 35%", billedNote: "billed €530 yearly", originalPerMonth: 68 },
      },
      GBP: {
        monthly: { perMonth: 58, total: 58, note: "Billed monthly", billedNote: "billed £58 monthly", originalPerMonth: 58 },
        "3months": { perMonth: 52, total: 157, note: "Save 10%", billedNote: "billed £157 every 3 months", originalPerMonth: 58 },
        "6months": { perMonth: 44, total: 261, note: "Save 25%", billedNote: "billed £261 every 6 months", originalPerMonth: 58 },
        yearly: { perMonth: 38, total: 452, note: "Save 35%", billedNote: "billed £452 yearly", originalPerMonth: 58 },
      },
      AED: {
        monthly: { perMonth: 289, total: 289, note: "Billed monthly", billedNote: "billed AED 289 monthly", originalPerMonth: 289 },
        "3months": { perMonth: 260, total: 780, note: "Save 10%", billedNote: "billed AED 780 every 3 months", originalPerMonth: 289 },
        "6months": { perMonth: 217, total: 1301, note: "Save 25%", billedNote: "billed AED 1,301 every 6 months", originalPerMonth: 289 },
        yearly: { perMonth: 188, total: 2254, note: "Save 35%", billedNote: "billed AED 2,254 yearly", originalPerMonth: 289 },
      },
    },
    features: [
      "3 gym branches included with consolidated reports",
      "Trainer commissions, automated payroll & rosters",
      "WhatsApp notification automation & broadcasts",
      "Inventory, locker logs & equipment register",
      "30 trainer accounts & 30 staff logins",
      "Priority WhatsApp hotline & phone support",
    ],
    ctaText: "Start 14-day free trial",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For 400+ members or multi-location gym chains with custom SLAs.",
    badge: null,
    popular: false,
    memberCapacity: "400+ active members",
    memberCount: 9999,
    pricing: {
      INR: {
        monthly: { perMonth: 3999, total: 3999, note: "from ₹3,999/mo", billedNote: "Custom contract", originalPerMonth: 3999 },
        "3months": { perMonth: 3599, total: 10797, note: "from ₹3,599/mo", billedNote: "Custom contract", originalPerMonth: 3999 },
        "6months": { perMonth: 2999, total: 17994, note: "from ₹2,999/mo", billedNote: "Custom contract", originalPerMonth: 3999 },
        yearly: { perMonth: 2599, total: 31188, note: "from ₹2,599/mo", billedNote: "Custom contract", originalPerMonth: 3999 },
      },
      USD: {
        monthly: { perMonth: 149, total: 149, note: "from $149/mo", billedNote: "Custom contract", originalPerMonth: 149 },
        "3months": { perMonth: 134, total: 402, note: "from $134/mo", billedNote: "Custom contract", originalPerMonth: 149 },
        "6months": { perMonth: 112, total: 672, note: "from $112/mo", billedNote: "Custom contract", originalPerMonth: 149 },
        yearly: { perMonth: 97, total: 1164, note: "from $97/mo", billedNote: "Custom contract", originalPerMonth: 149 },
      },
      EUR: {
        monthly: { perMonth: 129, total: 129, note: "from €129/mo", billedNote: "Custom contract", originalPerMonth: 129 },
        "3months": { perMonth: 116, total: 348, note: "from €116/mo", billedNote: "Custom contract", originalPerMonth: 129 },
        "6months": { perMonth: 97, total: 582, note: "from €97/mo", billedNote: "Custom contract", originalPerMonth: 129 },
        yearly: { perMonth: 84, total: 1008, note: "from €84/mo", billedNote: "Custom contract", originalPerMonth: 129 },
      },
      GBP: {
        monthly: { perMonth: 109, total: 109, note: "from £109/mo", billedNote: "Custom contract", originalPerMonth: 109 },
        "3months": { perMonth: 98, total: 294, note: "from £98/mo", billedNote: "Custom contract", originalPerMonth: 109 },
        "6months": { perMonth: 82, total: 492, note: "from £82/mo", billedNote: "Custom contract", originalPerMonth: 109 },
        yearly: { perMonth: 71, total: 852, note: "from £71/mo", billedNote: "Custom contract", originalPerMonth: 109 },
      },
      AED: {
        monthly: { perMonth: 549, total: 549, note: "from AED 549/mo", billedNote: "Custom contract", originalPerMonth: 549 },
        "3months": { perMonth: 494, total: 1482, note: "from AED 494/mo", billedNote: "Custom contract", originalPerMonth: 549 },
        "6months": { perMonth: 412, total: 2472, note: "from AED 412/mo", billedNote: "Custom contract", originalPerMonth: 549 },
        yearly: { perMonth: 357, total: 4284, note: "from AED 357/mo", billedNote: "Custom contract", originalPerMonth: 549 },
      },
    },
    features: [
      "Unlimited active members & gym branches",
      "Custom domain & custom branding included",
      "Full REST API & webhooks access",
      "Dedicated account manager & 99.9% uptime SLA",
      "Full legacy Excel data migration & staff training",
      "Unlimited trainer accounts & staff logins",
    ],
    ctaText: "Talk to us",
  },
];

export interface AddOnItem {
  name: string;
  priceByCurrency: Record<CurrencyCode, string>;
  details: string;
}

export const ADDONS_LIST: AddOnItem[] = [
  {
    name: "Member pack (+50)",
    priceByCurrency: {
      INR: "₹299/mo",
      USD: "$9/mo",
      EUR: "€8/mo",
      GBP: "£7/mo",
      AED: "AED 33/mo",
    },
    details: "Expand active member ceiling on Starter or Growth without changing tiers",
  },
  {
    name: "Custom branding",
    priceByCurrency: {
      INR: "₹199/mo",
      USD: "$5/mo",
      EUR: "€4.5/mo",
      GBP: "£4/mo",
      AED: "AED 18/mo",
    },
    details: "Your gym logo and custom palette on digital passes, invoices, and member app",
  },
  {
    name: "Custom domain",
    priceByCurrency: {
      INR: "₹299/mo",
      USD: "$5/mo",
      EUR: "€4.5/mo",
      GBP: "£4/mo",
      AED: "AED 18/mo",
    },
    details: "Point yourgym.com to your member portal with automatic SSL certificate",
  },
  {
    name: "Extra branch",
    priceByCurrency: {
      INR: "₹499/mo",
      USD: "$9/mo",
      EUR: "€8/mo",
      GBP: "£7/mo",
      AED: "AED 33/mo",
    },
    details: "Add a secondary branch with segregated staff rosters and unified reports",
  },
  {
    name: "WhatsApp / SMS",
    priceByCurrency: {
      INR: "Network cost + 15%",
      USD: "Network cost + 15%",
      EUR: "Network cost + 15%",
      GBP: "Network cost + 15%",
      AED: "Network cost + 15%",
    },
    details: "Direct Meta Cloud API messaging at transparent network pass-through rates",
  },
];

// Compatibility alias
export const GLOBAL_ADDONS = ADDONS_LIST;
