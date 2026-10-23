import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../../app/config/app_config.dart';
import '../storage/secure_storage_service.dart';
import 'api_error.dart';
import 'api_interceptors.dart';

class ApiClient {
  late final Dio dio;

  ApiClient({
    required SecureStorageService storage,
    Future<void> Function()? onSessionExpired,
  }) {
    dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.baseUrl,
        connectTimeout: AppConfig.connectTimeout,
        receiveTimeout: AppConfig.receiveTimeout,
        followRedirects: true,
        maxRedirects: 5,
        validateStatus: (status) => status != null && status < 400,
      ),
    );

    dio.interceptors
        .add(AuthInterceptor(storage, dio, onSessionExpired: onSessionExpired));
    if (kDebugMode) {
      // Headers and bodies carry tokens, passwords and member data, so only log the exchange itself.
      dio.interceptors.add(LogInterceptor(
        request: true,
        requestHeader: false,
        requestBody: false,
        responseHeader: false,
        responseBody: false,
        error: true,
      ));
    }
  }

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await dio.get<T>(path,
          queryParameters: queryParameters, options: options);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await dio.post<T>(path,
          data: data, queryParameters: queryParameters, options: options);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await dio.put<T>(path,
          data: data, queryParameters: queryParameters, options: options);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await dio.patch<T>(path,
          data: data, queryParameters: queryParameters, options: options);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await dio.delete<T>(path,
          data: data, queryParameters: queryParameters, options: options);
    } on DioException catch (e) {
      throw ApiError.fromDio(e);
    }
  }
}
