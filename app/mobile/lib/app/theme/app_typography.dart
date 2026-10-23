import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// REPSI Typography System — IBM Plex Sans.
/// Strictly follows REPSI DESIGN.md specifications:
/// - Primary Family: IBM Plex Sans for headings, interface body, and labels.
/// - Tabular numbers for financial and metric data.
class AppTypography {
  static const String fontFamily = 'IBM Plex Sans';

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
  static final TextStyle headingLarge = heading;
  static final TextStyle headingMedium = GoogleFonts.ibmPlexSans(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: AppColors.text,
    letterSpacing: -0.25,
    height: 1.2,
  );
  static final TextStyle headingSmall = sectionHeading;
  static final TextStyle bodySmall = GoogleFonts.ibmPlexSans(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
    height: 1.4,
  );
  static final TextStyle bodyMedium = body;
  static final TextStyle labelLarge = GoogleFonts.ibmPlexSans(
    fontSize: 15,
    fontWeight: FontWeight.w600,
    color: AppColors.text,
  );
  static final TextStyle labelMedium = GoogleFonts.ibmPlexSans(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
  );
  static final TextStyle buttonSmall = GoogleFonts.ibmPlexSans(
    fontSize: 13,
    fontWeight: FontWeight.w600,
  );
  static final TextStyle buttonMedium = button;
  static final TextStyle buttonLarge = GoogleFonts.ibmPlexSans(
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
