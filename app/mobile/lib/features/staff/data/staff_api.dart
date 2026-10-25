import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_time.dart';
import '../../../core/providers/api_provider.dart';

/// Staff permissions (`/team/*`) and trainer shift attendance (`/staff-attendance/*`).
/// The API enforces every permission; the app only uses them to choose what to show.
class StaffApi {
  final ApiClient _api;
  StaffApi(this._api);

  Future<Set<String>> myPermissions() async {
    final res = await _api.get<Map<String, dynamic>>('/team/me/permissions');
    return ((res.data?['permissions'] as List?) ?? const []).map((e) => e.toString()).toSet();
  }

  Future<MyShift> myShift() async =>
      MyShift.fromJson((await _api.get<Map<String, dynamic>>('/staff-attendance/me')).data!);

  Future<void> checkIn() => _api.post<Map<String, dynamic>>('/attendance/check-in', data: {'method': 'manual'});

  Future<void> checkOut() => _api.post<Map<String, dynamic>>('/attendance/check-out', data: const {});

  Future<void> requestCorrection(String attendanceId, String reason, {DateTime? checkIn, DateTime? checkOut}) =>
      _api.post<Map<String, dynamic>>('/staff-attendance/correction-requests', data: {
        'attendance_id': attendanceId,
        'reason': reason,
        if (checkIn != null) 'check_in_time': checkIn.toUtc().toIso8601String(),
        if (checkOut != null) 'check_out_time': checkOut.toUtc().toIso8601String(),
      });

