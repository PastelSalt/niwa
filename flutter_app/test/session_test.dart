import 'dart:io';

import 'package:drift/native.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:niwa/core/api/api_client.dart';
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/api/refresh_token_store.dart';
import 'package:niwa/core/auth/session.dart';
import 'package:niwa/core/db/app_database.dart';
import 'package:niwa/core/db/db_providers.dart';
import 'package:niwa/core/models/models.dart';

import 'support/fake_server.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late FakeServer server;
  late MemoryRefreshTokenStore store;
  late DateTime Function() clock;

  ProviderContainer container() {
    final c = ProviderContainer(
      overrides: [
        appDatabaseProvider.overrideWith((ref) {
          final db = AppDatabase(NativeDatabase.memory());
          ref.onDispose(db.close);
          return db;
        }),
        apiClientProvider.overrideWith((ref) {
          final api = ApiClient(
            baseUrl: 'http://api.test/api/v1',
            refreshTokens: store,
            adapter: server,
            clock: () => clock(),
          );
          ref.onDispose(api.close);
          return api;
        }),
      ],
    );
    addTearDown(c.dispose);
    return c;
  }

  /// Reads the session and waits until it leaves [SessionUnknown].
  Future<SessionState> settled(ProviderContainer c) async {
    for (var i = 0; i < 50; i++) {
      if (c.read(sessionProvider) is! SessionUnknown) break;
      await Future<void>.delayed(Duration.zero);
    }
    final state = c.read(sessionProvider);
    return state;
  }

  setUp(() {
    server = FakeServer();
    store = MemoryRefreshTokenStore();
    clock = DateTime.now;
  });

  test('no stored token → signed out', () async {
    expect(await settled(container()), isA<SignedOut>());
    expect(server.requests, isEmpty);
  });

  test('a stored token restores the session at launch', () async {
    server.issue(); // mints r1
    await store.write('r1');
    final state = await settled(container());
    expect(
      state,
      isA<SignedIn>().having((s) => s.user.email, 'email', 'me@example.com'),
    );
    expect(await store.read(), 'r2');
  });

  test('login and logout drive the state', () async {
    final c = container();
    await settled(c);
    await c
        .read(sessionProvider.notifier)
        .login(email: 'me@example.com', password: 'x' * 12);
    expect(c.read(sessionProvider), isA<SignedIn>());

    await c.read(sessionProvider.notifier).logout();
    expect(c.read(sessionProvider), isA<SignedOut>());
    expect(await store.read(), isNull);
  });

  test('refresh-token reuse while signed in → signed out', () async {
    final c = container();
    await settled(c);
    await c
        .read(sessionProvider.notifier)
        .login(email: 'me@example.com', password: 'x' * 12);
    server
      ..refreshTokens['r1'] = false
      ..expireAccess();

    await expectLater(
      c.read(apiClientProvider).request('GET', '/items'),
      throwsA(anything),
    );
    expect(c.read(sessionProvider), isA<SignedOut>());
  });

  test('offline at launch → unavailable, then retry succeeds', () async {
    server.issue();
    await store.write('r1');
    server.routes['/auth/refresh'] = (_) => throw const SocketException('x');

    final c = container();
    expect(await settled(c), isA<SessionUnavailable>());
    expect(await store.read(), 'r1', reason: 'token kept for the retry');

    server.routes.remove('/auth/refresh');
    await c.read(sessionProvider.notifier).restore();
    expect(c.read(sessionProvider), isA<SignedIn>());
  });

  test('server error at launch keeps the token (not signed out)', () async {
    server.issue();
    await store.write('r1');
    server.routes['/auth/refresh'] = (_) =>
        FakeServer.error(503, 'UPSTREAM_ERROR');
    final state = await settled(container());
    expect(
      state,
      isA<SessionUnavailable>().having((s) => s.error, 'error', isA<Object>()),
    );
    expect(await store.read(), 'r1');
  });

  group('refresh on resume', () {
    test('needsRefresh uses a one-minute margin', () {
      final now = DateTime.utc(2026, 11, 4, 12);
      Session at(Duration left) => Session(
        accessToken: 'a',
        user: User.fromJson(FakeServer.user),
        expiresAt: now.add(left),
      );
      expect(needsRefresh(at(const Duration(minutes: 5)), now), isFalse);
      expect(needsRefresh(at(const Duration(seconds: 30)), now), isTrue);
      expect(needsRefresh(at(-const Duration(minutes: 1)), now), isTrue);
    });

    test('refreshes when the token is about to expire', () async {
      final c = container();
      await settled(c);
      // Token issued 15 min ago with a 15-min lifetime → expiring now.
      clock = () => DateTime.now().subtract(const Duration(minutes: 15));
      await c
          .read(sessionProvider.notifier)
          .login(email: 'me@example.com', password: 'x' * 12);

      await c.read(sessionProvider.notifier).onResume();
      expect(server.count('/auth/refresh'), 1);
    });

    test('does nothing while the token is fresh', () async {
      final c = container();
      await settled(c);
      await c
          .read(sessionProvider.notifier)
          .login(email: 'me@example.com', password: 'x' * 12);
      await c.read(sessionProvider.notifier).onResume();
      expect(server.count('/auth/refresh'), 0);
    });

    test('an offline refresh on resume is swallowed', () async {
      final c = container();
      await settled(c);
      clock = () => DateTime.now().subtract(const Duration(minutes: 15));
      await c
          .read(sessionProvider.notifier)
          .login(email: 'me@example.com', password: 'x' * 12);
      server.routes['/auth/refresh'] = (_) => throw const SocketException('x');
      await c.read(sessionProvider.notifier).onResume();
      expect(c.read(sessionProvider), isA<SignedIn>());
    });
  });
}
