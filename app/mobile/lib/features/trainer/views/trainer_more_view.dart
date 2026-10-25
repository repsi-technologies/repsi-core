import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/routes/route_names.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/animations/repsi_stagger.dart';
import '../../../shared/widgets/repsi_card.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/widgets/my_profile_photo.dart';
import '../../../l10n/l10n.dart';
import '../../../shared/widgets/language_selector_sheet.dart';
import '../../../shared/widgets/theme_mode_sheet.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../member/presentation/views/qr_attendance_view.dart';
import '../../staff/data/staff_api.dart';
import '../../staff/views/my_shift_view.dart';
import '../../../app/theme/repsi_palette.dart';

class TrainerMoreView extends ConsumerWidget {
  /// Switches the trainer shell to another tab (clients, schedule, plans).
  final ValueChanged<int>? onSelectTab;

  const TrainerMoreView({super.key, this.onSelectTab});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final l = context.l10n;
    final perms = ref.watch(myPermissionsProvider).valueOrNull ?? const <String>{};
    void push(Widget page) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
    final menuItems = <(IconData, String, VoidCallback)>[
      (LucideIcons.clock3, l.myShiftAttendance, () => push(const MyShiftView())),
      if (perms.contains('attendance.record'))
        (LucideIcons.scanLine, l.markMemberAttendance, () => push(const QrAttendanceView(staffScanner: true))),
      (LucideIcons.messageSquare, l.messages, () => onSelectTab?.call(3)),
      (LucideIcons.users, l.myClients, () => onSelectTab?.call(1)),
      (LucideIcons.calendarDays, l.mySchedule, () => onSelectTab?.call(2)),
      (LucideIcons.bell, l.commonNotifications, () => context.push(RouteNames.notifications)),
      (LucideIcons.languages, l.commonLanguage, () => LanguageSelectorSheet.show(context)),
      (LucideIcons.sunMoon, l.appearance, () => ThemeModeSheet.show(context)),
    ];

    return Scaffold(
      backgroundColor: context.palette.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          context.l10n.commonMore,
          style: AppTypography.heading.copyWith(fontSize: 20, fontWeight: FontWeight.w700),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.pageHorizontalPadding,
            vertical: 12,
          ),
          child: Column(
            children: [
              // Trainer Profile Badge
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
                              user?.fullName ?? context.l10n.commonTrainer,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTypography.headingSmall.copyWith(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: context.palette.text,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              [user?.gymName, context.l10n.commonTrainer].whereType<String>().join(' · '),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTypography.caption.copyWith(
                                color: context.palette.textSecondary,
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

              // Menu List (Trainer Mockup Screen 8)
              ...List.generate(menuItems.length, (index) {
                final (icon, title, onTap) = menuItems[index];
                return RepsiStaggerItem(
                  index: index + 1,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: RepsiCard(
                      onTap: onTap,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
                      child: Row(
                        children: [
                          Icon(icon, size: 20, color: context.palette.textSecondary),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Text(
                              title,
                              style: AppTypography.headingSmall.copyWith(
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                                color: context.palette.text,
                              ),
                            ),
                          ),
                          Icon(Icons.chevron_right_rounded, size: 20, color: context.palette.textMuted),
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
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
                  child: Row(
                    children: [
                      Icon(Icons.logout_rounded, size: 20, color: context.palette.error),
                      const SizedBox(width: 14),
                      Text(
                        context.l10n.commonSignOut,
                        style: AppTypography.headingSmall.copyWith(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: context.palette.error,
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
