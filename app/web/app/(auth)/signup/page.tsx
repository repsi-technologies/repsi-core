"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

import { PhoneInput } from "@/components/ui/phone-input";
import { DualOtpVerification } from "@/components/auth/dual-otp-verification";
import { OtpVerification } from "@/components/auth/otp-verification";
import { ApiError, SIGNUP_TICKET_KEY, applySession, authApi } from "@/lib/auth-client";
import { formatPhone, isValidPhone, splitPhone } from "@/lib/countries";
import { cn } from "@/lib/utils";

const TICKET_TTL_MS = 18 * 60 * 1000; // backend ticket lives 20 minutes

const inputClass =
  "flex h-10 w-full rounded-[8px] border bg-[var(--surface)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:border-[var(--ring)]";

type Errors = Partial<Record<"name" | "email" | "phone" | "password" | "confirm" | "form", string>>;

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--text)]">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-[var(--error,#DC2626)]">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("IN");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  // Verified-phone ticket (from login redirect)
  const [ticket, setTicket] = useState<{ token: string; phone: string } | null>(null);

  // Dual verification state
  const [showVerification, setShowVerification] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [phoneSending, setPhoneSending] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [phoneResendIn, setPhoneResendIn] = useState(30);
  const [emailResendIn, setEmailResendIn] = useState(60);
  const [phoneTestMode, setPhoneTestMode] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [phoneResending, setPhoneResending] = useState(false);
  const [emailResending, setEmailResending] = useState(false);

  useEffect(() => {
    if (params.get("continue") !== "1") return;
    try {
      const raw = sessionStorage.getItem(SIGNUP_TICKET_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      if (saved?.token && Date.now() - saved.at < TICKET_TTL_MS) {
        setTicket({ token: saved.token, phone: saved.phone });
        setPhone(saved.phone);
      }
    } catch {
      /* ignore malformed storage */
    }
  }, [params]);

  function validate(): boolean {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Enter a valid email address.";
    if (!ticket && !isValidPhone(phone, country as never)) e.phone = "Enter a valid mobile number for the selected country.";
    if (password.length < 8) e.password = "Use at least 8 characters.";
    if (confirm !== password) e.confirm = "Passwords don't match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setErrors({});
    if (ticket) {
      setLoading(true);
      try {
        const session = await authApi.signup({
          registration_token: ticket.token,
          full_name: name.trim(),
          email: email.trim(),
          password,
        });
        sessionStorage.removeItem(SIGNUP_TICKET_KEY);
        router.replace(applySession(session));
      } catch (err) {
        const api = err instanceof ApiError ? err : null;
        setErrors({ form: api?.message || "Couldn't create account." });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Do NOT send codes automatically.
    // Transition to confirmation screen where user verifies details and clicks "Send Code".
    setOtpError("");
    setShowVerification(true);
  }

  async function handleSendPhoneCode() {
    setPhoneSending(true);
    setOtpError("");
    try {
      const { national } = splitPhone(phone, country as never);
      const res = await authApi.requestOtp(national, country);
      setVerifiedPhone(res.phone);
      setPhoneResendIn(res.resend_in);
      setPhoneTestMode(res.test_mode);
      setPhoneCodeSent(true);
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : "Couldn't send WhatsApp verification code.");
    } finally {
      setPhoneSending(false);
    }
  }

  async function handleSendEmailCode() {
    setEmailSending(true);
    setOtpError("");
    try {
      const res = await authApi.requestEmailOtp(email.trim());
      setEmailResendIn(res.resend_in);
      setEmailCodeSent(true);
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : "Couldn't send email verification code.");
    } finally {
      setEmailSending(false);
    }
  }

  async function verifyDualOtp(phoneCode: string, emailCode: string) {
    setVerifying(true);
    setOtpError("");
    try {
      const session = await authApi.signup({
        full_name: name.trim(),
        email: email.trim(),
        password,
        phone: verifiedPhone || phone,
        country,
        phone_code: phoneCode,
        email_code: emailCode,
      });
      sessionStorage.removeItem(SIGNUP_TICKET_KEY);
      router.replace(applySession(session));
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : "Verification failed. Please check both codes.");
      setVerifying(false);
    }
  }

  async function resendPhone() {
    const target = verifiedPhone || phone;
    if (!target) return;
    setPhoneResending(true);
    setOtpError("");
    try {
      const { national } = splitPhone(target, country as never);
      const res = await authApi.requestOtp(national, country);
      setPhoneResendIn(res.resend_in);
      setPhoneTestMode(res.test_mode);
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : "Couldn't resend WhatsApp code.");
    } finally {
      setPhoneResending(false);
    }
  }

  async function resendEmail() {
    if (!email) return;
    setEmailResending(true);
    setOtpError("");
    try {
      const res = await authApi.requestEmailOtp(email.trim());
      setEmailResendIn(res.resend_in);
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : "Couldn't resend email code.");
    } finally {
      setEmailSending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[440px] space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-[28px]">
          {showVerification ? "Confirm Details & Verify" : "Create your account"}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {showVerification ? "Confirm your contact details and click Send Code to receive your OTPs." : "Start your 14-day free trial. No credit card required."}
        </p>
      </div>

      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-8">
        {showVerification ? (
          <DualOtpVerification
            phone={verifiedPhone || phone}
            email={email}
            phoneCodeSent={phoneCodeSent}
            emailCodeSent={emailCodeSent}
            phoneSending={phoneSending}
            emailSending={emailSending}
            phoneResendIn={phoneResendIn}
            emailResendIn={emailResendIn}
            phoneTestMode={phoneTestMode}
            verifying={verifying}
            phoneResending={phoneResending}
            emailResending={emailResending}
            error={otpError}
            onSendPhoneCode={handleSendPhoneCode}
            onSendEmailCode={handleSendEmailCode}
            onVerify={verifyDualOtp}
            onResendPhone={resendPhone}
            onResendEmail={resendEmail}
            onEditDetails={() => setShowVerification(false)}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {errors.form && (
              <div role="alert" className="rounded-[8px] border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                {errors.form}{" "}
                {errors.form.toLowerCase().includes("sign in") && (
                  <Link href="/login" className="font-semibold underline">Go to sign in</Link>
                )}
              </div>
            )}

            <Field id="name" label="Full name" error={errors.name}>
              <input
                id="name"
                autoComplete="name"
                placeholder="Arjun Nair"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={Boolean(errors.name) || undefined}
                className={cn(inputClass, errors.name ? "border-[var(--error,#DC2626)]" : "border-[var(--border)]")}
                autoFocus
              />
            </Field>

            <Field id="email" label="Work email" error={errors.email}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@gym.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email) || undefined}
                className={cn(inputClass, errors.email ? "border-[var(--error,#DC2626)]" : "border-[var(--border)]")}
              />
            </Field>

            {ticket ? (
              <div className="flex items-center gap-2 rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                <span>
                  <span className="font-semibold">{formatPhone(ticket.phone)}</span> verified on WhatsApp
                </span>
              </div>
            ) : (
              <Field id="signup-phone" label="Mobile number (WhatsApp)" error={errors.phone} hint="We'll send a verification code on WhatsApp.">
                <PhoneInput
                  id="signup-phone"
                  value={phone}
                  onChange={setPhone}
                  onCountryChange={(c) => setCountry(c.code)}
                  error={Boolean(errors.phone)}
                />
              </Field>
            )}

            <Field id="password" label="Password" error={errors.password} hint="At least 8 characters.">
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(errors.password) || undefined}
                  className={cn(inputClass, "pr-10", errors.password ? "border-[var(--error,#DC2626)]" : "border-[var(--border)]")}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Field id="confirm" label="Confirm password" error={errors.confirm}>
              <input
                id="confirm"
                type={showPwd ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={Boolean(errors.confirm) || undefined}
                className={cn(inputClass, errors.confirm ? "border-[var(--error,#DC2626)]" : "border-[var(--border)]")}
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] shadow-xs transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-label="Loading" />
              ) : (
                <>
                  {ticket ? "Create account" : "Continue"}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-sm text-[var(--text-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[var(--text)] hover:text-[var(--primary-dark)]">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
