/**
 * Operations API client: class sessions and bookings, appointments, coupons, member documents,
 * receipts/refunds/dues/day close, business reports, and support tickets.
 * Errors surface the backend `detail` (see memberRequest).
 */
import { downloadAuthorized, memberRequest, uploadAuthorized } from "@/lib/api";
import { appLocale } from "@/lib/utils";

// ─── Classes and bookings ──────────────────────────────────────────────

export type BookingStatus = "booked" | "waitlisted" | "cancelled" | "attended" | "no_show";

export interface GymClass {
  id: string;
  name: string;
  schedule: string;
  trainer_id?: string | null;
  category: string;
  capacity: number;
  room?: string | null;
  is_active: boolean;
  duration_minutes: number;
  description?: string | null;
  booking_open_hours: number;
  cancel_cutoff_hours: number;
  waitlist_enabled: boolean;
}

export interface ClassBooking {
  id: string;
  session_id: string;
  member_id: string;
  member_name?: string;
  status: BookingStatus;
  waitlist_position?: number | null;
  booked_at: string;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  late_cancel: boolean;
  checked_in_at?: string | null;
  class_name?: string;
  starts_at?: string;
  ends_at?: string;
  room?: string | null;
  session_status?: string;
}

export interface ClassSession {
  id: string;
  class_id: string;
  class_name?: string | null;
  category?: string | null;
  trainer_id?: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  room?: string | null;
  status: "scheduled" | "cancelled" | "completed";
  cancel_reason?: string | null;
  booked: number;
  waitlisted: number;
  spots_left: number;
  my_booking?: ClassBooking | null;
}

export interface SessionCreate {
  starts_at?: string;
  weekdays?: number[];
  start_time?: string;
  from_date?: string;
  until_date?: string;
  duration_minutes?: number;
  trainer_id?: string;
  capacity?: number;
  room?: string;
}

export interface CalendarEvent {
  type: "class" | "appointment";
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  trainer_id?: string | null;
  member_id?: string | null;
  room?: string | null;
  booked?: number;
  capacity?: number;
  status?: string;
}

export interface Appointment {
  id: string;
  trainer_id: string;
  member_id?: string | null;
  title: string;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string | null;
  location?: string | null;
  cancel_reason?: string | null;
}

export interface AvailabilitySlot {
  weekday: number;
  start_time: string;
  end_time: string;
  branch_id?: string | null;
}

