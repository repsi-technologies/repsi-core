import 'package:flutter/widgets.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';

import 'app_localizations.dart';

export 'app_localizations.dart';

/// `context.l10n.someKey` in widgets. Rebuilds when the app language changes.
/// Falls back to the current language when a widget is pumped without the delegates (tests).
extension L10nContext on BuildContext {
  AppLocalizations get l10n => Localizations.of<AppLocalizations>(this, AppLocalizations) ?? L10n.current;
}

/// Access for code without a BuildContext (providers, models, error mapping) plus locale-aware
/// formatting. `LocaleNotifier` keeps [current] in step with the selected language.
/// Digits stay Latin in every language so amounts, phone numbers and codes read the same.
class L10n {
  L10n._();

  static AppLocalizations _current = lookupAppLocalizations(const Locale('en'));

  static AppLocalizations get current => _current;

  static String get localeName => _current.localeName;

  static bool _dateDataReady = false;

  static void load(Locale locale) {
    if (!_dateDataReady) {
      // Local date symbols load synchronously; this makes DateFormat work before (and without)
      // the Material delegates, e.g. in providers and widget tests.
      initializeDateFormatting();
      _dateDataReady = true;
    }
    _current = lookupAppLocalizations(
      AppLocalizations.supportedLocales.contains(Locale(locale.languageCode)) ? Locale(locale.languageCode) : const Locale('en'),
    );
  }

  static String get _intlLocale {
    if (!_dateDataReady) load(Locale(_current.localeName));
    return '${_current.localeName}_IN';
  }

  static String get _dateLocale {
    if (!_dateDataReady) load(Locale(_current.localeName));
    return _current.localeName;
  }

  /// ₹1,23,456 (no decimals by default).
  static String currency(num amount, {int decimals = 0, String symbol = '₹'}) =>
      NumberFormat.currency(locale: _intlLocale, symbol: symbol, decimalDigits: decimals).format(amount);

  /// ₹1.2L style compact amounts.
  static String compactCurrency(num amount, {String symbol = '₹'}) =>
      NumberFormat.compactCurrency(locale: _intlLocale, symbol: symbol, decimalDigits: 1).format(amount);

  static String number(num value, {int? decimals}) {
    final format = NumberFormat.decimalPattern(_intlLocale);
    if (decimals != null) {
      format
        ..minimumFractionDigits = decimals
        ..maximumFractionDigits = decimals;
    }
    return format.format(value);
  }

  /// 24 Oct 2026
  static String date(DateTime value) => DateFormat.yMMMd(_dateLocale).format(value);

  /// 24 Oct
  static String shortDate(DateTime value) => DateFormat.MMMd(_dateLocale).format(value);

  /// Friday, 24 October
  static String longDate(DateTime value) => DateFormat.MMMMEEEEd(_dateLocale).format(value);

  /// Fri
  static String weekday(DateTime value) => DateFormat.E(_dateLocale).format(value);

  /// October 2026
  static String monthYear(DateTime value) => DateFormat.yMMMM(_dateLocale).format(value);

  /// 6:30 PM
  static String time(DateTime value) => DateFormat.jm(_dateLocale).format(value);

  /// 24 Oct, 6:30 PM
  static String dateTime(DateTime value) => '${shortDate(value)}, ${time(value)}';
}
