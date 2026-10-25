import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../l10n/l10n.dart';
import '../../../../shared/animations/repsi_stagger.dart';
import '../../../../shared/widgets/repsi_button.dart';
import '../../../../shared/widgets/repsi_card.dart';
import '../../../../app/theme/repsi_palette.dart';

class ProgressDashboardView extends StatefulWidget {
  const ProgressDashboardView({super.key});

  @override
  State<ProgressDashboardView> createState() => _ProgressDashboardViewState();
}

class _ProgressDashboardViewState extends State<ProgressDashboardView> {
  int _selectedMetricTab = 0;

  @override
  Widget build(BuildContext context) {
    final metricTabs = [
      context.l10n.tabWeight,
      context.l10n.tabMeasurements,
      context.l10n.tabAttendance,
      context.l10n.tabPRs,
    ];

    return Scaffold(
      backgroundColor: context.palette.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          context.l10n.myProgress,
          style: AppTypography.heading.copyWith(
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.pageHorizontalPadding,
            vertical: 12,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Metric Segmented Tab Bar
              RepsiStaggerItem(
                index: 0,
                child: Container(
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: context.palette.border),
                  ),
                  padding: const EdgeInsets.all(3),
                  child: Row(
                    children: List.generate(metricTabs.length, (index) {
                      final isSelected = _selectedMetricTab == index;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() => _selectedMetricTab = index);
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            decoration: BoxDecoration(
                              color: isSelected ? context.palette.primarySoft : Colors.transparent,
                              borderRadius: BorderRadius.circular(9),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              metricTabs[index],
                              style: AppTypography.caption.copyWith(
                                color: isSelected ? context.palette.primaryDark : context.palette.textSecondary,
                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                fontSize: 12,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // 2. Weight & BMI Overview Cards
              RepsiStaggerItem(
                index: 1,
                child: Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: RepsiCard(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              context.l10n.tabWeight,
                              style: AppTypography.caption.copyWith(
                                fontSize: 13,
                                color: context.palette.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.baseline,
                              textBaseline: TextBaseline.alphabetic,
                              children: [
                                Text(
                                  '78.4 kg',
                                  style: AppTypography.display.copyWith(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w800,
                                    color: context.palette.text,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                const Icon(Icons.arrow_downward_rounded, size: 16, color: AppColors.primary),
                                Text(
                                  '3.7 kg',
                                  style: AppTypography.caption.copyWith(
                                    color: context.palette.primaryDark,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              context.l10n.startedWeightSubtitle('82.1', 'Aug 2025'),
                              style: AppTypography.caption.copyWith(
                                color: context.palette.textSecondary,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: RepsiCard(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              context.l10n.bmiTitle,
                              style: AppTypography.caption.copyWith(
                                fontSize: 13,
                                color: context.palette.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '24.8',
                              style: AppTypography.display.copyWith(
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                                color: context.palette.primaryDark,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              context.l10n.calculatedHeight('178'),
                              style: AppTypography.caption.copyWith(
                                color: context.palette.textSecondary,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Non-judgmental BMI Context Note
              RepsiStaggerItem(
                index: 2,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: context.palette.surfaceSubtle,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: context.palette.border),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline_rounded, size: 14, color: context.palette.textSecondary),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          context.l10n.bmiHealthNote,
                          style: AppTypography.caption.copyWith(
                            color: context.palette.textSecondary,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // 3. Tab Specific Chart or Information
              if (_selectedMetricTab == 0) _buildWeightChart(),
              if (_selectedMetricTab == 1) _buildMeasurementsSection(),
              if (_selectedMetricTab == 2) _buildAttendanceSection(),
              if (_selectedMetricTab == 3) _buildPersonalRecordsSection(),

              const SizedBox(height: 20),

              // Log New Measurement Button
              RepsiStaggerItem(
                index: 5,
                child: RepsiButton(
                  text: context.l10n.logMetricsButton,
                  leadingIcon: const Icon(Icons.add_rounded, size: 20),
                  onPressed: () {
                    _showLogMetricModal();
                  },
                  isFullWidth: true,
                  size: RepsiButtonSize.large,
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWeightChart() {
    return RepsiCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                context.l10n.weightProgressTitle,
                style: AppTypography.headingSmall.copyWith(fontSize: 15, fontWeight: FontWeight.w700),
              ),
              Text(
                '60 Days',
                style: AppTypography.caption.copyWith(color: context.palette.textSecondary, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 160,
            child: LineChart(
              LineChartData(
                gridData: const FlGridData(show: false),
                titlesData: const FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                lineTouchData: const LineTouchData(enabled: true),
                minY: 77,
                maxY: 83,
                lineBarsData: [
                  LineChartBarData(
                    spots: const [
                      FlSpot(0, 82.1),
                      FlSpot(1, 81.4),
                      FlSpot(2, 80.8),
                      FlSpot(3, 79.9),
                      FlSpot(4, 79.2),
                      FlSpot(5, 78.4),
                    ],
                    isCurved: true,
                    curveSmoothness: 0.35,
                    color: AppColors.primary,
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          AppColors.primary.withValues(alpha: 0.25),
                          AppColors.primary.withValues(alpha: 0.0),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMeasurementsSection() {
    return RepsiCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.l10n.tabMeasurements,
            style: AppTypography.headingSmall.copyWith(fontSize: 15, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _MeasurementTile(label: context.l10n.measureChest, value: '102 cm', change: '+2 cm')),
              const SizedBox(width: 8),
              Expanded(child: _MeasurementTile(label: context.l10n.measureWaist, value: '84 cm', change: '-4 cm')),
              const SizedBox(width: 8),
              Expanded(child: _MeasurementTile(label: context.l10n.measureArms, value: '35 cm', change: '+1.5 cm')),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: _MeasurementTile(label: context.l10n.measureThighs, value: '58 cm', change: '+1 cm')),
              const SizedBox(width: 8),
              Expanded(child: _MeasurementTile(label: context.l10n.exCatShoulders, value: '116 cm', change: '+3 cm')),
              const SizedBox(width: 8),
              Expanded(child: _MeasurementTile(label: 'Body Fat %', value: '16.8%', change: '-2.4%')),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceSection() {
    return RepsiCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.l10n.tabAttendance,
            style: AppTypography.headingSmall.copyWith(fontSize: 15, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildAttendanceMetric('18 / 20', 'Sessions'),
              _buildAttendanceMetric('90%', context.l10n.commonAttendance),
              _buildAttendanceMetric('4.2', context.l10n.commonThisWeek),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceMetric(String val, String lbl) {
    return Column(
      children: [
        Text(val, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: context.palette.primaryDark)),
        const SizedBox(height: 2),
        Text(lbl, style: TextStyle(fontSize: 11, color: context.palette.textSecondary)),
      ],
    );
  }

  Widget _buildPersonalRecordsSection() {
    final prs = [
      {'lift': context.l10n.benchPressExercise, 'weight': '75 kg × 6 reps', 'date': context.l10n.commonToday},
      {'lift': context.l10n.deadliftExercise, 'weight': '125 kg × 3 reps', 'date': context.l10n.timeYesterday},
      {'lift': context.l10n.squatExercise, 'weight': '100 kg × 5 reps', 'date': '2 weeks ago'},
      {'lift': 'Overhead Press', 'weight': '45 kg × 8 reps', 'date': 'Aug 2025'},
    ];

    return RepsiCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.l10n.tabPRs,
            style: AppTypography.headingSmall.copyWith(fontSize: 15, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          ...prs.map((p) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(p['lift']!, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                        Text(p['date']!, style: TextStyle(color: context.palette.textSecondary, fontSize: 11)),
                      ],
                    ),
                    Text(p['weight']!, style: TextStyle(fontWeight: FontWeight.w700, color: context.palette.primaryDark, fontSize: 13)),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  void _showLogMetricModal() {
    final wCtrl = TextEditingController(text: '78.4');
    final cCtrl = TextEditingController(text: '102');
    final waistCtrl = TextEditingController(text: '84');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  context.l10n.tabMeasurements,
                  style: AppTypography.heading.copyWith(fontSize: 18, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: wCtrl,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(labelText: '${context.l10n.tabWeight} (kg)'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: cCtrl,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(labelText: '${context.l10n.measureChest} (cm)'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: waistCtrl,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(labelText: '${context.l10n.measureWaist} (cm)'),
                ),
                const SizedBox(height: 18),
                RepsiButton(
                  text: context.l10n.commonSave,
                  onPressed: () {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(context.l10n.commonSaved), backgroundColor: AppColors.primary),
                    );
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _MeasurementTile extends StatelessWidget {
  final String label;
  final String value;
  final String change;

  const _MeasurementTile({required this.label, required this.value, required this.change});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      decoration: BoxDecoration(
        color: context.palette.surfaceSubtle,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: context.palette.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 11, color: context.palette.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: context.palette.text)),
          const SizedBox(height: 2),
          Text(change, style: TextStyle(fontSize: 10, color: context.palette.primaryDark, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

