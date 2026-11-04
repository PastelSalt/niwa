import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:niwa/core/api/api_client.dart';
import 'package:niwa/core/api/refresh_token_store.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/features/items/data/items_repository.dart';
import 'package:niwa/features/knowledge/data/note_autosave.dart';

import 'support/fake_server.dart';
import 'support/fake_workspace.dart';

// Same rules as web_app/src/features/knowledge/editor/useAutosave.test.tsx.

Map<String, dynamic> para(String text) => {
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

void main() {
  late FakeServer server;
  late FakeWorkspace ws;
  late ApiClient api;
  late ItemsRepository items;
  late Map<String, dynamic> body;
  late List<Item> saved;
  const debounce = Duration(milliseconds: 20);

  setUp(() async {
    ws = FakeWorkspace()..add('Note', id: 'n', content: para('start'));
    server = FakeServer()..workspace = ws;
    api = ApiClient(
      baseUrl: 'http://api.test/api/v1',
      refreshTokens: MemoryRefreshTokenStore(),
      adapter: server,
    );
    await api.login(email: 'me@example.com', password: 'x' * 12);
    items = ItemsRepository(api);
    body = para('start');
    saved = [];
  });
  tearDown(() => api.close());

  Future<NoteAutosave> autosave() async => NoteAutosave(
    items: items,
    item: await items.get('n'),
    read: () => body,
    onSaved: saved.add,
    debounce: debounce,
  );

  int patches() => server.requests.where((r) => r.method == 'PATCH').length;

  test('opening a note is not an edit', () async {
    final a = await autosave();
    await a.flush();
    expect(patches(), 0);
    expect(a.status, SaveStatus.saved);
  });

  test('edits are debounced into one save', () async {
    final a = await autosave();
    for (final t in ['a', 'ab', 'abc']) {
      body = para(t);
      a.schedule();
    }
    expect(a.status, SaveStatus.dirty);
    await Future<void>.delayed(debounce * 3);
    expect(patches(), 1);
    expect(ws.item('n')['content'], para('abc'));
    expect(a.status, SaveStatus.saved);
    expect(saved.single.version, 2);
  });

  test('a field-only change elsewhere is retried silently', () async {
    final a = await autosave();
    // The web renamed it meanwhile: version bumped, content unchanged.
    ws.item('n')
      ..['title'] = 'Renamed'
      ..['version'] = 5;
    body = para('mine');
    await a.flush();
    expect(patches(), 2);
    expect(ws.item('n')['content'], para('mine'));
    expect(ws.item('n')['title'], 'Renamed');
    expect(a.status, SaveStatus.saved);
  });

  test('a real content conflict pauses; keep mine overwrites', () async {
    final a = await autosave();
    ws.item('n')
      ..['content'] = para('theirs')
      ..['version'] = 7;
    body = para('mine');
    await a.flush();
    expect(a.status, SaveStatus.conflict);
    expect(a.conflict?.content, para('theirs'));

    a.schedule(); // ignored while paused
    await Future<void>.delayed(debounce * 3);
    expect(patches(), 1);

    await a.keepMine();
    expect(ws.item('n')['content'], para('mine'));
    expect(a.status, SaveStatus.saved);
  });

  test('load latest drops local edits', () async {
    final a = await autosave();
    ws.item('n')
      ..['content'] = para('theirs')
      ..['version'] = 7;
    body = para('mine');
    await a.flush();
    final latest = a.loadLatest();
    expect(latest?.content, para('theirs'));
    expect(a.status, SaveStatus.saved);
    body = para('theirs'); // the screen now shows theirs
    await a.flush();
    expect(patches(), 1);
  });

  test('offline keeps the text unsaved with a status', () async {
    final a = await autosave();
    server.routes['/items/n'] = (o) => o.method == 'PATCH'
        ? throw const SocketException('down')
        : ws.handle(o)!;
    body = para('offline text');
    await a.flush();
    expect(a.status, SaveStatus.offline);
    expect(a.hasUnsavedChanges, isTrue);

    server.routes.remove('/items/n');
    await a.flush();
    expect(a.status, SaveStatus.saved);
    expect(ws.item('n')['content'], para('offline text'));
  });

  test('other errors surface as "not saved"', () async {
    final a = await autosave();
    server.routes['/items/n'] = (o) => o.method == 'PATCH'
        ? FakeServer.error(413, 'VALIDATION_ERROR')
        : ws.handle(o)!;
    body = para('too big');
    await a.flush();
    expect(a.status, SaveStatus.error);
    expect(a.errorMessage, 'msg VALIDATION_ERROR');
  });

  test('observeVersion keeps saves current after field edits', () async {
    final a = await autosave();
    ws.item('n')['version'] = 3; // e.g. status changed in the fields sheet
    a.observeVersion(3);
    body = para('next');
    await a.flush();
    expect(patches(), 1, reason: 'no conflict round-trip needed');
  });
}
