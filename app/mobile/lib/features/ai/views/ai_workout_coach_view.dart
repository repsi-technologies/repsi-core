import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/repsi_palette.dart';
import '../../../l10n/l10n.dart';
import '../../../shared/animations/repsi_press.dart';
import '../../../shared/widgets/repsi_badge.dart';
import '../../../shared/widgets/repsi_button.dart';
import '../../../shared/widgets/repsi_card.dart';
import '../../coaching/data/coaching_models.dart';
import '../../coaching/views/workout_runner_view.dart';
import '../models/workout_plan_model.dart';
import '../providers/ai_coach_provider.dart';

class AiWorkoutCoachView extends ConsumerStatefulWidget {
  const AiWorkoutCoachView({super.key});

  @override
  ConsumerState<AiWorkoutCoachView> createState() => _AiWorkoutCoachViewState();
}

class _AiWorkoutCoachViewState extends ConsumerState<AiWorkoutCoachView> {
  String _activeTab = 'workout'; // 'workout' or 'diet'

  final Map<String, String> _muscleFocusLabels = const {
    'chest': '⚡ Chest & Triceps Hypertrophy',
    'back': 'Back & Biceps Pull',
    'legs': 'Legs & Core Strength',
    'shoulders': 'Shoulders & Arms',
    'full_body': 'Full Body Balance',
  };

  Map<String, String> get _goalLabels => {
    'hypertrophy': context.l10n.goalMuscleGain,
    'fat_loss': context.l10n.goalFatLoss,
    'strength': context.l10n.goalStrength,
    'endurance': context.l10n.goalEndurance,
    'general_fitness': context.l10n.goalWellness,
  };

  Map<String, String> get _expLabels => {
    'beginner': context.l10n.expBeginner,
    'intermediate': context.l10n.expIntermediate,
    'advanced': context.l10n.expAdvanced,
  };

  Map<String, String> get _equipLabels => {
    'full_gym': context.l10n.equipFullGym,
    'dumbbells': context.l10n.equipDumbbells,
    'bodyweight': context.l10n.equipBodyweight,
  };

  final Map<String, String> _dietTypeLabels = const {
    'non_veg': 'Non-Vegetarian (Chicken, Fish, Eggs)',
    'vegetarian': 'Vegetarian (Paneer, Dairy, Legumes)',
    'eggetarian': 'Eggetarian (Vegetarian + Eggs)',
    'vegan': '100% Plant Based / Vegan',
    'keto': 'High-Protein Keto',
  };

