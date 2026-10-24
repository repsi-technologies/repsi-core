import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/providers/api_provider.dart';
import '../../../shared/models/member_model.dart';
import 'member_provider.dart';
import '../../../core/api/api_time.dart';
import '../../../l10n/l10n.dart';

/// Everything on the staff member profile comes from these per-member requests. They are
/// auto-disposed families, so nothing outlives the screen or carries over between gyms.

final memberDetailProvider = FutureProvider.autoDispose.family<MemberModel, String>((ref, id) {
  return ref.watch(memberServiceProvider).getMemberById(id);
});

class MemberVisits {
  final int total;
  final int thisMonth;
  final int thisWeek;
  final int streakDays;
  final int averageMinutes;
  final DateTime? lastVisit;
  final bool insideNow;
  final List<VisitItem> recent;

  const MemberVisits({
    required this.total,
    required this.thisMonth,
    required this.thisWeek,
    required this.streakDays,
    required this.averageMinutes,
    required this.lastVisit,
    required this.insideNow,
    required this.recent,
  });
}

class VisitItem {
  final DateTime checkIn;
  final DateTime? checkOut;
  final String duration;
  final String method;

  const VisitItem({required this.checkIn, this.checkOut, required this.duration, required this.method});
}

DateTime? _date(Object? v) => parseApiDateTime(v);

final memberVisitsProvider = FutureProvider.autoDispose.family<MemberVisits, String>((ref, id) async {
  final res = await ref.watch(apiClientProvider).get('/attendance/member/$id');
  final j = res.data as Map<String, dynamic>;
  final recent = (j['recent_sessions'] as List<dynamic>? ?? const [])
      .whereType<Map<String, dynamic>>()
      .map((s) => VisitItem(
            checkIn: _date(s['check_in_time']) ?? DateTime.now(),
            checkOut: _date(s['check_out_time']),
            duration: s['duration_formatted']?.toString() ?? '',
            method: s['method']?.toString() ?? '',
          ))
      .toList();
  return MemberVisits(
    total: (j['total_visits'] as num?)?.toInt() ?? 0,
    thisMonth: (j['this_month_visits'] as num?)?.toInt() ?? 0,
    thisWeek: (j['this_week_visits'] as num?)?.toInt() ?? 0,
    streakDays: (j['current_streak_days'] as num?)?.toInt() ?? 0,
    averageMinutes: (j['average_duration_minutes'] as num?)?.toInt() ?? 0,
    lastVisit: _date(j['last_visit_time']),
    insideNow: j['is_currently_inside'] == true,
    recent: recent,
  );
});

class MemberPayment {
  final double amount;
  final String method;
  final String status;
  final DateTime paidAt;
  final String? receiptNumber;
  final String? notes;

  const MemberPayment({
    required this.amount,
    required this.method,
    required this.status,
    required this.paidAt,
    this.receiptNumber,
    this.notes,
  });
}

final memberPaymentsListProvider = FutureProvider.autoDispose.family<List<MemberPayment>, String>((ref, id) async {
  final res = await ref.watch(apiClientProvider).get('${ApiEndpoints.payments}/', queryParameters: {'member_id': id});
  return (res.data as List<dynamic>? ?? const [])
      .whereType<Map<String, dynamic>>()
      .map((p) => MemberPayment(
            amount: (p['amount'] as num?)?.toDouble() ?? 0,
            method: p['method']?.toString() ?? '',
            status: p['status']?.toString() ?? '',
            paidAt: _date(p['paid_at']) ?? DateTime.now(),
            receiptNumber: p['receipt_number']?.toString(),
            notes: p['notes']?.toString(),
          ))
      .toList();
});

class MemberHistoryEntry {
  final String source;
  final String eventType;
  final String? actorName;
  final String? reason;
  final DateTime? newEndDate;
  final DateTime createdAt;

  const MemberHistoryEntry({
    required this.source,
    required this.eventType,
    this.actorName,
    this.reason,
    this.newEndDate,
    required this.createdAt,
  });

