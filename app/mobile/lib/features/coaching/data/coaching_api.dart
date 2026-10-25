import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_error.dart';
import '../../../core/providers/api_provider.dart';
import 'coaching_models.dart';

/// `/coaching/*`: member goals, goal-based workout suggestions and trainer / PT requests.
/// The backend scopes everything to the signed-in member or, for staff, to their gym.
class CoachingApi {
  final ApiClient _api;
  CoachingApi(this._api);

  Future<CoachingOverview> me() async {
    final res = await _api.get<Map<String, dynamic>>('/coaching/me');
    return CoachingOverview.fromJson(res.data!);
  }

  Future<MemberGoal> setGoal(GoalDraft draft) async {
    final res = await _api.put<Map<String, dynamic>>('/coaching/me/goal', data: draft.toJson());
    return MemberGoal.fromJson(res.data!);
  }

  /// Null when the member has not set a goal yet (the API answers 404).
  Future<WorkoutPlanSuggestion?> suggestions() async {
    try {
      final res = await _api.get<Map<String, dynamic>>('/coaching/me/suggestions');
      return WorkoutPlanSuggestion.fromJson(res.data!);
    } on ApiError catch (e) {
      if (e.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<List<CoachProfile>> trainers() async {
    final res = await _api.get<List<dynamic>>('/coaching/trainers');
    return (res.data ?? const []).map((e) => CoachProfile.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  Future<TrainerRequestItem> createRequest({required String kind, String? trainerId, String? message}) async {
    final res = await _api.post<Map<String, dynamic>>('/coaching/requests', data: {
      'kind': kind,
      if (trainerId != null) 'preferred_trainer_id': trainerId,
      if (message != null && message.trim().isNotEmpty) 'message': message.trim(),
    });
    return TrainerRequestItem.fromJson(res.data!);
  }

  Future<void> cancelRequest(String id) => _api.post<Map<String, dynamic>>('/coaching/requests/$id/cancel');

  Future<TrainerRequestPage> requests({String? status}) async {
    final res = await _api.get<Map<String, dynamic>>('/coaching/requests',
        queryParameters: {if (status != null) 'status': status});
    return TrainerRequestPage.fromJson(res.data!);
  }

  Future<void> approve(String id, String trainerId, {String? note}) => _api.post<Map<String, dynamic>>(
      '/coaching/requests/$id/approve', data: {'trainer_id': trainerId, if (note != null && note.isNotEmpty) 'note': note});

  Future<void> decline(String id, {String? note}) => _api.post<Map<String, dynamic>>(
      '/coaching/requests/$id/decline', data: {if (note != null && note.isNotEmpty) 'note': note});

  /// For trainers (own clients) and gym staff.
  Future<MemberGoal?> memberGoal(String memberId) async {
    final res = await _api.get<Map<String, dynamic>>('/coaching/members/$memberId/goal');
    final g = res.data?['goal'];
    return g == null ? null : MemberGoal.fromJson(Map<String, dynamic>.from(g as Map));
  }

  /// Gym trainers for the owner's approve sheet.
  Future<List<CoachProfile>> gymTrainers() async {
    final res = await _api.get<List<dynamic>>('/trainers');
    return (res.data ?? const [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .where((t) => (t['status'] as String? ?? '').split('.').last.toUpperCase() == 'ACTIVE' && t['is_active'] != false)
        .map(CoachProfile.fromJson)
        .toList();
  }
}

final coachingApiProvider = Provider<CoachingApi>((ref) => CoachingApi(ref.watch(apiClientProvider)));

final coachingOverviewProvider =
    FutureProvider.autoDispose<CoachingOverview>((ref) => ref.watch(coachingApiProvider).me());

final workoutSuggestionsProvider =
    FutureProvider.autoDispose<WorkoutPlanSuggestion?>((ref) => ref.watch(coachingApiProvider).suggestions());

final availableTrainersProvider =
    FutureProvider.autoDispose<List<CoachProfile>>((ref) => ref.watch(coachingApiProvider).trainers());

final trainerRequestsProvider = FutureProvider.autoDispose.family<TrainerRequestPage, String?>(
    (ref, status) => ref.watch(coachingApiProvider).requests(status: status));

final memberGoalProvider = FutureProvider.autoDispose.family<MemberGoal?, String>(
    (ref, memberId) => ref.watch(coachingApiProvider).memberGoal(memberId));
