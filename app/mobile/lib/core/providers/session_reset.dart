import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/ai/providers/ai_coach_provider.dart';
import '../../features/attendance/providers/attendance_provider.dart';
import '../../features/dashboard/providers/dashboard_provider.dart';
import '../../features/member/data/member_repository.dart';
import '../../features/members/providers/member_provider.dart';
import '../../features/notifications/providers/notification_provider.dart';
import '../../features/workspaces/providers/workspace_provider.dart';

/// Drops every provider that caches per-user or per-gym data, so the next account to sign in on
/// this device never sees the previous one's members, attendance, payments or AI history.
/// Add any new keep-alive provider that holds tenant data to this list.
void resetSessionProviders(WidgetRef ref) {
  ref.invalidate(attendanceProvider);
  ref.invalidate(dashboardProvider);
  ref.invalidate(memberListProvider);
  ref.invalidate(workspaceProvider);
  ref.invalidate(aiCoachProvider);
  ref.invalidate(notificationProvider);
  ref.invalidate(todayWorkoutProvider);
  ref.invalidate(gymMachinesProvider);
  ref.invalidate(exerciseLibraryProvider);
  ref.invalidate(trainerChatProvider);
  ref.invalidate(memberPaymentsProvider);
}
