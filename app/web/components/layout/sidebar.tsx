"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  Dumbbell,
  Calendar,
  Banknote,
  Receipt,
  BarChart3,
  TrendingUp,
  Settings,
  HelpCircle,
  Bell,
  Activity,
  ChevronLeft,
  ChevronRight,
  Building2,
  ChevronDown,
  Wrench,
  QrCode,
  Navigation,
  MessageSquare,
  RefreshCw,
  BookOpen,
  Target,
  Globe,
  Megaphone,
  TicketPercent,
  LifeBuoy,
  FileText,
  Salad,
  ShieldAlert,
  BrainCircuit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getWorkspaceFromPath, slugToGymName } from "@/lib/workspace";
import { getAuthUser, AuthUser } from "@/lib/auth";
import { useEffect } from "react";
import { navLabelKey, useTranslation } from "@/lib/i18n";
import { RepsiWordmark } from "@/components/ui/repsi-wordmark";

// ─── Navigation Structure ─────────────────────────────────────────────────────

interface NavItemDef {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroupDef {
  title: string;
  items: NavItemDef[];
}

export type { NavGroupDef };

const ownerNavGroups: NavGroupDef[] = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "GROWTH & MARKETING",
    items: [
      { label: "CRM & Leads", path: "/crm", icon: Target },
      { label: "Website Builder", path: "/website", icon: Globe },
    ],
  },
  {
    title: "GYM MANAGEMENT",
    items: [
      { label: "Members", path: "/members", icon: Users },
      { label: "Memberships", path: "/memberships", icon: CreditCard },
      { label: "Attendance", path: "/attendance", icon: CalendarCheck },
      { label: "Trainers", path: "/trainers", icon: Dumbbell },
      { label: "Classes", path: "/classes", icon: Calendar },
      { label: "Payments", path: "/payments", icon: Banknote },
      { label: "Receipts & Day Close", path: "/payments/finance", icon: Receipt },
      { label: "Offers & Coupons", path: "/memberships/offers", icon: TicketPercent },
      { label: "Workouts", path: "/workouts", icon: Dumbbell },
      { label: "Diet Plans", path: "/nutrition", icon: Salad },
      { label: "Equipment", path: "/machines", icon: Wrench },
    ],
  },
  {
    title: "BUSINESS",
    items: [
      { label: "Reports", path: "/reports", icon: BarChart3 },
      { label: "AI Insights", path: "/insights", icon: BrainCircuit },
      { label: "Broadcasts", path: "/broadcasts", icon: Megaphone },
      { label: "Chat Reports", path: "/chat/reports", icon: ShieldAlert },
      { label: "Notifications", path: "/notifications", icon: Bell },
      { label: "Activity", path: "/activity", icon: Activity },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { label: "Gym Settings", path: "/settings", icon: Settings },
      { label: "Subscription & Billing", path: "/settings/billing", icon: CreditCard },
      { label: "Team & Roles", path: "/settings/team", icon: Users },
      { label: "Help & Support", path: "/settings/support", icon: LifeBuoy },
    ],
  },
];

const trainerNavGroups: NavGroupDef[] = [
  {
    title: "TRAINER PORTAL",
    items: [
      { label: "Dashboard", path: "/trainer/dashboard", icon: LayoutDashboard },
      { label: "Attendance & QR Pass", path: "/trainer/attendance", icon: QrCode },
      { label: "Clients", path: "/trainer/clients", icon: Users },
      { label: "Workouts", path: "/trainer/workouts", icon: Dumbbell },
      { label: "Diet Plans", path: "/trainer/nutrition", icon: Salad },
      { label: "Schedule", path: "/trainer/schedule", icon: Calendar },
      { label: "Classes", path: "/trainer/classes", icon: CalendarCheck },
      { label: "Messages", path: "/chat", icon: MessageSquare },
    ],
  },
];

