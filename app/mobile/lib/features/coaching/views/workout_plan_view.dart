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
import '../../../shared/widgets/repsi_error_state.dart';
import '../../../shared/widgets/repsi_skeleton.dart';
import '../coaching_labels.dart';
import '../data/coaching_api.dart';
import '../data/coaching_models.dart';
import '../../member/presentation/exercise_media_widget.dart';
import '../../member/presentation/views/exercise_library_view.dart';
import 'goal_setup_view.dart';
import 'workout_runner_view.dart';

/// Interactive workout view for members: supports both personalized gym/goal programs
/// and curated workout templates (Beginner, Intermediate, and Chest Specialization).
class WorkoutPlanView extends ConsumerStatefulWidget {
  final bool embedded;
  const WorkoutPlanView({super.key, this.embedded = false});

  @override
  ConsumerState<WorkoutPlanView> createState() => _WorkoutPlanViewState();
}

class _WorkoutPlanViewState extends ConsumerState<WorkoutPlanView> {
  int _activeTab = 0; // 0: My Plan, 1: Templates & Splits
  int _myPlanDay = 0;
  int _selectedTemplateIdx = 2; // Default to Chest Hypertrophy blast
  int _templateDayIdx = 0;

  Future<void> _editGoal(MemberGoal? current) async {
    final saved = await Navigator.of(context).push<bool>(MaterialPageRoute(
        fullscreenDialog: true, builder: (_) => GoalSetupView(initial: current, openPlanWhenDone: false)));
    if (saved == true && mounted) setState(() => _myPlanDay = 0);
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final assignedAsync = ref.watch(activeGymAssignmentProvider);
    final planAsync = ref.watch(workoutSuggestionsProvider);
    final templatesAsync = ref.watch(workoutTemplatesProvider);
    final goal = ref.watch(coachingOverviewProvider).valueOrNull?.goal;

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        backgroundColor: palette.background,
        elevation: 0,
        automaticallyImplyLeading: !widget.embedded,
        title: Text(
          l.navWorkout,
          style: AppTypography.heading.copyWith(fontSize: 20, fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(
            tooltip: context.l10n.exerciseLibrary,
            icon: const Icon(Icons.menu_book_rounded, color: AppColors.primary),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ExerciseLibraryView()),
              );
            },
          ),
          if (_activeTab == 0 && goal != null)
            IconButton(
              tooltip: l.editGoal,
              icon: const Icon(Icons.tune_rounded),
              onPressed: () => _editGoal(goal),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pageHorizontalPadding, vertical: 4),
            child: Container(
              height: 40,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: palette.surfaceSecondary,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: palette.border),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _TabButton(
                      label: 'My Program',
                      icon: LucideIcons.calendarCheck,
                      selected: _activeTab == 0,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _activeTab = 0);
                      },
                    ),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: _TabButton(
                      label: 'Workout Splits',
                      icon: LucideIcons.sparkles,
                      selected: _activeTab == 1,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _activeTab = 1);
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(coachingOverviewProvider);
          ref.invalidate(workoutSuggestionsProvider);
          ref.invalidate(activeGymAssignmentProvider);
          ref.invalidate(workoutTemplatesProvider);
          await Future.wait([
            ref.read(coachingOverviewProvider.future).then((_) {}, onError: (_) {}),
            ref.read(workoutSuggestionsProvider.future).then((_) {}, onError: (_) {}),
            ref.read(activeGymAssignmentProvider.future).then((_) {}, onError: (_) {}),
            ref.read(workoutTemplatesProvider.future).then((_) {}, onError: (_) {}),
          ]);
        },
        child: _activeTab == 0
            ? _buildMyPlanTab(context, assignedAsync, planAsync, templatesAsync, goal)
            : _buildTemplatesTab(context, templatesAsync),
      ),
    );
  }

  Widget _buildMyPlanTab(
    BuildContext context,
    AsyncValue<TemplateWorkoutProgram?> assignedAsync,
    AsyncValue<WorkoutPlanSuggestion?> planAsync,
    AsyncValue<List<TemplateWorkoutProgram>> templatesAsync,
    MemberGoal? goal,
  ) {
    final l = context.l10n;
    final palette = context.palette;

    // Check if there is an active gym assignment first
    final assigned = assignedAsync.valueOrNull;
    if (assigned != null && assigned.days.isNotEmpty) {
      final day = assigned.days[_myPlanDay.clamp(0, assigned.days.length - 1)];
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(AppSpacing.pageHorizontalPadding, 12, AppSpacing.pageHorizontalPadding, 24),
        children: [
          RepsiStaggerItem(child: _AssignedProgramCard(program: assigned)),
          const SizedBox(height: 16),
          RepsiStaggerItem(
            index: 1,
            child: Text('Scheduled Days', style: AppTypography.sectionHeading.copyWith(color: palette.text)),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 88,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: assigned.days.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) => _DayChip(
                day: assigned.days[i],
                selected: i == _myPlanDay,
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _myPlanDay = i);
                },
              ),
            ),
          ),
          const SizedBox(height: 16),
          _DayDetail(key: ValueKey('assigned-$_myPlanDay'), day: day),
        ],
      );
    }

    // Otherwise check goal-based suggestions
    return planAsync.when(
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
        ],
      ),
      error: (e, _) => ListView(children: [
        const SizedBox(height: 60),
        RepsiErrorState(
          message: e is ApiError ? e.message : l.errorLoadPlan,
          onRetry: () => ref.invalidate(workoutSuggestionsProvider),
        ),
      ]),
      data: (p) {
        if (p == null || p.days.isEmpty) {
          // If no personal goal is configured, show a helpful jumpstart to templates!
          return ListView(
            padding: const EdgeInsets.all(AppSpacing.pageHorizontalPadding),
            children: [
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary.withValues(alpha: 0.12),
                      palette.surface,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'READY TO TRAIN',
                            style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Explore Default Workout Splits',
                      style: AppTypography.heading.copyWith(fontSize: 20, fontWeight: FontWeight.w800, color: palette.text),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Start right away with our pre-built Beginner, Intermediate, or Chest Hypertrophy splits, or set up a customized fitness goal.',
                      style: AppTypography.bodySmall.copyWith(color: palette.textSecondary, height: 1.4),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: RepsiButton(
                            text: 'View Splits',
                            leadingIcon: const Icon(LucideIcons.sparkles, size: 18),
                            onPressed: () => setState(() => _activeTab = 1),
                          ),
                        ),
                        const SizedBox(width: 10),
                        OutlinedButton(
                          onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                              fullscreenDialog: true, builder: (_) => const GoalSetupView(openPlanWhenDone: false))),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            side: BorderSide(color: palette.border),
                          ),
                          child: Text(l.setMyGoal, style: TextStyle(color: palette.text, fontWeight: FontWeight.w700, fontSize: 13)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Featured Workouts',
                style: AppTypography.sectionHeading.copyWith(fontSize: 16, color: palette.text),
              ),
              const SizedBox(height: 12),
              ...templatesAsync.valueOrNull?.map((t) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _TemplateMiniCard(
                      template: t,
                      onTap: () {
                        final idx = templatesAsync.valueOrNull?.indexOf(t) ?? 0;
                        setState(() {
                          _selectedTemplateIdx = idx;
                          _templateDayIdx = 0;
                          _activeTab = 1;
                        });
                      },
                    ),
                  )) ??
                  [],
            ],
          );
        }

        final day = p.days[_myPlanDay.clamp(0, p.days.length - 1)];
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
                  selected: i == _myPlanDay,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    setState(() => _myPlanDay = i);
                  },
                ),
              ),
            ),
            const SizedBox(height: 16),
            _DayDetail(key: ValueKey('plan-$_myPlanDay'), day: day),
          ],
        );
      },
    );
  }

  Widget _buildTemplatesTab(
    BuildContext context,
    AsyncValue<List<TemplateWorkoutProgram>> templatesAsync,
  ) {
    final palette = context.palette;

    return templatesAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => ListView(
        padding: const EdgeInsets.all(AppSpacing.pageHorizontalPadding),
        children: [
          for (final t in defaultFallbackTemplates)
            _TemplateMiniCard(
              template: t,
              onTap: () {
                final idx = defaultFallbackTemplates.indexOf(t);
                setState(() {
                  _selectedTemplateIdx = idx;
                  _templateDayIdx = 0;
                });
              },
            ),
        ],
      ),
      data: (templatesList) {
        final list = templatesList.isNotEmpty ? templatesList : defaultFallbackTemplates;
        final selected = list[_selectedTemplateIdx.clamp(0, list.length - 1)];
        final currentDay = selected.days.isNotEmpty
            ? selected.days[_templateDayIdx.clamp(0, selected.days.length - 1)]
            : null;

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(AppSpacing.pageHorizontalPadding, 12, AppSpacing.pageHorizontalPadding, 24),
          children: [
            // Template Selector Bar
            SizedBox(
              height: 48,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final t = list[i];
                  final isSel = i == _selectedTemplateIdx;
                  return GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() {
                        _selectedTemplateIdx = i;
                        _templateDayIdx = 0;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSel ? AppColors.primary : palette.surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: isSel ? AppColors.primary : palette.border),
                        boxShadow: isSel
                            ? [BoxShadow(color: AppColors.primary.withValues(alpha: 0.25), blurRadius: 8, offset: const Offset(0, 2))]
                            : null,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        t.badge ?? t.name.split(' ').first,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: isSel ? Colors.white : palette.text,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 14),

            // Active Template Header Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: palette.surface,
                borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
                border: Border.all(color: palette.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          selected.badge ?? selected.difficulty.toUpperCase(),
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                      Text(
                        '${selected.trainingDays} days · ${selected.exerciseCount} exercises',
                        style: AppTypography.caption.copyWith(color: palette.textSecondary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    selected.name,
                    style: AppTypography.heading.copyWith(fontSize: 20, fontWeight: FontWeight.w800, color: palette.text),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    selected.description,
                    style: AppTypography.bodySmall.copyWith(color: palette.textSecondary, height: 1.35),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Day Selector Chips
            if (selected.days.length > 1) ...[
              Text(
                'Training Days',
                style: AppTypography.sectionHeading.copyWith(fontSize: 16, color: palette.text),
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 88,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: selected.days.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (_, i) => _DayChip(
                    day: selected.days[i],
                    selected: i == _templateDayIdx,
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() => _templateDayIdx = i);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Day Detail View
            if (currentDay != null)
              _DayDetail(
                key: ValueKey('template-$_selectedTemplateIdx-$_templateDayIdx'),
                day: currentDay,
              ),
          ],
        );
      },
    );
  }
}

class _TabButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _TabButton({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        decoration: BoxDecoration(
          color: selected ? palette.surface : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: selected
              ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 1))]
              : null,
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 15,
              color: selected ? AppColors.primary : palette.textMuted,
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected ? palette.text : palette.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AssignedProgramCard extends StatelessWidget {
  final TemplateWorkoutProgram program;
  const _AssignedProgramCard({required this.program});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(color: AppColors.primary.withValues(alpha: 0.06), blurRadius: 12, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  program.badge ?? 'ASSIGNED PLAN',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.primary),
                ),
              ),
              Text(
                '${program.trainingDays} days · ${program.exerciseCount} exercises',
                style: AppTypography.caption.copyWith(color: palette.textSecondary),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            program.name,
            style: AppTypography.heading.copyWith(fontSize: 22, fontWeight: FontWeight.w800, color: palette.text),
          ),
          if (program.description.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              program.description,
              style: AppTypography.bodySmall.copyWith(color: palette.textSecondary, height: 1.3),
            ),
          ],
        ],
      ),
    );
  }
}

