"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Building2, 
  Users, 
  Shield, 
  CreditCard, 
  Bell, 
  Lock, 
  Sliders, 
  CheckCircle2, 
  Save,
  AlertTriangle,
  AlertCircle,
  Trash2,
  X,
  Loader2,
  Calendar,
  Clock,
  Info,
  Sparkles,
  MapPin,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { accountPathForRole, slugToGymName } from "@/lib/workspace";
import { repsiApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { PaymentSettingsTab } from "@/features/settings/payment-settings-tab";
import {
  BranchesSection,
  BusinessProfileSection,
  HoursSection,
  ProfileSection,
  TeamSection,
} from "@/features/settings/organization-settings";
import { getAuthUser } from "@/lib/auth";
import { AppearanceSection } from "@/features/settings/account-settings";

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const workspace = (params.workspace as string) || "apex-fitness";
  const defaultName = slugToGymName(workspace);

  const [activeTab, setActiveTab] = useState("business");
  const [myRole, setMyRole] = useState("USER");

  // Deep links such as ?tab=team, and the signed-in role for permission-aware sections.
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab) setActiveTab(tab);
    const role = (getAuthUser()?.role || "USER").toUpperCase();
    // Gym settings are for the business; members and trainers have their own profile page.
    if (role === "USER" || role === "TRAINER") {
      router.replace(`/${workspace}${accountPathForRole(role)}`);
      return;
    }
    setMyRole(role);
  }, [router, workspace]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Deregistration states
  const [showDeregisterModal, setShowDeregisterModal] = useState(false);
  const [confirmGymName, setConfirmGymName] = useState("");
  const [deregisterReason, setDeregisterReason] = useState("");
  const [deregisterLoading, setDeregisterLoading] = useState(false);
  const [deregisterError, setDeregisterError] = useState("");

  // Gym profile & rename states
  const [initialName, setInitialName] = useState(defaultName);
  const [gymProfile, setGymProfile] = useState({
    name: defaultName,
    phone: "+91 98450 11223",
    email: `contact@${workspace}.in`,
    address: "100 Feet Road, Indiranagar",
    city: "Bangalore",
    currency: "INR (₹)",
    timezone: "Asia/Kolkata (IST)",
  });

  const [renameEligibility, setRenameEligibility] = useState<{
    can_rename: boolean;
    cooldown_days: number;
    last_name_changed_at: string | null;
    next_available_change_at: string | null;
    days_remaining: number;
    hours_remaining: number;
    message: string;
  }>({
    can_rename: true,
    cooldown_days: 30,
    last_name_changed_at: null,
    next_available_change_at: null,
    days_remaining: 0,
    hours_remaining: 0,
    message: "You can change your gym name once every 30 days.",
  });

  const [nameCheck, setNameCheck] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string | null;
    status: string | null;
  }>({
    checking: false,
    available: null,
    message: null,
    status: null,
  });

  const checkDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load real workspace and rename eligibility
  useEffect(() => {
    async function loadWorkspaceSettings() {
      try {
        const [wsData, elig] = await Promise.all([
          repsiApi.getWorkspace(workspace).catch(() => null),
          repsiApi.getRenameEligibility(workspace).catch(() => null),
        ]);

        if (wsData) {
          const wsName = wsData.name || defaultName;
          setInitialName(wsName);
          setGymProfile((prev) => ({
            ...prev,
            name: wsName,
            phone: wsData.phone || prev.phone,
            email: wsData.email || prev.email,
            address: wsData.address || prev.address,
            city: wsData.city || prev.city,
          }));
        }

        if (elig) {
          setRenameEligibility(elig);
        }
      } catch (err) {
        console.warn("Using default workspace settings", err);
      }
    }
    loadWorkspaceSettings();
  }, [workspace]);

  // Handle typing with debounced name check
  const handleNameChange = (val: string) => {
    setGymProfile((prev) => ({ ...prev, name: val }));
    setSaveError("");

    if (checkDebounceRef.current) {
      clearTimeout(checkDebounceRef.current);
    }

    const trimmed = val.trim();
    if (!trimmed || trimmed.toLowerCase() === initialName.trim().toLowerCase()) {
      setNameCheck({
        checking: false,
        available: true,
        message: trimmed ? "This is your current gym name." : null,
        status: "CURRENT",
      });
      return;
    }

    setNameCheck({ checking: true, available: null, message: "Checking availability...", status: "CHECKING" });

    checkDebounceRef.current = setTimeout(async () => {
      try {
        const res = await repsiApi.checkWorkspaceName(trimmed, workspace);
        setNameCheck({
          checking: false,
          available: res.available,
          message: res.message,
          status: res.status,
        });
      } catch (err: any) {
        setNameCheck({
          checking: false,
          available: false,
          message: err.message || "Failed to check name",
          status: "ERROR",
        });
      }
    }, 450);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");

    try {
      const nameChanged = gymProfile.name.trim().toLowerCase() !== initialName.trim().toLowerCase();

      // If name changed, rename workspace with 30-day cooldown & moderation
      if (nameChanged) {
        if (!renameEligibility.can_rename) {
          throw new Error(renameEligibility.message || "Gym name changes are on a 30-day cooldown.");
        }
        if (nameCheck.available === false) {
          throw new Error(nameCheck.message || "Gym name is not available or violates moderation policy.");
        }
        const renameRes = await repsiApi.renameWorkspace(gymProfile.name.trim(), workspace);
        setInitialName(renameRes.name);
        if (renameRes.eligibility) {
          setRenameEligibility(renameRes.eligibility);
        }
      }

      // Update remaining general fields (phone, email, address, city)
      await repsiApi.updateWorkspace(workspace, {
        phone: gymProfile.phone,
        email: gymProfile.email,
        address: gymProfile.address,
        city: gymProfile.city,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save settings. Please verify inputs.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeregisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeregisterError("");

    if (confirmGymName.trim().toLowerCase() !== gymProfile.name.trim().toLowerCase()) {
      setDeregisterError(`Please type "${gymProfile.name}" exactly to confirm deregistration.`);
      return;
    }

    setDeregisterLoading(true);
    try {
      await repsiApi.deregisterWorkspace(confirmGymName.trim(), deregisterReason.trim());
      // Clear auth tokens
      if (typeof window !== "undefined") {
        localStorage.removeItem("repsi_auth_token");
        localStorage.removeItem("repsi_user_role");
        localStorage.removeItem("repsi_workspace_slug");
        document.cookie = "repsi_session=; path=/; max-age=0;";
      }
      alert(`Gym workspace "${gymProfile.name}" has been successfully deregistered. All active access has been closed.`);
      window.location.href = "/";
    } catch (err: any) {
      setDeregisterError(err.message || "Failed to deregister workspace. Verify you are the owner.");
      setDeregisterLoading(false);
    }
  };

  const navItems = [
    { id: "business", label: "Business Profile", icon: Building2 },
    { id: "hours", label: "Hours & Preferences", icon: Clock },
    { id: "branches", label: "Branches", icon: MapPin },
    { id: "team", label: "Team & Access", icon: Users },
    { id: "payments", label: "Payments & Collections", icon: CreditCard },
    { id: "profile", label: "My Profile & Sign-in", icon: UserCircle },
    { id: "appearance", label: "Appearance & Language", icon: Sliders },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Gym Workspace Settings</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Configure operations, staff access, automated reminders, and tax parameters for /{workspace}.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation Sidebar */}
        <div className="w-full md:w-60 flex-shrink-0 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            const isDanger = item.id === "danger";
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  active
                    ? isDanger
                      ? "text-rose-500 font-semibold"
                      : "text-[var(--primary-dark)] dark:text-[var(--primary-hover)] font-semibold"
                    : isDanger
                    ? "text-rose-400 hover:bg-rose-500/10"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="settingsNavActiveIndicator"
                    className={`absolute inset-0 rounded-lg ${
                      isDanger ? "bg-rose-500/15" : "bg-[var(--primary-soft)]"
                    }`}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4 flex-shrink-0" />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Panel */}
        <div className="flex-1 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {activeTab === "business" && <BusinessProfileSection />}
              {activeTab === "hours" && <HoursSection />}
              {activeTab === "branches" && <BranchesSection />}
              {activeTab === "profile" && <ProfileSection />}
              {activeTab === "appearance" && <AppearanceSection />}
          {activeTab === "payments" && (
            <PaymentSettingsTab />
          )}

          {activeTab === "team" && <TeamSection role={myRole} />}

          {activeTab === "danger" && (
            <Card className="border-rose-500/40 bg-rose-500/5">
              <CardHeader>
                <div className="flex items-center gap-2 text-rose-500">
                  <AlertTriangle className="h-5 w-5" />
                  <CardTitle className="text-base font-bold text-rose-500">Danger Zone — Deregister Gym</CardTitle>
                </div>
                <CardDescription className="text-zinc-400">
                  Permanently deregister your gym workspace from the REPSI platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="p-4 rounded-lg bg-zinc-900 border border-rose-500/30 text-xs space-y-2 text-zinc-300">
                  <p className="font-semibold text-rose-400">What happens when you deregister:</p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400">
                    <li>Your gym workspace (/{workspace}) is immediately deactivated and hidden from public access.</li>
                    <li>Active subscriptions will be marked as Cancelled without automated renewals or future charges.</li>
                    <li>Staff, trainers, and members will no longer be able to log in to this workspace.</li>
                    <li>All historical member records, financial ledgers, and attendance history remain securely archived and intact for legal records.</li>
                  </ul>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="destructive"
                    className="bg-rose-600 hover:bg-rose-700 text-[var(--primary-foreground)] font-semibold text-xs gap-2"
                    onClick={() => {
                      setConfirmGymName("");
                      setDeregisterReason("");
                      setDeregisterError("");
                      setShowDeregisterModal(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Deregister Gym Workspace
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Deregister Confirmation Modal */}
      <AnimatePresence>
        {showDeregisterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-950 rounded-2xl border border-rose-500/40 p-6 max-w-lg w-full shadow-2xl space-y-5 text-zinc-100"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-rose-500">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-bold text-base">Deregister &quot;{gymProfile.name}&quot;</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeregisterModal(false)}
                  className="text-zinc-400 hover:text-white transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-zinc-300">
                <p className="text-rose-400 font-semibold">
                  This action will immediately close your gym operations and cancel your active subscription.
                </p>
                <p>
                  To confirm you are the authorized owner, please type your gym name{" "}
                  <span className="font-bold font-mono text-white bg-zinc-800 px-1.5 py-0.5 rounded">
                    {gymProfile.name}
                  </span>{" "}
                  in the box below:
                </p>
              </div>

              <form onSubmit={handleDeregisterSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="confirmNameInput" className="text-xs text-zinc-300">
                    Confirmation Gym Name
                  </Label>
                  <Input
                    id="confirmNameInput"
                    value={confirmGymName}
                    onChange={(e) => setConfirmGymName(e.target.value)}
                    placeholder={gymProfile.name}
                    className="bg-zinc-900 border-zinc-700 text-white font-mono text-sm focus:border-rose-500"
                    autoFocus
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reasonInput" className="text-xs text-zinc-300">
                    Reason for closure (optional)
                  </Label>
                  <Input
                    id="reasonInput"
                    value={deregisterReason}
                    onChange={(e) => setDeregisterReason(e.target.value)}
                    placeholder="e.g. Relocating, closing branch, moving software"
                    className="bg-zinc-900 border-zinc-700 text-white text-xs"
                  />
                </div>

                {deregisterError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-medium">
                    {deregisterError}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDeregisterModal(false)}
                    disabled={deregisterLoading}
                    className="flex-1 bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={deregisterLoading || !confirmGymName.trim()}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-[var(--primary-foreground)] text-xs font-semibold gap-1.5"
                  >
                    {deregisterLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Closing Gym...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        Confirm Deregistration
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
