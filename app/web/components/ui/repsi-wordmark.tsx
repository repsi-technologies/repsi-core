/* eslint-disable @next/next/no-img-element -- small static brand assets; plain <img> keeps both theme variants cheap */
import { cn } from "@/lib/utils";

/**
 * REPSI brand mark for app chrome. Both theme variants are rendered and
 * CSS (`dark:`) picks one, so there is no flash while next-themes hydrates.
 * `compact` shows only the "R" lettermark (collapsed sidebar).
 */
export function RepsiWordmark({ compact = false, className }: { compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <span className={cn("relative block h-7 w-9", className)} aria-label="REPSI" role="img">
        <img src="/logos/repsi-r-full.png" alt="" className="absolute inset-0 h-full w-full object-contain dark:hidden" />
        <img src="/logos/repsi-r-body-white.png" alt="" className="absolute inset-0 hidden h-full w-full object-contain dark:block" />
        <img src="/logos/repsi-r-slash.png" alt="" className="absolute inset-0 hidden h-full w-full object-contain dark:block" />
      </span>
    );
  }
  return (
    <span className={cn("relative block h-10 w-[120px]", className)} aria-label="REPSI" role="img">
      <img src="/logos/logo-dark.png" alt="" className="absolute inset-0 h-full w-full object-contain dark:hidden" />
      <img src="/logos/repsi-logo-white.png" alt="" className="absolute inset-0 hidden h-full w-full object-contain dark:block" />
    </span>
  );
}
