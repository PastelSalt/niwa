import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:niwa/core/api/api_client.dart';
import 'package:niwa/core/api/change.dart';
import 'package:niwa/core/api/refresh_token_store.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/features/inbox/data/inbox_repository.dart';
import 'package:niwa/features/items/data/items_repository.dart';
import 'package:niwa/features/knowledge/data/links_repository.dart';
import 'package:niwa/features/knowledge/data/uploads_repository.dart';
import 'package:niwa/features/scheduler/data/schedule_repository.dart';
import 'package:niwa/features/search/data/search_repository.dart';
import 'package:niwa/features/settings/data/workspace_repository.dart';

Json fixture(String name) =>
    jsonDecode(File('test/fixtures/$name.json').readAsStringSync()) as Json;

/// Records each request and answers with whatever [reply] holds — by default
/// an echo of `{}`; tests set it to the contract fixture they expect back.
class Recorder implements HttpClientAdapter {
  final requests = <RequestOptions>[];
  Object? reply = const <String, Object?>{};
  int status = 200;

  RequestOptions get last => requests.last;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    if (options.path == '/auth/login') {
      return _json(200, fixture('AuthResponse'));
    }
    if (status == 204) return ResponseBody.fromString('', 204);
    return _json(status, reply);
  }

  static ResponseBody _json(int status, Object? body) =>
      ResponseBody.fromString(
        jsonEncode(body),
        status,
        headers: {
          Headers.contentTypeHeader: [Headers.jsonContentType],
        },
      );

  @override
  void close({bool force = false}) {}
}

