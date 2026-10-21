"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { ApiError, applySession, authApi } from "@/lib/auth-client";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    setError("");
    try {
      const session = await authApi.resetPassword(token, password);
      router.replace(applySession(session));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reset your password. Please try again.");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-[400px] rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm">
        This reset link is incomplete.{" "}
        <Link href="/forgot-password" className="font-medium text-[var(--primary-dark)] hover:underline">
          Request a new one
        </Link>
        .
      </div>
    );
  }

  const field =
    "flex h-10 w-full rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus-visible:border-[var(--ring)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

  return (
    <div className="w-full max-w-[400px] space-y-6">
      <h1 className="text-center text-2xl font-bold tracking-tight text-[var(--text)]">Choose a new password</h1>
      <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
        {error && (
          <div role="alert" className="rounded-[8px] border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
            {error}{" "}
            {error.includes("expired") && (
              <Link href="/forgot-password" className="font-semibold underline">Request a new link</Link>
            )}
          </div>
        )}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">New password</label>
          <div className="relative">
            <input id="password" type={show ? "text" : "password"} autoComplete="new-password" value={password}
              onChange={(e) => setPassword(e.target.value)} className={`${field} pr-10`} />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium">Confirm password</label>
          <input id="confirm" type={show ? "text" : "password"} autoComplete="new-password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} className={field} />
        </div>
        <button type="submit" disabled={loading}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] disabled:opacity-60">
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Save password & sign in
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
