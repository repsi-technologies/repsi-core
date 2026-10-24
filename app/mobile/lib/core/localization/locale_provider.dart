import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../app/theme/app_typography.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../l10n/l10n.dart';
import '../api/api_endpoints.dart';
import '../providers/api_provider.dart';
import '../providers/storage_provider.dart';
import 'app_locale.dart';

/// The app language. Precedence: the user's explicit choice (saved on this device, and on the
/// account when signed in) -> the device locale when REPSI supports it -> English.
///
/// The saved choice survives restarts, sign-out and workspace switches: it lives under its own
/// SharedPreferences key, which `SecureStorageService.clearAll()` deliberately leaves alone.
class LocaleNotifier extends StateNotifier<AppLanguage> {
  static const String storageKey = 'repsi_user_language';
  final Ref _ref;
  final List<Locale> Function() _deviceLocales;
  bool _explicit = false;

  LocaleNotifier(this._ref, {List<Locale> Function()? deviceLocales})
      : _deviceLocales = deviceLocales ?? (() => PlatformDispatcher.instance.locales),
        super(AppLanguage.en) {
    final prefs = _ref.read(sharedPreferencesProvider);
    if (prefs != null) {
      _restore(prefs);
    } else {
      SharedPreferences.getInstance().then(_restore).catchError((_) => _useDefault());
    }
    // The account remembers a choice made on another device: apply it on sign-in, unless the
    // person already picked a language here, in which case this device's choice is synced up.
    _ref.listen<String?>(authProvider.select((s) => s.user?.preferredLanguage), (_, code) {
      if (_explicit) {
        if (code != null && code != state.code) _pushToAccount(state);
        return;
      }
      // "en" is also the server default, so only a non-default account language counts as a choice.
      if (code != null && code != 'en' && AppLanguage.isSupported(code)) {
        _explicit = true;
        _apply(AppLanguage.fromCode(code), persist: true);
      }
    });
  }

  /// Whether the current language was picked by the user (vs. derived from the device).
  bool get isExplicit => _explicit;

  void _restore(SharedPreferences prefs) {
    final saved = prefs.getString(storageKey);
    if (AppLanguage.isSupported(saved)) {
      _explicit = true;
      _apply(AppLanguage.fromCode(saved));
    } else {
      _useDefault();
    }
  }

  void _useDefault() {
    if (_explicit) return;
    _apply(AppLanguage.fromLocales(_deviceLocales()) ?? AppLanguage.en);
  }

  /// Call when the device language changes while the app runs.
  void onDeviceLocalesChanged() => _useDefault();

  void _apply(AppLanguage language, {bool persist = false}) {
    // Formatting and typography first, so the rebuild triggered by `state` already uses them.
    L10n.load(language.locale);
    Intl.defaultLocale = language.code;
    AppTypography.applyScript(language.code);
    if (mounted) state = language;
    if (persist) {
      final prefs = _ref.read(sharedPreferencesProvider);
      if (prefs != null) {
        prefs.setString(storageKey, language.code);
      } else {
        SharedPreferences.getInstance().then((p) => p.setString(storageKey, language.code)).catchError((_) => false);
      }
    }
  }

  Future<void> setLanguage(AppLanguage language) async {
    _explicit = true;
    _apply(language, persist: true);
    await _pushToAccount(language);
  }

  /// Signed-in users keep the choice on their account; failures (offline) keep the local choice.
  Future<void> _pushToAccount(AppLanguage language) async {
    try {
      final token = await _ref.read(secureStorageServiceProvider).getToken();
      if (token == null || token.isEmpty) return;
      await _ref.read(apiClientProvider).dio.put(ApiEndpoints.myLanguage, data: {'language': language.code});
    } catch (_) {}
  }
}

final localeNotifierProvider = StateNotifierProvider<LocaleNotifier, AppLanguage>((ref) {
  return LocaleNotifier(ref);
});
