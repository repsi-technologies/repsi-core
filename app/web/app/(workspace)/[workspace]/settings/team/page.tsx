"use client";

import { useEffect, useState } from "react";
import { TeamSection } from "@/features/settings/organization-settings";
import { getAuthUser } from "@/lib/auth";

/** Staff directory, roles, branch access and per-person permissions (same data as Gym Settings → Team). */
export default function TeamSettingsPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole((getAuthUser()?.role || "USER").toUpperCase());
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Team &amp; roles</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Invite staff and trainers, set roles and branch access, adjust individual permissions, and deactivate accounts.
          Changes are recorded in the Activity log.
        </p>
      </div>
      {role && <TeamSection role={role} />}
    </div>
  );
}
