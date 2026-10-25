import 'package:flutter/material.dart';

/// REPSI Design System Color Palette.
/// Derived directly from REPSI's authoritative design tokens (DESIGN.md / globals.css).
class AppColors {
  // ─── Brand & Accent (Flame Orange) ──────────────────────────────────────────
  static const Color primary = Color(0xFFE25822);
  static const Color primaryHover = Color(0xFFC94715);
  static const Color primaryDark = Color(0xFFAC3A0E); // Link / accent text
  static const Color primarySoft = Color(0xFFFDF1EB);
  static const Color primaryLight = Color(0xFFFDF1EB);

  // ─── Ink (brand moments: splash, onboarding) ────────────────────────────────
  // Near-black canvas for full-bleed brand screens. Working screens use the dark theme below.
  static const Color ink = Color(0xFF101114);
  static const Color inkSurface = Color(0xFF191B20);
  static const Color inkBorder = Color(0xFF2A2D33);
  static const Color inkText = Color(0xFFF4F4F5);
  static const Color inkTextSecondary = Color(0xFFA1A1AA);
  // Brighter orange for accent text and marks on ink only: on white it fails contrast, so buttons
  // and links on light surfaces keep `primary`.
  static const Color primaryBright = Color(0xFFFF6B1A);
  static const Color whatsapp = Color(0xFF25D366);

  // ─── Light Surfaces & Neutrals ──────────────────────────────────────────────
  static const Color background = Color(0xFFF6F6F3);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceSecondary = Color(0xFFEFEEEA);
  static const Color surfaceSubtle = Color(0xFFEFEEEA);
  static const Color surfaceHover = Color(0xFFF0EFEB);

  // ─── Light Typography ───────────────────────────────────────────────────────
  static const Color text = Color(0xFF17191C);
  static const Color textPrimary = Color(0xFF17191C);
  static const Color textSecondary = Color(0xFF6B6F76);
  static const Color textMuted = Color(0xFF6B6F76);
  static const Color textDisabled = Color(0xFFA6A8AC);
  static const Color textTertiary = textMuted;

  // ─── Light Borders & Dividers ───────────────────────────────────────────────
  static const Color border = Color(0xFFE4E2DC);
  static const Color borderLight = Color(0xFFE4E2DC);
  static const Color borderStrong = Color(0xFFC9C7C1);
  static const Color divider = Color(0xFFE4E2DC);

  // ─── Semantic Status (Light) ────────────────────────────────────────────────
  static const Color success = Color(0xFF047857);
  static const Color successSoft = Color(0xFFD1FAE5);
  static const Color successLight = Color(0xFFD1FAE5);
  static const Color successDark = Color(0xFF047857);

  static const Color warning = Color(0xFFA16207);
  static const Color warningSoft = Color(0xFFFEF9C3);
  static const Color warningLight = Color(0xFFFEF9C3);
  static const Color warningDark = Color(0xFFA16207);

  static const Color error = Color(0xFFBE123C);
  static const Color errorSoft = Color(0xFFFFE4E6);
  static const Color errorLight = Color(0xFFFFE4E6);
  static const Color errorDark = Color(0xFFBE123C);

  static const Color info = Color(0xFF475569);
  static const Color infoSoft = Color(0xFFF1F5F9);
  static const Color infoLight = Color(0xFFF1F5F9);

  // ─── Dark Theme ─────────────────────────────────────────────────────────────
  static const Color darkBackground = Color(0xFF0E0F12);
  static const Color darkSurface = Color(0xFF17191D);
  static const Color darkSurfaceSecondary = Color(0xFF20232A);
  static const Color darkSurfaceElevated = Color(0xFF242830);
  static const Color darkSurfaceSoft = Color(0xFF20232A);

  static const Color darkPrimary = Color(0xFFE25822);
  static const Color darkPrimaryHover = Color(0xFFFF7A3D);
  static const Color darkPrimaryDark = Color(0xFFFF8A4F);
  static const Color darkPrimaryLight = Color(0xFFFF8A4F);
  static const Color darkPrimarySoft = Color(0x2EFF6B1A); // 18% orange tint
  static const Color darkOnPrimary = Color(0xFFFFFFFF);

  static const Color darkText = Color(0xFFF5F5F4);
  static const Color darkTextPrimary = Color(0xFFF5F5F4);
  static const Color darkTextSecondary = Color(0xFFA9ACB3);
  static const Color darkTextMuted = Color(0xFF8C9099);
  static const Color darkTextDisabled = Color(0xFF70747A);
  static const Color darkTextTertiary = darkTextMuted;

  static const Color darkBorder = Color(0xFF2A2E35);
  static const Color darkBorderStrong = Color(0xFF3A3F48);
  static const Color darkDivider = Color(0xFF2A2E35);

  static const Color darkSuccess = Color(0xFF34D399);
  static const Color darkSuccessSoft = Color(0x2934D399);
  static const Color darkWarning = Color(0xFFFACC15);
  static const Color darkWarningSoft = Color(0x29FACC15);
  static const Color darkError = Color(0xFFF43F5E);
  static const Color darkErrorSoft = Color(0x29F43F5E);
  static const Color darkInfo = Color(0xFF94A3B8);
  static const Color darkInfoSoft = Color(0x2994A3B8);

  static const Color darkNavigation = darkSurface;

  // ─── Gradients ──────────────────────────────────────────────────────────────
  static const List<Color> brandGradient = [
    Color(0xFFC94715),
    Color(0xFFE25822),
    Color(0xFFEB6D3A),
  ];

  /// Hero cards, primary CTAs and progress rings: bright flame to deep ember.
  static const List<Color> energyGradient = [
    Color(0xFFFF8A3D),
    Color(0xFFE25822),
    Color(0xFFB83A0C),
  ];

  /// Hero cards on dark/ink surfaces.
  static const List<Color> inkGradient = [
    Color(0xFF23262D),
    Color(0xFF16181C),
  ];

  // Accent tints for workout categories and charts (readable on light and dark).
  static const Color accentBlue = Color(0xFF3B82F6);
  static const Color accentViolet = Color(0xFF8B5CF6);
  static const Color accentTeal = Color(0xFF14B8A6);
  static const Color accentPink = Color(0xFFEC4899);
  static const Color accentAmber = Color(0xFFF59E0B);

  static const List<Color> warmOrangeGradient = [
    Color(0xFFFDF1EB),
    Color(0xFFFDE8DD),
    Color(0xFFFBD7C7),
  ];

  static const List<Color> softMintGradient =
      warmOrangeGradient; // Backward-compat

  // ─── Status Badges ──────────────────────────────────────────────────────────
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

  // ─── Compatibility Aliases ──────────────────────────────────────────────────
  static const Color lightBackground = background;
  static const Color lightSurface = surface;
  static const Color lightSurfaceElevated = surface;
  static const Color lightText = text;
  static const Color lightTextSecondary = textSecondary;
  static const Color lightTextMuted = textMuted;
  static const Color lightBorder = border;
  static const Color lightBorderStrong = borderStrong;
  static const Color emerald = primary;
  static const Color paleMint = surfaceSecondary;
}

