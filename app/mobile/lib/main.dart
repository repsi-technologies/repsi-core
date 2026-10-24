import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app/routes/app_router.dart';
import 'app/theme/app_theme.dart';
import 'app/theme/app_typography.dart';
import 'core/localization/locale_provider.dart';
import 'core/providers/session_reset.dart';
import 'core/providers/storage_provider.dart';
import 'core/providers/theme_provider.dart';
import 'features/auth/providers/auth_provider.dart';
import 'l10n/l10n.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load(fileName: 'assets/.env');
  } catch (e) {
    debugPrint('dotenv load skipped, using built-in defaults: $e');
  }
  final prefs = await SharedPreferences.getInstance();
  runApp(ProviderScope(
    overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
    child: const RepsiApp(),
  ));
}

class RepsiApp extends ConsumerWidget {
  const RepsiApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Signing out, expiring or switching accounts must not leak cached data to the next user.
    ref.listen(authProvider.select((s) => s.user?.id), (previous, next) {
      if (previous != null && previous != next) resetSessionProviders(ref);
    });
    final themeMode = ref.watch(themeNotifierProvider);
    // Changing the language rebuilds the whole tree in place: no restart needed.
    final language = ref.watch(localeNotifierProvider);
    final fallback = AppTypography.scriptFallback(language.code);
    return MaterialApp.router(
      title: 'REPSI',
      debugShowCheckedModeBanner: false,
      locale: language.locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: AppTypography.withScriptFallback(AppTheme.light(), fallback),
      darkTheme: AppTypography.withScriptFallback(AppTheme.dark(), fallback),
      themeMode: themeMode.toThemeMode(),
      routerConfig: ref.watch(appRouterProvider),
      builder: (context, child) => DefaultTextStyle.merge(
        style: TextStyle(fontFamilyFallback: fallback),
        child: child ?? const SizedBox.shrink(),
      ),
    );
  }
}

typedef MyApp = RepsiApp;
