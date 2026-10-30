"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { THEMES } from "@/lib/themes";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function Swatch({ colors, className }: { colors: readonly string[]; className?: string }) {
  return (
    <span className={cn("inline-flex h-4 w-7 overflow-hidden rounded-[4px] border border-black/10", className)} aria-hidden>
      {colors.map((c) => (
        <span key={c} className="flex-1" style={{ background: c }} />
      ))}
    </span>
  );
}

/** Topbar button: opens a menu with every REPSI theme. */
export function ThemeMenu() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) return <div className="h-9 w-9 rounded-[8px] bg-[var(--border)] animate-pulse" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("layout.theme", "Theme")} title={t("layout.theme", "Theme")}>
          <Palette className="h-4 w-4 text-[var(--primary)]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-[var(--text-muted)]">{t("layout.theme", "Theme")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((item) => (
          <DropdownMenuItem key={item.id} onClick={() => setTheme(item.id)} className="cursor-pointer gap-2.5">
            <Swatch colors={item.swatch} />
            <span className="flex-1">{t(`theme.${item.id}`, item.label)}</span>
            {theme === item.id && <Check className="h-3.5 w-3.5 text-[var(--primary)]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Settings card grid: larger previews of each theme. */
export function ThemeSwatches() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <div role="radiogroup" aria-label={t("layout.theme", "Theme")} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {THEMES.map((item) => {
        const active = mounted && theme === item.id;
        const [bg, surface, accent] = item.swatch;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(item.id)}
            className={cn(
              "group rounded-[12px] border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              active ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] hover:border-[var(--border-strong)]",
            )}
          >
            <span className="block h-16 rounded-[8px] p-2" style={{ background: bg }} aria-hidden>
              <span className="block h-full rounded-[6px] p-1.5" style={{ background: surface }}>
                <span className="block h-1.5 w-8 rounded-full" style={{ background: accent }} />
                <span className="mt-1.5 block h-1 w-12 rounded-full opacity-40" style={{ background: item.dark ? "#fff" : "#000" }} />
              </span>
            </span>
            <span className="mt-2 flex items-center justify-between text-sm font-medium text-[var(--text)]">
              {t(`theme.${item.id}`, item.label)}
              {active && <Check className="h-4 w-4 text-[var(--primary)]" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
