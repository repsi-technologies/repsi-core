import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

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
        FitnessGoal.fatLoss => LucideIcons.flame,
        FitnessGoal.muscleGain => LucideIcons.bicepsFlexed,
        FitnessGoal.strength => LucideIcons.weight,
        FitnessGoal.endurance => LucideIcons.footprints,
        FitnessGoal.generalFitness => LucideIcons.heartPulse,
        FitnessGoal.mobility => LucideIcons.personStanding,
      };

  /// Photo for banners and the goal picker (Unsplash License, bundled in assets/images/goals).
  String get imageAsset => 'assets/images/goals/$code.jpg';

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
      'upper' || 'push' => LucideIcons.bicepsFlexed,
      'pull' => LucideIcons.dumbbell,
      'lower' || 'legs' => LucideIcons.footprints,
      'conditioning' => LucideIcons.zap,
      'cardio' => LucideIcons.heartPulse,
      'mobility' => LucideIcons.personStanding,
      _ => LucideIcons.dumbbell,
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
