import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/widgets/repsi_card.dart';
import '../../nutrition/data/coaching_repository.dart';
import '../../../l10n/l10n.dart';

/// Today's assigned diet plan with what's been logged. Members ([memberId] null) can log meals
/// and water; trainers see an assigned client's plan and adherence read-only.
class TrainerDietPlanView extends ConsumerWidget {
  final String? memberId;
  final String? memberName;
  const TrainerDietPlanView({super.key, this.memberId, this.memberName});

  /// Meal slots and log statuses are API values; show them in the current language.
  String _label(BuildContext context, String slot) {
    final l = context.l10n;
    return switch (slot) {
      'breakfast' => l.mealBreakfast,
      'morning_snack' => l.mealMorningSnack,
      'lunch' => l.mealLunch,
      'evening_snack' => l.mealEveningSnack,
      'snack' => l.mealSnack,
      'dinner' => l.mealDinner,
      'pre_workout' => l.mealPreWorkout,
      'post_workout' => l.mealPostWorkout,
      'eaten' => l.mealStatusEaten,
      'modified' => l.mealStatusModified,
      'skipped' => l.mealStatusSkipped,
      _ => slot.split('_').map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}').join(' '),
    };
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dayAsync = ref.watch(nutritionDayProvider(memberId));
    final isMember = memberId == null;

    Future<void> run(Future<void> Function() action) async {
      try {
        await action();
        ref.invalidate(nutritionDayProvider(memberId));
      } catch (e) {
        if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }

    return Scaffold(
      appBar: AppBar(title: Text(memberName == null ? context.l10n.dietPlan : context.l10n.trainerDietTitle(memberName!))),
      body: dayAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Padding(padding: const EdgeInsets.all(16), child: Text(e.toString(), textAlign: TextAlign.center)),
            OutlinedButton(onPressed: () => ref.invalidate(nutritionDayProvider(memberId)), child: Text(context.l10n.commonTryAgain)),
          ]),
        ),
        data: (day) {
          final v = day.version;
          if (v == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  isMember ? context.l10n.noDietPlanMember : context.l10n.noDietPlanTrainer,
                  textAlign: TextAlign.center,
                  style: AppTypography.bodySecondary,
                ),
              ),
            );
          }
          final logged = {for (final m in day.meals) m['slot'] as String: m['status'] as String};
          final waterTarget = (v['water_ml_target'] as num?)?.toInt();
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(nutritionDayProvider(memberId)),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(day.assignment!['title'] as String? ?? '', style: AppTypography.heading),
                const SizedBox(height: 4),
                Text(
                  [
                    context.l10n.dietEatenToday('${day.totals['calories'] ?? 0}', '${day.totals['protein'] ?? 0}'),
                    if (v['calories_target'] != null) context.l10n.dietOfTarget('${v['calories_target']}'),
                  ].join(' '),
                  style: AppTypography.bodySecondary,
                ),
                const SizedBox(height: 12),
                RepsiCard(
                  child: Row(children: [
                    const Icon(Icons.water_drop_outlined, color: AppColors.primary),
                    const SizedBox(width: 8),
                    Expanded(child: Text(waterTarget != null ? context.l10n.dietWaterOfTarget('${day.waterMl}', '$waterTarget') : context.l10n.dietWater('${day.waterMl}'))),
                    if (isMember)
                      TextButton(
                        onPressed: () => run(() => ref.read(coachingRepositoryProvider).logWater(250, day.date)),
                        child: Text(context.l10n.addWater),
                      ),
                  ]),
                ),
                const SizedBox(height: 12),
                for (final meal in day.plannedMeals) ...[
                  RepsiCard(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Expanded(
                          child: Text(
                            '${_label(context, meal['slot'] as String? ?? '')}${meal['time'] != null ? ' · ${meal['time']}' : ''}',
                            style: AppTypography.sectionHeading,
                          ),
                        ),
                        if (logged[meal['slot']] != null)
                          Chip(label: Text(_label(context, logged[meal['slot']]!)), visualDensity: VisualDensity.compact),
                      ]),
                      for (final it in (meal['items'] as List? ?? const []))
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            '• ${it['food']}${it['portion'] != null ? ' — ${it['portion']}' : ''}'
                            '${it['calories'] != null ? ' (${it['calories']} kcal)' : ''}',
                          ),
                        ),
                      if (isMember && logged[meal['slot']] == null)
                        Wrap(spacing: 8, children: [
                          for (final s in const ['eaten', 'modified', 'skipped'])
                            OutlinedButton(
                              onPressed: () => run(() => ref
                                  .read(coachingRepositoryProvider)
                                  .logMeal(slot: meal['slot'] as String, status: s, date: day.date)),
                              child: Text(_label(context, s)),
                            ),
                        ]),
                    ]),
                  ),
                  const SizedBox(height: 8),
                ],
                if (v['notes'] != null) Text(v['notes'] as String, style: AppTypography.bodySecondary),
              ],
            ),
          );
        },
      ),
    );
  }
}
