"use client";

import React, { useState } from "react";
import {
  Settings,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Save,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuperAdminSettingsPage() {
  const [flags, setFlags] = useState({
    maintenanceMode: false,
    cashfreeAutopay: true,
    biometricDirectSync: true,
    strictTenantIsolation: true,
    allowPublicRegistrations: true,
  });
  const [saved, setSaved] = useState(false);

  const toggleFlag = (key: keyof typeof flags) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">Super Admin Platform Settings</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20">
              Governance
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Global feature flags, platform security constraints, and maintenance toggles.
          </p>
        </div>

        <Button onClick={handleSave} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs">
          <Save className="h-4 w-4" />
          Save Configurations
        </Button>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Platform configuration changes successfully saved and applied.
        </div>
      )}

      <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-5 text-xs">
        <h2 className="text-sm font-bold text-[var(--text)] mb-2">Global Feature Flags & Kill Switches</h2>

        <div className="divide-y divide-[var(--border)]">
          <div className="py-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-[var(--text)]">Strict Multi-Tenant Isolation Enforcement</p>
              <p className="text-[var(--text-muted)] text-[11px]">Enforces database-level tenant constraints on all queries.</p>
            </div>
            <button
              onClick={() => toggleFlag("strictTenantIsolation")}
              className="text-purple-600 dark:text-purple-400 focus:outline-none"
            >
              {flags.strictTenantIsolation ? <ToggleRight className="h-6 w-6 text-purple-500" /> : <ToggleLeft className="h-6 w-6 text-[var(--text-disabled)]" />}
            </button>
          </div>

          <div className="py-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-[var(--text)]">Cashfree UPI Autopay & Recurring Billing</p>
              <p className="text-[var(--text-muted)] text-[11px]">Enables automatic subscription renewals for gym tenants.</p>
            </div>
            <button
              onClick={() => toggleFlag("cashfreeAutopay")}
              className="text-purple-600 dark:text-purple-400 focus:outline-none"
            >
              {flags.cashfreeAutopay ? <ToggleRight className="h-6 w-6 text-purple-500" /> : <ToggleLeft className="h-6 w-6 text-[var(--text-disabled)]" />}
            </button>
          </div>

          <div className="py-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-[var(--text)]">Biometric Turnstile Direct Sync Stream</p>
              <p className="text-[var(--text-muted)] text-[11px]">Live WebSocket sync with Hikvision & eSSL hardware.</p>
            </div>
            <button
              onClick={() => toggleFlag("biometricDirectSync")}
              className="text-purple-600 dark:text-purple-400 focus:outline-none"
            >
              {flags.biometricDirectSync ? <ToggleRight className="h-6 w-6 text-purple-500" /> : <ToggleLeft className="h-6 w-6 text-[var(--text-disabled)]" />}
            </button>
          </div>

          <div className="py-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-[var(--text)]">Platform Maintenance Mode</p>
              <p className="text-[var(--text-muted)] text-[11px]">Displays maintenance banner and blocks non-superadmin mutations.</p>
            </div>
            <button
              onClick={() => toggleFlag("maintenanceMode")}
              className="text-purple-600 dark:text-purple-400 focus:outline-none"
            >
              {flags.maintenanceMode ? <ToggleRight className="h-6 w-6 text-rose-500" /> : <ToggleLeft className="h-6 w-6 text-[var(--text-disabled)]" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
