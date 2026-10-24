import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// REPSI Typography System — IBM Plex Sans.
/// Strictly follows REPSI DESIGN.md specifications:
/// - Primary Family: IBM Plex Sans for headings, interface body, and labels.
/// - Tabular numbers for financial and metric data.
class AppTypography {
  static const String fontFamily = 'IBM Plex Sans';

  /// IBM Plex Sans has no Tamil, Malayalam or Devanagari glyphs. For those languages the matching
  /// Noto Sans family is loaded (only for the active language) and used as the fallback; the
  /// platform's own Indic fonts still cover anything else.
  static List<String> scriptFallback(String languageCode) {
    final TextStyle? style = switch (languageCode) {
      'ta' => GoogleFonts.notoSansTamil(),
      'ml' => GoogleFonts.notoSansMalayalam(),
      'hi' => GoogleFonts.notoSansDevanagari(),
      _ => null,
    };
    final family = style?.fontFamily;
    return family == null ? const [] : [family];
  }

  static ThemeData withScriptFallback(ThemeData theme, List<String> fallback) {
    if (fallback.isEmpty) return theme;
    return theme.copyWith(
      textTheme: _textThemeForScript(theme.textTheme).apply(fontFamilyFallback: fallback),
      primaryTextTheme: _textThemeForScript(theme.primaryTextTheme).apply(fontFamilyFallback: fallback),
    );
  }

  /// True while Tamil, Malayalam or Hindi is active (see [applyScript]).
  static bool isIndic = false;

  static List<TextStyle>? _latin;

  /// Tamil, Malayalam and Devanagari need taller lines than IBM Plex Sans' Latin metrics, and
  /// negative letter-spacing breaks their conjuncts. Called by `LocaleNotifier` on every language
  /// change; the app rebuilds right after, so every screen picks up the adjusted styles.
  static void applyScript(String languageCode) {
    final latin = _latin ??= [
      display, heading, sectionHeading, body, bodySecondary, caption, button,
      headingMedium, bodySmall, labelLarge, labelMedium, buttonSmall, buttonLarge,
    ];
    isIndic = languageCode != 'en';
    final s = latin.map(forScript).toList();
    display = s[0];
    heading = s[1];
    sectionHeading = s[2];
    body = s[3];
    bodySecondary = s[4];
    caption = s[5];
    button = s[6];
    headingMedium = s[7];
    bodySmall = s[8];
    labelLarge = s[9];
    labelMedium = s[10];
    buttonSmall = s[11];
    buttonLarge = s[12];
  }

  static TextStyle forScript(TextStyle style) {
    if (!isIndic) return style;
    final height = style.height;
    return style.copyWith(letterSpacing: 0, height: height == null || height < 1.35 ? 1.35 : height);
  }

  static TextTheme _textThemeForScript(TextTheme t) => isIndic
      ? TextTheme(
          displayLarge: t.displayLarge == null ? null : forScript(t.displayLarge!),
          displayMedium: t.displayMedium == null ? null : forScript(t.displayMedium!),
          displaySmall: t.displaySmall == null ? null : forScript(t.displaySmall!),
          headlineLarge: t.headlineLarge == null ? null : forScript(t.headlineLarge!),
          headlineMedium: t.headlineMedium == null ? null : forScript(t.headlineMedium!),
          headlineSmall: t.headlineSmall == null ? null : forScript(t.headlineSmall!),
          titleLarge: t.titleLarge == null ? null : forScript(t.titleLarge!),
          titleMedium: t.titleMedium == null ? null : forScript(t.titleMedium!),
          titleSmall: t.titleSmall == null ? null : forScript(t.titleSmall!),
          bodyLarge: t.bodyLarge == null ? null : forScript(t.bodyLarge!),
          bodyMedium: t.bodyMedium == null ? null : forScript(t.bodyMedium!),
          bodySmall: t.bodySmall == null ? null : forScript(t.bodySmall!),
          labelLarge: t.labelLarge == null ? null : forScript(t.labelLarge!),
          labelMedium: t.labelMedium == null ? null : forScript(t.labelMedium!),
          labelSmall: t.labelSmall == null ? null : forScript(t.labelSmall!),
        )
      : t;

  static TextStyle display = GoogleFonts.ibmPlexSans(
    fontSize: 30,
    fontWeight: FontWeight.w700,
    color: AppColors.text,
    letterSpacing: -0.5,
    height: 1.15,
  );

