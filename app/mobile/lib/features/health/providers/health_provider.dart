import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_error.dart';
import '../../../core/providers/api_provider.dart';
import '../../../core/providers/storage_provider.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../data/health_data_source.dart';
import '../data/health_models.dart';
import '../data/health_repository.dart';

import '../../../l10n/l10n.dart';
class HealthState {
  final HealthAvailability availability;
  final bool connected;
  final bool syncing;
  final bool loaded;
  final HealthSummary summary;
  final String? error;

  const HealthState({
    this.availability = HealthAvailability.unsupported,
    this.connected = false,
    this.syncing = false,
    this.loaded = false,
    this.summary = const HealthSummary(),
    this.error,
  });

  HealthState copyWith({
    HealthAvailability? availability,
    bool? connected,
    bool? syncing,
    bool? loaded,
    HealthSummary? summary,
    String? error,
    bool clearError = false,
  }) {
    return HealthState(
      availability: availability ?? this.availability,
      connected: connected ?? this.connected,
      syncing: syncing ?? this.syncing,
      loaded: loaded ?? this.loaded,
      summary: summary ?? this.summary,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class HealthNotifier extends StateNotifier<HealthState> {
  final HealthDataSource _source;
  final HealthRepository _repo;
  final SecureStorageService _storage;
  final DateTime Function() _now;

  static const _firstSyncDays = 30;
  static const _routineSyncDays = 3;
  static const _minSyncGap = Duration(minutes: 15);
  DateTime? _lastSyncAttempt;

  HealthNotifier({
    required HealthDataSource source,
    required HealthRepository repo,
    required SecureStorageService storage,
    DateTime Function()? now,
  })  : _source = source,
        _repo = repo,
        _storage = storage,
        _now = now ?? DateTime.now,
        super(const HealthState());

  /// Loads what the server has and, if the member has connected Health Connect, refreshes it.
  Future<void> load() async {
    final availability =
        await _safe(_source.availability, HealthAvailability.unsupported);
    final consented = _storage.isHealthSyncEnabled();
    final hasPermission =
        consented && availability == HealthAvailability.available
            ? await _safe(_source.hasPermission, false)
            : false;
    if (!mounted) return;
    state =
        state.copyWith(availability: availability, connected: hasPermission);

    try {
      final summary = await _repo.summary();
      if (mounted) {
        state =
            state.copyWith(summary: summary, loaded: true, clearError: true);
      }
    } on ApiError catch (e) {
      if (mounted) state = state.copyWith(loaded: true, error: e.message);
    }
    if (hasPermission && mounted) await sync();
  }

  /// Asks for Health Connect permission (the system sheet) and runs the first sync.
  Future<void> connect() async {
    state = state.copyWith(clearError: true);
    try {
      final availability = await _source.availability();
      state = state.copyWith(availability: availability);
      if (availability != HealthAvailability.available) {
        if (availability != HealthAvailability.unsupported) {
          await _source.openInstall();
        }
        return;
      }
      final granted = await _source.requestPermission();
      if (!granted) {
        state = state.copyWith(
            error:
                L10n.current.healthPermissionDenied);
        return;
      }
      await _storage.setHealthSyncEnabled(true);
      state = state.copyWith(connected: true);
      await sync(force: true, days: _firstSyncDays);
    } catch (_) {
      if (mounted) {
        state = state.copyWith(
            error: L10n.current.healthConnectFailed);
      }
    }
  }

  Future<void> sync({bool force = false, int days = _routineSyncDays}) async {
    if (state.syncing || !state.connected) return;
    final now = _now();
    final last = _lastSyncAttempt;
    if (!force && last != null && now.difference(last) < _minSyncGap) return;
    _lastSyncAttempt = now;
    state = state.copyWith(syncing: true, clearError: true);
    try {
      final readings = await _source.readDays(days);
      await _repo.upload(readings);
      final summary = await _repo.summary();
      if (mounted) {
        state = state.copyWith(summary: summary, syncing: false, loaded: true);
      }
    } on ApiError catch (e) {
      if (mounted) state = state.copyWith(syncing: false, error: e.message);
    } catch (_) {
      if (mounted) {
        state = state.copyWith(
            syncing: false,
            error: L10n.current.healthReadFailed);
      }
    }
  }

  /// Stops syncing and erases what was uploaded.
  Future<void> disconnect() async {
    state = state.copyWith(syncing: true, clearError: true);
    try {
      await _repo.deleteAll();
      await _storage.setHealthSyncEnabled(false);
      await _safe(() async {
        await _source.revoke();
        return true;
      }, false);
      if (mounted) {
        state = state.copyWith(
            connected: false, syncing: false, summary: const HealthSummary());
      }
    } on ApiError catch (e) {
      if (mounted) state = state.copyWith(syncing: false, error: e.message);
    }
  }

  Future<T> _safe<T>(Future<T> Function() action, T fallback) async {
    try {
      return await action();
    } catch (_) {
      return fallback;
    }
  }
}

final healthDataSourceProvider =
    Provider<HealthDataSource>((ref) => HealthConnectDataSource());

final healthRepositoryProvider = Provider<HealthRepository>(
    (ref) => HealthRepository(ref.watch(apiClientProvider)));

final healthProvider =
    StateNotifierProvider.autoDispose<HealthNotifier, HealthState>((ref) {
  return HealthNotifier(
    source: ref.watch(healthDataSourceProvider),
    repo: ref.watch(healthRepositoryProvider),
    storage: ref.watch(secureStorageServiceProvider),
  );
});
