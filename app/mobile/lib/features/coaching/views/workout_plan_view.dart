import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/repsi_palette.dart';
import '../../../core/api/api_error.dart';
import '../../../l10n/l10n.dart';
import '../../../shared/animations/repsi_motion.dart';
import '../../../shared/animations/repsi_press.dart';
import '../../../shared/animations/repsi_stagger.dart';
import '../../../shared/widgets/repsi_button.dart';
import '../../../shared/widgets/repsi_empty_state.dart';
import '../../../shared/widgets/repsi_error_state.dart';
import '../../../shared/widgets/repsi_skeleton.dart';
import '../coaching_labels.dart';
import '../data/coaching_api.dart';
import '../data/coaching_models.dart';
import 'goal_setup_view.dart';
import 'workout_runner_view.dart';

/// The member's suggested week, built by the API from their goal and the gym's exercise library.
/// [embedded] hides the back button when it is shown as a tab.
class WorkoutPlanView extends ConsumerStatefulWidget {
  final bool embedded;
  const WorkoutPlanView({super.key, this.embedded = false});

  @override
  ConsumerState<WorkoutPlanView> createState() => _WorkoutPlanViewState();
}

class _WorkoutPlanViewState extends ConsumerState<WorkoutPlanView> {
  int _day = 0;

