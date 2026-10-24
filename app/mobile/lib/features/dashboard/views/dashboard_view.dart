import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../app/routes/route_names.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/models/dashboard_metrics_model.dart';
import '../../../shared/widgets/repsi_avatar.dart';
import '../../../shared/widgets/repsi_error_state.dart';
import '../../../shared/widgets/repsi_skeleton.dart';
import '../../auth/providers/auth_provider.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../workspaces/providers/workspace_provider.dart';
import '../providers/dashboard_provider.dart';
import 'owner_search_modal.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

/// Owner home: today's numbers from /dashboard/metrics, who is in the gym from
/// /attendance/currently-inside, and alerts built only from those real figures.
class DashboardView extends ConsumerStatefulWidget {
  const DashboardView({super.key});

  @override
  ConsumerState<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends ConsumerState<DashboardView> {
  Future<void> _refresh() async {
    ref.invalidate(currentlyInsideProvider);
    ref.invalidate(trialStatusProvider);
    await ref.read(dashboardProvider.notifier).fetchMetrics();
  }

  void _openSearch() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const OwnerSearchModal(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final c = _Palette(isDark);
    final auth = ref.watch(authProvider);
    final gymName = ref.watch(workspaceProvider).activeWorkspace?.name ?? auth.user?.gymName ?? 'Your gym';
    final dash = ref.watch(dashboardProvider);
    final metrics = dash.metrics;

    return Scaffold(
      backgroundColor: c.canvas,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: _refresh,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.md, AppSpacing.md, 0),
                sliver: SliverToBoxAdapter(
                  child: _Header(
                    gymName: gymName,
                    userName: auth.user?.fullName ?? '',
                    avatarUrl: auth.user?.avatarUrl,
                    unread: ref.watch(notificationProvider).unreadCount,
                    onSearch: _openSearch,
                    palette: c,
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.lg, AppSpacing.xl, AppSpacing.xxxl),
                sliver: SliverList.list(
                  children: [
                    const _TrialBanner(),
                    if (metrics == null && dash.isLoading)
                      ..._loading()
                    else if (metrics == null)
                      RepsiErrorState(
                        title: "Couldn't load your dashboard",
                        message: dash.errorMessage ?? 'Check your connection and try again.',
                        onRetry: _refresh,
                      )
                    else ...[
                      _RevenueCard(metrics: metrics, palette: c),
                      const SizedBox(height: AppSpacing.md),
                      _TodayStrip(metrics: metrics, palette: c),
                      const SizedBox(height: AppSpacing.xxl),
                      _QuickActions(palette: c),
                      if (metrics.expiringMemberships > 0) ...[
                        const SizedBox(height: AppSpacing.xxl),
                        _SectionTitle('Needs attention', palette: c),
                        _AttentionRow(
                          icon: Icons.event_busy_rounded,
                          tone: isDark ? AppColors.darkWarning : AppColors.warning,
                          title: '${metrics.expiringMemberships} '
                              '${metrics.expiringMemberships == 1 ? 'membership ends' : 'memberships end'} in the next 7 days',
                          subtitle: 'Remind them to renew before access lapses',
                          onTap: () => context.go(RouteNames.members),
                          palette: c,
                        ),
                      ],
                      const SizedBox(height: AppSpacing.xxl),
                      _SectionTitle('Check-ins', trailing: 'Peak ${metrics.attendancePeakHour}', palette: c),
                      _AttendanceChart(points: metrics.attendanceChart, palette: c),
                      const SizedBox(height: AppSpacing.xxl),
                      _InsideNowSection(palette: c),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _loading() => [
        const RepsiSkeleton(width: double.infinity, height: 148, borderRadius: BorderRadius.all(Radius.circular(AppSpacing.radiusCard))),
        const SizedBox(height: AppSpacing.md),
        const RepsiSkeleton(width: double.infinity, height: 84, borderRadius: BorderRadius.all(Radius.circular(AppSpacing.radiusCard))),
        const SizedBox(height: AppSpacing.xxl),
        RepsiSkeleton.chartSkeleton(),
      ];
}

/// Theme-aware colours used throughout the dashboard.
class _Palette {
  final bool dark;
  const _Palette(this.dark);

  Color get canvas => dark ? AppColors.darkBackground : AppColors.background;
  Color get surface => dark ? AppColors.darkSurface : AppColors.surface;
  Color get border => dark ? AppColors.darkBorder : AppColors.border;
  Color get text => dark ? AppColors.darkText : AppColors.text;
  Color get secondary => dark ? AppColors.darkTextSecondary : AppColors.textSecondary;
  Color get success => dark ? AppColors.darkSuccess : AppColors.success;
  Color get error => dark ? AppColors.darkError : AppColors.error;
  Color get accentText => dark ? AppColors.darkPrimaryLight : AppColors.primaryDark;
}

class _Surface extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final _Palette palette;

  const _Surface({required this.child, required this.palette, this.padding = const EdgeInsets.all(AppSpacing.lg)});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
        border: Border.all(color: palette.border),
      ),
      child: child,
    );
  }
}

class _Header extends StatelessWidget {
  final String gymName;
  final String userName;
  final String? avatarUrl;
  final int unread;
  final VoidCallback onSearch;
  final _Palette palette;

  const _Header({
    required this.gymName,
    required this.userName,
    required this.avatarUrl,
    required this.unread,
    required this.onSearch,
    required this.palette,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final greeting = now.hour < 12 ? 'Good morning' : (now.hour < 17 ? 'Good afternoon' : 'Good evening');
    final first = userName.trim().split(' ').first;
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$greeting${first.isEmpty ? '' : ', $first'} · ${DateFormat('EEE d MMM').format(now)}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.caption.copyWith(color: palette.secondary),
              ),
              const SizedBox(height: 2),
              Semantics(
                header: true,
                child: Text(
                  gymName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.heading.copyWith(color: palette.text, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Search',
          onPressed: onSearch,
          icon: Icon(Icons.search_rounded, color: palette.text),
        ),
        IconButton(
          tooltip: unread > 0 ? 'Notifications, $unread unread' : 'Notifications',
          onPressed: () => context.push(RouteNames.notifications),
          icon: Badge(
            isLabelVisible: unread > 0,
            label: Text(unread > 9 ? '9+' : '$unread'),
            backgroundColor: AppColors.primary,
            child: Icon(Icons.notifications_none_rounded, color: palette.text),
          ),
        ),
        Semantics(
          button: true,
          label: 'Account and settings',
          child: InkWell(
            onTap: () => context.go(RouteNames.more),
            customBorder: const CircleBorder(),
            child: Padding(
              padding: const EdgeInsets.all(6),
              child: RepsiAvatar(name: userName, imageUrl: avatarUrl, size: 34),
            ),
          ),
        ),
      ],
    );
  }
}

class _TrialBanner extends ConsumerWidget {
  const _TrialBanner();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trial = ref.watch(trialStatusProvider).valueOrNull;
    if (trial == null || !trial.showBanner) return const SizedBox.shrink();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final days = trial.daysRemaining;
    final text = trial.isExpired || days <= 0
        ? 'Your free trial has ended. Choose a plan on repsi.app to keep using REPSI.'
        : '$days ${days == 1 ? 'day' : 'days'} left in your free trial. Choose a plan on repsi.app anytime.';
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkPrimarySoft : AppColors.primarySoft,
          borderRadius: BorderRadius.circular(AppSpacing.radiusDefault),
        ),
        child: Row(
          children: [
            Icon(Icons.hourglass_bottom_rounded, size: 18, color: isDark ? AppColors.darkPrimaryLight : AppColors.primaryDark),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(text, style: AppTypography.bodySmall.copyWith(color: isDark ? AppColors.darkText : AppColors.text)),
            ),
          ],
        ),
      ),
    );
  }
}

