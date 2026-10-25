import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../app/routes/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/api/api_error.dart';
import '../../../../core/providers/storage_provider.dart';
import '../../../../shared/animations/repsi_press.dart';
import '../../../../shared/animations/repsi_stagger.dart';
import '../../../../shared/widgets/repsi_avatar.dart';
import '../../../../shared/widgets/repsi_button.dart';
import '../../../../shared/widgets/repsi_card.dart';
import '../../../../shared/widgets/repsi_skeleton.dart';
import '../../../attendance/providers/attendance_provider.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../coaching/data/coaching_api.dart';
import '../../../coaching/views/goal_setup_view.dart';
import '../../../coaching/views/my_trainer_view.dart';
import '../../../coaching/views/workout_plan_view.dart';
import '../../../health/data/health_models.dart';
import '../../../health/providers/health_provider.dart';
import '../../data/member_self_provider.dart';
import 'membership_payments_view.dart';
import 'qr_attendance_view.dart';
import 'trainer_chat_view.dart';
import '../../../ai/views/ai_workout_coach_view.dart';
import '../../../../l10n/l10n.dart';
import '../../../../app/theme/repsi_palette.dart';

class MemberHomeView extends ConsumerStatefulWidget {
  /// Switches the member shell to the Workouts tab.
  final VoidCallback? onOpenWorkouts;

  const MemberHomeView({super.key, this.onOpenWorkouts});

  @override
  ConsumerState<MemberHomeView> createState() => _MemberHomeViewState();
}

class _MemberHomeViewState extends ConsumerState<MemberHomeView> {
  @override
  void initState() {
    super.initState();
    // Reads the server copy and, if the member already connected Health Connect, refreshes it.
    Future.microtask(() => ref.read(healthProvider.notifier).load());
    Future.microtask(_promptForGoalOnce);
  }

  /// New members are asked for their goal once per account; afterwards the home card invites them.
  Future<void> _promptForGoalOnce() async {
    final userId = ref.read(authProvider).user?.id;
    final prefs = ref.read(sharedPreferencesProvider);
    if (userId == null || prefs == null) return;
    final key = 'repsi_goal_prompted_$userId';
    if (prefs.getBool(key) == true) return;
    try {
      final overview = await ref.read(coachingOverviewProvider.future);
      if (overview.goal != null || !mounted) return;
      await prefs.setBool(key, true);
      if (!mounted) return;
      await Navigator.of(context).push(MaterialPageRoute(
          fullscreenDialog: true, builder: (_) => const GoalSetupView(openPlanWhenDone: false)));
    } catch (_) {
      // No member profile in this gym yet, or offline: the home card covers it later.
    }
  }

  Future<void> _refresh() async {
    ref.invalidate(memberSelfProvider);
    ref.invalidate(myAttendanceProvider);
    ref.invalidate(coachingOverviewProvider);
    ref.invalidate(workoutSuggestionsProvider);
    await Future.wait([
      ref.read(healthProvider.notifier).load(),
      ref.read(memberSelfProvider.future).then((_) {}, onError: (_) {}),
      ref.read(coachingOverviewProvider.future).then((_) {}, onError: (_) {}),
    ]);
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return context.l10n.greetingMorning;
    if (hour < 17) return context.l10n.greetingAfternoon;
    return context.l10n.greetingEvening;
  }

  void _push(Widget page) => Navigator.push(context, MaterialPageRoute(builder: (_) => page));

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final fullName = ref.watch(authProvider.select((s) => s.user?.fullName)) ?? '';
    final firstName = fullName.trim().split(' ').firstOrNull ?? '';
    final actions = [
      (LucideIcons.qrCode, l.myPass, () => _push(const QrAttendanceView())),
      (LucideIcons.userRound, l.myTrainer, () => _push(const MyTrainerView())),
      (LucideIcons.messageCircle, l.messages, () => _push(const TrainerChatView())),
      (LucideIcons.receipt, l.commonPayments, () => _push(const MembershipPaymentsView())),
      (LucideIcons.sparkles, l.aiCoach, () => _push(const AiWorkoutCoachView())),
      (LucideIcons.dumbbell, l.navWorkout, widget.onOpenWorkouts ?? () => _push(const WorkoutPlanView())),
    ];
    var i = 0;