  Future<void> _editGoal(MemberGoal? current) async {
    final saved = await Navigator.of(context).push<bool>(MaterialPageRoute(
        fullscreenDialog: true, builder: (_) => GoalSetupView(initial: current, openPlanWhenDone: false)));
    if (saved == true && mounted) setState(() => _day = 0);
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final plan = ref.watch(workoutSuggestionsProvider);
    final goal = ref.watch(coachingOverviewProvider).valueOrNull?.goal;

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        backgroundColor: palette.background,
        automaticallyImplyLeading: !widget.embedded,
        title: Text(l.myWorkoutPlan, style: AppTypography.heading.copyWith(fontSize: 20, fontWeight: FontWeight.w700)),
        actions: [
          if (plan.valueOrNull != null)
            IconButton(
              tooltip: l.editGoal,
              icon: const Icon(Icons.tune_rounded),
              onPressed: () => _editGoal(goal),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(coachingOverviewProvider);
          ref.invalidate(workoutSuggestionsProvider);
          await ref.read(workoutSuggestionsProvider.future).then((_) {}, onError: (_) {});
        },
        child: plan.when(
          loading: () => ListView(
            padding: AppSpacing.pagePadding,
            children: const [
              RepsiSkeleton(height: 150),
              SizedBox(height: 16),
              RepsiSkeleton(height: 44),
              SizedBox(height: 16),
              RepsiSkeleton(height: 72),
              SizedBox(height: 8),
              RepsiSkeleton(height: 72),
              SizedBox(height: 8),
              RepsiSkeleton(height: 72),
            ],
          ),
          error: (e, _) => ListView(children: [
            const SizedBox(height: 80),
            RepsiErrorState(
              message: e is ApiError ? e.message : l.errorLoadPlan,
              onRetry: () => ref.invalidate(workoutSuggestionsProvider),
            ),
          ]),
          data: (p) {
            if (p == null || p.days.isEmpty) {
              return ListView(children: [
                const SizedBox(height: 60),
                RepsiEmptyState(
                  icon: Icons.flag_rounded,
                  title: l.noGoalTitle,
                  message: l.noGoalMessage,
                  actionLabel: l.setMyGoal,
                  onAction: () => Navigator.of(context).push(MaterialPageRoute(
                      fullscreenDialog: true, builder: (_) => const GoalSetupView(openPlanWhenDone: false))),
                ),
              ]);
            }
            final day = p.days[_day.clamp(0, p.days.length - 1)];
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(AppSpacing.pageHorizontalPadding, 4, AppSpacing.pageHorizontalPadding, 24),
              children: [
                RepsiStaggerItem(child: GoalHeroCard(plan: p, onEdit: () => _editGoal(goal))),
                const SizedBox(height: 20),
                RepsiStaggerItem(
                  index: 1,
                  child: Text(l.thisWeek, style: AppTypography.sectionHeading.copyWith(color: palette.text)),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 88,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: p.days.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 10),
                    itemBuilder: (_, i) => _DayChip(
                      day: p.days[i],
                      selected: i == _day,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _day = i);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                AnimatedSwitcher(
                  duration: RepsiMotion.card,
                  switchInCurve: RepsiMotion.easeOut,
                  transitionBuilder: (child, a) => FadeTransition(
                    opacity: a,
                    child: SlideTransition(
                      position: Tween(begin: const Offset(0.04, 0), end: Offset.zero).animate(a),
                      child: child,
                    ),
                  ),
                  child: _DayDetail(key: ValueKey(_day), day: day),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

/// Gradient card with the member's goal; also used on the member home.
class GoalHeroCard extends StatelessWidget {
  final WorkoutPlanSuggestion plan;
  final VoidCallback? onEdit;
  final VoidCallback? onTap;
  const GoalHeroCard({super.key, required this.plan, this.onEdit, this.onTap});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final goal = plan.goal;
    final card = ClipRRect(
      borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
      child: ConstrainedBox(
        // Sized by the text (long Indic labels grow it); the photo fills whatever height results.
        constraints: const BoxConstraints(minHeight: 196),
        child: Stack(
          children: [
            // Each goal has its own photo, so the banner reads as fat loss, strength, mobility…
            Positioned.fill(
              child: Image.asset(goal.imageAsset, fit: BoxFit.cover, cacheWidth: 900,
                  errorBuilder: (_, __, ___) => const ColoredBox(color: AppColors.ink)),
            ),
            Positioned.fill(child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomLeft,
                  end: Alignment.topRight,
                  colors: [
                    Colors.black.withValues(alpha: 0.88),
                    Colors.black.withValues(alpha: 0.55),
                    goal.color.withValues(alpha: 0.25),
                  ],
                  stops: const [0, 0.55, 1],
                ),
              ),
            )),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(color: goal.color, borderRadius: BorderRadius.circular(999)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(goal.icon, size: 14, color: Colors.white),
                      const SizedBox(width: 6),
                      Text(l.yourGoal.toUpperCase(),
                          style: AppTypography.caption.copyWith(
                              color: Colors.white, fontWeight: FontWeight.w800, letterSpacing: 0.9, fontSize: 11)),
                    ]),
                  ),
                  const SizedBox(height: 40),
                  Text(goal.label(l),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.heading.copyWith(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800, height: 1.15)),
                  const SizedBox(height: 4),
                  Text(goal.description(l),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.bodySmall.copyWith(color: Colors.white.withValues(alpha: 0.82))),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _HeroPill(icon: LucideIcons.signal, text: plan.level.label(l)),
                      _HeroPill(icon: LucideIcons.calendarDays, text: l.daysPerWeekValue(plan.daysPerWeek)),
                      _HeroPill(icon: LucideIcons.timer, text: l.unitMinutes(plan.sessionMinutes)),
                    ],
                  ),
                  if (onEdit != null) ...[
                    const SizedBox(height: 12),
                    TextButton.icon(
                      onPressed: onEdit,
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.white,
                        backgroundColor: Colors.white.withValues(alpha: 0.16),
                        minimumSize: const Size(0, 40),
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                      ),
                      icon: const Icon(LucideIcons.pencil, size: 15),
                      label: Text(l.editGoal, style: const TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
    return Semantics(
      label: '${l.yourGoal}: ${goal.label(l)}',
      child: onTap == null ? card : RepsiPress(onTap: onTap, pressedScale: 0.98, child: card),
    );
  }
}

class _HeroPill extends StatelessWidget {
  final IconData icon;
  final String text;
  const _HeroPill({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.14),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 13, color: Colors.white),
          const SizedBox(width: 6),
          Text(text, style: AppTypography.caption.copyWith(color: Colors.white, fontWeight: FontWeight.w600)),
        ]),
      );
}

class _DayChip extends StatelessWidget {
  final PlannedDay day;
  final bool selected;
  final VoidCallback onTap;
  const _DayChip({required this.day, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final color = dayFocusColor(day.focus);
    return Semantics(
      button: true,
      selected: selected,
      child: RepsiPress(
        onTap: onTap,
        child: AnimatedContainer(
          duration: RepsiMotion.nav,
          curve: RepsiMotion.easeOut,
          width: 116,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: selected ? color : palette.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: selected ? color : palette.border),
            boxShadow: selected ? [BoxShadow(color: color.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4))] : const [],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(l.dayNumber(day.index),
                  style: AppTypography.caption.copyWith(
                      color: selected ? Colors.white.withValues(alpha: 0.85) : palette.textSecondary, fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              Text(dayFocusLabel(l, day.focus),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.bodySmall.copyWith(
                      fontWeight: FontWeight.w800, color: selected ? Colors.white : palette.text)),
            ],
          ),
        ),
      ),
    );
  }
}

class _DayDetail extends StatelessWidget {
  final PlannedDay day;
  const _DayDetail({super.key, required this.day});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final color = dayFocusColor(day.focus);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: palette.surface,
            borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
            border: Border.all(color: palette.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(color: color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(12)),
                    child: Icon(dayFocusIcon(day.focus), color: color),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(dayFocusLabel(l, day.focus),
                            style: AppTypography.sectionHeading.copyWith(fontSize: 17, color: palette.text)),
                        const SizedBox(height: 2),
                        Text(
                          '${l.exerciseCount(day.exercises.length)} · ${l.unitMinutes(day.estimatedMinutes)}',
                          style: AppTypography.caption.copyWith(color: palette.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              RepsiButton(
                text: l.startWorkout,
                isFullWidth: true,
                leadingIcon: const Icon(Icons.play_arrow_rounded, size: 20),
                onPressed: day.exercises.isEmpty
                    ? null
                    : () => Navigator.of(context).push(MaterialPageRoute(
                        fullscreenDialog: true, builder: (_) => WorkoutRunnerView(day: day))),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        for (final (i, e) in day.exercises.indexed)
          RepsiStaggerItem(
            index: i,
            delay: const Duration(milliseconds: 50),
            child: Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ExerciseRow(number: i + 1, exercise: e, onTap: () => showExerciseSheet(context, e)),
            ),
          ),
      ],
    );
  }
}

class ExerciseRow extends StatelessWidget {
  final int number;
  final PlannedExercise exercise;
  final VoidCallback? onTap;
  const ExerciseRow({super.key, required this.number, required this.exercise, this.onTap});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    return RepsiPress(
      onTap: onTap,
      pressedScale: 0.98,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: palette.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: palette.border),
        ),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: palette.primarySoft, shape: BoxShape.circle),
              child: Text('$number',
                  style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w800, color: palette.primaryDark)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(exercise.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text, fontSize: 15)),
                  const SizedBox(height: 2),
                  Text(
                    [prescription(l, exercise), l.restSeconds(exercise.restSeconds)].join(' · '),
                    style: AppTypography.caption.copyWith(color: palette.textSecondary),
                  ),
                ],
              ),
            ),
            Icon(Icons.info_outline_rounded, size: 20, color: palette.textMuted),
          ],
        ),
      ),
    );
  }
}

