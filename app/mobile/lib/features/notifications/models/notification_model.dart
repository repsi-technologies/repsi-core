import 'package:flutter/foundation.dart';
import '../../../core/api/api_time.dart';

enum NotificationType {
  announcement,
  billing,
  attendance,
  classBooking,
  workout,
  system,
}

class NotificationItem {
  final String id;
  final String title;
  final String message;
  final String? actionUrl;
  final bool isRead;
  final DateTime createdAt;
  final NotificationType type;

  const NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    this.actionUrl,
    required this.isRead,
    required this.createdAt,
    this.type = NotificationType.system,
  });

  NotificationItem copyWith({
    bool? isRead,
  }) {
    return NotificationItem(
      id: id,
      title: title,
      message: message,
      actionUrl: actionUrl,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt,
      type: type,
    );
  }

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    final title = json['title']?.toString() ?? 'Notification';
    final msg = json['message']?.toString() ?? '';

    // Infer notification type from content/title
    NotificationType inferredType = NotificationType.system;
    final lower = (title + msg).toLowerCase();
    if (lower.contains('invoice') ||
        lower.contains('payment') ||
        lower.contains('renewal') ||
        lower.contains('fee')) {
      inferredType = NotificationType.billing;
    } else if (lower.contains('announcement') ||
        lower.contains('notice') ||
        lower.contains('holiday')) {
      inferredType = NotificationType.announcement;
    } else if (lower.contains('check-in') ||
        lower.contains('attendance') ||
        lower.contains('streak')) {
      inferredType = NotificationType.attendance;
    } else if (lower.contains('class') ||
        lower.contains('session') ||
        lower.contains('trainer')) {
      inferredType = NotificationType.classBooking;
    } else if (lower.contains('workout') ||
        lower.contains('exercise') ||
        lower.contains('routine')) {
      inferredType = NotificationType.workout;
    }

    return NotificationItem(
      id: json['id']?.toString() ?? UniqueKey().toString(),
      title: title,
      message: msg,
      actionUrl: json['action_url']?.toString(),
      isRead: json['is_read'] == true,
      createdAt: json['created_at'] != null
          ? (parseApiDateTime(json['created_at']) ?? DateTime.now())
          : DateTime.now(),
      type: inferredType,
    );
  }

  String timeAgo() {
    final difference = DateTime.now().difference(createdAt);
    if (difference.inMinutes < 1) return 'Just now';
    if (difference.inMinutes < 60) return '${difference.inMinutes}m ago';
    if (difference.inHours < 24) return '${difference.inHours}h ago';
    if (difference.inDays < 7) return '${difference.inDays}d ago';
    return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  }
}