  Future<List<CorrectionRequest>> correctionRequests({String? status}) async {
    final res = await _api.get<List<dynamic>>('/staff-attendance/correction-requests',
        queryParameters: {if (status != null) 'status': status});
    return (res.data ?? const []).map((e) => CorrectionRequest.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  Future<void> resolveCorrection(String id, {required bool approve, String? note}) =>
      _api.post<Map<String, dynamic>>('/staff-attendance/correction-requests/$id/${approve ? 'approve' : 'reject'}',
          data: {if (note != null && note.isNotEmpty) 'note': note});

  Future<List<StaffHours>> report() async {
    final res = await _api.get<Map<String, dynamic>>('/staff-attendance/report');
    return ((res.data?['trainers'] as List?) ?? const [])
        .map((e) => StaffHours.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<List<TeamMember>> team() async {
    final res = await _api.get<List<dynamic>>('/team');
    return (res.data ?? const []).map((e) => TeamMember.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  Future<PermissionCatalog> catalog() async =>
      PermissionCatalog.fromJson((await _api.get<Map<String, dynamic>>('/team/permissions/catalog')).data!);

  Future<MemberPermissions> permissionsOf(String memberId) async =>
      MemberPermissions.fromJson((await _api.get<Map<String, dynamic>>('/team/$memberId/permissions')).data!);

  Future<MemberPermissions> savePermissions(String memberId, {Set<String>? effective, String? preset,
      required Set<String> roleDefaults}) async {
    final body = preset != null
        ? {'preset': preset}
        : {
            'grant': effective!.difference(roleDefaults).toList()..sort(),
            'revoke': roleDefaults.difference(effective).toList()..sort(),
          };
    return MemberPermissions.fromJson(
        (await _api.put<Map<String, dynamic>>('/team/$memberId/permissions', data: body)).data!);
  }
}

List<String> _strings(Object? v) => ((v as List?) ?? const []).map((e) => e.toString()).toList();

class ShiftRecord {
  final String id;
  final DateTime checkIn;
  final DateTime? checkOut;
  final int minutes;
  final bool corrected;
  const ShiftRecord({required this.id, required this.checkIn, this.checkOut, required this.minutes, required this.corrected});

  factory ShiftRecord.fromJson(Map<String, dynamic> j) => ShiftRecord(
        id: j['id'] as String,
        checkIn: (parseApiDateTime(j['check_in_time']) ?? DateTime.now()).toLocal(),
        checkOut: parseApiDateTime(j['check_out_time'])?.toLocal(),
        minutes: (j['minutes'] as num?)?.toInt() ?? 0,
        corrected: j['corrected'] as bool? ?? false,
      );
}

class CorrectionRequest {
  final String id;
  final String attendanceId;
  final String? trainerName;
  final String reason;
  final String status;
  final DateTime? requestedIn;
  final DateTime? requestedOut;
  final String? note;
  final DateTime? createdAt;
  const CorrectionRequest({required this.id, required this.attendanceId, this.trainerName, required this.reason,
      required this.status, this.requestedIn, this.requestedOut, this.note, this.createdAt});

  factory CorrectionRequest.fromJson(Map<String, dynamic> j) => CorrectionRequest(
        id: j['id'] as String,
        attendanceId: j['attendance_id'] as String? ?? '',
        trainerName: j['trainer_name'] as String?,
        reason: j['reason'] as String? ?? '',
        status: j['status'] as String? ?? 'pending',
        requestedIn: parseApiDateTime(j['requested_check_in_time'])?.toLocal(),
        requestedOut: parseApiDateTime(j['requested_check_out_time'])?.toLocal(),
        note: j['resolution_note'] as String?,
        createdAt: parseApiDateTime(j['created_at'])?.toLocal(),
      );
}

class MyShift {
  final ShiftRecord? active;
  final int weekMinutes;
  final int monthMinutes;
  final int monthDays;
  final List<ShiftRecord> records;
  final List<CorrectionRequest> requests;
  const MyShift({this.active, required this.weekMinutes, required this.monthMinutes, required this.monthDays,
      required this.records, required this.requests});

  factory MyShift.fromJson(Map<String, dynamic> j) => MyShift(
        active: j['active'] == null ? null : ShiftRecord.fromJson(Map<String, dynamic>.from(j['active'] as Map)),
        weekMinutes: (j['week_minutes'] as num?)?.toInt() ?? 0,
        monthMinutes: (j['month_minutes'] as num?)?.toInt() ?? 0,
        monthDays: (j['month_days'] as num?)?.toInt() ?? 0,
        records: ((j['records'] as List?) ?? const []).map((e) => ShiftRecord.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
        requests: ((j['correction_requests'] as List?) ?? const [])
            .map((e) => CorrectionRequest.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
      );
}

class StaffHours {
  final String trainerId;
  final String name;
  final int shifts;
  final int days;
  final int minutes;
  final bool checkedIn;
  final int pendingCorrections;
  const StaffHours({required this.trainerId, required this.name, required this.shifts, required this.days,
      required this.minutes, required this.checkedIn, required this.pendingCorrections});

  factory StaffHours.fromJson(Map<String, dynamic> j) => StaffHours(
        trainerId: j['trainer_id'] as String? ?? '',
        name: j['name'] as String? ?? '',
        shifts: (j['shifts'] as num?)?.toInt() ?? 0,
        days: (j['days'] as num?)?.toInt() ?? 0,
        minutes: (j['minutes'] as num?)?.toInt() ?? 0,
        checkedIn: j['checked_in'] as bool? ?? false,
        pendingCorrections: (j['pending_corrections'] as num?)?.toInt() ?? 0,
      );
}

class TeamMember {
  final String id;
  final String name;
  final String email;
  final String role;
  final bool isSelf;
  final bool isActive;
  const TeamMember({required this.id, required this.name, required this.email, required this.role, required this.isSelf,
      required this.isActive});

  factory TeamMember.fromJson(Map<String, dynamic> j) => TeamMember(
        id: j['id'] as String,
        name: j['full_name'] as String? ?? '',
        email: j['email'] as String? ?? '',
        role: (j['role'] as String? ?? '').split('.').last.toUpperCase(),
        isSelf: j['is_self'] as bool? ?? false,
        isActive: j['is_active'] as bool? ?? true,
      );
}

class PermissionPreset {
  final String key;
  final String label;
  final Set<String> permissions;
  const PermissionPreset({required this.key, required this.label, required this.permissions});
}

class PermissionCatalog {
  final Map<String, String> labels; // key -> English label from the API
  final List<PermissionPreset> trainerPresets;
  const PermissionCatalog({required this.labels, required this.trainerPresets});

  factory PermissionCatalog.fromJson(Map<String, dynamic> j) => PermissionCatalog(
        labels: {
          for (final p in (j['permissions'] as List? ?? const []))
            (p as Map)['key'] as String: p['label'] as String? ?? p['key'] as String,
        },
        trainerPresets: [
          for (final p in (j['trainer_presets'] as List? ?? const []))
            PermissionPreset(
                key: (p as Map)['key'] as String, label: p['label'] as String? ?? '', permissions: _strings(p['permissions']).toSet()),
        ],
      );
}

class MemberPermissions {
  final String role;
  final Set<String> roleDefaults;
  final Set<String> effective;
  final bool locked;
  const MemberPermissions({required this.role, required this.roleDefaults, required this.effective, required this.locked});

  factory MemberPermissions.fromJson(Map<String, dynamic> j) => MemberPermissions(
        role: j['role'] as String? ?? '',
        roleDefaults: _strings(j['role_defaults']).toSet(),
        effective: _strings(j['effective']).toSet(),
        locked: j['locked'] as bool? ?? false,
      );
}

final staffApiProvider = Provider<StaffApi>((ref) => StaffApi(ref.watch(apiClientProvider)));

/// What the signed-in user may do in this gym; empty on failure so UI fails closed.
final myPermissionsProvider = FutureProvider.autoDispose<Set<String>>(
    (ref) => ref.watch(staffApiProvider).myPermissions().catchError((_) => <String>{}));

final myShiftProvider = FutureProvider.autoDispose<MyShift>((ref) => ref.watch(staffApiProvider).myShift());
final staffReportProvider = FutureProvider.autoDispose<List<StaffHours>>((ref) => ref.watch(staffApiProvider).report());
final pendingCorrectionsProvider = FutureProvider.autoDispose<List<CorrectionRequest>>(
    (ref) => ref.watch(staffApiProvider).correctionRequests(status: 'pending'));
final teamProvider = FutureProvider.autoDispose<List<TeamMember>>((ref) => ref.watch(staffApiProvider).team());
final permissionCatalogProvider =
    FutureProvider.autoDispose<PermissionCatalog>((ref) => ref.watch(staffApiProvider).catalog());

String formatMinutes(int minutes) => '${minutes ~/ 60}h ${(minutes % 60).toString().padLeft(2, '0')}m';
