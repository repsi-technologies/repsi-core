import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
import '../coaching_labels.dart';
import '../data/coaching_api.dart';
import '../data/coaching_models.dart';
import 'workout_plan_view.dart';

/// Four short steps: goal, experience, schedule, focus areas. Saving appends a new goal on the
/// server (history is kept) and opens the suggested weekly plan.
class GoalSetupView extends ConsumerStatefulWidget {
  final MemberGoal? initial;

  /// When false (editing from the plan screen) the view just pops after saving.
  final bool openPlanWhenDone;

  const GoalSetupView({super.key, this.initial, this.openPlanWhenDone = true});

  @override
  ConsumerState<GoalSetupView> createState() => _GoalSetupViewState();
}

class _GoalSetupViewState extends ConsumerState<GoalSetupView> {
  static const _steps = 4;
  static const _minuteOptions = [20, 30, 45, 60, 75, 90];
  final _pages = PageController();
  late final GoalDraft _draft = GoalDraft.from(widget.initial);
  int _step = 0;
  bool _saving = false;
  bool _done = false;

  @override
  void dispose() {
    _pages.dispose();
    super.dispose();
  }

  bool get _canContinue => _step != 0 || _draft.goal != null;

  void _go(int step) {
    setState(() => _step = step);
    _pages.animateToPage(step, duration: RepsiMotion.page, curve: RepsiMotion.easeInOut);
  }

  Future<void> _next() async {
    if (!_canContinue) return;
    HapticFeedback.lightImpact();
    if (_step < _steps - 1) return _go(_step + 1);
    setState(() => _saving = true);
    try {
      await ref.read(coachingApiProvider).setGoal(_draft);
      ref.invalidate(coachingOverviewProvider);
      ref.invalidate(workoutSuggestionsProvider);
      if (!mounted) return;
      setState(() => _done = true);
      await Future<void>.delayed(const Duration(milliseconds: 1100));
      if (!mounted) return;
      if (widget.openPlanWhenDone) {
        Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const WorkoutPlanView()));
      } else {
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e is ApiError ? e.message : context.l10n.goalSaveFailed)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    if (_done) return _GoalSavedSplash(goal: _draft.goal!);