export const bookingApi = {
  listClasses: (includeInactive = false): Promise<GymClass[]> =>
    memberRequest(`/classes/?include_inactive=${includeInactive}`, "GET", undefined, "Could not load classes"),
  createClass: (data: Partial<GymClass> & { name: string }): Promise<GymClass> =>
    memberRequest("/classes/", "POST", { schedule: "", ...data }, "Could not create the class"),
  updateClass: (id: string, data: Partial<GymClass>): Promise<GymClass> =>
    memberRequest(`/classes/${id}`, "PATCH", data, "Could not update the class"),
  archiveClass: (id: string) => memberRequest(`/classes/${id}`, "DELETE", undefined, "Could not archive the class"),
  createSessions: (classId: string, data: SessionCreate): Promise<ClassSession[]> =>
    memberRequest(`/classes/${classId}/sessions`, "POST", data, "Could not schedule the session"),
  listSessions: (params: { start?: string; end?: string; class_id?: string; trainer_id?: string } = {}): Promise<ClassSession[]> =>
    memberRequest(`/classes/sessions?${new URLSearchParams(params as Record<string, string>)}`, "GET", undefined, "Could not load sessions"),
  updateSession: (id: string, data: Partial<SessionCreate>) =>
    memberRequest(`/classes/sessions/${id}`, "PATCH", data, "Could not update the session"),
  cancelSession: (id: string, reason: string) =>
    memberRequest(`/classes/sessions/${id}/cancel`, "POST", { reason }, "Could not cancel the session"),
  sessionBookings: (id: string): Promise<ClassBooking[]> =>
    memberRequest(`/classes/sessions/${id}/bookings`, "GET", undefined, "Could not load bookings"),
  book: (sessionId: string, memberId?: string, overrideRules = false): Promise<ClassBooking> =>
    memberRequest(`/classes/sessions/${sessionId}/book`, "POST",
      { member_id: memberId, override_rules: overrideRules }, "Could not book this class"),
  cancelBooking: (id: string, reason?: string): Promise<ClassBooking> =>
    memberRequest(`/classes/bookings/${id}/cancel`, "POST", { reason }, "Could not cancel the booking"),
  checkIn: (id: string): Promise<ClassBooking> =>
    memberRequest(`/classes/bookings/${id}/check-in`, "POST", undefined, "Could not check in"),
  myBookings: (): Promise<ClassBooking[]> => memberRequest("/classes/my-bookings", "GET", undefined, "Could not load your bookings"),
  calendar: (start?: string, end?: string): Promise<CalendarEvent[]> =>
    memberRequest(`/classes/calendar?${new URLSearchParams({ ...(start ? { start } : {}), ...(end ? { end } : {}) })}`,
      "GET", undefined, "Could not load the calendar"),

  availability: (trainerId: string): Promise<AvailabilitySlot[]> =>
    memberRequest(`/appointments/availability/${trainerId}`, "GET", undefined, "Could not load availability"),
  setAvailability: (trainerId: string, slots: AvailabilitySlot[]): Promise<AvailabilitySlot[]> =>
    memberRequest(`/appointments/availability/${trainerId}`, "PUT", { slots }, "Could not save availability"),
  freeSlots: (trainerId: string, day: string, duration = 60): Promise<{ slots: string[] }> =>
    memberRequest(`/appointments/slots?trainer_id=${trainerId}&day=${day}&duration_minutes=${duration}`, "GET", undefined,
      "Could not load free times"),
  bookAppointment: (data: { trainer_id: string; member_id?: string; starts_at: string; duration_minutes?: number; notes?: string }): Promise<Appointment> =>
    memberRequest("/appointments", "POST", data, "Could not book the session"),
  listAppointments: (params: { start?: string; end?: string; trainer_id?: string; member_id?: string } = {}): Promise<Appointment[]> =>
    memberRequest(`/appointments?${new URLSearchParams(params as Record<string, string>)}`, "GET", undefined, "Could not load sessions"),
  cancelAppointment: (id: string, reason: string): Promise<Appointment> =>
    memberRequest(`/appointments/${id}/cancel`, "POST", { reason }, "Could not cancel the session"),
};

// ─── Coupons ───────────────────────────────────────────────────────────

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  discount_type: "percent" | "flat";
  discount_value: number;
  max_discount?: number | null;
  min_amount?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  max_redemptions?: number | null;
  max_per_member: number;
  plan_ids?: string[] | null;
  new_members_only: boolean;
  is_active: boolean;
  redemptions: number;
}

export interface CouponQuote {
  coupon_id: string;
  code: string;
  list_price: number;
  discount: number;
  final_price: number;
}

export const offersApi = {
  list: (includeInactive = false): Promise<Coupon[]> =>
    memberRequest(`/offers/coupons?include_inactive=${includeInactive}`, "GET", undefined, "Could not load coupons"),
  create: (data: Partial<Coupon> & { code: string; discount_value: number }): Promise<Coupon> =>
    memberRequest("/offers/coupons", "POST", data, "Could not create the coupon"),
  update: (id: string, data: Partial<Coupon>): Promise<Coupon> =>
    memberRequest(`/offers/coupons/${id}`, "PATCH", data, "Could not update the coupon"),
  redemptions: (id: string): Promise<{ id: string; member_name: string; discount: number; final_price: number; redeemed_at: string }[]> =>
    memberRequest(`/offers/coupons/${id}/redemptions`, "GET", undefined, "Could not load redemptions"),
  quote: (code: string, planId: string, memberId?: string): Promise<CouponQuote> =>
    memberRequest("/offers/coupons/quote", "POST", { code, plan_id: planId, member_id: memberId }, "This coupon can't be used"),
};

// ─── Member documents ──────────────────────────────────────────────────

export type DocumentCategory = "agreement" | "waiver" | "id_proof" | "medical" | "other";

