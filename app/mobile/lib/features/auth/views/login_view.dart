import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/routes/route_names.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../core/api/api_error.dart';
import '../../../shared/widgets/google_logo_icon.dart';
import '../../../shared/widgets/repsi_bottom_sheet.dart';
import '../../../shared/widgets/repsi_button.dart';
import '../../../shared/widgets/repsi_error_banner.dart';
import '../../../shared/widgets/repsi_text_field.dart';
import '../../../shared/widgets/repsi_white_logo.dart';
import '../../../shared/widgets/whatsapp_mark.dart';
import '../post_sign_in.dart';
import '../providers/auth_provider.dart';
import '../widgets/auth_layout.dart';
import 'verify_otp_view.dart';

/// Sign-in entry. Mobile number + WhatsApp code is the default; email/password and Google stay
/// available for accounts that use them.
class LoginView extends ConsumerStatefulWidget {
  const LoginView({super.key});

  @override
  ConsumerState<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends ConsumerState<LoginView> {
  final _phoneFormKey = GlobalKey<FormState>();
  final _emailFormKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _emailMode = false;
  bool _sendingCode = false;
  String? _phoneError;
  bool _lastMethodWasGoogle = false;

  static final _indianMobile = RegExp(r'^[6-9]\d{9}$');

  @override
  void dispose() {
    _phoneController.dispose();
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // ─── WhatsApp code ──────────────────────────────────────────────────────

  Future<void> _sendCode() async {
    if (_sendingCode || !_phoneFormKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    HapticFeedback.lightImpact();
    final number = _phoneController.text.trim();
    setState(() {
      _sendingCode = true;
      _phoneError = null;
    });
    try {
      final challenge = await ref.read(authServiceProvider).requestPhoneOtp(phone: number);
      if (!mounted) return;
      context.push(RouteNames.verifyOtp, extra: VerifyOtpArgs(challenge: challenge, nationalNumber: number));
    } on ApiError catch (e) {
      if (mounted) setState(() => _phoneError = e.message);
    } catch (_) {
      if (mounted) setState(() => _phoneError = "We couldn't send the code. Please try again.");
    } finally {
      if (mounted) setState(() => _sendingCode = false);
    }
  }

  // ─── Email and Google ───────────────────────────────────────────────────

  Future<void> _handleLogin() async {
    if (!_emailFormKey.currentState!.validate()) return;
    _lastMethodWasGoogle = false;
    FocusScope.of(context).unfocus();
    HapticFeedback.lightImpact();
    final success = await ref.read(authProvider.notifier).login(
          email: _identifierController.text.trim(),
          password: _passwordController.text,
        );
    if (!mounted) return;
    if (success) {
      goAfterSignIn(context, ref.read(authProvider));
    } else {
      _explainFailure(
        ref.read(authProvider).errorMessage ?? 'Failed to sign in. Please check your credentials.',
        "We couldn't find a REPSI account with those details. Check your email or mobile number, or sign in with a WhatsApp code.",
      );
    }
  }

  Future<void> _handleGoogleLogin() async {
    _lastMethodWasGoogle = true;
    FocusScope.of(context).unfocus();
    HapticFeedback.lightImpact();
    final success = await ref.read(authProvider.notifier).loginWithGoogle();
    if (!mounted) return;
    if (success) {
      goAfterSignIn(context, ref.read(authProvider));
    } else {
      final message = ref.read(authProvider).errorMessage;
      if (message == null) return; // cancelled by the user
      _explainFailure(
        message,
        "We couldn't find a REPSI account linked to this Google account. Sign in with your mobile number instead.",
      );
    }
  }

  void _explainFailure(String message, String notFoundMessage) {
    final lower = message.toLowerCase();
    if (lower.contains('not found') || lower.contains('no owner account') || lower.contains('register')) {
      _showAccountNotFound(notFoundMessage);
    }
    // Other errors are shown in the banner above the form.
  }

  void _showAccountNotFound(String message) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Account not found'),
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Try again')),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              setState(() => _emailMode = false);
            },
            child: const Text('Use mobile number'),
          ),
        ],
      ),
    );
  }

  void _showOwnerSignup() {
    RepsiBottomSheet.show<void>(
      context: context,
      title: 'Set up a new gym',
      child: Builder(
        builder: (ctx) {
          final isDark = Theme.of(ctx).brightness == Brightness.dark;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Gym businesses are created on the REPSI website, where you choose a plan and set up your branches. '
                'Once it is ready, sign in here with the same mobile number.',
                style: AppTypography.bodySecondary.copyWith(color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
              ),
              const SizedBox(height: AppSpacing.xxl),
              RepsiButton(
                text: 'Copy repsi.app link',
                isFullWidth: true,
                leadingIcon: const Icon(Icons.link_rounded, size: 18, color: Colors.white),
                onPressed: () {
                  Navigator.pop(ctx);
                  Clipboard.setData(const ClipboardData(text: 'https://repsi.app'));
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copied: https://repsi.app')));
                },
              ),
            ],
          );
        },
      ),
    );
  }

  // ─── Layout ─────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authState = ref.watch(authProvider);
    final signingIn = authState.status == AuthStatus.loading;
    // Also shown after an expired session, where the status is `unauthenticated` with a message.
    final authError = authState.errorMessage != null &&
            (authState.status == AuthStatus.error || authState.status == AuthStatus.unauthenticated)
        ? authState.errorMessage
        : null;
    final textColor = isDark ? AppColors.darkText : AppColors.text;
    final secondary = isDark ? AppColors.darkTextSecondary : AppColors.textSecondary;

    return AuthLayout(
      showBack: false,
      leading: RepsiWhiteLogo(height: 44, color: textColor),
      footer: Wrap(
        alignment: WrapAlignment.center,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          Text('Setting up a new gym? ', style: AppTypography.bodySmall.copyWith(color: secondary)),
          InkWell(
            onTap: _showOwnerSignup,
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
              child: Text(
                'Start on repsi.app',
                style: AppTypography.bodySmall.copyWith(
                  color: isDark ? AppColors.darkPrimaryLight : AppColors.primaryDark,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: AuthHeading(
              key: ValueKey(_emailMode),
              title: _emailMode ? 'Welcome back' : "Let's get started",
              subtitle: Text(
                _emailMode
                    ? 'Sign in with the email or mobile number and password on your account.'
                    : "Enter your mobile number and we'll send a verification code on WhatsApp.",
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xxxl),
          if (authError != null) ...[
            RepsiErrorBanner(
              icon: Icons.info_outline_rounded,
              message: authError,
              onRetry: _emailMode && !signingIn && !_lastMethodWasGoogle ? _handleLogin : null,
            ),
            const SizedBox(height: AppSpacing.lg),
          ],
          AnimatedSize(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            alignment: Alignment.topCenter,
            child: _emailMode ? _emailForm(signingIn, secondary) : _phoneForm(),
          ),
          const SizedBox(height: AppSpacing.xxl),
          _OrDivider(color: secondary),
          const SizedBox(height: AppSpacing.xxl),
          RepsiButton(
            text: 'Continue with Google',
            variant: RepsiButtonVariant.outline,
            isFullWidth: true,
            leadingIcon: const GoogleLogoIcon(size: 18),
            onPressed: signingIn || _sendingCode ? null : _handleGoogleLogin,
          ),
          const SizedBox(height: AppSpacing.sm),
          TextButton(
            onPressed: signingIn || _sendingCode ? null : () => setState(() => _emailMode = !_emailMode),
            style: TextButton.styleFrom(minimumSize: const Size.fromHeight(48), foregroundColor: textColor),
            child: Text(
              _emailMode ? 'Use mobile number instead' : 'Sign in with email and password',
              style: AppTypography.button.copyWith(color: textColor),
            ),
          ),
        ],
      ),
    );
  }

  Widget _phoneForm() {
    return Form(
      key: _phoneFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          RepsiTextField(
            label: 'Mobile number',
            hintText: '98765 43210',
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.send,
            autofillHints: const [AutofillHints.telephoneNumberNational],
            inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)],
            prefixIcon: const IndiaDialCode(),
            onSubmitted: (_) => _sendCode(),
            onChanged: (_) {
              if (_phoneError != null) setState(() => _phoneError = null);
            },
            validator: (value) {
              final v = value?.trim() ?? '';
              if (v.isEmpty) return 'Enter your mobile number';
              if (!_indianMobile.hasMatch(v)) return 'Enter a valid 10-digit mobile number';
              return null;
            },
          ),
          if (_phoneError != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(_phoneError!, style: AppTypography.caption.copyWith(color: AppColors.error)),
          ],
          const SizedBox(height: AppSpacing.xl),
          RepsiButton(
            text: 'Send code on WhatsApp',
            isFullWidth: true,
            isLoading: _sendingCode,
            leadingIcon: const WhatsAppMark(size: 20),
            onPressed: _sendingCode ? null : _sendCode,
          ),
        ],
      ),
    );
  }

  Widget _emailForm(bool signingIn, Color secondary) {
    return Form(
      key: _emailFormKey,
      child: AutofillGroup(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            RepsiTextField(
              label: 'Email or mobile number',
              hintText: 'name@example.com',
              controller: _identifierController,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.username, AutofillHints.email],
              prefixIcon: const Icon(Icons.person_outline_rounded, size: 20),
              validator: (val) => val == null || val.trim().isEmpty ? 'Email or mobile number is required' : null,
            ),
            const SizedBox(height: AppSpacing.lg),
            RepsiTextField(
              label: 'Password',
              controller: _passwordController,
              isPassword: true,
              textInputAction: TextInputAction.done,
              autofillHints: const [AutofillHints.password],
              onSubmitted: (_) => _handleLogin(),
              prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
              validator: (val) => val == null || val.isEmpty ? 'Password is required' : null,
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => context.push(RouteNames.forgotPassword),
                style: TextButton.styleFrom(foregroundColor: secondary, minimumSize: const Size(44, 44)),
                child: Text('Forgot password?', style: AppTypography.caption.copyWith(color: secondary, fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            RepsiButton(
              text: 'Sign in',
              isLoading: signingIn && !_lastMethodWasGoogle,
              onPressed: signingIn ? null : _handleLogin,
              isFullWidth: true,
            ),
          ],
        ),
      ),
    );
  }
}

class _OrDivider extends StatelessWidget {
  final Color color;

  const _OrDivider({required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider()),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: Text('or', style: AppTypography.caption.copyWith(color: color)),
        ),
        const Expanded(child: Divider()),
      ],
    );
  }
}
