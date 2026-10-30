/**
 * Homepage FAQ. Rendered as visible content and as FAQPage JSON-LD, so answers must stay
 * factual and match what the product actually does (search engines and AI answer engines
 * quote these directly). Keep pricing in sync with lib/pricing-data.ts.
 */
export interface HomeFaq {
  id: string;
  question: string;
  answer: string;
}

export const HOME_FAQS: HomeFaq[] = [
  {
    id: "what_is_repsi",
    question: "What is Repsi?",
    answer:
      "Repsi is gym management software for gyms, fitness studios, yoga studios, swimming pools and personal trainers. Owners manage members, memberships, attendance, payments, trainers, classes, workout plans and diet plans from one dashboard, and members use the Repsi app to check in, follow workouts and chat with their trainer.",
  },
  {
    id: "who_for",
    question: "Who is Repsi gym management software for?",
    answer:
      "Repsi is built for independent gyms, multi-branch fitness chains, boutique studios, CrossFit boxes, yoga studios, swimming pools and personal trainers — especially in India, with INR pricing, UPI payments and an interface in English, Tamil, Malayalam and Hindi.",
  },
  {
    id: "features",
    question: "What features does Repsi include?",
    answer:
      "Member and membership management, QR code attendance, online and UPI payments with invoices and receipts, automated WhatsApp, SMS and email renewal reminders, trainer management, workout and diet plans, trainer–member chat, classes, CRM and leads, a gym website builder, expense tracking, reports and analytics.",
  },
  {
    id: "pricing",
    question: "How much does Repsi cost?",
    answer:
      "Plans start at ₹199 per month for small facilities and scale with the number of active members, with discounts for 3-, 6- and 12-month billing. You can start with a free trial; see the pricing page for current plans.",
  },
  {
    id: "mobile",
    question: "Does Repsi have a mobile app for members and trainers?",
    answer:
      "Yes. Members get an Android app to check in with a QR pass, follow assigned workouts, track progress, view payments and message their trainer. Trainers use the same app to manage their clients, workout plans and diet plans.",
  },
  {
    id: "switch",
    question: "Can I move my existing members into Repsi?",
    answer:
      "Yes. You can import members from a CSV file, and Repsi detects duplicates by phone and email so your existing records stay clean.",
  },
  {
    id: "data",
    question: "Is my gym's data kept separate and secure?",
    answer:
      "Every gym's data is isolated to its own workspace, access is controlled by roles (owner, admin, manager, front desk, trainer, member), and important changes such as payments and membership updates are kept as history rather than overwritten.",
  },
];
