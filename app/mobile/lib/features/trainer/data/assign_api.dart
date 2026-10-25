import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/providers/api_provider.dart';

/// Trainer-side assignment of workout programs and diet plans, plus the AI diet suggestion.
/// The backend enforces `workouts.assign` / `nutrition.assign` and that the member is theirs.
class AssignApi {
  final ApiClient _api;
  AssignApi(this._api);

  Future<List<WorkoutProgramSummary>> programs() async {
    final res = await _api.get<Map<String, dynamic>>('/fitness/programs',
        queryParameters: {'status_filter': 'published', 'page_size': 50});
    return ((res.data?['items'] as List?) ?? const [])
        .map((e) => WorkoutProgramSummary.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<void> assignWorkout({required String programId, required String memberId, required DateTime startDate,
      List<int> weekdays = const [], String? notes}) {
    return _api.post<Map<String, dynamic>>('/fitness/assignments', data: {
      'program_id': programId,
      'member_ids': [memberId],
      'start_date': _date(startDate),
      'schedule_weekdays': weekdays,
      if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
    });
  }

  Future<List<DietPlanSummary>> dietPlans() async {
    final res = await _api.get<List<dynamic>>('/nutrition/plans');
    return (res.data ?? const []).map((e) => DietPlanSummary.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  /// Creates a diet plan from AI/manual data and returns its id.
  Future<String> createDietPlan(Map<String, dynamic> plan) async {
    final res = await _api.post<Map<String, dynamic>>('/nutrition/plans', data: plan);
    return res.data!['id'] as String;
  }

  Future<void> assignDiet({required String memberId, required String planId, String? notes}) {
    return _api.post<Map<String, dynamic>>('/nutrition/members/$memberId/assignments',
        data: {'plan_id': planId, if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim()});
  }

  /// Returns the raw `/ai/diet/suggest` response ({plan, safety_message, source, notice}).
  Future<Map<String, dynamic>> suggestDiet(Map<String, dynamic> answers, {bool useAi = false}) async {
    final res = await _api.post<Map<String, dynamic>>('/ai/diet/suggest', data: {'answers': answers, 'use_ai': useAi});
    return res.data!;
  }

  static String _date(DateTime d) => '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

class WorkoutProgramSummary {
  final String id;
  final String name;
  final String? objective;
  final String difficulty;
  final int? durationWeeks;
  final int trainingDays;
  final int exerciseCount;

  const WorkoutProgramSummary({required this.id, required this.name, this.objective, required this.difficulty,
      this.durationWeeks, required this.trainingDays, required this.exerciseCount});

  factory WorkoutProgramSummary.fromJson(Map<String, dynamic> j) => WorkoutProgramSummary(
        id: j['id'] as String,
        name: j['name'] as String? ?? '',
        objective: j['objective'] as String?,
        difficulty: j['difficulty'] as String? ?? 'beginner',
        durationWeeks: (j['duration_weeks'] as num?)?.toInt(),
        trainingDays: (j['training_days'] as num?)?.toInt() ?? 0,
        exerciseCount: (j['exercise_count'] as num?)?.toInt() ?? 0,
      );
}

class DietPlanSummary {
  final String id;
  final String name;
  final String? goal;
  final String? dietType;

  const DietPlanSummary({required this.id, required this.name, this.goal, this.dietType});

  factory DietPlanSummary.fromJson(Map<String, dynamic> j) => DietPlanSummary(
        id: j['id'] as String,
        name: j['name'] as String? ?? '',
        goal: j['goal'] as String?,
        dietType: j['diet_type'] as String?,
      );
}

final assignApiProvider = Provider<AssignApi>((ref) => AssignApi(ref.watch(apiClientProvider)));

final assignableProgramsProvider =
    FutureProvider.autoDispose<List<WorkoutProgramSummary>>((ref) => ref.watch(assignApiProvider).programs());

final assignableDietPlansProvider =
    FutureProvider.autoDispose<List<DietPlanSummary>>((ref) => ref.watch(assignApiProvider).dietPlans());
