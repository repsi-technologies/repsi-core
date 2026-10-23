class AiExercise {
  final String exerciseId;
  final String name;
  final int sets;
  final String reps;
  final int? restSeconds;
  final String? note;

  const AiExercise({
    required this.exerciseId,
    required this.name,
    required this.sets,
    required this.reps,
    this.restSeconds,
    this.note,
  });

  factory AiExercise.fromJson(Map<String, dynamic> json) {
    return AiExercise(
      exerciseId: json['exercise_id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Exercise',
      sets: (json['sets'] as num?)?.toInt() ?? 3,
      reps: json['reps']?.toString() ?? '10-12 reps',
      restSeconds: (json['rest_seconds'] as num?)?.toInt(),
      note: json['note']?.toString(),
    );
  }
}

class AiWorkoutDay {
  final String name;
  final List<AiExercise> exercises;

  const AiWorkoutDay({
    required this.name,
    required this.exercises,
  });

  factory AiWorkoutDay.fromJson(Map<String, dynamic> json) {
    final rawExercises = json['exercises'] as List<dynamic>? ?? [];
    return AiWorkoutDay(
      name: json['name']?.toString() ?? 'Workout Day',
      exercises: rawExercises
          .whereType<Map<String, dynamic>>()
          .map((e) => AiExercise.fromJson(e))
          .toList(),
    );
  }
}

class AiWorkoutPlan {
  final String title;
  final String overview;
  final List<AiWorkoutDay> days;
  final List<String> tips;

  const AiWorkoutPlan({
    required this.title,
    required this.overview,
    required this.days,
    required this.tips,
  });

  factory AiWorkoutPlan.fromJson(Map<String, dynamic> json) {
    final rawDays = json['days'] as List<dynamic>? ?? [];
    final rawTips = json['tips'] as List<dynamic>? ?? [];
    return AiWorkoutPlan(
      title: json['title']?.toString() ?? 'Personalized Workout Plan',
      overview: json['overview']?.toString() ?? '',
      days: rawDays
          .whereType<Map<String, dynamic>>()
          .map((d) => AiWorkoutDay.fromJson(d))
          .toList(),
      tips: rawTips.map((t) => t.toString()).toList(),
    );
  }
}

class AiWorkoutSuggestion {
  final AiWorkoutPlan? plan;
  final String source; // "ai", "rules", "cached"
  final String? safetyMessage;
  final String? notice;
  final String disclaimer;

  const AiWorkoutSuggestion({
    this.plan,
    required this.source,
    this.safetyMessage,
    this.notice,
    required this.disclaimer,
  });

  factory AiWorkoutSuggestion.fromJson(Map<String, dynamic> json) {
    return AiWorkoutSuggestion(
      plan: json['plan'] != null
          ? AiWorkoutPlan.fromJson(json['plan'] as Map<String, dynamic>)
          : null,
      source: json['source']?.toString() ?? 'rules',
      safetyMessage: json['safety_message']?.toString(),
      notice: json['notice']?.toString(),
      disclaimer: json['disclaimer']?.toString() ??
          'Always consult your physician before beginning any exercise program.',
    );
  }
}
