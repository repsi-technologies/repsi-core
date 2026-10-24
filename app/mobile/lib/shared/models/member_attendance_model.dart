import '../../core/api/api_time.dart';
/// One gym visit as returned by `/attendance/member/me` (`AttendanceResponse`).
class VisitModel {
  final String id;
  final DateTime checkInTime;
  final DateTime? checkOutTime;
  final String durationLabel;

  const VisitModel({
    required this.id,
    required this.checkInTime,
    this.checkOutTime,
    this.durationLabel = '',
  });

  bool get isOpen => checkOutTime == null;

  factory VisitModel.fromJson(Map<String, dynamic> json) {
    return VisitModel(
      id: json['id']?.toString() ?? '',
      checkInTime: parseApiDateTime(json['check_in_time'])!,
      checkOutTime: json['check_out_time'] == null
          ? null
          : parseApiDateTime(json['check_out_time']),
      durationLabel: json['duration_formatted']?.toString() ?? '',
    );
  }
}

/// The signed-in member's own attendance profile (`MemberPersonalAttendanceResponse`).
class MemberAttendance {
  final int totalVisits;
  final int thisWeekVisits;
  final int thisMonthVisits;
  final int averageDurationMinutes;
  final int streakDays;
  final DateTime? lastVisit;
  final VisitModel? activeVisit;
  final List<VisitModel> recentVisits;

  const MemberAttendance({
    this.totalVisits = 0,
    this.thisWeekVisits = 0,
    this.thisMonthVisits = 0,
    this.averageDurationMinutes = 0,
    this.streakDays = 0,
    this.lastVisit,
    this.activeVisit,
    this.recentVisits = const [],
  });

  bool get isInside => activeVisit != null;

  factory MemberAttendance.fromJson(Map<String, dynamic> json) {
    final active = json['active_session'];
    return MemberAttendance(
      totalVisits: _int(json['total_visits']),
      thisWeekVisits: _int(json['this_week_visits']),
      thisMonthVisits: _int(json['this_month_visits']),
      averageDurationMinutes: _int(json['average_duration_minutes']),
      streakDays: _int(json['current_streak_days']),
      lastVisit: json['last_visit_time'] == null
          ? null
          : parseApiDateTime(json['last_visit_time']),
      activeVisit:
          active is Map<String, dynamic> ? VisitModel.fromJson(active) : null,
      recentVisits: [
        for (final item in (json['recent_sessions'] as List? ?? const []))
          if (item is Map<String, dynamic>) VisitModel.fromJson(item),
      ],
    );
  }

  static int _int(Object? v) => v is num ? v.toInt() : int.tryParse('$v') ?? 0;
}

/// Short-lived signed pass the front desk scans (`/attendance/member/me/pass`).
class MemberPass {
  final String token;
  final DateTime expiresAt;

  const MemberPass({required this.token, required this.expiresAt});

  factory MemberPass.fromJson(Map<String, dynamic> json) {
    return MemberPass(
      token: json['token'].toString(),
      expiresAt: DateTime.fromMillisecondsSinceEpoch(
          (json['expires_at'] as num).toInt() * 1000),
    );
  }
}

/// Reads the rotating gym token out of what the entrance QR encodes
/// (`repsi://gym/checkin?gym_id=…&token=…`). Returns null for anything else, so a random QR
/// code is rejected on the phone instead of being sent to the server.
String? gymQrToken(String raw) {
  final uri = Uri.tryParse(raw.trim());
  if (uri == null ||
      uri.scheme != 'repsi' ||
      uri.host != 'gym' ||
      uri.path != '/checkin') {
    return null;
  }
  final token = uri.queryParameters['token'];
  return (token == null || token.isEmpty) ? null : token;
}
