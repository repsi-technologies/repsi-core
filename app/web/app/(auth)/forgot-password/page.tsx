"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { ApiError, authApi } from "@/lib/auth-client";
import { useTranslation, richText } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(t("forgot_password.enter_the_email_address_you_use"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("forgot_password.something_went_wrong_please_try_again"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[400px] space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">{t("forgot_password.reset_your_password")}</h1>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">
          {t("forgot_password.also_use_this_if_you_signed")}
        </p>
      </div>

      {sent ? (
        <div className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 text-center sm:p-8">
          <MailCheck className="mx-auto h-10 w-10 text-[var(--primary)]" aria-hidden />
          <p className="text-sm text-[var(--text)]">
            {richText(t("forgot_password.if_an_account_exists_for_email"), { email: <strong>{email.trim()}</strong> })}</p>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary-dark)] hover:underline">
            {richText(t("forgot_password.arrowleftback_to_sign_in"), { arrowleft: <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> })}</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[var(--text)]">
              {t("forgot_password.email_address")}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error) || undefined}
              className="flex h-10 w-full rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus-visible:border-[var(--ring)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
            {error && <p className="mt-1 text-xs font-medium text-[var(--error,#DC2626)]">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t("forgot_password.send_reset_link")}
          </button>
          <p className="text-center text-sm">
            <Link href="/login" className="text-[var(--text-muted)] hover:text-[var(--primary-dark)]">
              {t("forgot_password.back_to_sign_in")}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
