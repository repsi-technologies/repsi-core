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

  // Diet additions
  final bool isDietLoading;
  final AiDietPlan? dietPlan;
  final Map<String, dynamic> dietAnswers;

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
      'muscle_focus': 'chest',
      'duration_minutes': 45,
      'limitations': <String>[],
      'health_flags': <String>[],
    },
    this.isDietLoading = false,
    this.dietPlan,
    this.dietAnswers = const {
      'goal': 'muscle_gain',
      'diet_type': 'non_veg',
      'meals_per_day': 4,
      'weight_kg': 70,
      'allergies': 'none',
    },
  });

  AiCoachState copyWith({
    bool? isLoading,
    bool? isPersonalizingAi,
    AiWorkoutSuggestion? suggestion,
    String? error,
    Map<String, dynamic>? answers,
    bool? isDietLoading,
    AiDietPlan? dietPlan,
    Map<String, dynamic>? dietAnswers,
  }) {
    return AiCoachState(
      isLoading: isLoading ?? this.isLoading,
      isPersonalizingAi: isPersonalizingAi ?? this.isPersonalizingAi,
      suggestion: suggestion ?? this.suggestion,
      error: error,
      answers: answers ?? this.answers,
      isDietLoading: isDietLoading ?? this.isDietLoading,
      dietPlan: dietPlan ?? this.dietPlan,
      dietAnswers: dietAnswers ?? this.dietAnswers,
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

  void updateDietAnswer(String key, dynamic value) {
    final updated = Map<String, dynamic>.from(state.dietAnswers);
    updated[key] = value;
    state = state.copyWith(dietAnswers: updated);
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
      // Curated offline/local fallback routine tailored to user's selected answers
      final fallback = _generateCuratedFallback(state.answers, useAi: useAi);
      state = state.copyWith(
        isLoading: false,
        isPersonalizingAi: false,
        suggestion: fallback,
      );
    }
  }

  Future<void> generateDietPlan({bool useAi = false}) async {
    state = state.copyWith(isDietLoading: true, error: null);

    try {
      final response = await _api.post(
        '/ai/diet/suggest',
        data: {
          'answers': state.dietAnswers,
          'use_ai': useAi,
        },
      );

      final data = response.data as Map<String, dynamic>;
      if (data['plan'] != null) {
        final plan = AiDietPlan.fromJson(Map<String, dynamic>.from(data['plan'] as Map));
        state = state.copyWith(
          isDietLoading: false,
          dietPlan: plan,
        );
        return;
      }
    } catch (_) {}

    // Curated fallback
    final dietType = state.dietAnswers['diet_type']?.toString() ?? 'non_veg';
    final goal = state.dietAnswers['goal']?.toString() ?? 'muscle_gain';
    final weight = (state.dietAnswers['weight_kg'] as num?)?.toInt() ?? 70;

    final fallback = _generateCuratedDietFallback(
      dietType: dietType,
      goal: goal,
      weightKg: weight,
    );

    state = state.copyWith(
      isDietLoading: false,
      dietPlan: fallback,
    );
  }

  AiWorkoutSuggestion _generateCuratedFallback(
    Map<String, dynamic> answers, {
    bool useAi = false,
  }) {
    final goal = answers['goal']?.toString() ?? 'hypertrophy';
    final focus = answers['muscle_focus']?.toString() ?? 'chest';
    final days = (answers['days_per_week'] as num?)?.toInt() ?? 4;

    String title;
    String overview;

    if (focus == 'chest') {
      title = 'Chest Hypertrophy & Sculpt Blast';
      overview =
          'Specialized routine targeting clavicular (upper) and sternal chest fibers with compound presses, superset cable flys, and bodyweight dips.';
    } else if (goal == 'fat_loss') {
      title = L10n.current.aiPlanFatLossTitle;
      overview = L10n.current.aiPlanFatLossBody;
    } else if (goal == 'strength') {
      title = L10n.current.aiPlanStrengthTitle;
      overview = L10n.current.aiPlanStrengthBody;
    } else {
      title = L10n.current.aiPlanUpperLowerTitle;
      overview = L10n.current.aiPlanUpperLowerBody;
    }

    List<AiWorkoutDay> planDays;

    if (focus == 'chest') {
      planDays = [
        const AiWorkoutDay(
          name: 'Day 1: Heavy Chest Power & Density',
          exercises: [
            AiExercise(
              exerciseId: 'ex_1',
              name: 'Barbell Bench Press',
              sets: 4,
              reps: '6-8 reps',
              restSeconds: 120,
              note: 'Drive feet into floor, retract scapula, 3-0-1-0 tempo.',
            ),
            AiExercise(
              exerciseId: 'ex_2',
              name: 'Incline Dumbbell Press',
              sets: 3,
              reps: '8-10 reps',
              restSeconds: 90,
              note: '30-degree incline, full stretch at the bottom.',
            ),
            AiExercise(
              exerciseId: 'ex_3',
              name: 'Cable Chest Fly',
              sets: 3,
              reps: '12-15 reps',
              restSeconds: 30,
              note: '⚡ Superset A: Squeeze inner pecs 1 sec at peak.',
            ),
            AiExercise(
              exerciseId: 'ex_4',
              name: 'Push-Ups (Burnout)',
              sets: 3,
              reps: 'To Failure',
              restSeconds: 90,
              note: '⚡ Superset A: Immediate burnout, maintain tight plank.',
            ),
            AiExercise(
              exerciseId: 'ex_5',
              name: 'Parallel Bar Dips (Chest Lean)',
              sets: 3,
              reps: '10-12 reps',
              restSeconds: 90,
              note: 'Lean torso 30° forward to emphasize lower/outer chest.',
            ),
          ],
        ),
        const AiWorkoutDay(
          name: 'Day 2: Back & Posterior Chain Pull',
          exercises: [
            AiExercise(
              exerciseId: 'ex_6',
              name: 'Conventional Deadlift',
              sets: 4,
              reps: '5 reps',
              restSeconds: 150,
              note: 'Brace core, explode hips through the lockout.',
            ),
            AiExercise(
              exerciseId: 'ex_7',
              name: 'Barbell Bent-Over Row',
              sets: 3,
              reps: '8-10 reps',
              restSeconds: 90,
              note: 'Pull towards lower ribcage, control eccentric.',
            ),
            AiExercise(
              exerciseId: 'ex_8',
              name: 'Wide-Grip Lat Pulldown',
              sets: 3,
              reps: '10-12 reps',
              restSeconds: 60,
              note: 'Depress shoulders before initiating arm pull.',
            ),
            AiExercise(
              exerciseId: 'ex_9',
              name: 'Barbell Bicep Curls',
              sets: 3,
              reps: '10-12 reps',
              restSeconds: 60,
              note: 'Keep elbows locked at sides.',
            ),
          ],
        ),
        if (days >= 3)
          const AiWorkoutDay(
            name: 'Day 3: Legs & Core Power',
            exercises: [
              AiExercise(
                exerciseId: 'ex_10',
                name: 'Barbell Back Squat',
                sets: 4,
                reps: '6-8 reps',
                restSeconds: 120,
                note: 'Break at hips and knees simultaneously, depth below parallel.',
              ),
              AiExercise(
                exerciseId: 'ex_11',
                name: 'Romanian Deadlift (Dumbbell)',
                sets: 3,
                reps: '8-10 reps',
                restSeconds: 90,
                note: 'Hinge back deeply until hamstring stretch is felt.',
              ),
              AiExercise(
                exerciseId: 'ex_12',
                name: 'Leg Press',
                sets: 3,
                reps: '12-15 reps',
                restSeconds: 75,
                note: 'Smooth tempo without locking knees at lockout.',
              ),
              AiExercise(
                exerciseId: 'ex_13',
                name: 'Standing Calf Raises',
                sets: 4,
                reps: '15 reps',
                restSeconds: 45,
                note: '2 second pause at top contraction.',
              ),
            ],
          ),
        if (days >= 4)
          const AiWorkoutDay(
            name: 'Day 4: Upper Body Sculpt & Delts',
            exercises: [
              AiExercise(
                exerciseId: 'ex_14',
                name: 'Overhead Standing Barbell Press',
                sets: 4,
                reps: '6-8 reps',
                restSeconds: 120,
                note: 'Clear head path, lock out directly over spine.',
              ),
              AiExercise(
                exerciseId: 'ex_15',
                name: 'Incline Dumbbell Fly',
                sets: 3,
                reps: '10-12 reps',
                restSeconds: 75,
                note: 'Focus on upper clavicular stretch.',
              ),
              AiExercise(
                exerciseId: 'ex_16',
                name: 'Lateral Dumbbell Raises',
                sets: 4,
                reps: '12-15 reps',
                restSeconds: 60,
                note: 'Pour the pitcher slightly at the apex.',
              ),
              AiExercise(
                exerciseId: 'ex_17',
                name: 'Rope Tricep Pushdowns',
                sets: 3,
                reps: '12-15 reps',
                restSeconds: 60,
                note: 'Flare rope outward at the bottom of movement.',
              ),
            ],
          ),
      ];
    } else {
      planDays = [
        const AiWorkoutDay(
          name: 'Day 1: Upper Body Strength & Hypertrophy',
          exercises: [
            AiExercise(
              exerciseId: 'ex_1',
              name: 'Barbell Bench Press',
              sets: 4,
              reps: '6-8 reps',
              restSeconds: 90,
              note: 'Focus on explosive concentric drive.',
            ),
            AiExercise(
              exerciseId: 'ex_7',
              name: 'Bent-Over Barbell Row',
              sets: 4,
              reps: '8-10 reps',
              restSeconds: 75,
              note: 'Torso angled 45 degrees, pull to hip.',
            ),
            AiExercise(
              exerciseId: 'ex_14',
              name: 'Overhead Press',
              sets: 3,
              reps: '8-10 reps',
              restSeconds: 60,
              note: 'Full overhead extension.',
            ),
          ],
        ),
        const AiWorkoutDay(
          name: 'Day 2: Lower Body Power & Core',
          exercises: [
            AiExercise(
              exerciseId: 'ex_10',
              name: 'Barbell Back Squat',
              sets: 4,
              reps: '6-8 reps',
              restSeconds: 120,
              note: 'Solid core brace, drive out of the hole.',
            ),
            AiExercise(
              exerciseId: 'ex_11',
              name: 'Romanian Deadlift',
              sets: 3,
              reps: '8-10 reps',
              restSeconds: 90,
              note: 'Controlled eccentric lowering.',
            ),
          ],
        ),
      ];
    }

    return AiWorkoutSuggestion(
      source: useAi ? 'ai' : 'rules',
      plan: AiWorkoutPlan(
        title: title,
        overview: overview,
        days: planDays,
        tips: const [
          'Maintain 1-2 reps in reserve on compound lifts.',
          'Consume 20-30g protein within 90 minutes post session.',
          'Hydrate with minimum 500ml water before training.',
        ],
      ),
      disclaimer: L10n.current.aiDisclaimerShort,
    );
  }

  AiDietPlan _generateCuratedDietFallback({
    required String dietType,
    required String goal,
    required int weightKg,
  }) {
    final isLoss = goal == 'fat_loss';
    final isSurplus = goal == 'muscle_gain';

    final calories = isLoss
        ? (weightKg * 26).round()
        : isSurplus
            ? (weightKg * 34).round()
            : (weightKg * 30).round();

    final protein = (weightKg * (isSurplus ? 2.1 : isLoss ? 2.2 : 1.8)).round();
    final fat = ((calories * 0.25) / 9).round();
    final carbs = ((calories - (protein * 4) - (fat * 9)) / 4).round();
    final waterTarget = (weightKg * 42).round();

    List<AiDietMealSlot> meals;

    if (dietType == 'non_veg') {
      meals = [
        const AiDietMealSlot(
          slot: 'breakfast',
          name: 'Breakfast: Power Fuel & Protein Oatmeal',
          targetCalories: 480,
          items: [
            AiDietMealItem(food: 'Rolled Oats (cooked with milk or water)', portion: '75g', calories: 280, protein: 10),
            AiDietMealItem(food: 'Whey Protein Scoop', portion: '30g', calories: 120, protein: 24),
            AiDietMealItem(food: 'Crushed Almonds & Fresh Banana', portion: '1 medium', calories: 80, protein: 2),
          ],
        ),
        const AiDietMealSlot(
          slot: 'mid_morning',
          name: 'Mid-Morning Snack: Clean Eggs & Green Tea',
          targetCalories: 210,
          items: [
            AiDietMealItem(food: 'Whole Boiled Eggs', portion: '2 large', calories: 150, protein: 13),
            AiDietMealItem(food: 'Egg Whites', portion: '2 large', calories: 34, protein: 8),
            AiDietMealItem(food: 'Green Tea (Antioxidant flush)', portion: '1 cup', calories: 0, protein: 0),
          ],
        ),
        const AiDietMealSlot(
          slot: 'lunch',
          name: 'Lunch: High-Protein Chicken Bowl',
          targetCalories: 640,
          items: [
            AiDietMealItem(food: 'Grilled Chicken Breast', portion: '200g', calories: 330, protein: 54),
            AiDietMealItem(food: 'Brown Basmati Rice', portion: '150g cooked', calories: 180, protein: 4),
            AiDietMealItem(food: 'Steamed Broccoli, Carrots & Cucumber Salad', portion: '1 bowl', calories: 60, protein: 3),
            AiDietMealItem(food: 'Low-Fat Fresh Curd', portion: '100g', calories: 70, protein: 4),
          ],
        ),
        const AiDietMealSlot(
          slot: 'evening_snack',
          name: 'Pre-Workout: Fast Carbs & Energy Surge',
          targetCalories: 220,
          items: [
            AiDietMealItem(food: 'Organic Rice Cakes with Peanut Butter', portion: '2 cakes + 1 tbsp', calories: 160, protein: 5),
            AiDietMealItem(food: 'Black Coffee or Pre-Workout Drink', portion: '1 cup', calories: 5, protein: 0),
          ],
        ),
        const AiDietMealSlot(
          slot: 'dinner',
          name: 'Dinner: Lean Fish / Chicken Stir-Fry',
          targetCalories: 520,
          items: [
            AiDietMealItem(food: 'Pan-Seared Fish Fillet or Chicken Breast', portion: '180g', calories: 280, protein: 44),
            AiDietMealItem(food: 'Quinoa or Multigrain Roti', portion: '2 rotis', calories: 160, protein: 6),
            AiDietMealItem(food: 'Sauteed Spinach with Garlic & Olive Oil', portion: '1 cup', calories: 80, protein: 3),
          ],
        ),
      ];
    } else {
      meals = [
        const AiDietMealSlot(
          slot: 'breakfast',
          name: 'Breakfast: Paneer Bhurji & Sprouted Toast',
          targetCalories: 490,
          items: [
            AiDietMealItem(food: 'Low-Fat Paneer Bhurji with Bell Peppers', portion: '150g', calories: 290, protein: 28),
            AiDietMealItem(food: 'Whole Wheat Toast with Chia Seeds', portion: '2 slices', calories: 150, protein: 6),
            AiDietMealItem(food: 'Black Coffee or Cinnamon Tea', portion: '1 cup', calories: 0, protein: 0),
          ],
        ),
        const AiDietMealSlot(
          slot: 'mid_morning',
          name: 'Mid-Morning: Greek Yogurt & Roasted Chana',
          targetCalories: 240,
          items: [
            AiDietMealItem(food: 'High-Protein Plain Greek Yogurt', portion: '150g', calories: 140, protein: 15),
            AiDietMealItem(food: 'Roasted Bengal Gram (Chana)', portion: '40g', calories: 100, protein: 8),
          ],
        ),
        const AiDietMealSlot(
          slot: 'lunch',
          name: 'Lunch: Soya Chunks Curry & Brown Rice',
          targetCalories: 620,
          items: [
            AiDietMealItem(food: 'Boiled & Spiced Soya Chunks Gravy', portion: '60g raw (high protein)', calories: 240, protein: 32),
            AiDietMealItem(food: 'Steamed Brown Rice', portion: '150g cooked', calories: 180, protein: 4),
            AiDietMealItem(food: 'Mixed Sprout Salad with Lemon & Herbs', portion: '1 bowl', calories: 110, protein: 9),
            AiDietMealItem(food: 'Fresh Homemade Dahi', portion: '100g', calories: 70, protein: 4),
          ],
        ),
        const AiDietMealSlot(
          slot: 'evening_snack',
          name: 'Pre-Workout: Plant Protein & Fruit',
          targetCalories: 230,
          items: [
            AiDietMealItem(food: 'Plant / Whey Protein Shake', portion: '1 scoop', calories: 120, protein: 24),
            AiDietMealItem(food: 'Fresh Banana or Apple', portion: '1 medium', calories: 95, protein: 1),
          ],
        ),
        const AiDietMealSlot(
          slot: 'dinner',
          name: 'Dinner: Grilled Tofu/Paneer & Moong Dal',
          targetCalories: 510,
          items: [
            AiDietMealItem(food: 'Marinated Tofu or Low-Fat Paneer Tikka', portion: '160g', calories: 240, protein: 26),
            AiDietMealItem(food: 'Yellow Moong Dal with Spinach', portion: '1 bowl', calories: 150, protein: 11),
            AiDietMealItem(food: 'Multigrain Roti', portion: '1 piece', calories: 90, protein: 3),
          ],
        ),
      ];
    }

    return AiDietPlan(
      name: isSurplus
          ? 'Muscle Hypertrophy High-Protein Diet'
          : isLoss
              ? 'Caloric Deficit Lean Shred Plan'
              : 'Balanced Performance Nutrition',
      description:
          'Scientifically proportioned for $weightKg kg bodyweight with ~${protein}g daily protein for rapid tissue repair and peak performance.',
      dailyCalories: calories,
      proteinGrams: protein,
      carbsGrams: carbs,
      fatGrams: fat,
      waterMlTarget: waterTarget,
      meals: meals,
      tips: [
        'Drink 500ml water within 15 minutes of waking up.',
        'Consume minimum 25g protein within 60-90 minutes post workout.',
        'Prioritize 7-8 hours sleep to optimize insulin sensitivity and muscle protein synthesis.',
      ],
    );
  }
}

final aiCoachProvider =
    StateNotifierProvider<AiCoachNotifier, AiCoachState>((ref) {
  final api = ref.watch(apiClientProvider);
  return AiCoachNotifier(api);
});
