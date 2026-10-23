import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/routes/route_names.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/animations/repsi_stagger.dart';
import '../../../shared/widgets/google_logo_icon.dart';
import '../../../shared/widgets/repsi_button.dart';
import '../../../shared/widgets/repsi_error_banner.dart';
import '../../../shared/widgets/repsi_screen_background.dart';
import '../../../shared/widgets/repsi_white_logo.dart';
import '../../../shared/widgets/repsi_text_field.dart';
import '../providers/auth_provider.dart';

class LoginView extends ConsumerStatefulWidget {
  const LoginView({super.key});

  @override
  ConsumerState<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends ConsumerState<LoginView> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  static const _ink = Color(0xFF111214);
  bool _lastMethodWasGoogle = false;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _showWebsiteRegisterModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Container(
                    width: 56,
                    height: 56,
                    decoration: const BoxDecoration(
                      color: AppColors.primarySoft,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.language_rounded, color: AppColors.primaryDark, size: 28),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Register on repsi.app',
                    style: AppTypography.headingSmall.copyWith(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppColors.text,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Owner accounts and gym workspaces must be created on our website. The mobile app is strictly for authenticating and managing existing Owner workspaces.',
                    textAlign: TextAlign.center,
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 24),
                  RepsiButton(
                    text: 'Go to repsi.app',
                    isFullWidth: true,
                    leadingIcon: const Icon(Icons.open_in_new_rounded, size: 18, color: Colors.white),
                    onPressed: () {
                      Navigator.pop(ctx);
                      Clipboard.setData(const ClipboardData(text: 'https://repsi.app'));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Website link copied: https://repsi.app'),
                          backgroundColor: AppColors.primaryDark,
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 10),
                  TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: Text(
                      'Cancel',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textMuted,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _showAccountNotFoundDialog({required String title, required String message}) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: Colors.white,
        title: Row(
          children: [
            const Icon(Icons.account_circle_outlined, color: AppColors.error, size: 26),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                title,
                style: AppTypography.headingSmall.copyWith(fontSize: 18, fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
        content: Text(
          message,
          style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Try again'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              _showWebsiteRegisterModal();
            },
            child: const Text('Go to repsi.app'),
          ),
        ],
      ),
    );
  }

  void _routePostLogin() {
    final authState = ref.read(authProvider);
    final user = authState.user;
    final role = user?.role.toUpperCase();

    if (role == 'TRAINER' || role == 'USER' || role == 'MEMBER' || role == 'ADMIN' || role == 'SUPER_ADMIN') {
      context.go(RouteNames.roleDashboard(user?.role));
      return;
    }

    // Owner accounts proceed directly to their workspace dashboard
    if (authState.activeWorkspaceId != null && authState.activeWorkspaceId!.isNotEmpty) {
      context.go(RouteNames.dashboard);
      return;
    }

    context.go(RouteNames.selectWorkspace);
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    _lastMethodWasGoogle = false;
    FocusScope.of(context).unfocus();
    HapticFeedback.lightImpact();

    final identifier = _identifierController.text.trim();
    final pass = _passwordController.text;

    final success = await ref.read(authProvider.notifier).login(
          email: identifier,
          password: pass,
        );

    if (mounted) {
      if (success) {
        _routePostLogin();
      } else {
        final errorMsg = ref.read(authProvider).errorMessage ?? 'Failed to sign in. Please check your credentials.';
        if (errorMsg.toLowerCase().contains('not found') || errorMsg.toLowerCase().contains('no owner account')) {
          _showAccountNotFoundDialog(
            title: 'Account not found',
            message: "We couldn't find a Repsi owner account with those details.\n\nPlease check your email/mobile number or register from the Repsi website.",
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMsg),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  Future<void> _handleGoogleLogin() async {
    _lastMethodWasGoogle = true;
    FocusScope.of(context).unfocus();
    HapticFeedback.lightImpact();
    final success = await ref.read(authProvider.notifier).loginWithGoogle();
    if (mounted) {
      if (success) {
        _routePostLogin();
      } else {
        final errorMsg = ref.read(authProvider).errorMessage ?? 'Google Sign-In was not completed.';
        if (errorMsg.contains('Account not found') || errorMsg.contains('register')) {
          _showAccountNotFoundDialog(
            title: 'Account not found',
            message: "We couldn't find a Repsi owner account linked to this Google account.\n\nPlease register your Repsi account from the website first.",
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMsg),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isLoading = authState.status == AuthStatus.loading;
    // Also shown after an expired session, where the status is `unauthenticated` with a message.
    final isError = authState.errorMessage != null &&
        (authState.status == AuthStatus.error || authState.status == AuthStatus.unauthenticated);

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: RepsiScreenBackground(
          imagePath: 'assets/images/main_splash1.png',
          imageOpacity: 0.05,
          child: SafeArea(
            child: Center(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.pageHorizontalPadding,
                  vertical: 24,
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Brand header
                      RepsiStaggerItem(
                        index: 0,
                        child: Container(
                          padding: const EdgeInsets.fromLTRB(24, 28, 24, 26),
                          decoration: BoxDecoration(
                            color: _ink,
                            borderRadius: BorderRadius.circular(28),
                            gradient: RadialGradient(
                              center: const Alignment(0.9, -1.1),
                              radius: 1.3,
                              colors: [Color.alphaBlend(AppColors.primary.withValues(alpha: 0.4), _ink), _ink],
                            ),
                          ),
                          child: Column(
                            children: [
                              const RepsiWhiteLogo(height: 54),
                              const SizedBox(height: 22),
                              Text(
                                'Welcome back',
                                textAlign: TextAlign.center,
                                style: AppTypography.heading.copyWith(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Sign in to check in, track your activity and manage your membership.',
                                textAlign: TextAlign.center,
                                style: AppTypography.body.copyWith(
                                  fontSize: 14,
                                  height: 1.4,
                                  color: Colors.white70,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      if (isError) ...[
                        RepsiErrorBanner(
                          title: 'Notice',
                          message: authState.errorMessage!,
                          onRetry: isLoading || _lastMethodWasGoogle ? null : _handleLogin,
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Stagger 2: Email or Mobile Field
                      RepsiStaggerItem(
                        index: 2,
                        child: RepsiTextField(
                          label: 'Email or mobile number',
                          hintText: 'name@example.com or phone',
                          controller: _identifierController,
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next,
                          prefixIcon: const Icon(Icons.person_outline_rounded, size: 20),
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) {
                              return 'Email or mobile number is required';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Stagger 3: Password Field + Forgot Password
                      RepsiStaggerItem(
                        index: 3,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            RepsiTextField(
                              label: 'Password',
                              hintText: '••••••••',
                              controller: _passwordController,
                              isPassword: true,
                              textInputAction: TextInputAction.done,
                              onSubmitted: (_) => _handleLogin(),
                              prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                              validator: (val) {
                                if (val == null || val.isEmpty) {
                                  return 'Password is required';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 8),
                            Align(
                              alignment: Alignment.centerRight,
                              child: GestureDetector(
                                onTap: () => context.push(RouteNames.forgotPassword),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 4),
                                  child: Text(
                                    'Forgot password?',
                                    style: AppTypography.caption.copyWith(
                                      color: AppColors.textSecondary,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Stagger 4: Sign in → Button
                      RepsiStaggerItem(
                        index: 4,
                        child: RepsiButton(
                          text: 'Sign in →',
                          isLoading: isLoading,
                          onPressed: isLoading ? null : _handleLogin,
                          isFullWidth: true,
                          size: RepsiButtonSize.large,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Stagger 5: Divider "or continue with"
                      RepsiStaggerItem(
                        index: 5,
                        child: Row(
                          children: [
                            const Expanded(child: Divider(color: AppColors.border)),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              child: Text(
                                'or continue with',
                                style: AppTypography.caption.copyWith(
                                  color: AppColors.textMuted,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                            const Expanded(child: Divider(color: AppColors.border)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Stagger 6: Continue with Google
                      RepsiStaggerItem(
                        index: 6,
                        child: RepsiButton(
                          text: 'Continue with Google',
                          variant: RepsiButtonVariant.outline,
                          isFullWidth: true,
                          size: RepsiButtonSize.large,
                          leadingIcon: const GoogleLogoIcon(size: 18),
                          onPressed: isLoading ? null : _handleGoogleLogin,
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Stagger 7: Don't have an account? Register on repsi.app
                      RepsiStaggerItem(
                        index: 7,
                        child: Wrap(
                          alignment: WrapAlignment.center,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            Text(
                              "Don't have an account? ",
                              style: AppTypography.bodySmall.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                            GestureDetector(
                              onTap: _showWebsiteRegisterModal,
                              child: Padding(
                                padding: const EdgeInsets.symmetric(vertical: 4),
                                child: Text(
                                  'Register on repsi.app',
                                  style: AppTypography.bodySmall.copyWith(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
