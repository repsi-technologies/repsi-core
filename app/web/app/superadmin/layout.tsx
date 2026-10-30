"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Dumbbell,
  CreditCard,
  Banknote,
  HelpCircle,
  Bell,
  FileText,
  Activity,
  Settings,
  LogOut,
  Search,
  ChevronRight,
  ShieldCheck,
  X,
  ExternalLink,
  User as UserIcon,
  BrainCircuit,
} from "lucide-react";
import { logoutSession, getAuthUser } from "@/lib/auth";
import { repsiApi } from "@/lib/api";

const sidebarNavItems = [
  { name: "Dashboard", href: "/superadmin/dashboard", icon: LayoutDashboard },
  { name: "Content & Growth", href: "/superadmin/content-growth", icon: BrainCircuit },
  { name: "Gyms", href: "/superadmin/gyms", icon: Building2 },
  { name: "Members", href: "/superadmin/members", icon: Users },
  { name: "Trainers", href: "/superadmin/trainers", icon: Dumbbell },
  { name: "Plans & Billing", href: "/superadmin/subscriptions", icon: CreditCard },
  { name: "Payments", href: "/superadmin/payments", icon: Banknote },
  { name: "Support", href: "/superadmin/support", icon: HelpCircle },
  { name: "Notifications", href: "/superadmin/notifications", icon: Bell },
  { name: "AI Usage", href: "/superadmin/ai", icon: BrainCircuit },
  { name: "Audit Logs", href: "/superadmin/audit-logs", icon: FileText },
  { name: "System Health", href: "/superadmin/health", icon: Activity },
  { name: "Settings", href: "/superadmin/settings", icon: Settings },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Omnibox Search Modal
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const u = getAuthUser();
    if (!u || u.role !== "SUPER_ADMIN") {
      router.replace("/login");
      return;
    }
    setCurrentUser(u);
  }, [router]);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await repsiApi.superAdminSearch(searchQuery.trim());
        setSearchResults(res || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = () => {
    logoutSession();
  };

  return (
    <div className="flex h-screen bg-[var(--surface)] text-[var(--text)] font-sans antialiased overflow-hidden">
      {/* ── Sidebar (Desktop) ────────────────────────────────────────────── */}
      <aside className="w-64 border-r border-[var(--border)] bg-[var(--surface)] hidden md:flex flex-col shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/30 shadow-inner">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs tracking-tight text-[var(--text)] block">REPSI Control Plane</span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold tracking-wider uppercase">Super Admin</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE
          </span>
        </div>

        {/* Omnibox Quick Search Trigger */}
        <div className="p-3 border-b border-[var(--border)]">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] text-xs transition-all"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span>Search platform...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border-strong)]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs scrollbar-thin scrollbar-thumb-zinc-800">
          {sidebarNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/superadmin/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                  isActive
                    ? "bg-purple-600 text-white font-semibold shadow-md shadow-purple-900/30 border border-purple-500/30"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text)]"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3.5 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs border border-purple-800/50">
              {currentUser?.name ? currentUser.name[0].toUpperCase() : "A"}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-xs text-[var(--text)] truncate">{currentUser?.name || "Super Admin"}</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">{currentUser?.email || "admin@repsi.com"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Sign out of Super Admin"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--surface)]">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">{children}</main>

        {/* ── Mobile Bottom Navigation Bar ──────────────────────────────── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[var(--surface)] border-t border-[var(--border)] flex items-center justify-around z-40 px-2 text-[10px] font-semibold text-[var(--text-muted)]">
          <Link
            href="/superadmin/dashboard"
            className={`flex flex-col items-center gap-1 ${pathname === "/superadmin/dashboard" ? "text-purple-600 dark:text-purple-400" : ""}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </Link>
          <Link
            href="/superadmin/gyms"
            className={`flex flex-col items-center gap-1 ${pathname.startsWith("/superadmin/gyms") ? "text-purple-600 dark:text-purple-400" : ""}`}
          >
            <Building2 className="w-4 h-4" />
            <span>Gyms</span>
          </Link>
          <Link
            href="/superadmin/members"
            className={`flex flex-col items-center gap-1 ${pathname.startsWith("/superadmin/members") ? "text-purple-600 dark:text-purple-400" : ""}`}
          >
            <Users className="w-4 h-4" />
            <span>Members</span>
          </Link>
          <Link
            href="/superadmin/subscriptions"
            className={`flex flex-col items-center gap-1 ${pathname.startsWith("/superadmin/subscriptions") ? "text-purple-600 dark:text-purple-400" : ""}`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Billing</span>
          </Link>
          <Link
            href="/superadmin/audit-logs"
            className={`flex flex-col items-center gap-1 ${pathname.startsWith("/superadmin/audit-logs") ? "text-purple-600 dark:text-purple-400" : ""}`}
          >
            <FileText className="w-4 h-4" />
            <span>Logs</span>
          </Link>
        </div>
      </div>

      {/* ── Global Omnibox Search Modal (⌘K) ──────────────────────────────── */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
              <Search className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gyms, members, trainers, owners across all tenants..."
                className="w-full bg-transparent text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[var(--border)] text-xs">
              {searchLoading ? (
                <div className="p-8 text-center text-[var(--text-muted)]">Searching global platform database...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <div
                    key={`${item.category}-${item.id}`}
                    onClick={() => {
                      setSearchOpen(false);
                      if (item.category === "gym") router.push(`/superadmin/gyms?q=${item.workspace_slug || item.title}`);
                      else if (item.category === "member") router.push(`/superadmin/members?q=${item.title}`);
                      else if (item.category === "trainer") router.push(`/superadmin/trainers?q=${item.title}`);
                      else router.push(`/superadmin/gyms`);
                    }}
                    className="p-3 hover:bg-[var(--surface-secondary)] rounded-xl cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[var(--surface-secondary)] text-[var(--text)] flex items-center justify-center font-bold">
                        {item.category === "gym" ? (
                          <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : item.category === "trainer" ? (
                          <Dumbbell className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[var(--text)] text-xs">{item.title}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{item.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--surface-secondary)] text-[var(--text)] border border-[var(--border-strong)]">
                        {item.badge}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[var(--text-disabled)] group-hover:text-[var(--text)] transition-colors" />
                    </div>
                  </div>
                ))
              ) : searchQuery.trim().length >= 2 ? (
                <div className="p-8 text-center text-[var(--text-muted)]">No matching records found across tenants.</div>
              ) : (
                <div className="p-8 text-center text-[var(--text-muted)]">
                  Type at least 2 characters to search across all gym tenants and global rosters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
