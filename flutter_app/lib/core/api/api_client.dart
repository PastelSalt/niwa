import 'dart:async';
import 'dart:io';
import 'dart:math';

import 'package:dio/dio.dart';
import 'package:niwa/core/api/api_exception.dart';
import 'package:niwa/core/api/refresh_token_store.dart';
import 'package:niwa/core/models/models.dart';

typedef Json = Map<String, dynamic>;

/// Signed-in state. The access token lives in memory only (specs §12.1).
class Session {
  const new({
    required this.accessToken,
    required this.user,
    required this.expiresAt,
  });

  final String accessToken;
  final User user;

  /// When the access token stops working (from `expiresIn`).
  final DateTime expiresAt;
}

/// HTTP client for the NIWA API — the Dart counterpart of `@niwa/api-client`.
///
/// Sends `X-Client: mobile`, so auth responses carry the refresh token in the
/// body; it goes to [RefreshTokenStore]. On a 401 it refreshes once and
/// retries once; concurrent 401s share a single refresh call (single-flight).
/// A rejected refresh token (expired, revoked or reused) signs the user out.
class ApiClient {
  new({
    required String baseUrl,
    required this._refreshTokens,
    HttpClientAdapter? adapter,
    DateTime Function()? clock,
  }) : _clock = clock ?? DateTime.now,
       _dio = Dio(
         BaseOptions(
           baseUrl: baseUrl.endsWith('/')
               ? baseUrl.substring(0, baseUrl.length - 1)
               : baseUrl,
           connectTimeout: const Duration(seconds: 15),
           // Render's free tier can take ~50 s to wake (OPS.md).
           receiveTimeout: const Duration(seconds: 60),
           sendTimeout: const Duration(seconds: 30),
           headers: {'Accept': 'application/json', 'X-Client': 'mobile'},
           // Status handling is ours: errors become ApiException below.
           validateStatus: (_) => true,
         ),
       ) {
    if (adapter != null) _dio.httpClientAdapter = adapter;
  }

  final Dio _dio;
  final RefreshTokenStore _refreshTokens;
  final DateTime Function() _clock;
  // Sync, so listeners (the session provider) see a change before the call
  // that caused it returns — e.g. `await login()` then read the state.
  final _sessions = StreamController<Session?>.broadcast(sync: true);
  final _random = Random.secure();

  Session? _session;
  Future<Session?>? _refreshing;

  Session? get session => _session;

  /// Emits on every sign-in, token refresh and sign-out (`null`).
  Stream<Session?> get sessionChanges => _sessions.stream;

  void _setSession(Session? next) {
    _session = next;
    _sessions.add(next);
  }

  String _requestId() =>
      List.generate(16, (_) => _random.nextInt(16).toRadixString(16)).join();

  /// One HTTP exchange, no auth handling. Returns the decoded body (null for
  /// 204) or throws [ApiException] / [OfflineException].
  Future<Object?> _send(
    String method,
    String path, {
    Object? body,
    Map<String, Object?>? query,
    String? accessToken,
  }) async {
    final Response<Object?> res;
    try {
      res = await _dio.request<Object?>(
        path,
        data: body,
        queryParameters: {
          for (final MapEntry(:key, :value) in (query ?? const {}).entries)
            if (value != null) key: '$value',
        },
        options: Options(
          method: method,
          headers: {
            'X-Request-Id': _requestId(),
            if (accessToken != null) 'Authorization': 'Bearer $accessToken',
          },
        ),
      );
    } on DioException catch (e) {
      throw _offlineOr(e);
    }

    final status = res.statusCode ?? 0;
    if (status == 204) return null;
    if (status >= 200 && status < 300) return res.data;
    throw _apiException(res);
  }

  Exception _offlineOr(DioException e) => switch (e.type) {
    DioExceptionType.connectionTimeout ||
    DioExceptionType.sendTimeout ||
    DioExceptionType.receiveTimeout => const OfflineException(
      'The NIWA server took too long to answer.',
      timedOut: true,
    ),
    DioExceptionType.connectionError => const OfflineException(
      'No connection to the NIWA server.',
    ),
    DioExceptionType.unknown when e.error is SocketException =>
      const OfflineException('No connection to the NIWA server.'),
    _ => e,
  };

