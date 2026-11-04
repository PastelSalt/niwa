import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'support/fake_server.dart';
import 'support/fake_workspace.dart';
import 'support/test_app.dart';

// Mobile versions of web_app/e2e/tree.spec.ts plus field/conflict cases.

void main() {
  late FakeServer server;
  late FakeWorkspace ws;

  setUp(() {
    ws = FakeWorkspace();
    server = FakeServer()..workspace = ws;
  });

  Future<void> tap(WidgetTester tester, Finder f) async {
    await tester.ensureVisible(f);
    await tester.tap(f);
    await tester.pumpAndSettle();
  }

  Future<void> tab(WidgetTester tester, String label) => tap(
    tester,
    find.descendant(of: find.byType(NavigationBar), matching: find.text(label)),
  );

  Future<void> createItem(
    WidgetTester tester,
    String title, {
    String? type,
  }) async {
    await tester.enterText(
      find.descendant(
        of: find.byType(AlertDialog),
        matching: find.byType(TextField),
      ),
      title,
    );
    await tester.pump(); // enterText doesn't rebuild; Create enables on change
    if (type != null) {
      await tester.tap(
        find.descendant(
          of: find.byType(AlertDialog),
          matching: find.text(type),
        ),
      );
      await tester.pump();
    }
    await tap(tester, find.widgetWithText(FilledButton, 'Create'));
  }

  Future<void> longPress(WidgetTester tester, String title) async {
    await tester.longPress(find.widgetWithText(ListTile, title).first);
    await tester.pumpAndSettle();
  }

  List<String> childTitles(String parentId) {
    final kids =
        ws.items.values
            .where((i) => i['parentId'] == parentId && i['deletedAt'] == null)
            .toList()
          ..sort(
            (a, b) =>
                (a['orderKey'] as String).compareTo(b['orderKey'] as String),
          );
    return [for (final k in kids) k['title'] as String];
  }

  testWidgets(
    'build a project, reorder, complete from Focus, delete and restore',
    (tester) async {
      final projects = ws.add('Projects');
      await pumpSignedIn(tester, server: server);
      await tab(tester, 'Actionable');
      await tap(tester, find.text('Browse'));

      // Open the Projects container and add a project inside it.
      await tap(tester, find.text('Projects'));
      await tap(tester, find.widgetWithText(TextButton, 'Add'));
      await createItem(tester, 'Website', type: 'Project');
      expect(find.widgetWithText(AppBar, 'Project'), findsOneWidget);
      final site = ws.items.values.firstWhere((i) => i['title'] == 'Website');
      expect(site['parentId'], projects);
      expect(site['nature'], 'actionable');

      // Two tasks inside; new items in a project default to Task.
      for (final t in ['Design', 'Build']) {
        await tap(tester, find.widgetWithText(TextButton, 'Add'));
        await createItem(tester, t);
        expect(find.widgetWithText(AppBar, 'Task'), findsOneWidget);
        await tester.pageBack();
        await tester.pumpAndSettle();
      }
      final siteId = site['id'] as String;
      expect(childTitles(siteId), ['Design', 'Build']);

      // Reorder from the long-press menu (the non-drag path).
      await longPress(tester, 'Build');
      await tap(tester, find.text('Move up'));
      expect(childTitles(siteId), ['Build', 'Design']);

      // Complete Design from Focus.
      final design = ws.items.values.firstWhere((i) => i['title'] == 'Design');
      design['status'] = 'in_progress';
      await tab(tester, 'Actionable'); // back to the tab root
      await tap(tester, find.text('Focus'));
      final container = tester.element(find.byType(NavigationBar));
      GoRouter.of(container).go('/actionable'); // refresh Focus
      await tester.pumpAndSettle();
      await tester.drag(find.byType(ListView).first, const Offset(0, 300));
      await tester.pumpAndSettle();
      await tap(tester, find.bySemanticsLabel('Complete “Design”'));
      expect(design['status'], 'completed');
      expect(find.text('Completed “Design”'), findsOneWidget);

      // Delete the project (with children) and undo.
      await tap(tester, find.text('Browse'));
      await tap(tester, find.text('Projects'));
      await longPress(tester, 'Website');
      await tap(tester, find.text('Move to Trash'));
      expect(find.text('Delete “Website”?'), findsOneWidget);
      await tap(tester, find.widgetWithText(FilledButton, 'Move to Trash'));
      expect(find.text('Moved 3 items to Trash'), findsOneWidget);
      expect(ws.item(siteId)['deletedAt'], isNotNull);

      await tap(tester, find.text('Undo'));
      expect(ws.item(siteId)['deletedAt'], isNull);
      expect(find.text('Website'), findsOneWidget);
    },
  );

  testWidgets('lens filtering dims context and keeps knowledge out', (
    tester,
  ) async {
    final college = ws.add('College');
    final course = ws.add('CS 301', parent: college);
    ws
      ..add('Problem set', parent: course, type: 'task')
      ..add('Lecture notes', parent: course)
      ..add('Reading list', parent: college);

    await pumpSignedIn(tester, server: server);
    await tab(tester, 'Actionable');
    await tap(tester, find.text('Browse'));
    await tap(tester, find.text('College'));

    // The course leads to a task, so it shows (dimmed); the note-only
    // reading list doesn't.
    expect(find.text('CS 301'), findsOneWidget);
    expect(find.text('Reading list'), findsNothing);
    final dimmed = tester.widget<Opacity>(
      find
          .ancestor(of: find.text('CS 301'), matching: find.byType(Opacity))
          .first,
    );
    expect(dimmed.opacity, lessThan(1));

    await tap(tester, find.text('CS 301'));
    expect(find.text('Problem set'), findsOneWidget);
    expect(find.text('Lecture notes'), findsNothing);

    // Knowledge shows the notes and hides the task.
    await tab(tester, 'Knowledge');
    await tap(tester, find.text('College'));
    expect(find.text('Reading list'), findsOneWidget);
    await tap(tester, find.text('CS 301'));
    expect(find.text('Lecture notes'), findsOneWidget);
    expect(find.text('Problem set'), findsNothing);
  });

  testWidgets('drag handle reorders children', (tester) async {
    final parent = ws.add('Groceries', id: 'g');
    for (final t in ['Apples', 'Bread', 'Cheese']) {
      ws.add(t, parent: parent);
    }
    await pumpSignedIn(tester, server: server);
    await tap(tester, find.text('Groceries'));

    final handle = find.descendant(
      of: find.widgetWithText(ListTile, 'Cheese'),
      matching: find.byIcon(Icons.drag_handle),
    );
    await tester.ensureVisible(handle);
    await tester.pumpAndSettle();
    final gesture = await tester.startGesture(tester.getCenter(handle));
    await tester.pump(const Duration(milliseconds: 50));
    await gesture.moveBy(const Offset(0, -200));
    await tester.pump();
    await gesture.up();
    await tester.pumpAndSettle();

    expect(childTitles(parent), ['Cheese', 'Apples', 'Bread']);
    final move = server.requests.lastWhere((r) => r.path.endsWith('/move'));
    expect((move.data as Map)['beforeId'], isNotNull);
  });

  testWidgets('move-to picker moves inside another and explains refusals', (
    tester,
  ) async {
    final a = ws.add('Area A', id: 'a');
    final b = ws.add('Area B', id: 'b');
    final child = ws.add('Topic', parent: a, id: 't');
    ws.add('Subtopic', parent: child);

    await pumpSignedIn(tester, server: server);
    await tap(tester, find.text('Area A'));
    await longPress(tester, 'Topic');
    await tap(tester, find.text('Move to…'));

    expect(find.text('Already here'), findsOneWidget); // Area A
    expect(find.text("Can't move an item into itself"), findsOneWidget);
    expect(
      find.text("Can't move an item into its own children"),
      findsOneWidget,
    );
    await tap(tester, find.text('Area B'));
    expect(ws.item(child)['parentId'], b);
  });

  testWidgets('field sheet sends only changes; conflicts reload', (
    tester,
  ) async {
    final id = ws.add('Essay', type: 'task', id: 'e');
    ws.add('etc', tags: ['school']);
    await pumpSignedIn(tester, server: server);
    GoRouter.of(tester.element(find.byType(NavigationBar)))
        .go('/actionable/$id');
    await tester.pumpAndSettle();

    await tap(tester, find.byTooltip('Edit details'));
    await tap(tester, find.widgetWithText(ChoiceChip, 'High'));
    await tester.enterText(
      find.widgetWithText(TextField, 'Add a tag'),
      'School Work',
    );
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();
    expect(find.text('school-work'), findsOneWidget); // normalised
    await tap(tester, find.widgetWithText(FilledButton, 'Save'));

    final patch = server.requests.lastWhere((r) => r.method == 'PATCH');
    expect(patch.data, {
      'version': 1,
      'priority': 'high',
      'tags': ['school-work'],
    });
    expect(find.text('High priority'), findsOneWidget);

    // Someone else saves first → 409 → reload with a notice.
    ws.item(id)
      ..['version'] = 9
      ..['title'] = 'Essay (edited on the web)';
    await tap(tester, find.byTooltip('Edit details'));
    await tap(tester, find.widgetWithText(ChoiceChip, 'Blocked'));
    await tap(tester, find.widgetWithText(FilledButton, 'Save'));
    expect(
      find.text('This item changed elsewhere — showing the latest.'),
      findsOneWidget,
    );
    expect(find.text('Essay (edited on the web)'), findsOneWidget);
  });

  testWidgets('title saves on Done', (tester) async {
    final id = ws.add('Draft', id: 'd');
    await pumpSignedIn(tester, server: server);
    await tap(tester, find.text('Draft'));
    await tester.enterText(find.widgetWithText(TextField, 'Title'), 'Final');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();
    expect(ws.item(id)['title'], 'Final');
    expect(ws.item(id)['version'], 2);
  });

  testWidgets('archive with Undo', (tester) async {
    final id = ws.add('Old stuff');
    await pumpSignedIn(tester, server: server);
    await longPress(tester, 'Old stuff');
    await tap(tester, find.text('Archive'));
    expect(find.text('Archived “Old stuff”'), findsOneWidget);
    expect(ws.item(id)['archivedAt'], isNotNull);
    expect(find.widgetWithText(ListTile, 'Old stuff'), findsNothing);

    await tap(tester, find.text('Undo'));
    expect(ws.item(id)['archivedAt'], isNull);
    expect(find.widgetWithText(ListTile, 'Old stuff'), findsOneWidget);
  });

  testWidgets('undoing a delete whose parent is gone lands in Inbox', (
    tester,
  ) async {
    final parent = ws.add('Folder');
    final child = ws.add('Lonely note', parent: parent);
    await pumpSignedIn(tester, server: server);
    await tap(tester, find.text('Folder'));
    await longPress(tester, 'Lonely note');
    await tap(tester, find.text('Move to Trash'));
    expect(find.text('Moved “Lonely note” to Trash'), findsOneWidget);

    // Meanwhile the folder is deleted elsewhere.
    ws.item(parent)['deletedAt'] = '2026-11-04T10:00:00.000Z';
    await tap(tester, find.text('Undo'));
    expect(
      find.text('Restored to Inbox — its folder no longer exists.'),
      findsOneWidget,
    );
    expect(ws.item(child)['inboxedAt'], isNotNull);
  });

  testWidgets('content renders read-only', (tester) async {
    ws.add(
      'Notes',
      id: 'n',
      content: {
        'type': 'doc',
        'content': [
          {
            'type': 'heading',
            'attrs': {'level': 2},
            'content': [
              {'type': 'text', 'text': 'Chapter 1'},
            ],
          },
          {
            'type': 'bulletList',
            'content': [
              {
                'type': 'listItem',
                'content': [
                  {
                    'type': 'paragraph',
                    'content': [
                      {'type': 'text', 'text': 'First point'},
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    );
    await pumpSignedIn(tester, server: server);
    await tap(tester, find.text('Notes'));
    expect(find.text('Chapter 1'), findsOneWidget);
    expect(find.text('•  First point'), findsOneWidget);
  });
}
