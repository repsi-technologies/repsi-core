import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/animations/repsi_press.dart';
import '../../../shared/animations/repsi_stagger.dart';
import '../../../shared/widgets/repsi_badge.dart';
import '../../../shared/widgets/repsi_button.dart';
import '../../../shared/widgets/repsi_card.dart';
import '../../member/presentation/views/active_workout_view.dart';
import '../providers/ai_coach_provider.dart';

class AiWorkoutCoachView extends ConsumerStatefulWidget {
  const AiWorkoutCoachView({super.key});

  @override
  ConsumerState<AiWorkoutCoachView> createState() => _AiWorkoutCoachViewState();
}

class _AiWorkoutCoachViewState extends ConsumerState<AiWorkoutCoachView> {
  final Map<String, String> _goalLabels = {
    'hypertrophy': 'Muscle Gain',
    'fat_loss': 'Fat Loss & Tone',
    'strength': 'Raw Strength',
    'endurance': 'Endurance & Stamina',
    'general_fitness': 'General Wellness',
  };

  final Map<String, String> _expLabels = {
    'beginner': 'Beginner (< 1 yr)',
    'intermediate': 'Intermediate (1-3 yrs)',
    'advanced': 'Advanced (3+ yrs)',
  };

  final Map<String, String> _equipLabels = {
    'full_gym': 'Commercial Gym',
    'dumbbells': 'Dumbbells & Bench',
    'bodyweight': 'Calisthenics & Home',
  };

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(aiCoachProvider);
    final notifier = ref.read(aiCoachProvider.notifier);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final selectedGoal = state.answers['goal']?.toString() ?? 'hypertrophy';
    final selectedExp =
        state.answers['experience']?.toString() ?? 'intermediate';
    final selectedDays = (state.answers['days_per_week'] as num?)?.toInt() ?? 4;
    final selectedEquip = state.answers['equipment']?.toString() ?? 'full_gym';

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color:
                    isDark ? AppColors.darkPrimarySoft : AppColors.primarySoft,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(LucideIcons.sparkles,
                  size: 18, color: AppColors.primary),
            ),
            const SizedBox(width: 10),
            Text(
              'AI Workout Coach',
              style: AppTypography.headingSmall.copyWith(
                fontWeight: FontWeight.w700,
                color: isDark ? AppColors.darkText : AppColors.text,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.info),
            tooltip: 'Safety Guidelines',
            onPressed: () => _showSafetyDialog(context),
          ),
        ],
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
              // 1. Hero introduction banner
              RepsiStaggerItem(
                index: 0,
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: isDark
                          ? [
                              const Color(0xFF2E2622),
                              AppColors.darkSurface,
                            ]
                          : [
                              const Color(0xFFFFF6F1),
                              AppColors.surface,
                            ],
                    ),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
                    border: Border.all(
                      color: isDark
                          ? AppColors.primary.withValues(alpha: 0.3)
                          : AppColors.primary.withValues(alpha: 0.2),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'GEMINI POWERED',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 10,
                                letterSpacing: 0.6,
                              ),
                            ),
                          ),
                          const Spacer(),
                          const Icon(LucideIcons.bot,
                              size: 20, color: AppColors.primary),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Tailored Fitness Routine',
                        style: AppTypography.headingSmall.copyWith(
                          fontWeight: FontWeight.w700,
                          color: isDark ? AppColors.darkText : AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Answer your training preferences below to instantly build a science-backed progressive split adapted to your equipment and goals.',
                        style: AppTypography.caption.copyWith(
                          color: isDark
                              ? AppColors.darkTextSecondary
                              : AppColors.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 18),

              // 2. Interactive Questionnaire Section
              RepsiStaggerItem(
                index: 1,
                child: RepsiCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildSectionHeader(
                          '1. What is your primary fitness goal?'),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _goalLabels.entries.map((entry) {
                          final isSelected = selectedGoal == entry.key;
                          return _buildFilterChip(
                            label: entry.value,
                            isSelected: isSelected,
                            onTap: () =>
                                notifier.updateAnswer('goal', entry.key),
                          );
                        }).toList(),
                      ),

                      const SizedBox(height: 18),
                      const Divider(height: 1),
                      const SizedBox(height: 18),

                      _buildSectionHeader('2. Training Experience Level'),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _expLabels.entries.map((entry) {
                          final isSelected = selectedExp == entry.key;
                          return _buildFilterChip(
                            label: entry.value,
                            isSelected: isSelected,
                            onTap: () =>
                                notifier.updateAnswer('experience', entry.key),
                          );
                        }).toList(),
                      ),

                      const SizedBox(height: 18),
                      const Divider(height: 1),
                      const SizedBox(height: 18),

                      _buildSectionHeader('3. Training Frequency (Days/Week)'),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [2, 3, 4, 5, 6].map((day) {
                          final isSelected = selectedDays == day;
                          return Expanded(
                            child: Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 3),
                              child: InkWell(
                                onTap: () {
                                  HapticFeedback.selectionClick();
                                  notifier.updateAnswer('days_per_week', day);
                                },
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 10),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? AppColors.primary
                                        : (isDark
                                            ? AppColors.darkSurfaceElevated
                                            : AppColors.surfaceSubtle),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: isSelected
                                          ? AppColors.primary
                                          : (isDark
                                              ? AppColors.darkBorder
                                              : AppColors.border),
                                    ),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    '$day d',
                                    style: TextStyle(
                                      color: isSelected
                                          ? Colors.white
                                          : (isDark
                                              ? AppColors.darkText
                                              : AppColors.text),
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

                      const SizedBox(height: 18),
                      const Divider(height: 1),
                      const SizedBox(height: 18),

                      _buildSectionHeader('4. Equipment Access'),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _equipLabels.entries.map((entry) {
                          final isSelected = selectedEquip == entry.key;
                          return _buildFilterChip(
                            label: entry.value,
                            isSelected: isSelected,
                            onTap: () =>
                                notifier.updateAnswer('equipment', entry.key),
                          );
                        }).toList(),
                      ),

                      const SizedBox(height: 22),

                      // Action buttons
                      Row(
                        children: [
                          Expanded(
                            child: RepsiButton(
                              text: 'Generate Routine',
                              isLoading: state.isLoading,
                              leadingIcon:
                                  const Icon(LucideIcons.dumbbell, size: 18),
                              onPressed: () =>
                                  notifier.generatePlan(useAi: false),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: RepsiButton(
                              text: 'Personalize AI',
                              variant: RepsiButtonVariant.outline,
                              isLoading: state.isPersonalizingAi,
                              leadingIcon: const Icon(LucideIcons.sparkles,
                                  size: 18, color: AppColors.primary),
                              onPressed: () =>
                                  notifier.generatePlan(useAi: true),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // 3. Generated Plan Result View
              if (state.suggestion != null) ...[
                RepsiStaggerItem(
                  index: 2,
                  child:
                      _buildRoutineResult(context, state.suggestion!, isDark),
                ),
              ],

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: AppTypography.headingSmall.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w700,
      ),
    );
  }

  Widget _buildFilterChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return RepsiPress(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? AppColors.darkPrimarySoft : AppColors.primarySoft)
              : (isDark ? AppColors.darkSurfaceElevated : AppColors.surface),
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : (isDark ? AppColors.darkBorder : AppColors.border),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: AppTypography.caption.copyWith(
            color: isSelected
                ? AppColors.primaryDark
                : (isDark ? AppColors.darkText : AppColors.text),
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            fontSize: 12.5,
          ),
        ),
      ),
    );
  }

  Widget _buildRoutineResult(
      BuildContext context, dynamic suggestion, bool isDark) {
    final plan = suggestion.plan;
    if (plan == null) {
      return RepsiCard(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const Icon(LucideIcons.alertTriangle,
                color: AppColors.warning, size: 36),
            const SizedBox(height: 10),
            Text(suggestion.safetyMessage ??
                'No plan available for this criteria.'),
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
                  fontWeight: FontWeight.w700,
                  color: isDark ? AppColors.darkText : AppColors.text,
                ),
              ),
            ),
            const SizedBox(width: 8),
            RepsiBadge(
              label:
                  suggestion.source == 'ai' ? 'AI TAILORED' : 'VERIFIED SPLIT',
              variant: suggestion.source == 'ai'
                  ? RepsiBadgeVariant.active
                  : RepsiBadgeVariant.info,
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          plan.overview,
          style: AppTypography.bodySecondary.copyWith(
            color:
                isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
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
                              color: AppColors.primarySoft,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              '${dayIndex + 1}',
                              style: const TextStyle(
                                color: AppColors.primaryDark,
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            day.name,
                            style: AppTypography.headingSmall.copyWith(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color:
                                  isDark ? AppColors.darkText : AppColors.text,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.playCircle,
                            color: AppColors.primary, size: 22),
                        tooltip: 'Start this workout',
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const ActiveWorkoutView()),
                          );
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Divider(height: 1),
                  const SizedBox(height: 10),

                  // Exercises table
                  ...day.exercises.map<Widget>((ex) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            margin: const EdgeInsets.only(top: 6),
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  ex.name,
                                  style: AppTypography.body.copyWith(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                    color: isDark
                                        ? AppColors.darkText
                                        : AppColors.text,
                                  ),
                                ),
                                if (ex.note != null && ex.note!.isNotEmpty)
                                  Text(
                                    ex.note!,
                                    style: AppTypography.caption.copyWith(
                                      fontSize: 11,
                                      color: isDark
                                          ? AppColors.darkTextMuted
                                          : AppColors.textMuted,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? AppColors.darkSurfaceElevated
                                  : AppColors.surfaceSubtle,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '${ex.sets} × ${ex.reps}',
                              style: AppTypography.tabularNumber(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: isDark
                                    ? AppColors.darkText
                                    : AppColors.text,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ],
              ),
            ),
          );
        }),

        if (plan.tips.isNotEmpty) ...[
          const SizedBox(height: 8),
          RepsiCard(
            padding: const EdgeInsets.all(14),
            backgroundColor: isDark
                ? AppColors.darkSurfaceElevated
                : const Color(0xFFFBFBF9),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(LucideIcons.lightbulb,
                        size: 16, color: AppColors.primary),
                    SizedBox(width: 6),
                    Text(
                      'Coach Protocol Tips',
                      style:
                          TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ...plan.tips.map<Widget>((tip) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 3),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('• ',
                            style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold)),
                        Expanded(
                          child: Text(
                            tip,
                            style: AppTypography.caption.copyWith(
                              fontSize: 12,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.textSecondary,
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
        ],

        const SizedBox(height: 12),
        Text(
          suggestion.disclaimer,
          textAlign: TextAlign.center,
          style: AppTypography.caption.copyWith(
            fontSize: 11,
            color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
          ),
        ),
      ],
    );
  }

  void _showSafetyDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Safety & Medical Disclaimer'),
        content: const Text(
          'REPSI AI Workout Coach provides general exercise recommendations based on sports science heuristics and automated generation. It does not replace individualized medical advice or personal fitness consultation. Stop exercising immediately if you feel dizziness, sharp pain, or shortness of breath.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Understood'),
          ),
        ],
      ),
    );
  }
}
