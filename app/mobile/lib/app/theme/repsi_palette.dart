import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Theme-aware colour tokens. Screens read `context.palette.text` instead of `AppColors.text`, so
/// the same widget renders correctly in light and dark mode. Brand colours that are identical in
/// both themes (`AppColors.primary`, gradients) stay on [AppColors].
@immutable
class RepsiPalette extends ThemeExtension<RepsiPalette> {
  final Color background;
  final Color surface;
  final Color surfaceSecondary;
  final Color surfaceSubtle;
  final Color surfaceHover;
  final Color text;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color textDisabled;
  final Color textTertiary;
  final Color border;
  final Color borderLight;
  final Color borderStrong;
  final Color divider;
  final Color primarySoft;
  final Color primaryLight;
  final Color primaryDark;
  final Color success;
  final Color successSoft;
  final Color successLight;
  final Color successDark;
  final Color warning;
  final Color warningSoft;
  final Color warningLight;
  final Color warningDark;
  final Color error;
  final Color errorSoft;
  final Color errorLight;
  final Color errorDark;
  final Color info;
  final Color infoSoft;
  final Color infoLight;
  final Color badgeActiveBg;
  final Color badgeActiveFg;
  final Color badgeExpiringBg;
  final Color badgeExpiringFg;
  final Color badgeExpiredBg;
  final Color badgeExpiredFg;
  final Color badgeFrozenBg;
  final Color badgeFrozenFg;
  final Color badgeCancelledBg;
  final Color badgeCancelledFg;

  /// Soft glow behind hero cards and selected tiles.
  final Color shadow;

  const RepsiPalette({
    required this.background,
    required this.surface,
    required this.surfaceSecondary,
    required this.surfaceSubtle,
    required this.surfaceHover,
    required this.text,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.textDisabled,
    required this.textTertiary,
    required this.border,
    required this.borderLight,
    required this.borderStrong,
    required this.divider,
    required this.primarySoft,
    required this.primaryLight,
    required this.primaryDark,
    required this.success,
    required this.successSoft,
    required this.successLight,
    required this.successDark,
    required this.warning,
    required this.warningSoft,
    required this.warningLight,
    required this.warningDark,
    required this.error,
    required this.errorSoft,
    required this.errorLight,
    required this.errorDark,
    required this.info,
    required this.infoSoft,
    required this.infoLight,
    required this.badgeActiveBg,
    required this.badgeActiveFg,
    required this.badgeExpiringBg,
    required this.badgeExpiringFg,
    required this.badgeExpiredBg,
    required this.badgeExpiredFg,
    required this.badgeFrozenBg,
    required this.badgeFrozenFg,
    required this.badgeCancelledBg,
    required this.badgeCancelledFg,
    required this.shadow,
  });

  static const light = RepsiPalette(
    background: AppColors.background,
    surface: AppColors.surface,
    surfaceSecondary: AppColors.surfaceSecondary,
    surfaceSubtle: AppColors.surfaceSubtle,
    surfaceHover: AppColors.surfaceHover,
    text: AppColors.text,
    textPrimary: AppColors.textPrimary,
    textSecondary: AppColors.textSecondary,
    textMuted: AppColors.textMuted,
    textDisabled: AppColors.textDisabled,
    textTertiary: AppColors.textTertiary,
    border: AppColors.border,
    borderLight: AppColors.borderLight,
    borderStrong: AppColors.borderStrong,
    divider: AppColors.divider,
    primarySoft: AppColors.primarySoft,
    primaryLight: AppColors.primaryLight,
    primaryDark: AppColors.primaryDark,
    success: AppColors.success,
    successSoft: AppColors.successSoft,
    successLight: AppColors.successLight,
    successDark: AppColors.successDark,
    warning: AppColors.warning,
    warningSoft: AppColors.warningSoft,
    warningLight: AppColors.warningLight,
    warningDark: AppColors.warningDark,
    error: AppColors.error,
    errorSoft: AppColors.errorSoft,
    errorLight: AppColors.errorLight,
    errorDark: AppColors.errorDark,
    info: AppColors.info,
    infoSoft: AppColors.infoSoft,
    infoLight: AppColors.infoLight,
    badgeActiveBg: AppColors.badgeActiveBg,
    badgeActiveFg: AppColors.badgeActiveFg,
    badgeExpiringBg: AppColors.badgeExpiringBg,
    badgeExpiringFg: AppColors.badgeExpiringFg,
    badgeExpiredBg: AppColors.badgeExpiredBg,
    badgeExpiredFg: AppColors.badgeExpiredFg,
    badgeFrozenBg: AppColors.badgeFrozenBg,
    badgeFrozenFg: AppColors.badgeFrozenFg,
    badgeCancelledBg: AppColors.badgeCancelledBg,
    badgeCancelledFg: AppColors.badgeCancelledFg,
    shadow: Color(0x14101114),
  );

