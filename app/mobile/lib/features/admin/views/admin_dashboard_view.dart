import 'package:flutter/material.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/animations/repsi_stagger.dart';
import '../../../shared/widgets/repsi_card.dart';
import '../../../l10n/l10n.dart';

class AdminDashboardView extends StatelessWidget {
  const AdminDashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.pageHorizontalPadding,
            vertical: 16,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              RepsiStaggerItem(
                index: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            context.l10n.systemAdmin,
                            style: AppTypography.heading.copyWith(
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              color: AppColors.text,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            context.l10n.platformMetrics,
                            style: AppTypography.caption.copyWith(
                              color: AppColors.textSecondary,
                              fontSize: 13,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3E8FF),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFD8B4FE)),
                      ),
                      child: Text(
                        context.l10n.roleAdminBadge,
                        style: AppTypography.caption.copyWith(
                          color: const Color(0xFF9333EA),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // System Stats 2x3 Grid (Section 34: Total Gyms, Active Users, Active Members, Trainers, Revenue, Subscriptions)
              RepsiStaggerItem(
                index: 1,
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _AdminStatCard(
                            label: context.l10n.totalGyms,
                            value: '42',
                            subtext: context.l10n.plusThreeThisMonth,
                            icon: Icons.storefront_rounded,
                          ),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: _AdminStatCard(
                            label: context.l10n.activeUsers,
                            value: '3,840',
                            subtext: context.l10n.adminMom('+12'),
                            icon: Icons.people_outline_rounded,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _AdminStatCard(
                            label: context.l10n.activeMembers,
                            value: '3,210',
                            subtext: context.l10n.payingMembers,
                            icon: Icons.card_membership_rounded,
                          ),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: _AdminStatCard(
                            label: context.l10n.commonTrainers,
                            value: '185',
                            subtext: context.l10n.acrossAllGyms,
                            icon: Icons.fitness_center_rounded,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _AdminStatCard(
                            label: context.l10n.platformRevenue,
                            value: '₹14.2L',
                            subtext: context.l10n.mrrThisMonth,
                            icon: Icons.account_balance_wallet_outlined,
                            valueColor: AppColors.primaryDark,
                          ),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: _AdminStatCard(
                            label: context.l10n.subscriptions,
                            value: '38 Active',
                            subtext: context.l10n.adminTrialingCount(4),
                            icon: Icons.star_outline_rounded,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Platform Health Status Card
              RepsiStaggerItem(
                index: 2,
                child: RepsiCard(
                  padding: const EdgeInsets.all(18),
                  child: Row(
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          context.l10n.allServicesOk,
                          style: AppTypography.headingSmall.copyWith(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.text,
                          ),
                        ),
                      ),
                      Text(
                        context.l10n.adminUptime('99.98'),
                        style: AppTypography.caption.copyWith(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _AdminStatCard extends StatelessWidget {
  final String label;
  final String value;
  final String subtext;
  final IconData icon;
  final Color? valueColor;

  const _AdminStatCard({
    required this.label,
    required this.value,
    required this.subtext,
    required this.icon,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: AppTypography.caption.copyWith(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                ),
              ),
              Icon(icon, size: 18, color: AppColors.textMuted),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: AppTypography.heading.copyWith(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: valueColor ?? AppColors.text,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtext,
            style: AppTypography.caption.copyWith(
              color: AppColors.textMuted,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}
