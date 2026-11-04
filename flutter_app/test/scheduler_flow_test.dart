import 'dart:async';
import 'dart:io';

import 'package:drift/drift.dart' show driftRuntimeOptions;
import 'package:drift/native.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/core/db/app_database.dart';
import 'package:niwa/features/scheduler/data/reminders.dart';
import 'package:niwa/features/scheduler/ui/entry_sheet.dart';
import 'package:sqlite3/sqlite3.dart';

import 'support/fake_server.dart';
import 'support/fake_workspace.dart';
import 'support/test_app.dart';

// Mobile versions of web_app/e2e/scheduler.spec.ts (create, move, resize,
// repeat scopes, item block) plus reminders and the DB migration.

void main() {
  late FakeServer server;
  late FakeWorkspace ws;
  late FakeNotifications notifications;

  // A fixed future day: the grid opens at 08:00, so 09:00–12:00 is visible.
  const day = '2030-01-15';
  DateTime at(int h, [int m = 0]) => DateTime(2030, 1, 15, h, m);
  String iso(DateTime t) => t.toUtc().toIso8601String();

  setUp(() {
    ws = FakeWorkspace();
    server = FakeServer()..workspace = ws;
    notifications = FakeNotifications();
  });

  Future<void> tap(WidgetTester tester, Finder f) async {
    await tester.ensureVisible(f);
    await tester.tap(f);
    await tester.pumpAndSettle();
  }

  Future<void> open(WidgetTester tester, String path) async {
    GoRouter.of(tester.element(find.byType(NavigationBar))).go(path);
    await tester.pumpAndSettle();
  }

  Future<void> signIn(WidgetTester tester) =>
      pumpSignedIn(tester, server: server, notifications: notifications);

  Json event(String title, DateTime start, DateTime end, {String? rule}) =>
      ws.createEntry({
        'kind': 'event',
        'title': title,
        'startAt': iso(start),
        'endAt': iso(end),
        'isAllDay': false,
        'recurrence': rule ?? 'none',
        'timeZone': 'Asia/Manila',
      });

  Finder block(String title) => find.bySemanticsLabel(RegExp(title));

  testWidgets('day view: tap a slot to create, drag to move, edge to resize', (
    tester,
  ) async {
    await signIn(tester);
    await open(tester, '/scheduler/day/$day');

    // Tap the 10:00 slot.
    final column = find.bySemanticsLabel('Tuesday, January 15, 2030');
    final top = tester.getTopLeft(column);
    await tester.tapAt(top + const Offset(40, 10 * 56 + 10));
    await tester.pumpAndSettle();
    expect(find.text('New entry'), findsOneWidget);
    final sheet = find.byType(EntrySheet);
    expect(
      find.descendant(of: sheet, matching: find.text('10:00 AM')),
      findsOneWidget,
    );
    expect(
      find.descendant(of: sheet, matching: find.text('11:00 AM')),
      findsOneWidget,
    );
    await tester.enterText(find.widgetWithText(TextField, 'Title'), 'Dentist');
    await tester.pump();
    await tap(tester, find.widgetWithText(FilledButton, 'Save'));

    final created = ws.entries.values.single;
    expect(created['title'], 'Dentist');
    expect(DateTime.parse(created['startAt'] as String), at(10).toUtc());
    final post = server.requests.lastWhere(
      (r) => r.path == '/schedule' && r.method == 'POST',
    );
    expect((post.data as Map)['timeZone'], 'Asia/Manila');
    expect(block('Dentist'), findsOneWidget);

    // Long-press and drag down one hour (56 px = 60 min, 15-min snap).
    final g = await tester.startGesture(tester.getCenter(block('Dentist')));
    await tester.pump(kLongPressTimeout + const Duration(milliseconds: 50));
    await g.moveBy(const Offset(0, 30));
    await g.moveBy(const Offset(0, 26));
    await tester.pump();
    await g.up();
    await tester.pumpAndSettle();
    expect(DateTime.parse(created['startAt'] as String), at(11).toUtc());
    expect(DateTime.parse(created['endAt'] as String), at(12).toUtc());

    // Drag the bottom edge 28 px (= 30 min).
    await tester.drag(
      find.byKey(ValueKey('resize-${created['id']}')),
      const Offset(0, 28),
    );
    await tester.pumpAndSettle();
    expect(DateTime.parse(created['startAt'] as String), at(11).toUtc());
    expect(DateTime.parse(created['endAt'] as String), at(12, 30).toUtc());
  });

  testWidgets('overlapping entries sit side by side', (tester) async {
    event('Standup', at(9), at(10));
    event('Call', at(9, 30), at(10, 30));
    await signIn(tester);
    await open(tester, '/scheduler/day/$day');
    final a = tester.getRect(block('Standup'));
    final b = tester.getRect(block('Call'));
    expect(a.right, lessThanOrEqualTo(b.left + 1));
    expect(a.width, closeTo(b.width, 1));
  });

  testWidgets('month view shows entries; a day opens its day view', (
    tester,
  ) async {
    event('Exam', at(9), at(11));
    ws.createEntry({
      'kind': 'event',
      'title': 'Trip',
      'startAt': '2030-01-20T00:00:00.000Z',
      'endAt': '2030-01-22T00:00:00.000Z',
      'isAllDay': true,
      'recurrence': 'none',
    });
    await signIn(tester);
    await open(tester, '/scheduler/month/$day');
    expect(find.text('January 2030'), findsOneWidget);
    expect(find.text('Exam'), findsOneWidget);
    expect(find.text('Trip'), findsNWidgets(2), reason: 'two calendar days');

    await tap(
      tester,
      find.bySemanticsLabel(RegExp('January 15, 2030, 1 entry')),
    );
    expect(find.text('Tue, Jan 15'), findsOneWidget); // day view title
    expect(block('Exam'), findsOneWidget);

    // Week view lists 7 days.
    await tap(tester, find.text('Week'));
    expect(find.text('Jan 14 – Jan 20'), findsOneWidget);
  });

  testWidgets('repeat scopes: this event vs this and following', (
    tester,
  ) async {
    event('Gym', at(9), at(10), rule: 'weekly');
    await signIn(tester);
    final second = ws.entries.values.firstWhere((e) => e['seriesIndex'] == 1);
    await open(tester, '/scheduler/day/2030-01-22');

    // Rename just this one.
    await tap(tester, block('Gym'));
    expect(find.text('This event'), findsOneWidget);
    await tester.enterText(
      find.widgetWithText(TextField, 'Title'),
      'Gym (late)',
    );
    await tester.pump();
    await tap(tester, find.widgetWithText(FilledButton, 'Save'));
    expect(second['title'], 'Gym (late)');
    final titles = ws.entries.values.map((e) => e['title']).toSet();
    expect(titles, {'Gym', 'Gym (late)'});
    final patch = server.requests.lastWhere((r) => r.method == 'PATCH');
    expect(patch.queryParameters['scope'], 'instance');
    expect((patch.data as Map).containsKey('recurrence'), isFalse);

    // Delete this and following from the third week.
    await open(tester, '/scheduler/day/2030-01-29');
    await tap(tester, block('Gym'));
    await tap(tester, find.text('This and following'));
    await tap(tester, find.text('Delete this and following'));
    expect(find.text('Deleted this and following'), findsOneWidget);
    final left = ws.entries.values.map((e) => e['seriesIndex']).toList()
      ..sort();
    expect(left, [0, 1]);
  });

  testWidgets('schedule time from an item; the block shows its live title', (
    tester,
  ) async {
    final task = ws.add('Write essay', type: 'task', id: 't');
    await signIn(tester);
    await open(tester, '/actionable/$task');
    await tap(tester, find.widgetWithText(TextButton, 'Schedule time'));
    expect(find.text('Write essay'), findsWidgets); // the chosen item
    // Pick a day and time: move the start to 2030-01-15 09:00 via the sheet.
    await tap(tester, find.widgetWithText(FilledButton, 'Save'));
    final created = ws.entries.values.single;
    expect(created['kind'], 'block');
    expect(created['itemId'], 't');
    expect(find.text('No time blocked yet.'), findsNothing);
    expect(find.byIcon(Icons.schedule), findsOneWidget);

    // Put it on the fixed day: blocks have no title of their own and show
    // the item's.
    created
      ..['startAt'] = iso(at(9))
      ..['endAt'] = iso(at(10));
    expect(created['title'], '');
    await open(tester, '/scheduler/day/$day');
    expect(block('Write essay'), findsOneWidget);
  });

  testWidgets('reminders: on schedules a notification, off clears it', (
    tester,
  ) async {
    final e = event('Flight', at(9), at(12));
    await signIn(tester);
    await open(tester, '/scheduler/day/$day');
    await tap(tester, block('Flight'));
    await tap(tester, find.text('Remind me'));
    await tap(tester, find.widgetWithText(FilledButton, 'Save'));
    expect(notifications.permissionRequests, 1);
    // The sync window is 14 days from now; 2030 is beyond it, so sync with
    // a "now" a day earlier to see it planned.
    unawaited(
      ProviderScope.containerOf(tester.element(find.byType(NavigationBar)))
          .read(reminderServiceProvider.notifier)
          .sync(now: at(9).subtract(const Duration(days: 1))),
    );
    await tester.pumpAndSettle();
    expect(notifications.scheduled, hasLength(1));
    expect(
      notifications.scheduled.single.fireAt.isAtSameMomentAs(at(8, 50)),
      isTrue,
    );
    expect(notifications.scheduled.single.title, 'Flight');

    await tap(tester, block('Flight'));
    await tap(tester, find.text('Remind me'));
    await tap(tester, find.widgetWithText(FilledButton, 'Save'));
    expect(notifications.scheduled, isEmpty);
    expect(e['id'], isNotNull);
  });

  testWidgets('a refused notification permission keeps reminders off', (
    tester,
  ) async {
    notifications.permission = false;
    event('Flight', at(9), at(12));
    await signIn(tester);
    await open(tester, '/scheduler/day/$day');
    await tap(tester, block('Flight'));
    await tap(tester, find.text('Remind me'));
    await tap(tester, find.widgetWithText(FilledButton, 'Save'));
    expect(notifications.scheduled, isEmpty);
  });

  testWidgets('offline: the cached calendar shows; changes are refused', (
    tester,
  ) async {
    event('Seminar', at(9), at(10));
    await signIn(tester);
    await open(tester, '/scheduler/day/$day');
    expect(block('Seminar'), findsOneWidget);

    server.offline = true;
    await open(tester, '/scheduler/day/2030-01-16');
    await open(tester, '/scheduler/day/$day');
    expect(block('Seminar'), findsOneWidget, reason: 'from the cache');

    await tap(tester, block('Seminar'));
    await tap(tester, find.widgetWithText(FilledButton, 'Save'));
    expect(
      find.text(
        "You're offline — changes need a connection. Capture still works.",
      ),
      findsOneWidget,
    );
  });

  test(
    'schema v1 → v4 keeps the outbox; adds reminders, details, prefs',
    () async {
      driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;
      final dir = Directory.systemTemp.createTempSync('niwa_db');
      addTearDown(() => dir.deleteSync(recursive: true));
      final file = File('${dir.path}/niwa.sqlite');

      // A database exactly as MA5 (schema v1) left it, with a pending capture.
      sqlite3.open(file.path)
        ..execute(
          'CREATE TABLE cache_entries (key TEXT NOT NULL PRIMARY KEY, '
          'json TEXT NOT NULL, saved_at INTEGER NOT NULL);',
        )
        ..execute(
          'CREATE TABLE outbox (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, '
          'client_id TEXT NOT NULL UNIQUE, title TEXT NOT NULL, '
          'type TEXT NOT NULL, created_at INTEGER NOT NULL, '
          'attempts INTEGER NOT NULL DEFAULT 0, failed_message TEXT NULL);',
        )
        ..execute(
          'INSERT INTO outbox (client_id, title, type, created_at) '
          "VALUES ('c1', 'Kept across the upgrade', 'idea', 0);",
        )
        ..execute('PRAGMA user_version = 1;')
        ..close();

      final db = AppDatabase(NativeDatabase(file));
      addTearDown(db.close);
      final kept = (await db.outboxEntries()).single;
      expect(kept.title, 'Kept across the upgrade');
      expect((kept.body, kept.suggestedParentId), (null, null)); // v3 columns
      await db.setReminder('entry:e1', 10);
      expect(await db.allReminders(), {'entry:e1': 10});
      await db.setPreference('themeMode', 'dark'); // v4 table exists
      expect(await db.preference('themeMode'), 'dark');
    },
  );
}
