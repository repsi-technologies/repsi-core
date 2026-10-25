import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'storage_provider.dart';

enum AppThemeMode {
  light,
  dark,
  system;

  ThemeMode toThemeMode() {
    switch (this) {
      case AppThemeMode.light:
        return ThemeMode.light;
      case AppThemeMode.dark:
        return ThemeMode.dark;
      case AppThemeMode.system:
        return ThemeMode.system;
    }
  }

  static AppThemeMode fromName(String? name) =>
      AppThemeMode.values.firstWhere((e) => e.name == name, orElse: () => AppThemeMode.system);
}

/// Light, dark or follow the phone. Read synchronously from the preferences loaded in `main()`,
/// so the first frame already has the right theme (no light flash for dark-mode users).
class ThemeNotifier extends StateNotifier<AppThemeMode> {
  static const String _key = 'repsi_theme_mode';
  final SharedPreferences? _prefs;

  ThemeNotifier(this._prefs) : super(AppThemeMode.fromName(_prefs?.getString(_key)));

  Future<void> setTheme(AppThemeMode mode) async {
    state = mode;
    try {
      final prefs = _prefs ?? await SharedPreferences.getInstance();
      await prefs.setString(_key, mode.name);
    } catch (_) {}
  }

  Future<void> toggleTheme() async {
    await setTheme(state == AppThemeMode.dark ? AppThemeMode.light : AppThemeMode.dark);
  }
}

final themeNotifierProvider = StateNotifierProvider<ThemeNotifier, AppThemeMode>((ref) {
  return ThemeNotifier(ref.watch(sharedPreferencesProvider));
});
