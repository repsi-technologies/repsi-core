import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../app/routes/route_names.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/widgets/repsi_button.dart';
import '../../../shared/widgets/repsi_text_field.dart';
import '../providers/auth_provider.dart';

import '../../../l10n/l10n.dart';
class SignupView extends ConsumerStatefulWidget {
  const SignupView({super.key});

  @override
  ConsumerState<SignupView> createState() => _SignupViewState();
}

class _SignupViewState extends ConsumerState<SignupView> {
  int _currentStep = 0;
  final _step1FormKey = GlobalKey<FormState>();
  final _step2FormKey = GlobalKey<FormState>();

  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  final _gymNameController = TextEditingController();
  final _gymPhoneController = TextEditingController();
  final _gymCityController = TextEditingController();

  String _generatedSlug = '';

  @override
  void initState() {
    super.initState();
    _gymNameController.addListener(_updateSlug);
  }

  void _updateSlug() {
    final text = _gymNameController.text.trim().toLowerCase();
    setState(() {
      _generatedSlug = text.replaceAll(RegExp(r'[^a-z0-9]+'), '-').replaceAll(RegExp(r'^-+|-+$'), '');
    });
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _gymNameController.dispose();
    _gymPhoneController.dispose();
    _gymCityController.dispose();
    super.dispose();
  }

  Future<void> _handleStep1Submit() async {
    if (!_step1FormKey.currentState!.validate()) return;
    setState(() {
      _currentStep = 1;
    });
  }

  Future<void> _handleRegister() async {
    if (!_step2FormKey.currentState!.validate()) return;

    final success = await ref.read(authProvider.notifier).registerMember(
      fullName: _fullNameController.text,
      email: _emailController.text,
      password: _passwordController.text,
      workspaceSlug: _generatedSlug,
      phone: _gymPhoneController.text.isNotEmpty ? _gymPhoneController.text : null,
    );

    if (success && mounted) {
      context.go(RouteNames.userDashboard);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authState = ref.watch(authProvider);

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
          onPressed: () {
            if (_currentStep == 1) {
              setState(() => _currentStep = 0);
            } else {
              context.pop();
            }
          },
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xxl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Container(
                      height: 4,
                      decoration: BoxDecoration(
                        color: _currentStep == 1
                            ? AppColors.primary
                            : (isDark ? AppColors.darkSurfaceElevated : AppColors.border),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xl),
              Text(
                _currentStep == 0 ? context.l10n.createAccountTitle : context.l10n.joinGymTitle,
                style: AppTypography.headingLarge.copyWith(
                  color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                _currentStep == 0
                    ? context.l10n.signupStep1
                    : context.l10n.signupStep2,
                style: AppTypography.bodySmall.copyWith(
                  color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.xxl),
              if (authState.errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.error.withValues(alpha: 0.15) : AppColors.errorLight,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  ),
                  child: Text(
                    authState.errorMessage!,
                    style: AppTypography.bodySmall.copyWith(color: AppColors.error),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
              ],
              if (_currentStep == 0) _buildStep1(isDark) else _buildStep2(isDark, authState.status == AuthStatus.loading),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep1(bool isDark) {
    return Form(
      key: _step1FormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          RepsiTextField(
            label: context.l10n.fullName,
            hintText: context.l10n.nameHintExample,
            controller: _fullNameController,
            prefixIcon: Icon(
              LucideIcons.user,
              size: 18,
              color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
            ),
            validator: (val) => val == null || val.trim().isEmpty ? context.l10n.fullNameRequired : null,
          ),
          const SizedBox(height: AppSpacing.md),
          RepsiTextField(
            label: context.l10n.commonEmail,
            hintText: context.l10n.commonEmailHint,
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            prefixIcon: Icon(
              LucideIcons.mail,
              size: 18,
              color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
            ),
            validator: (val) {
              if (val == null || val.trim().isEmpty) return context.l10n.emailRequired;
              if (!val.contains('@')) return context.l10n.commonEnterValidEmail;
              return null;
            },
          ),
          const SizedBox(height: AppSpacing.md),
          RepsiTextField(
            label: context.l10n.commonPassword,
            hintText: context.l10n.commonAtLeast8Chars,
            controller: _passwordController,
            isPassword: true,
            prefixIcon: Icon(
              LucideIcons.lock,
              size: 18,
              color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
            ),
            validator: (val) {
              if (val == null || val.isEmpty) return context.l10n.passwordRequired;
              if (val.length < 8) return context.l10n.commonUseAtLeast8Chars;
              return null;
            },
          ),
          const SizedBox(height: AppSpacing.xxl),
          RepsiButton(
                text: context.l10n.continueToGym,
            onPressed: _handleStep1Submit,
            isFullWidth: true,
            size: RepsiButtonSize.large,
            trailingIcon: const Icon(LucideIcons.arrowRight, size: 18),
          ),
        ],
      ),
    );
  }

  Widget _buildStep2(bool isDark, bool isLoading) {
    return Form(
      key: _step2FormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          RepsiTextField(
            label: context.l10n.gymCode,
            hintText: 'iron-paradise',
            controller: _gymNameController,
            prefixIcon: Icon(
              LucideIcons.building,
              size: 18,
              color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
            ),
            validator: (val) => val == null || val.trim().isEmpty ? context.l10n.gymCodeRequired : null,
          ),
          const SizedBox(height: AppSpacing.sm),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : AppColors.surfaceSubtle,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.border),
            ),
            child: Row(
              children: [
                Icon(LucideIcons.globe, size: 14, color: AppColors.primary),
                const SizedBox(width: AppSpacing.xs),
                Expanded(
                  child: Text(
                    context.l10n.signupJoining(_generatedSlug.isEmpty ? 'your-gym' : _generatedSlug),
                    style: AppTypography.caption.copyWith(
                      fontWeight: FontWeight.w600,
                      color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          RepsiTextField(
            label: context.l10n.phoneOptional,
            hintText: '+91 98765 43210',
            controller: _gymPhoneController,
            keyboardType: TextInputType.phone,
            prefixIcon: Icon(
              LucideIcons.phone,
              size: 18,
              color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          RepsiTextField(
            label: context.l10n.cityOptional,
            hintText: context.l10n.cityHint,
            controller: _gymCityController,
            prefixIcon: Icon(
              LucideIcons.mapPin,
              size: 18,
              color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          RepsiButton(
            text: context.l10n.createMemberAccount,
            isLoading: isLoading,
            onPressed: _handleRegister,
            isFullWidth: true,
            size: RepsiButtonSize.large,
          ),
        ],
      ),
    );
  }
}
