"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, HeartPulse } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeSwatches } from "@/components/layout/theme-picker";
import { NotificationPreferencesCard } from "@/features/communications/notification-preferences";
import { ProfileSection } from "@/features/settings/organization-settings";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Theme + interface language. Both apply instantly and are remembered (language also on the account). */
export function AppearanceSection() {
  const { t, language, setLanguage, languages } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.appearance", "Appearance")}</CardTitle>
        <CardDescription>{t("settings.appearance_desc", "Choose a theme and the language REPSI uses on this device.")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="text-sm font-medium text-[var(--text)]">{t("layout.theme", "Theme")}</div>
          <ThemeSwatches />
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium text-[var(--text)]">{t("lang.title", "Language")}</div>
          <div role="radiogroup" aria-label={t("lang.title", "Language")} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {languages.map((lang) => {
              const active = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  lang={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-2 rounded-[10px] border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                    active ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] hover:border-[var(--border-strong)]",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-[var(--text)]">{lang.nativeName}</span>
                    <span className="block truncate text-xs text-[var(--text-muted)]">{lang.label}</span>
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0 text-[var(--primary)]" />}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** "My profile" for members and trainers: identity, sign-in, appearance and notification channels. */
export function AccountSettings({ role }: { role: "USER" | "TRAINER" }) {
  const { t } = useTranslation();
  const params = useParams();
  const workspace = params?.workspace as string;
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">{t("settings.my_profile", "My Profile & Settings")}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {t("settings.my_profile_desc", "Your name, sign-in methods, password, theme, language and notifications.")}
        </p>
      </div>
      <ProfileSection />
      <AppearanceSection />
      <NotificationPreferencesCard />
      {role === "USER" && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-3">
              <HeartPulse className="h-5 w-5 text-[var(--primary)]" />
              <div>
                <div className="text-sm font-medium text-[var(--text)]">{t("settings.health_apps", "Health apps")}</div>
                <div className="text-xs text-[var(--text-muted)]">{t("settings.health_apps_desc", "Connect Google Fit or Health Connect to sync steps and workouts.")}</div>
              </div>
            </div>
            <Link href={`/${workspace}/member/integrations`} className="shrink-0 text-sm font-semibold text-[var(--link)] hover:underline">
              {t("common.manage", "Manage")}
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
