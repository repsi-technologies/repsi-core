import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/localization/app_locale.dart';

void main() {
  test('every language translates every English key', () {
    final englishKeys = ['dashboard', 'members', 'payments', 'select_language', 'verification_notice'];
    for (final lang in AppLanguage.values) {
      for (final key in englishKeys) {
        expect(AppStrings.get(key, lang: lang), isNot(key), reason: '${lang.code} is missing $key');
      }
    }
  });

  test('unknown codes fall back to English and Hindi is supported', () {
    expect(AppLanguage.fromCode('xx'), AppLanguage.en);
    expect(AppLanguage.isSupported('hi'), isTrue);
    expect(AppStrings.get('dashboard', lang: AppLanguage.hi), 'डैशबोर्ड');
  });
}
