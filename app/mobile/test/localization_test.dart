import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart' show setEquals;
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/core/api/api_client.dart';
import 'package:mobile/core/localization/app_locale.dart';
import 'package:mobile/core/localization/locale_provider.dart';
import 'package:mobile/core/providers/storage_provider.dart';
import 'package:mobile/core/storage/secure_storage_service.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';
import 'package:mobile/features/auth/services/auth_service.dart';
import 'package:mobile/features/auth/views/login_view.dart';
import 'package:mobile/features/member/presentation/views/member_membership_view.dart';
import 'package:mobile/features/member/presentation/views/progress_dashboard_view.dart';
import 'package:mobile/features/member/presentation/views/running_tracker_view.dart';
import 'package:mobile/features/member/presentation/views/workout_dashboard_view.dart';
import 'package:mobile/features/onboarding/views/onboarding_view.dart';
import 'package:mobile/l10n/l10n.dart';
import 'package:mobile/shared/widgets/language_selector_sheet.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Unicode blocks per language. A translation may also use Latin (brand names, units, codes).
final _ownScript = {
  'ta': RegExp(r'[஀-௿]'),
  'ml': RegExp(r'[ഀ-ൿ]'),
  'hi': RegExp(r'[ऀ-ॿ]'),
};

Map<String, dynamic> _arb(String code) =>
    jsonDecode(File('lib/l10n/app_$code.arb').readAsStringSync()) as Map<String, dynamic>;

Set<String> _placeholders(String text) =>
    RegExp(r'\{(\w+)(?:,|\})').allMatches(text).map((m) => m.group(1)!).toSet();

class _Auth extends AuthNotifier {
  _Auth(AuthService service, SecureStorageService storage) : super(authService: service, storage: storage) {
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  @override
  Future<void> initSession() async {}
}

List<Override> _overrides(SharedPreferences prefs, {List<Locale> device = const [Locale('en', 'US')]}) {
  FlutterSecureStorage.setMockInitialValues({});
  final storage = SecureStorageService(prefs: prefs);
  final service = AuthService(apiClient: ApiClient(storage: storage));
  return [
    sharedPreferencesProvider.overrideWithValue(prefs),
    authServiceProvider.overrideWithValue(service),
    authProvider.overrideWith((ref) => _Auth(service, storage)),
    localeNotifierProvider.overrideWith((ref) => LocaleNotifier(ref, deviceLocales: () => device)),
  ];
}

/// Mirrors RepsiApp's localization wiring around any screen.
class _Localized extends ConsumerStatefulWidget {
  final Widget home;
  const _Localized(this.home);

  @override
  ConsumerState<_Localized> createState() => _LocalizedState();
}

class _LocalizedState extends ConsumerState<_Localized> {
  late final router = GoRouter(routes: [
    GoRoute(path: '/', builder: (_, __) => widget.home),
    GoRoute(path: '/auth/login', builder: (_, __) => const LoginView()),
    GoRoute(path: '/auth/forgot-password', builder: (_, __) => const Scaffold()),
  ]);

