"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Mail, MessageCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/countries";

const LENGTH = 6;

function useCountdown(initial = 0) {
  const [seconds, setSeconds] = useState(initial);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  return [seconds, setSeconds] as const;
}

interface SingleOtpInputProps {
  label: string;
  destination: string;
  icon: React.ReactNode;
  iconBg: string;
  digits: string[];
  setDigits: (d: string[]) => void;
  countdown: number;
  resending: boolean;
  onResend: () => void;
  disabled?: boolean;
  error?: string;
}

function SingleOtpInput({
  label,
  destination,
  icon,
  iconBg,
  digits,
  setDigits,
  countdown,
  resending,
  onResend,
  disabled,
  error,
}: SingleOtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const fill = (value: string, start = 0) => {
    const clean = value.replace(/\D/g, "").slice(0, LENGTH - start);
    if (!clean) return;
    const next = [...digits];
    clean.split("").forEach((d, i) => (next[start + i] = d));
    setDigits(next);
    const focusIndex = Math.min(start + clean.length, LENGTH - 1);
    refs.current[focusIndex]?.focus();
  };

  return (
    <div className="space-y-3 rounded-[14px] border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white", iconBg)}>
            {icon}
          </span>
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              {label}
            </span>
            <span className="block truncate text-sm font-semibold text-[var(--text)]">
              {destination}
            </span>
          </div>
        </div>

        <div>
          {countdown > 0 ? (
            <span className="text-xs text-[var(--text-muted)] tabular-nums font-medium">
              Resend in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
            </span>
          ) : (
            <button
              type="button"
              onClick={onResend}
              disabled={resending || disabled}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3 w-3", resending && "animate-spin")} />
              {resending ? "Sending…" : "Resend"}
            </button>
          )}
        </div>
      </div>

      <div
        className="flex justify-between gap-1.5 sm:gap-2"
        onPaste={(e) => {
          e.preventDefault();
          fill(e.clipboardData.getData("text"));
        }}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={`${label} digit ${i + 1}`}
            disabled={disabled}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              if (v.length > 1) return fill(v, i);
              const next = [...digits];
              next[i] = v;
              setDigits(next);
              if (v && i < LENGTH - 1) refs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
              if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
              if (e.key === "ArrowRight" && i < LENGTH - 1) refs.current[i + 1]?.focus();
            }}
            className={cn(
              "h-11 w-full min-w-0 max-w-[48px] rounded-[8px] border bg-[var(--surface)] text-center text-lg font-semibold tabular-nums text-[var(--text)] outline-none transition-colors focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-60",
              error ? "border-[var(--error,#DC2626)]" : "border-[var(--border)]"
            )}
          />
        ))}
      </div>
    </div>
  );
}

interface DualOtpVerificationProps {
  phone: string; // E.164
  email: string;
  phoneResendIn: number;
  emailResendIn: number;
  testMode?: boolean;
  verifying: boolean;
  phoneResending: boolean;
  emailResending: boolean;
  error?: string;
  onVerify: (phoneCode: string, emailCode: string) => void;
  onResendPhone: () => void;
  onResendEmail: () => void;
  onEditDetails: () => void;
}

export function DualOtpVerification({
  phone,
  email,
  phoneResendIn,
  emailResendIn,
  testMode,
  verifying,
  phoneResending,
  emailResending,
  error,
  onVerify,
  onResendPhone,
  onResendEmail,
  onEditDetails,
}: DualOtpVerificationProps) {
  const [phoneDigits, setPhoneDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [emailDigits, setEmailDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [phoneCountdown, setPhoneCountdown] = useCountdown(phoneResendIn);
  const [emailCountdown, setEmailCountdown] = useCountdown(emailResendIn);

  useEffect(() => {
    setPhoneCountdown(phoneResendIn);
  }, [phoneResendIn, setPhoneCountdown]);

  useEffect(() => {
    setEmailCountdown(emailResendIn);
  }, [emailResendIn, setEmailCountdown]);

  const phoneCode = phoneDigits.join("");
  const emailCode = emailDigits.join("");
  const isComplete = phoneCode.length === LENGTH && emailCode.length === LENGTH;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isComplete && !verifying) {
      onVerify(phoneCode, emailCode);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {testMode && (
        <div className="rounded-[8px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
          <p className="font-semibold">Test Mode Active</p>
          <p className="mt-0.5">Use the server test code (default <strong>123456</strong>) for both WhatsApp and Email.</p>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-[8px] border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* WhatsApp OTP Input */}
      <SingleOtpInput
        label="WhatsApp Verification"
        destination={formatPhone(phone)}
        icon={<MessageCircle className="h-4 w-4" />}
        iconBg="bg-[#25D366]"
        digits={phoneDigits}
        setDigits={setPhoneDigits}
        countdown={phoneCountdown}
        resending={phoneResending}
        onResend={onResendPhone}
        disabled={verifying}
        error={error && error.toLowerCase().includes("whatsapp") ? error : undefined}
      />

      {/* Email OTP Input */}
      <SingleOtpInput
        label="Email Verification"
        destination={email}
        icon={<Mail className="h-4 w-4" />}
        iconBg="bg-[var(--primary)]"
        digits={emailDigits}
        setDigits={setEmailDigits}
        countdown={emailCountdown}
        resending={emailResending}
        onResend={onResendEmail}
        disabled={verifying}
        error={error && error.toLowerCase().includes("email") ? error : undefined}
      />

      <button
        type="submit"
        disabled={!isComplete || verifying}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {verifying && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {verifying ? "Verifying codes…" : "Verify & Create Account"}
      </button>

      <div className="text-center pt-1">
        <button
          type="button"
          onClick={onEditDetails}
          disabled={verifying}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Edit signup details
        </button>
      </div>
    </form>
  );
}