    return PopScope(
      canPop: _step == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _go(_step - 1);
      },
      child: Scaffold(
        backgroundColor: palette.background,
        appBar: AppBar(
          backgroundColor: palette.background,
          leading: IconButton(
            tooltip: _step == 0 ? l.commonClose : l.commonBack,
            icon: Icon(_step == 0 ? Icons.close_rounded : Icons.arrow_back_rounded),
            onPressed: () => _step == 0 ? Navigator.of(context).maybePop() : _go(_step - 1),
          ),
          title: Text(l.goalStepCounter(_step + 1, _steps), style: AppTypography.caption.copyWith(color: palette.textSecondary)),
          centerTitle: true,
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(6),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pageHorizontalPadding),
              child: TweenAnimationBuilder<double>(
                tween: Tween(end: (_step + 1) / _steps),
                duration: RepsiMotion.card,
                curve: RepsiMotion.easeOut,
                builder: (_, v, __) => ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: v,
                    minHeight: 6,
                    backgroundColor: palette.surfaceSecondary,
                    valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                  ),
                ),
              ),
            ),
          ),
        ),
        body: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: PageView(
                  controller: _pages,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    _StepScaffold(
                      title: l.goalQuestionTitle,
                      subtitle: l.goalQuestionSubtitle,
                      child: _GoalGrid(
                        selected: _draft.goal,
                        onSelect: (g) => setState(() => _draft.goal = g),
                      ),
                    ),
                    _StepScaffold(
                      title: l.levelQuestionTitle,
                      subtitle: l.levelQuestionSubtitle,
                      child: Column(
                        children: [
                          for (final (i, level) in FitnessLevel.values.indexed)
                            RepsiStaggerItem(
                              index: i,
                              child: Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: _ChoiceTile(
                                  selected: _draft.level == level,
                                  color: AppColors.primary,
                                  onTap: () => setState(() => _draft.level = level),
                                  leading: _LevelBars(bars: level.bars, active: _draft.level == level),
                                  title: level.label(l),
                                  subtitle: level.description(l),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    _StepScaffold(
                      title: l.scheduleQuestionTitle,
                      subtitle: l.scheduleQuestionSubtitle,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(l.daysPerWeekLabel, style: AppTypography.sectionHeading.copyWith(color: palette.text)),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              for (var d = 2; d <= 6; d++) ...[
                                Expanded(
                                  child: _RoundChoice(
                                    label: '$d',
                                    selected: _draft.daysPerWeek == d,
                                    onTap: () => setState(() => _draft.daysPerWeek = d),
                                    semantics: l.daysPerWeekValue(d),
                                  ),
                                ),
                                if (d < 6) const SizedBox(width: 8),
                              ],
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(l.daysPerWeekValue(_draft.daysPerWeek),
                              style: AppTypography.caption.copyWith(color: palette.textSecondary)),
                          const SizedBox(height: 28),
                          Text(l.sessionLengthLabel, style: AppTypography.sectionHeading.copyWith(color: palette.text)),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              for (final m in _minuteOptions)
                                _PillChoice(
                                  label: l.unitMinutes(m),
                                  selected: _draft.sessionMinutes == m,
                                  onTap: () => setState(() => _draft.sessionMinutes = m),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    _StepScaffold(
                      title: l.focusQuestionTitle,
                      subtitle: l.focusQuestionSubtitle,
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 10,
                        children: [
                          for (final code in focusAreaCodes)
                            _PillChoice(
                              label: focusAreaLabel(l, code),
                              selected: _draft.focusAreas.contains(code),
                              showCheck: true,
                              onTap: () => setState(() => _draft.focusAreas.contains(code)
                                  ? _draft.focusAreas.remove(code)
                                  : _draft.focusAreas.add(code)),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.pageHorizontalPadding, 8, AppSpacing.pageHorizontalPadding, 16),
                child: RepsiButton(
                  text: _step == _steps - 1 ? l.buildMyPlan : l.commonContinue,
                  isFullWidth: true,
                  isLoading: _saving,
                  trailingIcon: Icon(_step == _steps - 1 ? Icons.check_rounded : Icons.arrow_forward_rounded, size: 18),
                  onPressed: _canContinue ? _next : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StepScaffold extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget child;
  const _StepScaffold({required this.title, required this.subtitle, required this.child});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(AppSpacing.pageHorizontalPadding, 20, AppSpacing.pageHorizontalPadding, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RepsiStaggerItem(
            child: Text(title, style: AppTypography.heading.copyWith(fontSize: 24, fontWeight: FontWeight.w800, color: palette.text)),
          ),
          const SizedBox(height: 6),
          RepsiStaggerItem(
            index: 1,
            child: Text(subtitle, style: AppTypography.bodySecondary.copyWith(color: palette.textSecondary)),
          ),
          const SizedBox(height: 24),
          child,
        ],
      ),
    );
  }
}

class _GoalGrid extends StatelessWidget {
  final FitnessGoal? selected;
  final ValueChanged<FitnessGoal> onSelect;
  const _GoalGrid({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    return LayoutBuilder(builder: (context, c) {
      final width = (c.maxWidth - 12) / 2;
      return Wrap(
        spacing: 12,
        runSpacing: 12,
        children: [
          for (final (i, g) in FitnessGoal.values.indexed)
            SizedBox(
              width: width,
              child: RepsiStaggerItem(
                index: i + 1,
                child: _GoalCard(goal: g, label: g.label(l), description: g.description(l), selected: selected == g,
                    onTap: () {
                  HapticFeedback.selectionClick();
                  onSelect(g);
                }),
              ),
            ),
        ],
      );
    });
  }
}

class _GoalCard extends StatelessWidget {
  final FitnessGoal goal;
  final String label;
  final String description;
  final bool selected;
  final VoidCallback onTap;
  const _GoalCard({required this.goal, required this.label, required this.description, required this.selected,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Semantics(
      button: true,
      selected: selected,
      child: RepsiPress(
        onTap: onTap,
        child: AnimatedContainer(
          duration: RepsiMotion.nav,
          curve: RepsiMotion.easeOut,
          constraints: const BoxConstraints(minHeight: 176),
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: selected ? goal.color.withValues(alpha: context.isDarkMode ? 0.18 : 0.08) : palette.surface,
            borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
            border: Border.all(color: selected ? goal.color : palette.border, width: selected ? 2 : 1),
            boxShadow: selected
                ? [BoxShadow(color: goal.color.withValues(alpha: 0.25), blurRadius: 18, offset: const Offset(0, 6))]
                : const [],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: 76,
                width: double.infinity,
                child: Stack(fit: StackFit.expand, children: [
                  Image.asset(goal.imageAsset, fit: BoxFit.cover, cacheWidth: 420,
                      errorBuilder: (_, __, ___) => ColoredBox(color: goal.color.withValues(alpha: 0.2))),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.black.withValues(alpha: 0.05), Colors.black.withValues(alpha: 0.45)],
                      ),
                    ),
                  ),
                  Positioned(
                    left: 10,
                    bottom: 8,
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(color: goal.color, borderRadius: BorderRadius.circular(9)),
                      child: Icon(goal.icon, size: 17, color: Colors.white),
                    ),
                  ),
                  Positioned(
                    right: 8,
                    top: 8,
                    child: AnimatedScale(
                      scale: selected ? 1 : 0,
                      duration: RepsiMotion.nav,
                      curve: RepsiMotion.easeBack,
                      child: const DecoratedBox(
                        decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                        child: Icon(Icons.check_circle_rounded, size: 22, color: AppColors.primary),
                      ),
                    ),
                  ),
                ]),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.sectionHeading.copyWith(fontSize: 15, color: palette.text, height: 1.25)),
              const SizedBox(height: 4),
              Text(description,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.caption.copyWith(color: palette.textSecondary, height: 1.35)),
                ]),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChoiceTile extends StatelessWidget {
  final bool selected;
  final Color color;
  final VoidCallback onTap;
  final Widget leading;
  final String title;
  final String subtitle;
  const _ChoiceTile({required this.selected, required this.color, required this.onTap, required this.leading,
      required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Semantics(
      button: true,
      selected: selected,
      child: RepsiPress(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: AnimatedContainer(
          duration: RepsiMotion.nav,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: selected ? palette.primarySoft : palette.surface,
            borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
            border: Border.all(color: selected ? color : palette.border, width: selected ? 2 : 1),
          ),
          child: Row(
            children: [
              leading,
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: AppTypography.sectionHeading.copyWith(fontSize: 16, color: palette.text)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: AppTypography.caption.copyWith(color: palette.textSecondary, height: 1.35)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              AnimatedScale(
                scale: selected ? 1 : 0,
                duration: RepsiMotion.nav,
                curve: RepsiMotion.easeBack,
                child: Icon(Icons.check_circle_rounded, color: color),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LevelBars extends StatelessWidget {
  final int bars;
  final bool active;
  const _LevelBars({required this.bars, required this.active});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return SizedBox(
      width: 36,
      height: 32,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          for (var i = 1; i <= 3; i++)
            AnimatedContainer(
              duration: Duration(milliseconds: 180 + i * 60),
              width: 8,
              height: 10.0 + i * 7,
              decoration: BoxDecoration(
                color: i <= bars ? (active ? AppColors.primary : palette.textMuted) : palette.surfaceSecondary,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
        ],
      ),
    );
  }
}

class _RoundChoice extends StatelessWidget {
  final String label;
  final String semantics;
  final bool selected;
  final VoidCallback onTap;
  const _RoundChoice({required this.label, required this.semantics, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Semantics(
      label: semantics,
      button: true,
      selected: selected,
      excludeSemantics: true,
      child: RepsiPress(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: AspectRatio(
          aspectRatio: 1,
          child: AnimatedContainer(
            duration: RepsiMotion.nav,
            curve: RepsiMotion.easeOut,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: selected ? const LinearGradient(colors: AppColors.energyGradient, begin: Alignment.topLeft, end: Alignment.bottomRight) : null,
              color: selected ? null : palette.surface,
              border: Border.all(color: selected ? Colors.transparent : palette.border),
            ),
            child: Text(label,
                style: AppTypography.heading.copyWith(
                    fontSize: 20, fontWeight: FontWeight.w800, color: selected ? Colors.white : palette.text)),
          ),
        ),
      ),
    );
  }
}

class _PillChoice extends StatelessWidget {
  final String label;
  final bool selected;
  final bool showCheck;
  final VoidCallback onTap;
  const _PillChoice({required this.label, required this.selected, required this.onTap, this.showCheck = false});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Semantics(
      button: true,
      selected: selected,
      child: RepsiPress(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: AnimatedContainer(
          duration: RepsiMotion.nav,
          constraints: const BoxConstraints(minHeight: 44),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: selected ? AppColors.primary : palette.surface,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: selected ? AppColors.primary : palette.border),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (showCheck)
                AnimatedSize(
                  duration: RepsiMotion.nav,
                  child: selected
                      ? const Padding(
                          padding: EdgeInsets.only(right: 6),
                          child: Icon(Icons.check_rounded, size: 16, color: Colors.white),
                        )
                      : const SizedBox.shrink(),
                ),
              Text(label,
                  style: AppTypography.bodySmall.copyWith(
                      fontWeight: FontWeight.w600, color: selected ? Colors.white : palette.text)),
            ],
          ),
        ),
      ),
    );
  }
}

class _GoalSavedSplash extends StatelessWidget {
  final FitnessGoal goal;
  const _GoalSavedSplash({required this.goal});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    return Scaffold(
      backgroundColor: AppColors.ink,
      body: Center(
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: 1),
          duration: RepsiMotion.success,
          curve: RepsiMotion.easeBack,
          builder: (_, v, child) => Opacity(opacity: v.clamp(0, 1), child: Transform.scale(scale: 0.6 + 0.4 * v, child: child)),
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(colors: AppColors.energyGradient),
                    boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.5), blurRadius: 40)],
                  ),
                  child: Icon(goal.icon, color: Colors.white, size: 44),
                ),
                const SizedBox(height: 24),
                Text(l.goalSavedTitle,
                    textAlign: TextAlign.center,
                    style: AppTypography.heading.copyWith(color: AppColors.inkText, fontSize: 24, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Text(l.goalSavedSubtitle,
                    textAlign: TextAlign.center, style: AppTypography.bodySecondary.copyWith(color: AppColors.inkTextSecondary)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
