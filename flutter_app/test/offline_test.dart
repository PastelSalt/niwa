import 'dart:async';
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:niwa/core/api/api_exception.dart';
import 'package:niwa/core/api/refresh_token_store.dart';
import 'package:niwa/core/db/app_database.dart';
import 'package:niwa/core/db/cached.dart';
import 'package:niwa/core/db/db_providers.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/net/network_status.dart';
import 'package:niwa/core/util/uuid.dart';
import 'package:niwa/features/capture/data/capture_queue.dart';

import 'support/fake_server.dart';
import 'support/fake_workspace.dart';
import 'support/test_app.dart';

void main() {
  group('AppDatabase', () {
    late AppDatabase db;
    setUp(() => db = AppDatabase(NativeDatabase.memory()));
    tearDown(() => db.close());

    test('cache round-trips JSON and overwrites by key', () async {
      expect(await db.readCache('tree'), isNull);
      await db.writeCache('tree', [
        {'id': 'a'},
      ]);
      await db.writeCache('tree', [
        {'id': 'b'},
      ]);
      expect(await db.readCache('tree'), [
        {'id': 'b'},
      ]);
    });

    test('outbox keeps insertion order; attempts and failures', () async {
      for (final t in ['one', 'two', 'three']) {
        await db.enqueue(clientId: uuidV4(), title: t, type: 'idea');
      }
      var rows = await db.outboxEntries();
      expect(rows.map((r) => r.title), ['one', 'two', 'three']);

      await db.markAttempt(rows[1].id, failedMessage: 'Too long');
      await db.markAttempt(rows[0].id);
      rows = await db.outboxEntries();
      expect((rows[0].attempts, rows[0].failedMessage), (1, null));
      expect((rows[1].attempts, rows[1].failedMessage), (1, 'Too long'));

      await db.clearFailure(rows[1].id);
      expect((await db.outboxEntries())[1].failedMessage, isNull);
    });

    test('wipe clears cache and outbox', () async {
      await db.writeCache('x', 1);
      await db.enqueue(clientId: uuidV4(), title: 't', type: 'idea');
      await db.wipe();
      expect(await db.readCache('x'), isNull);
      expect(await db.outboxEntries(), isEmpty);
    });

    test('a fresh database has every table', () async {
      expect(db.schemaVersion, 4);
      final tables = await db
          .customSelect("SELECT name FROM sqlite_master WHERE type='table'")
          .map((r) => r.read<String>('name'))
          .get();
      expect(
        tables,
        containsAll(['cache_entries', 'outbox', 'reminders', 'preferences']),
      );
    });
  });

  test('uuidV4 is a valid version-4 UUID', () {
    final re = RegExp(
      r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    );
    final ids = {for (var i = 0; i < 100; i++) uuidV4()};
    expect(ids, hasLength(100));
    expect(ids.every(re.hasMatch), isTrue);
  });

  group('cachedThenFresh', () {
    late ProviderContainer c;
    late AppDatabase db;
    var fetch = () async => 0;

    final probe = StreamProvider<int>(
      (ref) => cachedThenFresh<int>(
        ref,
        key: 'n',
        fetch: () => fetch(),
        decode: (j) => j! as int,
        encode: (v) => v,
      ),
    );

    setUp(() {
      db = AppDatabase(NativeDatabase.memory());
      c = ProviderContainer(
        overrides: [
          appDatabaseProvider.overrideWithValue(db),
          connectivityChangesProvider.overrideWithValue(const Stream.empty()),
        ],
        retry: (_, _) => null,
      );
    });
    tearDown(() async {
      c.dispose();
      await db.close();
    });

    Future<List<int>> values() async {
      final seen = <int>[];
      final done = Completer<void>();
      c.listen(probe, (_, next) {
        if (next case AsyncData(:final value)) seen.add(value);
        if (next is AsyncError && !done.isCompleted) done.complete();
      }, fireImmediately: true);
      await Future<void>.delayed(const Duration(milliseconds: 50));
      return seen;
    }

    test('cached first, then fresh (and saved)', () async {
      await db.writeCache('n', 1);
      fetch = () async => 2;
      expect(await values(), [1, 2]);
      expect(await db.readCache('n'), 2);
      expect(c.read(networkStatusProvider), isTrue);
    });

    test('offline with a cached copy keeps it and reports offline', () async {
      await db.writeCache('n', 1);
      fetch = () => throw const OfflineException('x');
      expect(await values(), [1]);
      expect(c.read(probe).value, 1);
      expect(c.read(networkStatusProvider), isFalse);
    });

    test('offline with nothing cached is an error', () async {
      fetch = () => throw const OfflineException('x');
      await values();
      expect(c.read(probe).hasError, isTrue);
    });
  });

  group('airplane mode', () {
    late FakeServer server;
    late FakeWorkspace ws;
    late AppDatabase db;
    late MemoryRefreshTokenStore store;
    late StreamController<List<ConnectivityResult>> net;

    setUp(() {
      ws = FakeWorkspace();
      server = FakeServer()..workspace = ws;
      db = AppDatabase(NativeDatabase.memory());
      store = MemoryRefreshTokenStore();
      net = StreamController.broadcast();
    });
    tearDown(() async {
      await net.close();
      await db.close();
    });

    Future<void> tap(WidgetTester tester, Finder f) async {
      await tester.ensureVisible(f);
      await tester.tap(f);
      await tester.pumpAndSettle();
    }

    Future<void> logInOnline(WidgetTester tester) async {
      await pumpApp(
        tester,
        server: server,
        store: store,
        db: db,
        connectivity: net.stream,
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Email'),
        'me@example.com',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Password'),
        'pw',
      );
      await tester.tap(find.widgetWithText(FilledButton, 'Log in'));
      await tester.pumpAndSettle();
    }

    Future<void> capture(WidgetTester tester, String title) async {
      await tap(tester, find.byTooltip('Capture'));
      await tester.enterText(find.byType(TextField).last, title);
      await tester.pump();
      await tap(tester, find.text('Save to Inbox'));
    }

    Finder badge(String n) => find.descendant(
      of: find.descendant(
        of: find.byType(NavigationBar),
        matching: find.byType(Badge),
      ),
      matching: find.text(n),
    );

    testWidgets('open offline → browse cache → capture 3 → reconnect → '
        'all 3 appear once, in order', (tester) async {
      final college = ws.add('College');
      ws.add(
        'CS 301 notes',
        parent: college,
        content: {
          'type': 'doc',
          'content': [
            {
              'type': 'paragraph',
              'content': [
                {'type': 'text', 'text': 'Dijkstra is greedy.'},
              ],
            },
          ],
        },
      );

      // Online once: browsing fills the cache.
      await logInOnline(tester);
      await tap(tester, find.text('College'));
      await tap(tester, find.text('CS 301 notes'));
      expect(find.text('Dijkstra is greedy.'), findsOneWidget);

      // Airplane mode, then the app is reopened.
      server.offline = true;
      await pumpApp(
        tester,
        server: server,
        store: store,
        db: db,
        connectivity: net.stream,
      );
      expect(find.text('Nothing planted yet'), findsNothing);
      expect(find.text('College'), findsOneWidget, reason: 'cached tree');
      expect(
        find.text('Offline — showing saved data. Captures will sync.'),
        findsOneWidget,
      );
      await tap(tester, find.text('College'));
      await tap(tester, find.text('CS 301 notes'));
      expect(find.text('Dijkstra is greedy.'), findsOneWidget);

      // Edits are blocked with a clear message; capture isn't.
      await tester.pageBack();
      await tester.pumpAndSettle();
      await tester.longPress(find.widgetWithText(ListTile, 'CS 301 notes'));
      await tester.pumpAndSettle();
      await tap(tester, find.text('Archive'));
      expect(
        find.text(
          "You're offline — changes need a connection. Capture still works.",
        ),
        findsOneWidget,
      );

      for (final t in ['First', 'Second', 'Third']) {
        await capture(tester, t);
      }
      expect(
        find.text("Captured to Inbox — it'll sync when you're back online"),
        findsOneWidget,
      );
      expect(badge('3'), findsOneWidget);
      await tap(
        tester,
        find.descendant(
          of: find.byType(NavigationBar),
          matching: find.text('Inbox'),
        ),
      );
      expect(find.text('Waiting to sync'), findsNWidgets(3));

      // Back online: the OS reports a network, /health answers, queue drains.
      server.offline = false;
      net.add([ConnectivityResult.wifi]);
      await tester.pumpAndSettle();

      final posts = server.requests.where(
        (r) => r.path == '/inbox' && r.method == 'POST',
      );
      expect(posts.map((r) => (r.data as Map)['title']), [
        'First',
        'Second',
        'Third',
      ]);
      final ids = {for (final r in posts) (r.data as Map)['clientId']};
      expect(ids, hasLength(3), reason: 'one clientId per capture');
      final inboxTitles = [
        for (final i in ws.items.values)
          if (i['inboxedAt'] != null) i['title'],
      ];
      expect(inboxTitles, ['First', 'Second', 'Third']);
      expect(find.text('Waiting to sync'), findsNothing);
      expect(find.text('First'), findsOneWidget);
      expect(badge('3'), findsOneWidget);
      expect(
        find.text('Offline — showing saved data. Captures will sync.'),
        findsNothing,
      );
      expect(await db.outboxEntries(), isEmpty);
    });

    testWidgets('a lost response is retried without a duplicate', (
      tester,
    ) async {
      await logInOnline(tester);
      // The server stores the capture, but the reply never arrives.
      var drop = true;
      server.routes['/inbox'] = (o) {
        final response = ws.handle(o)!;
        if (drop && o.method == 'POST') {
          drop = false;
          throw const SocketException('reply lost');
        }
        return response;
      };

      await capture(tester, 'Only once');
      expect(await db.outboxEntries(), hasLength(1));

      net.add([ConnectivityResult.mobile]);
      await tester.pumpAndSettle();
      expect(await db.outboxEntries(), isEmpty);
      final posts = server.requests.where(
        (r) => r.path == '/inbox' && r.method == 'POST',
      );
      expect(posts, hasLength(2));
      expect(
        ws.items.values.where((i) => i['title'] == 'Only once'),
        hasLength(1),
      );
    });

    testWidgets('a server error retries with backoff', (tester) async {
      await logInOnline(tester);
      var failures = 2;
      server.routes['/inbox'] = (o) {
        if (o.method == 'POST' && failures-- > 0) {
          return FakeServer.error(503, 'UPSTREAM_ERROR');
        }
        return ws.handle(o)!;
      };
      // Straight to the queue: the sheet's settle would outlast the backoff.
      unawaited(
        ProviderScope.containerOf(tester.element(find.byType(NavigationBar)))
            .read(captureQueueProvider.notifier)
            .capture(title: 'Eventually', type: ItemType.idea),
      );
      // Small steps (well under the 100 ms backoff) until the first attempt.
      for (var i = 0; i < 20 && failures == 2; i++) {
        await tester.pump(const Duration(milliseconds: 5));
      }
      expect(failures, 1);
      expect(await db.outboxEntries(), hasLength(1));
      // 100 ms base (test override), then 200 ms.
      await tester.pump(const Duration(milliseconds: 150));
      await tester.pump(const Duration(milliseconds: 250));
      await tester.pumpAndSettle();
      expect(await db.outboxEntries(), isEmpty);
      expect(
        ws.items.values.where((i) => i['title'] == 'Eventually'),
        hasLength(1),
      );
    });

    testWidgets('a refused capture can be retried or discarded', (
      tester,
    ) async {
      await logInOnline(tester);
      var refuse = true;
      server.routes['/inbox'] = (o) {
        if (o.method == 'POST' && refuse) {
          return FakeServer.json(400, {
            'error': {
              'code': 'VALIDATION_ERROR',
              'message': 'Title is too long.',
            },
          });
        }
        return ws.handle(o)!;
      };
      await capture(tester, 'Bad one');
      await capture(tester, 'Good one');
      await tap(
        tester,
        find.descendant(
          of: find.byType(NavigationBar),
          matching: find.text('Inbox'),
        ),
      );
      expect(find.text('Title is too long.'), findsNWidgets(2));

      refuse = false;
      await tap(tester, find.widgetWithText(TextButton, 'Retry').last);
      expect(find.text('Good one'), findsOneWidget);
      expect(find.text('Title is too long.'), findsOneWidget);

      await tap(tester, find.widgetWithText(TextButton, 'Discard'));
      expect(find.text('Bad one'), findsNothing);
      expect(await db.outboxEntries(), isEmpty);
    });

    testWidgets('logout warns about unsynced captures, then wipes', (
      tester,
    ) async {
      await logInOnline(tester);
      server.offline = true;
      await capture(tester, 'Pending');
      await tap(tester, find.byTooltip('Account'));
      await tap(tester, find.text('Log out'));
      expect(
        find.text("1 capture hasn't synced yet and will be lost."),
        findsOneWidget,
      );
      await tap(tester, find.text('Cancel'));
      expect(await db.outboxEntries(), hasLength(1));

      await tap(tester, find.byTooltip('Account'));
      await tap(tester, find.text('Log out'));
      await tap(tester, find.text('Log out anyway'));
      expect(find.text('Welcome back'), findsOneWidget);
      expect(await db.outboxEntries(), isEmpty);
      expect(await db.readCache('tree'), isNull);
      expect(await db.readCache('session:user'), isNull);
    });
  });
}
