"use client";

import React, { useState } from "react";
import {
  Bell,
  Send,
  Radio,
  CheckCircle2,
  Users,
  Building2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { repsiApi } from "@/lib/api";

export default function SuperAdminNotificationsPage() {
  const [form, setForm] = useState({
    target_audience: "all_owners",
    subject: "",
    message: "",
  });
  const [sentSuccess, setSentSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSentSuccess(null);
    setSendError(null);
    try {
      const res = await repsiApi.broadcastSuperAdminAnnouncement(form);
      setSentSuccess(res?.message || "Broadcast delivered.");
      setForm({ target_audience: "all_owners", subject: "", message: "" });
    } catch (err: any) {
      setSendError(err.message || "Failed to broadcast announcement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">Broadcast Notifications & Alerts</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20">
              Platform Broadcast
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Publish high-priority system announcements, maintenance notices, and feature releases to gym owners.
          </p>
        </div>
      </div>

      {sentSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-3 text-xs">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{sentSuccess}</span>
        </div>
      )}
      {sendError && (
        <div role="alert" className="p-4 rounded-xl bg-[var(--error-soft)] border border-[var(--error)]/30 text-[var(--error-foreground)] text-xs">
          {sendError}
        </div>
      )}

      <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-5">
        <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
          <div>
            <label className="block text-[var(--text)] font-semibold mb-1">Target Audience</label>
            <select
              value={form.target_audience}
              onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-purple-500"
            >
              <option value="all_owners">All Gym Owners & Admins (Active & Trial)</option>
              <option value="active_owners">Paid Active Gym Owners Only</option>
              <option value="trial_owners">Trial Tier Owners (Upgrade Nudges)</option>
              <option value="all_users">Global User Base (Members + Trainers + Owners)</option>
            </select>
          </div>

          <div>
            <label className="block text-[var(--text)] font-semibold mb-1">Announcement Subject</label>
            <Input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. Scheduled Platform Upgrade & UPI Autopay Enhancement"
              className="bg-[var(--surface)] border-[var(--border)] text-xs text-[var(--text)]"
              required
            />
          </div>

          <div>
            <label className="block text-[var(--text)] font-semibold mb-1">Message Content</label>
            <textarea
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Write announcement body details here..."
              className="w-full p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-[var(--border)]">
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 text-xs"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Broadcast Announcement
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
