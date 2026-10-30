"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeMenu } from "@/components/layout/theme-picker";
import { TrialNavbarBadge } from "@/components/layout/trial-navbar-badge";
import { GettingStartedDialog } from "@/components/layout/getting-started-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { logoutSession, getAuthUser } from "@/lib/auth";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { accountPathForRole, NOTIFICATIONS_CHANGED_EVENT } from "@/lib/workspace";
import { clearStorageKeepingLanguage } from "@/lib/i18n/persist";

// ─── User Menu ────────────────────────────────────────────────────────────────

function UserMenu({ workspace }: { workspace?: string }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const { t } = useTranslation();
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);

  useEffect(() => {
    const authUser = getAuthUser();
    if (authUser) {
      setUser(authUser);
    }
  }, []);

  const currentWorkspace =
    workspace ||
    (typeof window !== "undefined" ? localStorage.getItem("repsi_workspace_slug") : null) ||
    "apex-fitness";

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutSession();
    } catch (err) {
      console.error("Sign out error:", err);
      // Fallback redirect & client storage reset
      try {
        document.documentElement.classList.remove("dark");
        document.documentElement.removeAttribute("data-theme");
        document.documentElement.style.colorScheme = "light";
        clearStorageKeepingLanguage();
      } catch {}
      window.location.href = "/login";
    }
  };

  const displayName = user?.name || t("layout.nitheesh_kumar");
  const displayEmail = user?.email || "owner@apexfitness.in";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="flex items-center gap-2 rounded-[8px] p-1 pr-2 hover:bg-[var(--nav-hover-bg)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer"
          aria-label={t("layout.open_user_menu")}
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[10px] bg-[var(--primary-soft)] text-[var(--primary-dark)] dark:text-[var(--primary-hover)] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-[var(--text)] hidden sm:block">
            {displayName}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal py-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-[var(--text)]">{displayName}</span>
            <span className="text-xs text-[var(--text-muted)] truncate">{displayEmail}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={`/${currentWorkspace}${accountPathForRole(user?.role)}`} className="w-full">
            {t("user.account", "Account")}
          </Link>
        </DropdownMenuItem>
        {!["USER", "TRAINER"].includes((user?.role || "").toUpperCase()) && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/${currentWorkspace}/settings`} className="w-full">
              {t("nav.settings", "Settings")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/help" className="w-full">
            {t("user.help", "Help Center")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut}
          disabled={loggingOut}
          className="text-rose-500 hover:text-rose-600 focus:text-rose-500 focus:bg-rose-500/10 cursor-pointer flex items-center justify-between"
        >
          <span>{loggingOut ? t("user.signingOut", "Signing out...") : t("user.signOut", "Sign out")}</span>
          <span className="text-xs font-mono opacity-60">⌘Q</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { GlobalSearch } from "@/components/layout/global-search";

// ─── Topbar ───────────────────────────────────────────────────────────────────

interface TopbarProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
  mobileMenuButton?: React.ReactNode;
}

export function Topbar({ title, breadcrumbs, mobileMenuButton }: TopbarProps) {
  const params = useParams();
  const workspace = params?.workspace as string | undefined;
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  const [isBusinessRole, setIsBusinessRole] = useState(false);
  useEffect(() => {
    setIsBusinessRole(["OWNER", "ADMIN", "MANAGER"].includes((getAuthUser()?.role || "").toUpperCase()));
  }, []);

  useEffect(() => {
    let active = true;
    const fetchUnread = async () => {
      try {
        const res = await api.getNotifications(1, 1);
        if (active) setUnreadCount(res.unread_count || 0);
      } catch {
        // silent fallback if offline/unauthenticated
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    const onVisible = () => { if (document.visibilityState === "visible") fetchUnread(); };
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, fetchUnread);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, fetchUnread);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <header className="flex h-14 items-center justify-between gap-2 sm:gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-3 sm:px-6">
      {/* Mobile menu trigger */}
      {mobileMenuButton}
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-1.5 min-w-0 max-w-[130px] xs:max-w-[180px] sm:max-w-none">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label={t("layout.breadcrumb")} className="flex items-center gap-1.5">
            {breadcrumbs.map((crumb, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)] flex-shrink-0" />
                )}
                <span
                  className={cn(
                    "text-sm truncate",
                    i === breadcrumbs.length - 1
                      ? "font-medium text-[var(--text)]"
                      : "text-[var(--text-muted)]"
                  )}
                >
                  {crumb.label}
                </span>
              </div>
            ))}
          </nav>
        ) : title ? (
          <h1 className="text-sm font-semibold text-[var(--text)] truncate">{title}</h1>
        ) : null}
      </div>

      {/* Center: Global Search */}
      <div className="flex-1 max-w-md hidden md:flex items-center">
        <GlobalSearch />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* The gym's REPSI subscription is the business's concern, not members' or trainers'. */}
        {isBusinessRole && (
          <div className="mr-0.5 sm:mr-1 shrink-0">
            <TrialNavbarBadge workspace={workspace} />
          </div>
        )}

        {/* Notifications */}
        <Link href={workspace ? `/${workspace}/notifications` : "/superadmin/notifications"}>
          <div className="relative">
            <Button variant="ghost" size="icon" aria-label={t("nav.notifications")}>
              <Bell className="h-4 w-4" />
            </Button>
            {/* Unread indicator */}
            {unreadCount > 0 && (
              <span
                className="pointer-events-none absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--primary)] text-[10px] font-bold leading-none text-[var(--primary-foreground)] flex items-center justify-center"
                aria-label={t("layout.unread_count", "{count} unread", { count: unreadCount })}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </Link>

        {/* Language */}
        <LanguageSelector />

        {/* Theme */}
        <ThemeMenu />

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--border)] mx-1" />

        {/* User */}
        <UserMenu workspace={workspace} />
      </div>

      {workspace && (
        <GettingStartedDialog
          workspace={workspace}
          isOpen={showGettingStarted}
          onClose={() => setShowGettingStarted(false)}
        />
      )}
    </header>
  );
}
