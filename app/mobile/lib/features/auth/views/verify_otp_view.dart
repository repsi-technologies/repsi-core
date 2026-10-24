import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/routes/route_names.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../core/api/api_error.dart';
import '../../../shared/widgets/repsi_button.dart';
import '../../../shared/widgets/repsi_code_field.dart';
import '../../../shared/widgets/whatsapp_mark.dart';
import '../post_sign_in.dart';
import '../providers/auth_provider.dart';
import '../services/auth_service.dart';
import '../widgets/auth_layout.dart';
import 'complete_profile_view.dart';

class VerifyOtpArgs {
  final PhoneOtpChallenge challenge;

  /// The number as the user typed it (10 digits), for display.
  final String nationalNumber;

  const VerifyOtpArgs({required this.challenge, required this.nationalNumber});
}

/// Step 2 of phone sign-in: enter the WhatsApp code. Existing accounts are signed in; a new
/// number continues to profile completion with the server's registration token.
class VerifyOtpView extends ConsumerStatefulWidget {
  final VerifyOtpArgs args;

  const VerifyOtpView({super.key, required this.args});

  @override
  ConsumerState<VerifyOtpView> createState() => _VerifyOtpViewState();
}

class _VerifyOtpViewState extends ConsumerState<VerifyOtpView> {
  final _code = TextEditingController();
  late PhoneOtpChallenge _challenge = widget.args.challenge;
  Timer? _timer;
  int _resendIn = 0;
  bool _verifying = false;
  bool _resending = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _startCountdown(_challenge.resendIn);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _code.dispose();
    super.dispose();
  }

  void _startCountdown(int seconds) {
    _timer?.cancel();
    setState(() => _resendIn = seconds);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return t.cancel();
      setState(() => _resendIn = (_resendIn - 1).clamp(0, 1 << 30));
      if (_resendIn == 0) t.cancel();
    });
  }

  String get _displayNumber {
    final n = widget.args.nationalNumber;
    return n.length == 10 ? '+91 ${n.substring(0, 5)} ${n.substring(5)}' : _challenge.phone;
  }

  Future<void> _verify() async {
    if (_verifying || _code.text.length != 6) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _verifying = true;
      _error = null;
    });
    try {
      final result = await ref.read(authProvider.notifier).verifyPhoneOtp(phone: _challenge.phone, code: _code.text);
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      if (result.needsRegistration) {
        context.pushReplacement(
          RouteNames.completeProfile,
          extra: CompleteProfileArgs(registrationToken: result.registrationToken!, phone: _challenge.phone),
        );
      } else {
        goAfterSignIn(context, ref.read(authProvider));
      }
    } on ApiError catch (e) {
      if (!mounted) return;
      HapticFeedback.heavyImpact();
      setState(() => _error = e.message);
      _code.clear();
    } catch (_) {
      if (mounted) setState(() => _error = "We couldn't verify the code. Please try again.");
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  Future<void> _resend() async {
    if (_resending || _resendIn > 0) return;
    setState(() {
      _resending = true;
      _error = null;
    });
    try {
      final next = await ref.read(authServiceProvider).requestPhoneOtp(phone: widget.args.nationalNumber);
      if (!mounted) return;
      _challenge = next;
      _code.clear();
      _startCountdown(next.resendIn);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('A new code is on its way to WhatsApp.')));
    } on ApiError catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final text = isDark ? AppColors.darkText : AppColors.text;
    final secondary = isDark ? AppColors.darkTextSecondary : AppColors.textSecondary;
    final minutes = (_resendIn ~/ 60).toString().padLeft(2, '0');
    final seconds = (_resendIn % 60).toString().padLeft(2, '0');

    return AuthLayout(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Align(
            alignment: Alignment.centerLeft,
            child: WhatsAppMark(size: 44, color: Colors.white, fill: AppColors.whatsapp),
          ),
          const SizedBox(height: AppSpacing.xl),
          AuthHeading(
            title: 'Verify your number',
            subtitle: Text.rich(
              TextSpan(children: [
                const TextSpan(text: 'Enter the 6-digit code we sent on WhatsApp to '),
                TextSpan(text: _displayNumber, style: TextStyle(color: text, fontWeight: FontWeight.w600)),
                const TextSpan(text: '.'),
              ]),
            ),
          ),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
              onPressed: _verifying ? null : () => context.pop(),
              style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(44, 40)),
              child: Text(
                'Change number',
                style: AppTypography.bodySmall.copyWith(
                  color: isDark ? AppColors.darkPrimaryLight : AppColors.primaryDark,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          RepsiCodeField(
            controller: _code,
            hasError: _error != null,
            enabled: !_verifying,
            onCompleted: (_) => _verify(),
          ),
          const SizedBox(height: AppSpacing.md),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 180),
            child: _error != null
                ? Row(
                    key: ValueKey(_error),
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.error_outline_rounded, size: 16, color: AppColors.error),
                      const SizedBox(width: 6),
                      Expanded(child: Text(_error!, style: AppTypography.caption.copyWith(color: AppColors.error))),
                    ],
                  )
                : const SizedBox(height: 18),
          ),
          const SizedBox(height: AppSpacing.lg),
          Wrap(
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 4,
            children: [
              Text("Didn't get it?", style: AppTypography.bodySmall.copyWith(color: secondary)),
              if (_resendIn > 0)
                Text(
                  'Resend in $minutes:$seconds',
                  style: AppTypography.tabularNumber(fontSize: 13, fontWeight: FontWeight.w600, color: text),
                )
              else
                TextButton(
                  onPressed: _resending ? null : _resend,
                  style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 4), minimumSize: const Size(44, 40)),
                  child: Text(
                    _resending ? 'Sending…' : 'Resend code',
                    style: AppTypography.bodySmall.copyWith(
                      color: isDark ? AppColors.darkPrimaryLight : AppColors.primaryDark,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
          if (_challenge.testMode) ...[
            const SizedBox(height: AppSpacing.md),
            Text(
              'Test server: WhatsApp is not connected, so use the server\'s test code.',
              style: AppTypography.caption.copyWith(color: secondary),
            ),
          ],
          const SizedBox(height: AppSpacing.xxl),
          ListenableBuilder(
            listenable: _code,
            builder: (context, _) => RepsiButton(
              text: 'Verify',
              isFullWidth: true,
              isLoading: _verifying,
              onPressed: _code.text.length == 6 && !_verifying ? _verify : null,
            ),
          ),
        ],
      ),
    );
  }
}
