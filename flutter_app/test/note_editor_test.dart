import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/features/knowledge/domain/pm_delta.dart';

import 'support/fake_server.dart';
import 'support/fake_workspace.dart';
import 'support/test_app.dart';

Map<String, dynamic> fixture(String name) =>
    jsonDecode(File('test/fixtures/editor/$name.json').readAsStringSync())
        as Map<String, dynamic>;

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

  Future<void> open(WidgetTester tester, String path) async {
    GoRouter.of(tester.element(find.byType(NavigationBar))).go(path);
    await tester.pumpAndSettle();
  }

  QuillController controller(WidgetTester tester) =>
      tester.widget<QuillEditor>(find.byType(QuillEditor)).controller;

  /// Lets the 800 ms debounce run and the save land.
  Future<void> settleSave(WidgetTester tester) async {
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();
  }

  int patches() => server.requests.where((r) => r.method == 'PATCH').length;

  testWidgets('edit on mobile saves ProseMirror the web can read', (
    tester,
  ) async {
    ws.add('Notes', id: 'n', content: fixture('marks'));
    await pumpSignedIn(tester, server: server);
    await open(tester, '/knowledge/n');
    await tap(tester, find.text('Edit notes'));
    expect(find.text('Saved'), findsOneWidget);
    expect(patches(), 0, reason: 'opening is not an edit');

    controller(tester).replaceText(0, 0, 'Hello ', null);
    await tester.pump();
    expect(find.text('Editing'), findsOneWidget);
    await settleSave(tester);
    expect(find.text('Saved'), findsOneWidget);
    expect(patches(), 1);

    final saved = ws.item('n')['content'] as Map<String, dynamic>;
    final expected = fixture('marks');
    final first =
        ((expected['content'] as List).first as Map)['content'] as List;
    (first.first as Map)['text'] = 'Hello plain ';
    expect(jsonEncode(saved), jsonEncode(expected));
  });

  testWidgets('a locked block survives editing around it', (tester) async {
    ws.add('Mixed', id: 'm', content: fixture('locked_quoteWithList'));
    await pumpSignedIn(tester, server: server);
    await open(tester, '/knowledge/m/edit');
    expect(find.text('Edit on web or desktop'), findsOneWidget);

    final c = controller(tester);
    c.replaceText(c.document.length - 1, 0, ' more', null);
    await settleSave(tester);
    final saved = ws.item('m')['content'] as Map;
    final original = fixture('locked_quoteWithList');
    expect(
      jsonEncode((saved['content'] as List).first),
      jsonEncode((original['content'] as List).first),
    );
  });

  testWidgets('[[ opens the link picker and inserts a niwaLink', (
    tester,
  ) async {
    ws
      ..add('Draft', id: 'd')
      ..add('Reading notes', id: 'r', content: fixture('headings'));
    await pumpSignedIn(tester, server: server);
    await open(tester, '/knowledge/d/edit');

    // Typed one character at a time, so the second `[` triggers the picker.
    controller(tester)
      ..replaceText(0, 0, 'See [', null)
      ..replaceText(5, 0, '[', const TextSelection.collapsed(offset: 6));
    await tester.pumpAndSettle();
    expect(find.text('Link to…'), findsOneWidget);
    expect(find.text('Draft'), findsNothing, reason: 'not the note itself');

    // → for sections, then pick one.
    await tap(tester, find.byTooltip('Link to a section of “Reading notes”'));
    await tap(tester, find.text('Section'));
    expect(find.text('Reading notes › Section'), findsOneWidget);
    await settleSave(tester);

    final saved = ws.item('d')['content'] as Map;
    final para = (saved['content'] as List).first as Map;
    final link = (para['content'] as List).firstWhere(
      (n) => (n as Map)['type'] == 'niwaLink',
    );
    expect((link as Map)['attrs'], {
      'itemId': 'r',
      'anchorId': 'b2',
      'title': 'Reading notes',
      'sectionTitle': 'Section',
    });
    expect(jsonEncode(para), isNot(contains('[[')));
  });

  testWidgets('a link to a deleted item shows as missing', (tester) async {
    ws.add('Linker', id: 'l', content: fixture('embeds'));
    await pumpSignedIn(tester, server: server);
    await open(tester, '/knowledge/l/edit');
    expect(find.text('Thesis outline (missing)'), findsOneWidget);
  });

  testWidgets('outline jumps and promotes a section to a child note', (
    tester,
  ) async {
    ws.add('Big note', id: 'b', content: fixture('headings'));
    await pumpSignedIn(tester, server: server);
    await open(tester, '/knowledge/b/edit');
    await tap(tester, find.byTooltip('Outline'));
    expect(find.text('Title'), findsWidgets);
    expect(find.text('Sub'), findsOneWidget);

    await tap(tester, find.byTooltip('Make “Sub” a child note'));
    expect(find.text('Moved “Sub” into a child note'), findsOneWidget);
    final child = ws.items.values.firstWhere((i) => i['title'] == 'Sub');
    expect(child['parentId'], 'b');
    final headings = [
      for (final n in (ws.item('b')['content'] as Map)['content'] as List)
        if ((n as Map)['type'] == 'heading') (n['attrs'] as Map)['anchorId'],
    ];
    expect(headings, ['a1', 'b2']);
    // The editor now shows the parent without the section.
    expect(
      deltaToPm(controller(tester).document.toDelta()).toString(),
      isNot(contains('Sub')),
    );
  });

  testWidgets('offline and archived notes are read-only', (tester) async {
    ws
      ..add('Old', id: 'o', content: fixture('blocks'))
      ..item('o')['archivedAt'] = '2026-11-01T00:00:00.000Z';
    await pumpSignedIn(tester, server: server);
    await open(tester, '/knowledge/o');
    expect(find.text('Edit notes'), findsNothing);
    await open(tester, '/knowledge/o/edit');
    expect(find.text('Archived — unarchive it to edit.'), findsOneWidget);
    expect(controller(tester).readOnly, isTrue);
    expect(find.byType(QuillSimpleToolbar), findsNothing);
  });

  testWidgets('links panel: content links, related add/remove, backlinks', (
    tester,
  ) async {
    ws
      ..add('Source', id: '6745f0c2a1b2c3d4e5f60718', content: fixture('empty'))
      ..add('Linker', id: 'l', content: fixture('embeds'))
      ..add('Other', id: 'x');
    await pumpSignedIn(tester, server: server);

    // Backlink: "Linker" links to Source in its body.
    await open(tester, '/knowledge/6745f0c2a1b2c3d4e5f60718');
    expect(find.text('Linked from'), findsOneWidget);
    expect(find.widgetWithText(ListTile, 'Linker'), findsOneWidget);

    // Related: add "Other" by hand, then remove it.
    await tap(tester, find.widgetWithText(TextButton, 'Related'));
    await tap(tester, find.widgetWithText(ListTile, 'Other'));
    expect(ws.manualLinks, hasLength(1));
    expect(find.byTooltip('Remove link to “Other”'), findsOneWidget);
    await tap(tester, find.byTooltip('Remove link to “Other”'));
    expect(ws.manualLinks, isEmpty);
  });

  testWidgets('a #h- deep link scrolls to its section', (tester) async {
    final long = {
      'type': 'doc',
      'content': [
        for (var i = 0; i < 40; i++)
          {
            'type': 'paragraph',
            'content': [
              {'type': 'text', 'text': 'Filler paragraph $i'},
            ],
          },
        {
          'type': 'heading',
          'attrs': {'level': 2, 'anchorId': 'deep0001'},
          'content': [
            {'type': 'text', 'text': 'Target section'},
          ],
        },
      ],
    };
    ws.add('Long', id: 'g', content: long);
    await pumpSignedIn(tester, server: server);
    await open(tester, '/items/g#h-deep0001');
    final y = tester.getTopLeft(find.text('Target section')).dy;
    expect(
      y,
      lessThan(tester.view.physicalSize.height / tester.view.devicePixelRatio),
    );
  });
}
