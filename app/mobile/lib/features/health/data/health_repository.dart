import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'health_models.dart';

class HealthRepository {
  final ApiClient _api;

  HealthRepository(this._api);

  /// Idempotent: re-sending a day replaces it on the server, so retries are safe.
  Future<void> upload(List<DailyActivity> days) async {
    if (days.isEmpty) return;
    await _api.put(
      ApiEndpoints.healthDaily,
      data: {
        'source': 'health_connect',
        'days': [for (final d in days) d.toJson()],
      },
    );
  }

  Future<HealthSummary> summary({int days = 7}) async {
    final response = await _api
        .get(ApiEndpoints.healthDaily, queryParameters: {'days': days});
    return HealthSummary.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteAll() async {
    await _api.delete(ApiEndpoints.healthDaily);
  }
}
