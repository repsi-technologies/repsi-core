"use client";

import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCountryOptions, type CountryOption } from "@/lib/countries";
import type { CountryCode } from "libphonenumber-js/min";
import { useTranslation } from "@/lib/i18n";

interface CountrySelectProps {
  value: CountryCode | string | null | undefined;
  onChange: (country: CountryOption) => void;
  /** "dial" shows flag + calling code (phone fields); "name" shows flag + country name. */
  display?: "dial" | "name";
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  triggerClassName?: string;
  placeholder?: string;
  "aria-label"?: string;
}

export function CountrySelect({
  value,
  onChange,
  display = "name",
  id,
  disabled,
  invalid,
  className,
  triggerClassName,
  placeholder = "Select country",
  ...rest
}: CountrySelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const options = useMemo(() => getCountryOptions(), []);
  const selected = options.find((o) => o.code === value);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-describedby={invalid && id ? `${id}-error` : undefined}
          aria-label={rest["aria-label"] || (display === "dial" ? t("ui.country_calling_code") : t("ui.country"))}
          className={cn(
            display === "dial"
              ? "flex h-full items-center gap-1.5 pl-3 pr-2 text-sm font-medium text-[var(--text)] outline-none focus-visible:bg-[var(--surface-hover)] disabled:opacity-50"
              : "flex h-10 w-full items-center justify-between gap-2 rounded-[8px] border bg-[var(--surface)] px-3 text-sm text-[var(--text)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:border-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50",
            display === "name" && (invalid ? "border-[var(--error,#DC2626)]" : "border-[var(--border)]"),
            triggerClassName
          )}
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="text-base leading-none" aria-hidden>
                {selected.flag}
              </span>
              <span className="truncate">{display === "dial" ? selected.dialCode : selected.name}</span>
            </span>
          ) : (
            <span className="text-[var(--text-muted)]">{placeholder}</span>
          )}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className={cn(
            "z-[80] w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-lg",
            className
          )}
        >
          <Command
            loop
            filter={(itemValue, search) => (itemValue.toLowerCase().includes(search.toLowerCase().trim()) ? 1 : 0)}
          >
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-3">
              <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
              <Command.Input
                autoFocus
                placeholder={t("ui.search_country_or_code")}
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              />
            </div>
            <Command.List className="max-h-[min(300px,50vh)] overflow-y-auto overscroll-contain p-1">
              <Command.Empty className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                {t("ui.no_country_found")}
              </Command.Empty>
              {options.map((o) => (
                <Command.Item
                  key={o.code}
                  value={`${o.name} ${o.code} ${o.dialCode}`}
                  onSelect={() => {
                    onChange(o);
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm outline-none data-[selected=true]:bg-[var(--surface-hover)]"
                >
                  <span className="text-base leading-none" aria-hidden>
                    {o.flag}
                  </span>
                  <span className="flex-1 truncate">{o.name}</span>
                  <span className="text-xs tabular-nums text-[var(--text-muted)]">{o.dialCode}</span>
                  {o.code === value && <Check className="h-4 w-4 text-[var(--primary)]" aria-hidden />}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
