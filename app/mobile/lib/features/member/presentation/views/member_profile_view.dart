import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../app/routes/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../shared/animations/repsi_stagger.dart';
import '../../../../shared/widgets/repsi_card.dart';
import '../../../ai/views/ai_workout_coach_view.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../auth/views/account_security_dialogs.dart';
import '../../../auth/widgets/my_profile_photo.dart';
import '../../../notifications/views/notification_inbox_view.dart';
import 'membership_payments_view.dart';
import 'qr_attendance_view.dart';
import '../../../../l10n/l10n.dart';
import '../../../../shared/widgets/language_selector_sheet.dart';

class MemberProfileView extends ConsumerWidget {
  const MemberProfileView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Only destinations backed by real data are listed.
    final menuItems = [
      {
        'icon': LucideIcons.sparkles,
        'title': context.l10n.aiWorkoutCoach,
        'route': 'aiCoach',
        'badge': 'AI'
      },
      {
        'icon': LucideIcons.receipt,
        'title': context.l10n.paymentsAndInvoices,
        'route': 'payments',
        'badge': null
      },
      {
        'icon': LucideIcons.qrCode,
        'title': context.l10n.qrGymCheckIn,
        'route': 'attendance',
        'badge': null
      },
      {
        'icon': LucideIcons.bell,
        'title': context.l10n.notificationsAndAlerts,
        'route': 'notifications',
        'badge': null
      },
      {
        'icon': LucideIcons.languages,
        'title': context.l10n.commonLanguage,
        'route': 'language',
        'badge': null
      },
      {
        'icon': LucideIcons.keyRound,
        'title': context.l10n.changePassword,
        'route': 'password',
        'badge': null
      },
      {
        'icon': LucideIcons.trash2,
        'title': context.l10n.deleteAccount,
        'route': 'delete',
        'badge': null
      },
    ];

    final user = ref.watch(authProvider).user;
    final userName =
        (user?.fullName.isNotEmpty == true) ? user!.fullName : context.l10n.commonMember;
    final userEmail = user?.email ?? '';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          context.l10n.commonMore,
          style: AppTypography.heading
              .copyWith(fontSize: 20, fontWeight: FontWeight.w700),
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
              // User summary card
              RepsiStaggerItem(
                index: 0,
                child: RepsiCard(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      const MyProfilePhoto(size: 52),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              userName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTypography.headingSmall.copyWith(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.text,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              userEmail,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTypography.caption.copyWith(
                                color: AppColors.textSecondary,
                                fontSize: 13,
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

              // Menu Options
              ...List.generate(menuItems.length, (index) {
                final item = menuItems[index];
                final badge = item['badge'];

                return RepsiStaggerItem(
                  index: index + 1,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: RepsiCard(
                      onTap: () {
                        final route = item['route'];
                        if (route == 'aiCoach') {
                          Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const AiWorkoutCoachView()));
                        } else if (route == 'notifications') {
                          Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) =>
                                      const NotificationInboxView()));
                        } else if (route == 'payments') {
                          Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const MembershipPaymentsView()));
                        } else if (route == 'attendance') {
                          Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const QrAttendanceView()));
                        } else if (route == 'language') {
                          LanguageSelectorSheet.show(context);
                        } else if (route == 'password') {
                          showChangePasswordDialog(context, ref);
                        } else if (route == 'delete') {
                          showDeleteAccountDialog(context, ref);
                        }
                      },
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 15),
                      child: Row(
                        children: [
                          Icon(item['icon'] as IconData,
                              size: 20, color: AppColors.textSecondary),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Text(
                              item['title'] as String,
                              style: AppTypography.headingSmall.copyWith(
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                                color: AppColors.text,
                              ),
                            ),
                          ),
                          if (badge != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.primarySoft,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                badge as String,
                                style: const TextStyle(
                                  color: AppColors.primaryDark,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                          ],
                          const Icon(Icons.chevron_right_rounded,
                              size: 20, color: AppColors.textMuted),
                        ],
                      ),
                    ),
                  ),
                );
              }),
              const SizedBox(height: 12),

              // Sign Out button
              RepsiStaggerItem(
                index: menuItems.length + 1,
                child: RepsiCard(
                  onTap: () async {
                    await ref.read(authProvider.notifier).logout();
                    if (context.mounted) {
                      context.go(RouteNames.login);
                    }
                  },
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
                  child: Row(
                    children: [
                      const Icon(Icons.logout_rounded,
                          size: 20, color: AppColors.error),
                      const SizedBox(width: 14),
                      Text(
                        context.l10n.commonSignOut,
                        style: AppTypography.headingSmall.copyWith(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.error,
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
