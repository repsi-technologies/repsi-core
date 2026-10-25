import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../app/routes/route_names.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/views/sign_out_dialog.dart';
import '../../features/auth/widgets/my_profile_photo.dart';

import '../../l10n/l10n.dart';
import '../../app/theme/repsi_palette.dart';
class RepsiProfileBottomSheet extends ConsumerWidget {
  const RepsiProfileBottomSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const RepsiProfileBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : context.palette.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusXl)),
      ),
      padding: const EdgeInsets.only(
        top: AppSpacing.md,
        left: AppSpacing.md,
        right: AppSpacing.md,
        bottom: AppSpacing.xxl,
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(bottom: AppSpacing.lg),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkBorder : context.palette.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Text(
              context.l10n.ownerProfileTitle,
              style: AppTypography.headingSmall.copyWith(
                color: isDark ? AppColors.darkTextPrimary : context.palette.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            
            // User info
            Row(
              children: [
                const MyProfilePhoto(size: 52),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.fullName ?? context.l10n.gymOwner,
                        style: AppTypography.labelLarge.copyWith(
                          color: isDark ? AppColors.darkTextPrimary : context.palette.textPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        [user?.gymName, _roleLabel(user?.role)].whereType<String>().join(' · '),
                        style: AppTypography.caption.copyWith(
                          color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            Divider(color: isDark ? AppColors.darkBorder : context.palette.border, height: 1),
            const SizedBox(height: AppSpacing.sm),
            
            // Navigation Links
            ListTile(
              leading: Icon(LucideIcons.user, size: 20, color: isDark ? AppColors.darkTextPrimary : context.palette.textPrimary),
              title: Text(context.l10n.commonProfile, style: AppTypography.bodyMedium.copyWith(color: isDark ? AppColors.darkTextPrimary : context.palette.textPrimary, fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.pop(context);
                context.push(RouteNames.settings); // Or specific profile route
              },
            ),
            ListTile(
              leading: Icon(LucideIcons.settings, size: 20, color: isDark ? AppColors.darkTextPrimary : context.palette.textPrimary),
              title: Text(context.l10n.gymSettings, style: AppTypography.bodyMedium.copyWith(color: isDark ? AppColors.darkTextPrimary : context.palette.textPrimary, fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.pop(context);
                context.push(RouteNames.settings);
              },
            ),
            ListTile(
              leading: Icon(LucideIcons.shield, size: 20, color: isDark ? AppColors.darkTextPrimary : context.palette.textPrimary),
              title: Text(context.l10n.accountSettings, style: AppTypography.bodyMedium.copyWith(color: isDark ? AppColors.darkTextPrimary : context.palette.textPrimary, fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.pop(context);
                context.push(RouteNames.settings);
              },
            ),
            
            const SizedBox(height: AppSpacing.sm),
            Divider(color: isDark ? AppColors.darkBorder : context.palette.border, height: 1),
            const SizedBox(height: AppSpacing.sm),
            
            // Sign Out
            ListTile(
              leading: Icon(LucideIcons.logOut, size: 20, color: context.palette.error),
              title: Text(
                context.l10n.commonSignOut,
                style: AppTypography.bodyMedium.copyWith(
                  color: context.palette.error,
                  fontWeight: FontWeight.w600,
                ),
              ),
              onTap: () {
                Navigator.pop(context); // Close bottom sheet
                SignOutDialog.show(context);
              },
            ),
          ],
        ),
      ),
    );
  }
}

String? _roleLabel(String? role) {
  final r = role?.trim();
  if (r == null || r.isEmpty) return null;
  final words = r.toLowerCase().split('_');
  return words.map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}').join(' ');
}