  @override
  Widget build(BuildContext context) {
    final language = ref.watch(localeNotifierProvider);
    return MaterialApp.router(
      locale: language.locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: router,
    );
  }
}

void main() {
  // Fonts come from the network in the app; tests render with the fallback font instead.
  GoogleFonts.config.allowRuntimeFetching = false;

  group('ARB catalogues', () {
    final en = _arb('en');
    final keys = en.keys.where((k) => !k.startsWith('@')).toList();

    test('the app supports exactly English, Tamil, Malayalam and Hindi, English and Tamil first', () {
      expect(AppLanguage.values.map((l) => l.code), ['en', 'ta', 'ml', 'hi']);
      expect(AppLocalizations.supportedLocales.map((l) => l.languageCode).toSet(), {'en', 'ta', 'ml', 'hi'});
      expect(AppLanguage.ta.nativeName, 'தமிழ்');
      expect(AppLanguage.ml.nativeName, 'മലയാളം');
      expect(AppLanguage.hi.nativeName, 'हिन्दी');
    });

    for (final code in ['ta', 'ml', 'hi']) {
      test('$code has every key, no extras, matching placeholders and its own script', () {
        final arb = _arb(code);
        final missing = keys.where((k) => !arb.containsKey(k)).toList();
        final extra = arb.keys.where((k) => !k.startsWith('@') && !en.containsKey(k)).toList();
        final empty = keys.where((k) => (arb[k] as String? ?? '').trim().isEmpty).toList();
        final badParams = keys.where((k) => arb.containsKey(k) && !setEquals(_placeholders(en[k] as String), _placeholders(arb[k] as String))).toList();
        final otherScripts = _ownScript.entries.where((e) => e.key != code).map((e) => e.value).toList();
        final mixed = keys.where((k) => otherScripts.any((r) => r.hasMatch(arb[k] as String? ?? ''))).toList();
        expect(missing, isEmpty, reason: '$code is missing keys');
        expect(extra, isEmpty, reason: '$code has keys English does not');
        expect(empty, isEmpty, reason: '$code has empty values');
        expect(badParams, isEmpty, reason: '$code placeholders differ from English');
        expect(mixed, isEmpty, reason: '$code values contain another Indic script');
      });

      test('$code is actually translated, not copied from English', () {
        final arb = _arb(code);
        final translated = keys.where((k) => _ownScript[code]!.hasMatch(arb[k] as String)).length;
        expect(translated / keys.length, greaterThan(0.9), reason: 'most $code strings should be in its own script');
      });
    }

    test('plurals and parameters format in every language', () {
      for (final code in ['en', 'ta', 'ml', 'hi']) {
        final l = lookupAppLocalizations(Locale(code));
        expect(l.commonMonths(1), isNot(l.commonMonths(3)));
        expect(l.commonMonths(3), contains('3'));
        expect(l.searchNoResults('Asha'), contains('Asha'));
      }
    });
  });

  group('language preference', () {
    testWidgets('device locale is used when nothing was chosen, unsupported devices fall back to English', (tester) async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final tamilPhone = ProviderContainer(overrides: _overrides(prefs, device: const [Locale('ta', 'IN')]));
      addTearDown(tamilPhone.dispose);
      expect(tamilPhone.read(localeNotifierProvider), AppLanguage.ta);
      expect(tamilPhone.read(localeNotifierProvider.notifier).isExplicit, isFalse);

      final frenchPhone = ProviderContainer(overrides: _overrides(prefs, device: const [Locale('fr', 'FR')]));
      addTearDown(frenchPhone.dispose);
      expect(frenchPhone.read(localeNotifierProvider), AppLanguage.en);
    });

    testWidgets('an explicit choice beats the device locale and survives restart and sign-out', (tester) async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final first = ProviderContainer(overrides: _overrides(prefs, device: const [Locale('hi', 'IN')]));
      expect(first.read(localeNotifierProvider), AppLanguage.hi);
      await first.read(localeNotifierProvider.notifier).setLanguage(AppLanguage.ml);
      expect(first.read(localeNotifierProvider), AppLanguage.ml);
      expect(L10n.current.localeName, 'ml');

      // Sign-out clears the session, not the language.
      await SecureStorageService(prefs: prefs).clearAll();
      first.dispose();

      final restarted = ProviderContainer(overrides: _overrides(prefs, device: const [Locale('hi', 'IN')]));
      addTearDown(restarted.dispose);
      expect(restarted.read(localeNotifierProvider), AppLanguage.ml);
      expect(restarted.read(localeNotifierProvider.notifier).isExplicit, isTrue);
      await restarted.read(localeNotifierProvider.notifier).setLanguage(AppLanguage.en);
    });

    testWidgets('switching language updates the screen immediately', (tester) async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      await tester.pumpWidget(ProviderScope(overrides: _overrides(prefs), child: const _Localized(LoginView())));
      await tester.pumpAndSettle();
      expect(find.text('Send code on WhatsApp'), findsOneWidget);

      final container = ProviderScope.containerOf(tester.element(find.byType(LoginView)));
      await container.read(localeNotifierProvider.notifier).setLanguage(AppLanguage.ta);
      await tester.pumpAndSettle();
      expect(find.text('WhatsApp-இல் குறியீட்டை அனுப்பு'), findsOneWidget);
      expect(find.text('Send code on WhatsApp'), findsNothing);

      await container.read(localeNotifierProvider.notifier).setLanguage(AppLanguage.en);
      await tester.pumpAndSettle();
    });
  });

  group('layout with long translations', () {
    for (final lang in AppLanguage.values) {
      for (final size in const [Size(320, 640), Size(412, 915)]) {
        testWidgets('${lang.code} at ${size.width.toInt()}px: sign-in, onboarding and the language sheet do not overflow', (tester) async {
          tester.view.physicalSize = size;
          tester.view.devicePixelRatio = 1;
          addTearDown(tester.view.reset);
          SharedPreferences.setMockInitialValues({LocaleNotifier.storageKey: lang.code});
          final prefs = await SharedPreferences.getInstance();

          for (final screen in const [
            LoginView(),
            OnboardingView(),
            MemberMembershipView(),
            WorkoutDashboardView(),
            RunningTrackerView(),
            ProgressDashboardView(),
          ]) {
            await tester.pumpWidget(ProviderScope(overrides: _overrides(prefs), child: _Localized(screen)));
            await tester.pumpAndSettle();
            expect(tester.takeException(), isNull, reason: '${screen.runtimeType} in ${lang.code}');
          }

          await tester.tap(find.byType(LanguageButton).first);
          await tester.pumpAndSettle();
          expect(find.byType(LanguageSelectorSheet), findsOneWidget);
          for (final l in AppLanguage.values) {
            expect(find.text(l.nativeName), findsWidgets);
          }
          expect(tester.takeException(), isNull, reason: 'language sheet in ${lang.code}');
          await tester.pumpWidget(const SizedBox());
        });
      }
    }
  });
}