  static TextStyle heading = GoogleFonts.ibmPlexSans(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    color: AppColors.text,
    letterSpacing: -0.3,
    height: 1.2,
  );

  static TextStyle sectionHeading = GoogleFonts.ibmPlexSans(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: AppColors.text,
    letterSpacing: -0.2,
    height: 1.25,
  );

  static TextStyle body = GoogleFonts.ibmPlexSans(
    fontSize: 15,
    fontWeight: FontWeight.w400,
    color: AppColors.text,
    height: 1.5,
  );

  static TextStyle bodySecondary = GoogleFonts.ibmPlexSans(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
    height: 1.5,
  );

  static TextStyle caption = GoogleFonts.ibmPlexSans(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
    height: 1.4,
  );

  static TextStyle button = GoogleFonts.ibmPlexSans(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 1.3,
  );

  // Backward-compatible named styles
  static TextStyle get headingLarge => heading;
  static TextStyle headingMedium = GoogleFonts.ibmPlexSans(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: AppColors.text,
    letterSpacing: -0.25,
    height: 1.2,
  );
  static TextStyle get headingSmall => sectionHeading;
  static TextStyle bodySmall = GoogleFonts.ibmPlexSans(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
    height: 1.4,
  );
  static TextStyle get bodyMedium => body;
  static TextStyle labelLarge = GoogleFonts.ibmPlexSans(
    fontSize: 15,
    fontWeight: FontWeight.w600,
    color: AppColors.text,
  );
  static TextStyle labelMedium = GoogleFonts.ibmPlexSans(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
  );
  static TextStyle buttonSmall = GoogleFonts.ibmPlexSans(
    fontSize: 13,
    fontWeight: FontWeight.w600,
  );
  static TextStyle get buttonMedium => button;
  static TextStyle buttonLarge = GoogleFonts.ibmPlexSans(
    fontSize: 16,
    fontWeight: FontWeight.w600,
  );

  /// Tabular font style for metrics, currency, and KPI counters
  static TextStyle tabularNumber({
    double fontSize = 16,
    FontWeight fontWeight = FontWeight.w600,
    Color? color,
  }) {
    return GoogleFonts.ibmPlexSans(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color ?? AppColors.text,
      fontFeatures: const [FontFeature.tabularFigures()],
    );
  }

  static TextTheme textTheme(
      Color textColor, Color secondaryColor, Color mutedColor) {
    return GoogleFonts.ibmPlexSansTextTheme().copyWith(
      displayLarge: GoogleFonts.ibmPlexSans(
        fontSize: 30,
        fontWeight: FontWeight.w700,
        color: textColor,
        letterSpacing: -0.5,
        height: 1.15,
      ),
      displayMedium: GoogleFonts.ibmPlexSans(
        fontSize: 26,
        fontWeight: FontWeight.w600,
        color: textColor,
        letterSpacing: -0.4,
        height: 1.18,
      ),
      headlineLarge: GoogleFonts.ibmPlexSans(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: textColor,
        letterSpacing: -0.3,
        height: 1.2,
      ),
      headlineMedium: GoogleFonts.ibmPlexSans(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: textColor,
        letterSpacing: -0.25,
        height: 1.2,
      ),
      titleLarge: GoogleFonts.ibmPlexSans(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: textColor,
        letterSpacing: -0.2,
        height: 1.25,
      ),
      titleMedium: GoogleFonts.ibmPlexSans(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: textColor,
        height: 1.25,
      ),
      titleSmall: GoogleFonts.ibmPlexSans(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: textColor,
        height: 1.3,
      ),
      bodyLarge: GoogleFonts.ibmPlexSans(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: textColor,
        height: 1.5,
      ),
      bodyMedium: GoogleFonts.ibmPlexSans(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: secondaryColor,
        height: 1.5,
      ),
      bodySmall: GoogleFonts.ibmPlexSans(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: mutedColor,
        height: 1.4,
      ),
      labelLarge: GoogleFonts.ibmPlexSans(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: textColor,
      ),
      labelMedium: GoogleFonts.ibmPlexSans(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: secondaryColor,
      ),
      labelSmall: GoogleFonts.ibmPlexSans(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: mutedColor,
      ),
    );
  }
}
