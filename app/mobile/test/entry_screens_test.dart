import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/api/api_client.dart';
import 'package:mobile/core/api/api_error.dart';
import 'package:mobile/core/storage/secure_storage_service.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';
import 'package:mobile/features/auth/services/auth_service.dart';
import 'package:mobile/features/auth/views/complete_profile_view.dart';
import 'package:mobile/features/auth/views/login_view.dart';
import 'package:mobile/features/auth/views/verify_otp_view.dart';
import 'package:mobile/features/onboarding/views/onboarding_view.dart';
import 'package:mobile/features/splash/views/splash_view.dart';
import 'package:mobile/shared/widgets/repsi_white_logo.dart';

/// Records phone sign-in calls instead of reaching the network.
class _FakeAuthService extends AuthService {
  _FakeAuthService(SecureStorageService storage) : super(apiClient: ApiClient(storage: storage));

  final requested = <String>[];
  String? lastCountry;
  String? lastPurpose;
  String? verifiedCode;
  bool rejectCode = false;
  bool rejectPhoneNotFound = false;

  @override
  Future<PhoneOtpChallenge> requestPhoneOtp({
    required String phone,
    String country = 'IN',
    String purpose = 'auth',
  }) async {
    requested.add(phone);
    lastCountry = country;
    lastPurpose = purpose;
    if (rejectPhoneNotFound) {
      throw ApiError(
        statusCode: 404,
        message: 'Phone number not found. Please check your number or sign up.',
      );
    }
    return PhoneOtpChallenge(phone: '+$country$phone', expiresIn: 600, resendIn: 30);
  }

  @override
  Future<PhoneVerification> verifyPhoneOtp({required String phone, required String code, String country = 'IN'}) async {
    verifiedCode = code;
    if (rejectCode) throw ApiError(message: 'That code is incorrect. Check WhatsApp and try again.');
    return const PhoneVerification(registrationToken: 'reg-token');
  }
}

class _Auth extends AuthNotifier {
  _Auth(AuthService service, SecureStorageService storage, AuthState initial)
      : super(authService: service, storage: storage) {
    state = initial;
  }

  @override
  Future<void> initSession() async {}
}

Widget _app(Widget home, {AuthState state = const AuthState(status: AuthStatus.unauthenticated), _FakeAuthService? service}) {
  FlutterSecureStorage.setMockInitialValues({});
  final storage = SecureStorageService();
  final auth = service ?? _FakeAuthService(storage);
  final router = GoRouter(routes: [
    GoRoute(path: '/', builder: (_, __) => home),
    GoRoute(path: '/auth/login', builder: (_, __) => const Scaffold(body: Text('login screen'))),
    GoRoute(path: '/onboarding', builder: (_, __) => const Scaffold(body: Text('onboarding screen'))),
    GoRoute(path: '/auth/forgot-password', builder: (_, __) => const Scaffold(body: Text('forgot screen'))),
    GoRoute(path: '/auth/verify-otp', builder: (_, s) => VerifyOtpView(args: s.extra! as VerifyOtpArgs)),
    GoRoute(path: '/auth/complete-profile', builder: (_, s) => CompleteProfileView(args: s.extra! as CompleteProfileArgs)),
  ]);
  return ProviderScope(
    overrides: [
      authServiceProvider.overrideWithValue(auth),
      authProvider.overrideWith((ref) => _Auth(auth, storage, state)),
    ],
    child: MaterialApp.router(routerConfig: router),
  );
}

