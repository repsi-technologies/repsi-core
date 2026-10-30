import type { Metadata } from "next";
import { GLOBAL_PLANS } from "@/lib/pricing-data";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://repsi.app";

export interface PageSeoOptions {
  title: string;
  description: string;
  keywords?: string[];
  path?: string;
  ogType?: "website" | "article";
  image?: string;
  noIndex?: boolean;
}

export function constructMetadata({
  title,
  description,
  keywords = [],
  path = "",
  ogType = "website",
  image = "/images/og-image.png",
  noIndex = false,
}: PageSeoOptions): Metadata {
  const canonicalUrl = `${SITE_URL}${path}`;
  const defaultKeywords = [
    "gym management software",
    "gym management software India",
    "gym management system",
    "gym software",
    "gym management app",
    "fitness management software",
    "gym CRM software",
    "gym billing software",
    "gym membership management software",
  ];

  const combinedKeywords = Array.from(new Set([...defaultKeywords, ...keywords]));

  return {
    // Absolute so a parent "%s | Repsi" template can't append the brand twice.
    title: {
      absolute: title === "Repsi" || path === "/" || /\|\s*Repsi\s*$/i.test(title) ? title : `${title} | Repsi`,
    },
    description,
    keywords: combinedKeywords,
    authors: [{ name: "Repsi", url: SITE_URL }],
    creator: "Repsi",
    publisher: "Repsi",
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Repsi",
      locale: "en_IN",
      type: ogType,
      images: [
        {
          url: image.startsWith("http") ? image : `${SITE_URL}${image}`,
          secureUrl: image.startsWith("http") ? image : `${SITE_URL}${image}`,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: `${title} | REPSI`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.startsWith("http") ? image : `${SITE_URL}${image}`],
      creator: "@repsi_app",
    },
    icons: {
      icon: "/icon.png",
      apple: "/apple-icon.png",
    },
    manifest: "/manifest.json",
  };
}

/**
 * Generate Organization JSON-LD Schema
 */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Repsi",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    sameAs: [
      "https://linkedin.com/company/repsi",
      "https://instagram.com/repsi.app",
    ],
    description: "The modern operating system for gyms, studios, swimming pools, and fitness businesses.",
    telephone: "+918667783321",
    email: "contact@repsi.app",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Gandhimanagar, Peelamedu",
      addressLocality: "Coimbatore",
      addressRegion: "Tamil Nadu",
      addressCountry: "IN",
    },
  };
}

/**
 * Generate SoftwareApplication JSON-LD Schema.
 * Prices come from the public plan catalogue (monthly INR). No ratings are claimed: only add an
 * aggregateRating here once it is backed by real, published reviews.
 */
export function getSoftwareAppSchema() {
  const monthly = GLOBAL_PLANS.map((p) => p.pricing.INR.monthly.perMonth);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Repsi",
    alternateName: "Repsi Gym Management Software",
    url: SITE_URL,
    operatingSystem: "Web, Android, iOS, Windows",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Gym management software",
    inLanguage: ["en", "ta", "ml", "hi"],
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: String(Math.min(...monthly)),
      highPrice: String(Math.max(...monthly)),
      offerCount: String(monthly.length),
      url: `${SITE_URL}/pricing`,
    },
    featureList: [
      "Member and membership management",
      "QR code attendance and check-in",
      "Online and UPI payments, invoices and receipts",
      "WhatsApp, SMS and email renewal reminders",
      "Trainer management, workout plans and diet plans",
      "Trainer–member chat",
      "Member mobile app with workout tracking",
      "CRM, leads and gym website builder",
      "Reports, analytics and multi-branch support",
    ],
    description:
      "Repsi is gym management software for gyms, fitness studios, yoga studios, swimming pools and personal trainers. It handles members, memberships, attendance, payments, trainers, workouts, diet plans and reminders in one web and mobile platform.",
    publisher: { "@type": "Organization", name: "Repsi", url: SITE_URL },
  };
}

/**
 * Generate WebSite JSON-LD Schema (site name for search results).
 */
export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Repsi",
    alternateName: ["REPSI", "repsi.app"],
    url: SITE_URL,
    inLanguage: "en-IN",
  };
}

/**
 * Generate FAQ JSON-LD Schema
 */
export function getFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
