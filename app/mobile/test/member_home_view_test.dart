import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/api/api_client.dart';
import 'package:mobile/core/providers/storage_provider.dart';
import 'package:mobile/core/storage/secure_storage_service.dart';
import 'package:mobile/features/attendance/providers/attendance_provider.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';
import 'package:mobile/features/auth/services/auth_service.dart';
import 'package:mobile/features/coaching/data/coaching_api.dart';
import 'package:mobile/features/coaching/data/coaching_models.dart';
import 'package:mobile/features/health/data/health_data_source.dart';
import 'package:mobile/features/health/data/health_models.dart';
import 'package:mobile/features/health/data/health_repository.dart';
import 'package:mobile/features/health/providers/health_provider.dart';
import 'package:mobile/features/member/data/member_self_provider.dart';
import 'package:mobile/features/member/presentation/views/member_home_view.dart';
import 'package:mobile/shared/models/member_attendance_model.dart';
import 'package:mobile/shared/models/user_model.dart';

class _SignedInAuth extends AuthNotifier {
  _SignedInAuth(SecureStorageService storage)
      : super(authService: AuthService(apiClient: ApiClient(storage: storage)), storage: storage) {
    state = AuthState(
      status: AuthStatus.authenticated,
      token: 't',
      user: UserModel(id: 'u1', email: 'asha@example.com', fullName: 'Asha Menon', isSuperadmin: false, isActive: true, role: 'USER'),
    );
  }

  @override
  Future<void> initSession() async {}
}

class _Source implements HealthDataSource {
  final HealthAvailability status;
  final bool permitted;

  _Source(this.status, {this.permitted = false});

  @override
  Future<HealthAvailability> availability() async => status;
  @override
  Future<bool> hasPermission() async => permitted;
  @override
  Future<bool> requestPermission() async => true;
  @override
  Future<void> openInstall() async {}
  @override
  Future<void> revoke() async {}
  @override
  Future<List<DailyActivity>> readDays(int days) async => [];
}

class _Repo implements HealthRepository {
  final HealthSummary summaryValue;

  _Repo(this.summaryValue);

  @override
  Future<void> upload(List<DailyActivity> days) async {}
  @override
  Future<HealthSummary> summary({int days = 7}) async => summaryValue;
  @override
  Future<void> deleteAll() async {}
}

void main() {
  late SecureStorageService storage;

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    storage = SecureStorageService();
  });

  Future<void> pumpHome(
    WidgetTester tester, {
    required HealthDataSource source,
    HealthSummary summary = const HealthSummary(),
    Future<MemberAttendance>? attendance,
    Future<MemberSelf> Function()? profile,
    CoachingOverview coaching = const CoachingOverview(memberId: 'm1', trainers: [], requests: [], hasPendingRequest: false),
  }) async {
    tester.view.physicalSize = const Size(360, 800); // small Android phone
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(ProviderScope(
      overrides: [
        authProvider.overrideWith((ref) => _SignedInAuth(storage)),
        secureStorageServiceProvider.overrideWithValue(storage),
        healthDataSourceProvider.overrideWithValue(source),
        healthRepositoryProvider.overrideWithValue(_Repo(summary)),
        myAttendanceProvider.overrideWith((ref) => attendance ?? Future.value(const MemberAttendance(streakDays: 4, thisWeekVisits: 3, thisMonthVisits: 11))),
        coachingOverviewProvider.overrideWith((ref) => Future.value(coaching)),
        workoutSuggestionsProvider.overrideWith((ref) => Future.value(null)),
        memberSelfProvider.overrideWith(
          (ref) =>
              profile?.call() ??
              Future.value(MemberSelf(
                firstName: 'Asha',
                status: 'ACTIVE',
                membership: SelfMembership(planName: 'Gold Plan', endDate: DateTime.now().add(const Duration(days: 40)), status: 'ACTIVE'),
              )),
        ),
      ],
      child: const MaterialApp(home: MemberHomeView()),
    ));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
  }

  testWidgets('shows the signed-in member\'s real data, not placeholders', (tester) async {
    await pumpHome(tester, source: _Source(HealthAvailability.available));

    expect(find.textContaining('Asha'), findsWidgets);
    expect(find.text('Gold Plan'), findsOneWidget);
    expect(find.text('Active'), findsOneWidget);
    expect(find.text('11'), findsOneWidget); // visits this month
    expect(find.textContaining('Rahul'), findsNothing);
    expect(find.textContaining('8,426'), findsNothing);
    expect(find.text('Check in with QR'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('offers to connect Health Connect and never claims synced data before consent', (tester) async {
    await pumpHome(tester, source: _Source(HealthAvailability.available));

    expect(find.text('Connect Health Connect'), findsOneWidget);
    expect(find.text('Sync now'), findsNothing);
  });

  testWidgets('shows server-synced steps once connected', (tester) async {
    await storage.setHealthSyncEnabled(true);
    final today = DateTime.now();
    await pumpHome(
      tester,
      source: _Source(HealthAvailability.available, permitted: true),
      summary: HealthSummary(
        days: [DailyActivity(day: DateTime(today.year, today.month, today.day), steps: 6543, distanceMeters: 4200, activeCalories: 310)],
        todaySteps: 6543,
        averageSteps: 5000,
      ),
    );
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('6,543'), findsOneWidget);
    expect(find.text('4.2'), findsOneWidget);
    expect(find.text('Sync now'), findsOneWidget);
  });

  testWidgets('a failed profile load shows an error with retry instead of fake data', (tester) async {
    await pumpHome(
      tester,
      source: _Source(HealthAvailability.unsupported),
      profile: () => Future<MemberSelf>.error(Exception('boom')),
    );

    expect(find.text("Couldn't load your membership."), findsOneWidget);
    expect(find.text('Retry'), findsWidgets);
  });

  testWidgets('an expired membership is flagged', (tester) async {
    await pumpHome(
      tester,
      source: _Source(HealthAvailability.unsupported),
      profile: () => Future.value(MemberSelf(
        firstName: 'Asha',
        status: 'ACTIVE',
        membership: SelfMembership(planName: 'Monthly', endDate: DateTime.now().subtract(const Duration(days: 3)), status: 'ACTIVE'),
      )),
    );

    expect(find.text('Expired'), findsOneWidget);
  });
}
