import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/attendance_model.dart';
import '../../../shared/models/member_attendance_model.dart';

/// Attendance calls. Every rule (membership validity, duplicate scans, QR rotation, tenant
/// scoping) is enforced by the backend; this class only transports requests.
class AttendanceService {
  final ApiClient _apiClient;

  AttendanceService({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<AttendanceSummaryModel> getSummary() async {
    final response = await _apiClient.get(ApiEndpoints.attendanceSummary);
    return AttendanceSummaryModel.fromJson(
        response.data as Map<String, dynamic>);
  }

  /// Staff/owner manual check-in of a member by id.
  Future<AttendanceRecordModel> checkIn(
      {String? memberId, String method = 'manual'}) async {
    final response = await _apiClient.post(
      ApiEndpoints.attendanceCheckIn,
      data: {if (memberId != null) 'member_id': memberId, 'method': method},
    );
    return AttendanceRecordModel.fromJson(
        response.data as Map<String, dynamic>);
  }

  Future<MemberAttendance> getMyAttendance() async {
    final response = await _apiClient.get(ApiEndpoints.myAttendance);
    return MemberAttendance.fromJson(response.data as Map<String, dynamic>);
  }

  /// Member self check-in with the rotating token from the gym's entrance QR.
  Future<VisitModel> selfCheckIn(String gymQrToken) async {
    final response = await _apiClient.post(
      ApiEndpoints.attendanceCheckIn,
      data: {
        'qr_token': gymQrToken,
        'method': 'qr',
        'terminal_id': 'MEMBER_APP'
      },
    );
    return VisitModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> selfCheckOut() async {
    await _apiClient.post(ApiEndpoints.attendanceCheckOut,
        data: {'checkout_type': 'MANUAL'});
  }

  Future<MemberPass> getMyPass() async {
    final response = await _apiClient.get(ApiEndpoints.myAttendancePass);
    return MemberPass.fromJson(response.data as Map<String, dynamic>);
  }

  /// Front desk: scans a member's pass and toggles them in/out. Returns the backend's message.
  Future<ScanResult> staffScan(String passToken) async {
    final response = await _apiClient.post(
      ApiEndpoints.attendanceScanQr,
      data: {
        'identifier': passToken,
        'method': 'qr',
        'terminal_id': 'STAFF_APP'
      },
    );
    final data = response.data as Map<String, dynamic>;
    return ScanResult(
      checkedIn: data['action'] == 'check_in',
      personName: data['person_name']?.toString() ?? '',
      message: data['message']?.toString() ?? '',
    );
  }
}

class ScanResult {
  final bool checkedIn;
  final String personName;
  final String message;

  const ScanResult(
      {required this.checkedIn,
      required this.personName,
      required this.message});
}
