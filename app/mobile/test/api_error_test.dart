import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/api/api_error.dart';

DioException _response(int status, Object body) {
  final options = RequestOptions(path: '/members');
  return DioException(
    requestOptions: options,
    type: DioExceptionType.badResponse,
    response: Response(requestOptions: options, statusCode: status, data: body),
  );
}

void main() {
  test('structured refusals keep the server message and code', () {
    final e = ApiError.fromDio(_response(403, {
      'detail': {'error_code': 'DEMO_RESTRICTED', 'message': "This isn't available in the demo gym."},
    }));
    expect(e.message, "This isn't available in the demo gym.");
    expect(e.code, 'DEMO_RESTRICTED');
    expect(e.statusCode, 403);
    expect((e.details as Map)['error_code'], 'DEMO_RESTRICTED');
  });

  test('plain string details are shown as-is', () {
    final e = ApiError.fromDio(_response(409, {'detail': 'Member already checked in.'}));
    expect(e.message, 'Member already checked in.');
  });
}
