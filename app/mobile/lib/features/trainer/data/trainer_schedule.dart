import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_time.dart';
import '../../../core/providers/api_provider.dart';

/// One personal-training session from `/trainers/me/schedule`.
class TrainerSessionItem {
  final String id;
  final String title;
  final DateTime scheduledAt;
  final int durationMinutes;
  final String status; // SCHEDULED | COMPLETED | CANCELLED | NO_SHOW
  final String? clientId;
  final String? clientName;
  final String? notes;

  const TrainerSessionItem({required this.id, required this.title, required this.scheduledAt,
      required this.durationMinutes, required this.status, this.clientId, this.clientName, this.notes});

  bool get isScheduled => status == 'SCHEDULED';

  factory TrainerSessionItem.fromJson(Map<String, dynamic> j) => TrainerSessionItem(
        id: j['id'] as String? ?? '',
        title: j['title'] as String? ?? '',
        scheduledAt: (parseApiDateTime(j['scheduled_at']) ?? DateTime.now()).toLocal(),
        durationMinutes: (j['duration_minutes'] as num?)?.toInt() ?? 60,
        status: (j['status'] as String? ?? 'SCHEDULED').split('.').last.toUpperCase(),
        clientId: j['client_id'] as String?,
        clientName: j['client_name'] as String?,
        notes: j['notes'] as String?,
      );
}

/// A recurring group class taught by this trainer.
class TrainerClassItem {
  final String id;
  final String title;
  final String schedule;
  final int durationMinutes;
  final String? room;

  const TrainerClassItem({required this.id, required this.title, required this.schedule, required this.durationMinutes,
      this.room});

  factory TrainerClassItem.fromJson(Map<String, dynamic> j) => TrainerClassItem(
        id: j['id'] as String? ?? '',
        title: j['title'] as String? ?? '',
        schedule: j['schedule'] as String? ?? '',
        durationMinutes: (j['duration_minutes'] as num?)?.toInt() ?? 60,
        room: j['room'] as String?,
      );
}

class TrainerSchedule {
  final List<TrainerSessionItem> sessions;
  final List<TrainerClassItem> classes;
  const TrainerSchedule({required this.sessions, required this.classes});

  List<TrainerSessionItem> sessionsOn(DateTime day) => sessions
      .where((s) => s.scheduledAt.year == day.year && s.scheduledAt.month == day.month && s.scheduledAt.day == day.day)
      .toList();

  List<TrainerSessionItem> upcoming(DateTime now) =>
      sessions.where((s) => s.isScheduled && s.scheduledAt.isAfter(now.subtract(const Duration(hours: 1)))).toList();
}

final trainerScheduleProvider = FutureProvider.autoDispose<TrainerSchedule>((ref) async {
  final res = await ref.watch(apiClientProvider).get<Map<String, dynamic>>('/trainers/me/schedule');
  final data = res.data ?? const {};
  return TrainerSchedule(
    sessions: ((data['sessions'] as List?) ?? const [])
        .map((e) => TrainerSessionItem.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList()
      ..sort((a, b) => a.scheduledAt.compareTo(b.scheduledAt)),
    classes: ((data['classes'] as List?) ?? const [])
        .map((e) => TrainerClassItem.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList(),
  );
});
