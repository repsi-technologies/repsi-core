import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../core/api/api_error.dart';
import '../../../shared/widgets/repsi_button.dart';
import '../../../shared/widgets/repsi_error_banner.dart';
import '../../../shared/widgets/repsi_text_field.dart';
import '../providers/auth_provider.dart';
import '../widgets/auth_layout.dart';

/// Requests a password reset email. The link in that email opens the website, where the new
/// password is set; the server answers the same way whether or not the address has an account.
class ForgotPasswordView extends ConsumerStatefulWidget {
  const ForgotPasswordView({super.key});

  @override
  ConsumerState<ForgotPasswordView> createState() => _ForgotPasswordViewState();
}

class _ForgotPasswordViewState extends ConsumerState<ForgotPasswordView> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  bool _sending = false;
  bool _sent = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_sending || !_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      await ref.read(authServiceProvider).forgotPassword(_email.text);
      if (mounted) setState(() => _sent = true);
    } on ApiError catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = "We couldn't send the email. Please try again.");
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final text = isDark ? AppColors.darkText : AppColors.text;

    if (_sent) {
      return AuthLayout(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkSuccessSoft : AppColors.successSoft,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusDefault),
                ),
                child: Icon(Icons.mark_email_read_outlined, color: isDark ? AppColors.darkSuccess : AppColors.success),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            AuthHeading(
              title: 'Check your email',
              subtitle: Text.rich(TextSpan(children: [
                const TextSpan(text: 'If '),
                TextSpan(text: _email.text.trim(), style: TextStyle(color: text, fontWeight: FontWeight.w600)),
                const TextSpan(
                  text: ' has a REPSI account, a reset link is on its way. Open it on this phone or a computer to choose a new password.',
                ),
              ])),
            ),
            const SizedBox(height: AppSpacing.xxxl),
            RepsiButton(text: 'Back to sign in', isFullWidth: true, onPressed: () => context.pop()),
            const SizedBox(height: AppSpacing.sm),
            TextButton(
              onPressed: () => setState(() => _sent = false),
              style: TextButton.styleFrom(minimumSize: const Size.fromHeight(48), foregroundColor: text),
              child: Text('Use a different email', style: AppTypography.button.copyWith(color: text)),
            ),
          ],
        ),
      );
    }

    return AuthLayout(
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const AuthHeading(
              title: 'Reset your password',
              subtitle: Text("Enter the email on your account and we'll send you a link to set a new password."),
            ),
            const SizedBox(height: AppSpacing.xxxl),
            if (_error != null) ...[
              RepsiErrorBanner(icon: Icons.info_outline_rounded, message: _error!, onRetry: _send),
              const SizedBox(height: AppSpacing.lg),
            ],
            RepsiTextField(
              label: 'Email',
              hintText: 'name@example.com',
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.send,
              autofillHints: const [AutofillHints.email],
              prefixIcon: const Icon(Icons.mail_outline_rounded, size: 20),
              onSubmitted: (_) => _send(),
              validator: (v) => RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch((v ?? '').trim()) ? null : 'Enter a valid email address',
            ),
            const SizedBox(height: AppSpacing.xxl),
            RepsiButton(text: 'Send reset link', isFullWidth: true, isLoading: _sending, onPressed: _sending ? null : _send),
          ],
        ),
      ),
    );
  }
}
