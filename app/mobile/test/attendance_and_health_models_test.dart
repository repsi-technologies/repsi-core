import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/api/api_client.dart';
import 'package:mobile/core/api/api_error.dart';
import 'package:mobile/core/storage/secure_storage_service.dart';
import 'package:mobile/features/health/data/health_data_source.dart';
import 'package:mobile/features/health/data/health_models.dart';
import 'package:mobile/features/health/data/health_repository.dart';
import 'package:mobile/features/health/providers/health_provider.dart';
import 'package:mobile/shared/models/member_attendance_model.dart';

class _FakeSource implements HealthDataSource {
  HealthAvailability status = HealthAvailability.available;
  bool permitted = true;
  bool grant = true;
  int reads = 0;
  bool revoked = false;

  @override
  Future<HealthAvailability> availability() async => status;
  @override
  Future<bool> hasPermission() async => permitted;
  @override
  Future<bool> requestPermission() async => grant;
  @override
  Future<void> openInstall() async {}
  @override
  Future<void> revoke() async => revoked = true;
  @override
  Future<List<DailyActivity>> readDays(int days) async {
    reads++;
    return [DailyActivity(day: DateTime(2026, 10, 23), steps: 4321, distanceMeters: 3000, activeCalories: 210.55)];
  }
}

class _FakeRepo implements HealthRepository {
  final List<List<DailyActivity>> uploads = [];
  bool deleted = false;
  Object? failWith;

  @override
  Future<void> upload(List<DailyActivity> days) async {
    if (failWith != null) throw failWith!;
    uploads.add(days);
  }

  @override
  Future<HealthSummary> summary({int days = 7}) async => const HealthSummary(todaySteps: 4321, averageSteps: 4000);

  @override
  Future<void> deleteAll() async => deleted = true;
}

void main() {
  group('gymQrToken', () {
    test('extracts the rotating token from the entrance QR', () {
      expect(gymQrToken('repsi://gym/checkin?gym_id=g1&token=abc123&location_id=l1'), 'abc123');
    });

    test('rejects anything that is not a REPSI gym QR', () {
      expect(gymQrToken('https://evil.example/checkin?token=abc'), isNull);
      expect(gymQrToken('repsi://member/123'), isNull);
      expect(gymQrToken('repsi://gym/checkin'), isNull);
      expect(gymQrToken('repsi://gym/checkin?token='), isNull);
      expect(gymQrToken('random text'), isNull);
    });
  });

  test('MemberAttendance parses the backend payload', () {
    final a = MemberAttendance.fromJson({
      'total_visits': 20,
      'this_week_visits': 3,
      'this_month_visits': 11,
      'average_duration_minutes': 62,
      'current_streak_days': 4,
      'is_currently_inside': true,
      'last_visit_time': '2026-10-23T05:00:00',
      'active_session': {'id': 'v1', 'check_in_time': '2026-10-23T05:00:00', 'check_out_time': null, 'duration_formatted': '10m'},
      'recent_sessions': [
        {'id': 'v0', 'check_in_time': '2026-10-22T05:00:00', 'check_out_time': '2026-10-22T06:00:00', 'duration_formatted': '1h'},
      ],
    });
    expect(a.isInside, isTrue);
    expect(a.streakDays, 4);
    expect(a.recentVisits.single.isOpen, isFalse);
    expect(MemberAttendance.fromJson(const {}).isInside, isFalse);
  });

  test('DailyActivity serialises a local calendar day and rounds values', () {
    final json = DailyActivity(day: DateTime(2026, 1, 5), steps: 100, distanceMeters: 12.6, activeCalories: 3.456).toJson();
    expect(json['day'], '2026-01-05');
    expect(json['distance_meters'], 13);
    expect(json['active_calories'], 3.5);
  });

  test('HealthSummary reads a zone-less UTC timestamp as UTC', () {
    final naive = HealthSummary.fromJson({'last_synced_at': '2026-10-23T10:00:00.123456'});
    final zoned = HealthSummary.fromJson({'last_synced_at': '2026-10-23T10:00:00+00:00'});
    expect(naive.lastSyncedAt!.toUtc().hour, 10);
    expect(zoned.lastSyncedAt!.toUtc().hour, 10);
    expect(HealthSummary.fromJson(const {}).lastSyncedAt, isNull);
  });

  group('HealthNotifier', () {
    late _FakeSource source;
    late _FakeRepo repo;
    late SecureStorageService storage;
    late DateTime now;

    HealthNotifier build() =>
        HealthNotifier(source: source, repo: repo, storage: storage, now: () => now);

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      storage = SecureStorageService();
      source = _FakeSource();
      repo = _FakeRepo();
      now = DateTime(2026, 10, 23, 9);
    });

    test('connect asks permission, remembers consent and uploads the first sync', () async {
      final n = build();
      await n.connect();
      expect(n.state.connected, isTrue);
      expect(storage.isHealthSyncEnabled(), isTrue);
      expect(repo.uploads.single.single.steps, 4321);
      expect(n.state.summary.todaySteps, 4321);
    });

    test('a denied permission uploads nothing and explains why', () async {
      source.grant = false;
      final n = build();
      await n.connect();
      expect(n.state.connected, isFalse);
      expect(repo.uploads, isEmpty);
      expect(n.state.error, contains('Permission'));
    });

    test('load does not touch Health Connect until the member has consented', () async {
      final n = build();
      await n.load();
      expect(source.reads, 0);
      expect(n.state.connected, isFalse);
      expect(n.state.summary.todaySteps, 4321); // server copy still shown
    });

    test('routine syncs are throttled, a forced sync is not', () async {
      final n = build();
      await n.connect(); // forced first sync
      expect(source.reads, 1);
      await n.sync(); // inside the 15 minute gap
      expect(source.reads, 1);
      now = now.add(const Duration(minutes: 16));
      await n.sync();
      expect(source.reads, 2);
      await n.sync(force: true);
      expect(source.reads, 3);
    });

    test('an upload failure surfaces the server message and can be retried', () async {
      final n = build();
      await n.connect();
      repo.failWith = ApiError(message: 'Server busy', statusCode: 503);
      await n.sync(force: true);
      expect(n.state.error, 'Server busy');
      expect(n.state.syncing, isFalse);
      repo.failWith = null;
      await n.sync(force: true);
      expect(n.state.error, isNull);
    });

    test('disconnect erases server data, clears consent and revokes access', () async {
      final n = build();
      await n.connect();
      await n.disconnect();
      expect(repo.deleted, isTrue);
      expect(source.revoked, isTrue);
      expect(storage.isHealthSyncEnabled(), isFalse);
      expect(n.state.connected, isFalse);
    });
  });

  test('ApiClient is constructible without a session callback', () {
    FlutterSecureStorage.setMockInitialValues({});
    expect(ApiClient(storage: SecureStorageService()).dio.options.connectTimeout, isNotNull);
  });
}
