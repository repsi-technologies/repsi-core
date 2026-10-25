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

  /// Default workout templates catalog (Beginner, Intermediate, Chest Split).
  Future<List<TemplateWorkoutProgram>> templates() async {
    try {
      final res = await _api.get<List<dynamic>>('/fitness/templates');
      final items = (res.data ?? const [])
          .map((e) => TemplateWorkoutProgram.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      if (items.isNotEmpty) return items;
    } catch (_) {
      // Offline fallback below
    }
    return defaultFallbackTemplates;
  }

  /// Current active workout assignment from the gym / trainer for the logged-in member.
  Future<TemplateWorkoutProgram?> activeGymAssignment() async {
    try {
      final res = await _api.get<Map<String, dynamic>>('/fitness/assignments',
          queryParameters: {'status': 'active', 'page_size': 1});
      final items = (res.data?['items'] as List?) ?? const [];
      if (items.isEmpty) return null;
      final first = items.first as Map;
      final assignmentId = first['id'] as String?;
      if (assignmentId == null) return null;

      final detailRes = await _api.get<Map<String, dynamic>>('/fitness/assignments/$assignmentId');
      final detail = detailRes.data;
      if (detail == null) return null;

      final rawDays = (detail['days'] as List?) ?? const [];
      final daysList = <PlannedDay>[];
      for (var i = 0; i < rawDays.length; i++) {
        final d = Map<String, dynamic>.from(rawDays[i] as Map);
        d['index'] = i + 1;
        daysList.add(PlannedDay.fromJson(d));
      }

      return TemplateWorkoutProgram(
        key: 'assigned_$assignmentId',
        name: detail['title'] as String? ?? 'Assigned Program',
        description: detail['notes'] as String? ?? 'Customized training plan from your gym.',
        objective: 'assigned',
        difficulty: 'custom',
        badge: detail['trainer_name'] != null ? 'Trainer: ${detail['trainer_name']}' : 'Gym Assigned',
        trainingDays: daysList.length,
        exerciseCount: daysList.fold(0, (sum, d) => sum + d.exercises.length),
        days: daysList,
      );
    } catch (_) {
      return null;
    }
  }
}

final coachingApiProvider = Provider<CoachingApi>((ref) => CoachingApi(ref.watch(apiClientProvider)));

final coachingOverviewProvider =
    FutureProvider.autoDispose<CoachingOverview>((ref) => ref.watch(coachingApiProvider).me());

final workoutSuggestionsProvider =
    FutureProvider.autoDispose<WorkoutPlanSuggestion?>((ref) => ref.watch(coachingApiProvider).suggestions());

final workoutTemplatesProvider =
    FutureProvider.autoDispose<List<TemplateWorkoutProgram>>((ref) => ref.watch(coachingApiProvider).templates());

final activeGymAssignmentProvider =
    FutureProvider.autoDispose<TemplateWorkoutProgram?>((ref) => ref.watch(coachingApiProvider).activeGymAssignment());

final availableTrainersProvider =
    FutureProvider.autoDispose<List<CoachProfile>>((ref) => ref.watch(coachingApiProvider).trainers());

final trainerRequestsProvider = FutureProvider.autoDispose.family<TrainerRequestPage, String?>(
    (ref, status) => ref.watch(coachingApiProvider).requests(status: status));

final memberGoalProvider = FutureProvider.autoDispose.family<MemberGoal?, String>(
    (ref, memberId) => ref.watch(coachingApiProvider).memberGoal(memberId));