const memberNavGroups: NavGroupDef[] = [
  {
    title: "FITNESS",
    items: [
      { label: "Dashboard", path: "/member/dashboard", icon: LayoutDashboard },
      { label: "Workout", path: "/member/workout", icon: Dumbbell },
      { label: "AI Coach", path: "/member/ai-coach", icon: BrainCircuit },
      { label: "Diet Plan", path: "/member/diet", icon: Salad },
      { label: "Exercise Library", path: "/member/exercises", icon: BookOpen },
      { label: "Progress", path: "/member/progress", icon: TrendingUp },
      { label: "Activity / Running", path: "/member/running", icon: Navigation },
      { label: "Trainer", path: "/member/trainer", icon: Users },
      { label: "Trainer Chat", path: "/chat", icon: MessageSquare },
      { label: "Digital QR Pass", path: "/member/qr", icon: QrCode },
      { label: "Book Classes", path: "/member/classes", icon: Calendar },
    ],
  },
  {
    title: "MEMBERSHIP",
    items: [
      { label: "My Membership", path: "/member/membership", icon: CreditCard },
      { label: "My Attendance", path: "/member/attendance", icon: CalendarCheck },
      { label: "My Payments", path: "/member/payments", icon: Banknote },
      { label: "My Documents", path: "/member/documents", icon: FileText },
    ],
  },
];

// Front-desk staff: day-to-day operations only (the API enforces each permission).
const staffNavGroups: NavGroupDef[] = [
  {
    title: "FRONT DESK",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Check-in", path: "/attendance", icon: CalendarCheck },
      { label: "Members", path: "/members", icon: Users },
      { label: "Memberships", path: "/memberships", icon: CreditCard },
      { label: "Classes", path: "/classes", icon: Calendar },
      { label: "Payments", path: "/payments", icon: Banknote },
      { label: "Receipts & Dues", path: "/payments/finance", icon: Receipt },
    ],
  },
];

const superAdminNavGroups: NavGroupDef[] = [
  {
    title: "Super Admin",
    items: [
      { label: "Platform Overview", path: "/superadmin/dashboard", icon: LayoutDashboard },
      { label: "Gym Management", path: "/superadmin/gyms", icon: Building2 },
      { label: "User Management", path: "/superadmin/users", icon: Users },
      { label: "Subscriptions", path: "/superadmin/subscriptions", icon: CreditCard },
      { label: "Audit Logs", path: "/superadmin/audit-logs", icon: Activity },
    ],
  },
];

// ─── REPSI Brand Header (Top Left) ────────────────────────────────────────────

function BrandHeader({ collapsed, workspace }: { collapsed: boolean; workspace: string }) {
  return (
    <Link
      href={`/${workspace}`}
      className={cn(
        "flex h-16 items-center border-b border-[var(--border)] transition-opacity hover:opacity-90",
        collapsed ? "justify-center px-2" : "px-4",
      )}
      aria-label="REPSI home"
    >
      <RepsiWordmark compact={collapsed} />
    </Link>
  );
}

// ─── Gym Selector ─────────────────────────────────────────────────────────────

function GymSelector({ collapsed, workspace }: { collapsed: boolean; workspace: string }) {
  const [gymName, setGymName] = useState(() => {
    const user = typeof window !== "undefined" ? getAuthUser() : null;
    if (user?.gymName) return user.gymName;
    if (workspace && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(workspace)) return slugToGymName(workspace);
    return "Apex Fitness";
  });
  const [displaySlug, setDisplaySlug] = useState(() => {
    const user = typeof window !== "undefined" ? getAuthUser() : null;
    if (user?.workspaceSlug && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(user.workspaceSlug)) return user.workspaceSlug;
    if (workspace && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(workspace)) return workspace;
    return "apex-fitness";
  });

  useEffect(() => {
    const user = getAuthUser();
    if (user?.gymName) setGymName(user.gymName);
    if (user?.workspaceSlug && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(user.workspaceSlug)) {
      setDisplaySlug(user.workspaceSlug);
    }
  }, [workspace]);

  if (collapsed) {
    return (
      <div className="mx-3 my-2.5">
        <button className="w-full flex items-center justify-center h-9 rounded-xl hover:bg-[var(--nav-hover-bg)] transition-colors">
          <Building2 className="h-4 w-4 text-[var(--primary-dark)]" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-3 my-3">
      <div className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-2xs hover:border-[var(--primary)]/40 transition-all">
        <div className="w-7 h-7 rounded-lg bg-[var(--primary-soft)] border border-[var(--primary)]/20 flex items-center justify-center flex-shrink-0">
          <Building2 className="h-4 w-4 text-[var(--primary-dark)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-[var(--text)] truncate leading-tight">
            {gymName}
          </div>
          <div className="text-[11px] font-medium text-[var(--primary-dark)] truncate leading-tight mt-0.5">
            repsi.app/{displaySlug}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavLink({
  item,
  collapsed,
  isActive,
  href,
}: {
  item: NavItemDef;
  collapsed: boolean;
  isActive: boolean;
  href: string;
}) {
  const Icon = item.icon;
  const { t } = useTranslation();
  const label = t(navLabelKey(item.label), item.label);

  const linkContent = (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all duration-150",
        isActive
          ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)] font-bold shadow-2xs"
          : "text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text)] font-medium",
        collapsed && "justify-center px-0"
      )}
    >
      {/* Active indicator bar */}
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[var(--primary)]" />
      )}
      <Icon
        className={cn(
          "flex-shrink-0 h-4 w-4",
          isActive
            ? "text-[var(--nav-active-text)]"
            : "text-[var(--text-muted)]"
        )}
      />
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

