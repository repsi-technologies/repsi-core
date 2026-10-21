"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/countries";

const LENGTH = 6;

export function useCountdown(initial = 0) {
  const [seconds, setSeconds] = useState(initial);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  return [seconds, setSeconds] as const;
}

interface OtpVerificationProps {
  phone: string; // E.164
  resendIn: number;
  testMode?: boolean;
  verifying: boolean;
  resending: boolean;
  error?: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  onChangeNumber: () => void;
  submitLabel?: string;
}

export function OtpVerification({
  phone,
  resendIn,
  testMode,
  verifying,
  resending,
  error,
  onVerify,
  onResend,
  onChangeNumber,
  submitLabel = "Verify",
}: OtpVerificationProps) {
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [countdown, setCountdown] = useCountdown(resendIn);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const code = digits.join("");

  useEffect(() => {
    setCountdown(resendIn);
  }, [resendIn, setCountdown]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  // Clear the boxes after a failed attempt so the next code starts fresh.
  useEffect(() => {
    if (error) {
      setDigits(Array(LENGTH).fill(""));
      refs.current[0]?.focus();
    }
  }, [error]);

  const fill = (value: string, start = 0) => {
    const clean = value.replace(/\D/g, "").slice(0, LENGTH - start);
    if (!clean) return;
    const next = [...digits];
    clean.split("").forEach((d, i) => (next[start + i] = d));
    setDigits(next);
    const focusIndex = Math.min(start + clean.length, LENGTH - 1);
    refs.current[focusIndex]?.focus();
    const joined = next.join("");
    if (joined.length === LENGTH && !verifying) onVerify(joined);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--background)] p-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366]/12 text-[#128C7E]">
          <MessageCircle className="h-4.5 w-4.5" aria-hidden />
        </span>
        <div className="min-w-0 text-sm">
          <p className="text-[var(--text)]">
            We sent a 6-digit code on WhatsApp to{" "}
            <span className="font-semibold whitespace-nowrap">{formatPhone(phone)}</span>
          </p>
          <button
            type="button"
            onClick={onChangeNumber}
            className="mt-0.5 text-xs font-medium text-[var(--primary-dark)] hover:underline"
          >
            Change number
          </button>
        </div>
      </div>

      {testMode && (
        <p className="rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Test mode: no WhatsApp message is sent. Use the development code configured on the server.
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length === LENGTH) onVerify(code);
        }}
        className="space-y-4"
      >
        <fieldset>
          <legend className="sr-only">Verification code</legend>
          <div className="flex justify-between gap-2" onPaste={(e) => {
            e.preventDefault();
            fill(e.clipboardData.getData("text"));
          }}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={d}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={LENGTH}
                aria-label={`Digit ${i + 1} of ${LENGTH}`}
                aria-invalid={Boolean(error) || undefined}
                disabled={verifying}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  if (v.length > 1) return fill(v, i);
                  const next = [...digits];
                  next[i] = v;
                  setDigits(next);
                  if (v && i < LENGTH - 1) refs.current[i + 1]?.focus();
                  if (next.join("").length === LENGTH && !verifying) onVerify(next.join(""));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
                  if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
                  if (e.key === "ArrowRight" && i < LENGTH - 1) refs.current[i + 1]?.focus();
                }}
                className={cn(
                  "h-12 w-full min-w-0 max-w-[52px] rounded-[10px] border bg-[var(--surface)] text-center text-lg font-semibold tabular-nums text-[var(--text)] outline-none transition-colors focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-60",
                  error ? "border-[var(--error,#DC2626)]" : "border-[var(--border)]"
                )}
              />
            ))}
          </div>
        </fieldset>

        <div aria-live="polite" className="min-h-[1.25rem]">
          {error && <p className="text-sm text-[var(--error,#DC2626)]">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={code.length !== LENGTH || verifying}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {verifying && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {verifying ? "Verifying…" : submitLabel}
        </button>
      </form>

      <div className="text-center text-sm text-[var(--text-muted)]">
        {countdown > 0 ? (
          <span>
            Resend code in <span className="tabular-nums font-medium text-[var(--text)]">{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="inline-flex items-center gap-1.5 font-medium text-[var(--primary-dark)] hover:underline disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", resending && "animate-spin")} aria-hidden />
            {resending ? "Sending…" : "Resend code"}
          </button>
        )}
      </div>
    </div>
  );
}
