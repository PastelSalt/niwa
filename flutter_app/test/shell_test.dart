import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/core/util/date_only.dart';
import 'package:niwa/features/inbox/data/inbox_providers.dart';

import 'support/fake_server.dart';
import 'support/fake_workspace.dart';
import 'support/test_app.dart';

void main() {
  late FakeServer server;
  late Map<String, Object?> summary;
  late List<Object?> inbox;

  late FakeWorkspace ws;
  final home = find.byTooltip('Review queue');

  setUp(() {
    ws = FakeWorkspace();
    server = FakeServer()..workspace = ws;
    summary = {
      'id': '6745f0c2a1b2c3d4e5f60719',
      'workspaceId': '6745f0c2a1b2c3d4e5f60701',
      'parentId': null,
      'title': 'Call the printer',
      'type': 'task',
      'nature': 'actionable',
      'status': 'not_started',
      'priority': 'none',
      'orderKey': 'a0',
      'tags': <String>[],
      'dueAt': null,
      'estimatedMinutes': null,
      'reviewAt': null,
      'sourceUrl': null,
      'inboxedAt': '2026-11-02T08:00:00.000Z',
      'suggestedParentId': null,
      'archivedAt': null,
      'deletedAt': null,
      'version': 1,
      'createdAt': '2026-11-02T08:00:00.000Z',
      'updatedAt': '2026-11-02T08:00:00.000Z',
      'completedAt': null,
    };
    inbox = [
      summary,
      {...summary, 'id': '6745f0c2a1b2c3d4e5f60720'},
    ];
    server.routes['/inbox'] = (o) {
      if (o.method == 'POST') {
        final body = o.data as Map<String, dynamic>;
        final item = {...summary, 'id': 'new', 'title': body['title']};
        inbox = [...inbox, item];
        return FakeServer.json(201, {
          'item': {...item, 'content': null},
        });
      }
      return FakeServer.json(200, {'items': inbox});
    };
  });

  Future<void> signedIn(WidgetTester tester) async {
    await pumpApp(tester, server: server);
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

  GoRouter router(WidgetTester tester) =>
      GoRouter.of(tester.element(find.byType(Scaffold).first));

  Future<void> tab(WidgetTester tester, String label) async {
    await tester.tap(
      find.descendant(
        of: find.byType(NavigationBar),
        matching: find.text(label),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('every tab is reachable', (tester) async {
    await signedIn(tester);
    expect(find.text('Nothing planted yet'), findsOneWidget);

    await tab(tester, 'Actionable');
    expect(find.text('Nothing overdue.'), findsOneWidget);

    await tab(tester, 'Scheduler');
    expect(
      GoRouter.of(tester.element(find.byType(NavigationBar)))
          .routerDelegate
          .currentConfiguration
          .uri
          .path,
      '/scheduler/day/${dateOnly(DateTime.now())}',
    );

    await tab(tester, 'Inbox');
    expect(find.text('Call the printer'), findsNWidgets(2));

    await tab(tester, 'Search');
    expect(find.text('Find anything'), findsOneWidget);
  });

  testWidgets('each tab keeps its own back stack', (tester) async {
    ws.add('Thesis', id: 'abc');
    await signedIn(tester);
    await tester.tap(find.text('Thesis'));
    await tester.pumpAndSettle();
    expect(find.byTooltip('Edit details'), findsOneWidget);

    await tab(tester, 'Inbox');
    await tab(tester, 'Knowledge');
    expect(find.byTooltip('Edit details'), findsOneWidget, reason: 'kept');

    // Tapping the current tab again returns to its root.
    await tab(tester, 'Knowledge');
    expect(home, findsOneWidget);
  });

  testWidgets('Android back on another tab goes to the first tab', (
    tester,
  ) async {
    await signedIn(tester);
    await tab(tester, 'Inbox');
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(home, findsOneWidget);
  });

  testWidgets('Inbox badge counts items and updates after capture', (
    tester,
  ) async {
    await signedIn(tester);
    final badge = find.descendant(
      of: find.byType(NavigationBar),
      matching: find.byType(Badge),
    );
    expect(
      find.descendant(of: badge, matching: find.text('2')),
      findsOneWidget,
    );

    await tester.tap(find.byTooltip('Capture'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'Buy stamps');
    await tester.tap(find.text('Task'));
    await tester.pump();
    await tester.tap(find.text('Save to Inbox'));
    await tester.pumpAndSettle();

    final post = server.requests.lastWhere(
      (r) => r.path == '/inbox' && r.method == 'POST',
    );
    expect(post.data, {
      'title': 'Buy stamps',
      'type': 'task',
      'clientId': matches(RegExp(r'^[0-9a-f-]{36}$')),
    });
    expect(find.text('Captured to Inbox'), findsOneWidget);
    expect(
      find.descendant(of: badge, matching: find.text('3')),
      findsOneWidget,
    );
  });

  testWidgets('Inbox empty and error states', (tester) async {
    // Nothing cached yet and the server fails → error state with retry.
    server.routes['/inbox'] = (_) => FakeServer.error(500, 'INTERNAL_ERROR');
    await signedIn(tester);
    await tab(tester, 'Inbox');
    expect(find.text("Couldn't load this"), findsOneWidget);

    inbox = [];
    server.routes['/inbox'] = (_) => FakeServer.json(200, {'items': inbox});
    await tester.tap(find.text('Try again'));
    await tester.pumpAndSettle();
    expect(find.text('Inbox zero'), findsOneWidget);
    expect(find.byType(Badge), findsNothing);

    // Once cached, a failing refresh keeps showing the saved list.
    server.routes['/inbox'] = (_) => FakeServer.error(500, 'INTERNAL_ERROR');
    ProviderScope.containerOf(tester.element(find.byType(Scaffold).first))
        .invalidate(inboxItemsProvider);
    await tester.pumpAndSettle();
    expect(find.text('Inbox zero'), findsOneWidget);
  });

  testWidgets('/items/:id opens the right lens and keeps the anchor', (
    tester,
  ) async {
    ws.add('Call the printer', type: 'task', id: 't1');
    await signedIn(tester);
    router(tester).go('/items/t1#h-intro');
    await tester.pumpAndSettle();
    expect(
      router(tester).routerDelegate.currentConfiguration.uri.toString(),
      '/actionable/t1#h-intro',
    );
    expect(find.widgetWithText(AppBar, 'Task'), findsOneWidget);
  });

  testWidgets('a deep link opened while signed out lands after login', (
    tester,
  ) async {
    ws.add('Ship it', type: 'task', id: 'xyz');
    await pumpApp(tester, server: server);
    router(tester).go('/actionable/xyz');
    await tester.pumpAndSettle();
    expect(find.text('Welcome back'), findsOneWidget);

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
    expect(find.text('Ship it'), findsOneWidget);
  });

  testWidgets('settings via the account menu; theme switch applies', (
    tester,
  ) async {
    await signedIn(tester);
    await tester.tap(find.byTooltip('Account'));
    await tester.pumpAndSettle();
    expect(find.text('me@example.com'), findsOneWidget);
    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();
    expect(find.text('Appearance'), findsWidgets);

    await tester.tap(find.text('Dark'));
    await tester.pumpAndSettle();
    final context = tester.element(find.byType(Scaffold).last);
    expect(Theme.of(context).brightness, Brightness.dark);

    // Back returns to the tab underneath.
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(home, findsOneWidget);
  });

  testWidgets('unknown paths and bad scheduler params', (tester) async {
    await signedIn(tester);
    router(tester).go('/nope');
    await tester.pumpAndSettle();
    expect(find.text('Nothing here'), findsOneWidget);

    router(tester).go('/scheduler/year/2026-11-04');
    await tester.pumpAndSettle();
    expect(
      GoRouter.of(tester.element(find.byType(NavigationBar)))
          .routerDelegate
          .currentConfiguration
          .uri
          .path,
      '/scheduler/day/${dateOnly(DateTime.now())}',
    );

    router(tester).go('/settings/unknown');
    await tester.pumpAndSettle();
    expect(find.text('Match system'), findsOneWidget);
  });
}
