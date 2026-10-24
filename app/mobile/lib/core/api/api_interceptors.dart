import 'dart:async';

import 'package:dio/dio.dart';
import '../../app/config/app_config.dart';
import '../storage/secure_storage_service.dart';
import '../../l10n/l10n.dart';

enum _RefreshResult { renewed, rejected, unavailable }

/// Attaches the bearer token and transparently renews it once on a 401.
///
/// Concurrent 401s share one refresh call (the backend rotates refresh tokens, so two parallel
/// refreshes would revoke the session). Only an explicit rejection ends the session via
/// [onSessionExpired]; a network failure during refresh leaves the user signed in.
class AuthInterceptor extends Interceptor {
  final SecureStorageService _storage;
  final Dio _dio;
  final Dio _refreshClient;
  final Future<void> Function()? onSessionExpired;
  Future<_RefreshResult>? _refreshing;

  static const _skipRefreshPaths = [
    '/auth/login',
    '/auth/refresh',
    '/auth/google',
    '/auth/register'
  ];

  /// [refreshClient] must not carry this interceptor, so a failing refresh can never recurse.
  AuthInterceptor(this._storage, this._dio, {this.onSessionExpired, Dio? refreshClient})
      : _refreshClient = refreshClient ??
            Dio(BaseOptions(
              baseUrl: AppConfig.baseUrl,
              connectTimeout: AppConfig.connectTimeout,
              receiveTimeout: AppConfig.receiveTimeout,
            ));

  @override
  Future<void> onRequest(
      RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.getToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    final workspaceId = _storage.getActiveWorkspaceId();
    if (workspaceId != null && workspaceId.isNotEmpty) {
      options.headers['X-Workspace-ID'] = workspaceId;
    }

    options.headers['Accept'] = 'application/json';
    // Lets the API answer in the app language (validation and error messages, where translated).
    options.headers['Accept-Language'] = L10n.localeName;
    if (options.data is! FormData) {
      options.headers['Content-Type'] ??= 'application/json';
    }

    return handler.next(options);
  }

  @override
  Future<void> onError(
      DioException err, ErrorInterceptorHandler handler) async {
    final request = err.requestOptions;
    final canRetry = err.response?.statusCode == 401 &&
        request.extra['retried'] != true &&
        !_skipRefreshPaths.any(request.path.contains);
    if (!canRetry) return handler.next(err);

    final result = await (_refreshing ??=
        _refreshTokens().whenComplete(() => _refreshing = null));
    if (result == _RefreshResult.rejected) await onSessionExpired?.call();
    if (result != _RefreshResult.renewed) return handler.next(err);

    try {
      final token = await _storage.getToken();
      request.headers['Authorization'] = 'Bearer $token';
      request.extra['retried'] = true;
      return handler.resolve(await _dio.fetch<dynamic>(request));
    } on DioException catch (retryError) {
      return handler.next(retryError);
    }
  }

  Future<_RefreshResult> _refreshTokens() async {
    final refreshToken = await _storage.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      return _RefreshResult.rejected;
    }
    try {
      final slug = _storage.getActiveWorkspaceSlug();
      final response = await _refreshClient.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {
          'refresh_token': refreshToken,
          if (slug != null && slug.isNotEmpty) 'workspace': slug,
        },
      );
      final data = response.data;
      final access = data?['access_token']?.toString();
      if (access == null || access.isEmpty) return _RefreshResult.rejected;
      await _storage.saveToken(access);
      final rotated = data?['refresh_token']?.toString();
      if (rotated != null && rotated.isNotEmpty) {
        await _storage.saveRefreshToken(rotated);
      }
      return _RefreshResult.renewed;
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final serverRejected = status != null &&
          status >= 400 &&
          status < 500 &&
          status != 408 &&
          status != 429;
      return serverRejected
          ? _RefreshResult.rejected
          : _RefreshResult.unavailable;
    }
  }
}
