import '../../../core/api/api_time.dart';

enum FitnessGoal {
  fatLoss('fat_loss'),
  muscleGain('muscle_gain'),
  strength('strength'),
  endurance('endurance'),
  generalFitness('general_fitness'),
  mobility('mobility');

  final String code;
  const FitnessGoal(this.code);

  static FitnessGoal fromCode(String? code) =>
      FitnessGoal.values.firstWhere((g) => g.code == code, orElse: () => FitnessGoal.generalFitness);
}

enum FitnessLevel {
  beginner,
  intermediate,
  advanced;

  static FitnessLevel fromCode(String? code) =>
      FitnessLevel.values.firstWhere((l) => l.name == code, orElse: () => FitnessLevel.beginner);
}

/// Focus areas accepted by the API (app/services/coaching.py FOCUS_AREAS).
const focusAreaCodes = [
  'full_body', 'upper_body', 'lower_body', 'core', 'arms', 'back', 'chest', 'glutes', 'cardio', 'flexibility',
];

class GoalDraft {
  FitnessGoal? goal;
  FitnessLevel level;
  int daysPerWeek;
  int sessionMinutes;
  Set<String> focusAreas;

  GoalDraft({this.goal, this.level = FitnessLevel.beginner, this.daysPerWeek = 3, this.sessionMinutes = 45,
      Set<String>? focusAreas})
      : focusAreas = focusAreas ?? <String>{};

  factory GoalDraft.from(MemberGoal? g) => g == null
      ? GoalDraft()
      : GoalDraft(goal: g.goal, level: g.level, daysPerWeek: g.daysPerWeek, sessionMinutes: g.sessionMinutes,
          focusAreas: g.focusAreas.toSet());

  Map<String, dynamic> toJson() => {
        'goal': goal!.code,
        'fitness_level': level.name,
        'days_per_week': daysPerWeek,
        'session_minutes': sessionMinutes,
        'focus_areas': focusAreas.toList(),
      };
}

class MemberGoal {
  final String id;
  final FitnessGoal goal;
  final FitnessLevel level;
  final int daysPerWeek;
  final int sessionMinutes;
  final List<String> focusAreas;
  final DateTime? createdAt;

  const MemberGoal({required this.id, required this.goal, required this.level, required this.daysPerWeek,
      required this.sessionMinutes, required this.focusAreas, this.createdAt});

  factory MemberGoal.fromJson(Map<String, dynamic> j) => MemberGoal(
        id: j['id'] as String? ?? '',
        goal: FitnessGoal.fromCode(j['goal'] as String?),
        level: FitnessLevel.fromCode(j['fitness_level'] as String?),
        daysPerWeek: (j['days_per_week'] as num?)?.toInt() ?? 3,
        sessionMinutes: (j['session_minutes'] as num?)?.toInt() ?? 45,
        focusAreas: ((j['focus_areas'] as List?) ?? const []).map((e) => e.toString()).toList(),
        createdAt: parseApiDateTime(j['created_at']),
      );
}

class CoachProfile {
  final String id;
  final String name;
  final String? specialization;
  final String? bio;
  final String? experience;
  final String? photoUrl;
  final bool acceptingClients;
  final String? relationshipId;

  const CoachProfile({required this.id, required this.name, this.specialization, this.bio, this.experience,
      this.photoUrl, this.acceptingClients = true, this.relationshipId});

  factory CoachProfile.fromJson(Map<String, dynamic> j) => CoachProfile(
        id: j['id'] as String? ?? '',
        name: j['name'] as String? ?? '',
        specialization: _blank(j['specialization']),
        bio: _blank(j['bio']),
        experience: _blank(j['experience']),
        photoUrl: _blank(j['profile_photo']),
        acceptingClients: j['accepting_clients'] as bool? ?? true,
        relationshipId: j['relationship_id'] as String?,
      );

  String get initials {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    return (parts.first[0] + (parts.length > 1 ? parts.last[0] : '')).toUpperCase();
  }
}

String? _blank(Object? v) {
  final s = v?.toString().trim();
  return (s == null || s.isEmpty) ? null : s;
}

class TrainerRequestItem {
  final String id;
  final String memberId;
  final String memberName;
  final String kind; // trainer | personal_training
  final String status; // pending | approved | declined | cancelled
  final String? message;
  final String? preferredTrainerId;
  final String? preferredTrainerName;
  final String? assignedTrainerName;
  final String? resolutionNote;
  final DateTime? createdAt;
  final MemberGoal? memberGoal;

  const TrainerRequestItem({required this.id, required this.memberId, required this.memberName, required this.kind,
      required this.status, this.message, this.preferredTrainerId, this.preferredTrainerName, this.assignedTrainerName,
      this.resolutionNote, this.createdAt, this.memberGoal});

  bool get isPending => status == 'pending';
  bool get isPersonalTraining => kind == 'personal_training';

