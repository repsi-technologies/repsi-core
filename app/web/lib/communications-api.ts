/**
 * Communications API client: broadcasts, message templates, delivery logs, notification
 * preferences and plan entitlements. Errors surface the backend `detail`.
 */
import { memberRequest } from "@/lib/api";

export type CommChannel = "in_app" | "email" | "whatsapp";
export type CommSegment =
  | "all_members"
  | "active_membership"
  | "expiring_soon"
  | "expired"
  | "new_members"
  | "selected_members"
  | "trainers"
  | "staff";

export type DeliveryStatus =
  | "queued"
  | "sent"
  | "failed"
  | "skipped_not_configured"
  | "skipped_opt_out"
  | "skipped_no_contact"
  | "skipped_no_consent";

export interface CommAudience {
  segment: CommSegment;
  member_ids?: string[];
  days?: number;
}

export interface AudiencePreview {
  recipient_count: number;
  sample: string[];
  with_app_account: number;
  with_email: number;
  with_phone: number;
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  channels: CommChannel[];
  audience: CommAudience;
  template_id?: string | null;
  status: "sending" | "completed" | "completed_with_errors";
  recipient_count: number;
  created_at: string;
  completed_at?: string | null;
  summary: Partial<Record<DeliveryStatus, number>>;
  by_channel: Partial<Record<CommChannel, Partial<Record<DeliveryStatus, number>>>>;
}

export interface Delivery {
  id: string;
  broadcast_id?: string | null;
  event_type: string;
  channel: CommChannel;
  member_id?: string | null;
  recipient_name?: string | null;
  destination?: string | null;
  status: DeliveryStatus;
  provider?: string | null;
  error?: string | null;
  attempts: number;
  created_at: string;
  sent_at?: string | null;
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: CommChannel;
  category: "announcement" | "reminder" | "receipt" | "welcome";
  subject?: string | null;
  body: string;
  provider_template_name?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  in_app_enabled: boolean;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  whatsapp_consent_at?: string | null;
  announcements_enabled: boolean;
}

export interface UsageMetric {
  current: number;
  limit: number;
  unlimited: boolean;
  percentage: number;
  warning_triggered: boolean;
  limit_reached: boolean;
}

export interface Entitlements {
  workspace_id: string;
  plan: { code: string; name: string };
  status: string;
  features: Record<string, boolean>;
  limits: Record<"max_members" | "max_trainers" | "max_staff" | "max_branches", number>;
  usage: Record<"members" | "trainers" | "staff" | "branches", UsageMetric>;
}

interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  queued: "Queued",
  sent: "Sent",
  failed: "Failed",
  skipped_not_configured: "Provider not configured",
  skipped_opt_out: "Opted out",
  skipped_no_contact: "No contact details",
  skipped_no_consent: "No WhatsApp consent",
};

export const SEGMENT_LABELS: Record<CommSegment, string> = {
  all_members: "All active members",
  active_membership: "Members with an active membership",
  expiring_soon: "Memberships ending soon",
  expired: "Expired memberships",
  new_members: "Recently joined members",
  selected_members: "Selected members",
  trainers: "Trainers",
  staff: "Staff (admins, managers, front desk)",
};

export const communicationsApi = {
  previewAudience(audience: CommAudience): Promise<AudiencePreview> {
    return memberRequest("/broadcasts/preview", "POST", audience, "Could not load the audience");
  },
  sendBroadcast(data: {
    title: string;
    message: string;
    channels: CommChannel[];
    audience: CommAudience;
    template_id?: string | null;
  }): Promise<Broadcast> {
    return memberRequest("/broadcasts", "POST", data, "Could not send the broadcast");
  },
  listBroadcasts(page = 1, pageSize = 20): Promise<Page<Broadcast>> {
    return memberRequest(`/broadcasts?page=${page}&page_size=${pageSize}`, "GET", undefined, "Could not load broadcasts");
  },
  getBroadcast(id: string): Promise<Broadcast> {
    return memberRequest(`/broadcasts/${id}`, "GET", undefined, "Broadcast not found");
  },
  retryBroadcast(id: string): Promise<Broadcast> {
    return memberRequest(`/broadcasts/${id}/dispatch`, "POST", undefined, "Could not retry delivery");
  },
  broadcastDeliveries(id: string, page = 1, status?: DeliveryStatus): Promise<Page<Delivery>> {
    const qs = new URLSearchParams({ page: String(page), page_size: "50" });
    if (status) qs.set("status", status);
    return memberRequest(`/broadcasts/${id}/deliveries?${qs}`, "GET", undefined, "Could not load deliveries");
  },
  listDeliveries(params: { page?: number; status?: DeliveryStatus; channel?: CommChannel } = {}): Promise<Page<Delivery>> {
    const qs = new URLSearchParams({ page: String(params.page || 1), page_size: "50" });
    if (params.status) qs.set("status", params.status);
    if (params.channel) qs.set("channel", params.channel);
    return memberRequest(`/notification-deliveries?${qs}`, "GET", undefined, "Could not load the delivery log");
  },
  listTemplates(includeInactive = false): Promise<MessageTemplate[]> {
    return memberRequest(`/message-templates?include_inactive=${includeInactive}`, "GET", undefined, "Could not load templates");
  },
  createTemplate(data: Omit<MessageTemplate, "id" | "is_active" | "created_at">): Promise<MessageTemplate> {
    return memberRequest("/message-templates", "POST", data, "Could not save the template");
  },
  updateTemplate(id: string, data: Partial<Omit<MessageTemplate, "id" | "created_at" | "channel" | "category">>): Promise<MessageTemplate> {
    return memberRequest(`/message-templates/${id}`, "PATCH", data, "Could not update the template");
  },
  getPreferences(): Promise<NotificationPreferences> {
    return memberRequest("/notifications/preferences", "GET", undefined, "Could not load preferences");
  },
  updatePreferences(data: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    return memberRequest("/notifications/preferences", "PUT", data, "Could not save preferences");
  },
  getEntitlements(): Promise<Entitlements> {
    return memberRequest("/billing/entitlements", "GET", undefined, "Could not load plan entitlements");
  },
};
