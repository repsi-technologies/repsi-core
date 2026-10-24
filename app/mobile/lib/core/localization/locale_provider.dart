import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../api/api_endpoints.dart';
import '../providers/api_provider.dart';
import '../providers/storage_provider.dart';
import 'app_locale.dart';

class LocaleNotifier extends StateNotifier<AppLanguage> {
  static const String _key = 'repsi_user_language';
  final Ref _ref;

  LocaleNotifier(this._ref) : super(AppLanguage.en) {
    _loadSavedLanguage();
    // The account's saved language follows the user across devices: apply it on sign-in.
    _ref.listen<String?>(authProvider.select((s) => s.user?.preferredLanguage), (_, code) {
      if (code != null && AppLanguage.isSupported(code) && code != state.code) {
        _apply(AppLanguage.fromCode(code));
      }
    });
  }

  Future<void> _loadSavedLanguage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final code = prefs.getString(_key);
      if (code != null) {
        state = AppLanguage.fromCode(code);
      }
    } catch (_) {}
  }

  Future<void> _apply(AppLanguage language) async {
    state = language;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, language.code);
    } catch (_) {}
  }

  Future<void> setLanguage(AppLanguage language) async {
    await _apply(language);
    // Signed-in users keep the choice on their account; failures (offline) keep the local choice.
    try {
      final token = await _ref.read(secureStorageServiceProvider).getToken();
      if (token == null || token.isEmpty) return;
      await _ref.read(apiClientProvider).dio.put(ApiEndpoints.myLanguage, data: {'language': language.code});
    } catch (_) {}
  }

  String translate(String key) {
    return AppStrings.get(key, lang: state);
  }
}

final localeNotifierProvider = StateNotifierProvider<LocaleNotifier, AppLanguage>((ref) {
  return LocaleNotifier(ref);
});
