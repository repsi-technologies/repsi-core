"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2, Mail, MessageCircle } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

import { PhoneInput } from "@/components/ui/phone-input";
import { OtpVerification } from "@/components/auth/otp-verification";
import { ApiError, SIGNUP_TICKET_KEY, applySession, authApi, safeRedirect, type SessionToken } from "@/lib/auth-client";
import { isValidPhone, splitPhone } from "@/lib/countries";
import { getAuthUser, hasAuthSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

const inputClass =
  "flex h-10 w-full rounded-[8px] border bg-[var(--surface)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:border-[var(--ring)]";

function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));

  const [method, setMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("IN");
  const [otpPhone, setOtpPhone] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(30);
  const [testMode, setTestMode] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  // Already signed in (e.g. reopening the desktop app): go straight to the workspace.
  useEffect(() => {
    const user = hasAuthSession() ? getAuthUser() : null;
    if (!user) return;
    if (user.onboardingRequired) router.replace("/onboarding");
    else if (user.workspaceSlug) router.replace(redirect || `/${user.workspaceSlug}/dashboard`);
  }, [redirect, router]);

  function finish(session: SessionToken) {
    const next = applySession(session);
    // Deep links are honoured once the account has somewhere to land; invitation links
    // always are, since accepting one is how a new person joins an organization.
    const honour = redirect && (!session.onboarding_required || redirect.startsWith("/invite"));
    router.replace(honour ? redirect : next);
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError(t("login.enter_your_email_or_phone_number"));
      return;
    }
    setLoading(true);
    try {
      const looksLikePhone = !email.includes("@");
      finish(await authApi.login(email.trim(), password, looksLikePhone ? "IN" : undefined));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("login.sign_in_failed_please_try_again"));
      setLoading(false);
    }
  }

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    const { national } = splitPhone(phone, country as never);
    if (!national || !isValidPhone(phone, country as never)) {
      setError(t("login.enter_a_valid_mobile_number_for"));
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.requestOtp(national, country, "login");
      setOtpPhone(res.phone);
      setResendIn(res.resend_in);
      setTestMode(res.test_mode);
      setOtpError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("login.couldn_t_send_the_code_please"));
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (!otpPhone) return;
    setResending(true);
    setOtpError("");
    try {
      const res = await authApi.requestOtp(otpPhone, country, "login");
      setResendIn(res.resend_in);
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : t("login.couldn_t_resend_the_code"));
    } finally {
      setResending(false);
    }
  }

  async function verifyOtp(code: string) {
    if (!otpPhone) return;
    setVerifying(true);
    setOtpError("");
    try {
      const res = await authApi.verifyOtp(otpPhone, country, code);
      if (res.status === "authenticated" && res.token) {
        finish(res.token);
        return;
      }
      // Verified number without an account: continue sign-up with the verified phone.
      sessionStorage.setItem(
        SIGNUP_TICKET_KEY,
        JSON.stringify({ token: res.registration_token, phone: res.phone, at: Date.now() })
      );
      router.push("/signup?continue=1");
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : t("login.verification_failed_please_try_again"));
      setVerifying(false);
    }
  }

  const isGoogleConfigured = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== "placeholder"
  );

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        finish(await authApi.google(tokenResponse.access_token));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("login.google_sign_in_failed_please_try"));
        setLoading(false);
      }
    },
    onError: () => setError(t("login.google_sign_in_was_cancelled_or")),
  });

  function onGoogleClick() {
    if (!isGoogleConfigured) {
      setError(t("login.google_sign_in_is_not_configured"));
      return;
    }
    handleGoogleLogin();
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-6 text-center">
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--text)] sm:text-[30px]">{t("login.welcome_back")}</h1>
        <p className="mt-1.5 text-[15px] text-[var(--text-muted)]">{t("login.sign_in_to_your_repsi_workspace")}</p>
      </div>

      {otpPhone ? (
        <div className="space-y-4">
          <OtpVerification
            phone={otpPhone}
            resendIn={resendIn}
            testMode={testMode}
            verifying={verifying}
            resending={resending}
            error={otpError}
            onVerify={verifyOtp}
            onResend={resendOtp}
            onChangeNumber={() => {
              setOtpPhone(null);
              setOtpError("");
            }}
            submitLabel="Verify & sign in"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={onGoogleClick}
            disabled={loading}
            className="flex h-10 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] shadow-xs transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-60"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            {t("login.continue_with_google")}
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#F7F9F8] px-3 text-[var(--text-muted)]">{t("login.or_sign_in_with")}</span>
            </div>
          </div>

          <div role="tablist" aria-label={t("login.sign_in_method")} className="grid grid-cols-2 gap-1 rounded-[10px] border border-[var(--border)] bg-[var(--background)] p-1">
            {([
              { id: "email", label: t("login.email"), icon: Mail },
              { id: "phone", label: t("login.whatsapp_otp"), icon: MessageCircle },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={method === tab.id}
                onClick={() => {
                  setMethod(tab.id);
                  setError("");
                }}
                className={cn(
                  "flex h-8 items-center justify-center gap-1.5 rounded-[8px] text-sm font-medium transition-colors",
                  method === tab.id
                    ? "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" aria-hidden />
                {tab.label}
              </button>
            ))}
          </div>

          <div aria-live="polite">
            {error && (
              <div role="alert" className="rounded-[8px] border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                {error}
              </div>
            )}
          </div>

          {method === "email" ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                  {t("login.email_or_phone")}
                </label>
                <input
                  id="email"
                  type="text"
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(inputClass, "border-[var(--border)]")}
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-[var(--text)]">
                    {t("login.password")}
                  </label>
                  <Link href="/forgot-password" className="text-xs text-[var(--text-muted)] hover:text-[var(--primary-dark)]">
                    {t("login.forgot_password")}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(inputClass, "border-[var(--border)] pr-10")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                    aria-label={showPassword ? t("login.hide_password") : t("login.show_password")}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <SubmitButton loading={loading} label={t("auth.signIn")} />
            </form>
          ) : (
            <form onSubmit={sendOtp} className="space-y-4" noValidate>
              <div>
                <label htmlFor="login-phone" className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                  {t("login.mobile_number")}
                </label>
                <PhoneInput
                  id="login-phone"
                  value={phone}
                  onChange={(v) => {
                    setPhone(v);
                    setError("");
                  }}
                  onCountryChange={(c) => setCountry(c.code)}
                />
                <p className="mt-1.5 text-xs text-[var(--text-muted)]">{t("login.we_ll_send_a_one_time")}</p>
              </div>
              <SubmitButton loading={loading} label={t("login.send_code")} />
            </form>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        {t("login.don_t_have_an_account")}{" "}
        <Link href="/signup" className="font-semibold text-[var(--text)] hover:text-[var(--primary-dark)]">
          {t("login.create_one")}
        </Link>
      </p>
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  const { t } = useTranslation();
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-1 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] shadow-xs transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-label={t("login.loading")} /> : (
        <>
          {label}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </>
      )}
    </button>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
