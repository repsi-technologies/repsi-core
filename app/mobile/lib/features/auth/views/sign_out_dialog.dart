import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/routes/route_names.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_typography.dart';
import '../providers/auth_provider.dart';

import '../../../l10n/l10n.dart';
import '../../../app/theme/repsi_palette.dart';
class SignOutDialog extends ConsumerStatefulWidget {
  const SignOutDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showDialog(
      context: context,
      barrierDismissible: false, // Prevent dismissing while signing out
      builder: (context) => const SignOutDialog(),
    );
  }

  @override
  ConsumerState<SignOutDialog> createState() => _SignOutDialogState();
}

class _SignOutDialogState extends ConsumerState<SignOutDialog> {
  bool _isSigningOut = false;

  Future<void> _handleSignOut() async {
    setState(() {
      _isSigningOut = true;
    });

    try {
      await ref.read(authProvider.notifier).logout();
      if (mounted) {
        // Clear all previous routes and go to login
        context.go(RouteNames.login);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSigningOut = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.signOutFailed)),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AlertDialog(
      backgroundColor: isDark ? AppColors.darkSurface : context.palette.surface,
      title: Text(
        context.l10n.signOutTitle,
        style: AppTypography.headingSmall.copyWith(
          color: isDark ? AppColors.darkTextPrimary : context.palette.textPrimary,
        ),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            context.l10n.signOutConfirmOwner,
            style: AppTypography.bodyMedium.copyWith(
              color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
            ),
          ),
          if (_isSigningOut) ...[
            const SizedBox(height: 24),
            Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(context.palette.error),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              context.l10n.signingOut,
              style: AppTypography.caption.copyWith(
                color: isDark ? AppColors.darkTextMuted : context.palette.textMuted,
              ),
            ),
          ],
        ],
      ),
      actions: _isSigningOut
          ? [] // Hide actions while signing out
          : [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(
                  context.l10n.commonCancel,
                  style: TextStyle(
                    color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              ElevatedButton(
                onPressed: _handleSignOut,
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.palette.error,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: Text(context.l10n.commonSignOut),
              ),
            ],
    );
  }
}