    return Scaffold(
      backgroundColor: palette.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(AppSpacing.pageHorizontalPadding, 12, AppSpacing.pageHorizontalPadding, 24),
            children: [
              RepsiStaggerItem(
                index: i++,
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_greeting(),
                              style: AppTypography.caption.copyWith(color: palette.textSecondary, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 2),
                          Text(
                            firstName.isEmpty ? l.letsTrain : firstName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTypography.heading.copyWith(fontSize: 26, fontWeight: FontWeight.w800, color: palette.text),
                          ),
                        ],
                      ),
                    ),
                    IconButton.filledTonal(
                      tooltip: l.commonNotifications,
                      style: IconButton.styleFrom(backgroundColor: palette.surface, minimumSize: const Size(48, 48)),
                      onPressed: () => context.push(RouteNames.notifications),
                      icon: Icon(LucideIcons.bell, color: palette.text, size: 20),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              RepsiStaggerItem(index: i++, child: _CoachingSection(onOpenWorkouts: actions.last.$3)),
              const SizedBox(height: 12),
              RepsiStaggerItem(index: i++, child: const _MembershipCard()),
              const SizedBox(height: 12),
              RepsiStaggerItem(index: i++, child: const _AttendanceCard()),
              const SizedBox(height: 12),
              RepsiStaggerItem(index: i++, child: const _ActivityCard()),
              const SizedBox(height: 20),
              Text(l.quickAccess, style: AppTypography.sectionHeading.copyWith(fontSize: 16, color: palette.text)),
              const SizedBox(height: 10),
              LayoutBuilder(builder: (context, c) {
                const gap = 10.0;
                final width = (c.maxWidth - gap * 2) / 3;
                return Wrap(
                  spacing: gap,
                  runSpacing: gap,
                  children: [
                    for (final (n, a) in actions.indexed)
                      SizedBox(
                        width: width,
                        child: RepsiStaggerItem(
                          index: i + n,
                          delay: const Duration(milliseconds: 40),
                          child: _QuickAction(icon: a.$1, label: a.$2, onTap: a.$3),
                        ),
                      ),
                  ],
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickAction({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return RepsiCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 64),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(color: palette.primarySoft, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: AppColors.primary, size: 20),
            ),
            const SizedBox(height: 8),
            Text(label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.caption.copyWith(color: palette.text, fontWeight: FontWeight.w600, height: 1.25)),
          ],
        ),
      ),
    );
  }
}

/// Goal + plan hero (or the invitation to set one) and the member's trainer.
class _CoachingSection extends ConsumerWidget {
  final VoidCallback onOpenWorkouts;
  const _CoachingSection({required this.onOpenWorkouts});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l10n;
    final palette = context.palette;
    final overview = ref.watch(coachingOverviewProvider);
    return overview.when(
      loading: () => const RepsiSkeleton(height: 150),
      // No member profile in this gym (403) or offline: the rest of home still works.
      error: (_, __) => const SizedBox.shrink(),
      data: (o) {
        final plan = ref.watch(workoutSuggestionsProvider).valueOrNull;
        final trainer = o.trainers.firstOrNull;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (o.goal == null)
              _SetGoalCard(
                onTap: () => Navigator.of(context).push(MaterialPageRoute(
                    fullscreenDialog: true, builder: (_) => const GoalSetupView(openPlanWhenDone: false))),
              )
            else if (plan != null)
              GoalHeroCard(plan: plan, onTap: onOpenWorkouts)
            else
              const RepsiSkeleton(height: 150),
            const SizedBox(height: 12),
            RepsiCard(
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const MyTrainerView())),
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  if (trainer != null)
                    RepsiAvatar(name: trainer.name, imageUrl: trainer.photoUrl, size: 44)
                  else
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(color: palette.primarySoft, shape: BoxShape.circle),
                      child: const Icon(Icons.sports_rounded, color: AppColors.primary),
                    ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          trainer?.name ?? (o.hasPendingRequest ? l.requestPendingTitle : l.getATrainer),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text, fontSize: 15),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          trainer != null
                              ? (trainer.specialization ?? l.yourTrainer)
                              : (o.hasPendingRequest ? l.requestPendingShort : l.getATrainerHint),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.caption.copyWith(color: palette.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(trainer != null ? Icons.chat_bubble_outline_rounded : Icons.chevron_right_rounded,
                      color: trainer != null ? AppColors.primary : palette.textMuted),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

class _SetGoalCard extends StatelessWidget {
  final VoidCallback onTap;
  const _SetGoalCard({required this.onTap});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    return RepsiPress(
      onTap: onTap,
      pressedScale: 0.98,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          gradient: const LinearGradient(colors: AppColors.inkGradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l.setGoalCardTitle,
                      style: AppTypography.heading.copyWith(color: AppColors.inkText, fontSize: 20, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Text(l.setGoalCardBody,
                      style: AppTypography.bodySmall.copyWith(color: AppColors.inkTextSecondary, height: 1.4)),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: AppColors.energyGradient),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Text(l.setMyGoal, style: AppTypography.bodySmall.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
                      const SizedBox(width: 6),
                      const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 16),
                    ]),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withValues(alpha: 0.16),
              ),
              child: const Icon(Icons.flag_rounded, color: AppColors.primaryBright, size: 32),
            ),
          ],
        ),
      ),
    );
  }
}

