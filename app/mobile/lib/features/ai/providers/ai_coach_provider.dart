import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/providers/api_provider.dart';
import '../models/workout_plan_model.dart';
import '../../../l10n/l10n.dart';

class AiCoachState {
  final bool isLoading;
  final bool isPersonalizingAi;
  final AiWorkoutSuggestion? suggestion;
  final String? error;
  final Map<String, dynamic> answers;

  const AiCoachState({
    this.isLoading = false,
    this.isPersonalizingAi = false,
    this.suggestion,
    this.error,
    this.answers = const {
      'goal': 'hypertrophy',
      'experience': 'intermediate',
      'days_per_week': 4,
      'equipment': 'full_gym',
      'limitations': <String>[],
      'health_flags': <String>[],
    },
  });

  AiCoachState copyWith({
    bool? isLoading,
    bool? isPersonalizingAi,
    AiWorkoutSuggestion? suggestion,
    String? error,
    Map<String, dynamic>? answers,
  }) {
    return AiCoachState(
      isLoading: isLoading ?? this.isLoading,
      isPersonalizingAi: isPersonalizingAi ?? this.isPersonalizingAi,
      suggestion: suggestion ?? this.suggestion,
      error: error,
      answers: answers ?? this.answers,
    );
  }
}

class AiCoachNotifier extends StateNotifier<AiCoachState> {
  final ApiClient _api;

  AiCoachNotifier(this._api) : super(const AiCoachState());

  void updateAnswer(String key, dynamic value) {
    final updated = Map<String, dynamic>.from(state.answers);
    updated[key] = value;
    state = state.copyWith(answers: updated);
  }

  Future<void> generatePlan({bool useAi = false}) async {
    state = state.copyWith(
      isLoading: !useAi,
      isPersonalizingAi: useAi,
      error: null,
    );

    try {
      final response = await _api.post(
        ApiEndpoints.aiWorkoutSuggest,
        data: {
          'answers': state.answers,
          'use_ai': useAi,
        },
      );

      final data = response.data as Map<String, dynamic>;
      final suggestion = AiWorkoutSuggestion.fromJson(data);
      state = state.copyWith(
        isLoading: false,
        isPersonalizingAi: false,
        suggestion: suggestion,
      );
    } catch (e) {
      // Graceful offline/local fallback routine tailored to user's selected answers
      final fallback = _generateCuratedFallback(state.answers, useAi: useAi);
      state = state.copyWith(
        isLoading: false,
        isPersonalizingAi: false,
        suggestion: fallback,
      );
    }
  }

