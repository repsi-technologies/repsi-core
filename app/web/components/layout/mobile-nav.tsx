"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navGroupsForRole } from "./sidebar";
import { navLabelKey, useTranslation } from "@/lib/i18n";
import { getAuthUser, type AuthUser } from "@/lib/auth";
import { X, Building2, Menu } from "lucide-react";
import { RepsiWordmark } from "@/components/ui/repsi-wordmark";
import { ThemeMenu } from "./theme-picker";
import { cn } from "@/lib/utils";
import { accountPathForRole, getWorkspaceFromPath, slugToGymName } from "@/lib/workspace";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const workspace = getWorkspaceFromPath(pathname);
  // Same role-based menus as the desktop sidebar; resolved after mount (auth lives in the browser).
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    const u = getAuthUser();
    setUser(u);
    setRole(u?.role || "OWNER");
  }, []);
  const gymName = user?.gymName || slugToGymName(workspace);
  const displayName = user?.name || "";
  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "R";

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll and handle Escape key when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] bg-[var(--sidebar)] border-r border-[var(--border)] flex flex-col transition-transform duration-200 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--border)]">
          <Link href={`/${workspace}`} aria-label="REPSI home">
            <RepsiWordmark className="h-9 w-[108px]" />
          </Link>

          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[6px] text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text)] transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Gym info */}
        <div className="mx-4 my-3 p-2.5 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-[6px] bg-[var(--primary-soft)] flex items-center justify-center flex-shrink-0">
            <Building2 className="h-3.5 w-3.5 text-[var(--primary-dark)] dark:text-[var(--primary-hover)]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-[var(--text)] truncate">
              {gymName}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">
              repsi.app/{workspace}
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {(role ? navGroupsForRole(role) : []).map((group) => (
            <div key={group.title}>
              <div className="px-3 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {t(navLabelKey(group.title), group.title)}
                </span>
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const href = `/${workspace}${item.path}`;
                const isActive =
                  item.path === "/dashboard"
                    ? pathname === href || pathname === `/${workspace}`
                    : pathname.startsWith(href);

                return (
                  <Link
                    key={item.path}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text)]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isActive ? "text-[var(--nav-active-text)]" : "text-[var(--text-muted)]"
                      )}
                    />
                    {t(navLabelKey(item.label), item.label)}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)]">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/${workspace}${accountPathForRole(role)}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] bg-[var(--background)] flex-1 min-w-0 hover:bg-[var(--nav-hover-bg)]"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--primary-soft)] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-[var(--primary-dark)] dark:text-[var(--primary-hover)]">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--text)] truncate">{displayName || t("user.account", "Account")}</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">{t("settings.my_profile", "My Profile & Settings")}</p>
              </div>
            </Link>
            <ThemeMenu />
          </div>
        </div>
      </div>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text)] transition-colors"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
