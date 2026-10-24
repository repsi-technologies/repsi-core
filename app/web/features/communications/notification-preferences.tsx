"use client";

import { useEffect, useState } from "react";
import { communicationsApi, type NotificationPreferences } from "@/lib/communications-api";
import { Notice } from "@/features/fitness/shared";
import { useTranslation, tr } from "@/lib/i18n";

const ROWS: { key: keyof Omit<NotificationPreferences, "whatsapp_consent_at">; label: string; hint: string }[] = [
  { key: "in_app_enabled", get label() { return tr("communications.in_app_notifications"); }, get hint() { return tr("communications.alerts_inside_repsi"); } },
  { key: "email_enabled", get label() { return tr("invite.email"); }, get hint() { return tr("communications.receipts_reminders_and_announcements_by_email"); } },
  { key: "whatsapp_enabled", get label() { return tr("communications.whatsapp"); }, get hint() { return tr("communications.opt_in_to_receive_whatsapp_messages"); } },
  { key: "announcements_enabled", get label() { return tr("communications.announcements"); }, get hint() { return tr("communications.gym_wide_broadcasts_turn_off_to"); } },
];

export function NotificationPreferencesCard() {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    communicationsApi.getPreferences().then(setPrefs).catch((e: Error) => setError(e.message));
  }, []);

  const toggle = async (key: (typeof ROWS)[number]["key"]) => {
    if (!prefs) return;
    setSaving(key);
    setError(null);
    try {
      setPrefs(await communicationsApi.updatePreferences({ [key]: !prefs[key] }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3" aria-labelledby="pref-title">
      <h2 id="pref-title" className="text-sm font-semibold text-[var(--text)]">{t("communications.notification_preferences")}</h2>
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      {!prefs ? (
        <p className="text-sm text-[var(--text-muted)]">{t("communications.loading")}</p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {ROWS.map((r) => (
            <li key={r.key} className="flex items-center justify-between gap-4 py-2.5">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{r.label}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {r.hint}
                  {r.key === "whatsapp_enabled" && prefs.whatsapp_consent_at
                    ? ` · consent given ${new Date(prefs.whatsapp_consent_at.endsWith("Z") ? prefs.whatsapp_consent_at : `${prefs.whatsapp_consent_at}Z`).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[r.key]}
                aria-label={r.label}
                disabled={saving === r.key}
                onClick={() => toggle(r.key)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] outline-none disabled:opacity-60 ${
                  prefs[r.key] ? "bg-[var(--primary)]" : "bg-[var(--border-strong)]"
                }`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--surface)] shadow transition-transform ${prefs[r.key] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
