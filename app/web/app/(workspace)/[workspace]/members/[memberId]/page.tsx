"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  CalendarCheck,
  CreditCard,
  Edit,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, getInitials } from "@/lib/utils";
import { repsiApi, type ApiMembership, type ApiMemberPersonalAttendance } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import {
  ACCOUNT_STATUS_META,
  HistoryPanel,
  MemberStatusDialog,
  MembershipsPanel,
  NotesPanel,
  PaymentsPanel,
} from "@/features/members/member-record-panels";

const MODERATOR_ROLES = ["OWNER", "ADMIN", "SUPER_ADMIN"];

function whatsappHref(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}`;
}

export default function WorkspaceMemberProfilePage(props: {
  params: Promise<{ workspace: string; memberId: string }>;
}) {
  const params = use(props.params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "overview";

  const workspace = params.workspace;
  const memberId = params.memberId;

  const [member, setMember] = useState<any>(null);
  const [memberships, setMemberships] = useState<ApiMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<ReturnType<typeof getAuthUser>>(null);

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    emergency_contact: "",
  });

  const [attendance, setAttendance] = useState<ApiMemberPersonalAttendance | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const loadMember = useCallback(async () => {
    setError(null);
    try {
      const [data, periods] = await Promise.all([
        repsiApi.getMember(memberId),
        repsiApi.getMemberMemberships(memberId).catch(() => [] as ApiMembership[]),
      ]);
      setMember(data);
      setMemberships(periods);
      setEditForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
        gender: data.gender || "",
        date_of_birth: data.date_of_birth || "",
        emergency_contact: data.emergency_contact || "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to load member");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    setAuthUser(getAuthUser());
    loadMember();
  }, [loadMember]);

  useEffect(() => {
    if (tab !== "attendance" || attendance) return;
    repsiApi
      .getMemberPersonalAttendance(memberId)
      .then(setAttendance)
      .catch((err) => setAttendanceError(err.message));
  }, [tab, memberId, attendance]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setEditError(null);
    try {
      await repsiApi.updateMember(memberId, {
        ...editForm,
        date_of_birth: editForm.date_of_birth || null,
      });
      setIsEditOpen(false);
      setNotice("Member profile updated.");
      await loadMember();
    } catch (err: any) {
      setEditError(err.message || "Failed to update member");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    if (
      !confirm(
        `Permanently delete "${member.first_name} ${member.last_name || ""}"? This removes all membership, payment and attendance history and cannot be undone. To keep records, change the status to Archived instead.`
      )
    ) {
      return;
    }
    try {
      await repsiApi.deleteMember(memberId);
      router.push(`/${workspace}/members`);
    } catch (err: any) {
      setNotice(err.message || "Failed to delete member");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "membership", label: "Membership" },
    { id: "payments", label: "Payments" },
    { id: "attendance", label: "Attendance" },
    { id: "notes", label: "Notes" },
    { id: "history", label: "History" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" aria-busy="true">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center max-w-lg mx-auto mt-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[var(--text)]">Member not found</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">
          The member could not be loaded, was removed, or you don&apos;t have access to this record.
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setLoading(true); loadMember(); }}>Try again</Button>
          <Link href={`/${workspace}/members`}>
            <Button variant="secondary" size="sm">Back to members</Button>
          </Link>
        </div>
      </div>
    );
  }

  const memberName = `${member.first_name} ${member.last_name || ""}`.trim();
  const statusMeta = ACCOUNT_STATUS_META[member.status] || { label: member.status, variant: "outline" as const };
  const today = new Date().toISOString().slice(0, 10);
  const currentPeriod =
    memberships.find((m) => (m.status === "active" || m.status === "frozen") && m.start_date <= today && m.end_date >= today) ||
    memberships.find((m) => m.status === "active" || m.status === "frozen");
  const canModerate = MODERATOR_ROLES.includes(authUser?.role || "");

  return (
    <div className="space-y-6 max-w-5xl">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
        <Link href={`/${workspace}/members`} className="hover:text-[var(--text-secondary)] transition-colors">
          Members
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--text)]">{memberName}</span>
      </nav>

      {notice && (
        <p role="status" className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-secondary)]">
          {notice}
        </p>
      )}

      <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <Avatar className="h-16 w-16 flex-shrink-0">
              <AvatarFallback className="text-lg">{getInitials(memberName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-[var(--text)] tracking-tight">{memberName}</h1>
                <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
              </div>
              <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5 break-all">ID: {member.id}</p>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {currentPeriod ? `Valid until ${formatDate(currentPeriod.end_date)}` : "No current membership"}
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {member.phone && (
                  <>
                    <a href={`tel:${member.phone}`}>
                      <Button variant="secondary" size="sm"><Phone className="h-3.5 w-3.5" /> Call</Button>
                    </a>
                    <a href={whatsappHref(member.phone)} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</Button>
                    </a>
                  </>
                )}
                {member.email && !member.email.endsWith("@repsi.internal") && (
                  <a href={`mailto:${member.email}`}>
                    <Button variant="secondary" size="sm"><Mail className="h-3.5 w-3.5" /> Email</Button>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => { setEditError(null); setIsEditOpen(true); }}>
              <Edit className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsStatusOpen(true)}>
              <ShieldAlert className="h-3.5 w-3.5" /> Change status
            </Button>
            {canModerate && (
              <Button variant="ghost" size="sm" onClick={handleDelete} className="text-rose-500" title="Delete member permanently">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <div role="tablist" className="flex items-center gap-1 border-b border-[var(--border)] overflow-x-auto">
        {tabs.map((t) => {
          const isActive = tab === t.id;
          return (
            <Link
              key={t.id}
              role="tab"
              aria-selected={isActive}
              href={`/${workspace}/members/${memberId}?tab=${t.id}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-[var(--primary)] text-[var(--text)] font-semibold"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Member since", value: member.joined_date ? formatDate(member.joined_date) : "—", icon: Calendar },
              { label: "Membership valid until", value: currentPeriod ? formatDate(currentPeriod.end_date) : "—", icon: CalendarCheck },
              { label: "Gender", value: member.gender || "Not specified", icon: CreditCard },
              { label: "App access", value: member.repsi_access || "Not connected", icon: CheckCircle2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  <span className="text-xs text-[var(--text-muted)]">{label}</span>
                </div>
                <span className="text-sm font-semibold text-[var(--text)]">{value}</span>
              </div>
            ))}
          </div>

          <Card className="border-[var(--border)] bg-[var(--surface)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Member information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 text-xs text-[var(--text-secondary)]">
                {[
                  ["Full name", memberName],
                  ["Phone", member.phone || "—"],
                  ["Email", member.email || "—"],
                  ["Date of birth", member.date_of_birth ? formatDate(member.date_of_birth) : "—"],
                  ["Emergency contact", member.emergency_contact || "—"],
                  ["Account status", statusMeta.label],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2 border-b border-[var(--border)]">
                    <dt className="text-[var(--text-muted)]">{k}</dt>
                    <dd className="font-medium text-[var(--text)] text-right break-all">{v}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "membership" && <MembershipsPanel memberId={memberId} onChanged={loadMember} />}

      {tab === "payments" && <PaymentsPanel memberId={memberId} />}

      {tab === "attendance" && (
        <Card className="border-[var(--border)] bg-[var(--surface)]">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceError && <p className="text-xs text-rose-500" role="alert">{attendanceError}</p>}
            {!attendance && !attendanceError && (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" /></div>
            )}
            {attendance && (
              <div className="space-y-4">
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    ["Total visits", attendance.total_visits],
                    ["This week", attendance.this_week_visits],
                    ["This month", attendance.this_month_visits],
                    ["Avg. duration", `${Math.round(attendance.average_duration_minutes)} min`],
                  ].map(([k, v]) => (
                    <div key={k as string} className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
                      <dt className="text-[var(--text-muted)]">{k}</dt>
                      <dd className="text-sm font-semibold text-[var(--text)]">{v}</dd>
                    </div>
                  ))}
                </dl>
                {attendance.recent_sessions.length === 0 ? (
                  <p className="py-4 text-center text-xs text-[var(--text-muted)]">No visits recorded yet.</p>
                ) : (
                  <ul className="divide-y divide-[var(--border)] text-xs">
                    {attendance.recent_sessions.slice(0, 20).map((s) => (
                      <li key={s.id} className="flex justify-between py-2">
                        <span>{new Date(s.checkInTime).toLocaleString()}</span>
                        <span className="text-[var(--text-muted)]">{s.durationFormatted || (s.status === "in" ? "Inside now" : "—")} · {s.method}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "notes" && <NotesPanel memberId={memberId} currentUserId={authUser?.id} canModerate={canModerate} />}

      {tab === "history" && <HistoryPanel memberId={memberId} />}

      {isStatusOpen && (
        <MemberStatusDialog
          memberId={memberId}
          currentStatus={member.status}
          onClose={() => setIsStatusOpen(false)}
          onChanged={() => {
            setNotice("Account status updated.");
            loadMember();
          }}
        />
      )}

      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-label="Edit member profile" className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Edit className="w-5 h-5 text-[var(--primary)]" />
              Edit member profile
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-first" className="text-[var(--text-secondary)] block mb-1">First name</label>
                  <input id="edit-first" type="text" required maxLength={100} value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm text-[var(--text)] outline-none" />
                </div>
                <div>
                  <label htmlFor="edit-last" className="text-[var(--text-secondary)] block mb-1">Last name</label>
                  <input id="edit-last" type="text" maxLength={100} value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm text-[var(--text)] outline-none" />
                </div>
              </div>
              <div>
                <label htmlFor="edit-phone" className="text-[var(--text-secondary)] block mb-1">Phone number</label>
                <input id="edit-phone" type="tel" required value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm text-[var(--text)] outline-none" />
              </div>
              <div>
                <label htmlFor="edit-email" className="text-[var(--text-secondary)] block mb-1">Email</label>
                <input id="edit-email" type="email" value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm text-[var(--text)] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-gender" className="text-[var(--text-secondary)] block mb-1">Gender</label>
                  <select id="edit-gender" value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm text-[var(--text)] outline-none">
                    <option value="">Not specified</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-dob" className="text-[var(--text-secondary)] block mb-1">Date of birth</label>
                  <input id="edit-dob" type="date" max={today} value={editForm.date_of_birth}
                    onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm text-[var(--text)] outline-none" />
                </div>
              </div>
              <div>
                <label htmlFor="edit-emergency" className="text-[var(--text-secondary)] block mb-1">Emergency contact</label>
                <input id="edit-emergency" type="text" maxLength={100} value={editForm.emergency_contact}
                  onChange={(e) => setEditForm({ ...editForm, emergency_contact: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm text-[var(--text)] outline-none" />
              </div>
              <p className="text-[var(--text-muted)]">Staff notes are on the Notes tab. Use “Change status” to suspend or archive.</p>
              {editError && <p className="text-rose-500" role="alert">{editError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
