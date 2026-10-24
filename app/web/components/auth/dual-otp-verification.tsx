"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Info, Loader2, Mail, MessageCircle, RefreshCw, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/countries";
import { useTranslation, richText } from "@/lib/i18n";

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

interface SingleOtpSectionProps {
  label: string;
  destination: string;
  icon: React.ReactNode;
  iconBg: string;
  codeSent: boolean;
  sending: boolean;
  onSendCode: () => void;
  digits: string[];
  setDigits: (d: string[]) => void;
  countdown: number;
  resending: boolean;
  onResend: () => void;
  disabled?: boolean;
  error?: string;
  testModeBadge?: string;
  tipNote?: React.ReactNode;
}

function SingleOtpSection({
  label,
  destination,
  icon,
  iconBg,
  codeSent,
  sending,
  onSendCode,
  digits,
  setDigits,
  countdown,
  resending,
  onResend,
  disabled,
  error,
  testModeBadge,
  tipNote,
}: SingleOtpSectionProps) {
  const { t } = useTranslation();
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
    <div className="space-y-3 rounded-[14px] border border-[var(--border)] bg-[var(--background)] p-4 transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-xs", iconBg)}>
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
          {codeSent ? (
            countdown > 0 ? (
              <span className="text-xs text-[var(--text-muted)] tabular-nums font-medium">
                {t("auth.resend_in_math_padstart", undefined, { Math: Math.floor(countdown / 60), padStart: String(countdown % 60).padStart(2, "0") })}</span>
            ) : (
              <button
                type="button"
                onClick={onResend}
                disabled={resending || disabled}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3 w-3", resending && "animate-spin")} />
                {resending ? t("auth.sending") : t("auth.resend")}
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onSendCode}
              disabled={sending || disabled}
              className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[var(--primary)] px-3 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              {sending ? (
                <>
                  {richText(t("auth.loader2sending"), { loader2: <Loader2 className="h-3.5 w-3.5 animate-spin" /> })}</>
              ) : (
                <>
                  {richText(t("auth.sendsend_code"), { send: <Send className="h-3 w-3" /> })}</>
              )}
            </button>
          )}
        </div>
      </div>

      {!codeSent ? (
        <div className="rounded-[8px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-xs text-[var(--text-muted)] flex items-center justify-between">
          <span>{t("auth.click")}{" "}<strong>{t("auth.send_code")}</strong> to receive your 6-digit code.</span>
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>{t("auth.verification_code_sent_enter_the_6")}</span>
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

          {testModeBadge && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200/80 rounded-[6px] px-2.5 py-1.5">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>{testModeBadge}</span>
            </div>
          )}

          {tipNote}
        </div>
      )}
    </div>
  );
}

interface DualOtpVerificationProps {
  phone: string; // E.164
  email: string;
  phoneCodeSent: boolean;
  emailCodeSent: boolean;
  phoneSending: boolean;
  emailSending: boolean;
  phoneResendIn: number;
  emailResendIn: number;
  phoneTestMode?: boolean;
  verifying: boolean;
  phoneResending: boolean;
  emailResending: boolean;
  error?: string;
  onSendPhoneCode: () => void;
  onSendEmailCode: () => void;
  onVerify: (phoneCode: string, emailCode: string) => void;
  onResendPhone: () => void;
  onResendEmail: () => void;
  onEditDetails: () => void;
}

export function DualOtpVerification({
  phone,
  email,
  phoneCodeSent,
  emailCodeSent,
  phoneSending,
  emailSending,
  phoneResendIn,
  emailResendIn,
  phoneTestMode,
  verifying,
  phoneResending,
  emailResending,
  error,
  onSendPhoneCode,
  onSendEmailCode,
  onVerify,
  onResendPhone,
  onResendEmail,
  onEditDetails,
}: DualOtpVerificationProps) {
  const { t } = useTranslation();
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
  const isComplete =
    phoneCodeSent &&
    emailCodeSent &&
    phoneCode.length === LENGTH &&
    emailCode.length === LENGTH;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isComplete && !verifying) {
      onVerify(phoneCode, emailCode);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Informational intro */}
      <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-subtle,#F7F7F5)] p-3 text-xs text-[var(--text-secondary)]">
        <p className="font-semibold text-[var(--text)]">{t("auth.please_confirm_your_contact_details")}</p>
        <p className="mt-0.5">{t("auth.click")}{" "}<strong>{t("auth.send_code")}</strong> {t("auth.for_both_your_mobile_number_and")}</p>
      </div>

      {error && (
        <div role="alert" className="rounded-[8px] border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* WhatsApp / Mobile OTP Section */}
      <SingleOtpSection
        label={t("auth.mobile_number_whatsapp")}
        destination={formatPhone(phone) || phone}
        icon={<MessageCircle className="h-4 w-4" />}
        iconBg="bg-[#25D366]"
        codeSent={phoneCodeSent}
        sending={phoneSending}
        onSendCode={onSendPhoneCode}
        digits={phoneDigits}
        setDigits={setPhoneDigits}
        countdown={phoneCountdown}
        resending={phoneResending}
        onResend={onResendPhone}
        disabled={verifying}
        error={error && error.toLowerCase().includes("whatsapp") ? error : undefined}
        testModeBadge={phoneTestMode ? "Mobile Test Mode active: enter test code 123456" : undefined}
      />

      {/* Email OTP Section */}
      <SingleOtpSection
        label={t("auth.email_address")}
        destination={email}
        icon={<Mail className="h-4 w-4" />}
        iconBg="bg-[var(--primary)]"
        codeSent={emailCodeSent}
        sending={emailSending}
        onSendCode={onSendEmailCode}
        digits={emailDigits}
        setDigits={setEmailDigits}
        countdown={emailCountdown}
        resending={emailResending}
        onResend={onResendEmail}
        disabled={verifying}
        error={error && error.toLowerCase().includes("email") ? error : undefined}
        tipNote={
          <div className="flex items-start gap-2 rounded-[8px] border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-[11px] text-amber-900 leading-tight">
            <span className="text-sm">📬</span>
            <div>
              <span className="font-semibold">{t("auth.check_your_spam_or_junk_folder")}{" "}</span>
              <span>{t("auth.if_you_don_t_see_the")}</span>
            </div>
          </div>
        }
      />

      <button
        type="submit"
        disabled={!isComplete || verifying}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] shadow-xs transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {verifying && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {verifying
          ? t("auth.verifying_codes")
          : !phoneCodeSent || !emailCodeSent
          ? t("auth.send_both_codes_to_continue")
          : !isComplete
          ? t("auth.enter_both_6_digit_codes")
          : t("auth.verify_create_account")}
      </button>

      <div className="text-center pt-1">
        <button
          type="button"
          onClick={onEditDetails}
          disabled={verifying}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
        >
          {richText(t("auth.arrowleftedit_contact_details"), { arrowleft: <ArrowLeft className="h-3.5 w-3.5" /> })}</button>
      </div>
    </form>
  );
}
