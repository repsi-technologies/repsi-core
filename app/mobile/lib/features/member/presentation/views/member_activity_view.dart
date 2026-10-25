import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/api/api_error.dart';
import '../../../../shared/widgets/repsi_card.dart';
import '../../../../shared/widgets/repsi_error_state.dart';
import '../../../attendance/providers/attendance_provider.dart';
import '../../../health/data/health_models.dart';
import '../../../health/providers/health_provider.dart';
import '../../../../l10n/l10n.dart';
import '../../../../app/theme/repsi_palette.dart';

/// Member progress, built only from data the member actually has: Health Connect totals the
/// backend stores for them and their own gym visits.
class MemberActivityView extends ConsumerStatefulWidget {
  const MemberActivityView({super.key});

  @override
  ConsumerState<MemberActivityView> createState() => _MemberActivityViewState();
}

class _MemberActivityViewState extends ConsumerState<MemberActivityView> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(healthProvider.notifier).load());
  }

  @override
  Widget build(BuildContext context) {
    final attendance = ref.watch(myAttendanceProvider);
    final health = ref.watch(healthProvider);

    return Scaffold(
      backgroundColor: context.palette.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(context.l10n.activity, style: AppTypography.heading.copyWith(fontSize: 20, fontWeight: FontWeight.w700)),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(myAttendanceProvider);
          await ref.read(healthProvider.notifier).load();
        },
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(AppSpacing.pageHorizontalPadding, 0, AppSpacing.pageHorizontalPadding, 24),
          children: [
            _StepsCard(health: health),
            const SizedBox(height: 12),
            attendance.when(
              loading: () => const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator())),
              error: (e, _) => SizedBox(
                height: 180,
                child: RepsiErrorState(
                  message: e is ApiError ? e.message : context.l10n.errorLoadGymVisits,
                  onRetry: () => ref.invalidate(myAttendanceProvider),
                ),
              ),
              data: (a) => RepsiCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(context.l10n.gymVisits, style: AppTypography.sectionHeading.copyWith(fontSize: 16, color: context.palette.text)),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        _Figure(value: '${a.totalVisits}', label: context.l10n.commonTotal),
                        _Figure(value: '${a.thisMonthVisits}', label: context.l10n.commonThisMonth),
                        _Figure(value: '${a.streakDays}', label: context.l10n.commonDayStreak),
                        _Figure(value: a.averageDurationMinutes == 0 ? '–' : '${a.averageDurationMinutes}m', label: context.l10n.avgVisit),
                      ],
                    ),
                    const Divider(height: 24),
                    if (a.recentVisits.isEmpty)
                      Text(context.l10n.noVisitsStartStreak,
                          style: AppTypography.bodySecondary.copyWith(color: context.palette.textSecondary))
                    else
                      for (final v in a.recentVisits.take(8))
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              const Icon(Icons.fitness_center_rounded, size: 18, color: AppColors.primary),
                              const SizedBox(width: 10),
                              Expanded(child: Text(DateFormat('EEE, d MMM · h:mm a').format(v.checkInTime))),
                              Text(v.isOpen ? context.l10n.inProgress : v.durationLabel,
                                  style: AppTypography.caption.copyWith(color: context.palette.textSecondary)),
                            ],
                          ),
                        ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepsCard extends StatelessWidget {
  final HealthState health;

  const _StepsCard({required this.health});

  /// Seven calendar days ending today, with zero for days that have no reading.
  List<DailyActivity> _lastSevenDays() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final byDay = {for (final d in health.summary.days) DateTime(d.day.year, d.day.month, d.day.day): d};
    return [
      for (var i = 6; i >= 0; i--)
        byDay[today.subtract(Duration(days: i))] ?? DailyActivity(day: today.subtract(Duration(days: i))),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final nf = NumberFormat.decimalPattern();
    if (!health.connected) {
      return RepsiCard(
        padding: const EdgeInsets.all(16),
        child: Text(
          health.availability == HealthAvailability.unsupported
              ? context.l10n.healthStepsAndroidOnly
              : context.l10n.healthConnectFromHome,
          style: AppTypography.bodySecondary.copyWith(color: context.palette.textSecondary),
        ),
      );
    }

    final days = _lastSevenDays();
    final maxSteps = days.map((d) => d.steps).fold<int>(0, (a, b) => a > b ? a : b);
    return RepsiCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(context.l10n.stepsThisWeek, style: AppTypography.sectionHeading.copyWith(fontSize: 16, color: context.palette.text)),
          const SizedBox(height: 4),
          Text(context.l10n.healthStepsSummary(nf.format(health.summary.totalSteps), nf.format(health.summary.averageSteps)),
              style: AppTypography.caption.copyWith(color: context.palette.textSecondary)),
          const SizedBox(height: 16),
          SizedBox(
            height: 160,
            child: Semantics(
              label: context.l10n.stepsChartSemantics,
              child: BarChart(
                BarChartData(
                  maxY: (maxSteps == 0 ? 1000 : maxSteps * 1.2).toDouble(),
                  gridData: const FlGridData(show: false),
                  borderData: FlBorderData(show: false),
                  titlesData: FlTitlesData(
                    leftTitles: const AxisTitles(),
                    topTitles: const AxisTitles(),
                    rightTitles: const AxisTitles(),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 24,
                        getTitlesWidget: (value, meta) {
                          final day = days[value.toInt()].day;
                          return Padding(
                            padding: const EdgeInsets.only(top: 6),
                            child: Text(DateFormat('E').format(day).substring(0, 1), style: AppTypography.caption),
                          );
                        },
                      ),
                    ),
                  ),
                  barTouchData: BarTouchData(
                    touchTooltipData: BarTouchTooltipData(
                      getTooltipItem: (group, _, rod, __) => BarTooltipItem(
                        nf.format(rod.toY.round()),
                        const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                  barGroups: [
                    for (var i = 0; i < days.length; i++)
                      BarChartGroupData(
                        x: i,
                        barRods: [
                          BarChartRodData(
                            toY: days[i].steps.toDouble(),
                            width: 18,
                            color: i == days.length - 1 ? AppColors.primary : AppColors.primary.withValues(alpha: 0.45),
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Figure extends StatelessWidget {
  final String value;
  final String label;

  const _Figure({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          FittedBox(fit: BoxFit.scaleDown, child: Text(value, style: AppTypography.heading.copyWith(fontSize: 20, color: context.palette.text))),
          Text(label, textAlign: TextAlign.center, style: AppTypography.caption.copyWith(color: context.palette.textSecondary)),
        ],
      ),
    );
  }
}
