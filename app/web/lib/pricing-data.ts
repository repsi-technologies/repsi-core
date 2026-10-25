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
    id: "free_trial",
    name: "Free Trial",
    tagline: "Experience full Growth tier features for 14 days without any credit card.",
    badge: "14 DAYS FREE",
    popular: false,
    memberCapacity: "Up to 30 active members",
    memberCount: 30,
    pricing: {
      INR: {
        monthly: { perMonth: 0, total: 0, note: "₹0 for 14 days" },
        "3months": { perMonth: 0, total: 0, note: "₹0 for 14 days" },
        "6months": { perMonth: 0, total: 0, note: "₹0 for 14 days" },
        yearly: { perMonth: 0, total: 0, note: "₹0 for 14 days" },
      },
      USD: {
        monthly: { perMonth: 0, total: 0, note: "$0 for 14 days" },
        "3months": { perMonth: 0, total: 0, note: "$0 for 14 days" },
        "6months": { perMonth: 0, total: 0, note: "$0 for 14 days" },
        yearly: { perMonth: 0, total: 0, note: "$0 for 14 days" },
      },
      EUR: {
        monthly: { perMonth: 0, total: 0, note: "€0 for 14 days" },
        "3months": { perMonth: 0, total: 0, note: "€0 for 14 days" },
        "6months": { perMonth: 0, total: 0, note: "€0 for 14 days" },
        yearly: { perMonth: 0, total: 0, note: "€0 for 14 days" },
      },
      GBP: {
        monthly: { perMonth: 0, total: 0, note: "£0 for 14 days" },
        "3months": { perMonth: 0, total: 0, note: "£0 for 14 days" },
        "6months": { perMonth: 0, total: 0, note: "£0 for 14 days" },
        yearly: { perMonth: 0, total: 0, note: "£0 for 14 days" },
      },
      AED: {
        monthly: { perMonth: 0, total: 0, note: "AED 0 for 14 days" },
        "3months": { perMonth: 0, total: 0, note: "AED 0 for 14 days" },
        "6months": { perMonth: 0, total: 0, note: "AED 0 for 14 days" },
        yearly: { perMonth: 0, total: 0, note: "AED 0 for 14 days" },
      },
    },
    features: [
      "Full Growth plan features included",
      "Up to 30 active members",
      "QR code attendance & check-ins",
      "Workout builder & diet plans",
      "Trainer client assignments",
      "Zero auto-charge at trial end",
    ],
    ctaText: "Start 14-Day Free Trial",
  },
  {
    id: "lite",
    name: "Lite",
    tagline: "Essential attendance, payments, and member profiles for small facilities.",
    badge: "ENTRY PLAN",
    popular: false,
    memberCapacity: "Up to 20 active members",
    memberCount: 20,
    pricing: {
      INR: {
        monthly: { perMonth: 199, total: 199, note: "Billed monthly" },
        "3months": { perMonth: 179, total: 537, note: "₹179/mo = ₹537 quarterly (10% off)" },
        "6months": { perMonth: 149, total: 894, note: "₹149/mo = ₹894 half-yearly (25% off)" },
        yearly: { perMonth: 129, total: 1548, note: "₹129/mo, billed ₹1,548 yearly (35% off)" },
      },
      USD: {
        monthly: { perMonth: 9, total: 9, note: "Billed monthly" },
        "3months": { perMonth: 8, total: 24, note: "$8/mo = $24 quarterly (10% off)" },
        "6months": { perMonth: 6.7, total: 40, note: "$6.7/mo = $40 half-yearly (25% off)" },
        yearly: { perMonth: 5.8, total: 70, note: "$5.8/mo, billed $70 yearly (35% off)" },
      },
      EUR: {
        monthly: { perMonth: 8, total: 8, note: "Billed monthly" },
        "3months": { perMonth: 7.3, total: 22, note: "€7.3/mo = €22 quarterly (10% off)" },
        "6months": { perMonth: 6, total: 36, note: "€6/mo = €36 half-yearly (25% off)" },
        yearly: { perMonth: 5.2, total: 62, note: "€5.2/mo, billed €62 yearly (35% off)" },
      },
      GBP: {
        monthly: { perMonth: 7, total: 7, note: "Billed monthly" },
        "3months": { perMonth: 6.3, total: 19, note: "£6.3/mo = £19 quarterly (10% off)" },
        "6months": { perMonth: 5.3, total: 32, note: "£5.3/mo = £32 half-yearly (25% off)" },
        yearly: { perMonth: 4.6, total: 55, note: "£4.6/mo, billed £55 yearly (35% off)" },
      },
      AED: {
        monthly: { perMonth: 33, total: 33, note: "Billed monthly" },
        "3months": { perMonth: 29.7, total: 89, note: "AED 29.7/mo = AED 89 quarterly (10% off)" },
        "6months": { perMonth: 24.8, total: 149, note: "AED 24.8/mo = AED 149 half-yearly (25% off)" },
        yearly: { perMonth: 21.4, total: 257, note: "AED 21.4/mo, billed AED 257 yearly (35% off)" },
      },
    },
    features: [
      "Up to 20 active members (10% grace)",
      "3 membership plans with manual renewal",
      "Manual and QR check-in, 3-month history",
      "Cash/UPI/card payment records & receipts",
      "Basic dashboard: revenue, active, joins, expiries",
      "1 trainer profile & 1 staff login",
      "In-app notifications & CSV export",
      "All 4 regional languages included",
    ],
    ctaText: "Choose Lite",
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "For neighborhood gyms that need renewal queues, member portal, and basic reports.",
    badge: "RECOMMENDED",
    popular: false,
    memberCapacity: "Up to 50 active members",
    memberCount: 50,
    pricing: {
      INR: {
        monthly: { perMonth: 499, total: 499, note: "Billed monthly" },
        "3months": { perMonth: 449, total: 1347, note: "₹449/mo = ₹1,347 quarterly (10% off)" },
        "6months": { perMonth: 375, total: 2250, note: "₹375/mo = ₹2,250 half-yearly (25% off)" },
        yearly: { perMonth: 325, total: 3900, note: "₹325/mo, billed ₹3,900 yearly (35% off)" },
      },
      USD: {
        monthly: { perMonth: 19, total: 19, note: "Billed monthly" },
        "3months": { perMonth: 17, total: 51, note: "$17/mo = $51 quarterly (10% off)" },
        "6months": { perMonth: 14.2, total: 85, note: "$14.2/mo = $85 half-yearly (25% off)" },
        yearly: { perMonth: 12.3, total: 148, note: "$12.3/mo, billed $148 yearly (35% off)" },
      },
      EUR: {
        monthly: { perMonth: 16, total: 16, note: "Billed monthly" },
        "3months": { perMonth: 14.3, total: 43, note: "€14.3/mo = €43 quarterly (10% off)" },
        "6months": { perMonth: 12, total: 72, note: "€12/mo = €72 half-yearly (25% off)" },
        yearly: { perMonth: 10.4, total: 125, note: "€10.4/mo, billed €125 yearly (35% off)" },
      },
      GBP: {
        monthly: { perMonth: 14, total: 14, note: "Billed monthly" },
        "3months": { perMonth: 12.7, total: 38, note: "£12.7/mo = £38 quarterly (10% off)" },
        "6months": { perMonth: 10.5, total: 63, note: "£10.5/mo = £63 half-yearly (25% off)" },
        yearly: { perMonth: 9.1, total: 109, note: "£9.1/mo, billed £109 yearly (35% off)" },
      },
      AED: {
        monthly: { perMonth: 69, total: 69, note: "Billed monthly" },
        "3months": { perMonth: 62, total: 186, note: "AED 62/mo = AED 186 quarterly (10% off)" },
        "6months": { perMonth: 51.8, total: 311, note: "AED 51.8/mo = AED 311 half-yearly (25% off)" },
        yearly: { perMonth: 44.8, total: 538, note: "AED 44.8/mo, billed AED 538 yearly (35% off)" },
      },
    },
    features: [
      "Everything in Lite + up to 50 active members",
      "Up to 10 plans, renewal queue & freeze/pause",
      "Member portal with dynamic QR pass card",
      "Duplicate check-in prevention, 1-year history",
      "Partial payments, renewal & dues push reminders",
      "Member documents & cloud health waivers",
      "Basic reports (growth, collections, dues)",
      "Trainer-to-member assignment & discount coupons",
    ],
    ctaText: "Choose Starter",
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Classes, scheduling, workouts, diet plans, CRM, and P&L tracking.",
    badge: "⭐ BEST SELLER",
    popular: true,
    memberCapacity: "Up to 150 active members",
    memberCount: 150,
    pricing: {
      INR: {
        monthly: { perMonth: 999, total: 999, note: "Billed monthly" },
        "3months": { perMonth: 899, total: 2697, note: "₹899/mo = ₹2,697 quarterly (10% off)" },
        "6months": { perMonth: 749, total: 4494, note: "₹749/mo = ₹4,494 half-yearly (25% off)" },
        yearly: { perMonth: 649, total: 7788, note: "₹649/mo, billed ₹7,788 yearly (35% off)" },
      },
      USD: {
        monthly: { perMonth: 39, total: 39, note: "Billed monthly" },
        "3months": { perMonth: 35, total: 105, note: "$35/mo = $105 quarterly (10% off)" },
        "6months": { perMonth: 29.2, total: 175, note: "$29.2/mo = $175 half-yearly (25% off)" },
        yearly: { perMonth: 25.3, total: 304, note: "$25.3/mo, billed $304 yearly (35% off)" },
      },
      EUR: {
        monthly: { perMonth: 34, total: 34, note: "Billed monthly" },
        "3months": { perMonth: 30.6, total: 92, note: "€30.6/mo = €92 quarterly (10% off)" },
        "6months": { perMonth: 25.5, total: 153, note: "€25.5/mo = €153 half-yearly (25% off)" },
        yearly: { perMonth: 22.1, total: 265, note: "€22.1/mo, billed €265 yearly (35% off)" },
      },
      GBP: {
        monthly: { perMonth: 29, total: 29, note: "Billed monthly" },
        "3months": { perMonth: 26, total: 78, note: "£26/mo = £78 quarterly (10% off)" },
        "6months": { perMonth: 21.8, total: 131, note: "£21.8/mo = £131 half-yearly (25% off)" },
        yearly: { perMonth: 18.8, total: 226, note: "£18.8/mo, billed £226 yearly (35% off)" },
      },
      AED: {
        monthly: { perMonth: 145, total: 145, note: "Billed monthly" },
        "3months": { perMonth: 130.6, total: 392, note: "AED 130.6/mo = AED 392 quarterly (10% off)" },
        "6months": { perMonth: 108.8, total: 653, note: "AED 108.8/mo = AED 653 half-yearly (25% off)" },
        yearly: { perMonth: 94.3, total: 1131, note: "AED 94.3/mo, billed AED 1,131 yearly (35% off)" },
      },
    },
    features: [
      "Everything in Starter + up to 150 active members",
      "Workout builder with GIF library & logging",
      "Diet plans, food database with calories & macros",
      "Body measurements & progress tracking charts",
      "Classes, batches, booking & waitlist management",
      "Leads CRM pipeline with follow-ups & trial conversions",
      "Expense tracking & consolidated P&L statements",
      "Dues follow-up queue, installments & reconciliation",
      "Live occupancy radar & peak-hour analytics",
      "Full mobile member app with inactivity alerts",
    ],
    ctaText: "Choose Growth",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Multi-branch clubs with trainer commissions, WhatsApp automation, and AI tools.",
    badge: "MULTI-BRANCH",
    popular: false,
    memberCapacity: "Up to 400 active members",
    memberCount: 400,
    pricing: {
      INR: {
        monthly: { perMonth: 1999, total: 1999, note: "Billed monthly" },
        "3months": { perMonth: 1799, total: 5397, note: "₹1,799/mo = ₹5,397 quarterly (10% off)" },
        "6months": { perMonth: 1499, total: 8994, note: "₹1,499/mo = ₹8,994 half-yearly (25% off)" },
        yearly: { perMonth: 1299, total: 15588, note: "₹1,299/mo, billed ₹15,588 yearly (35% off)" },
      },
      USD: {
        monthly: { perMonth: 79, total: 79, note: "Billed monthly" },
        "3months": { perMonth: 71, total: 213, note: "$71/mo = $213 quarterly (10% off)" },
        "6months": { perMonth: 59.2, total: 355, note: "$59.2/mo = $355 half-yearly (25% off)" },
        yearly: { perMonth: 51.3, total: 616, note: "$51.3/mo, billed $616 yearly (35% off)" },
      },
      EUR: {
        monthly: { perMonth: 68, total: 68, note: "Billed monthly" },
        "3months": { perMonth: 61.3, total: 184, note: "€61.3/mo = €184 quarterly (10% off)" },
        "6months": { perMonth: 51, total: 306, note: "€51/mo = €306 half-yearly (25% off)" },
        yearly: { perMonth: 44.2, total: 530, note: "€44.2/mo, billed €530 yearly (35% off)" },
      },
      GBP: {
        monthly: { perMonth: 58, total: 58, note: "Billed monthly" },
        "3months": { perMonth: 52.3, total: 157, note: "£52.3/mo = £157 quarterly (10% off)" },
        "6months": { perMonth: 43.5, total: 261, note: "£43.5/mo = £261 half-yearly (25% off)" },
        yearly: { perMonth: 37.7, total: 452, note: "£37.7/mo, billed £452 yearly (35% off)" },
      },
      AED: {
        monthly: { perMonth: 289, total: 289, note: "Billed monthly" },
        "3months": { perMonth: 260, total: 780, note: "AED 260/mo = AED 780 quarterly (10% off)" },
        "6months": { perMonth: 216.8, total: 1301, note: "AED 216.8/mo = AED 1,301 half-yearly (25% off)" },
        yearly: { perMonth: 187.8, total: 2254, note: "AED 187.8/mo, billed AED 2,254 yearly (35% off)" },
      },
    },
    features: [
      "Everything in Growth + up to 400 active members",
      "3 branches included & consolidated reports",
      "Trainer commissions, automated payroll & shifts roster",
      "Trainer performance metrics & custom dashboard widgets",
      "WhatsApp automation & group announcement broadcasting",
      "Progress photos before/after comparison",
      "Inventory POS, locker management & maintenance log",
      "Recurring payment support & biometric integrations",
      "200 AI assistant credits/month & 1-year audit logs",
      "Priority phone & WhatsApp hotline support",
    ],
    ctaText: "Choose Pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Unlimited branches, custom domain, API access, dedicated manager, and SLA.",
    badge: "UNLIMITED",
    popular: false,
    memberCapacity: "400+ active members",
    memberCount: 9999,
    pricing: {
      INR: {
        monthly: { perMonth: 3999, total: 3999, note: "From ₹3,999/month" },
        "3months": { perMonth: 3599, total: 10797, note: "Custom contract & terms" },
        "6months": { perMonth: 2999, total: 17994, note: "Custom contract & terms" },
        yearly: { perMonth: 2599, total: 31188, note: "From ₹2,599/mo yearly" },
      },
      USD: {
        monthly: { perMonth: 149, total: 149, note: "From $149/month" },
        "3months": { perMonth: 134, total: 402, note: "Custom contract & terms" },
        "6months": { perMonth: 112, total: 672, note: "Custom contract & terms" },
        yearly: { perMonth: 97, total: 1164, note: "From $97/mo yearly" },
      },
      EUR: {
        monthly: { perMonth: 129, total: 129, note: "From €129/month" },
        "3months": { perMonth: 116, total: 348, note: "Custom contract & terms" },
        "6months": { perMonth: 97, total: 582, note: "Custom contract & terms" },
        yearly: { perMonth: 84, total: 1008, note: "From €84/mo yearly" },
      },
      GBP: {
        monthly: { perMonth: 109, total: 109, note: "From £109/month" },
        "3months": { perMonth: 98, total: 294, note: "Custom contract & terms" },
        "6months": { perMonth: 82, total: 492, note: "Custom contract & terms" },
        yearly: { perMonth: 71, total: 852, note: "From £71/mo yearly" },
      },
      AED: {
        monthly: { perMonth: 549, total: 549, note: "From AED 549/month" },
        "3months": { perMonth: 494, total: 1482, note: "Custom contract & terms" },
        "6months": { perMonth: 412, total: 2472, note: "Custom contract & terms" },
        yearly: { perMonth: 357, total: 4284, note: "From AED 357/mo yearly" },
      },
    },
    features: [
      "400+ members & unlimited gym branches",
      "Franchise-level settings & centralized control",
      "Full REST API & real-time webhooks",
      "Custom branding & custom domain (yourgym.com) included",
      "Custom SQL/BI reports & higher AI credits",
      "Dedicated account manager, custom SLA & contract",
      "Full legacy data migration & staff training",
    ],
    ctaText: "Contact Enterprise",
  },
];

