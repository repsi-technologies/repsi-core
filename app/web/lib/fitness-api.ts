/**
 * Workout & fitness API client (`/api/v1/fitness/*`).
 * Uses the shared authenticated JSON helper from lib/api.ts so errors surface the backend `detail`.
 */
import { memberRequest } from "@/lib/api";

export type FitDifficulty = "beginner" | "intermediate" | "advanced";
export type FitTracking = "weight_reps" | "reps" | "duration" | "distance" | "duration_distance";
export type FitMediaType = "image" | "gif" | "video" | "youtube";

export interface ApiFitnessContext {
  kind: "gym" | "trainer" | "member";
  member_id?: string | null;
  trainer_id?: string | null;
  can_manage_exercises: boolean;
  can_manage_programs: boolean;
  can_assign: boolean;
}

export interface ApiMeasurementType {
  key: string;
  label: string;
  unit: string;
  min_value?: number | null;
  max_value?: number | null;
  built_in: boolean;
}

export interface ApiFitnessMeta {
  categories: string[];
  movement_patterns: string[];
  muscles: string[];
  equipment: string[];
  objectives: string[];
  measurement_types: ApiMeasurementType[];
}

export interface ApiExerciseInput {
  name: string;
  description?: string | null;
  category: string;
  movement_pattern?: string | null;
  primary_muscles: string[];
  secondary_muscles: string[];
  equipment: string[];
  difficulty: FitDifficulty;
  exercise_type: string;
  tracking_type: FitTracking;
  instructions: string[];
  breathing?: string | null;
  safety_tips: string[];
  common_mistakes: string[];
  media_type?: FitMediaType | null;
  media_url?: string | null;
}

