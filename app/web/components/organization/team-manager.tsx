"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Mail, RefreshCw, Send, UserX, Users, X } from "lucide-react";
import type { CountryCode } from "libphonenumber-js/min";

import { PhoneInput } from "@/components/ui/phone-input";
import { FormAlert, FormField, PrimaryButton, SecondaryButton, SelectInput, TextInput } from "@/components/organization/form-fields";
import { PermissionEditor } from "@/components/organization/permission-editor";
import { ApiError, orgApi, type Branch, type Invitation, type TeamMember } from "@/lib/auth-client";
import { isValidPhone, splitPhone } from "@/lib/countries";
import { cn } from "@/lib/utils";

const INVITE_ROLES: { value: Invitation["role"]; label: string; hint: string; minRole: "MANAGER" | "ADMIN" | "OWNER" }[] = [
  { value: "trainer", label: "Trainer", hint: "Clients, workouts and schedules", minRole: "MANAGER" },
  { value: "staff", label: "Front desk / staff", hint: "Check-ins, members and payments", minRole: "MANAGER" },
  { value: "member", label: "Member", hint: "Member app access", minRole: "MANAGER" },
  { value: "manager", label: "Branch manager", hint: "Runs assigned branches", minRole: "ADMIN" },
  { value: "admin", label: "Admin", hint: "Full organization access", minRole: "OWNER" },
];

const TEAM_ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "STAFF", label: "Staff" },
  { value: "TRAINER", label: "Trainer" },
];

const RANK: Record<string, number> = { SUPER_ADMIN: 3, OWNER: 3, ADMIN: 2, MANAGER: 1 };

const STATUS_STYLE: Record<Invitation["status"], string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-800 border-emerald-200",
  expired: "bg-[var(--background)] text-[var(--text-muted)] border-[var(--border)]",
  revoked: "bg-[var(--background)] text-[var(--text-muted)] border-[var(--border)]",
};

function BranchPicker({
  branches,
  value,
  onChange,
  idPrefix,
  disabled,
}: {
  branches: Branch[];
  value: string[];
  onChange: (ids: string[]) => void;
  idPrefix: string;
  disabled?: boolean;
}) {
  if (branches.length === 0) return <p className="text-sm text-[var(--text-muted)]">No branches yet.</p>;
  const all = value.length === 0;
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Branch access">
      <button type="button" disabled={disabled} onClick={() => onChange([])} aria-pressed={all}
        className={cn("h-8 rounded-full border px-3 text-xs font-medium transition-colors",
          all ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]" : "border-[var(--border)] hover:bg-[var(--surface-hover)]")}>
        All branches
      </button>
      {branches.map((b) => {
        const on = value.includes(b.id);
        return (
          <button key={b.id} id={`${idPrefix}-${b.id}`} type="button" disabled={disabled} aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== b.id) : [...value, b.id])}
            className={cn("h-8 rounded-full border px-3 text-xs font-medium transition-colors",
              on ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-dark)]" : "border-[var(--border)] hover:bg-[var(--surface-hover)]")}>
            {b.name}
          </button>
        );
      })}
    </div>
  );
}

interface Props {
  myRole: string;
  branches: Branch[];
  showMembers?: boolean;
  defaultCountry?: string | null;
}

