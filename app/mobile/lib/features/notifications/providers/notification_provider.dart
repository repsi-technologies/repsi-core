import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/providers/api_provider.dart';
import '../models/notification_model.dart';

import '../../../l10n/l10n.dart';
class NotificationState {
  final bool isLoading;
  final List<NotificationItem> items;
  final int unreadCount;
  final String? error;

  const NotificationState({
    this.isLoading = false,
    this.items = const [],
    this.unreadCount = 0,
    this.error,
  });

  NotificationState copyWith({
    bool? isLoading,
    List<NotificationItem>? items,
    int? unreadCount,
    String? error,
  }) {
    return NotificationState(
      isLoading: isLoading ?? this.isLoading,
      items: items ?? this.items,
      unreadCount: unreadCount ?? this.unreadCount,
      error: error,
    );
  }
}

class NotificationNotifier extends StateNotifier<NotificationState> {
  final ApiClient _api;

  NotificationNotifier(this._api) : super(const NotificationState()) {
    fetchNotifications();
  }

  Future<void> fetchNotifications() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _api.get(ApiEndpoints.notifications);
      final data = response.data;

      List<NotificationItem> notifications = [];
      int unread = 0;

      if (data is Map<String, dynamic>) {
        final items = data['items'] as List<dynamic>? ?? [];
        notifications = items.whereType<Map<String, dynamic>>().map((j) => NotificationItem.fromJson(j)).toList();
        unread = (data['unread_count'] as num?)?.toInt() ?? notifications.where((n) => !n.isRead).length;
      }

      state = state.copyWith(
        isLoading: false,
        items: notifications,
        unreadCount: unread,
      );
    } catch (_) {
      // Keep whatever was loaded before; never substitute invented notifications.
      state = state.copyWith(isLoading: false, error: L10n.current.errorLoadNotifications);
    }
  }

  Future<void> markAsRead(String id) async {
    final updated = state.items.map((item) {
      if (item.id == id) {
        return item.copyWith(isRead: true);
      }
      return item;
    }).toList();

    state = state.copyWith(
      items: updated,
      unreadCount: updated.where((n) => !n.isRead).length,
    );

    try {
      await _api.patch(ApiEndpoints.markNotificationRead(id));
    } catch (_) {
      // Optimistic update retained
    }
  }

  Future<void> markAllAsRead() async {
    final previous = state;
    state = state.copyWith(
      items: state.items.map((n) => n.copyWith(isRead: true)).toList(),
      unreadCount: 0,
    );
    try {
      await _api.post(ApiEndpoints.markAllNotificationsRead);
    } catch (_) {
      state = previous; // The server still has them unread; don't pretend otherwise.
    }
  }
}

final notificationProvider = StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
  final api = ref.watch(apiClientProvider);
  return NotificationNotifier(api);
});