export interface ApiExercise extends ApiExerciseInput {
  id: string;
  scope: "global" | "gym";
  slug: string;
  status: "active" | "archived";
  can_edit: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiPage<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiPlanItemInput {
  id?: string;
  exercise_id: string;
  section: "warmup" | "main" | "cooldown";
  group_type?: "superset" | "circuit" | null;
  group_label?: string | null;
  sets?: number | null;
  reps_min?: number | null;
  reps_max?: number | null;
  target_weight_kg?: number | null;
  duration_seconds?: number | null;
  distance_m?: number | null;
  rest_seconds?: number | null;
  tempo?: string | null;
  notes?: string | null;
}

export interface ApiPlanItem extends ApiPlanItemInput {
  id: string;
  exercise_name: string;
  exercise_category?: string | null;
  tracking_type: FitTracking;
  media_type?: FitMediaType | null;
  media_url?: string | null;
  primary_muscles?: string[];
  secondary_muscles?: string[];
  equipment?: string[];
  position: number;
}

export interface ApiPlanDayInput {
  id?: string;
  name: string;
  is_rest_day: boolean;
  notes?: string | null;
  items: ApiPlanItemInput[];
}

export interface ApiPlanDay {
  id: string;
  position: number;
  name: string;
  is_rest_day: boolean;
  notes?: string | null;
  items: ApiPlanItem[];
}

export interface ApiProgram {
  id: string;
  name: string;
  description?: string | null;
  objective?: string | null;
  difficulty: FitDifficulty;
  duration_weeks?: number | null;
  status: "draft" | "published" | "archived";
  created_by_name?: string | null;
  current_version_id?: string | null;
  current_version_number?: number | null;
  has_unpublished_changes: boolean;
  training_days: number;
  exercise_count: number;
  active_assignments: number;
  can_edit: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiProgramVersion {
  id: string;
  version_number: number;
  status: "draft" | "published";
  published_at?: string | null;
  change_note?: string | null;
  created_at: string;
  assignment_count: number;
}

export interface ApiProgramDetail extends ApiProgram {
  editing_version_id?: string | null;
  editing_version_number?: number | null;
  days: ApiPlanDay[];
  versions: ApiProgramVersion[];
}

export interface ApiProgramSave {
  name: string;
  description?: string | null;
  objective?: string | null;
  difficulty: FitDifficulty;
  duration_weeks?: number | null;
  days: ApiPlanDayInput[];
  change_note?: string | null;
  publish: boolean;
}

export interface ApiAssignmentStats {
  scheduled_to_date: number;
  completed: number;
  missed: number;
  adherence_pct?: number | null;
  next_date?: string | null;
}

export type AssignmentStatus = "active" | "paused" | "completed" | "cancelled";

export interface ApiAssignment {
  id: string;
  member_id: string;
  member_name: string;
  program_id?: string | null;
  program_version_number?: number | null;
  newer_version_available: boolean;
  title: string;
  trainer_name?: string | null;
  assigned_by_name?: string | null;
  start_date: string;
  end_date?: string | null;
  schedule_weekdays: number[];
  status: AssignmentStatus;
  notes?: string | null;
  is_customized: boolean;
  stats?: ApiAssignmentStats | null;
  created_at: string;
}

export interface ApiAssignmentDetail extends ApiAssignment {
  days: ApiPlanDay[];
}

export interface ApiAssignmentEvent {
  id: string;
  event_type: string;
  actor_name?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
}

export type OccurrenceStatus = "upcoming" | "today" | "missed" | "in_progress" | "paused" | "completed" | "abandoned" | "rest";

export interface ApiScheduleOccurrence {
  date: string;
  assignment_id: string;
  assignment_title: string;
  member_id: string;
  day_id?: string | null;
  day_name: string;
  is_rest_day: boolean;
  exercise_count: number;
  status: OccurrenceStatus;
  session_id?: string | null;
}

export interface ApiSetLog {
  id: string;
  item_id?: string | null;
  exercise_id: string;
  exercise_name: string;
  set_number: number;
  reps?: number | null;
  weight_kg?: number | null;
  duration_seconds?: number | null;
  distance_m?: number | null;
  rest_seconds?: number | null;
  rpe?: number | null;
  completed: boolean;
  target_reps_min?: number | null;
  target_reps_max?: number | null;
  target_weight_kg?: number | null;
}

export interface ApiSetInput {
  item_id: string;
  set_number: number;
  reps?: number | null;
  weight_kg?: number | null;
  duration_seconds?: number | null;
  distance_m?: number | null;
  rest_seconds?: number | null;
  rpe?: number | null;
  completed: boolean;
}

export type SessionStatus = "in_progress" | "paused" | "completed" | "abandoned";

export interface ApiWorkoutSession {
  id: string;
  member_id: string;
  member_name?: string | null;
  assignment_id: string;
  assignment_title?: string | null;
  day_name: string;
  scheduled_date: string;
  status: SessionStatus;
  started_at: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
  active_seconds: number;
  member_notes?: string | null;
  trainer_feedback?: string | null;
  completed_sets: number;
  total_volume_kg: number;
}

export interface ApiWorkoutSessionDetail extends ApiWorkoutSession {
  items: ApiPlanItem[];
  sets: ApiSetLog[];
}

export interface ApiMeasurement {
  id: string;
  member_id: string;
  measured_on: string;
  metric: string;
  value: number;
  unit: string;
  notes?: string | null;
  recorded_by_user_id?: string | null;
  recorded_by_name?: string | null;
  recorded_by_role?: string | null;
  created_at: string;
}

export interface ApiAssessment {
  id: string;
  assessed_on: string;
  goals?: string | null;
  fitness_level?: string | null;
  limitations?: string | null;
  resting_heart_rate?: number | null;
  summary?: string | null;
  private_notes?: string | null;
  assessed_by_name?: string | null;
  created_at: string;
}

export interface ApiAssessmentInput {
  assessed_on: string;
  goals?: string | null;
  fitness_level?: FitDifficulty | null;
  limitations?: string | null;
  resting_heart_rate?: number | null;
  summary?: string | null;
  private_notes?: string | null;
}

export interface ApiStrengthPoint {
  date: string;
  top_weight_kg: number;
  top_set_reps: number;
  estimated_1rm_kg?: number | null;
  volume_kg: number;
}

export interface ApiPersonalRecord {
  exercise_id: string;
  exercise_name: string;
  kind: "heaviest_weight" | "estimated_1rm" | "most_reps" | "longest_duration" | "longest_distance";
  value: number;
  unit: string;
  reps?: number | null;
  achieved_on: string;
  session_id: string;
}

export interface ApiProgress {
  member_id: string;
  member_name: string;
  date_from: string;
  date_to: string;
  measurements: Record<string, { label: string; unit: string; points: { date: string; value: number }[] }>;
  measurement_summary: {
    metric: string; label: string; unit: string; first: number; last: number; change: number;
    first_date: string; last_date: string; entries: number;
  }[];
  adherence: { scheduled: number; completed: number; missed: number; rate_pct?: number | null };
  weekly: { week_start: string; scheduled: number; completed: number }[];
  strength: { exercise_id: string; exercise_name: string; points: ApiStrengthPoint[] }[];
  personal_records: ApiPersonalRecord[];
  recent_sessions: ApiWorkoutSession[];
}

export interface ApiFitnessOverviewMember {
  member_id: string;
  member_name: string;
  trainer_name?: string | null;
  active_assignments: number;
  completed_30d: number;
  missed_30d: number;
  adherence_pct?: number | null;
  last_session_date?: string | null;
}

export interface ApiFitnessOverview {
  scope: "gym" | "trainer";
  active_assignments: number;
  members_with_plans: number;
  sessions_completed_30d: number;
  sessions_missed_30d: number;
  adherence_pct?: number | null;
  members: ApiFitnessOverviewMember[];
}

export interface ApiAssignResult {
  created: ApiAssignment[];
  skipped: { member_id: string; member_name: string; reason: string }[];
}

type QueryValue = string | number | boolean | undefined | null;

function qs(params: Record<string, QueryValue>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

const get = <T>(path: string, err: string): Promise<T> => memberRequest(path, "GET", undefined, err);
const send = <T>(method: string, path: string, body: unknown, err: string): Promise<T> => memberRequest(path, method, body, err);

export const fitnessApi = {
  context: () => get<ApiFitnessContext>("/fitness/me", "Failed to load your training access"),
  meta: () => get<ApiFitnessMeta>("/fitness/meta", "Failed to load fitness options"),

  listExercises: (params: {
    search?: string; category?: string; muscle?: string; equipment?: string; difficulty?: string;
    exercise_type?: string; scope?: "global" | "gym"; include_archived?: boolean; sort?: string;
    page?: number; page_size?: number;
  } = {}) => get<ApiPage<ApiExercise>>(`/fitness/exercises${qs(params)}`, "Failed to load exercises"),
  getExercise: (id: string) => get<ApiExercise>(`/fitness/exercises/${id}`, "Failed to load exercise"),
  createExercise: (data: ApiExerciseInput) => send<ApiExercise>("POST", "/fitness/exercises", data, "Failed to create exercise"),
  updateExercise: (id: string, data: ApiExerciseInput) =>
    send<ApiExercise>("PUT", `/fitness/exercises/${id}`, data, "Failed to update exercise"),
  setExerciseArchived: (id: string, archived: boolean) =>
    send<ApiExercise>("POST", `/fitness/exercises/${id}/${archived ? "archive" : "restore"}`, undefined, "Failed to update exercise"),

  listPrograms: (params: { search?: string; status?: string; mine?: boolean; page?: number; page_size?: number } = {}) =>
    get<ApiPage<ApiProgram>>(`/fitness/programs${qs(params)}`, "Failed to load programs"),
  getProgram: (id: string) => get<ApiProgramDetail>(`/fitness/programs/${id}`, "Failed to load program"),
  createProgram: (data: ApiProgramSave) => send<ApiProgramDetail>("POST", "/fitness/programs", data, "Failed to create program"),
  updateProgram: (id: string, data: ApiProgramSave) =>
    send<ApiProgramDetail>("PUT", `/fitness/programs/${id}`, data, "Failed to save program"),
  programAction: (id: string, action: "publish" | "discard-draft" | "duplicate" | "archive" | "restore") =>
    send<ApiProgramDetail>("POST", `/fitness/programs/${id}/${action}`, undefined, "Program action failed"),
  getProgramVersion: (programId: string, versionId: string) =>
    get<{ id: string; version_number: number; status: string; days: ApiPlanDay[] }>(
      `/fitness/programs/${programId}/versions/${versionId}`, "Failed to load version"),

  assignProgram: (data: {
    program_id: string; member_ids: string[]; start_date: string; end_date?: string | null;
    schedule_weekdays: number[]; notes?: string | null;
  }) => send<ApiAssignResult>("POST", "/fitness/assignments", data, "Failed to assign program"),
  listAssignments: (params: { member_id?: string; status?: string; page?: number; page_size?: number } = {}) =>
    get<ApiPage<ApiAssignment>>(`/fitness/assignments${qs(params)}`, "Failed to load workout plans"),
  getAssignment: (id: string) => get<ApiAssignmentDetail>(`/fitness/assignments/${id}`, "Failed to load workout plan"),
  updateAssignment: (id: string, data: {
    start_date?: string; end_date?: string | null; clear_end_date?: boolean; schedule_weekdays?: number[];
    status?: AssignmentStatus; notes?: string | null; reason?: string | null;
  }) => send<ApiAssignment>("PATCH", `/fitness/assignments/${id}`, data, "Failed to update workout plan"),
  updateAssignmentPlan: (id: string, days: ApiPlanDayInput[], reason?: string) =>
    send<ApiAssignmentDetail>("PUT", `/fitness/assignments/${id}/plan`, { days, reason }, "Failed to save plan changes"),
  getAssignmentEvents: (id: string) =>
    get<ApiAssignmentEvent[]>(`/fitness/assignments/${id}/events`, "Failed to load plan history"),

  schedule: (params: { member_id?: string; date_from?: string; date_to?: string }) =>
    get<ApiScheduleOccurrence[]>(`/fitness/schedule${qs(params)}`, "Failed to load schedule"),
  listSessions: (params: {
    member_id?: string; date_from?: string; date_to?: string; status?: string; page?: number; page_size?: number;
  } = {}) => get<ApiPage<ApiWorkoutSession>>(`/fitness/sessions${qs(params)}`, "Failed to load workout history"),
  startSession: (assignmentId: string, scheduledDate: string) =>
    send<ApiWorkoutSessionDetail>("POST", "/fitness/sessions/start",
      { assignment_id: assignmentId, scheduled_date: scheduledDate }, "Failed to start workout"),
  getSession: (id: string) => get<ApiWorkoutSessionDetail>(`/fitness/sessions/${id}`, "Failed to load workout"),
  saveSets: (id: string, sets: ApiSetInput[], memberNotes?: string | null) =>
    send<ApiWorkoutSessionDetail>("PUT", `/fitness/sessions/${id}/sets`, { sets, member_notes: memberNotes }, "Failed to save sets"),
  sessionAction: (id: string, action: "pause" | "resume" | "complete" | "abandon") =>
    send<ApiWorkoutSessionDetail>("POST", `/fitness/sessions/${id}/${action}`, undefined, "Workout action failed"),
  setFeedback: (id: string, feedback: string) =>
    send<ApiWorkoutSessionDetail>("PUT", `/fitness/sessions/${id}/feedback`, { trainer_feedback: feedback }, "Failed to save feedback"),

  listMeasurements: (memberId: string, params: { metric?: string; date_from?: string; date_to?: string } = {}) =>
    get<ApiMeasurement[]>(`/fitness/members/${memberId}/measurements${qs(params)}`, "Failed to load measurements"),
  recordMeasurements: (memberId: string, data: { measured_on: string; values: { metric: string; value: number }[]; notes?: string | null }) =>
    send<ApiMeasurement[]>("POST", `/fitness/members/${memberId}/measurements`, data, "Failed to save measurements"),
  removeMeasurement: (memberId: string, measurementId: string) =>
    send<null>("DELETE", `/fitness/members/${memberId}/measurements/${measurementId}`, undefined, "Failed to remove measurement"),
  createMeasurementType: (data: { key: string; label: string; unit: string; min_value?: number | null; max_value?: number | null }) =>
    send<ApiMeasurementType>("POST", "/fitness/measurement-types", data, "Failed to add measurement type"),

  listAssessments: (memberId: string) =>
    get<ApiAssessment[]>(`/fitness/members/${memberId}/assessments`, "Failed to load assessments"),
  recordAssessment: (memberId: string, data: ApiAssessmentInput) =>
    send<ApiAssessment>("POST", `/fitness/members/${memberId}/assessments`, data, "Failed to save assessment"),

  progress: (memberId: string, params: { date_from?: string; date_to?: string; exercise_id?: string } = {}) =>
    get<ApiProgress>(`/fitness/members/${memberId}/progress${qs(params)}`, "Failed to load progress"),
  overview: () => get<ApiFitnessOverview>("/fitness/overview", "Failed to load training overview"),
};
