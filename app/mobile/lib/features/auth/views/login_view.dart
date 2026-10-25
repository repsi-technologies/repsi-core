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

import '../../../l10n/l10n.dart';
import '../../../app/theme/repsi_palette.dart';
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
      if (mounted) setState(() => _phoneError = context.l10n.codeSendFailed);
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
        ref.read(authProvider).errorMessage ?? context.l10n.authSignInFailed,
        context.l10n.accountNotFoundPassword,
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
        context.l10n.accountNotFoundGoogle,
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
        title: Text(context.l10n.accountNotFound),
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(context.l10n.commonTryAgain)),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              setState(() => _emailMode = false);
            },
            child: Text(context.l10n.useMobileNumber),
          ),
        ],
      ),
    );
  }

  void _showOwnerSignup() {
    RepsiBottomSheet.show<void>(
      context: context,
      title: context.l10n.setUpNewGym,
      child: Builder(
        builder: (ctx) {
          final isDark = Theme.of(ctx).brightness == Brightness.dark;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                context.l10n.ownerSignupExplainer,
                style: AppTypography.bodySecondary.copyWith(color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary),
              ),
              const SizedBox(height: AppSpacing.xxl),
              RepsiButton(
                text: context.l10n.copyRepsiLink,
                isFullWidth: true,
                leadingIcon: const Icon(Icons.link_rounded, size: 18, color: Colors.white),
                onPressed: () {
                  Navigator.pop(ctx);
                  Clipboard.setData(const ClipboardData(text: 'https://repsi.app'));
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.commonLinkCopied)));
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
    final textColor = isDark ? AppColors.darkText : context.palette.text;
    final secondary = isDark ? AppColors.darkTextSecondary : context.palette.textSecondary;

    return AuthLayout(
      showBack: false,
      leading: RepsiWhiteLogo(height: 44, color: textColor),
      footer: Wrap(
        alignment: WrapAlignment.center,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          Text(context.l10n.setUpNewGymQuestion, style: AppTypography.bodySmall.copyWith(color: secondary)),
          InkWell(
            onTap: _showOwnerSignup,
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
              child: Text(
                context.l10n.startOnRepsi,
                style: AppTypography.bodySmall.copyWith(
                  color: isDark ? AppColors.darkPrimaryLight : context.palette.primaryDark,
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
            layoutBuilder: (current, previous) => Stack(
              alignment: Alignment.topLeft,
              children: [...previous, if (current != null) current],
            ),
            child: AuthHeading(
              key: ValueKey(_emailMode),
              title: _emailMode ? context.l10n.welcomeBack : context.l10n.letsGetStarted,
              subtitle: Text(
                _emailMode
                    ? context.l10n.loginPasswordSubtitle
                    : context.l10n.loginOtpSubtitle,
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
            text: context.l10n.continueWithGoogle,
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
              _emailMode ? context.l10n.useMobileInstead : context.l10n.signInWithEmailPassword,
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
            label: context.l10n.commonMobileNumber,
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
              if (v.isEmpty) return context.l10n.enterMobileNumber;
              if (!_indianMobile.hasMatch(v)) return context.l10n.enterValid10Digit;
              return null;
            },
          ),
          if (_phoneError != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(_phoneError!, style: AppTypography.caption.copyWith(color: context.palette.error)),
          ],
          const SizedBox(height: AppSpacing.xl),
          RepsiButton(
            text: context.l10n.sendCodeWhatsApp,
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
              label: context.l10n.emailOrMobile,
              hintText: context.l10n.commonEmailHint,
              controller: _identifierController,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.username, AutofillHints.email],
              prefixIcon: const Icon(Icons.person_outline_rounded, size: 20),
              validator: (val) => val == null || val.trim().isEmpty ? context.l10n.emailOrMobileRequired : null,
            ),
            const SizedBox(height: AppSpacing.lg),
            RepsiTextField(
              label: context.l10n.commonPassword,
              controller: _passwordController,
              isPassword: true,
              textInputAction: TextInputAction.done,
              autofillHints: const [AutofillHints.password],
              onSubmitted: (_) => _handleLogin(),
              prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
              validator: (val) => val == null || val.isEmpty ? context.l10n.passwordRequired : null,
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => context.push(RouteNames.forgotPassword),
                style: TextButton.styleFrom(foregroundColor: secondary, minimumSize: const Size(44, 44)),
                child: Text(context.l10n.forgotPassword, style: AppTypography.caption.copyWith(color: secondary, fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            RepsiButton(
              text: context.l10n.signIn,
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