void _phone(WidgetTester tester, Size size) {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
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
    _phone(tester, const Size(360, 640)); // small phone

    await tester.pumpWidget(_app(const OnboardingView()));
    expect(find.byTooltip('Next'), findsOneWidget);
    expect(find.byTooltip('Back'), findsNothing);
    await tester.tap(find.byTooltip('Next'));
    await tester.pumpAndSettle();
    expect(find.byTooltip('Back'), findsOneWidget);
    await tester.tap(find.byTooltip('Next'));
    await tester.pumpAndSettle();
    expect(find.text('Get started'), findsOneWidget);
    expect(find.text('Skip'), findsNothing);
    expect(tester.takeException(), isNull);

    await tester.tap(find.text('Get started'));
    await tester.pumpAndSettle();
    expect(find.text('login screen'), findsOneWidget);
  });

  testWidgets('onboarding fits a short screen with large text', (tester) async {
    _phone(tester, const Size(320, 568));
    tester.platformDispatcher.textScaleFactorTestValue = 1.3;
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);

    await tester.pumpWidget(_app(const OnboardingView()));
    for (var i = 0; i < 2; i++) {
      await tester.tap(find.byTooltip('Next'));
      await tester.pumpAndSettle();
    }
    expect(tester.takeException(), isNull);
  });

  testWidgets('login validates the mobile number and sends a WhatsApp code', (tester) async {
    _phone(tester, const Size(360, 700));
    FlutterSecureStorage.setMockInitialValues({});
    final service = _FakeAuthService(SecureStorageService());

    await tester.pumpWidget(_app(const LoginView(), service: service));
    await tester.pumpAndSettle();
    expect(find.text("Let's get started"), findsOneWidget);

    await tester.tap(find.text('Send code on WhatsApp'));
    await tester.pump();
    expect(find.text('Enter your mobile number'), findsOneWidget);

    await tester.enterText(find.byType(TextFormField), '12345');
    await tester.tap(find.text('Send code on WhatsApp'));
    await tester.pump();
    expect(find.text('Enter a valid 10-digit mobile number'), findsOneWidget);
    expect(service.requested, isEmpty);

    await tester.enterText(find.byType(TextFormField), '9876543210');
    await tester.tap(find.text('Send code on WhatsApp'));
    await tester.pumpAndSettle();
    expect(service.requested, ['9876543210']);
    expect(find.text('Verify your number'), findsOneWidget);
    expect(find.textContaining('+91 98765 43210'), findsOneWidget);
    expect(tester.takeException(), isNull);
    // The verify screen's resend countdown is cancelled with it.
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('a wrong code is reported and cleared; a new number continues to profile setup', (tester) async {
    _phone(tester, const Size(360, 740));
    FlutterSecureStorage.setMockInitialValues({});
    final service = _FakeAuthService(SecureStorageService())..rejectCode = true;
    await tester.pumpWidget(_app(
      const VerifyOtpView(
        args: VerifyOtpArgs(
          challenge: PhoneOtpChallenge(phone: '+919876543210', expiresIn: 600, resendIn: 30),
          nationalNumber: '9876543210',
        ),
      ),
      service: service,
    ));
    await tester.pump();
    expect(find.text('Resend in 00:30'), findsOneWidget);

    await tester.enterText(find.byType(TextField), '111111');
    await tester.pump();
    await tester.pump();
    expect(service.verifiedCode, '111111');
    expect(find.text('That code is incorrect. Check WhatsApp and try again.'), findsOneWidget);

    service.rejectCode = false;
    await tester.enterText(find.byType(TextField), '123456');
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));
    expect(find.text('Almost there!'), findsOneWidget);
    expect(find.text('Add a profile photo (optional)'), findsOneWidget);

    await tester.ensureVisible(find.text('Continue'));
    await tester.tap(find.text('Continue'));
    await tester.pump();
    expect(find.text('Enter your full name'), findsOneWidget);
    expect(find.text('Enter a valid email address'), findsOneWidget);
    expect(find.text('Use at least 8 characters'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('email sign-in validates and surfaces an expired session', (tester) async {
    _phone(tester, const Size(360, 760));

    await tester.pumpWidget(_app(
      const LoginView(),
      state: const AuthState(status: AuthStatus.unauthenticated, errorMessage: 'Your session has expired. Please sign in again.'),
    ));
    await tester.pumpAndSettle();
    expect(find.text('Your session has expired. Please sign in again.'), findsWidgets);

    await tester.ensureVisible(find.text('Sign in with email and password'));
    await tester.tap(find.text('Sign in with email and password'));
    await tester.pumpAndSettle();
    expect(find.text('Welcome back'), findsOneWidget);

    await tester.ensureVisible(find.text('Sign in'));
    await tester.tap(find.text('Sign in'));
    await tester.pump();
    expect(find.text('Email or mobile number is required'), findsOneWidget);
    expect(find.text('Password is required'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('login rejects unregistered phone number before OTP and does not enter verify screen', (tester) async {
    _phone(tester, const Size(360, 700));
    FlutterSecureStorage.setMockInitialValues({});
    final service = _FakeAuthService(SecureStorageService())..rejectPhoneNotFound = true;

    await tester.pumpWidget(_app(const LoginView(), service: service));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextFormField), '9876543210');
    await tester.tap(find.text('Send code on WhatsApp'));
    await tester.pumpAndSettle();

    expect(service.requested, ['9876543210']);
    expect(service.lastPurpose, 'login');
    // Does NOT navigate to verify screen
    expect(find.text('Verify your number'), findsNothing);
    // Shows the error message directly on the login screen
    expect(find.text('Phone number not found. Please check your number or sign up.'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('login allows changing country code and updates length validation', (tester) async {
    _phone(tester, const Size(360, 700));
    FlutterSecureStorage.setMockInitialValues({});
    final service = _FakeAuthService(SecureStorageService());

    await tester.pumpWidget(_app(const LoginView(), service: service));
    await tester.pumpAndSettle();

    // Tap country dial code picker (+91)
    expect(find.text('+91'), findsOneWidget);
    await tester.tap(find.text('+91'));
    await tester.pumpAndSettle();

    // Country picker bottom sheet opens
    expect(find.text('Select Country Code'), findsOneWidget);
    expect(find.text('United Arab Emirates'), findsOneWidget);

    // Select UAE
    await tester.tap(find.text('United Arab Emirates'));
    await tester.pumpAndSettle();

    // Country picker closed, dial code is now +971
    expect(find.text('+971'), findsOneWidget);

    // Enter a 9-digit UAE number
    await tester.enterText(find.byType(TextFormField), '501234567');
    await tester.tap(find.text('Send code on WhatsApp'));
    await tester.pumpAndSettle();

    expect(service.requested, ['501234567']);
    expect(service.lastCountry, 'AE');
    expect(service.lastPurpose, 'login');
    expect(find.text('Verify your number'), findsOneWidget);
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox());
  });
}
