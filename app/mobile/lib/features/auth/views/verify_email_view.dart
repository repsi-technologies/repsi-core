import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../app/routes/route_names.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/widgets/repsi_button.dart';

import '../../../l10n/l10n.dart';
class VerifyEmailView extends StatelessWidget {
  final String? email;

  const VerifyEmailView({super.key, this.email});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
          ),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xxl),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      LucideIcons.mailCheck,
                      size: 36,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
                Text(
                  context.l10n.verifyEmailTitle,
                  textAlign: TextAlign.center,
                  style: AppTypography.headingLarge.copyWith(
                    color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  context.l10n.verifyEmailSentTo(email ?? context.l10n.verifyEmailYourAddress),
                  textAlign: TextAlign.center,
                  style: AppTypography.bodySmall.copyWith(
                    color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxl),
                RepsiButton(
                  text: context.l10n.continueToSetup,
                  onPressed: () => context.go(RouteNames.onboarding),
                  size: RepsiButtonSize.large,
                ),
                const SizedBox(height: AppSpacing.md),
                RepsiButton(
                  text: context.l10n.resendEmail,
                  variant: RepsiButtonVariant.outline,
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(context.l10n.verificationEmailResent)),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
