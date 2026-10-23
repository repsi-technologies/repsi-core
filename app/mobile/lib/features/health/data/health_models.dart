/// Totals for one local calendar day, as read from Health Connect and sent to the backend.
class DailyActivity {
  final DateTime day;
  final int steps;
  final double distanceMeters;
  final double activeCalories;

  const DailyActivity({
    required this.day,
    this.steps = 0,
    this.distanceMeters = 0,
    this.activeCalories = 0,
  });

  String get dayKey =>
      '${day.year.toString().padLeft(4, '0')}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';

  Map<String, dynamic> toJson() => {
        'day': dayKey,
        'steps': steps,
        'distance_meters': distanceMeters.roundToDouble(),
        'active_calories': double.parse(activeCalories.toStringAsFixed(1)),
      };

  factory DailyActivity.fromJson(Map<String, dynamic> json) {
    return DailyActivity(
      day: DateTime.parse(json['day'].toString()),
      steps: (json['steps'] as num?)?.toInt() ?? 0,
      distanceMeters: (json['distance_meters'] as num?)?.toDouble() ?? 0,
      activeCalories: (json['active_calories'] as num?)?.toDouble() ?? 0,
    );
  }
}

/// Server-side summary of what the member has synced (`GET /health/daily`).
class HealthSummary {
  final List<DailyActivity> days;
  final int todaySteps;
  final int averageSteps;
  final int totalSteps;
  final double totalDistanceMeters;
  final double totalActiveCalories;
  final DateTime? lastSyncedAt;

  const HealthSummary({
    this.days = const [],
    this.todaySteps = 0,
    this.averageSteps = 0,
    this.totalSteps = 0,
    this.totalDistanceMeters = 0,
    this.totalActiveCalories = 0,
    this.lastSyncedAt,
  });

  DailyActivity? get today {
    final now = DateTime.now();
    for (final d in days) {
      if (d.day.year == now.year &&
          d.day.month == now.month &&
          d.day.day == now.day) {
        return d;
      }
    }
    return null;
  }

  factory HealthSummary.fromJson(Map<String, dynamic> json) {
    return HealthSummary(
      days: [
        for (final d in (json['days'] as List? ?? const []))
          if (d is Map<String, dynamic>) DailyActivity.fromJson(d),
      ],
      todaySteps: (json['today_steps'] as num?)?.toInt() ?? 0,
      averageSteps: (json['average_steps'] as num?)?.toInt() ?? 0,
      totalSteps: (json['total_steps'] as num?)?.toInt() ?? 0,
      totalDistanceMeters:
          (json['total_distance_meters'] as num?)?.toDouble() ?? 0,
      totalActiveCalories:
          (json['total_active_calories'] as num?)?.toDouble() ?? 0,
      lastSyncedAt: _parseServerTime(json['last_synced_at']),
    );
  }
}

enum HealthAvailability {
  /// Not Android (or an emulator without Health Connect support).
  unsupported,
  notInstalled,
  updateRequired,
  available,
}

/// The API serialises naive UTC timestamps without a zone suffix; read them as UTC.
DateTime? _parseServerTime(Object? raw) {
  if (raw == null) return null;
  final text = raw.toString();
  final hasZone = text.endsWith('Z') || RegExp(r'[+-]\d\d:?\d\d$').hasMatch(text);
  return DateTime.tryParse(hasZone ? text : '${text}Z')?.toLocal();
}
