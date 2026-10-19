import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { LanguageProvider } from "@/lib/i18n";
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
    description: "The modern operating system for gyms.",
    url: "https://repsi.app",
    siteName: "Repsi",
    type: "website",
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
