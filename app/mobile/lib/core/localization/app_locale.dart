import 'dart:ui';

/// The languages REPSI ships. Keep in sync with app/web/lib/i18n/languages.ts and
/// app/api/app/core/i18n.py. English is the default and the fallback for missing strings.
/// UI strings live in lib/l10n/app_<code>.arb (see l10n.yaml); this enum only carries the
/// metadata the language picker needs. English and Tamil are listed first on purpose.
enum AppLanguage {
  en('en', 'English', 'English', 'EN'),
  ta('ta', 'தமிழ்', 'Tamil', 'த'),
  ml('ml', 'മലയാളം', 'Malayalam', 'മ'),
  hi('hi', 'हिन्दी', 'Hindi', 'हि');

  final String code;
  final String nativeName;
  final String englishName;
  final String badge;

  const AppLanguage(this.code, this.nativeName, this.englishName, this.badge);

  Locale get locale => Locale(code);

  /// Only English is reviewed end to end; the Indian-language catalogues are drafts awaiting
  /// native-speaker review (docs/MULTILINGUAL.md), so the picker labels them Beta.
  bool get isBeta => this != AppLanguage.en;

  static bool isSupported(String? code) => AppLanguage.values.any((lang) => lang.code == code);

  static AppLanguage fromCode(String? code) {
    if (code == null) return AppLanguage.en;
    return AppLanguage.values.firstWhere(
      (lang) => lang.code == code,
      orElse: () => AppLanguage.en,
    );
  }

  /// First supported language among the device's preferred locales ("ta-IN" -> Tamil), if any.
  static AppLanguage? fromLocales(Iterable<Locale> locales) {
    for (final locale in locales) {
      final code = locale.languageCode.toLowerCase();
      if (isSupported(code)) return fromCode(code);
    }
    return null;
  }
}
