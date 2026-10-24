import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';

/// Shared frame for the sign-in screens: a quiet canvas with one warm wash in the corner, a
/// predictable back button, and content that scrolls above the keyboard with [footer] kept at the
/// bottom on tall screens.
class AuthLayout extends StatelessWidget {
  final Widget child;
  final Widget? footer;
  final bool showBack;
  final Widget? leading;

  const AuthLayout({super.key, required this.child, this.footer, this.showBack = true, this.leading});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final canvas = isDark ? AppColors.darkBackground : AppColors.surface;

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        backgroundColor: canvas,
        body: DecoratedBox(
          decoration: BoxDecoration(
            gradient: RadialGradient(
              center: const Alignment(1.1, 1.05),
              radius: 1.1,
              colors: [AppColors.primary.withValues(alpha: isDark ? 0.16 : 0.10), canvas.withValues(alpha: 0)],
            ),
          ),
          child: SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) => SingleChildScrollView(
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                padding: const EdgeInsets.fromLTRB(AppSpacing.xxl, AppSpacing.sm, AppSpacing.xxl, AppSpacing.xxl),
                // Phone-width column, centred on tablets and in landscape.
                child: Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight - AppSpacing.xxl - AppSpacing.sm,
                      maxWidth: 440,
                    ),
                    child: IntrinsicHeight(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          SizedBox(
                            height: 48,
                            child: Align(
                              alignment: Alignment.centerLeft,
                              child: leading ??
                                  (showBack && context.canPop()
                                      ? _BackButton(onPressed: () => context.pop())
                                      : const SizedBox.shrink()),
                            ),
                          ),
                          const SizedBox(height: AppSpacing.lg),
                          child,
                          const Spacer(),
                          if (footer != null) ...[const SizedBox(height: AppSpacing.xxl), footer!],
                        ],
                      ),
                    ),
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

class _BackButton extends StatelessWidget {
  final VoidCallback onPressed;

  const _BackButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return IconButton(
      tooltip: 'Back',
      onPressed: onPressed,
      style: IconButton.styleFrom(
        fixedSize: const Size.square(44),
        side: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.border),
        backgroundColor: isDark ? AppColors.darkSurface : AppColors.surface,
      ),
      icon: Icon(Icons.arrow_back_rounded, size: 20, color: isDark ? AppColors.darkText : AppColors.text),
    );
  }
}

/// Page title and supporting line used at the top of every sign-in step.
class AuthHeading extends StatelessWidget {
  final String title;
  final Widget? subtitle;

  const AuthHeading({super.key, required this.title, this.subtitle});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Semantics(
          header: true,
          child: Text(
            title,
            style: AppTypography.display.copyWith(
              fontSize: 28,
              letterSpacing: -0.6,
              color: isDark ? AppColors.darkText : AppColors.text,
            ),
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: AppSpacing.sm),
          DefaultTextStyle.merge(
            style: AppTypography.body.copyWith(color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
            child: subtitle!,
          ),
        ],
      ],
    );
  }
}

/// "+91" with a small flag, used as the prefix of the mobile number field.
class IndiaDialCode extends StatelessWidget {
  const IndiaDialCode({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(left: 14, right: 10),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const _IndiaFlag(),
          const SizedBox(width: 8),
          Text(
            '+91',
            style: AppTypography.body.copyWith(
              fontWeight: FontWeight.w600,
              color: isDark ? AppColors.darkText : AppColors.text,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(width: 10),
          Container(width: 1, height: 22, color: isDark ? AppColors.darkBorder : AppColors.border),
        ],
      ),
    );
  }
}

class _IndiaFlag extends StatelessWidget {
  const _IndiaFlag();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'India',
      child: ClipRRect(
        borderRadius: BorderRadius.circular(2),
        child: SizedBox(
          width: 22,
          height: 15,
          child: Column(
            children: [
              Expanded(child: Container(color: const Color(0xFFFF9933))),
              Expanded(
                child: Container(
                  color: Colors.white,
                  alignment: Alignment.center,
                  child: Container(
                    width: 4,
                    height: 4,
                    decoration: BoxDecoration(
                        shape: BoxShape.circle, border: Border.all(color: const Color(0xFF000080), width: 0.8)),
                  ),
                ),
              ),
              Expanded(child: Container(color: const Color(0xFF138808))),
            ],
          ),
        ),
      ),
    );
  }
}
