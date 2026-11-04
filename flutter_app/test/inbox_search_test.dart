import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/core/models/models.dart';

import 'support/fake_server.dart';
import 'support/fake_workspace.dart';
import 'support/test_app.dart';

// Mobile versions of web_app/e2e/inbox-search.spec.ts, plus capture
// details, delete with Undo and offline search.

void main() {
  late FakeServer server;
  late FakeWorkspace ws;

  setUp(() {
    ws = FakeWorkspace()
      ..add('Knowledge', id: 'k')
      ..add('Personal', id: 'p');
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

  Future<void> open(WidgetTester tester, String path) async {
    GoRouter.of(tester.element(find.byType(NavigationBar))).go(path);
    await tester.pumpAndSettle();
  }

  Future<void> typeTitle(WidgetTester tester, String title) async {
    await tester.enterText(
      find.widgetWithText(TextField, "What's on your mind?"),
      title,
    );
    await tester.pump();
  }

  Future<void> pickPlace(WidgetTester tester, String title) async {
    await tester.enterText(
      find.widgetWithText(TextField, 'Find a place'),
      title,
    );
    await tester.pump();
    await tap(
      tester,
      find.descendant(
        of: find.byType(ListView).last,
        matching: find.widgetWithText(ListTile, title),
      ),
    );
  }

  List<String> inboxTitles() => [
    for (final i in ws.items.values)
      if (i['inboxedAt'] != null && i['deletedAt'] == null)
        i['title'] as String,
  ];

  testWidgets('capture → inbox → file (single and bulk) → in the tree', (
    tester,
  ) async {
    await pumpSignedIn(tester, server: server);

    // Three captures: "Save & next" twice, then Save.
    await tap(tester, find.byTooltip('Capture'));
    await typeTitle(tester, 'Buy tomato seeds');
    await tap(tester, find.text('Save & next'));
    expect(find.text('1 captured'), findsOneWidget);
    await typeTitle(tester, 'Read about BGP');
    await tap(tester, find.text('Save & next'));
    await typeTitle(tester, 'Call the plumber');
    await tap(tester, find.text('Save to Inbox'));
    expect(find.text('Captured 3 items to Inbox'), findsOneWidget);

    await tab(tester, 'Inbox');
    final rows = find.bySemanticsLabel(RegExp('^Select '));
    expect(rows, findsNWidgets(3));
    // Newest first.
    final ys = [
      for (final t in [
        'Call the plumber',
        'Read about BGP',
        'Buy tomato seeds',
      ])
        tester.getTopLeft(find.text(t)).dy,
    ];
    expect(ys, orderedEquals([...ys]..sort()));
    expect(
      find.descendant(of: find.byType(NavigationBar), matching: find.text('3')),
      findsOneWidget,
    );

    // File one as a Note under Knowledge.
    await tap(tester, find.byTooltip('File Read about BGP'));
    await pickPlace(tester, 'Knowledge');
    await tap(tester, find.widgetWithText(ChoiceChip, 'Note'));
    await tap(tester, find.widgetWithText(FilledButton, 'File'));
    expect(find.text('Filed under “Knowledge”'), findsOneWidget);
    expect(inboxTitles(), hasLength(2));
    final bgp = ws.items.values.firstWhere(
      (i) => i['title'] == 'Read about BGP',
    );
    expect((bgp['parentId'], bgp['type']), ('k', 'note'));

    // Bulk-file the other two into Personal, keeping their types.
    await tap(tester, find.bySemanticsLabel('Select Buy tomato seeds'));
    await tap(tester, find.bySemanticsLabel('Select Call the plumber'));
    expect(find.text('2 selected'), findsOneWidget);
    await tap(tester, find.text('File selected'));
    await pickPlace(tester, 'Personal');
    await tap(tester, find.widgetWithText(FilledButton, 'File'));
    expect(find.text('Filed 2 items under “Personal”'), findsOneWidget);
    expect(find.text('Inbox zero'), findsOneWidget);
    expect(
      ws.items.values
          .where((i) => i['parentId'] == 'p')
          .map((i) => (i['title'], i['type'])),
      containsAll([('Buy tomato seeds', 'idea'), ('Call the plumber', 'idea')]),
    );

    // They're in the tree now.
    await tab(tester, 'Knowledge');
    await tap(tester, find.widgetWithText(ListTile, 'Knowledge'));
    expect(find.text('Read about BGP'), findsOneWidget);
  });

  testWidgets('capture details and a suggested parent from an item screen', (
    tester,
  ) async {
    await pumpSignedIn(tester, server: server);
    await open(tester, '/knowledge/k');
    await tap(tester, find.byTooltip('Capture'));
    expect(find.text('Suggest filing under “Knowledge”'), findsOneWidget);
    await typeTitle(tester, 'Spanning tree');
    await tap(tester, find.text('Add details'));
    await tester.enterText(
      find.widgetWithText(TextField, 'Details'),
      'Prevents loops.\n\nUses BPDUs.',
    );
    await tap(tester, find.text('Save to Inbox'));

    final captured = ws.items.values.firstWhere(
      (i) => i['title'] == 'Spanning tree',
    );
    expect(captured['suggestedParentId'], 'k');
    expect(captured['content'], {
      'type': 'doc',
      'content': [
        {
          'type': 'paragraph',
          'content': [
            {'type': 'text', 'text': 'Prevents loops.'},
          ],
        },
        {'type': 'paragraph'},
        {
          'type': 'paragraph',
          'content': [
            {'type': 'text', 'text': 'Uses BPDUs.'},
          ],
        },
      ],
    });

    // The Inbox shows the suggestion and the file sheet starts there.
    await tab(tester, 'Inbox');
    expect(find.widgetWithText(Chip, 'Knowledge'), findsOneWidget);
    await tap(tester, find.byTooltip('File Spanning tree'));
    expect(find.byTooltip('Choose another place'), findsOneWidget);
    await tap(tester, find.widgetWithText(FilledButton, 'File'));
    expect(captured['parentId'], 'k');
  });

  testWidgets('delete with Undo, one and many', (tester) async {
    for (final t in ['One', 'Two', 'Three']) {
      ws.add(t, type: 'idea', inbox: true);
    }
    await pumpSignedIn(tester, server: server);
    await tab(tester, 'Inbox');

    await tap(tester, find.byTooltip('Delete One'));
    expect(find.text('Moved “One” to Trash'), findsOneWidget);
    await tap(tester, find.text('Undo'));
    expect(inboxTitles(), containsAll(['One', 'Two', 'Three']));

    await tap(tester, find.bySemanticsLabel('Select Two'));
    await tap(tester, find.bySemanticsLabel('Select Three'));
    await tap(tester, find.byTooltip('Delete selected'));
    expect(find.text('Moved 2 items to Trash'), findsOneWidget);
    expect(inboxTitles(), ['One']);
    await tap(tester, find.text('Undo'));
    expect(inboxTitles(), containsAll(['Two', 'Three']));
  });

  testWidgets('search finds titles, tags and body text with highlights', (
    tester,
  ) async {
    Map<String, dynamic> doc(String text) => {
      'type': 'doc',
      'content': [
        {
          'type': 'paragraph',
          'content': [
            {'type': 'text', 'text': text},
          ],
        },
      ],
    };
    ws
      ..add(
        'BGP path selection',
        parent: 'k',
        tags: ['routing'],
        content: doc('Prefer the shortest AS path.'),
      )
      ..add(
        'OSPF areas',
        parent: 'k',
        tags: ['routing'],
        content: doc('Area 0 is the backbone of the network.'),
      )
      ..add('Fix the router', parent: 'p', type: 'task');
    await pumpSignedIn(tester, server: server);
    await tab(tester, 'Search');

    await tester.enterText(find.byType(SearchBar), 'backb');
    await tester.pump(const Duration(milliseconds: 350)); // debounce
    await tester.pumpAndSettle();
    expect(find.text('OSPF areas'), findsOneWidget);
    expect(find.text('BGP path selection'), findsNothing);
    expect(
      GoRouter.of(tester.element(find.byType(NavigationBar)))
          .routerDelegate
          .currentConfiguration
          .uri
          .toString(),
      '/search?q=backb',
    );
    // The match is marked.
    final marked = tester
        .widgetList<RichText>(find.byType(RichText))
        .expand((r) {
          final spans = <TextSpan>[];
          r.text.visitChildren((s) {
            if (s is TextSpan && s.style?.backgroundColor != null) spans.add(s);
            return true;
          });
          return spans;
        })
        .map((s) => s.text)
        .toList();
    expect(marked, ['backb']);

    // Tags match; the base filter narrows.
    await tester.enterText(find.byType(SearchBar), 'rout');
    await tester.pump(const Duration(milliseconds: 350));
    await tester.pumpAndSettle();
    expect(
      find.text('Fix the router', findRichText: true, skipOffstage: false),
      findsOneWidget,
    );
    expect(find.text('OSPF areas', skipOffstage: false), findsOneWidget);
    await tap(
      tester,
      find.descendant(
        of: find.byType(SegmentedButton<ItemNature?>),
        matching: find.text('Actionable'),
      ),
    );
    // Highlighted titles are rich text.
    expect(find.text('Fix the router', findRichText: true), findsOneWidget);
    expect(find.text('OSPF areas', findRichText: true), findsNothing);

    // Recent searches.
    await tester.enterText(find.byType(SearchBar), '');
    await tap(tester, find.byTooltip('Clear search'));
    expect(find.text('Recent searches'), findsOneWidget);
    expect(find.widgetWithText(ListTile, 'rout'), findsOneWidget);
    await tap(tester, find.widgetWithText(ListTile, 'backb'));
    expect(find.text('OSPF areas'), findsOneWidget);
  });

  testWidgets('offline search falls back to saved titles', (tester) async {
    ws.add('Thesis outline', parent: 'k');
    await pumpSignedIn(tester, server: server);
    server.offline = true;
    await open(tester, '/search?q=thesis');
    expect(find.text('Thesis outline'), findsOneWidget);
    expect(
      find.text('Offline — searching saved titles and tags only.'),
      findsOneWidget,
    );
  });
}
