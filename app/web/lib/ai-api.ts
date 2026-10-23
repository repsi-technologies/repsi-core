/**
 * REPSI AI client (`/api/v1/ai/*`). Every response says where the answer came from:
 * `kb` (help articles), `rules` (calculated), `cached`/`ai` (Gemini) or `fallback` (standard answer,
 * with a `notice` explaining why AI wasn't used). Nothing is generated in the browser.
 */
import { memberRequest } from "@/lib/api";

export type AiSource = "ai" | "cached" | "kb" | "rules" | "fallback";

export interface AiStatus {
  configured: boolean;
  model: string;
  person_used: number;
  person_limit: number;
  workspace_used: number;
  workspace_limit: number;
  features: { ai_assistant: boolean; ai_insights: boolean; ai_workouts: boolean };
}

export interface AssistantAnswer {
  answer: string;
  links: { title: string; path: string }[];
  related: string[];
  source: AiSource;
  notice?: string | null;
}

export interface BusinessMetrics {
  period: string;
  currency: string;
  members: Record<string, number>;
  revenue: Record<string, number>;
  attendance: { visits_last_30d: number; visits_previous_30d: number; average_daily_visits: number; busiest_weekday: string | null; busiest_hour_utc: number | null };
}

export interface AiSummary {
  summary: string;
  highlights: string[];
  actions: string[];
  source: AiSource;
  notice?: string | null;
}

export interface InsightsResponse extends AiSummary {
  metrics: BusinessMetrics;
}

export type ReportType = "overview" | "revenue" | "attendance" | "memberships";

export interface ReminderGroup {
  key: string;
  label: string;
  count: number;
  members: { member_id: string; name: string; detail: string }[];
  suggested_title: string;
  suggested_message: string;
}

export interface WorkoutQuestion {
  key: string;
  label: string;
  type: "choice" | "multi" | "text";
  options?: [string | number, string][];
}

export interface WorkoutPlan {
  title: string;
  overview: string;
  days: { name: string; focus: string; exercises: { exercise_id: string; name: string; sets: number; reps: string; rest_seconds: number; note: string }[] }[];
  tips: string[];
}

export interface WorkoutSuggestion {
  plan: WorkoutPlan | null;
  safety_message: string | null;
  disclaimer: string;
  source: AiSource;
  notice?: string | null;
}

export const SOURCE_LABEL: Record<AiSource, string> = {
  ai: "AI",
  cached: "AI",
  kb: "Help article",
  rules: "Calculated",
  fallback: "Standard answer",
};

export const aiApi = {
  status(): Promise<AiStatus> {
    return memberRequest("/ai/status", "GET", undefined, "Could not load AI status");
  },
  ask(question: string): Promise<AssistantAnswer> {
    return memberRequest("/ai/assistant", "POST", { question }, "The assistant couldn't answer right now");
  },
  insights(): Promise<InsightsResponse> {
    return memberRequest("/ai/insights", "GET", undefined, "Could not load insights");
  },
  reportSummary(type: ReportType): Promise<AiSummary & { data: unknown }> {
    return memberRequest(`/ai/reports/${type}/summary`, "GET", undefined, "Could not summarize the report");
  },
  reminders(): Promise<{ groups: ReminderGroup[]; generated_for: string }> {
    return memberRequest("/ai/reminders", "GET", undefined, "Could not load reminder suggestions");
  },
  workoutQuestions(): Promise<{ questions: WorkoutQuestion[]; disclaimer: string }> {
    return memberRequest("/ai/workout/questions", "GET", undefined, "Could not load questions");
  },
  suggestWorkout(answers: Record<string, unknown>, useAi: boolean): Promise<WorkoutSuggestion> {
    return memberRequest("/ai/workout/suggest", "POST", { answers, use_ai: useAi }, "Could not build a workout");
  },
  adminUsage<T = unknown>(days = 30): Promise<T> {
    return memberRequest(`/ai/admin/usage?days=${days}`, "GET", undefined, "Could not load AI usage");
  },
};
