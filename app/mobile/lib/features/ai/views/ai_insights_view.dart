import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/animations/repsi_stagger.dart';
import '../../../shared/widgets/repsi_badge.dart';
import '../../../shared/widgets/repsi_card.dart';

class AiInsightsView extends ConsumerStatefulWidget {
  const AiInsightsView({super.key});

  @override
  ConsumerState<AiInsightsView> createState() => _AiInsightsViewState();
}

class _AiInsightsViewState extends ConsumerState<AiInsightsView> {
  final List<Map<String, dynamic>> _insights = [
    {
      'title': 'High Member Churn Risk Detected',
      'category': 'RETENTION',
      'type': 'warning',
      'description':
          '18 members with Gold memberships have not visited in 14+ days. Historical data indicates a 74% drop-off probability if not contacted within 48 hours.',
      'action': 'Trigger WhatsApp Check-in',
      'impact': '+₹42,000 Saved Revenue',
    },
    {
      'title': 'Indiranagar Peak Hour Congestion',
      'category': 'CAPACITY',
      'type': 'info',
      'description':
          'Weekday 6:30 PM - 8:00 PM exceeds 85% equipment occupancy. Shifting cardio members with an off-peak bonus discount can balance load.',
      'action': 'Broadcast Off-Peak Incentive',
      'impact': '+12% Satisfaction',
    },
    {
      'title': 'Quarterly Renewal Acceleration',
      'category': 'FINANCE',
      'type': 'success',
      'description':
          '34 members have plans expiring next week. Automated early renewal coupons with a 10% annual lock-in have an 88% conversion rate.',
      'action': 'Send Early Renewal Offers',
      'impact': '₹1,24,000 Projected Inflow',
    },
    {
      'title': 'Trainer PT Slot Utilization',
      'category': 'STAFFING',
      'type': 'info',
      'description':
          'Coach Alex has 6 vacant afternoon slots (1:00 PM - 4:00 PM). 12 members surveyed expressed interest in post-lunch mobility training.',
      'action': 'Suggest Afternoon PT Packages',
      'impact': '+₹18,000 Trainer Revenue',
    },
  ];

  Future<void> _refresh() async {
    await Future.delayed(const Duration(milliseconds: 500));
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color:
                    isDark ? AppColors.darkPrimarySoft : AppColors.primarySoft,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(LucideIcons.sparkles,
                  size: 18, color: AppColors.primary),
            ),
            const SizedBox(width: 10),
            Text(
              'AI Gym Insights',
              style: AppTypography.headingSmall.copyWith(
                fontWeight: FontWeight.w700,
                color: isDark ? AppColors.darkText : AppColors.text,
              ),
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.pageHorizontalPadding,
            vertical: 16,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Summary Banner
              RepsiStaggerItem(
                index: 0,
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkSurface : AppColors.surface,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
                    border: Border.all(
                      color: isDark ? AppColors.darkBorder : AppColors.border,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: isDark
                              ? AppColors.darkPrimarySoft
                              : AppColors.primarySoft,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(LucideIcons.trendingUp,
                            color: AppColors.primary, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Autonomous Gym Telemetry',
                              style: AppTypography.headingSmall.copyWith(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: isDark
                                    ? AppColors.darkText
                                    : AppColors.text,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '4 active predictive recommendations based on member visits and revenue logs.',
                              style: AppTypography.caption.copyWith(
                                color: isDark
                                    ? AppColors.darkTextSecondary
                                    : AppColors.textSecondary,
                                fontSize: 12.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // Insights List
              ..._insights.asMap().entries.map((entry) {
                final index = entry.key;
                final item = entry.value;
                final isWarning = item['type'] == 'warning';
                final isSuccess = item['type'] == 'success';

                return RepsiStaggerItem(
                  index: index + 1,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: RepsiCard(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              RepsiBadge(
                                label: item['category'] as String,
                                variant: isWarning
                                    ? RepsiBadgeVariant.warning
                                    : (isSuccess
                                        ? RepsiBadgeVariant.success
                                        : RepsiBadgeVariant.info),
                              ),
                              Text(
                                item['impact'] as String,
                                style: AppTypography.caption.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: isSuccess
                                      ? AppColors.success
                                      : (isWarning
                                          ? AppColors.warning
                                          : AppColors.primaryDark),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            item['title'] as String,
                            style: AppTypography.headingSmall.copyWith(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color:
                                  isDark ? AppColors.darkText : AppColors.text,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            item['description'] as String,
                            style: AppTypography.bodySecondary.copyWith(
                              fontSize: 13,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 14),
                          const Divider(height: 1),
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              TextButton.icon(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                          'Action executed: ${item['action']}'),
                                      backgroundColor: AppColors.primary,
                                    ),
                                  );
                                },
                                icon: const Icon(LucideIcons.arrowRight,
                                    size: 16, color: AppColors.primary),
                                label: Text(
                                  item['action'] as String,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}