/** Primary navigation for a role (shared by the desktop sidebar and the mobile drawer). */
export function navGroupsForRole(role: string | null | undefined): NavGroupDef[] {
  if (role === "SUPER_ADMIN") return superAdminNavGroups;
  if (role === "TRAINER") return trainerNavGroups;
  if (role === "STAFF") return staffNavGroups;
  if (role === "USER") return memberNavGroups;
  return ownerNavGroups;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const workspace = getWorkspaceFromPath(pathname);

  useEffect(() => {
    setUser(getAuthUser());
  }, []);

  const role = user?.role || "OWNER";
  const activeNavGroups = navGroupsForRole(role);

  const secondaryNav: NavItemDef[] = role === "SUPER_ADMIN"
    ? [
        { label: "Settings", path: "/superadmin/settings", icon: Settings },
      ]
    : role === "TRAINER"
    ? [
        { label: "Notifications", path: "/notifications", icon: Bell },
        { label: "My Profile", path: "/trainer/profile", icon: Settings },
      ]
    : role === "USER"
    ? [
        { label: "Notifications", path: "/notifications", icon: Bell },
        { label: "My Profile", path: "/member/profile", icon: Settings },
      ]
    : role === "OWNER"
    ? []
    : [
        { label: "Notifications", path: "/notifications", icon: Bell },
        { label: "Activity", path: "/activity", icon: Activity },
        { label: "Settings", path: "/settings", icon: Settings },
      ];

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "relative flex flex-col border-r border-[var(--border)] bg-[var(--sidebar)] transition-all duration-200 ease-in-out",
          collapsed ? "w-[72px]" : "w-[240px]"
        )}
      >
        {/* REPSI Brand (Top Left) */}
        <BrandHeader collapsed={collapsed} workspace={workspace} />

        {/* Gym Selector */}
        <GymSelector collapsed={collapsed} workspace={workspace} />

        {/* Separator */}
        <div className="mx-3 my-1 h-px bg-[var(--border)]" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
          {activeNavGroups.map((group) => (
            <div key={group.title} className="mb-4">
              {!collapsed && (
                <div className="px-3 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    {t(navLabelKey(group.title), group.title)}
                  </span>
                </div>
              )}
              {group.items.map((item) => {
                const href = item.path.startsWith("/superadmin") ? item.path : `/${workspace}${item.path}`;
                const isActive =
                  item.path === "/dashboard"
                    ? pathname === href || pathname === `/${workspace}`
                    : pathname.startsWith(href);

                return (
                  <NavLink
                    key={item.path}
                    item={item}
                    collapsed={collapsed}
                    isActive={isActive}
                    href={href}
                  />
                );
              })}
            </div>
          ))}
        </nav>

        {/* Secondary Navigation */}
        {secondaryNav.length > 0 && (
          <>
            <div className="mx-3 my-1 h-px bg-[var(--border)]" />
            <div className="py-2 px-3 space-y-0.5">
              {secondaryNav.map((item) => {
                const href = item.path.startsWith("/superadmin") ? item.path : `/${workspace}${item.path}`;
                const isActive = pathname.startsWith(href);
                return (
                  <NavLink
                    key={item.path}
                    item={item}
                    collapsed={collapsed}
                    isActive={isActive}
                    href={href}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute -right-3 top-[72px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] shadow-[var(--shadow-sm)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text)] transition-colors"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>
    </TooltipProvider>
  );
}
