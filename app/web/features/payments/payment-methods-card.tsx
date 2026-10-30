"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Landmark, QrCode, Smartphone } from "lucide-react";
import { AuthImage } from "@/components/ui/auth-image";
import { repsiApi, type ApiPaymentInstructions } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the value is still visible to copy by hand */
    }
  };
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="truncate font-mono text-sm text-[var(--text)]">{value}</p>
      </div>
      <button type="button" onClick={copy} aria-label={`Copy ${label}`} className="shrink-0 rounded-[8px] p-2 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]">
        {copied ? <Check className="h-4 w-4 text-[var(--success)]" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

/**
 * How to pay the gym: the UPI ID, uploaded QR code and bank details the owner enabled under
 * Payments → Settings. Members see this to pay; owners see it as a preview (`manageHref`).
 */
export function PaymentMethodsCard({ manageHref }: { manageHref?: string }) {
  const { t } = useTranslation();
  const [data, setData] = useState<ApiPaymentInstructions | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    repsiApi.getGeneralPaymentInstructions().then(setData).catch((e: Error) => setError(e.message));
  }, []);

  if (error) return null;
  if (!data) return <div className="h-32 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />;

  const { upi, qr, bank, phone } = data;
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-[var(--text)]">{t("pay.how_to_pay", "How to pay {gym}", { gym: data.gym_name })}</h2>
        {manageHref && (
          <Link href={manageHref} className="text-sm font-semibold text-[var(--link)] hover:underline">
            {data.has_active_methods ? t("common.edit", "Edit") : t("pay.set_up", "Set up")}
          </Link>
        )}
      </div>
      {!data.has_active_methods ? (
        <p className="text-sm text-[var(--text-muted)]">
          {manageHref
            ? t("pay.no_methods_owner", "Add your UPI ID, upload your payment QR code or add bank details so members can pay you directly.")
            : t("pay.no_methods_member", "Your gym hasn't added online payment details yet. Please pay at the front desk.")}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
          {qr && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-40 w-40 items-center justify-center rounded-xl border border-[var(--border)] bg-white p-2">
                <AuthImage src={repsiApi.getMerchantQrUrl()} version={qr.filename} alt={t("pay.qr_alt", "Gym payment QR code")} className="h-full w-full" />
              </div>
              <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <QrCode className="h-3.5 w-3.5" aria-hidden /> {t("pay.scan_qr", "Scan with any UPI app")}
              </span>
            </div>
          )}
          <div className="min-w-0 divide-y divide-[var(--border)]">
            {upi && (
              <div className="pb-2">
                <CopyRow label={t("pay.upi_id", "UPI ID")} value={upi.upi_id} />
                <p className="text-xs text-[var(--text-muted)]">{upi.upi_name}</p>
                {upi.instructions && <p className="mt-1 text-xs text-[var(--text-secondary)]">{upi.instructions}</p>}
                <a href={upi.payment_uri} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--link)] hover:underline sm:hidden">
                  <Smartphone className="h-4 w-4" aria-hidden /> {t("pay.open_upi_app", "Pay with a UPI app")}
                </a>
              </div>
            )}
            {phone && (
              <div className="py-2">
                <CopyRow label={t("pay.phone", "Pay to phone number")} value={phone.phone_number} />
              </div>
            )}
            {bank && (
              <div className="pt-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  <Landmark className="h-3.5 w-3.5" aria-hidden /> {t("pay.bank_transfer", "Bank transfer")}
                </p>
                <CopyRow label={t("pay.account_name", "Account name")} value={bank.account_name} />
                <CopyRow label={t("pay.account_number", "Account number")} value={bank.account_number} />
                <CopyRow label={t("pay.ifsc", "IFSC")} value={bank.ifsc} />
                {bank.bank_name && <p className="text-xs text-[var(--text-muted)]">{bank.bank_name}{bank.branch ? ` · ${bank.branch}` : ""}</p>}
              </div>
            )}
          </div>
        </div>
      )}
      {data.has_active_methods && !manageHref && (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          {t("pay.after_paying", "After paying, upload your receipt below so the gym can confirm it. Mention {ref} in the payment note.", { ref: data.reference_code })}
        </p>
      )}
    </section>
  );
}