class _TemplateMiniCard extends StatelessWidget {
  final TemplateWorkoutProgram template;
  final VoidCallback onTap;

  const _TemplateMiniCard({required this.template, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final isChest = template.key == 'chest_hypertrophy_sculpt';
    const roseColor = Color(0xFFE11D48);

    return RepsiPress(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: palette.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isChest ? roseColor.withValues(alpha: 0.3) : palette.border,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: isChest ? roseColor.withValues(alpha: 0.12) : AppColors.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                isChest ? LucideIcons.flame : LucideIcons.dumbbell,
                color: isChest ? roseColor : AppColors.primary,
                size: 22,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    template.name,
                    style: AppTypography.headingSmall.copyWith(fontSize: 15, fontWeight: FontWeight.w700, color: palette.text),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${template.trainingDays} Days · ${template.exerciseCount} Exercises · ${template.difficulty}',
                    style: AppTypography.caption.copyWith(color: palette.textSecondary, fontSize: 12),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: palette.textMuted),
          ],
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
        constraints: const BoxConstraints(minHeight: 196),
        child: Stack(
          children: [
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
    final title = day.name != null
        ? day.name!.split('-').first.split(':').last.trim()
        : dayFocusLabel(l, day.focus);

    return Semantics(
      button: true,
      selected: selected,
      child: RepsiPress(
        onTap: onTap,
        child: AnimatedContainer(
          duration: RepsiMotion.nav,
          curve: RepsiMotion.easeOut,
          width: 130,
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
              Text(
                'Day ${day.index}',
                style: AppTypography.caption.copyWith(
                  color: selected ? Colors.white.withValues(alpha: 0.85) : palette.textSecondary,
                  fontWeight: FontWeight.w600,
                  fontSize: 11,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.bodySmall.copyWith(
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                  color: selected ? Colors.white : palette.text,
                ),
              ),
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
    final dayTitle = day.name ?? dayFocusLabel(l, day.focus);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Day Summary Card with Start Button
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
                        Text(
                          dayTitle,
                          style: AppTypography.sectionHeading.copyWith(fontSize: 16, color: palette.text, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${day.exercises.length} Exercises · ${day.estimatedMinutes} Mins',
                          style: AppTypography.caption.copyWith(color: palette.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              // Trainer Direction / Cues
              if (day.notes != null && day.notes!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(LucideIcons.sparkles, size: 16, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Coach Direction',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              day.notes!,
                              style: AppTypography.caption.copyWith(
                                color: palette.text,
                                fontSize: 12,
                                height: 1.35,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],

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
        const SizedBox(height: 16),

        // Grouped Exercise List
        for (final (i, e) in day.exercises.indexed)
          RepsiStaggerItem(
            index: i,
            delay: const Duration(milliseconds: 40),
            child: Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: ExerciseRow(
                number: i + 1,
                exercise: e,
                onTap: () => showExerciseSheet(context, e),
              ),
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
    final isSuperset = exercise.isSuperset;

    return RepsiPress(
      onTap: onTap,
      pressedScale: 0.98,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSuperset ? Colors.amber.withValues(alpha: 0.05) : palette.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSuperset ? Colors.amber.withValues(alpha: 0.35) : palette.border,
            width: isSuperset ? 1.5 : 1.0,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: ExerciseDemonstrationMedia(
                    mediaUrl: exercise.mediaUrl,
                    exerciseName: exercise.name,
                    width: 52,
                    height: 52,
                    borderRadius: BorderRadius.circular(10),
                    showControls: false,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          if (isSuperset) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.amber.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                '⚡ SUPERSET ${exercise.groupLabel}',
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.amber,
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                          ],
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: palette.surfaceSecondary,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              exercise.section.toUpperCase(),
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                color: palette.textMuted,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        exercise.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.bodySmall.copyWith(
                          fontWeight: FontWeight.w700,
                          color: palette.text,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Wrap(
                        children: [
                          Text(
                            prescription(l, exercise),
                            style: AppTypography.caption.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                          if (exercise.restSeconds > 0) ...[
                            Text(
                              ' · ${l.restSeconds(exercise.restSeconds)}',
                              style: AppTypography.caption.copyWith(color: palette.textSecondary, fontSize: 12),
                            ),
                          ] else if (isSuperset) ...[
                            Text(
                              ' · 0s rest (drop)',
                              style: AppTypography.caption.copyWith(color: Colors.amber, fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                          ],
                          if (exercise.targetWeightKg != null) ...[
                            Text(
                              ' · ${exercise.targetWeightKg}kg',
                              style: AppTypography.caption.copyWith(color: palette.textSecondary, fontSize: 12),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                Icon(Icons.info_outline_rounded, size: 20, color: palette.textMuted),
              ],
            ),
            if (exercise.notes != null && exercise.notes!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: palette.surfaceSecondary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  exercise.notes!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 11, color: palette.textSecondary, fontStyle: FontStyle.italic),
                ),
              ),
            ],
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
        initialChildSize: 0.76,
        maxChildSize: 0.94,
        builder: (_, scroll) => ListView(
          controller: scroll,
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            Center(
              child: Container(
                  width: 40, height: 4, decoration: BoxDecoration(color: palette.border, borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: SizedBox(
                height: 200,
                width: double.infinity,
                child: ExerciseDemonstrationMedia(
                  mediaUrl: e.mediaUrl,
                  exerciseName: e.name,
                  height: 200,
                  width: double.infinity,
                  borderRadius: BorderRadius.circular(16),
                  showControls: true,
                  showBadge: true,
                  badgeText: 'Form Demonstration',
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(e.name, style: AppTypography.heading.copyWith(fontSize: 22, fontWeight: FontWeight.w800, color: palette.text)),
            const SizedBox(height: 8),
            Wrap(spacing: 6, runSpacing: 6, children: [
              if (e.isSuperset)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.amber.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text('SUPERSET ${e.groupLabel}',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.amber)),
                ),
              for (final m in e.primaryMuscles) _Tag(text: m.replaceAll('_', ' ')),
              for (final q in e.equipment) _Tag(text: q.replaceAll('_', ' '), muted: true),
            ]),
            const SizedBox(height: 12),
            Text('${prescription(l, e)} · ${l.restSeconds(e.restSeconds)}${e.targetWeightKg != null ? " · ${e.targetWeightKg} kg" : ""}',
                style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: AppColors.primary)),
            if (e.notes != null && e.notes!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Direction & Cue', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11, color: AppColors.primary)),
                    const SizedBox(height: 2),
                    Text(e.notes!, style: TextStyle(fontSize: 13, color: palette.text, height: 1.35)),
                  ],
                ),
              ),
            ],
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