  static const dark = RepsiPalette(
    background: AppColors.darkBackground,
    surface: AppColors.darkSurface,
    surfaceSecondary: AppColors.darkSurfaceSecondary,
    surfaceSubtle: AppColors.darkSurfaceSecondary,
    surfaceHover: AppColors.darkSurfaceElevated,
    text: AppColors.darkText,
    textPrimary: AppColors.darkTextPrimary,
    textSecondary: AppColors.darkTextSecondary,
    textMuted: AppColors.darkTextMuted,
    textDisabled: AppColors.darkTextDisabled,
    textTertiary: AppColors.darkTextTertiary,
    border: AppColors.darkBorder,
    borderLight: AppColors.darkBorder,
    borderStrong: AppColors.darkBorderStrong,
    divider: AppColors.darkDivider,
    primarySoft: AppColors.darkPrimarySoft,
    primaryLight: AppColors.darkPrimarySoft,
    primaryDark: AppColors.darkPrimaryLight,
    success: AppColors.darkSuccess,
    successSoft: AppColors.darkSuccessSoft,
    successLight: AppColors.darkSuccessSoft,
    successDark: AppColors.darkSuccess,
    warning: AppColors.darkWarning,
    warningSoft: AppColors.darkWarningSoft,
    warningLight: AppColors.darkWarningSoft,
    warningDark: AppColors.darkWarning,
    error: AppColors.darkError,
    errorSoft: AppColors.darkErrorSoft,
    errorLight: AppColors.darkErrorSoft,
    errorDark: AppColors.darkError,
    info: AppColors.darkInfo,
    infoSoft: AppColors.darkInfoSoft,
    infoLight: AppColors.darkInfoSoft,
    badgeActiveBg: AppColors.darkSuccessSoft,
    badgeActiveFg: AppColors.darkSuccess,
    badgeExpiringBg: AppColors.darkWarningSoft,
    badgeExpiringFg: AppColors.darkWarning,
    badgeExpiredBg: AppColors.darkErrorSoft,
    badgeExpiredFg: AppColors.darkError,
    badgeFrozenBg: AppColors.darkInfoSoft,
    badgeFrozenFg: AppColors.darkInfo,
    badgeCancelledBg: AppColors.darkInfoSoft,
    badgeCancelledFg: AppColors.darkInfo,
    shadow: Color(0x66000000),
  );

  @override
  RepsiPalette copyWith() => this;

  @override
  RepsiPalette lerp(ThemeExtension<RepsiPalette>? other, double t) {
    if (other is! RepsiPalette) return this;
    Color l(Color a, Color b) => Color.lerp(a, b, t)!;
    return RepsiPalette(
      background: l(background, other.background),
      surface: l(surface, other.surface),
      surfaceSecondary: l(surfaceSecondary, other.surfaceSecondary),
      surfaceSubtle: l(surfaceSubtle, other.surfaceSubtle),
      surfaceHover: l(surfaceHover, other.surfaceHover),
      text: l(text, other.text),
      textPrimary: l(textPrimary, other.textPrimary),
      textSecondary: l(textSecondary, other.textSecondary),
      textMuted: l(textMuted, other.textMuted),
      textDisabled: l(textDisabled, other.textDisabled),
      textTertiary: l(textTertiary, other.textTertiary),
      border: l(border, other.border),
      borderLight: l(borderLight, other.borderLight),
      borderStrong: l(borderStrong, other.borderStrong),
      divider: l(divider, other.divider),
      primarySoft: l(primarySoft, other.primarySoft),
      primaryLight: l(primaryLight, other.primaryLight),
      primaryDark: l(primaryDark, other.primaryDark),
      success: l(success, other.success),
      successSoft: l(successSoft, other.successSoft),
      successLight: l(successLight, other.successLight),
      successDark: l(successDark, other.successDark),
      warning: l(warning, other.warning),
      warningSoft: l(warningSoft, other.warningSoft),
      warningLight: l(warningLight, other.warningLight),
      warningDark: l(warningDark, other.warningDark),
      error: l(error, other.error),
      errorSoft: l(errorSoft, other.errorSoft),
      errorLight: l(errorLight, other.errorLight),
      errorDark: l(errorDark, other.errorDark),
      info: l(info, other.info),
      infoSoft: l(infoSoft, other.infoSoft),
      infoLight: l(infoLight, other.infoLight),
      badgeActiveBg: l(badgeActiveBg, other.badgeActiveBg),
      badgeActiveFg: l(badgeActiveFg, other.badgeActiveFg),
      badgeExpiringBg: l(badgeExpiringBg, other.badgeExpiringBg),
      badgeExpiringFg: l(badgeExpiringFg, other.badgeExpiringFg),
      badgeExpiredBg: l(badgeExpiredBg, other.badgeExpiredBg),
      badgeExpiredFg: l(badgeExpiredFg, other.badgeExpiredFg),
      badgeFrozenBg: l(badgeFrozenBg, other.badgeFrozenBg),
      badgeFrozenFg: l(badgeFrozenFg, other.badgeFrozenFg),
      badgeCancelledBg: l(badgeCancelledBg, other.badgeCancelledBg),
      badgeCancelledFg: l(badgeCancelledFg, other.badgeCancelledFg),
      shadow: l(shadow, other.shadow),
    );
  }
}

extension RepsiPaletteContext on BuildContext {
  /// Colours for the current brightness. Falls back to light outside a themed tree (tests).
  RepsiPalette get palette => Theme.of(this).extension<RepsiPalette>() ?? RepsiPalette.light;

  bool get isDarkMode => Theme.of(this).brightness == Brightness.dark;
}