  final Map<String, String> _dietGoalLabels = const {
    'muscle_gain': 'Muscle Building Surplus (+300 kcal)',
    'fat_loss': 'Fat Loss Deficit (-400 kcal)',
    'maintenance': 'Lean Recomposition (Maintenance)',
  };

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(aiCoachProvider);
    final notifier = ref.read(aiCoachProvider.notifier);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : context.palette.background,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkPrimarySoft : context.palette.primarySoft,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(LucideIcons.sparkles, size: 18, color: AppColors.primary),
            ),
            const SizedBox(width: 10),
            Text(
              'AI Coach & Nutrition',
              style: AppTypography.headingSmall.copyWith(
                fontWeight: FontWeight.w700,
                color: isDark ? AppColors.darkText : context.palette.text,
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.pageHorizontalPadding,
            vertical: 16,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Dual Mode Segment Switcher
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkSurface : context.palette.surfaceSubtle,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : context.palette.border,
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _buildSegmentButton(
                        label: 'Workout Coach',
                        icon: LucideIcons.dumbbell,
                        isSelected: _activeTab == 'workout',
                        onTap: () => setState(() => _activeTab = 'workout'),
                        isDark: isDark,
                      ),
                    ),
                    Expanded(
                      child: _buildSegmentButton(
                        label: 'Diet & Nutrition',
                        icon: LucideIcons.utensils,
                        isSelected: _activeTab == 'diet',
                        onTap: () => setState(() => _activeTab = 'diet'),
                        isDark: isDark,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // 2. Active Tab Content
              if (_activeTab == 'workout') ...[
                _buildWorkoutCoachTab(context, state, notifier, isDark),
              ] else ...[
                _buildDietCoachTab(context, state, notifier, isDark),
              ],

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSegmentButton({
    required String label,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return RepsiPress(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary
              : Colors.transparent,
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.3),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 15,
              color: isSelected
                  ? Colors.white
                  : (isDark ? AppColors.darkTextSecondary : context.palette.textSecondary),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected
                    ? Colors.white
                    : (isDark ? AppColors.darkText : context.palette.text),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── WORKOUT COACH SECTION ────────────────────────────────────────────────

  Widget _buildWorkoutCoachTab(
    BuildContext context,
    AiCoachState state,
    AiCoachNotifier notifier,
    bool isDark,
  ) {
    final selectedMuscle = state.answers['muscle_focus']?.toString() ?? 'chest';
    final selectedGoal = state.answers['goal']?.toString() ?? 'hypertrophy';
    final selectedExp = state.answers['experience']?.toString() ?? 'intermediate';
    final selectedDays = (state.answers['days_per_week'] as num?)?.toInt() ?? 4;
    final selectedEquip = state.answers['equipment']?.toString() ?? 'full_gym';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Questionnaire Card
        RepsiCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Muscle Target Focus
              _buildSectionHeader('Target Muscle / Specialization'),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _muscleFocusLabels.entries.map((entry) {
                  final isSelected = selectedMuscle == entry.key;
                  return _buildFilterChip(
                    label: entry.value,
                    isSelected: isSelected,
                    onTap: () => notifier.updateAnswer('muscle_focus', entry.key),
                    highlight: entry.key == 'chest',
                  );
                }).toList(),
              ),

              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 16),

              // Primary Goal
              _buildSectionHeader(context.l10n.aiQ1),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _goalLabels.entries.map((entry) {
                  final isSelected = selectedGoal == entry.key;
                  return _buildFilterChip(
                    label: entry.value,
                    isSelected: isSelected,
                    onTap: () => notifier.updateAnswer('goal', entry.key),
                  );
                }).toList(),
              ),

              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 16),

              // Experience Level
              _buildSectionHeader(context.l10n.aiQ2),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _expLabels.entries.map((entry) {
                  final isSelected = selectedExp == entry.key;
                  return _buildFilterChip(
                    label: entry.value,
                    isSelected: isSelected,
                    onTap: () => notifier.updateAnswer('experience', entry.key),
                  );
                }).toList(),
              ),

              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 16),

              // Weekly Frequency
              _buildSectionHeader(context.l10n.aiQ3),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [2, 3, 4, 5, 6].map((day) {
                  final isSelected = selectedDays == day;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3),
                      child: InkWell(
                        onTap: () {
                          HapticFeedback.selectionClick();
                          notifier.updateAnswer('days_per_week', day);
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppColors.primary
                                : (isDark ? AppColors.darkSurfaceElevated : context.palette.surfaceSubtle),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isSelected
                                  ? AppColors.primary
                                  : (isDark ? AppColors.darkBorder : context.palette.border),
                            ),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            '$day d',
                            style: TextStyle(
                              color: isSelected
                                  ? Colors.white
                                  : (isDark ? AppColors.darkText : context.palette.text),
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 16),

              // Equipment
              _buildSectionHeader(context.l10n.aiQ4),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _equipLabels.entries.map((entry) {
                  final isSelected = selectedEquip == entry.key;
                  return _buildFilterChip(
                    label: entry.value,
                    isSelected: isSelected,
                    onTap: () => notifier.updateAnswer('equipment', entry.key),
                  );
                }).toList(),
              ),

              const SizedBox(height: 22),

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: RepsiButton(
                      text: context.l10n.generateRoutine,
                      isLoading: state.isLoading,
                      leadingIcon: const Icon(LucideIcons.dumbbell, size: 18),
                      onPressed: () => notifier.generatePlan(useAi: false),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: RepsiButton(
                      text: context.l10n.personalizeAi,
                      variant: RepsiButtonVariant.outline,
                      isLoading: state.isPersonalizingAi,
                      leadingIcon: const Icon(LucideIcons.sparkles, size: 18, color: AppColors.primary),
                      onPressed: () => notifier.generatePlan(useAi: true),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Generated Plan Results
        if (state.suggestion != null)
          _buildRoutineResult(context, state.suggestion!, isDark),
      ],
    );
  }

  // ─── DIET & NUTRITION COACH SECTION ───────────────────────────────────────

  Widget _buildDietCoachTab(
    BuildContext context,
    AiCoachState state,
    AiCoachNotifier notifier,
    bool isDark,
  ) {
    final selectedDietType = state.dietAnswers['diet_type']?.toString() ?? 'non_veg';
    final selectedDietGoal = state.dietAnswers['goal']?.toString() ?? 'muscle_gain';
    final selectedWeight = (state.dietAnswers['weight_kg'] as num?)?.toInt() ?? 70;
    final selectedMeals = (state.dietAnswers['meals_per_day'] as num?)?.toInt() ?? 4;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        RepsiCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSectionHeader('Dietary Style & Food Preferences'),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _dietTypeLabels.entries.map((entry) {
                  final isSelected = selectedDietType == entry.key;
                  return _buildFilterChip(
                    label: entry.value,
                    isSelected: isSelected,
                    onTap: () => notifier.updateDietAnswer('diet_type', entry.key),
                  );
                }).toList(),
              ),

              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 16),

              _buildSectionHeader('Nutrition Goal'),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _dietGoalLabels.entries.map((entry) {
                  final isSelected = selectedDietGoal == entry.key;
                  return _buildFilterChip(
                    label: entry.value,
                    isSelected: isSelected,
                    onTap: () => notifier.updateDietAnswer('goal', entry.key),
                  );
                }).toList(),
              ),

              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 16),

              _buildSectionHeader('Current Body Weight (kg)'),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [55, 65, 70, 75, 80, 90].map((w) {
                  final isSelected = selectedWeight == w;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2.5),
                      child: InkWell(
                        onTap: () {
                          HapticFeedback.selectionClick();
                          notifier.updateDietAnswer('weight_kg', w);
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 9),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFFF97316)
                                : (isDark ? AppColors.darkSurfaceElevated : context.palette.surfaceSubtle),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isSelected
                                  ? const Color(0xFFF97316)
                                  : (isDark ? AppColors.darkBorder : context.palette.border),
                            ),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            '$w kg',
                            style: TextStyle(
                              color: isSelected
                                  ? Colors.white
                                  : (isDark ? AppColors.darkText : context.palette.text),
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 16),

              _buildSectionHeader('Daily Meal Frequency'),
              const SizedBox(height: 10),
              Row(
                children: [3, 4, 5].map((m) {
                  final isSelected = selectedMeals == m;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: InkWell(
                        onTap: () {
                          HapticFeedback.selectionClick();
                          notifier.updateDietAnswer('meals_per_day', m);
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFFF97316)
                                : (isDark ? AppColors.darkSurfaceElevated : context.palette.surfaceSubtle),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isSelected
                                  ? const Color(0xFFF97316)
                                  : (isDark ? AppColors.darkBorder : context.palette.border),
                            ),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            '$m Meals / Day',
                            style: TextStyle(
                              color: isSelected
                                  ? Colors.white
                                  : (isDark ? AppColors.darkText : context.palette.text),
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 22),

              Row(
                children: [
                  Expanded(
                    child: RepsiButton(
                      text: 'Generate Diet Plan',
                      isLoading: state.isDietLoading,
                      leadingIcon: const Icon(LucideIcons.salad, size: 18),
                      onPressed: () => notifier.generateDietPlan(useAi: false),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: RepsiButton(
                      text: 'AI Macro Tune',
                      variant: RepsiButtonVariant.outline,
                      isLoading: state.isDietLoading,
                      leadingIcon: const Icon(LucideIcons.sparkles, size: 18, color: Color(0xFFF97316)),
                      onPressed: () => notifier.generateDietPlan(useAi: true),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        if (state.dietPlan != null)
          _buildDietPlanResult(context, state.dietPlan!, isDark),
      ],
    );
  }

  Widget _buildDietPlanResult(BuildContext context, AiDietPlan plan, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Header
        RepsiCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      plan.name,
                      style: AppTypography.heading.copyWith(
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                        color: isDark ? AppColors.darkText : context.palette.text,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF97316).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(LucideIcons.flame, size: 12, color: Color(0xFFF97316)),
                        SizedBox(width: 4),
                        Text(
                          'AI Macro Plan',
                          style: TextStyle(
                            color: Color(0xFFF97316),
                            fontWeight: FontWeight.w800,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                plan.description,
                style: AppTypography.bodySmall.copyWith(
                  color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
                  height: 1.35,
                ),
              ),

              const SizedBox(height: 16),

              // Macro Dash Grid
              Row(
                children: [
                  _buildMacroTile('Calories', '${plan.dailyCalories}', 'kcal', AppColors.primary, isDark),
                  const SizedBox(width: 8),
                  _buildMacroTile('Protein', '${plan.proteinGrams}g', 'Target', const Color(0xFF3B82F6), isDark),
                  const SizedBox(width: 8),
                  _buildMacroTile('Carbs', '${plan.carbsGrams}g', 'Fuel', const Color(0xFFF59E0B), isDark),
                  const SizedBox(width: 8),
                  _buildMacroTile('Fats', '${plan.fatGrams}g', 'Healthy', const Color(0xFF10B981), isDark),
                ],
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.droplets, color: Color(0xFF3B82F6), size: 16),
                    const SizedBox(width: 8),
                    Text(
                      'Hydration Target: ${(plan.waterMlTarget / 1000).toStringAsFixed(1)} Litres water daily',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF3B82F6),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // Meals Breakdown
        Text(
          'DAILY MEAL BREAKDOWN',
          style: AppTypography.headingSmall.copyWith(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.8,
            color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
          ),
        ),
        const SizedBox(height: 10),

        ...plan.meals.map((meal) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: RepsiCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        meal.name,
                        style: AppTypography.bodyMedium.copyWith(
                          fontWeight: FontWeight.w800,
                          color: isDark ? AppColors.darkText : context.palette.text,
                        ),
                      ),
                      if (meal.targetCalories != null)
                        Text(
                          '~${meal.targetCalories} kcal',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'monospace',
                            color: AppColors.primary,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Divider(height: 1),
                  const SizedBox(height: 8),
                  ...meal.items.map((item) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            margin: const EdgeInsets.only(top: 5),
                            width: 5,
                            height: 5,
                            decoration: const BoxDecoration(
                              color: Color(0xFFF97316),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              '${item.food}${item.portion != null ? ' (${item.portion})' : ''}',
                              style: AppTypography.bodySmall.copyWith(
                                fontWeight: FontWeight.w600,
                                color: isDark ? AppColors.darkText : context.palette.text,
                              ),
                            ),
                          ),
                          if (item.protein != null)
                            Text(
                              '${item.protein}g P',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF3B82F6),
                              ),
                            ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          );
        }),

        const SizedBox(height: 8),

        // Save as Active Plan CTA
        RepsiButton(
          text: 'Set as My Active Diet Plan',
          leadingIcon: const Icon(LucideIcons.checkCheck, size: 18),
          onPressed: () {
            HapticFeedback.mediumImpact();
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Activated: ${plan.name} has been set as your active meal plan!'),
                backgroundColor: const Color(0xFF10B981),
                behavior: SnackBarBehavior.floating,
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildMacroTile(String label, String value, String sub, Color color, bool isDark) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Column(
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.grey.shade400 : Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w900,
                color: color,
              ),
            ),
            Text(
              sub,
              style: TextStyle(
                fontSize: 9,
                color: isDark ? Colors.grey.shade500 : Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── WORKOUT RESULT ───────────────────────────────────────────────────────

  Widget _buildRoutineResult(BuildContext context, dynamic suggestion, bool isDark) {
    final plan = suggestion.plan;
    if (plan == null) {
      return RepsiCard(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Icon(LucideIcons.alertTriangle, color: context.palette.warning, size: 36),
            const SizedBox(height: 10),
            Text(suggestion.safetyMessage ?? context.l10n.noPlanForCriteria),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                plan.title,
                style: AppTypography.heading.copyWith(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: isDark ? AppColors.darkText : context.palette.text,
                ),
              ),
            ),
            const SizedBox(width: 8),
            RepsiBadge(
              label: suggestion.source == 'ai' ? context.l10n.aiTailored : context.l10n.verifiedSplit,
              variant: suggestion.source == 'ai' ? RepsiBadgeVariant.active : RepsiBadgeVariant.info,
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          plan.overview,
          style: AppTypography.bodySecondary.copyWith(
            color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
            fontSize: 13.5,
          ),
        ),
        const SizedBox(height: 16),

        // Days List
        ...plan.days.asMap().entries.map((entry) {
          final dayIndex = entry.key;
          final day = entry.value;

          return Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: RepsiCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              color: context.palette.primarySoft,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              '${dayIndex + 1}',
                              style: TextStyle(
                                color: context.palette.primaryDark,
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            day.name,
                            style: AppTypography.headingSmall.copyWith(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: isDark ? AppColors.darkText : context.palette.text,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.playCircle, color: AppColors.primary, size: 24),
                        tooltip: 'Start this workout',
                        onPressed: () {
                          // Convert day exercises to PlannedExercise and launch WorkoutRunnerView
                          final plannedExercises = (day.exercises as List<dynamic>).asMap().entries.map((e) {
                            final idx = e.key;
                            final ex = e.value as AiExercise;
                            final isSuperset = ex.note?.contains('Superset') ?? false;
                            return PlannedExercise(
                              exerciseId: ex.exerciseId.isNotEmpty ? ex.exerciseId : 'ai_$idx',
                              name: ex.name,
                              category: 'strength',
                              sets: ex.sets,
                              reps: ex.reps,
                              restSeconds: ex.restSeconds ?? 60,
                              primaryMuscles: const ['chest', 'arms'],
                              equipment: const ['gym'],
                              instructions: const ['Perform with controlled form and full range of motion.'],
                              notes: ex.note,
                              groupType: isSuperset ? 'superset' : null,
                              groupLabel: ex.note?.contains('Superset A') == true ? 'A' : null,
                            );
                          }).toList();

                          final plannedDay = PlannedDay(
                            index: dayIndex,
                            name: day.name,
                            focus: 'chest',
                            estimatedMinutes: 45,
                            exercises: plannedExercises,
                          );

                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => WorkoutRunnerView(day: plannedDay),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Divider(height: 1),
                  const SizedBox(height: 10),

                  // Exercises list
                  ...day.exercises.map<Widget>((ex) {
                    final isSuperset = ex.note?.contains('Superset') ?? false;

                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: BoxDecoration(
                                  color: isSuperset ? const Color(0xFFF59E0B) : AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  ex.name,
                                  style: AppTypography.body.copyWith(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13.5,
                                    color: isDark ? AppColors.darkText : context.palette.text,
                                  ),
                                ),
                              ),
                              Text(
                                '${ex.sets} × ${ex.reps}',
                                style: TextStyle(
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                  color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
                                ),
                              ),
                            ],
                          ),
                          if (ex.note != null && ex.note!.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(left: 14, top: 2),
                              child: Text(
                                ex.note!,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isSuperset
                                      ? const Color(0xFFF59E0B)
                                      : (isDark ? AppColors.darkTextSecondary : context.palette.textSecondary),
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: AppTypography.headingSmall.copyWith(
        fontSize: 13,
        fontWeight: FontWeight.w700,
      ),
    );
  }

  Widget _buildFilterChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    bool highlight = false,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return RepsiPress(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 7.5),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? AppColors.darkPrimarySoft : context.palette.primarySoft)
              : (isDark ? AppColors.darkSurfaceElevated : context.palette.surface),
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : highlight
                    ? AppColors.primary.withValues(alpha: 0.5)
                    : (isDark ? AppColors.darkBorder : context.palette.border),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: AppTypography.caption.copyWith(
            color: isSelected
                ? context.palette.primaryDark
                : (isDark ? AppColors.darkText : context.palette.text),
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}