export interface MemberDocument {
  id: string;
  member_id: string;
  category: DocumentCategory;
  title: string;
  original_filename?: string | null;
  content_type: string;
  size_bytes: number;
  visible_to_member: boolean;
  requires_acknowledgement: boolean;
  acknowledged_at?: string | null;
  acknowledged_name?: string | null;
  expires_on?: string | null;
  archived_at?: string | null;
  created_at?: string | null;
}

export const documentsApi = {
  list: (memberId: string, includeArchived = false): Promise<MemberDocument[]> =>
    memberRequest(`/members/${memberId}/documents?include_archived=${includeArchived}`, "GET", undefined, "Could not load documents"),
  upload: (memberId: string, file: File, meta: { title: string; category: DocumentCategory; visible_to_member: boolean;
    requires_acknowledgement: boolean; expires_on?: string }): Promise<MemberDocument> => {
    const form = new FormData();
    form.append("file", file);
    form.append("title", meta.title);
    form.append("category", meta.category);
    form.append("visible_to_member", String(meta.visible_to_member));
    form.append("requires_acknowledgement", String(meta.requires_acknowledgement));
    if (meta.expires_on) form.append("expires_on", meta.expires_on);
    return uploadAuthorized(`/members/${memberId}/documents`, form, "Could not upload the document");
  },
  download: (memberId: string, doc: MemberDocument) =>
    downloadAuthorized(`/members/${memberId}/documents/${doc.id}/file`, doc.original_filename || doc.title, "Could not open the document"),
  acknowledge: (memberId: string, docId: string, fullName: string): Promise<MemberDocument> =>
    memberRequest(`/members/${memberId}/documents/${docId}/acknowledge`, "POST", { full_name: fullName, agree: true }, "Could not sign the document"),
  archive: (memberId: string, docId: string): Promise<MemberDocument> =>
    memberRequest(`/members/${memberId}/documents/${docId}/archive`, "POST", undefined, "Could not archive the document"),
};

// ─── Finance operations ────────────────────────────────────────────────

export interface Refund {
  id: string;
  payment_id: string;
  member_id: string;
  amount: number;
  method: string;
  reason: string;
  status: string;
  processed_at: string;
}

export interface DueItem {
  invoice_id: string;
  invoice_number: string;
  member_id: string;
  member_name: string;
  phone?: string | null;
  total: number;
  paid: number;
  balance: number;
  due_date?: string | null;
  days_overdue: number;
  age_bucket: string;
}

export interface Reconciliation {
  id: string;
  business_date: string;
  expected: Record<string, number>;
  counted: Record<string, number>;
  variance: Record<string, number>;
  total_expected: number;
  total_counted: number;
  total_variance: number;
  notes?: string | null;
  status: "closed" | "reopened";
  closed_at: string;
}

export const financeApi = {
  downloadReceipt: (paymentId: string, receiptNumber?: string | null) =>
    downloadAuthorized(`/payments/${paymentId}/receipt.pdf`, `${receiptNumber || "receipt"}.pdf`, "Could not download the receipt"),
  refunds: (paymentId: string): Promise<Refund[]> =>
    memberRequest(`/payments/${paymentId}/refunds`, "GET", undefined, "Could not load refunds"),
  refund: (paymentId: string, data: { amount: number; reason: string; method?: string; reference?: string }): Promise<Refund> =>
    memberRequest(`/payments/${paymentId}/refunds`, "POST", data, "Could not record the refund"),
  dues: (): Promise<{ total: number; by_age: Record<string, number>; items: DueItem[] }> =>
    memberRequest("/payments/dues/outstanding", "GET", undefined, "Could not load dues"),
  expected: (day: string): Promise<{ expected: Record<string, number>; total: number }> =>
    memberRequest(`/payments/reconciliation/expected?business_date=${day}`, "GET", undefined, "Could not load the day's collections"),
  closeDay: (day: string, counted: Record<string, number>, notes?: string): Promise<Reconciliation> =>
    memberRequest("/payments/reconciliation/close", "POST", { business_date: day, counted, notes }, "Could not close the day"),
  reopenDay: (day: string, reason: string): Promise<Reconciliation> =>
    memberRequest("/payments/reconciliation/reopen", "POST", { business_date: day, reason }, "Could not reopen the day"),
  history: (): Promise<Reconciliation[]> =>
    memberRequest("/payments/reconciliation/history", "GET", undefined, "Could not load day-close history"),
};

