import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../l10n/l10n.dart';
import '../../../../shared/animations/repsi_stagger.dart';
import '../../../../shared/widgets/repsi_button.dart';
import '../../../../shared/widgets/repsi_card.dart';
import 'active_workout_view.dart';
import 'exercise_library_view.dart';
import '../exercise_media_widget.dart';
import '../../../../app/theme/repsi_palette.dart';

class WorkoutDashboardView extends StatelessWidget {
  const WorkoutDashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    final exercises = [
      {'name': 'Bench Press', 'sets': '4 × 10', 'weight': '60 kg', 'icon': Icons.fitness_center_rounded},
      {'name': 'Incline Dumbbell Press', 'sets': '3 × 12', 'weight': '20 kg', 'icon': Icons.fitness_center_rounded},
      {'name': 'Cable Fly', 'sets': '3 × 15', 'weight': '15 kg', 'icon': Icons.sports_gymnastics_rounded},
      {'name': 'Triceps Pushdown', 'sets': '3 × 12', 'weight': '25 kg', 'icon': Icons.trending_down_rounded},
    ];

    return Scaffold(
      backgroundColor: context.palette.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          context.l10n.workoutPlanTitle,
          style: AppTypography.heading.copyWith(
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: TextButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ExerciseLibraryView()),
                );
              },
              icon: const Icon(Icons.menu_book_rounded, size: 16, color: AppColors.primary),
              label: Text(
                context.l10n.exerciseLibrary,
                style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 13),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.pageHorizontalPadding,
            vertical: 12,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Badge + Plan Header (Mockup Screen 3)
              RepsiStaggerItem(
                index: 0,
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
                    border: Border.all(color: context.palette.border, width: 1),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: context.palette.primarySoft,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.bolt_rounded, size: 14, color: context.palette.primaryDark),
                                const SizedBox(width: 4),
                                Text(
                                  context.l10n.todaysWorkout,
                                  style: AppTypography.caption.copyWith(
                                    color: context.palette.primaryDark,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Chest + Triceps',
                        style: AppTypography.heading.copyWith(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: context.palette.text,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        context.l10n.exercisesDuration(4, 45),
                        style: AppTypography.caption.copyWith(
                          color: context.palette.textSecondary,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(
                            child: RepsiButton(
                              text: context.l10n.startWorkout,
                              leadingIcon: const Icon(Icons.play_arrow_rounded, size: 22),
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const ActiveWorkoutView()),
                                );
                              },
                              size: RepsiButtonSize.large,
                            ),
                          ),
                          const SizedBox(width: 10),
                          OutlinedButton.icon(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const ExerciseLibraryView()),
                              );
                            },
                            icon: const Icon(Icons.menu_book_rounded, size: 16, color: AppColors.primary),
                            label: Text(
                              context.l10n.exerciseLibrary,
                              style: const TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w700,
                                fontSize: 13,
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                              side: BorderSide(color: AppColors.primary.withValues(alpha: 0.3)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Exercises List Header
              RepsiStaggerItem(
                index: 1,
                child: Text(
                  context.l10n.exercisesCount(exercises.length),
                  style: AppTypography.sectionHeading.copyWith(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: context.palette.text,
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Exercise Cards
              ...List.generate(exercises.length, (index) {
                final ex = exercises[index];
                return RepsiStaggerItem(
                  index: index + 2,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: RepsiCard(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: ExerciseDemonstrationMedia(
                              exerciseName: ex['name'] as String,
                              width: 64,
                              height: 64,
                              borderRadius: BorderRadius.circular(12),
                              showControls: false,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  ex['name'] as String,
                                  style: AppTypography.headingSmall.copyWith(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    color: context.palette.text,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: context.palette.primarySoft,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        '${ex['sets']}',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: context.palette.primaryDark,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      '${ex['weight']}',
                                      style: AppTypography.caption.copyWith(
                                        color: context.palette.textSecondary,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Icon(
                            Icons.chevron_right_rounded,
                            size: 20,
                            color: context.palette.textMuted,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}