final defaultFallbackTemplates = [
  TemplateWorkoutProgram(
    key: 'beginner_full_body',
    name: 'Beginner Full-Body Foundation',
    description: 'A 3-day foundation split designed for beginners to build movement competency, core stability, and total-body functional strength.',
    objective: 'general_fitness',
    difficulty: 'beginner',
    badge: 'Beginner 3-Day',
    durationWeeks: 4,
    trainingDays: 3,
    exerciseCount: 15,
    days: [
      PlannedDay(
        index: 1,
        focus: 'full_body',
        name: 'Day 1: Squat & Push Foundation',
        notes: 'Focus on smooth movement patterns and controlled breathing.',
        estimatedMinutes: 45,
        exercises: [
          PlannedExercise(
            exerciseId: 'cat_cow',
            name: 'Cat-Cow',
            category: 'mobility',
            sets: 2,
            reps: '10',
            restSeconds: 30,
            primaryMuscles: ['lower_back', 'core'],
            equipment: ['bodyweight'],
            instructions: ['Inhale and drop belly, exhale and round back.'],
            section: 'warmup',
            notes: 'Mobilize thoracic spine gently with breath.',
          ),
          PlannedExercise(
            exerciseId: 'goblet_squat',
            name: 'Goblet Squat',
            category: 'legs',
            sets: 3,
            reps: '10-12',
            restSeconds: 60,
            primaryMuscles: ['quadriceps', 'glutes'],
            equipment: ['dumbbell'],
            instructions: ['Hold dumbbell at chest, sit hips back, keep chest upright.'],
            section: 'main',
            notes: 'Pause 1s at bottom, drive through heels.',
          ),
          PlannedExercise(
            exerciseId: 'push_up',
            name: 'Push-Up',
            category: 'chest',
            sets: 3,
            reps: '8-10',
            restSeconds: 60,
            primaryMuscles: ['chest', 'triceps'],
            equipment: ['bodyweight'],
            instructions: ['Lower chest to floor with tight core, press back up.'],
            section: 'main',
            notes: 'Maintain rigid plank line.',
          ),
          PlannedExercise(
            exerciseId: 'lat_pulldown',
            name: 'Lat Pulldown',
            category: 'back',
            sets: 3,
            reps: '10-12',
            restSeconds: 60,
            primaryMuscles: ['lats'],
            equipment: ['cable'],
            instructions: ['Pull bar down to upper chest, squeeze shoulder blades.'],
            section: 'main',
          ),
          PlannedExercise(
            exerciseId: 'plank',
            name: 'Plank',
            category: 'core',
            sets: 3,
            durationSeconds: 30,
            restSeconds: 45,
            primaryMuscles: ['core'],
            equipment: ['bodyweight'],
            instructions: ['Hold straight body line from head to heels.'],
            section: 'cooldown',
          ),
        ],
      ),
      PlannedDay(
        index: 2,
        focus: 'full_body',
        name: 'Day 2: Hinge & Row Foundation',
        notes: 'Focus on posterior chain awareness and shoulder stability.',
        estimatedMinutes: 45,
        exercises: [
          PlannedExercise(
            exerciseId: 'worlds_greatest_stretch',
            name: "World's Greatest Stretch",
            category: 'mobility',
            sets: 2,
            reps: '8',
            restSeconds: 30,
            primaryMuscles: ['hip_flexors', 'hamstrings'],
            equipment: ['bodyweight'],
            instructions: ['Lunge and reach arm overhead to open thoracic spine.'],
            section: 'warmup',
          ),
          PlannedExercise(
            exerciseId: 'romanian_deadlift',
            name: 'Romanian Deadlift',
            category: 'legs',
            sets: 3,
            reps: '10-12',
            restSeconds: 60,
            primaryMuscles: ['hamstrings', 'glutes'],
            equipment: ['dumbbell'],
            instructions: ['Hinge at hips with soft knees, feel stretch in hamstrings.'],
            section: 'main',
            notes: 'Keep back flat throughout.',
          ),
          PlannedExercise(
            exerciseId: 'seated_cable_row',
            name: 'Seated Cable Row',
            category: 'back',
            sets: 3,
            reps: '10-12',
            restSeconds: 60,
            primaryMuscles: ['upper_back', 'lats'],
            equipment: ['cable'],
            instructions: ['Sit upright, pull handle into navel, squeeze back.'],
            section: 'main',
          ),
          PlannedExercise(
            exerciseId: 'dumbbell_lateral_raise',
            name: 'Dumbbell Lateral Raise',
            category: 'shoulders',
            sets: 3,
            reps: '12-15',
            restSeconds: 45,
            primaryMuscles: ['side_delts'],
            equipment: ['dumbbell'],
            instructions: ['Raise dumbbells to sides up to shoulder level.'],
            section: 'main',
          ),
          PlannedExercise(
            exerciseId: 'dead_bug',
            name: 'Dead Bug',
            category: 'core',
            sets: 3,
            reps: '10-12',
            restSeconds: 45,
            primaryMuscles: ['core'],
            equipment: ['bodyweight'],
            instructions: ['Extend opposite arm and leg while keeping back on floor.'],
            section: 'cooldown',
          ),
        ],
      ),
      PlannedDay(
        index: 3,
        focus: 'full_body',
        name: 'Day 3: Legs & Arms Accessory',
        notes: 'Finish the training week with endurance and accessory movements.',
        estimatedMinutes: 45,
        exercises: [
          PlannedExercise(
            exerciseId: 'treadmill_run',
            name: 'Treadmill Run',
            category: 'cardio',
            sets: 1,
            durationSeconds: 300,
            restSeconds: 60,
            primaryMuscles: ['full_body'],
            equipment: ['treadmill'],
            instructions: ['Warm up with a progressive brisk walk or jog.'],
            section: 'warmup',
          ),
          PlannedExercise(
            exerciseId: 'leg_press',
            name: 'Leg Press',
            category: 'legs',
            sets: 3,
            reps: '10-12',
            restSeconds: 60,
            primaryMuscles: ['quadriceps', 'glutes'],
            equipment: ['machine'],
            instructions: ['Lower platform smoothly without lifting hips off pad.'],
            section: 'main',
          ),
          PlannedExercise(
            exerciseId: 'barbell_biceps_curl',
            name: 'Barbell Biceps Curl',
            category: 'arms',
            sets: 3,
            reps: '10-12',
            restSeconds: 45,
            primaryMuscles: ['biceps'],
            equipment: ['barbell'],
            instructions: ['Curl bar up with elbows pinned to sides.'],
            section: 'main',
          ),
          PlannedExercise(
            exerciseId: 'bench_dip',
            name: 'Bench Dip',
            category: 'arms',
            sets: 3,
            reps: '10-12',
            restSeconds: 45,
            primaryMuscles: ['triceps'],
            equipment: ['bench'],
            instructions: ['Bend elbows to 90 degrees and press back up.'],
            section: 'main',
          ),
          PlannedExercise(
            exerciseId: 'standing_calf_raise',
            name: 'Standing Calf Raise',
            category: 'legs',
            sets: 3,
            reps: '12-15',
            restSeconds: 30,
            primaryMuscles: ['calves'],
            equipment: ['machine'],
            instructions: ['Hold top peak contraction for 1 second.'],
            section: 'cooldown',
          ),
        ],
      ),
    ],
  ),
  TemplateWorkoutProgram(
    key: 'intermediate_upper_lower',
    name: 'Intermediate Upper / Lower Strength Split',
    description: 'An 8-week progressive overload split balancing multi-joint compound strength lifts with hypertrophy accessory volume.',
    objective: 'strength',
    difficulty: 'intermediate',
    badge: 'Intermediate 4-Day',
    durationWeeks: 8,
    trainingDays: 4,
    exerciseCount: 22,
    days: [
      PlannedDay(
        index: 1,
        focus: 'upper',
        name: 'Day 1: Upper Body Power',
        notes: 'Heavy compound pressing and pulling for upper body strength.',
        estimatedMinutes: 50,
        exercises: [
          PlannedExercise(
            exerciseId: 'bench_press',
            name: 'Barbell Bench Press',
            category: 'chest',
            sets: 4,
            reps: '6-8',
            restSeconds: 90,
            primaryMuscles: ['chest', 'triceps', 'front_delts'],
            equipment: ['barbell', 'bench'],
            instructions: ['Retract scapula, lower bar to mid-chest, drive up.'],
            section: 'main',
            targetWeightKg: 65,
            tempo: '2-0-1',
            notes: 'Tight leg drive, touch lower sternum.',
          ),
          PlannedExercise(
            exerciseId: 'barbell_row',
            name: 'Bent-Over Barbell Row',
            category: 'back',
            sets: 4,
            reps: '6-8',
            restSeconds: 75,
            primaryMuscles: ['lats', 'upper_back'],
            equipment: ['barbell'],
            instructions: ['Torso locked at 45 degrees, pull bar to lower ribcage.'],
            section: 'main',
          ),
          PlannedExercise(
            exerciseId: 'overhead_press',
            name: 'Overhead Press',
            category: 'shoulders',
            sets: 3,
            reps: '8',
            restSeconds: 75,
            primaryMuscles: ['front_delts'],
            equipment: ['barbell'],
            instructions: ['Brace core, vertical bar path, lock out overhead.'],
            section: 'main',
          ),
          PlannedExercise(
            exerciseId: 'pull_up',
            name: 'Pull-Up',
            category: 'back',
            sets: 3,
            reps: '6-8',
            restSeconds: 60,
            primaryMuscles: ['lats', 'biceps'],
            equipment: ['pull_up_bar'],
            instructions: ['Full dead hang to chin clearing bar.'],
            section: 'main',
          ),
          PlannedExercise(
            exerciseId: 'triceps_rope_pushdown',
            name: 'Triceps Rope Pushdown',
            category: 'arms',
            sets: 3,
            reps: '10-12',
            restSeconds: 45,
            primaryMuscles: ['triceps'],
            equipment: ['cable'],
            instructions: ['Lock out triceps with rope ends spread.'],
            section: 'cooldown',
          ),
        ],
      ),
      PlannedDay(
        index: 2,
        focus: 'lower',
        name: 'Day 2: Lower Body Power',
        notes: 'Heavy squatting and posterior chain power.',
        estimatedMinutes: 50,
        exercises: [
          PlannedExercise(
            exerciseId: 'squat',
            name: 'Barbell Back Squat',
            category: 'legs',
            sets: 4,
            reps: '6-8',
            restSeconds: 90,
            primaryMuscles: ['quadriceps', 'glutes'],
            equipment: ['barbell', 'squat_rack'],
            instructions: ['Break at hips and knees simultaneously, hit parallel depth.'],
            section: 'main',
            targetWeightKg: 80,
          ),
          PlannedExercise(
            exerciseId: 'romanian_deadlift',
            name: 'Romanian Deadlift',
            category: 'legs',
            sets: 4,
            reps: '8',
            restSeconds: 75,
            primaryMuscles: ['hamstrings', 'glutes'],
            equipment: ['barbell'],
            instructions: ['Keep barbell glued to legs, drive hips through.'],
            section: 'main',
          ),
          PlannedExercise(
            exerciseId: 'leg_press',
            name: 'Leg Press',
            category: 'legs',
            sets: 3,
            reps: '10',
            restSeconds: 60,
            primaryMuscles: ['quadriceps'],
            equipment: ['machine'],
            instructions: ['Full range of motion, press through mid-foot.'],
            section: 'main',
          ),
          PlannedExercise(
            exerciseId: 'hanging_knee_raise',
            name: 'Hanging Knee Raise',
            category: 'core',
            sets: 3,
            reps: '12-15',
            restSeconds: 45,
            primaryMuscles: ['core'],
            equipment: ['pull_up_bar'],
            instructions: ['Controlled curl of pelvis without swinging.'],
            section: 'cooldown',
          ),
        ],
      ),
    ],
  ),
  TemplateWorkoutProgram(
    key: 'chest_hypertrophy_sculpt',
    name: 'Chest Hypertrophy & Sculpt Blast',
    description: 'Specialized chest specialization program. Combines heavy compound benching, upper-chest incline angles, and grouped superset flyes with clear directional cues.',
    objective: 'hypertrophy',
    difficulty: 'intermediate',
    badge: 'Chest Specialized',
    durationWeeks: 6,
    trainingDays: 2,
    exerciseCount: 13,
    days: [
      PlannedDay(
        index: 1,
        focus: 'push',
        name: 'Day 1: Heavy Chest & Triceps Dominance',
        notes: 'Primary chest day: compound power into incline upper-chest work, finishing with a high-density fly/push-up superset.',
        estimatedMinutes: 45,
        exercises: [
          PlannedExercise(
            exerciseId: 'push_up_warmup',
            name: 'Push-Up',
            category: 'chest',
            sets: 2,
            reps: '15',
            restSeconds: 45,
            primaryMuscles: ['chest', 'front_delts'],
            equipment: ['bodyweight'],
            instructions: ['Scapular and rotator activation: focus on smooth pectoral contractions.'],
            section: 'warmup',
            tempo: '2-0-2',
            notes: 'Warmup activation: engage pectorals, warm up rotator cuffs.',
          ),
          PlannedExercise(
            exerciseId: 'barbell_bench_press',
            name: 'Barbell Bench Press',
            category: 'chest',
            sets: 4,
            reps: '8-10',
            restSeconds: 90,
            primaryMuscles: ['chest', 'triceps', 'front_delts'],
            equipment: ['barbell', 'bench'],
            instructions: ['Lie on bench, grip slightly wider than shoulders, lower to mid-chest, drive up.'],
            section: 'main',
            targetWeightKg: 60,
            tempo: '2-1-1',
            notes: 'Foundation strength: tuck elbows ~45 degrees, drive through legs, touch lower sternum.',
          ),
          PlannedExercise(
            exerciseId: 'incline_dumbbell_press',
            name: 'Incline Dumbbell Press',
            category: 'chest',
            sets: 3,
            reps: '10-12',
            restSeconds: 75,
            primaryMuscles: ['chest', 'front_delts'],
            equipment: ['dumbbell', 'bench'],
            instructions: ['Set bench to 30 degrees, press dumbbells over upper chest, lower under control.'],
            section: 'main',
            targetWeightKg: 22,
            tempo: '2-0-1',
            notes: 'Upper pec bias: set incline to 30°, maintain wide flare, pause at bottom stretch.',
          ),
          PlannedExercise(
            exerciseId: 'cable_chest_fly',
            name: 'Cable Chest Fly',
            category: 'chest',
            sets: 3,
            reps: '12-15',
            restSeconds: 0,
            primaryMuscles: ['chest'],
            equipment: ['cable'],
            instructions: ['Bring handles together in a wide arc, squeeze chest at center.'],
            section: 'main',
            groupType: 'superset',
            groupLabel: 'A',
            notes: 'SUPERSET A1 (Isolation): Constant cable tension, squeeze inner pecs hard for 1 second.',
          ),
          PlannedExercise(
            exerciseId: 'push_up_burnout',
            name: 'Push-Up',
            category: 'chest',
            sets: 3,
            reps: '15-20',
            restSeconds: 60,
            primaryMuscles: ['chest', 'triceps'],
            equipment: ['bodyweight'],
            instructions: ['Immediate drop superset on the floor until pectoral failure.'],
            section: 'main',
            groupType: 'superset',
            groupLabel: 'A',
            notes: 'SUPERSET A2 (Burnout): Drop to floor immediately with 0s rest. Push out reps to failure.',
          ),
          PlannedExercise(
            exerciseId: 'triceps_rope_pushdown_cooldown',
            name: 'Triceps Rope Pushdown',
            category: 'arms',
            sets: 3,
            reps: '12-15',
            restSeconds: 45,
            primaryMuscles: ['triceps'],
            equipment: ['cable'],
            instructions: ['Lock out triceps with rope ends spread.'],
            section: 'cooldown',
            notes: 'Triceps lockout finisher: pin elbows to ribs, spread rope ends at bottom.',
          ),
          PlannedExercise(
            exerciseId: 'bench_dip_cooldown',
            name: 'Bench Dip',
            category: 'arms',
            sets: 3,
            reps: '12',
            restSeconds: 45,
            primaryMuscles: ['triceps'],
            equipment: ['bench'],
            instructions: ['Controlled pump to flush triceps and anterior deltoids.'],
            section: 'cooldown',
          ),
        ],
      ),
      PlannedDay(
        index: 2,
        focus: 'push',
        name: 'Day 2: Chest Accent & Volume Flush',
        notes: 'Secondary chest day: higher volume incline pressing and targeted stretch isolation paired with core stabilization.',
        estimatedMinutes: 40,
        exercises: [
          PlannedExercise(
            exerciseId: 'incline_dumbbell_press_2',
            name: 'Incline Dumbbell Press',
            category: 'chest',
            sets: 4,
            reps: '12',
            restSeconds: 60,
            primaryMuscles: ['chest'],
            equipment: ['dumbbell', 'bench'],
            instructions: ['Slow 2-second negative descent, feel the stretch.'],
            section: 'main',
          ),
          PlannedExercise(
            exerciseId: 'cable_chest_fly_2',
            name: 'Cable Chest Fly',
            category: 'chest',
            sets: 4,
            reps: '15',
            restSeconds: 45,
            primaryMuscles: ['chest'],
            equipment: ['cable'],
            instructions: ['Deep pectoral stretch at rear, tight squeeze in front.'],
            section: 'main',
          ),
          PlannedExercise(
            exerciseId: 'push_up_2',
            name: 'Push-Up',
            category: 'chest',
            sets: 3,
            reps: '15',
            restSeconds: 0,
            primaryMuscles: ['chest'],
            equipment: ['bodyweight'],
            instructions: ['High-tempo chest push-ups.'],
            section: 'main',
            groupType: 'superset',
            groupLabel: 'B',
            notes: 'SUPERSET B1: High-tempo chest pushups.',
          ),
          PlannedExercise(
            exerciseId: 'plank_2',
            name: 'Plank',
            category: 'core',
            sets: 3,
            durationSeconds: 45,
            restSeconds: 45,
            primaryMuscles: ['core'],
            equipment: ['bodyweight'],
            instructions: ['Immediate core stability hold.'],
            section: 'main',
            groupType: 'superset',
            groupLabel: 'B',
            notes: 'SUPERSET B2: Core stability hold.',
          ),
        ],
      ),
    ],
  ),
];

