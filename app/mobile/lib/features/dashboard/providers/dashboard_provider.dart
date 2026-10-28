import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../app/config/app_config.dart';
import '../../../core/api/api_error.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/providers/api_provider.dart';
import '../../../shared/models/dashboard_metrics_model.dart';
import '../services/dashboard_service.dart';
import '../../../core/api/api_time.dart';

import '../../../l10n/l10n.dart';
class DashboardState {
  final bool isLoading;
  final DashboardMetricsModel? metrics;
  final String? errorMessage;

  const DashboardState({
    this.isLoading = false,
    this.metrics,
    this.errorMessage,
  });

  DashboardState copyWith({
    bool? isLoading,
    DashboardMetricsModel? metrics,
    String? errorMessage,
    bool clearError = false,
  }) {
    return DashboardState(
      isLoading: isLoading ?? this.isLoading,
      metrics: metrics ?? this.metrics,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

final dashboardServiceProvider = Provider<DashboardService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return DashboardService(apiClient: apiClient);
});

class DashboardNotifier extends StateNotifier<DashboardState> {
  final DashboardService _service;

  DashboardNotifier({required DashboardService service})
      : _service = service,
        super(const DashboardState()) {
    fetchMetrics();
  }

  Future<void> fetchMetrics() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final data = await _service.getMetrics();
      state = state.copyWith(isLoading: false, metrics: data);
    } on ApiError catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: L10n.current.errorLoadDashboard);
    }
  }
}

final dashboardProvider = StateNotifierProvider<DashboardNotifier, DashboardState>((ref) {
  final service = ref.watch(dashboardServiceProvider);
  return DashboardNotifier(service: service);
});

/// A person checked in right now (GET /attendance/currently-inside).
class InsideNow {
  final String name;
  final String? avatarUrl;
  final String? planName;
  final String personType;
  final String duration;
  final DateTime checkInTime;

  const InsideNow({
    required this.name,
    this.avatarUrl,
    this.planName,
    this.personType = 'member',
    required this.duration,
    required this.checkInTime,
  });

  factory InsideNow.fromJson(Map<String, dynamic> j) => InsideNow(
        name: j['name']?.toString() ?? L10n.current.commonMember,
        avatarUrl: AppConfig.resolveMediaUrl(j['avatar_url']?.toString()),
        planName: j['plan_name']?.toString(),
        personType: j['person_type']?.toString() ?? 'member',
        duration: j['duration_formatted']?.toString() ?? '',
        checkInTime: parseApiDateTime(j['check_in_time']) ?? DateTime.now(),
      );
}

/// Who is in the gym now. Auto-disposed, so it never outlives the dashboard (or the session).
final currentlyInsideProvider = FutureProvider.autoDispose<List<InsideNow>>((ref) async {
  final res = await ref.watch(apiClientProvider).get(ApiEndpoints.attendanceCurrentlyInside);
  final list = res.data as List<dynamic>? ?? const [];
  return list.map((e) => InsideNow.fromJson(e as Map<String, dynamic>)).toList();
});

/// Subscription banner for owners: trial countdown, or a "needs attention" note when the gym's REPSI
/// subscription is in grace or read-only. Purchases happen only on repsi.app; the app never shows
/// prices or purchase buttons (store policy). Reads GET /saas-billing/subscription when central billing
/// is enabled, else the legacy GET /billing/trial-status.
class TrialStatus {
  final bool isTrial;
  final bool isPaid;
  final bool isExpired;
  final int daysRemaining;
  final bool needsAttention;

  const TrialStatus({
    required this.isTrial,
    required this.isPaid,
    required this.isExpired,
    required this.daysRemaining,
    this.needsAttention = false,
  });

  bool get showBanner => needsAttention || (isTrial && !isPaid);
}

int _daysUntil(String? iso) {
  final end = iso == null ? null : DateTime.tryParse(iso);
  if (end == null) return 0;
  final hours = end.difference(DateTime.now()).inHours;
  return hours <= 0 ? 0 : (hours / 24).ceil();
}

final trialStatusProvider = FutureProvider.autoDispose<TrialStatus?>((ref) async {
  final api = ref.watch(apiClientProvider);
  try {
    final j = (await api.get(ApiEndpoints.saasSubscription)).data as Map<String, dynamic>;
    final status = j['status']?.toString() ?? '';
    return TrialStatus(
      isTrial: status == 'trialing',
      isPaid: status == 'active',
      isExpired: status == 'read_only',
      daysRemaining: _daysUntil(j['trial_ends_at']?.toString()),
      needsAttention: status == 'grace' || status == 'read_only' || status == 'suspended',
    );
  } catch (_) {
    // Central billing off (404) or not an owner/admin: fall back to the legacy trial endpoint.
  }
  try {
    final res = await api.get(ApiEndpoints.trialStatus);
    final j = res.data as Map<String, dynamic>;
    return TrialStatus(
      isTrial: j['is_trial'] == true,
      isPaid: j['is_paid'] == true,
      isExpired: j['is_expired'] == true,
      daysRemaining: (j['days_remaining'] as num?)?.toInt() ?? 0,
    );
  } catch (_) {
    return null; // The banner is optional; never block the dashboard on it.
  }
});
