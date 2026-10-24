import 'package:dio/dio.dart';

import '../../l10n/l10n.dart';
class ApiError implements Exception {
  final String message;
  final int? statusCode;
  final String? code;
  final dynamic details;

  ApiError({
    required this.message,
    this.statusCode,
    this.code,
    this.details,
  });

  factory ApiError.fromDio(DioException error) {
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return ApiError(
        message: L10n.current.errorTimeout,
        statusCode: 408,
        code: 'TIMEOUT',
      );
    }

    if (error.type == DioExceptionType.connectionError) {
      return ApiError(
        message:
            L10n.current.errorNoConnection,
        statusCode: 0,
        code: 'CONNECTION_ERROR',
      );
    }

    final response = error.response;
    if (response != null && response.data is Map<String, dynamic>) {
      final data = response.data as Map<String, dynamic>;

      // Standard FastAPI detail
      if (data.containsKey('detail')) {
        final detail = data['detail'];
        if (detail is String) {
          return ApiError(
            message: detail,
            statusCode: response.statusCode,
            code: 'API_ERROR',
          );
        } else if (detail is Map && detail['message'] != null) {
          // Structured refusals: DEMO_RESTRICTED, PLAN_LIMIT_REACHED, FEATURE_NOT_IN_PLAN, ...
          return ApiError(
            message: detail['message'].toString(),
            statusCode: response.statusCode,
            code: detail['error_code']?.toString() ?? 'API_ERROR',
            details: detail,
          );
        } else if (detail is List && detail.isNotEmpty) {
          final messages = detail.map((item) {
            if (item is Map && item.containsKey('msg')) {
              return item['msg'].toString();
            }
            return item.toString();
          }).join(', ');
          return ApiError(
            message:
                messages.isNotEmpty ? messages : L10n.current.errorValidation,
            statusCode: response.statusCode ?? 422,
            code: 'VALIDATION_ERROR',
            details: detail,
          );
        }
      }

      // Structured error format
      if (data.containsKey('error') && data['error'] is Map<String, dynamic>) {
        final errMap = data['error'] as Map<String, dynamic>;
        return ApiError(
          message: errMap['message']?.toString() ?? L10n.current.errorGeneric,
          code: errMap['code']?.toString(),
          statusCode: response.statusCode,
          details: errMap['details'],
        );
      }
    }

    switch (response?.statusCode) {
      case 400:
        return ApiError(
            message: L10n.current.errorBadRequest, statusCode: 400);
      case 401:
        final isSignIn = error.requestOptions.path.contains('/auth/login');
        return ApiError(
          message: isSignIn
              ? L10n.current.errorInvalidCredentials
              : L10n.current.errorSessionExpired,
          statusCode: 401,
        );
      case 403:
        return ApiError(
            message: L10n.current.errorForbidden,
            statusCode: 403);
      case 404:
        return ApiError(message: L10n.current.errorNotFound, statusCode: 404);
      case 408:
        return ApiError(
            message: L10n.current.errorRequestTimeout, statusCode: 408);
      case 409:
        return ApiError(
            message: L10n.current.errorConflict,
            statusCode: 409);
      case 422:
        return ApiError(
            message: L10n.current.errorCheckInputs,
            statusCode: 422);
      case 429:
        return ApiError(
            message: L10n.current.errorTooManyAttempts,
            statusCode: 429);
      case 500:
        return ApiError(
            message: L10n.current.errorServerUnavailable, statusCode: 500);
      default:
        return ApiError(
          message: L10n.current.errorUnknown,
          statusCode: response?.statusCode,
        );
    }
  }

  factory ApiError.fromDioException(DioException error) =>
      ApiError.fromDio(error);

  @override
  String toString() => message;
}
