import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/api/api_interceptors.dart';
import 'package:mobile/core/storage/secure_storage_service.dart';

/// Answers requests from a closure so tests can script the server.
class _ScriptedAdapter implements HttpClientAdapter {
  final ResponseBody Function(RequestOptions options) handler;
  final List<String> calls = [];

  _ScriptedAdapter(this.handler);

  @override
  Future<ResponseBody> fetch(RequestOptions options, Stream<Uint8List>? requestStream, Future<void>? cancelFuture) async {
    calls.add('${options.method} ${options.path}');
    return handler(options);
  }

  @override
  void close({bool force = false}) {}
}

ResponseBody _json(int status, Map<String, dynamic> body) => ResponseBody.fromString(
      jsonEncode(body),
      status,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );

void main() {
  late SecureStorageService storage;
  late int expired;

  setUp(() async {
    FlutterSecureStorage.setMockInitialValues({});
    storage = SecureStorageService();
    await storage.saveToken('old-access');
    await storage.saveRefreshToken('old-refresh');
    expired = 0;
  });

  Dio buildClient(_ScriptedAdapter api, _ScriptedAdapter refresh) {
    final dio = Dio(BaseOptions(baseUrl: 'https://api.test', validateStatus: (s) => s != null && s < 400))
      ..httpClientAdapter = api;
    final refreshClient = Dio(BaseOptions(baseUrl: 'https://api.test'))..httpClientAdapter = refresh;
    dio.interceptors.add(AuthInterceptor(storage, dio, refreshClient: refreshClient, onSessionExpired: () async => expired++));
    return dio;
  }

  test('401 is renewed once and the original request is retried with the new token', () async {
    final api = _ScriptedAdapter((o) {
      final ok = o.headers['Authorization'] == 'Bearer new-access';
      return ok ? _json(200, {'ok': true}) : _json(401, {'detail': 'expired'});
    });
    final refresh = _ScriptedAdapter((o) => _json(200, {'access_token': 'new-access', 'refresh_token': 'new-refresh'}));
    final dio = buildClient(api, refresh);

    final response = await dio.get<dynamic>('/members/me');

    expect(response.data, {'ok': true});
    expect(await storage.getToken(), 'new-access');
    expect(await storage.getRefreshToken(), 'new-refresh');
    expect(refresh.calls, ['POST /auth/refresh']);
    expect(expired, 0);
  });

  test('simultaneous 401s share a single refresh (the backend rotates refresh tokens)', () async {
    final api = _ScriptedAdapter((o) {
      final ok = o.headers['Authorization'] == 'Bearer new-access';
      return ok ? _json(200, {'ok': true}) : _json(401, {'detail': 'expired'});
    });
    final refresh = _ScriptedAdapter((o) => _json(200, {'access_token': 'new-access', 'refresh_token': 'new-refresh'}));
    final dio = buildClient(api, refresh);

    final results = await Future.wait([dio.get<dynamic>('/a'), dio.get<dynamic>('/b'), dio.get<dynamic>('/c')]);

    expect(results.every((r) => r.statusCode == 200), isTrue);
    expect(refresh.calls.length, 1);
  });

  test('a rejected refresh token ends the session exactly once', () async {
    final api = _ScriptedAdapter((o) => _json(401, {'detail': 'expired'}));
    final refresh = _ScriptedAdapter((o) => _json(401, {'detail': 'revoked'}));
    final dio = buildClient(api, refresh);

    await expectLater(dio.get<dynamic>('/members/me'), throwsA(isA<DioException>()));

    expect(expired, 1);
  });

  test('a network failure during refresh keeps the user signed in', () async {
    final api = _ScriptedAdapter((o) => _json(401, {'detail': 'expired'}));
    final refresh = _ScriptedAdapter((o) => throw DioException.connectionError(requestOptions: o, reason: 'offline'));
    final dio = buildClient(api, refresh);

    await expectLater(dio.get<dynamic>('/members/me'), throwsA(isA<DioException>()));

    expect(expired, 0);
    expect(await storage.getRefreshToken(), 'old-refresh');
  });

  test('sign-in failures are never "refreshed"', () async {
    final api = _ScriptedAdapter((o) => _json(401, {'detail': 'Invalid credentials'}));
    final refresh = _ScriptedAdapter((o) => _json(200, {'access_token': 'x'}));
    final dio = buildClient(api, refresh);

    await expectLater(dio.post<dynamic>('/auth/login', data: {}), throwsA(isA<DioException>()));

    expect(refresh.calls, isEmpty);
    expect(expired, 0);
  });

  test('requests carry the bearer token', () async {
    String? seen;
    final api = _ScriptedAdapter((o) {
      seen = o.headers['Authorization'] as String?;
      return _json(200, {});
    });
    final dio = buildClient(api, _ScriptedAdapter((o) => _json(200, {})));

    await dio.get<dynamic>('/x');

    expect(seen, 'Bearer old-access');
  });
}
