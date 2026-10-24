import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/api_provider.dart';
import '../../../core/api/api_time.dart';

/// Front-desk data for the Operations tab. All auto-disposed families/providers, so nothing
/// outlives the screen or the signed-in gym.

DateTime? _dt(Object? v) => parseApiDateTime(v);

class AttendanceToday {
  final int total;
  final int inside;
  final int checkedOut;
  final String peakHour;
  final int averageMinutes;

  const AttendanceToday({
    required this.total,
    required this.inside,
    required this.checkedOut,
    required this.peakHour,
    required this.averageMinutes,
  });
}

final attendanceTodayProvider = FutureProvider.autoDispose<AttendanceToday>((ref) async {
  final j = (await ref.watch(apiClientProvider).get('/attendance/summary')).data as Map<String, dynamic>;
  return AttendanceToday(
    total: (j['today_total'] as num?)?.toInt() ?? 0,
    inside: (j['currently_inside'] as num?)?.toInt() ?? 0,
    checkedOut: (j['total_checked_out'] as num?)?.toInt() ?? 0,
    peakHour: j['peak_hour']?.toString() ?? '—',
    averageMinutes: (j['average_dwell_minutes'] as num?)?.toInt() ?? 0,
  );
});

class InsidePerson {
  final String attendanceId;
  final String? memberId;
  final String name;
  final String? avatarUrl;
  final String? planName;
  final String duration;
  final DateTime checkIn;

  const InsidePerson({
    required this.attendanceId,
    this.memberId,
    required this.name,
    this.avatarUrl,
    this.planName,
    required this.duration,
    required this.checkIn,
  });
}

final insideListProvider = FutureProvider.autoDispose<List<InsidePerson>>((ref) async {
  final list = (await ref.watch(apiClientProvider).get('/attendance/currently-inside')).data as List<dynamic>? ?? const [];
  return list
      .whereType<Map<String, dynamic>>()
      .map((j) => InsidePerson(
            attendanceId: j['attendance_id'].toString(),
            memberId: j['member_id']?.toString(),
            name: j['name']?.toString() ?? 'Member',
            avatarUrl: j['avatar_url']?.toString(),
            planName: j['plan_name']?.toString(),
            duration: j['duration_formatted']?.toString() ?? '',
            checkIn: _dt(j['check_in_time']) ?? DateTime.now(),
          ))
      .toList();
});

class LeadItem {
  final String id;
  final String name;
  final String phone;
  final String source;
  final String status;
  final String priority;
  final String? interest;
  final DateTime? nextFollowUp;

  const LeadItem({
    required this.id,
    required this.name,
    required this.phone,
    required this.source,
    required this.status,
    required this.priority,
    this.interest,
    this.nextFollowUp,
  });
}

const leadStages = [
  ('', 'All'),
  ('new', 'New'),
  ('contacted', 'Contacted'),
  ('visit_scheduled', 'Visit booked'),
  ('trial', 'Trial'),
  ('negotiation', 'Negotiating'),
  ('converted', 'Joined'),
  ('lost', 'Lost'),
];

String leadStageLabel(String status) => leadStages.firstWhere((s) => s.$1 == status, orElse: () => (status, status)).$2;

final leadsProvider = FutureProvider.autoDispose.family<List<LeadItem>, String>((ref, status) async {
  final res = await ref.watch(apiClientProvider).get('/crm/leads', queryParameters: {
    'page_size': 100,
    if (status.isNotEmpty) 'status': status,
  });
  final items = (res.data as Map<String, dynamic>)['items'] as List<dynamic>? ?? const [];
  return items
      .whereType<Map<String, dynamic>>()
      .map((j) => LeadItem(
            id: j['id'].toString(),
            name: '${j['first_name'] ?? ''} ${j['last_name'] ?? ''}'.trim(),
            phone: j['phone']?.toString() ?? '',
            source: j['source']?.toString() ?? '',
            status: j['status']?.toString() ?? 'new',
            priority: j['priority']?.toString() ?? 'medium',
            interest: (j['interested_plan'] ?? j['interested_service'])?.toString(),
            nextFollowUp: _dt(j['next_follow_up_at']),
          ))
      .toList();
});

class GymQr {
  final String payload;
  final String label;
  final DateTime? expiresAt;

  const GymQr({required this.payload, required this.label, this.expiresAt});
}

final gymQrProvider = FutureProvider.autoDispose<GymQr>((ref) async {
  final j = (await ref.watch(apiClientProvider).get('/attendance/qr')).data as Map<String, dynamic>;
  return GymQr(payload: j['payload']?.toString() ?? '', label: j['label']?.toString() ?? 'Gym check-in', expiresAt: _dt(j['expires_at']));
});

class TeamPerson {
  final String name;
  final String email;
  final String role;
  final bool active;
  final bool isSelf;

  const TeamPerson({required this.name, required this.email, required this.role, required this.active, required this.isSelf});
}

final teamProvider = FutureProvider.autoDispose<List<TeamPerson>>((ref) async {
  final list = (await ref.watch(apiClientProvider).get('/team')).data as List<dynamic>? ?? const [];
  return list
      .whereType<Map<String, dynamic>>()
      .map((j) => TeamPerson(
            name: j['full_name']?.toString() ?? '',
            email: j['email']?.toString() ?? '',
            role: j['role']?.toString() ?? '',
            active: j['is_active'] != false,
            isSelf: j['is_self'] == true,
          ))
      .toList();
});

class FrontDeskActions {
  final Ref _ref;
  FrontDeskActions(this._ref);

  void _refresh() {
    _ref.invalidate(insideListProvider);
    _ref.invalidate(attendanceTodayProvider);
  }

  Future<void> checkIn(String memberId) async {
    await _ref.read(apiClientProvider).post('/attendance/check-in', data: {'member_id': memberId, 'method': 'manual'});
    _refresh();
  }

  Future<void> checkOut(String attendanceId) async {
    await _ref.read(apiClientProvider).post('/attendance/check-out', data: {'attendance_id': attendanceId, 'checkout_type': 'STAFF'});
    _refresh();
  }

  Future<void> addLead({required String name, required String phone, required String source, String? interest}) async {
    await _ref.read(apiClientProvider).post('/crm/leads', data: {
      'full_name': name.trim(),
      'phone': phone.trim(),
      'source': source,
      if (interest != null && interest.trim().isNotEmpty) 'interested_plan': interest.trim(),
    });
    for (final s in leadStages) {
      _ref.invalidate(leadsProvider(s.$1));
    }
  }
}

final frontDeskActionsProvider = Provider.autoDispose<FrontDeskActions>((ref) => FrontDeskActions(ref));
