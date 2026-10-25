import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_typography.dart';
import 'repsi_button.dart';

import '../../l10n/l10n.dart';
import '../../app/theme/repsi_palette.dart';
class RepsiErrorState extends StatelessWidget {
  /// Defaults to a generic "Something went wrong" in the current language.
  final String? title;
  final String message;
  final VoidCallback? onRetry;

  const RepsiErrorState({
    super.key,
    this.title,
    required this.message,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: isDark ? context.palette.error.withValues(alpha: 0.15) : context.palette.errorLight,
                shape: BoxShape.circle,
              ),
              child: Icon(
                LucideIcons.alertTriangle,
                size: 36,
                color: context.palette.error,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              title ?? context.l10n.errorStateTitle,
              textAlign: TextAlign.center,
              style: AppTypography.headingSmall.copyWith(
                color: isDark ? AppColors.darkTextPrimary : context.palette.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              message,
              textAlign: TextAlign.center,
              style: AppTypography.bodySmall.copyWith(
                color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
              ),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: AppSpacing.lg),
              RepsiButton(
                text: context.l10n.commonTryAgain,
                onPressed: onRetry,
                size: RepsiButtonSize.small,
                variant: RepsiButtonVariant.secondary,
                leadingIcon: const Icon(LucideIcons.refreshCw, size: 14),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
