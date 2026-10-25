
import '../../../l10n/l10n.dart';class AiExercise {
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
      name: json['name']?.toString() ?? L10n.current.aiWorkoutDay,
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
      title: json['title']?.toString() ?? L10n.current.aiPersonalPlan,
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
          L10n.current.aiDisclaimerShort,
    );
  }
}

class AiDietMealItem {
  final String food;
  final String? portion;
  final int? calories;
  final int? protein;

  const AiDietMealItem({
    required this.food,
    this.portion,
    this.calories,
    this.protein,
  });

  factory AiDietMealItem.fromJson(Map<String, dynamic> json) {
    return AiDietMealItem(
      food: json['food']?.toString() ?? json['name']?.toString() ?? '',
      portion: json['portion']?.toString(),
      calories: (json['calories'] as num?)?.toInt(),
      protein: (json['protein'] as num?)?.toInt(),
    );
  }
}

class AiDietMealSlot {
  final String slot;
  final String name;
  final int? targetCalories;
  final List<AiDietMealItem> items;

  const AiDietMealSlot({
    required this.slot,
    required this.name,
    this.targetCalories,
    required this.items,
  });

  factory AiDietMealSlot.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    return AiDietMealSlot(
      slot: json['slot']?.toString() ?? 'meal',
      name: json['name']?.toString() ?? 'Meal',
      targetCalories: (json['target_calories'] as num?)?.toInt(),
      items: rawItems
          .whereType<Map<String, dynamic>>()
          .map((i) => AiDietMealItem.fromJson(i))
          .toList(),
    );
  }
}

class AiDietPlan {
  final String name;
  final String description;
  final int dailyCalories;
  final int proteinGrams;
  final int carbsGrams;
  final int fatGrams;
  final int waterMlTarget;
  final List<AiDietMealSlot> meals;
  final List<String> tips;

  const AiDietPlan({
    required this.name,
    required this.description,
    required this.dailyCalories,
    required this.proteinGrams,
    required this.carbsGrams,
    required this.fatGrams,
    required this.waterMlTarget,
    required this.meals,
    required this.tips,
  });

  factory AiDietPlan.fromJson(Map<String, dynamic> json) {
    final rawMeals = json['meals'] as List<dynamic>? ?? [];
    final rawTips = json['tips'] as List<dynamic>? ?? [];
    return AiDietPlan(
      name: json['name']?.toString() ?? 'Tailored Nutrition Plan',
      description: json['description']?.toString() ?? '',
      dailyCalories: (json['daily_calories'] as num?)?.toInt() ?? 2200,
      proteinGrams: (json['protein_grams'] as num?)?.toInt() ?? 150,
      carbsGrams: (json['carbs_grams'] as num?)?.toInt() ?? 220,
      fatGrams: (json['fat_grams'] as num?)?.toInt() ?? 65,
      waterMlTarget: (json['water_ml_target'] as num?)?.toInt() ?? 3000,
      meals: rawMeals
          .whereType<Map<String, dynamic>>()
          .map((m) => AiDietMealSlot.fromJson(m))
          .toList(),
      tips: rawTips.map((t) => t.toString()).toList(),
    );
  }
}

