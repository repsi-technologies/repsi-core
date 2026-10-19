import 'package:flutter/material.dart';

/// REPSI design system color palette.
class AppColors {
  // Core Brand Colors — Flame Orange
  static const Color primary = Color(0xFFE25822);
  static const Color primaryDark = Color(0xFFC94715);
  static const Color emerald = primary;
  static const Color primarySoft = Color(0xFFFDF1EB);
  static const Color primaryLight = Color(0xFFFDF1EB);
  static const Color paleMint = Color(0xFFEFEEEA);
  static const Color primaryHover = Color(0xFFC94715);

  // Light Theme
  static const Color background = Color(0xFFF7F7F5);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceSecondary = Color(0xFFEFEEEA);
  static const Color surfaceSubtle = Color(0xFFEFEEEA);

  // Typography - Light
  static const Color text = Color(0xFF17191C);
  static const Color textPrimary = Color(0xFF17191C);
  static const Color textSecondary = Color(0xFF6B6F76);
  static const Color textMuted = Color(0xFF6B6F76);

  // Borders & Dividers - Light
  static const Color border = Color(0xFFE4E2DC);
  static const Color borderLight = Color(0xFFE4E2DC);
  static const Color divider = Color(0xFFE4E2DC);
  static const Color borderStrong = Color(0xFFC9C7C1);

  // Semantic Status
  static const Color success = Color(0xFF047857);
  static const Color successSoft = Color(0xFFD1FAE5);
  static const Color successLight = Color(0xFFD1FAE5);
  static const Color successDark = Color(0xFF047857);
  static const Color warning = Color(0xFFA16207);
  static const Color warningSoft = Color(0xFFFEF9C3);
  static const Color error = Color(0xFFBE123C);
  static const Color errorSoft = Color(0xFFFFE4E6);
  static const Color errorLight = Color(0xFFFFE4E6);
  static const Color info = Color(0xFF475569);
  static const Color infoSoft = Color(0xFFF1F5F9);

  // Dark Theme
  static const Color darkBackground = Color(0xFF17191C);
  static const Color darkSurface = Color(0xFF24272B);
  static const Color darkSurfaceElevated = Color(0xFF2E3237);
  static const Color darkSurfaceSoft = Color(0xFF2E3237);
  static const Color darkPrimary = Color(0xFFE25822);
  static const Color darkPrimaryDark = Color(0xFFEB6D3A);
  static const Color darkPrimaryLight = Color(0xFFEB6D3A);
  static const Color darkOnPrimary = Color(0xFF17191C);
  static const Color darkText = Color(0xFFF7F7F5);
  static const Color darkTextPrimary = Color(0xFFF7F7F5);
  static const Color darkTextSecondary = Color(0xFFA6A8AC);
  static const Color darkTextMuted = Color(0xFFA6A8AC);
  static const Color darkBorder = Color(0xFF3A3F45);
  static const Color darkDivider = Color(0xFF3A3F45);
  static const Color darkSuccess = Color(0xFF34D399);
  static const Color darkWarning = Color(0xFFFACC15);
  static const Color darkError = Color(0xFFF43F5E);
  static const Color darkInfo = Color(0xFF94A3B8);

  // Gradients
  static const List<Color> brandGradient = [
    Color(0xFFBF4423),
    Color(0xFFD9532F),
    Color(0xFFF07858),
  ];

  static const List<Color> softMintGradient = [
    Color(0xFFFCEAE4),
    Color(0xFFF7D4C8),
    Color(0xFFEFAD98),
  ];

  // Badges
  static const Color badgeActiveBg = Color(0xFFD1FAE5);
  static const Color badgeActiveFg = Color(0xFF047857);
  static const Color badgeExpiringBg = Color(0xFFFEF9C3);
  static const Color badgeExpiringFg = Color(0xFFA16207);
  static const Color badgeExpiredBg = Color(0xFFFFE4E6);
  static const Color badgeExpiredFg = Color(0xFFBE123C);
  static const Color badgeFrozenBg = Color(0xFFF1F5F9);
  static const Color badgeFrozenFg = Color(0xFF475569);
  static const Color badgeCancelledBg = Color(0xFFF1F5F9);
  static const Color badgeCancelledFg = Color(0xFF475569);

  // Compatibility aliases
  static const Color lightBackground = background;
  static const Color lightSurface = surface;
  static const Color lightSurfaceElevated = surface;
  static const Color lightText = text;
  static const Color lightTextSecondary = textSecondary;
  static const Color lightTextMuted = textMuted;
  static const Color lightBorder = border;
  static const Color lightBorderStrong = borderStrong;
  static const Color textTertiary = textMuted;
  static const Color darkTextTertiary = darkTextMuted;
  static const Color darkNavigation = darkSurface;
}

