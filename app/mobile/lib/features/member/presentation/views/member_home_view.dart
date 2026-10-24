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
import '../../../../shared/widgets/repsi_button.dart';
import '../../../../shared/widgets/repsi_card.dart';
import '../../../../shared/widgets/repsi_skeleton.dart';
import '../../../attendance/providers/attendance_provider.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../health/data/health_models.dart';
import '../../../health/providers/health_provider.dart';
import '../../data/member_self_provider.dart';
import 'membership_payments_view.dart';
import 'qr_attendance_view.dart';
import '../../../ai/views/ai_workout_coach_view.dart';
import '../../../../l10n/l10n.dart';

class MemberHomeView extends ConsumerStatefulWidget {
  const MemberHomeView({super.key});

  @override
  ConsumerState<MemberHomeView> createState() => _MemberHomeViewState();
}

class _MemberHomeViewState extends ConsumerState<MemberHomeView> {
  @override
  void initState() {
    super.initState();
    // Reads the server copy and, if the member already connected Health Connect, refreshes it.
    Future.microtask(() => ref.read(healthProvider.notifier).load());
  }

  Future<void> _refresh() async {
    ref.invalidate(memberSelfProvider);
    ref.invalidate(myAttendanceProvider);
    await Future.wait([
      ref.read(healthProvider.notifier).load(),
      ref.read(memberSelfProvider.future).then((_) {}, onError: (_) {}),
    ]);
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return context.l10n.greetingMorning;
    if (hour < 17) return context.l10n.greetingAfternoon;
    return context.l10n.greetingEvening;
  }

  @override
  Widget build(BuildContext context) {
    final fullName =
        ref.watch(authProvider.select((s) => s.user?.fullName)) ?? '';
    final firstName = fullName.trim().split(' ').firstOrNull ?? '';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.pageHorizontalPadding, vertical: 16),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      firstName.isEmpty
                          ? _greeting()
                          : '${_greeting()}, $firstName',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.heading.copyWith(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: AppColors.text),
                    ),
                  ),
                  IconButton(
                    tooltip: context.l10n.commonNotifications,
                    onPressed: () => context.push(RouteNames.notifications),
                    icon: const Icon(LucideIcons.bell,
                        color: AppColors.text, size: 22),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const _MembershipCard(),
              const SizedBox(height: 12),
              const _AttendanceCard(),
              const SizedBox(height: 12),
              const _ActivityCard(),
              const SizedBox(height: 16),
              Text(context.l10n.quickAccess,
                  style: AppTypography.sectionHeading
                      .copyWith(fontSize: 16, color: AppColors.text)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _QuickAction(
                      icon: LucideIcons.receipt,
                      label: context.l10n.commonPayments,
                      onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) => const MembershipPaymentsView())),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _QuickAction(
                      icon: LucideIcons.qrCode,
                      label: context.l10n.myPass,
                      onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) => const QrAttendanceView())),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _QuickAction(
                      icon: LucideIcons.sparkles,
                      label: context.l10n.aiCoach,
                      onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) => const AiWorkoutCoachView())),
                    ),
                  ),
                ],
              ),
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

  const _QuickAction(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return RepsiCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Column(
        children: [
          Icon(icon, color: AppColors.primary, size: 22),
          const SizedBox(height: 6),
          Text(label,
              style: AppTypography.caption.copyWith(
                  color: AppColors.text, fontWeight: FontWeight.w600)),
        ],
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
                    .copyWith(color: AppColors.textSecondary));
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
                            .copyWith(color: AppColors.text)),
                    const SizedBox(height: 2),
                    Text(
                      expired
                          ? context.l10n.memberExpiredOn(L10n.date(m.endDate))
                          : context.l10n.memberValidUntil(L10n.date(m.endDate)),
                      style: AppTypography.bodySecondary
                          .copyWith(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: expired
                      ? AppColors.errorSoft
                      : (soon ? AppColors.warningSoft : AppColors.successSoft),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  expired ? context.l10n.commonExpired : (soon ? context.l10n.commonDaysLeft(days) : context.l10n.commonActive),
                  style: AppTypography.caption.copyWith(
                    fontWeight: FontWeight.w700,
                    color: expired
                        ? AppColors.errorDark
                        : (soon
                            ? AppColors.warningDark
                            : AppColors.successDark),
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
                    color: AppColors.success),
                _Metric(
                    value: '${a.thisMonthVisits}',
                    label: context.l10n.commonThisMonth,
                    icon: Icons.calendar_month_rounded,
                    color: AppColors.info),
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
              .copyWith(color: AppColors.textSecondary));
    } else if (!health.connected) {
      body = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            health.availability == HealthAvailability.available
                ? context.l10n.healthConnectPitch
                : context.l10n.healthConnectNeeded,
            style: AppTypography.bodySecondary
                .copyWith(color: AppColors.textSecondary),
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
                  color: AppColors.info),
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
                color: AppColors.success,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            [
              context.l10n.healthAverageSteps(nf.format(health.summary.averageSteps)),
              if (health.summary.lastSyncedAt != null) context.l10n.healthSyncedAt(DateFormat.jm().format(health.summary.lastSyncedAt!)),
            ].join(' · '),
            style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
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
                          .copyWith(fontSize: 16, color: AppColors.text))),
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
                style: AppTypography.caption.copyWith(color: AppColors.error)),
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
                    .copyWith(fontSize: 20, color: AppColors.text)),
          ),
          Text(label,
              style: AppTypography.caption
                  .copyWith(color: AppColors.textSecondary)),
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
        const Icon(Icons.error_outline_rounded,
            color: AppColors.error, size: 20),
        const SizedBox(width: 8),
        Expanded(
            child: Text(message,
                style: AppTypography.bodySecondary
                    .copyWith(color: AppColors.textSecondary))),
        TextButton(onPressed: onRetry, child: Text(context.l10n.commonRetry)),
      ],
    );
  }
}
