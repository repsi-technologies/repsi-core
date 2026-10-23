"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  Search,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Ticket {
  id: string;
  gym_name: string;
  gym_slug: string;
  subject: string;
  category: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  created_at: string;
}

const initialTickets: Ticket[] = [
  {
    id: "REP-1042",
    gym_name: "IronCore Athletic Lab",
    gym_slug: "ironcore",
    subject: "Cashfree Webhook Retry & Auto-debit alignment",
    category: "Billing / Gateway",
    priority: "HIGH",
    status: "OPEN",
    created_at: "18 minutes ago",
  },
  {
    id: "REP-1041",
    gym_name: "Apex Fitness Club",
    gym_slug: "apex-fitness",
    subject: "Biometric Hikvision gate sync timeout assistance",
    category: "Hardware / Turnstile",
    priority: "HIGH",
    status: "IN_PROGRESS",
    created_at: "2 hours ago",
  },
  {
    id: "REP-1039",
    gym_name: "Volt CrossFit Arena",
    gym_slug: "volt-crossfit",
    subject: "Custom domain CNAME configuration verification",
    category: "Website Builder",
    priority: "LOW",
    status: "RESOLVED",
    created_at: "1 day ago",
  },
];

export default function SuperAdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);

  const handleResolve = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "RESOLVED" } : t))
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">Super Admin Support Center</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20">
              Tenant Assistance
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Resolve owner escalations, gateway sync tickets, and direct tenant support inquiries.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xl">
        <table className="w-full text-xs">
          <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] font-semibold uppercase text-[10px] tracking-wider sticky top-0">
            <tr>
              <th className="py-3.5 px-4 text-left">Ticket ID</th>
              <th className="py-3.5 px-4 text-left">Gym Organization</th>
              <th className="py-3.5 px-4 text-left">Subject / Issue</th>
              <th className="py-3.5 px-4 text-left">Category</th>
              <th className="py-3.5 px-4 text-left">Priority</th>
              <th className="py-3.5 px-4 text-left">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-[var(--surface-secondary)] transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-[var(--text)] text-[11px]">{t.id}</td>
                <td className="py-3.5 px-4">
                  <p className="font-semibold text-[var(--text)]">{t.gym_name}</p>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono">/{t.gym_slug}</p>
                </td>
                <td className="py-3.5 px-4 text-[var(--text)] font-medium max-w-xs truncate">{t.subject}</td>
                <td className="py-3.5 px-4 text-[var(--text-muted)]">{t.category}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                      t.priority === "HIGH"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {t.priority}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                      t.status === "RESOLVED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : t.status === "IN_PROGRESS"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  {t.status !== "RESOLVED" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(t.id)}
                      className="text-xs bg-[var(--surface)] border-[var(--border-strong)] hover:bg-[var(--primary-hover)] hover:text-[var(--text)]"
                    >
                      Mark Resolved
                    </Button>
                  ) : (
                    <span className="text-[11px] text-[var(--text-muted)] font-medium">Completed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