// ─── Reports ───────────────────────────────────────────────────────────

export type ReportType = "revenue" | "memberships" | "attendance" | "dues" | "trainers" | "classes";
export type ReportGroup = "day" | "week" | "month";

export interface ReportColumn {
  key: string;
  label: string;
  kind: "text" | "number" | "money" | "date";
}

export interface ReportResult {
  type: ReportType;
  title: string;
  filters: { start: string; end: string; group_by: ReportGroup };
  columns: ReportColumn[];
  rows: Record<string, string | number | null>[];
  summary: Record<string, unknown>;
  generated_at: string;
}

export interface ReportFilters {
  start?: string;
  end?: string;
  group_by?: ReportGroup;
  plan_id?: string;
  trainer_id?: string;
}

export interface SavedReport {
  id: string;
  name: string;
  report_type: ReportType;
  filters: ReportFilters & { relative_days?: number };
  is_shared: boolean;
}

function qs(filters: ReportFilters): string {
  return new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString();
}

export const reportsApi = {
  catalog: (): Promise<{ type: ReportType; title: string; description: string }[]> =>
    memberRequest("/reports/catalog", "GET", undefined, "Could not load reports"),
  run: (type: ReportType, filters: ReportFilters): Promise<ReportResult> =>
    memberRequest(`/reports/${type}?${qs(filters)}`, "GET", undefined, "Could not run the report"),
  export: (type: ReportType, format: "csv" | "xlsx" | "pdf", filters: ReportFilters) =>
    downloadAuthorized(`/reports/${type}/export?${qs({ ...filters })}&format=${format}`,
      `${type}-${filters.start || "report"}.${format}`, "Could not export the report"),
  saved: (): Promise<SavedReport[]> => memberRequest("/reports/saved", "GET", undefined, "Could not load saved reports"),
  save: (name: string, report_type: ReportType, filters: ReportFilters & { relative_days?: number }): Promise<SavedReport> =>
    memberRequest("/reports/saved", "POST", { name, report_type, filters }, "Could not save the report"),
  removeSaved: (id: string) => memberRequest(`/reports/saved/${id}`, "DELETE", undefined, "Could not delete the saved report"),
};

// ─── Support ───────────────────────────────────────────────────────────

export type TicketStatus = "open" | "in_progress" | "waiting_on_customer" | "resolved" | "closed";

export interface SupportTicket {
  id: string;
  number: string;
  subject: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: TicketStatus;
  resolution?: string | null;
  created_at: string;
  last_activity_at?: string | null;
  messages?: { id: string; body: string; from_support: boolean; author?: string | null; created_at: string }[];
}

export const supportApi = {
  list: (): Promise<SupportTicket[]> => memberRequest("/support/tickets", "GET", undefined, "Could not load tickets"),
  get: (id: string): Promise<SupportTicket> => memberRequest(`/support/tickets/${id}`, "GET", undefined, "Could not load the ticket"),
  create: (data: { subject: string; category: string; priority: string; message: string }): Promise<SupportTicket> =>
    memberRequest("/support/tickets", "POST", data, "Could not create the ticket"),
  reply: (id: string, message: string): Promise<SupportTicket> =>
    memberRequest(`/support/tickets/${id}/messages`, "POST", { message }, "Could not send the reply"),
  close: (id: string): Promise<SupportTicket> =>
    memberRequest(`/support/tickets/${id}/close`, "POST", undefined, "Could not close the ticket"),
};

// ─── Formatting ────────────────────────────────────────────────────────

export function formatMoney(amount: number | null | undefined, currency = "INR", locale?: string): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat(locale || appLocale(), { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

export function formatDateTime(iso?: string | null, locale?: string): string {
  if (!iso) return "—";
  const d = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
  return d.toLocaleString(locale || appLocale(), { dateStyle: "medium", timeStyle: "short" });
}
