"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export const controlClass =
  "flex h-10 w-full rounded-[8px] border bg-[var(--surface)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:border-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60";

export function FormField({
  id,
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--text)]">
        {label}
        {required ? (
          <span className="ml-0.5 text-[var(--primary)]" aria-hidden>
            *
          </span>
        ) : (
          <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">{t("organization.optional")}</span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-[var(--error,#DC2626)]">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && props.id ? `${props.id}-error` : undefined}
      className={cn(controlClass, invalid ? "border-[var(--error,#DC2626)]" : "border-[var(--border)]", className)}
      {...props}
    />
  )
);
TextInput.displayName = "TextInput";

export function SelectInput({
  invalid,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(controlClass, "cursor-pointer pr-8", invalid ? "border-[var(--error,#DC2626)]" : "border-[var(--border)]", className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:opacity-50",
        checked ? "bg-[var(--primary)]" : "bg-[var(--border-strong,#C9C7C1)]"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        )}
      />
    </button>
  );
}

export function PrimaryButton({
  loading,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] shadow-xs transition-colors hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
      )}
      {children}
    </button>
  );
}

export function SecondaryButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    />
  );
}

export function FormAlert({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "border-rose-200 bg-rose-50 text-rose-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)]",
  }[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} className={cn("rounded-[8px] border px-3.5 py-2.5 text-sm", styles)}>
      {children}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)]">
      <header className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--text)]">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-[var(--text-muted)]">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}