  ApiException _apiException(Response<Object?> res) {
    final status = res.statusCode ?? 0;
    final retryAfter = int.tryParse(res.headers.value('retry-after') ?? '');
    final requestId = res.headers.value('x-request-id');
    ApiError? error;
    if (res.data case final Json data) {
      try {
        error = ErrorEnvelope.fromJson(data).error;
      } on Object {
        // Not an envelope; fall through to the generic message.
      }
    }
    return ApiException(
      status: status,
      code:
          error?.code ??
          (status >= 500 ? ErrorCode.upstreamError : ErrorCode.internalError),
      message:
          error?.message ??
          (status >= 500
              ? 'The NIWA server is unavailable right now (HTTP $status). '
                    'Try again shortly.'
              : 'Request failed (HTTP $status).'),
      details: error?.details,
      requestId: error?.requestId ?? requestId,
      retryAfter: retryAfter == null ? null : Duration(seconds: retryAfter),
    );
  }

  Future<Session> _acceptAuth(Object? body) async {
    final auth = AuthResponse.fromJson(body! as Json);
    if (auth.refreshToken case final token?) await _refreshTokens.write(token);
    final next = Session(
      accessToken: auth.accessToken,
      user: auth.user,
      expiresAt: _clock().add(Duration(seconds: auth.expiresIn)),
    );
    _setSession(next);
    return next;
  }

  Future<void> _signOutLocally() async {
    await _refreshTokens.write(null);
    _setSession(null);
  }

  /// Single-flight: concurrent callers share one `/auth/refresh` call.
  Future<Session?> refresh() =>
      _refreshing ??= _doRefresh().whenComplete(() => _refreshing = null);

  Future<Session?> _doRefresh() async {
    final token = await _refreshTokens.read();
    if (token == null) {
      _setSession(null);
      return null;
    }
    try {
      return await _acceptAuth(
        await _send('POST', '/auth/refresh', body: {'refreshToken': token}),
      );
    } on ApiException catch (e) {
      if (e.status == 401 || e.status == 403) {
        await _signOutLocally();
        return null;
      }
      rethrow;
    }
  }

  /// Authenticated request: refreshes on 401 and retries once.
  Future<Object?> request(
    String method,
    String path, {
    Object? body,
    Map<String, Object?>? query,
  }) async {
    var token = _session?.accessToken ?? (await refresh())?.accessToken;
    if (token == null) {
      throw const ApiException(
        status: 401,
        code: ErrorCode.unauthorized,
        message: 'Not signed in.',
      );
    }
    try {
      return await _send(
        method,
        path,
        body: body,
        query: query,
        accessToken: token,
      );
    } on ApiException catch (e) {
      if (e.status != 401) rethrow;
      token = (await refresh())?.accessToken;
      if (token == null) rethrow;
      return await _send(
        method,
        path,
        body: body,
        query: query,
        accessToken: token,
      );
    }
  }

  /// Unauthenticated request (health, public endpoints).
  Future<Object?> anonymous(String method, String path, {Object? body}) =>
      _send(method, path, body: body);

  // ---- Auth (specs §12.1) ----

  /// Call once at launch: restores the session from the stored refresh token.
  Future<Session?> restoreSession() => refresh();

  Future<Session> register({required String email, required String password}) =>
      _send(
        'POST',
        '/auth/register',
        body: {'email': email, 'password': password},
      ).then(_acceptAuth);

  Future<Session> login({required String email, required String password}) =>
      _send(
        'POST',
        '/auth/login',
        body: {'email': email, 'password': password},
      ).then(_acceptAuth);

  /// Revokes the refresh token on the server when reachable; always signs out
  /// locally.
  Future<void> logout() async {
    final token = await _refreshTokens.read();
    try {
      await _send(
        'POST',
        '/auth/logout',
        body: {'refreshToken': ?token},
        accessToken: _session?.accessToken,
      );
    } finally {
      await _signOutLocally();
    }
  }

  Future<User> me() async {
    final body = await request('GET', '/auth/me');
    return User.fromJson((body! as Json)['user'] as Json);
  }

  void close() {
    _dio.close(force: true);
    unawaited(_sessions.close());
  }
}