export function TeamManager({ myRole, branches, showMembers = true, defaultCountry }: Props) {
  const canManage = RANK[myRole] >= 2;
  const canInvite = RANK[myRole] >= 1;
  const [invites, setInvites] = useState<Invitation[] | null>(null);
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "", phone_country: defaultCountry || "IN", role: "trainer" as Invitation["role"], branch_ids: [] as string[] });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const [inv, team] = await Promise.all([
        canInvite ? orgApi.invitations() : Promise.resolve([]),
        showMembers ? orgApi.team() : Promise.resolve([]),
      ]);
      setInvites(inv);
      setMembers(team);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load your team.");
      setInvites([]);
      setMembers([]);
    }
  }, [canInvite, showMembers]);

  useEffect(() => {
    load();
  }, [load]);

  const roleOptions = INVITE_ROLES.filter((r) => RANK[myRole] >= RANK[r.minRole]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Enter their name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = "Enter a valid email.";
    if (form.phone && !isValidPhone(form.phone, form.phone_country as CountryCode)) errs.phone = "Enter a valid phone number.";
    setFormErrors(errs);
    if (Object.keys(errs).length) return;
    setSending(true);
    setError("");
    setNotice("");
    try {
      await orgApi.invite({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone ? splitPhone(form.phone, form.phone_country as CountryCode).national : undefined,
        phone_country: form.phone_country,
        role: form.role,
        branch_ids: form.branch_ids,
      });
      setNotice(`Invitation emailed to ${form.email.trim()}.`);
      setForm((f) => ({ ...f, name: "", email: "", phone: "" }));
      await load();
    } catch (err) {
      const api = err instanceof ApiError ? err : null;
      setFormErrors(api?.fieldErrors || {});
      setError(api?.message || "Couldn't send the invitation.");
    } finally {
      setSending(false);
    }
  }

  async function act(id: string, fn: () => Promise<unknown>, success: string) {
    setBusy(id);
    setError("");
    setNotice("");
    try {
      await fn();
      setNotice(success);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  const branchName = (id: string) => branches.find((b) => b.id === id)?.name || "Removed branch";

  return (
    <div className="space-y-6">
      {error && <FormAlert>{error}</FormAlert>}
      {notice && <FormAlert kind="success">{notice}</FormAlert>}

      {canInvite && (
        <form onSubmit={sendInvite} noValidate className="space-y-4 rounded-[12px] border border-[var(--border)] p-4 sm:p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Send className="h-4 w-4 text-[var(--primary)]" aria-hidden /> Invite someone</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="inv-name" label="Name" required error={formErrors.name}>
              <TextInput id="inv-name" value={form.name} invalid={Boolean(formErrors.name)} autoComplete="off"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </FormField>
            <FormField id="inv-email" label="Email" required error={formErrors.email}>
              <TextInput id="inv-email" type="email" value={form.email} invalid={Boolean(formErrors.email)} autoComplete="off"
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </FormField>
            <FormField id="inv-role" label="Role" required>
              <SelectInput id="inv-role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Invitation["role"] }))}>
                {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label} — {r.hint}</option>)}
              </SelectInput>
            </FormField>
            <FormField id="inv-phone" label="Mobile" error={formErrors.phone}>
              <PhoneInput id="inv-phone" value={form.phone} error={Boolean(formErrors.phone)} defaultCountry={form.phone_country}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))} onCountryChange={(c) => setForm((f) => ({ ...f, phone_country: c.code }))} />
            </FormField>
          </div>
          {form.role !== "admin" && form.role !== "member" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Branch access</p>
              <BranchPicker idPrefix="inv-branch" branches={branches} value={form.branch_ids}
                onChange={(ids) => setForm((f) => ({ ...f, branch_ids: ids }))} />
            </div>
          )}
          <div className="flex justify-end">
            <PrimaryButton type="submit" loading={sending}><Mail className="h-4 w-4" aria-hidden /> Send invitation</PrimaryButton>
          </div>
        </form>
      )}

      {canInvite && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Invitations</h3>
          {invites === null ? (
            <div className="h-16 animate-pulse rounded-[12px] bg-[var(--background)]" />
          ) : invites.length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              No invitations sent yet.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)] rounded-[12px] border border-[var(--border)]">
              {invites.map((inv) => (
                <li key={inv.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{inv.name} <span className="font-normal text-[var(--text-muted)]">· {inv.email}</span></p>
                    <p className="text-xs text-[var(--text-muted)]">
                      <span className="capitalize">{inv.role}</span> ·{" "}
                      {inv.branch_ids.length ? inv.branch_ids.map(branchName).join(", ") : "All branches"} ·{" "}
                      {inv.status === "pending" ? `expires ${new Date(inv.expires_at).toLocaleDateString()}` : new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium capitalize", STATUS_STYLE[inv.status])}>{inv.status}</span>
                    {(inv.status === "pending" || inv.status === "expired") && (
                      <button type="button" disabled={busy === inv.id} onClick={() => act(inv.id, () => orgApi.resendInvitation(inv.id), `Invitation re-sent to ${inv.email}.`)}
                        className="inline-flex h-8 items-center gap-1 rounded-[8px] px-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-50">
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Resend
                      </button>
                    )}
                    {inv.status === "pending" && (
                      <button type="button" disabled={busy === inv.id} onClick={() => act(inv.id, () => orgApi.revokeInvitation(inv.id), "Invitation cancelled.")}
                        className="inline-flex h-8 items-center gap-1 rounded-[8px] px-2 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                        <X className="h-3.5 w-3.5" aria-hidden /> Cancel
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showMembers && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Team members</h3>
          {members === null ? (
            <div className="h-16 animate-pulse rounded-[12px] bg-[var(--background)]" />
          ) : members.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[var(--border)] px-4 py-8 text-center">
              <Users className="mx-auto h-7 w-7 text-[var(--text-muted)]" aria-hidden />
              <p className="mt-2 text-sm text-[var(--text-muted)]">No team members yet. Invite trainers and staff above.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {members.map((m) => (
                <MemberRow key={m.id} member={m} branches={branches} canManage={canManage && m.role !== "OWNER" && !m.is_self && (myRole !== "ADMIN" || m.role !== "ADMIN")}
                  myRole={myRole} busy={busy === m.id}
                  onSave={(data, msg) => act(m.id, () => orgApi.updateTeamMember(m.id, data), msg)} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function MemberRow({
  member,
  branches,
  canManage,
  myRole,
  busy,
  onSave,
}: {
  member: TeamMember;
  branches: Branch[];
  canManage: boolean;
  myRole: string;
  busy: boolean;
  onSave: (data: { role?: string; branch_ids?: string[]; is_active?: boolean }, msg: string) => void;
}) {
  const [role, setRole] = useState(member.role);
  const [ids, setIds] = useState(member.branch_ids);
  const [showPermissions, setShowPermissions] = useState(false);
  useEffect(() => {
    setRole(member.role);
    setIds(member.branch_ids);
  }, [member]);
  const dirty = role !== member.role || ids.slice().sort().join() !== member.branch_ids.slice().sort().join();
  const orgWide = role === "OWNER" || role === "ADMIN";

  return (
    <li className={cn("rounded-[12px] border border-[var(--border)] p-4", !member.is_active && "opacity-60")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {member.full_name} {member.is_self && <span className="text-xs font-normal text-[var(--text-muted)]">(you)</span>}
            {!member.is_active && <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">· deactivated</span>}
          </p>
          <p className="truncate text-xs text-[var(--text-muted)]">{member.email}</p>
        </div>
        {canManage ? (
          <SelectInput aria-label={`Role for ${member.full_name}`} value={role} onChange={(e) => setRole(e.target.value)} className="h-9 sm:w-40">
            {TEAM_ROLES.filter((r) => r.value !== "ADMIN" || myRole === "OWNER" || myRole === "SUPER_ADMIN").map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </SelectInput>
        ) : (
          <span className="w-fit rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs font-medium capitalize">{member.role.toLowerCase()}</span>
        )}
      </div>
      <div className="mt-3">
        {orgWide ? (
          <p className="text-xs text-[var(--text-muted)]">Access to all branches</p>
        ) : canManage ? (
          <BranchPicker idPrefix={`m-${member.id}`} branches={branches} value={ids} onChange={setIds} />
        ) : (
          <p className="text-xs text-[var(--text-muted)]">
            {member.all_branches ? "All branches" : member.branch_ids.map((id) => branches.find((b) => b.id === id)?.name).filter(Boolean).join(", ")}
          </p>
        )}
      </div>
      {canManage && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <SecondaryButton type="button" className="h-8 px-3 text-xs" aria-expanded={showPermissions}
            onClick={() => setShowPermissions((v) => !v)}>
            <KeyRound className="h-3.5 w-3.5" aria-hidden /> Permissions
          </SecondaryButton>
          <SecondaryButton type="button" disabled={busy} className="h-8 px-3 text-xs"
            onClick={() => {
              if (member.is_active && !confirm(`Deactivate ${member.full_name}? They lose access immediately. Their history, assigned members and attendance records are kept.`)) return;
              onSave({ is_active: !member.is_active }, member.is_active ? `${member.full_name} deactivated.` : `${member.full_name} reactivated.`);
            }}>
            <UserX className="h-3.5 w-3.5" aria-hidden /> {member.is_active ? "Deactivate" : "Reactivate"}
          </SecondaryButton>
          <PrimaryButton type="button" disabled={!dirty} loading={busy} className="h-8 px-3 text-xs"
            onClick={() => onSave({ role, branch_ids: orgWide ? [] : ids }, `Access updated for ${member.full_name}.`)}>
            Save access
          </PrimaryButton>
        </div>
      )}
      {canManage && showPermissions && <PermissionEditor memberId={member.id} onClose={() => setShowPermissions(false)} />}
    </li>
  );
}
