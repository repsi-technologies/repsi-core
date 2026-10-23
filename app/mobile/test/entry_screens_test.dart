import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/api/api_client.dart';
import 'package:mobile/core/storage/secure_storage_service.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';
import 'package:mobile/features/auth/services/auth_service.dart';
import 'package:mobile/features/auth/views/login_view.dart';
import 'package:mobile/features/onboarding/views/onboarding_view.dart';
import 'package:mobile/features/splash/views/splash_view.dart';
import 'package:mobile/shared/widgets/repsi_white_logo.dart';

class _Auth extends AuthNotifier {
  _Auth(SecureStorageService storage, AuthState initial)
      : super(authService: AuthService(apiClient: ApiClient(storage: storage)), storage: storage) {
    state = initial;
  }

  @override
  Future<void> initSession() async {}
}

Widget _app(Widget home, {AuthState state = const AuthState(status: AuthStatus.unauthenticated)}) {
  FlutterSecureStorage.setMockInitialValues({});
  final storage = SecureStorageService();
  final router = GoRouter(routes: [
    GoRoute(path: '/', builder: (_, __) => home),
    GoRoute(path: '/auth/login', builder: (_, __) => const Scaffold(body: Text('login screen'))),
    GoRoute(path: '/onboarding', builder: (_, __) => const Scaffold(body: Text('onboarding screen'))),
  ]);
  return ProviderScope(
    overrides: [authProvider.overrideWith((ref) => _Auth(storage, state))],
    child: MaterialApp.router(routerConfig: router),
  );
}

void main() {
  testWidgets('splash shows the brand and sends a signed-out user to onboarding', (tester) async {
    await tester.pumpWidget(_app(const SplashView()));
    expect(find.byType(RepsiWhiteLogo), findsOneWidget);
    expect(find.byType(LinearProgressIndicator), findsOneWidget);

    await tester.pump(const Duration(milliseconds: 1300));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    expect(find.text('onboarding screen'), findsOneWidget);
  });

  testWidgets('splash waits while the session is still being restored', (tester) async {
    await tester.pumpWidget(_app(const SplashView(), state: const AuthState()));
    await tester.pump(const Duration(milliseconds: 2000));
    expect(find.byType(SplashView), findsOneWidget);
    // Dispose before the safety timer so no timer is left pending.
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('onboarding walks through three slides and ends at login', (tester) async {
    tester.view.physicalSize = const Size(360, 640); // small phone
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(_app(const OnboardingView()));
    expect(find.text('Next'), findsOneWidget);
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();
    expect(find.text('Get started'), findsOneWidget);
    expect(tester.takeException(), isNull);

    await tester.tap(find.text('Get started'));
    await tester.pumpAndSettle();
    expect(find.text('login screen'), findsOneWidget);
  });

  testWidgets('login shows the form, validates empty input and surfaces an expired session', (tester) async {
    tester.view.physicalSize = const Size(360, 700);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(_app(
      const LoginView(),
      state: const AuthState(status: AuthStatus.unauthenticated, errorMessage: 'Your session has expired. Please sign in again.'),
    ));
    await tester.pumpAndSettle();

    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Your session has expired. Please sign in again.'), findsWidgets);

    await tester.ensureVisible(find.text('Sign in →'));
    await tester.tap(find.text('Sign in →'));
    await tester.pump();
    expect(find.text('Email or mobile number is required'), findsOneWidget);
    expect(find.text('Password is required'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
