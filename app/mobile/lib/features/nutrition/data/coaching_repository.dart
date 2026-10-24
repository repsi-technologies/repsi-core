import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_time.dart';
import '../../../core/providers/api_provider.dart';

/// Trainer clients, diet plans and trainer-member chat. The backend decides who may see what:
/// trainers only reach members currently assigned to them, members only themselves.
class CoachingRepository {
  final ApiClient _api;
  CoachingRepository(this._api);

  Future<List<Map<String, dynamic>>> trainerClients() async {
    final res = await _api.get<List<dynamic>>('/trainers/me/clients');
    return (res.data ?? const []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<List<Conversation>> conversations() async {
    final res = await _api.get<List<dynamic>>('/chat/conversations');
    return (res.data ?? const []).map((e) => Conversation.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  Future<Conversation> openWithMember(String memberId) async {
    final res = await _api.post<Map<String, dynamic>>('/chat/conversations', data: {'member_id': memberId});
    return Conversation.fromJson(res.data!);
  }

  Future<List<ThreadMessage>> messages(String conversationId) async {
    final res = await _api.get<List<dynamic>>('/chat/conversations/$conversationId/messages');
    await _api.post<Map<String, dynamic>>('/chat/conversations/$conversationId/read');
    return (res.data ?? const []).map((e) => ThreadMessage.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  /// [clientRef] makes retries after a dropped connection safe: the server returns the original message.
  Future<ThreadMessage> send(String conversationId, String body, String clientRef) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/chat/conversations/$conversationId/messages',
      data: {'body': body, 'client_ref': clientRef},
    );
    return ThreadMessage.fromJson(res.data!);
  }

  Future<NutritionDay> day({String? memberId}) async {
    final res = await _api.get<Map<String, dynamic>>('/nutrition/day',
        queryParameters: {if (memberId != null) 'member_id': memberId});
    return NutritionDay.fromJson(res.data!);
  }

  Future<Map<String, dynamic>?> adherence(String memberId) async {
    final res = await _api.get<Map<String, dynamic>>('/nutrition/adherence', queryParameters: {'member_id': memberId});
    return res.data;
  }

  Future<void> logMeal({required String slot, required String status, required String date}) async {
    await _api.post<Map<String, dynamic>>('/nutrition/meals',
        data: {'slot': slot, 'status': status, 'log_date': date, 'client_ref': newClientRef()});
  }

  Future<void> logWater(int ml, String date) async {
    await _api.post<Map<String, dynamic>>('/nutrition/water',
        data: {'amount_ml': ml, 'log_date': date, 'client_ref': newClientRef()});
  }
}

String newClientRef() {
  final r = Random.secure();
  return List.generate(16, (_) => r.nextInt(256).toRadixString(16).padLeft(2, '0')).join();
}

class Conversation {
  final String id, memberId, memberName, trainerName;
  final String? lastMessage;
  final int unread;
  final bool canSend;

  const Conversation({required this.id, required this.memberId, required this.memberName, required this.trainerName,
      this.lastMessage, required this.unread, required this.canSend});

  factory Conversation.fromJson(Map<String, dynamic> j) => Conversation(
        id: j['id'] as String,
        memberId: j['member_id'] as String? ?? '',
        memberName: j['member_name'] as String? ?? '',
        trainerName: j['trainer_name'] as String? ?? '',
        lastMessage: j['last_message'] as String?,
        unread: (j['unread'] as num?)?.toInt() ?? 0,
        canSend: j['can_send'] as bool? ?? false,
      );
}

class ThreadMessage {
  final String id, senderUserId, senderKind;
  final String? body;
  final DateTime createdAt;
  final bool read;

  const ThreadMessage({required this.id, required this.senderUserId, required this.senderKind, this.body,
      required this.createdAt, required this.read});

  factory ThreadMessage.fromJson(Map<String, dynamic> j) => ThreadMessage(
        id: j['id'] as String,
        senderUserId: j['sender_user_id'] as String? ?? '',
        senderKind: j['sender_kind'] as String? ?? '',
        body: j['body'] as String?,
        createdAt: parseApiDateTime(j['created_at']) ?? DateTime.now(),
        read: j['read_at'] != null,
      );
}

class NutritionDay {
  final String date;
  final Map<String, dynamic>? assignment;
  final List<Map<String, dynamic>> meals;
  final Map<String, dynamic> totals;
  final int waterMl;

  const NutritionDay({required this.date, this.assignment, required this.meals, required this.totals, required this.waterMl});

  factory NutritionDay.fromJson(Map<String, dynamic> j) => NutritionDay(
        date: j['date'] as String,
        assignment: j['assignment'] == null ? null : Map<String, dynamic>.from(j['assignment'] as Map),
        meals: ((j['meals'] as List?) ?? const []).map((e) => Map<String, dynamic>.from(e as Map)).toList(),
        totals: Map<String, dynamic>.from((j['totals'] as Map?) ?? const {}),
        waterMl: (j['water_ml'] as num?)?.toInt() ?? 0,
      );

  Map<String, dynamic>? get version =>
      assignment?['version'] == null ? null : Map<String, dynamic>.from(assignment!['version'] as Map);

  List<Map<String, dynamic>> get plannedMeals =>
      ((version?['meals'] as List?) ?? const []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
}

final coachingRepositoryProvider = Provider<CoachingRepository>((ref) => CoachingRepository(ref.watch(apiClientProvider)));

final trainerClientsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
    (ref) => ref.watch(coachingRepositoryProvider).trainerClients());

final conversationsProvider = FutureProvider.autoDispose<List<Conversation>>(
    (ref) => ref.watch(coachingRepositoryProvider).conversations());

final nutritionDayProvider = FutureProvider.autoDispose.family<NutritionDay, String?>(
    (ref, memberId) => ref.watch(coachingRepositoryProvider).day(memberId: memberId));
