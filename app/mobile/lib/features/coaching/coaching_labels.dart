import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';
import '../../l10n/l10n.dart';
import 'data/coaching_models.dart';

extension FitnessGoalUi on FitnessGoal {
  String label(AppLocalizations l) => switch (this) {
        FitnessGoal.fatLoss => l.goalFatLoss,
        FitnessGoal.muscleGain => l.goalMuscleGain,
        FitnessGoal.strength => l.goalStrength,
        FitnessGoal.endurance => l.goalEndurance,
        FitnessGoal.generalFitness => l.goalGeneralFitness,
        FitnessGoal.mobility => l.goalMobility,
      };

  String description(AppLocalizations l) => switch (this) {
        FitnessGoal.fatLoss => l.goalFatLossDesc,
        FitnessGoal.muscleGain => l.goalMuscleGainDesc,
        FitnessGoal.strength => l.goalStrengthDesc,
        FitnessGoal.endurance => l.goalEnduranceDesc,
        FitnessGoal.generalFitness => l.goalGeneralFitnessDesc,
        FitnessGoal.mobility => l.goalMobilityDesc,
      };

  IconData get icon => switch (this) {
        FitnessGoal.fatLoss => Icons.local_fire_department_rounded,
        FitnessGoal.muscleGain => Icons.fitness_center_rounded,
        FitnessGoal.strength => Icons.sports_gymnastics_rounded,
        FitnessGoal.endurance => Icons.directions_run_rounded,
        FitnessGoal.generalFitness => Icons.favorite_rounded,
        FitnessGoal.mobility => Icons.self_improvement_rounded,
      };

  Color get color => switch (this) {
        FitnessGoal.fatLoss => AppColors.primary,
        FitnessGoal.muscleGain => AppColors.accentViolet,
        FitnessGoal.strength => AppColors.accentBlue,
        FitnessGoal.endurance => AppColors.accentTeal,
        FitnessGoal.generalFitness => AppColors.accentPink,
        FitnessGoal.mobility => AppColors.accentAmber,
      };
}

extension FitnessLevelUi on FitnessLevel {
  String label(AppLocalizations l) => switch (this) {
        FitnessLevel.beginner => l.levelBeginner,
        FitnessLevel.intermediate => l.levelIntermediate,
        FitnessLevel.advanced => l.levelAdvanced,
      };

  String description(AppLocalizations l) => switch (this) {
        FitnessLevel.beginner => l.levelBeginnerDesc,
        FitnessLevel.intermediate => l.levelIntermediateDesc,
        FitnessLevel.advanced => l.levelAdvancedDesc,
      };

  int get bars => index + 1;
}

String focusAreaLabel(AppLocalizations l, String code) => switch (code) {
      'full_body' => l.focusFullBody,
      'upper_body' => l.focusUpperBody,
      'lower_body' => l.focusLowerBody,
      'core' => l.focusCore,
      'arms' => l.focusArms,
      'back' => l.focusBack,
      'chest' => l.focusChest,
      'glutes' => l.focusGlutes,
      'cardio' => l.focusCardio,
      'flexibility' => l.focusFlexibility,
      _ => code,
    };

/// Training-day focus returned by the suggestion engine.
String dayFocusLabel(AppLocalizations l, String focus) => switch (focus) {
      'full_body' => l.dayFullBody,
      'upper' => l.dayUpper,
      'lower' => l.dayLower,
      'push' => l.dayPush,
      'pull' => l.dayPull,
      'legs' => l.dayLegs,
      'conditioning' => l.dayConditioning,
      'cardio' => l.dayCardio,
      'mobility' => l.dayMobility,
      _ => focus,
    };

IconData dayFocusIcon(String focus) => switch (focus) {
      'upper' || 'push' => Icons.sports_martial_arts_rounded,
      'pull' => Icons.rowing_rounded,
      'lower' || 'legs' => Icons.directions_walk_rounded,
      'conditioning' => Icons.bolt_rounded,
      'cardio' => Icons.directions_run_rounded,
      'mobility' => Icons.self_improvement_rounded,
      _ => Icons.fitness_center_rounded,
    };

Color dayFocusColor(String focus) => switch (focus) {
      'upper' || 'push' => AppColors.accentBlue,
      'pull' => AppColors.accentViolet,
      'lower' || 'legs' => AppColors.accentTeal,
      'conditioning' => AppColors.primary,
      'cardio' => AppColors.accentPink,
      'mobility' => AppColors.accentAmber,
      _ => AppColors.primary,
    };

/// "3 × 8-12" or "1 × 45 s" or "1 × 15 min".
String prescription(AppLocalizations l, PlannedExercise e) {
  if (e.durationSeconds != null) {
    final s = e.durationSeconds!;
    final amount = s >= 120 ? l.unitMinutes(s ~/ 60) : l.unitSeconds(s);
    return '${e.sets} × $amount';
  }
  return '${e.sets} × ${e.reps ?? ''}';
}
