import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { LanguageProvider } from "@/lib/i18n";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/languages";
import { DynamicPageTitle } from "@/components/layout/dynamic-page-title";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F6" },
    { media: "(prefers-color-scheme: dark)", color: "#17191C" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://repsi.app"),
  title: {
    default: "Repsi",
    template: "%s | Repsi",
  },
  description:
    "Repsi is the modern operating system for gyms. Manage members, memberships, attendance, trainers, classes, payments, and more — all in one powerful platform.",
  keywords: ["gym management", "fitness software", "membership management", "gym software", "REPSI"],
  authors: [{ name: "REPSI" }],
  openGraph: {
    title: "Repsi",
    description: "The modern operating system for gyms. Manage members, attendance, memberships and payments in one place.",
    url: "https://repsi.app",
    siteName: "Repsi",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://repsi.app/images/og-image.png",
        secureUrl: "https://repsi.app/images/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "REPSI - Gym Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Repsi",
    description: "The modern operating system for gyms.",
    images: ["https://repsi.app/images/og-image.png"],
    creator: "@repsi_app",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap"
        />
        {/*
          Indic script fallbacks. Google Fonts serves these with unicode-range, so a browser only
          downloads a script's font files when text in that script is on the page.
        */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&family=Noto+Sans+Malayalam:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Kannada:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap"
        />
        {/* Sets <html lang/dir> from the saved language before hydration (see lib/i18n). */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var lang = localStorage.getItem('repsi_preferred_locale');
                  if (lang && ${JSON.stringify(SUPPORTED_LANGUAGES.map((l) => l.code))}.indexOf(lang) !== -1) {
                    document.documentElement.lang = lang;
                    document.documentElement.dir = ${JSON.stringify(SUPPORTED_LANGUAGES.filter((l) => l.dir === "rtl").map((l) => l.code))}.indexOf(lang) !== -1 ? 'rtl' : 'ltr';
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        {/*
          Inline script to prevent flash of incorrect theme.
          Runs before React hydration — sets the class immediately.
          Defaults to light theme.
        */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('repsi-theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="repsi-theme"
        >
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "placeholder"}>
            <AuthProvider>
              <LanguageProvider>
                <DynamicPageTitle />
                {children}
              </LanguageProvider>
            </AuthProvider>
          </GoogleOAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
