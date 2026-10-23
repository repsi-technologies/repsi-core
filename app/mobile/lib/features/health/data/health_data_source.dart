import 'dart:io' show Platform;

import 'package:health/health.dart';

import 'health_models.dart';

/// Reads daily activity from the phone. Abstract so the sync logic can be tested without a device.
abstract class HealthDataSource {
  Future<HealthAvailability> availability();
  Future<bool> hasPermission();
  Future<bool> requestPermission();
  Future<List<DailyActivity>> readDays(int days);
  Future<void> openInstall();
  Future<void> revoke();
}

/// Health Connect (Android). Google Fit's own API is deprecated; Fit and most fitness apps write
/// into Health Connect, so reading it covers Google Fit data too.
class HealthConnectDataSource implements HealthDataSource {
  final Health _health = Health();
  bool _configured = false;

  static const _types = [
    HealthDataType.STEPS,
    HealthDataType.DISTANCE_DELTA,
    HealthDataType.ACTIVE_ENERGY_BURNED
  ];
  static final _access = List.filled(_types.length, HealthDataAccess.READ);

  Future<void> _configure() async {
    if (_configured) return;
    await _health.configure();
    _configured = true;
  }

  @override
  Future<HealthAvailability> availability() async {
    if (!Platform.isAndroid) return HealthAvailability.unsupported;
    await _configure();
    switch (await _health.getHealthConnectSdkStatus()) {
      case HealthConnectSdkStatus.sdkAvailable:
        return HealthAvailability.available;
      case HealthConnectSdkStatus.sdkUnavailableProviderUpdateRequired:
        return HealthAvailability.updateRequired;
      case HealthConnectSdkStatus.sdkUnavailable:
        return HealthAvailability.notInstalled;
      default:
        return HealthAvailability.unsupported;
    }
  }

  @override
  Future<bool> hasPermission() async {
    await _configure();
    return await _health.hasPermissions(_types, permissions: _access) ?? false;
  }

  @override
  Future<bool> requestPermission() async {
    await _configure();
    return _health.requestAuthorization(_types, permissions: _access);
  }

  @override
  Future<void> openInstall() async {
    await _configure();
    await _health.installHealthConnect();
  }

  @override
  Future<void> revoke() async {
    await _configure();
    await _health.revokePermissions();
  }

  @override
  Future<List<DailyActivity>> readDays(int days) async {
    await _configure();
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final result = <DailyActivity>[];
    for (var i = days - 1; i >= 0; i--) {
      final start = today.subtract(Duration(days: i));
      final end = i == 0 ? now : start.add(const Duration(days: 1));
      final steps = await _health.getTotalStepsInInterval(start, end) ?? 0;
      final points = await _health.getHealthDataFromTypes(
        types: const [
          HealthDataType.DISTANCE_DELTA,
          HealthDataType.ACTIVE_ENERGY_BURNED
        ],
        startTime: start,
        endTime: end,
      );
      var distance = 0.0;
      var calories = 0.0;
      for (final p in points) {
        final value = p.value;
        if (value is! NumericHealthValue) continue;
        if (p.type == HealthDataType.DISTANCE_DELTA) {
          distance += value.numericValue.toDouble();
        }
        if (p.type == HealthDataType.ACTIVE_ENERGY_BURNED) {
          calories += value.numericValue.toDouble();
        }
      }
      result.add(DailyActivity(
          day: start,
          steps: steps,
          distanceMeters: distance,
          activeCalories: calories));
    }
    return result;
  }
}