class _RevenueCard extends StatelessWidget {
  final DashboardMetricsModel metrics;
  final _Palette palette;

  const _RevenueCard({required this.metrics, required this.palette});

  @override
  Widget build(BuildContext context) {
    final growth = metrics.revenueGrowthPct;
    final up = growth >= 0;
    final bars = metrics.revenueChart.length > 12
        ? metrics.revenueChart.sublist(metrics.revenueChart.length - 12)
        : metrics.revenueChart;
    final maxV = bars.fold<double>(0, (m, p) => p.value > m ? p.value : m);

    return Semantics(
      label: 'Revenue this month ${_inr.format(metrics.monthlyRevenue)}, '
          '${up ? 'up' : 'down'} ${growth.abs().toStringAsFixed(1)} percent versus last month',
      child: _Surface(
        palette: palette,
        child: ExcludeSemantics(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Revenue this month', style: AppTypography.caption.copyWith(color: palette.secondary)),
                    const SizedBox(height: AppSpacing.xs),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        _inr.format(metrics.monthlyRevenue),
                        style: AppTypography.tabularNumber(fontSize: 32, fontWeight: FontWeight.w700, color: palette.text)
                            .copyWith(letterSpacing: -0.8),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Row(
                      children: [
                        Icon(up ? Icons.trending_up_rounded : Icons.trending_down_rounded,
                            size: 16, color: up ? palette.success : palette.error),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            '${growth.abs().toStringAsFixed(1)}% vs last month',
                            style: AppTypography.caption.copyWith(
                              color: up ? palette.success : palette.error,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (bars.length >= 2 && maxV > 0)
                SizedBox(
                  width: 96,
                  height: 52,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      for (var i = 0; i < bars.length; i++) ...[
                        if (i > 0) const SizedBox(width: 3),
                        Expanded(
                          child: Container(
                            height: 6 + 46 * (bars[i].value / maxV),
                            decoration: BoxDecoration(
                              color: i == bars.length - 1 ? AppColors.primary : AppColors.primary.withValues(alpha: 0.28),
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TodayStrip extends StatelessWidget {
  final DashboardMetricsModel metrics;
  final _Palette palette;

  const _TodayStrip({required this.metrics, required this.palette});

  @override
  Widget build(BuildContext context) {
    Widget cell(String label, int value, String route) => Expanded(
          child: Semantics(
            button: true,
            label: '$label: $value',
            child: InkWell(
              onTap: () => context.go(route),
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
              child: ExcludeSemantics(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.md, horizontal: AppSpacing.sm),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        NumberFormat.decimalPattern('en_IN').format(value),
                        style: AppTypography.tabularNumber(fontSize: 22, fontWeight: FontWeight.w700, color: palette.text),
                      ),
                      const SizedBox(height: 2),
                      Text(label, maxLines: 2, style: AppTypography.caption.copyWith(color: palette.secondary)),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
    Widget divider() => Container(width: 1, height: 40, color: palette.border);

    return _Surface(
      palette: palette,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
      child: IntrinsicHeight(
        child: Row(
          children: [
            cell('Check-ins today', metrics.todayAttendance, RouteNames.operations),
            divider(),
            cell('Active members', metrics.activeMembers, RouteNames.members),
            divider(),
            cell('Renewals due', metrics.expiringMemberships, RouteNames.members),
          ],
        ),
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  final _Palette palette;

  const _QuickActions({required this.palette});

  @override
  Widget build(BuildContext context) {
    final actions = [
      (Icons.person_add_alt_1_rounded, 'Add member', () => context.push(RouteNames.addMember)),
      (Icons.how_to_reg_rounded, 'Attendance', () => context.go(RouteNames.operations)),
      (Icons.payments_rounded, 'Payments', () => context.go(RouteNames.finance)),
      (Icons.groups_rounded, 'Members', () => context.go(RouteNames.members)),
    ];
    return Row(
      children: [
        for (final (icon, label, onTap) in actions)
          Expanded(
            child: Semantics(
              button: true,
              label: label,
              child: InkWell(
                onTap: onTap,
                borderRadius: BorderRadius.circular(AppSpacing.radiusDefault),
                child: ExcludeSemantics(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                    child: Column(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: palette.surface,
                            borderRadius: BorderRadius.circular(AppSpacing.radiusDefault),
                            border: Border.all(color: palette.border),
                          ),
                          child: Icon(icon, size: 22, color: palette.accentText),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTypography.caption.copyWith(color: palette.text, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  final String? trailing;
  final _Palette palette;

  const _SectionTitle(this.title, {this.trailing, required this.palette});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        children: [
          Expanded(
            child: Semantics(
              header: true,
              child: Text(title, style: AppTypography.sectionHeading.copyWith(color: palette.text, fontSize: 17)),
            ),
          ),
          if (trailing != null) Text(trailing!, style: AppTypography.caption.copyWith(color: palette.secondary)),
        ],
      ),
    );
  }
}

class _AttentionRow extends StatelessWidget {
  final IconData icon;
  final Color tone;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final _Palette palette;

  const _AttentionRow({
    required this.icon,
    required this.tone,
    required this.title,
    required this.subtitle,
    required this.onTap,
    required this.palette,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: palette.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
        side: BorderSide(color: palette.border),
      ),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.xs),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(color: tone.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(AppSpacing.radiusSm)),
          child: Icon(icon, size: 20, color: tone),
        ),
        title: Text(title, style: AppTypography.bodySmall.copyWith(color: palette.text, fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle, style: AppTypography.caption.copyWith(color: palette.secondary)),
        trailing: Icon(Icons.chevron_right_rounded, color: palette.secondary),
      ),
    );
  }
}

class _AttendanceChart extends StatelessWidget {
  final List<ChartDataPointModel> points;
  final _Palette palette;

  const _AttendanceChart({required this.points, required this.palette});

  @override
  Widget build(BuildContext context) {
    final data = points.length > 7 ? points.sublist(points.length - 7) : points;
    final total = data.fold<double>(0, (s, p) => s + p.value);
    if (data.isEmpty || total == 0) {
      return _Surface(
        palette: palette,
        child: Text('No check-ins recorded this week yet.', style: AppTypography.bodySmall.copyWith(color: palette.secondary)),
      );
    }
    final maxV = data.fold<double>(0, (m, p) => p.value > m ? p.value : m);
    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    return Semantics(
      label: 'Check-ins over the last ${data.length} days: '
          '${data.map((p) => '${p.label} ${p.value.toInt()}').join(', ')}',
      child: _Surface(
        palette: palette,
        padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.xl, AppSpacing.md, AppSpacing.md),
        child: SizedBox(
          height: 168,
          child: ExcludeSemantics(
            child: BarChart(
              BarChartData(
                maxY: maxV * 1.15,
                alignment: BarChartAlignment.spaceAround,
                borderData: FlBorderData(show: false),
                gridData: FlGridData(
                  drawVerticalLine: false,
                  horizontalInterval: maxV > 0 ? (maxV / 3).ceilToDouble().clamp(1, double.infinity) : 1,
                  getDrawingHorizontalLine: (_) => FlLine(color: palette.border, strokeWidth: 1),
                ),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(),
                  rightTitles: const AxisTitles(),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 32,
                      interval: maxV > 0 ? (maxV / 3).ceilToDouble().clamp(1, double.infinity) : 1,
                      // fl_chart also labels the axis maximum; skip it so it never collides with a gridline label.
                      getTitlesWidget: (v, meta) => v == meta.max
                          ? const SizedBox.shrink()
                          : Text(v.toInt().toString(), style: AppTypography.caption.copyWith(color: palette.secondary, fontSize: 11)),
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 24,
                      getTitlesWidget: (v, _) {
                        final i = v.toInt();
                        if (i < 0 || i >= data.length) return const SizedBox.shrink();
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(data[i].label,
                              style: AppTypography.caption.copyWith(color: palette.secondary, fontSize: 11)),
                        );
                      },
                    ),
                  ),
                ),
                barTouchData: BarTouchData(
                  touchTooltipData: BarTouchTooltipData(
                    getTooltipColor: (_) => palette.dark ? AppColors.darkSurfaceElevated : AppColors.text,
                    getTooltipItem: (group, _, rod, __) => BarTooltipItem(
                      '${rod.toY.toInt()} check-ins',
                      AppTypography.caption.copyWith(color: Colors.white, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
                barGroups: [
                  for (var i = 0; i < data.length; i++)
                    BarChartGroupData(x: i, barRods: [
                      BarChartRodData(
                        toY: data[i].value,
                        width: 18,
                        color: i == data.length - 1 ? AppColors.primary : AppColors.primary.withValues(alpha: 0.35),
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                      ),
                    ]),
                ],
              ),
              duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 300),
            ),
          ),
        ),
      ),
    );
  }
}

class _InsideNowSection extends ConsumerWidget {
  final _Palette palette;

  const _InsideNowSection({required this.palette});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inside = ref.watch(currentlyInsideProvider);
    final count = inside.valueOrNull?.length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _SectionTitle('In the gym now', trailing: count == null ? null : '$count checked in', palette: palette),
        inside.when(
          loading: () => Column(children: [for (var i = 0; i < 3; i++) RepsiSkeleton.memberListItem()]),
          error: (_, __) => _Surface(
            palette: palette,
            child: Row(
              children: [
                Expanded(
                  child: Text("Couldn't load who's checked in.",
                      style: AppTypography.bodySmall.copyWith(color: palette.secondary)),
                ),
                TextButton(onPressed: () => ref.invalidate(currentlyInsideProvider), child: const Text('Retry')),
              ],
            ),
          ),
          data: (people) {
            if (people.isEmpty) {
              return _Surface(
                palette: palette,
                child: Row(
                  children: [
                    Icon(Icons.door_front_door_outlined, color: palette.secondary),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Text('No one is checked in right now.',
                          style: AppTypography.bodySmall.copyWith(color: palette.secondary)),
                    ),
                  ],
                ),
              );
            }
            final shown = people.take(5).toList();
            return _Surface(
              palette: palette,
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  for (var i = 0; i < shown.length; i++) ...[
                    if (i > 0) Divider(height: 1, indent: 64, color: palette.border),
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                      leading: RepsiAvatar(name: shown[i].name, imageUrl: shown[i].avatarUrl, size: 36),
                      title: Text(shown[i].name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.bodySmall.copyWith(color: palette.text, fontWeight: FontWeight.w600)),
                      subtitle: Text(
                        [
                          if (shown[i].personType != 'member') 'Staff' else if (shown[i].planName != null) shown[i].planName!,
                          'in since ${DateFormat.jm().format(shown[i].checkInTime)}',
                        ].join(' · '),
                        style: AppTypography.caption.copyWith(color: palette.secondary),
                      ),
                      trailing: Text(shown[i].duration,
                          style: AppTypography.tabularNumber(fontSize: 13, fontWeight: FontWeight.w500, color: palette.secondary)),
                    ),
                  ],
                  if (people.length > shown.length) ...[
                    Divider(height: 1, color: palette.border),
                    TextButton(
                      onPressed: () => context.go(RouteNames.operations),
                      style: TextButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                      child: Text('See all ${people.length}', style: AppTypography.button.copyWith(color: palette.accentText)),
                    ),
                  ],
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}