void showExerciseSheet(BuildContext context, PlannedExercise e) {
  final l = context.l10n;
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: context.palette.surface,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusSheet))),
    builder: (ctx) {
      final palette = ctx.palette;
      return DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.6,
        maxChildSize: 0.92,
        builder: (_, scroll) => ListView(
          controller: scroll,
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            Center(
              child: Container(
                  width: 40, height: 4, decoration: BoxDecoration(color: palette.border, borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: 16),
            Text(e.name, style: AppTypography.heading.copyWith(fontSize: 22, fontWeight: FontWeight.w800, color: palette.text)),
            const SizedBox(height: 8),
            Wrap(spacing: 6, runSpacing: 6, children: [
              for (final m in e.primaryMuscles) _Tag(text: m.replaceAll('_', ' ')),
              for (final q in e.equipment) _Tag(text: q.replaceAll('_', ' '), muted: true),
            ]),
            const SizedBox(height: 12),
            Text('${prescription(l, e)} · ${l.restSeconds(e.restSeconds)}',
                style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: AppColors.primary)),
            if (e.description != null) ...[
              const SizedBox(height: 12),
              Text(e.description!, style: AppTypography.bodySecondary.copyWith(color: palette.textSecondary)),
            ],
            if (e.instructions.isNotEmpty) ...[
              const SizedBox(height: 20),
              Text(l.howToDoIt, style: AppTypography.sectionHeading.copyWith(color: palette.text)),
              const SizedBox(height: 10),
              for (final (i, step) in e.instructions.indexed)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Container(
                      width: 24,
                      height: 24,
                      alignment: Alignment.center,
                      decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                      child: Text('${i + 1}', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(child: Text(step, style: AppTypography.bodySmall.copyWith(color: palette.text, height: 1.45))),
                  ]),
                ),
            ],
          ],
        ),
      );
    },
  );
}

class _Tag extends StatelessWidget {
  final String text;
  final bool muted;
  const _Tag({required this.text, this.muted = false});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: muted ? palette.surfaceSecondary : palette.primarySoft,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(text,
          style: AppTypography.caption.copyWith(
              color: muted ? palette.textSecondary : palette.primaryDark, fontWeight: FontWeight.w600)),
    );
  }
}
