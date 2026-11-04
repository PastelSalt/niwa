import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:niwa/core/api/api_client.dart';
import 'package:niwa/core/api/api_exception.dart';
import 'package:niwa/core/api/refresh_token_store.dart';
import 'package:niwa/core/models/models.dart';

import 'support/fake_server.dart';

void main() {
  late FakeServer server;
  late MemoryRefreshTokenStore store;
  late ApiClient api;

  setUp(() {
    server = FakeServer();
    store = MemoryRefreshTokenStore();
    api = ApiClient(
      baseUrl: 'http://api.test/api/v1/',
      refreshTokens: store,
      adapter: server,
    );
  });
  tearDown(() => api.close());

  Future<void> signIn() =>
      api.login(email: 'me@example.com', password: 'correct horse battery');

  group('requests', () {
    test('send X-Client: mobile, a request id and JSON', () async {
      await signIn();
      final r = server.requests.single;
      expect(r.baseUrl, 'http://api.test/api/v1');
      expect(r.headers['X-Client'], 'mobile');
      expect(r.headers['X-Request-Id'], matches(RegExp(r'^[0-9a-f]{16}$')));
      expect(r.method, 'POST');
    });

    test('authenticated calls carry the bearer token', () async {
      await signIn();
      await api.request('GET', '/items', query: {'tag': 'x', 'type': null});
      final r = server.requests.last;
      expect(r.headers['Authorization'], 'Bearer a1');
      expect(r.queryParameters, {'tag': 'x'});
    });

    test('204 decodes to null', () async {
      await signIn();
      server.routes['/thing'] = (_) => ResponseBody.fromString('', 204);
      expect(await api.request('DELETE', '/thing'), isNull);
    });
  });

  group('session', () {
    test('login stores the refresh token and emits the session', () async {
      final emitted = expectLater(
        api.sessionChanges,
        emits(isA<Session>().having((s) => s.user.email, 'email', 'me@x')),
      );
      FakeServer.user['email'] = 'me@x';
      addTearDown(() => FakeServer.user['email'] = 'me@example.com');
      await signIn();
      await emitted;
      expect(await store.read(), 'r1');
      expect(api.session?.accessToken, 'a1');
    });

    test('restoreSession uses the stored refresh token', () async {
      await signIn();
      final restored = ApiClient(
        baseUrl: 'http://api.test/api/v1',
        refreshTokens: store,
        adapter: server,
      );
      addTearDown(restored.close);
      final session = await restored.restoreSession();
      expect(session?.accessToken, 'a2');
      expect(await store.read(), 'r2');
    });

    test('without a stored token, requests fail as signed out', () async {
      await expectLater(
        api.request('GET', '/items'),
        throwsA(
          isA<ApiException>()
              .having((e) => e.status, 'status', 401)
              .having((e) => e.code, 'code', ErrorCode.unauthorized),
        ),
      );
      expect(server.requests, isEmpty);
    });

    test('logout revokes on the server and clears locally', () async {
      await signIn();
      await api.logout();
      final r = server.requests.last;
      expect(r.path, '/auth/logout');
      expect(r.data, {'refreshToken': 'r1'});
      expect(api.session, isNull);
      expect(await store.read(), isNull);
    });

    test('logout signs out locally even when offline', () async {
      await signIn();
      server.routes['/auth/logout'] = (o) => throw const SocketException('x');
      await expectLater(api.logout(), throwsA(isA<OfflineException>()));
      expect(api.session, isNull);
      expect(await store.read(), isNull);
    });
  });

  group('refresh on 401', () {
    test('rotates the refresh token and retries once', () async {
      await signIn();
      server.expireAccess();
      final user = await api.me();
      expect(user.email, 'me@example.com');
      expect(server.count('/auth/refresh'), 1);
      expect(server.count('/auth/me'), 2);
      expect(await store.read(), 'r2');
      expect(api.session?.accessToken, 'a2');
    });

    test('concurrent 401s share a single refresh', () async {
      await signIn();
      server.expireAccess();
      final results = await Future.wait([
        for (var i = 0; i < 5; i++) api.request('GET', '/items/$i'),
      ]);
      expect(results, hasLength(5));
      expect(server.count('/auth/refresh'), 1);
      expect(await store.read(), 'r2');
    });

    test('a reused refresh token signs out', () async {
      await signIn();
      // Another device (or an attacker) already rotated r1.
      server.refreshTokens['r1'] = false;
      server.expireAccess();
      final signedOut = expectLater(api.sessionChanges, emits(isNull));

      await expectLater(
        api.request('GET', '/items'),
        throwsA(isA<ApiException>().having((e) => e.status, 'status', 401)),
      );
      await signedOut;
      expect(api.session, isNull);
      expect(await store.read(), isNull);
      expect(server.count('/items'), 1);
    });

    test('a 401 after a successful refresh is not retried again', () async {
      await signIn();
      server.routes['/items'] = (_) => FakeServer.error(401, 'UNAUTHORIZED');
      await expectLater(
        api.request('GET', '/items'),
        throwsA(isA<ApiException>()),
      );
      expect(server.count('/items'), 2);
      expect(server.count('/auth/refresh'), 1);
    });

    test('a server error during refresh keeps the session', () async {
      await signIn();
      server
        ..expireAccess()
        ..routes['/auth/refresh'] = (_) =>
            FakeServer.error(500, 'INTERNAL_ERROR');
      await expectLater(
        api.request('GET', '/items'),
        throwsA(isA<ApiException>().having((e) => e.status, 'status', 500)),
      );
      expect(await store.read(), 'r1');
    });
  });

  group('errors', () {
    setUp(signIn);

    test('envelope → ApiException with code, details and request id', () async {
      server.routes['/items/1'] = (_) =>
          FakeServer.error(409, 'VERSION_CONFLICT', {'currentVersion': 4});
      await expectLater(
        api.request('PATCH', '/items/1', body: {'version': 3}),
        throwsA(
          isA<ApiException>()
              .having((e) => e.status, 'status', 409)
              .having((e) => e.code, 'code', ErrorCode.versionConflict)
              .having((e) => e.details, 'details', {'currentVersion': 4})
              .having((e) => e.requestId, 'requestId', 'req-1'),
        ),
      );
    });

    test('429 carries Retry-After', () async {
      server.routes['/auth/login'] = (_) => FakeServer.json(
        429,
        {
          'error': {'code': 'RATE_LIMITED', 'message': 'Slow down'},
        },
        headers: {
          'retry-after': ['30'],
        },
      );
      await expectLater(
        signIn(),
        throwsA(
          isA<ApiException>()
              .having((e) => e.code, 'code', ErrorCode.rateLimited)
              .having(
                (e) => e.retryAfter,
                'retryAfter',
                const Duration(seconds: 30),
              ),
        ),
      );
    });

    test('a non-envelope 502 becomes UPSTREAM_ERROR', () async {
      server.routes['/items'] = (_) => ResponseBody.fromString(
        '<html>Bad gateway</html>',
        502,
        headers: {
          Headers.contentTypeHeader: ['text/html'],
        },
      );
      await expectLater(
        api.request('GET', '/items'),
        throwsA(
          isA<ApiException>()
              .having((e) => e.code, 'code', ErrorCode.upstreamError)
              .having((e) => e.message, 'message', contains('HTTP 502')),
        ),
      );
    });

    test('an unknown error code still maps', () async {
      server.routes['/items'] = (_) => FakeServer.error(418, 'BRAND_NEW_CODE');
      await expectLater(
        api.request('GET', '/items'),
        throwsA(
          isA<ApiException>().having((e) => e.code, 'code', ErrorCode.unknown),
        ),
      );
    });

    test('no connection → OfflineException', () async {
      server.routes['/items'] = (_) => throw const SocketException('down');
      await expectLater(
        api.request('GET', '/items'),
        throwsA(
          isA<OfflineException>().having((e) => e.timedOut, 'timedOut', false),
        ),
      );
    });

    test('timeout → OfflineException(timedOut)', () async {
      server.routes['/items'] = (o) => throw DioException(
        requestOptions: o,
        type: DioExceptionType.receiveTimeout,
      );
      await expectLater(
        api.request('GET', '/items'),
        throwsA(
          isA<OfflineException>().having((e) => e.timedOut, 'timedOut', true),
        ),
      );
    });
  });
}