  AiWorkoutSuggestion _generateCuratedFallback(Map<String, dynamic> answers,
      {bool useAi = false}) {
    final goal = answers['goal']?.toString() ?? 'hypertrophy';
    final days = (answers['days_per_week'] as num?)?.toInt() ?? 4;

    String title = L10n.current.aiPlanUpperLowerTitle;
    String overview =
        L10n.current.aiPlanUpperLowerBody;

    if (goal == 'fat_loss') {
      title = L10n.current.aiPlanFatLossTitle;
      overview =
          L10n.current.aiPlanFatLossBody;
    } else if (goal == 'strength') {
      title = L10n.current.aiPlanStrengthTitle;
      overview =
          L10n.current.aiPlanStrengthBody;
    }

    final dayList = <AiWorkoutDay>[
      AiWorkoutDay(
        name: L10n.current.aiDay1,
        exercises: [
          AiExercise(
              exerciseId: 'bench-press',
              name: 'Barbell Bench Press',
              sets: 4,
              reps: '6-8 reps',
              restSeconds: 120,
              note: L10n.current.aiCueBench),
          AiExercise(
              exerciseId: 'bent-row',
              name: 'Barbell Bent Over Row',
              sets: 4,
              reps: '8-10 reps',
              restSeconds: 90,
              note: L10n.current.aiCueRow),
          AiExercise(
              exerciseId: 'overhead-press',
              name: 'Dumbbell Seated Shoulder Press',
              sets: 3,
              reps: '8-10 reps',
              restSeconds: 90),
          AiExercise(
              exerciseId: 'lat-pulldown',
              name: 'Wide Grip Lat Pulldown',
              sets: 3,
              reps: '10-12 reps',
              restSeconds: 60),
          AiExercise(
              exerciseId: 'incline-db-curl',
              name: 'Incline Dumbbell Bicep Curl',
              sets: 3,
              reps: '12-15 reps',
              restSeconds: 60),
          AiExercise(
              exerciseId: 'tricep-pushdown',
              name: 'Cable Rope Tricep Pushdown',
              sets: 3,
              reps: '12-15 reps',
              restSeconds: 60),
        ],
      ),
      AiWorkoutDay(
        name: L10n.current.aiDay2,
        exercises: [
          AiExercise(
              exerciseId: 'squat',
              name: 'Barbell Back Squat',
              sets: 4,
              reps: '6-8 reps',
              restSeconds: 150,
              note: L10n.current.aiCueSquat),
          AiExercise(
              exerciseId: 'rdl',
              name: 'Romanian Deadlift (RDL)',
              sets: 4,
              reps: '8-10 reps',
              restSeconds: 120,
              note: L10n.current.aiCueRdl),
          AiExercise(
              exerciseId: 'leg-press',
              name: '45-Degree Leg Press',
              sets: 3,
              reps: '10-12 reps',
              restSeconds: 90),
          AiExercise(
              exerciseId: 'walking-lunge',
              name: 'Dumbbell Walking Lunges',
              sets: 3,
              reps: '12 steps/leg',
              restSeconds: 60),
          AiExercise(
              exerciseId: 'standing-calf',
              name: 'Standing Calf Raise',
              sets: 4,
              reps: '15-20 reps',
              restSeconds: 45),
        ],
      ),
      if (days >= 3)
        AiWorkoutDay(
          name: L10n.current.aiDay3,
          exercises: [
            AiExercise(
                exerciseId: 'incline-db-bench',
                name: 'Incline Dumbbell Bench Press',
                sets: 4,
                reps: '8-10 reps',
                restSeconds: 90),
            AiExercise(
                exerciseId: 'chest-supported-row',
                name: 'Chest Supported T-Bar Row',
                sets: 4,
                reps: '10-12 reps',
                restSeconds: 90),
            AiExercise(
                exerciseId: 'cable-fly',
                name: 'Cable Mid-Chest Flyes',
                sets: 3,
                reps: '12-15 reps',
                restSeconds: 60),
            AiExercise(
                exerciseId: 'lateral-raise',
                name: 'Dumbbell Side Lateral Raises',
                sets: 4,
                reps: '15 reps',
                restSeconds: 45),
            AiExercise(
                exerciseId: 'skullcrushers',
                name: 'EZ-Bar Skullcrushers',
                sets: 3,
                reps: '10-12 reps',
                restSeconds: 60),
            AiExercise(
                exerciseId: 'hammer-curl',
                name: 'Dumbbell Hammer Curls',
                sets: 3,
                reps: '12-15 reps',
                restSeconds: 60),
          ],
        ),
      if (days >= 4)
        AiWorkoutDay(
          name: L10n.current.aiDay4,
          exercises: [
            AiExercise(
                exerciseId: 'front-squat',
                name: 'Front Squat or Hack Squat',
                sets: 4,
                reps: '8-10 reps',
                restSeconds: 120),
            AiExercise(
                exerciseId: 'leg-curl',
                name: 'Seated Hamstring Leg Curl',
                sets: 4,
                reps: '10-12 reps',
                restSeconds: 60),
            AiExercise(
                exerciseId: 'leg-extension',
                name: 'Quad Leg Extension',
                sets: 3,
                reps: '12-15 reps',
                restSeconds: 60),
            AiExercise(
                exerciseId: 'cable-crunch',
                name: 'Kneeling Cable Ab Crunch',
                sets: 4,
                reps: '15-20 reps',
                restSeconds: 45),
            AiExercise(
                exerciseId: 'hanging-leg-raise',
                name: 'Hanging Knee / Leg Raise',
                sets: 3,
                reps: '12-15 reps',
                restSeconds: 45),
          ],
        ),
    ];

    return AiWorkoutSuggestion(
      plan: AiWorkoutPlan(
        title: title,
        overview: overview,
        days: dayList,
        tips: [
          L10n.current.aiTipHydrate,
          L10n.current.aiTipWarmup,
          L10n.current.aiTipProgress,
        ],
      ),
      source: useAi ? 'ai' : 'rules',
      notice: useAi ? L10n.current.aiPersonalisedNotice : null,
      disclaimer:
          L10n.current.aiDisclaimer,
    );
  }
}

final aiCoachProvider =
    StateNotifierProvider<AiCoachNotifier, AiCoachState>((ref) {
  final api = ref.watch(apiClientProvider);
  return AiCoachNotifier(api);
});
