import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/animations/repsi_press.dart';
import '../../../shared/animations/repsi_stagger.dart';
import '../../../shared/widgets/repsi_empty_state.dart';
import '../models/notification_model.dart';
import '../providers/notification_provider.dart';

class NotificationInboxView extends ConsumerStatefulWidget {
  const NotificationInboxView({super.key});

  @override
  ConsumerState<NotificationInboxView> createState() =>
      _NotificationInboxViewState();
}

class _NotificationInboxViewState extends ConsumerState<NotificationInboxView>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  IconData _getTypeIcon(NotificationType type) {
    switch (type) {
      case NotificationType.billing:
        return LucideIcons.receipt;
      case NotificationType.announcement:
        return LucideIcons.megaphone;
      case NotificationType.attendance:
        return LucideIcons.flame;
      case NotificationType.classBooking:
        return LucideIcons.calendarCheck;
      case NotificationType.workout:
        return LucideIcons.dumbbell;
      case NotificationType.system:
        return LucideIcons.bell;
    }
  }

  Color _getTypeColor(NotificationType type) {
    switch (type) {
      case NotificationType.billing:
        return const Color(0xFFD97706);
      case NotificationType.announcement:
        return const Color(0xFF2563EB);
      case NotificationType.attendance:
        return AppColors.primary;
      case NotificationType.classBooking:
        return const Color(0xFF7C3AED);
      case NotificationType.workout:
        return AppColors.success;
      case NotificationType.system:
        return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationProvider);
    final notifier = ref.read(notificationProvider.notifier);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: Text(
          'Notifications',
          style: AppTypography.headingSmall.copyWith(
            fontWeight: FontWeight.w700,
            color: isDark ? AppColors.darkText : AppColors.text,
          ),
        ),
        actions: [
          if (state.unreadCount > 0)
            TextButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                notifier.markAllAsRead();
              },
              child: const Text(
                'Mark all read',
                style: TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: isDark ? AppColors.darkBorder : AppColors.border,
                  width: 1,
                ),
              ),
            ),
            child: TabBar(
              controller: _tabController,
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              labelPadding: const EdgeInsets.symmetric(horizontal: 16),
              tabs: [
                Tab(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('All'),
                      if (state.unreadCount > 0) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${state.unreadCount}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const Tab(text: 'Unread'),
                const Tab(text: 'Billing'),
                const Tab(text: 'Announcements'),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildNotificationList(state.items, notifier, isDark),
          _buildNotificationList(
            state.items.where((n) => !n.isRead).toList(),
            notifier,
            isDark,
          ),
          _buildNotificationList(
            state.items
                .where((n) => n.type == NotificationType.billing)
                .toList(),
            notifier,
            isDark,
          ),
          _buildNotificationList(
            state.items
                .where((n) => n.type == NotificationType.announcement)
                .toList(),
            notifier,
            isDark,
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationList(
    List<NotificationItem> items,
    NotificationNotifier notifier,
    bool isDark,
  ) {
    if (items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: RepsiEmptyState(
            icon: LucideIcons.bellOff,
            title: 'No notifications',
            message:
                'You are all caught up! Updates about your gym membership, classes, and payments will appear here.',
          ),
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => notifier.fetchNotifications(),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.pageHorizontalPadding,
          vertical: 14,
        ),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final item = items[index];
          final typeColor = _getTypeColor(item.type);

          return RepsiStaggerItem(
            index: index,
            child: Dismissible(
              key: Key(item.id),
              direction: DismissDirection.endToStart,
              background: Container(
                alignment: Alignment.centerRight,
                padding: const EdgeInsets.only(right: 20),
                decoration: BoxDecoration(
                  color: AppColors.error,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
                ),
                child: const Icon(LucideIcons.trash2,
                    color: Colors.white, size: 22),
              ),
              onDismissed: (_) {
                notifier.removeNotification(item.id);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Notification removed'),
                    duration: Duration(seconds: 2),
                  ),
                );
              },
              child: RepsiPress(
                onTap: () {
                  if (!item.isRead) {
                    notifier.markAsRead(item.id);
                  }
                },
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: item.isRead
                        ? (isDark ? AppColors.darkSurface : AppColors.surface)
                        : (isDark
                            ? const Color(0xFF2C2420)
                            : const Color(0xFFFFF7F2)),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
                    border: Border.all(
                      color: item.isRead
                          ? (isDark ? AppColors.darkBorder : AppColors.border)
                          : AppColors.primary.withValues(alpha: 0.35),
                      width: item.isRead ? 1 : 1.2,
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Type Icon Container
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: typeColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          _getTypeIcon(item.type),
                          color: typeColor,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Text Content
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    item.title,
                                    style: AppTypography.headingSmall.copyWith(
                                      fontSize: 14.5,
                                      fontWeight: item.isRead
                                          ? FontWeight.w600
                                          : FontWeight.w700,
                                      color: isDark
                                          ? AppColors.darkText
                                          : AppColors.text,
                                    ),
                                  ),
                                ),
                                if (!item.isRead) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: AppColors.primary,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              item.message,
                              style: AppTypography.bodySecondary.copyWith(
                                fontSize: 13,
                                color: isDark
                                    ? AppColors.darkTextSecondary
                                    : AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              item.timeAgo(),
                              style: AppTypography.caption.copyWith(
                                fontSize: 11,
                                color: isDark
                                    ? AppColors.darkTextMuted
                                    : AppColors.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
