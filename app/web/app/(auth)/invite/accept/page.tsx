"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Building2, Eye, EyeOff, Loader2, MapPin } from "lucide-react";
import { ApiError, apiRequest, apiUrl, applySession, getToken, type SessionToken } from "@/lib/auth-client";
import { clearAuthCookie, getAuthUser } from "@/lib/auth";

interface InviteInfo {
  email: string;
  name: string;
  role: string;
  gym_name: string;
  gym_logo_url?: string | null;
  invited_by_name?: string | null;
  account_exists: boolean;
  branch_names: string[];
  expires_at: string;
}

const ROLE_LABEL: Record<string, string> = {
  member: "Member",
  trainer: "Trainer",
  staff: "Staff",
  manager: "Manager",
  admin: "Admin",
};

function AcceptInvite() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState("");
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoadError("This invitation link is incomplete.");
      return;
    }
    setSignedInEmail(getToken() ? getAuthUser()?.email || "your current account" : null);
    apiRequest<InviteInfo>(`/invitations/verify?token=${encodeURIComponent(token)}`, { auth: false })
      .then((data) => {
        setInfo(data);
        setFullName(data.name);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "We couldn't load this invitation."));
  }, [token]);

  const returnTo = `/invite/accept?token=${encodeURIComponent(token)}`;

  async function accept(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    const signedIn = Boolean(signedInEmail);
    if (!signedIn) {
      if (password.length < 8) return setError("Choose a password with at least 8 characters.");
      if (password !== confirm) return setError("Passwords don't match.");
    }
    setSubmitting(true);
    try {
      const session = await apiRequest<SessionToken>("/invitations/accept", {
        method: "POST",
        auth: signedIn,
        body: signedIn ? { token } : { token, password, full_name: fullName },
      });
      router.replace(applySession(session));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't accept this invitation.");
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="w-full max-w-[420px] space-y-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 text-center sm:p-8">
        <AlertCircle className="mx-auto h-10 w-10 text-[var(--primary)]" aria-hidden />
        <h1 className="text-lg font-semibold">Invitation unavailable</h1>
        <p className="text-sm text-[var(--text-muted)]">{loadError}</p>
        <Link href="/login" className="inline-block text-sm font-medium text-[var(--primary-dark)] hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  if (!info) {
    return <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" aria-label="Loading invitation" />;
  }

  const field =
    "flex h-10 w-full rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus-visible:border-[var(--ring)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

  return (
    <div className="w-full max-w-[440px] space-y-5">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)]">
          {info.gym_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={apiUrl(info.gym_logo_url)} alt="" className="h-full w-full object-contain" />
          ) : (
            <Building2 className="h-6 w-6 text-[var(--primary)]" aria-hidden />
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Join {info.gym_name}</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {info.invited_by_name ? `${info.invited_by_name} invited you` : "You've been invited"} as{" "}
          <strong className="text-[var(--text)]">{ROLE_LABEL[info.role] || info.role}</strong>
          {info.branch_names.length > 0 && (
            <>
              {" "}at <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{info.branch_names.join(", ")}</span>
            </>
          )}
          .
        </p>
      </div>

      <div className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
        {error && (
          <div role="alert" className="rounded-[8px] border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
            {error}
          </div>
        )}

        {signedInEmail ? (
          <>
            <p className="text-sm">
              Signed in as <strong>{signedInEmail}</strong>. This invitation is for <strong>{info.email}</strong>.
            </p>
            <button
              type="button"
              onClick={() => accept()}
              disabled={submitting}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Accept invitation
            </button>
            <button
              type="button"
              onClick={() => {
                clearAuthCookie();
                ["repsi_auth_token", "repsi_user", "repsi_workspace_slug"].forEach((k) => localStorage.removeItem(k));
                router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
              }}
              className="w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--primary-dark)]"
            >
              Use a different account
            </button>
          </>
        ) : info.account_exists ? (
          <>
            <p className="text-sm">
              <strong>{info.email}</strong> already has a REPSI account. Sign in with Google, WhatsApp, or your password to
              accept — your existing account and workspaces stay the same.
            </p>
            <Link
              href={`/login?redirect=${encodeURIComponent(returnTo)}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-[8px] bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
            >
              Sign in to accept
            </Link>
          </>
        ) : (
          <form onSubmit={accept} noValidate className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="inv-email">Email</label>
              <input id="inv-email" value={info.email} readOnly className={`${field} bg-[var(--background)] text-[var(--text-muted)]`} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="inv-name">Full name</label>
              <input id="inv-name" value={fullName} autoComplete="name" onChange={(e) => setFullName(e.target.value)} className={field} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="inv-password">Create password</label>
              <div className="relative">
                <input id="inv-password" type={show ? "text" : "password"} autoComplete="new-password" value={password}
                  onChange={(e) => setPassword(e.target.value)} className={`${field} pr-10`} />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">At least 8 characters.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="inv-confirm">Confirm password</label>
              <input id="inv-confirm" type={show ? "text" : "password"} autoComplete="new-password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} className={field} />
            </div>
            <button type="submit" disabled={submitting}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] disabled:opacity-60">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Create account & join
            </button>
            <p className="text-center text-xs text-[var(--text-muted)]">
              Prefer Google?{" "}
              <Link href={`/login?redirect=${encodeURIComponent(returnTo)}`} className="font-medium text-[var(--primary-dark)] hover:underline">
                Sign in with Google
              </Link>{" "}
              using {info.email}, then accept.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInvite />
    </Suspense>
  );
}
