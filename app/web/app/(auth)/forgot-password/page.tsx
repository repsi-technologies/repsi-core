"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { ApiError, authApi } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter the email address you use for REPSI.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[400px] space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Reset your password</h1>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">
          Also use this if you signed up with Google or WhatsApp and want to add a password.
        </p>
      </div>

      {sent ? (
        <div className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 text-center sm:p-8">
          <MailCheck className="mx-auto h-10 w-10 text-[var(--primary)]" aria-hidden />
          <p className="text-sm text-[var(--text)]">
            If an account exists for <strong>{email.trim()}</strong>, we&apos;ve emailed a link to set a new password. It
            expires in 30 minutes.
          </p>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary-dark)] hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[var(--text)]">
              Email address
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
            Send reset link
          </button>
          <p className="text-center text-sm">
            <Link href="/login" className="text-[var(--text-muted)] hover:text-[var(--primary-dark)]">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
