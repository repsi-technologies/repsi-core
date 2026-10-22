import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/api/api_error.dart';
import '../../../shared/models/attendance_model.dart';

class AttendanceService {
  final ApiClient _apiClient;

  AttendanceService({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<AttendanceSummaryModel> getSummary() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.attendanceSummary);
      return AttendanceSummaryModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiError.fromDioException(e);
    }
  }

  Future<AttendanceRecordModel> checkIn({
    String? memberId,
    String? qrToken,
    String method = 'qr',
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.attendanceCheckIn,
        data: {
          if (memberId != null) 'member_id': memberId,
          if (qrToken != null) 'qr_token': qrToken,
          'method': method,
        },
      );
      return AttendanceRecordModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiError.fromDioException(e);
    }
  }

  /// Member self check-in by scanning the gym's entrance QR
  /// (`repsi://gym/checkin?gym_id=...&token=...`). `/attendance/scan-qr` is staff-only.
  Future<Map<String, dynamic>> scanGymQr({
    required String qrPayload,
  }) async {
    final token = Uri.tryParse(qrPayload)?.queryParameters['token'] ?? qrPayload;
    try {
      final response = await _apiClient.post(
        ApiEndpoints.attendanceCheckIn,
        data: {
          'qr_token': token,
          'method': 'qr',
          'terminal_id': 'MEMBER_APP',
        },
      );
      final record = response.data as Map<String, dynamic>;
      return {
        'status': 'success',
        'action': 'check_in',
        'person_name': record['person_name'],
        'record': record,
      };
    } on DioException catch (e) {
      throw ApiError.fromDioException(e);
    }
  }

  Future<AttendanceRecordModel> checkOut(String attendanceId) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.attendanceCheckOut,
        data: {'attendance_id': attendanceId, 'checkout_type': 'MANUAL'},
      );
      return AttendanceRecordModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiError.fromDioException(e);
    }
  }
}
