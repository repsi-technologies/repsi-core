import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app/routes/app_router.dart';
import 'app/theme/app_theme.dart';
import 'core/providers/session_reset.dart';
import 'core/providers/storage_provider.dart';
import 'features/auth/providers/auth_provider.dart';

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
    return MaterialApp.router(
      title: 'REPSI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.light,
      routerConfig: ref.watch(appRouterProvider),
    );
  }
}

typedef MyApp = RepsiApp;