void main() {
  late Recorder server;
  late ApiClient api;

  setUp(() async {
    server = Recorder();
    api = ApiClient(
      baseUrl: 'http://api.test/api/v1',
      refreshTokens: MemoryRefreshTokenStore(),
      adapter: server,
    );
    await api.login(email: 'me@example.com', password: 'x' * 12);
  });
  tearDown(() => api.close());

  group('ItemsRepository', () {
    late ItemsRepository items;
    setUp(() => items = ItemsRepository(api));

    test('tree decodes summaries; includeArchived only when true', () async {
      server.reply = {
        'items': [fixture('ItemSummary')],
      };
      final tree = await items.tree();
      expect(tree.single.title, 'Reading notes');
      expect(server.last.path, '/tree');
      expect(server.last.queryParameters, isEmpty);

      await items.tree(includeArchived: true);
      expect(server.last.queryParameters, {'includeArchived': 'true'});
    });

    test('list sends enums in wire spelling and drops nulls', () async {
      server.reply = {'items': <Object>[]};
      await items.list(
        parentId: 'root',
        status: ItemStatus.inProgress,
        nature: ItemNature.actionable,
      );
      expect(server.last.queryParameters, {
        'parentId': 'root',
        'status': 'in_progress',
        'nature': 'actionable',
      });
    });

    test('create posts only given fields', () async {
      server.reply = {'item': fixture('Item')};
      final item = await items.create(
        parentId: null,
        title: 'New',
        type: ItemType.task,
        dueAt: '2026-11-20',
      );
      expect(item.id, '6745f0c2a1b2c3d4e5f60718');
      expect(server.last.method, 'POST');
      expect(server.last.data, {
        'parentId': null,
        'title': 'New',
        'type': 'task',
        'dueAt': '2026-11-20',
      });
    });

    test('update: omitted vs Change(null) vs Change(value)', () async {
      server.reply = {'item': fixture('Item')};
      await items.update(
        'abc',
        const ItemChanges(
          version: 3,
          status: ItemStatus.completed,
          dueAt: Change(null),
          estimatedMinutes: Change(30),
        ),
      );
      expect(server.last.method, 'PATCH');
      expect(server.last.path, '/items/abc');
      expect(server.last.data, {
        'version': 3,
        'status': 'completed',
        'dueAt': null,
        'estimatedMinutes': 30,
      });
    });

    test(
      'move keeps a null parent (top level) and omits missing neighbours',
      () async {
        server.reply = {'item': fixture('Item')};
        await items.move('abc', version: 2, parentId: null, afterId: 'def');
        expect(server.last.path, '/items/abc/move');
        expect(server.last.data, {
          'version': 2,
          'parentId': null,
          'afterId': 'def',
        });
      },
    );

    test('remove / restore / purge decode their responses', () async {
      server.reply = fixture('DeleteResponse');
      expect((await items.remove('abc')).affected, 4);
      expect(server.last.method, 'DELETE');

      server.reply = fixture('RestoreResponse');
      final restored = await items.restore('abc');
      expect(restored.restoredTo, RestoreTarget.inbox);

      server.reply = fixture('DeleteResponse');
      await items.purge('abc');
      expect(server.last.path, '/items/abc/permanent');
    });

    test('focus and review pass the local day', () async {
      server.reply = fixture('FocusResponse');
      final focus = await items.focus('2026-11-04', upcomingDays: 14);
      expect(focus.inProgress, hasLength(1));
      expect(server.last.queryParameters, {
        'today': '2026-11-04',
        'upcomingDays': '14',
      });
    });

    test('links and promoteSection', () async {
      server.reply = fixture('ItemLinksResponse');
      final links = await items.links('abc');
      expect(links.outgoing.single.link.targetSection, 'Chapter 1');

      server.reply = fixture('PromoteSectionResponse');
      final promoted = await items.promoteSection(
        'abc',
        version: 3,
        anchorId: 'a1b2c3',
      );
      expect(promoted.child.parentId, promoted.parent.id);
      expect(server.last.data, {'version': 3, 'anchorId': 'a1b2c3'});
    });

    test('sending an unknown enum is a bug, caught before the request', () {
      expect(
        () => items.create(parentId: null, title: 'x', type: ItemType.unknown),
        throwsArgumentError,
      );
    });
  });

  test('TagsRepository list and rename', () async {
    final tags = TagsRepository(api);
    server.reply = {
      'tags': [fixture('TagCount')],
    };
    expect((await tags.list()).single.count, 7);

    server.reply = {'updated': 5};
    expect(await tags.rename(from: 'old', to: 'new'), 5);
    expect(server.last.data, {'from': 'old', 'to': 'new'});
  });

  test(
    'InboxRepository capture defaults to idea; file posts version',
    () async {
      final inbox = InboxRepository(api);
      server.reply = {'item': fixture('Item')};
      await inbox.capture(title: 'Thought');
      expect(server.last.path, '/inbox');
      expect(server.last.data, {'title': 'Thought', 'type': 'idea'});

      await inbox.capture(title: 'Offline', clientId: 'c-1');
      expect(server.last.data, {
        'title': 'Offline',
        'type': 'idea',
        'clientId': 'c-1',
      });

      await inbox.file('abc', version: 1, parentId: 'p1', tags: ['x']);
      expect(server.last.path, '/items/abc/file');
      expect(server.last.data, {
        'version': 1,
        'parentId': 'p1',
        'tags': ['x'],
      });
    },
  );

  test('SearchRepository decodes hits', () async {
    server.reply = {
      'hits': [fixture('SearchHit')],
    };
    final hits = await SearchRepository(api)
        .search('notes', type: ItemType.note, limit: 10);
    expect(hits.single.matchedIn, SearchMatch.content);
    expect(server.last.queryParameters, {
      'q': 'notes',
      'type': 'note',
      'limit': '10',
    });
  });

  group('ScheduleRepository', () {
    late ScheduleRepository schedule;
    setUp(() => schedule = ScheduleRepository(api));

    test('range sends UTC instants', () async {
      server.reply = {
        'entries': [fixture('ScheduleEntry')],
      };
      final entries = await schedule.range(
        DateTime.utc(2026, 11),
        DateTime.utc(2026, 12),
      );
      expect(entries.single.recurrence, Recurrence.weekly);
      expect(server.last.queryParameters, {
        'from': '2026-11-01T00:00:00.000Z',
        'to': '2026-12-01T00:00:00.000Z',
      });
    });

    test('create converts local times to UTC', () async {
      server.reply = {'entry': fixture('ScheduleEntry')};
      final start = DateTime(2026, 11, 4, 9);
      await schedule.create(
        kind: ScheduleKind.event,
        title: 'Dentist',
        startAt: start,
        endAt: start.add(const Duration(hours: 1)),
        timeZone: 'Asia/Manila',
      );
      final body = server.last.data as Json;
      expect(body['startAt'], start.toUtc().toIso8601String());
      expect(body['startAt'], endsWith('Z'));
      expect(body, containsPair('recurrence', 'none'));
      expect(body, isNot(contains('itemId')));
    });

    test('update and remove carry the edit scope', () async {
      server.reply = {'entry': fixture('ScheduleEntry')};
      await schedule.update(
        'e1',
        scope: EditScope.future,
        title: 'Moved',
        color: const Change(null),
      );
      expect(server.last.queryParameters, {'scope': 'future'});
      expect(server.last.data, {'title': 'Moved', 'color': null});

      server.status = 204;
      await schedule.remove('e1');
      expect(server.last.method, 'DELETE');
      expect(server.last.queryParameters, {'scope': 'instance'});
    });
  });

  test('LinksRepository create omits empty optionals', () async {
    server.reply = {'link': fixture('Link')};
    final link = await LinksRepository(api)
        .create(sourceId: 's', targetId: 't');
    expect(link.origin, LinkOrigin.content);
    expect(server.last.data, {'sourceId': 's', 'targetId': 't'});
  });

  test('UploadsRepository config, sign and confirm', () async {
    final uploads = UploadsRepository(api);
    server.reply = fixture('UploadConfigResponse');
    expect((await uploads.config()).enabled, isTrue);

    server.reply = fixture('UploadSignatureResponse');
    expect((await uploads.sign('i1')).tags, 'niwa-pending');
    expect(server.last.data, {'itemId': 'i1'});

    server.reply = {'attachment': fixture('Attachment')};
    final a = await uploads.confirm(itemId: 'i1', publicId: 'p1');
    expect(a.mime, AttachmentMime.png);
  });

  test('WorkspaceRepository get', () async {
    server.reply = {'workspace': fixture('Workspace')};
    expect((await WorkspaceRepository(api).get()).name, 'My workspace');
  });
}