class _MembershipCard extends ConsumerWidget {
  const _MembershipCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(memberSelfProvider);
    return RepsiCard(
      padding: const EdgeInsets.all(16),
      child: profile.when(
        loading: () => const RepsiSkeleton(height: 48),
        error: (e, _) => _InlineError(
          message:
              e is ApiError ? e.message : context.l10n.errorLoadMembership,
          onRetry: () => ref.invalidate(memberSelfProvider),
        ),
        data: (member) {
          final m = member.membership;
          if (m == null) {
            return Text(
                context.l10n.noMembershipYet,
                style: AppTypography.bodySecondary
                    .copyWith(color: context.palette.textSecondary));
          }
          final days = m.daysLeft.inDays;
          final expired = m.daysLeft.isNegative;
          final soon = !expired && days <= 7;
          return Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(m.planName,
                        style: AppTypography.sectionHeading
                            .copyWith(color: context.palette.text)),
                    const SizedBox(height: 2),
                    Text(
                      expired
                          ? context.l10n.memberExpiredOn(L10n.date(m.endDate))
                          : context.l10n.memberValidUntil(L10n.date(m.endDate)),
                      style: AppTypography.bodySecondary
                          .copyWith(color: context.palette.textSecondary),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: expired
                      ? context.palette.errorSoft
                      : (soon ? context.palette.warningSoft : context.palette.successSoft),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  expired ? context.l10n.commonExpired : (soon ? context.l10n.commonDaysLeft(days) : context.l10n.commonActive),
                  style: AppTypography.caption.copyWith(
                    fontWeight: FontWeight.w700,
                    color: expired
                        ? context.palette.errorDark
                        : (soon
                            ? context.palette.warningDark
                            : context.palette.successDark),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _AttendanceCard extends ConsumerWidget {
  const _AttendanceCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final attendance = ref.watch(myAttendanceProvider);
    return RepsiCard(
      padding: const EdgeInsets.all(16),
      child: attendance.when(
        loading: () => const RepsiSkeleton(height: 84),
        error: (e, _) => _InlineError(
          message:
              e is ApiError ? e.message : context.l10n.errorLoadYourAttendance,
          onRetry: () => ref.invalidate(myAttendanceProvider),
        ),
        data: (a) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _Metric(
                    value: '${a.streakDays}',
                    label: context.l10n.commonDayStreak,
                    icon: Icons.local_fire_department_rounded,
                    color: AppColors.primary),
                _Metric(
                    value: '${a.thisWeekVisits}',
                    label: context.l10n.commonThisWeek,
                    icon: Icons.event_available_rounded,
                    color: context.palette.success),
                _Metric(
                    value: '${a.thisMonthVisits}',
                    label: context.l10n.commonThisMonth,
                    icon: Icons.calendar_month_rounded,
                    color: context.palette.info),
              ],
            ),
            const SizedBox(height: 14),
            RepsiButton(
              text: a.isInside
                  ? context.l10n.memberCheckedInSince(DateFormat.jm().format(a.activeVisit!.checkInTime))
                  : context.l10n.checkInWithQr,
              variant: a.isInside
                  ? RepsiButtonVariant.outline
                  : RepsiButtonVariant.primary,
              isFullWidth: true,
              leadingIcon: Icon(
                  a.isInside
                      ? Icons.check_circle_outline_rounded
                      : Icons.qr_code_scanner_rounded,
                  size: 18),
              onPressed: () async {
                await Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const QrAttendanceView()));
                ref.invalidate(myAttendanceProvider);
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _ActivityCard extends ConsumerWidget {
  const _ActivityCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final health = ref.watch(healthProvider);
    final notifier = ref.read(healthProvider.notifier);
    final nf = NumberFormat.decimalPattern();

    Widget body;
    if (health.availability == HealthAvailability.unsupported &&
        !health.connected) {
      body = Text(
          context.l10n.healthAndroidOnly,
          style: AppTypography.bodySecondary
              .copyWith(color: context.palette.textSecondary));
    } else if (!health.connected) {
      body = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            health.availability == HealthAvailability.available
                ? context.l10n.healthConnectPitch
                : context.l10n.healthConnectNeeded,
            style: AppTypography.bodySecondary
                .copyWith(color: context.palette.textSecondary),
          ),
          const SizedBox(height: 12),
          RepsiButton(
            text: switch (health.availability) {
              HealthAvailability.available => context.l10n.healthConnect,
              HealthAvailability.updateRequired => context.l10n.healthUpdate,
              _ => context.l10n.healthInstall,
            },
            variant: RepsiButtonVariant.outline,
            isFullWidth: true,
            isLoading: health.syncing,
            onPressed: notifier.connect,
          ),
        ],
      );
    } else {
      final today = health.summary.today;
      body = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _Metric(
                  value: nf.format(today?.steps ?? 0),
                  label: context.l10n.steps,
                  icon: Icons.directions_walk_rounded,
                  color: context.palette.info),
              _Metric(
                value: nf.format((today?.activeCalories ?? 0).round()),
                label: context.l10n.activeKcal,
                icon: Icons.local_fire_department_rounded,
                color: AppColors.primary,
              ),
              _Metric(
                value: ((today?.distanceMeters ?? 0) / 1000).toStringAsFixed(1),
                label: 'km',
                icon: Icons.route_rounded,
                color: context.palette.success,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            [
              context.l10n.healthAverageSteps(nf.format(health.summary.averageSteps)),
              if (health.summary.lastSyncedAt != null) context.l10n.healthSyncedAt(DateFormat.jm().format(health.summary.lastSyncedAt!)),
            ].join(' · '),
            style: AppTypography.caption.copyWith(color: context.palette.textSecondary),
          ),
          Wrap(
            children: [
              TextButton(
                onPressed: health.syncing ? null : () => notifier.sync(force: true),
                child: Text(context.l10n.syncNow),
              ),
              TextButton(
                onPressed: health.syncing ? null : () => _confirmDisconnect(context, notifier),
                child: Text(context.l10n.disconnect),
              ),
            ],
          ),
        ],
      );
    }

    return RepsiCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                  child: Text(context.l10n.todaysActivity,
                      style: AppTypography.sectionHeading
                          .copyWith(fontSize: 16, color: context.palette.text))),
              if (health.syncing)
                const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2)),
            ],
          ),
          const SizedBox(height: 10),
          body,
          if (health.error != null) ...[
            const SizedBox(height: 8),
            Text(health.error!,
                style: AppTypography.caption.copyWith(color: context.palette.error)),
          ],
        ],
      ),
    );
  }

  Future<void> _confirmDisconnect(
      BuildContext context, HealthNotifier notifier) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.l10n.healthDisconnectTitle),
        content: Text(
            context.l10n.healthDisconnectBody),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(context.l10n.commonCancel)),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(context.l10n.disconnect)),
        ],
      ),
    );
    if (ok == true) await notifier.disconnect();
  }
}

class _Metric extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color color;

  const _Metric(
      {required this.value,
      required this.label,
      required this.icon,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(value,
                style: AppTypography.heading
                    .copyWith(fontSize: 20, color: context.palette.text)),
          ),
          Text(label,
              style: AppTypography.caption
                  .copyWith(color: context.palette.textSecondary)),
        ],
      ),
    );
  }
}

class _InlineError extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _InlineError({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(Icons.error_outline_rounded,
            color: context.palette.error, size: 20),
        const SizedBox(width: 8),
        Expanded(
            child: Text(message,
                style: AppTypography.bodySecondary
                    .copyWith(color: context.palette.textSecondary))),
        TextButton(onPressed: onRetry, child: Text(context.l10n.commonRetry)),
      ],
    );
  }
}