export interface AddOnData {
  name: string;
  priceByCurrency: Record<CurrencyCode, { monthly: string; yearly: string }>;
  availableOn: string;
  description: string;
}

export const GLOBAL_ADDONS: AddOnData[] = [
  {
    name: "Member pack (+50 members)",
    priceByCurrency: {
      INR: { monthly: "₹199 / mo", yearly: "₹129 / mo (billed yearly)" },
      USD: { monthly: "$9 / mo", yearly: "$6 / mo (billed yearly)" },
      EUR: { monthly: "€8 / mo", yearly: "€5 / mo (billed yearly)" },
      GBP: { monthly: "£7 / mo", yearly: "£4.5 / mo (billed yearly)" },
      AED: { monthly: "AED 33 / mo", yearly: "AED 21 / mo (billed yearly)" },
    },
    availableOn: "Starter, Growth (max 2 packs)",
    description: "Expand active member ceiling without moving up an entire plan tier.",
  },
  {
    name: "Custom branding",
    priceByCurrency: {
      INR: { monthly: "₹99 / mo", yearly: "₹64 / mo (billed yearly)" },
      USD: { monthly: "$5 / mo", yearly: "$3.5 / mo (billed yearly)" },
      EUR: { monthly: "€4.5 / mo", yearly: "€3 / mo (billed yearly)" },
      GBP: { monthly: "£4 / mo", yearly: "£2.5 / mo (billed yearly)" },
      AED: { monthly: "AED 18 / mo", yearly: "AED 12 / mo (billed yearly)" },
    },
    availableOn: "Starter, Growth, Pro (included in Enterprise)",
    description: "Display your gym logo and custom color palette on digital passes, receipts, and invoices.",
  },
  {
    name: "Custom domain (yourgym.com)",
    priceByCurrency: {
      INR: { monthly: "₹99 / mo", yearly: "₹64 / mo (billed yearly)" },
      USD: { monthly: "$5 / mo", yearly: "$3.5 / mo (billed yearly)" },
      EUR: { monthly: "€4.5 / mo", yearly: "€3 / mo (billed yearly)" },
      GBP: { monthly: "£4 / mo", yearly: "£2.5 / mo (billed yearly)" },
      AED: { monthly: "AED 18 / mo", yearly: "AED 12 / mo (billed yearly)" },
    },
    availableOn: "Starter, Growth, Pro (included in Enterprise)",
    description: "Point your existing or new domain name directly to your gym portal with auto-renewing SSL.",
  },
  {
    name: "Extra branch",
    priceByCurrency: {
      INR: { monthly: "₹149 / mo", yearly: "₹97 / mo (billed yearly)" },
      USD: { monthly: "$9 / mo", yearly: "$6 / mo (billed yearly)" },
      EUR: { monthly: "€8 / mo", yearly: "€5 / mo (billed yearly)" },
      GBP: { monthly: "£7 / mo", yearly: "£4.5 / mo (billed yearly)" },
      AED: { monthly: "AED 33 / mo", yearly: "AED 21 / mo (billed yearly)" },
    },
    availableOn: "Pro (unlimited in Enterprise)",
    description: "Add an additional gym location with isolated staff rosters and consolidated owner reports.",
  },
  {
    name: "WhatsApp / SMS notifications",
    priceByCurrency: {
      INR: { monthly: "Network cost + 15%", yearly: "Network cost + 15%" },
      USD: { monthly: "Network cost + 15%", yearly: "Network cost + 15%" },
      EUR: { monthly: "Network cost + 15%", yearly: "Network cost + 15%" },
      GBP: { monthly: "Network cost + 15%", yearly: "Network cost + 15%" },
      AED: { monthly: "Network cost + 15%", yearly: "Network cost + 15%" },
    },
    availableOn: "All paid plans",
    description: "Direct Meta Cloud API and local SMS gateway messaging with zero monthly software surcharge.",
  },
];
