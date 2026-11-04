import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:dio/dio.dart';

import 'fake_workspace.dart';

/// A tiny in-memory NIWA auth server behind Dio's adapter: rotating refresh
/// tokens with reuse detection, like the backend (specs §12.1).
class FakeServer implements HttpClientAdapter {
  final requests = <RequestOptions>[];

  /// Access tokens the server currently accepts.
  final validAccess = <String>{};

  /// Refresh token → still unused.
  final refreshTokens = <String, bool>{};
  int _n = 0;

  /// Overrides for specific paths (status, body, headers) or errors.
  final routes = <String, FutureOr<ResponseBody> Function(RequestOptions)>{};

  /// Simulates no connection: every request fails like a dropped network.
  bool offline = false;

  /// When set, item/tree/Focus/Inbox endpoints are served from it.
  FakeWorkspace? workspace;

  int count(String path) => requests.where((r) => r.path == path).length;

  static final Map<String, Object> user = {
    'id': '6745f0c2a1b2c3d4e5f60700',
    'email': 'me@example.com',
    'workspaceId': '6745f0c2a1b2c3d4e5f60701',
    'aiEnabled': false,
    'hasAiKey': false,
    'createdAt': '2026-10-30T12:00:00.000Z',
  };

  static ResponseBody json(
    int status,
    Object? body, {
    Map<String, List<String>> headers = const {},
  }) => ResponseBody.fromString(
    jsonEncode(body),
    status,
    headers: {
      Headers.contentTypeHeader: [Headers.jsonContentType],
      ...headers,
    },
  );

  static ResponseBody error(int status, String code, [Object? details]) =>
      json(status, {
        'error': {
          'code': code,
          'message': 'msg $code',
          'details': ?details,
          'requestId': 'req-1',
        },
      });

  /// Mints a fresh access + refresh token pair.
  ResponseBody issue() {
    _n++;
    final access = 'a$_n';
    final refresh = 'r$_n';
    validAccess.add(access);
    refreshTokens[refresh] = true;
    return json(200, {
      'accessToken': access,
      'expiresIn': 900,
      'refreshToken': refresh,
      'user': user,
    });
  }

  /// Simulates access-token expiry.
  void expireAccess() => validAccess.clear();

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    if (offline) throw const SocketException('offline (test)');
    requests.add(options);
    // Let concurrent callers interleave, as real I/O would.
    await Future<void>.delayed(Duration.zero);

    if (routes[options.path] case final handler?) return await handler(options);

    final body = options.data is Map
        ? options.data as Map<String, dynamic>
        : const <String, dynamic>{};
    switch (options.path) {
      case '/auth/login' || '/auth/register':
        return issue();
      case '/auth/refresh':
        final token = body['refreshToken'] as String?;
        final unused = refreshTokens[token];
        if (unused == null) return error(401, 'UNAUTHORIZED');
        if (!unused) {
          // Reuse of a rotated token: the whole family is revoked.
          refreshTokens.updateAll((_, _) => false);
          return error(401, 'UNAUTHORIZED');
        }
        refreshTokens[token!] = false;
        return issue();
      case '/auth/logout':
        return ResponseBody.fromString('', 204);
    }

    final auth = options.headers['Authorization'] as String?;
    if (auth == null || !validAccess.contains(auth.substring(7))) {
      return error(401, 'UNAUTHORIZED');
    }
    if (workspace?.handle(options) case final response?) return response;
    return switch (options.path) {
      '/auth/me' => json(200, {'user': user}),
      _ => json(200, {'ok': true, 'path': options.path}),
    };
  }

  @override
  void close({bool force = false}) {}
}