  /// Plain-language label for the lifecycle event names the API records.
  String get label {
    final names = {
      'created': L10n.current.historyJoined,
      'assigned': L10n.current.historyStarted,
      'renewed': L10n.current.historyRenewed,
      'expired': L10n.current.historyExpired,
      'frozen': L10n.current.historyFrozen,
      'unfrozen': L10n.current.historyResumed,
      'freeze_cancelled': L10n.current.historyFreezeCancelled,
      'extended': L10n.current.historyExtended,
      'cancelled': L10n.current.historyCancelled,
      'status_changed': L10n.current.historyStatusChanged,
      'note_added': L10n.current.historyNoteAdded,
      'note_updated': L10n.current.historyNoteEdited,
      'note_deleted': L10n.current.historyNoteDeleted,
      'profile_updated': L10n.current.historyProfileUpdated,
    };
    return names[eventType] ?? eventType.replaceAll('_', ' ').replaceFirstMapped(RegExp(r'^.'), (m) => m[0]!.toUpperCase());
  }
}

final memberHistoryProvider = FutureProvider.autoDispose.family<List<MemberHistoryEntry>, String>((ref, id) async {
  final res = await ref.watch(apiClientProvider).get('${ApiEndpoints.members}/$id/history', queryParameters: {'limit': 100});
  return (res.data as List<dynamic>? ?? const [])
      .whereType<Map<String, dynamic>>()
      .map((e) => MemberHistoryEntry(
            source: e['source']?.toString() ?? 'member',
            eventType: e['event_type']?.toString() ?? '',
            actorName: e['actor_name']?.toString(),
            reason: e['reason']?.toString(),
            newEndDate: _date(e['new_end_date']),
            createdAt: _date(e['created_at']) ?? DateTime.now(),
          ))
      .toList();
});

class MemberNoteItem {
  final String body;
  final String? author;
  final DateTime createdAt;

  const MemberNoteItem({required this.body, this.author, required this.createdAt});
}

final memberNotesProvider = FutureProvider.autoDispose.family<List<MemberNoteItem>, String>((ref, id) async {
  final res = await ref.watch(apiClientProvider).get('${ApiEndpoints.members}/$id/notes');
  return (res.data as List<dynamic>? ?? const [])
      .whereType<Map<String, dynamic>>()
      .map((n) => MemberNoteItem(
            body: n['body']?.toString() ?? '',
            author: n['author_name']?.toString(),
            createdAt: _date(n['created_at']) ?? DateTime.now(),
          ))
      .toList();
});

class PlanOption {
  final String id;
  final String name;
  final double price;
  final int months;

  const PlanOption({required this.id, required this.name, required this.price, required this.months});
}

final membershipPlansProvider = FutureProvider.autoDispose<List<PlanOption>>((ref) async {
  final res = await ref.watch(apiClientProvider).get(ApiEndpoints.membershipPlans);
  return (res.data as List<dynamic>? ?? const [])
      .whereType<Map<String, dynamic>>()
      .where((p) => p['is_active'] != false)
      .map((p) => PlanOption(
            id: p['id'].toString(),
            name: p['name']?.toString() ?? L10n.current.plan,
            price: (p['price'] as num?)?.toDouble() ?? 0,
            months: (p['duration_months'] as num?)?.toInt() ?? 1,
          ))
      .toList();
});

/// Staff actions on a member. Each one refreshes the profile pieces it changes.
class MemberActions {
  final Ref _ref;
  MemberActions(this._ref);

  Future<void> renew(String memberId, String planId) async {
    await _ref.read(apiClientProvider).post('${ApiEndpoints.members}/$memberId/renew', data: {'plan_id': planId});
    _ref.invalidate(memberDetailProvider(memberId));
    _ref.invalidate(memberHistoryProvider(memberId));
    _ref.invalidate(memberPaymentsListProvider(memberId));
    _ref.read(memberListProvider.notifier).fetchMembers();
  }

  Future<void> recordPayment(String memberId, double amount, String method, {String? notes}) async {
    await _ref.read(apiClientProvider).post('${ApiEndpoints.payments}/', data: {
      'member_id': memberId,
      'amount': amount,
      'method': method,
      if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
    });
    _ref.invalidate(memberPaymentsListProvider(memberId));
  }

  Future<void> addNote(String memberId, String body) async {
    await _ref.read(apiClientProvider).post('${ApiEndpoints.members}/$memberId/notes', data: {'body': body.trim()});
    _ref.invalidate(memberNotesProvider(memberId));
    _ref.invalidate(memberHistoryProvider(memberId));
  }
}

final memberActionsProvider = Provider.autoDispose<MemberActions>((ref) => MemberActions(ref));