  factory TrainerRequestItem.fromJson(Map<String, dynamic> j) => TrainerRequestItem(
        id: j['id'] as String,
        memberId: j['member_id'] as String? ?? '',
        memberName: j['member_name'] as String? ?? '',
        kind: j['kind'] as String? ?? 'trainer',
        status: j['status'] as String? ?? 'pending',
        message: _blank(j['message']),
        preferredTrainerId: j['preferred_trainer_id'] as String?,
        preferredTrainerName: _blank(j['preferred_trainer_name']),
        assignedTrainerName: _blank(j['assigned_trainer_name']),
        resolutionNote: _blank(j['resolution_note']),
        createdAt: parseApiDateTime(j['created_at']),
        memberGoal: j['member_goal'] == null ? null : MemberGoal.fromJson(Map<String, dynamic>.from(j['member_goal'] as Map)),
      );
}

class TrainerRequestPage {
  final List<TrainerRequestItem> items;
  final int pendingCount;
  const TrainerRequestPage({required this.items, required this.pendingCount});

  factory TrainerRequestPage.fromJson(Map<String, dynamic> j) => TrainerRequestPage(
        items: ((j['items'] as List?) ?? const [])
            .map((e) => TrainerRequestItem.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
        pendingCount: (j['pending_count'] as num?)?.toInt() ?? 0,
      );
}

class CoachingOverview {
  final String memberId;
  final MemberGoal? goal;
  final List<CoachProfile> trainers;
  final List<TrainerRequestItem> requests;
  final bool hasPendingRequest;

  const CoachingOverview({required this.memberId, this.goal, required this.trainers, required this.requests,
      required this.hasPendingRequest});

  TrainerRequestItem? get pendingRequest => requests.where((r) => r.isPending).firstOrNull;

  factory CoachingOverview.fromJson(Map<String, dynamic> j) => CoachingOverview(
        memberId: j['member_id'] as String? ?? '',
        goal: j['goal'] == null ? null : MemberGoal.fromJson(Map<String, dynamic>.from(j['goal'] as Map)),
        trainers: ((j['trainers'] as List?) ?? const [])
            .map((e) => CoachProfile.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
        requests: ((j['requests'] as List?) ?? const [])
            .map((e) => TrainerRequestItem.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
        hasPendingRequest: j['has_pending_request'] as bool? ?? false,
      );
}

class PlannedExercise {
  final String exerciseId;
  final String name;
  final String category;
  final int sets;
  final String? reps;
  final int? durationSeconds;
  final int restSeconds;
  final List<String> primaryMuscles;
  final List<String> equipment;
  final List<String> instructions;
  final String? description;
  final String? mediaUrl;
  final String? mediaType;

  const PlannedExercise({required this.exerciseId, required this.name, required this.category, required this.sets,
      this.reps, this.durationSeconds, required this.restSeconds, required this.primaryMuscles,
      required this.equipment, required this.instructions, this.description, this.mediaUrl, this.mediaType});

  bool get isTimed => durationSeconds != null;

  factory PlannedExercise.fromJson(Map<String, dynamic> j) {
    List<String> list(String k) => ((j[k] as List?) ?? const []).map((e) => e.toString()).toList();
    return PlannedExercise(
      exerciseId: j['exercise_id'] as String? ?? '',
      name: j['name'] as String? ?? '',
      category: j['category'] as String? ?? '',
      sets: (j['sets'] as num?)?.toInt() ?? 1,
      reps: j['reps'] as String?,
      durationSeconds: (j['duration_seconds'] as num?)?.toInt(),
      restSeconds: (j['rest_seconds'] as num?)?.toInt() ?? 60,
      primaryMuscles: list('primary_muscles'),
      equipment: list('equipment'),
      instructions: list('instructions'),
      description: _blank(j['description']),
      mediaUrl: _blank(j['media_url']),
      mediaType: _blank(j['media_type']),
    );
  }
}

class PlannedDay {
  final int index;
  final String focus; // full_body | upper | lower | push | pull | legs | conditioning | cardio | mobility
  final int estimatedMinutes;
  final List<PlannedExercise> exercises;

  const PlannedDay({required this.index, required this.focus, required this.estimatedMinutes, required this.exercises});

  factory PlannedDay.fromJson(Map<String, dynamic> j) => PlannedDay(
        index: (j['index'] as num?)?.toInt() ?? 1,
        focus: j['focus'] as String? ?? 'full_body',
        estimatedMinutes: (j['estimated_minutes'] as num?)?.toInt() ?? 45,
        exercises: ((j['exercises'] as List?) ?? const [])
            .map((e) => PlannedExercise.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
      );
}

class WorkoutPlanSuggestion {
  final FitnessGoal goal;
  final FitnessLevel level;
  final int daysPerWeek;
  final int sessionMinutes;
  final List<PlannedDay> days;

  const WorkoutPlanSuggestion({required this.goal, required this.level, required this.daysPerWeek,
      required this.sessionMinutes, required this.days});

  factory WorkoutPlanSuggestion.fromJson(Map<String, dynamic> j) => WorkoutPlanSuggestion(
        goal: FitnessGoal.fromCode(j['goal'] as String?),
        level: FitnessLevel.fromCode(j['fitness_level'] as String?),
        daysPerWeek: (j['days_per_week'] as num?)?.toInt() ?? 3,
        sessionMinutes: (j['session_minutes'] as num?)?.toInt() ?? 45,
        days: ((j['days'] as List?) ?? const []).map((e) => PlannedDay.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
      );
}
