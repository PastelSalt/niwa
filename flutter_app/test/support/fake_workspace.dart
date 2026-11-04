import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:niwa/core/util/date_only.dart';

typedef Json = Map<String, dynamic>;

/// An in-memory NIWA workspace answering the item, tree, Trash, Focus, tag
/// and Inbox endpoints the way the backend does (versions, 409 on a stale
/// version, orderKeys, cascading delete/restore). Used by widget tests.
class FakeWorkspace {
  final items = <String, Json>{};

  /// Whether `/uploads/config` reports Cloudinary as configured.
  bool uploadsEnabled = true;
  final attachments = <Json>[];

  /// Capture clientId → item id.
  final captured = <String, String>{};
  int _ids = 0;
  int _order = 0;
  DateTime now = DateTime.utc(2026, 11, 4, 9);

  String _id() => (++_ids).toRadixString(16).padLeft(24, '0');
  String _key() => 'k${(++_order).toString().padLeft(4, '0')}';

  static String natureOf(String type) =>
      type == 'project' || type == 'task' ? 'actionable' : 'knowledge';

  /// Adds an item; returns its id. [id] may be given for readable tests.
  String add(
    String title, {
    String? parent,
    String type = 'note',
    String? id,
    String status = 'not_started',
    String priority = 'none',
    String? dueAt,
    List<String> tags = const [],
    Json? content,
    bool inbox = false,
  }) {
    final itemId = id ?? _id();
    items[itemId] = {
      'id': itemId,
      'workspaceId': '6745f0c2a1b2c3d4e5f60701',
      'parentId': parent,
      'title': title,
      'content': content,
      'type': type,
      'nature': natureOf(type),
      'status': status,
      'priority': priority,
      'orderKey': _key(),
      'tags': tags,
      'dueAt': dueAt,
      'estimatedMinutes': null,
      'reviewAt': null,
      'sourceUrl': null,
      'inboxedAt': inbox ? _ts() : null,
      'suggestedParentId': null,
      'archivedAt': null,
      'deletedAt': null,
      'version': 1,
      'createdAt': _ts(),
      'updatedAt': _ts(),
      'completedAt': status == 'completed' ? _ts() : null,
    };
    return itemId;
  }

  String _ts() => now.toIso8601String();

  Json item(String id) => items[id]!;
  Json _summary(Json i) => {...i}..remove('content');

  bool _live(Json i) => i['deletedAt'] == null;
  bool _filed(Json i) => _live(i) && i['inboxedAt'] == null;

  List<Json> _children(String? parent) =>
      items.values.where((i) => i['parentId'] == parent && _filed(i)).toList()
        ..sort(
          (a, b) =>
              (a['orderKey'] as String).compareTo(b['orderKey'] as String),
        );

  Iterable<String> _descendants(String id) sync* {
    for (final c in items.values.where((i) => i['parentId'] == id)) {
      yield c['id'] as String;
      yield* _descendants(c['id'] as String);
    }
  }

  void _touch(Json i) {
    i['version'] = (i['version'] as int) + 1;
    now = now.add(const Duration(minutes: 1));
    i['updatedAt'] = _ts();
  }

  /// Reorders [id] within [parent] (before/after a sibling, else at the end)
  /// and rewrites the siblings' orderKeys.
  void _place(String id, String? parent, {String? before, String? after}) {
    final sibs = _children(parent).where((s) => s['id'] != id).toList();
    var at = sibs.length;
    if (before != null) at = sibs.indexWhere((s) => s['id'] == before);
    if (after != null) at = sibs.indexWhere((s) => s['id'] == after) + 1;
    sibs.insert(at.clamp(0, sibs.length), items[id]!);
    for (final s in sibs) {
      s['orderKey'] = _key();
    }
    items[id]!['parentId'] = parent;
  }

  static ResponseBody _json(int status, Object? body) =>
      ResponseBody.fromString(
        jsonEncode(body),
        status,
        headers: {
          Headers.contentTypeHeader: [Headers.jsonContentType],
        },
      );

  static ResponseBody _error(int status, String code, String message) =>
      _json(status, {
        'error': {'code': code, 'message': message},
      });

  /// Like the backend: a stale version → 409 with the current item.
  ResponseBody? _versioned(Json body, Json item) =>
      body['version'] != item['version']
      ? _json(409, {
          'error': {
            'code': 'VERSION_CONFLICT',
            'message': 'This item was changed elsewhere. Reload and try again.',
            'details': {'current': item},
          },
        })
      : null;

  // ---- Schedule (SCHEDULER.md §3–§4, simplified materialisation) ----

  final entries = <String, Json>{};
  final series = <String, Json>{};
  int _entryIds = 0;

  /// Occurrences created per series (the backend goes 8 weeks ahead).
  static const occurrences = 8;

  DateTime _step(DateTime anchor, String rule, int n) => switch (rule) {
    'daily' => anchor.add(Duration(days: n)),
    'weekly' => anchor.add(Duration(days: 7 * n)),
    _ => DateTime.utc(
      anchor.year,
      anchor.month + n,
      anchor.day,
      anchor.hour,
      anchor.minute,
    ),
  };

  Json _newEntry(Json body, {String? seriesId, int? index, DateTime? start}) {
    final s = start ?? DateTime.parse(body['startAt'] as String);
    final duration = DateTime.parse(body['endAt'] as String)
        .difference(DateTime.parse(body['startAt'] as String));
    final id = 'e${++_entryIds}';
    return entries[id] = {
      'id': id,
      'kind': body['kind'],
      'itemId': body['itemId'],
      'title': body['title'] ?? '',
      'startAt': s.toUtc().toIso8601String(),
      'endAt': s.add(duration).toUtc().toIso8601String(),
      'isAllDay': body['isAllDay'] ?? false,
      'color': body['color'],
      'recurrence': seriesId == null ? 'none' : body['recurrence'],
      'seriesId': seriesId,
      'seriesIndex': index,
      'createdAt': _ts(),
      'updatedAt': _ts(),
    };
  }

  /// Creates a one-off entry or a series with its first [occurrences].
  Json createEntry(Json body) {
    final rule = body['recurrence'] as String? ?? 'none';
    if (rule == 'none') return _newEntry(body);
    final sid = 's${series.length + 1}';
    series[sid] = {'recurrence': rule, 'timeZone': body['timeZone']};
    final anchor = DateTime.parse(body['startAt'] as String);
    Json? first;
    for (var n = 0; n < occurrences; n++) {
      final e = _newEntry(
        body,
        seriesId: sid,
        index: n,
        start: _step(anchor, rule, n),
      );
      first ??= e;
    }
    return first!;
  }

  void _dropFollowing(Json e) {
    final sid = e['seriesId'];
    final n = e['seriesIndex'] as int;
    entries.removeWhere(
      (_, x) => x['seriesId'] == sid && (x['seriesIndex'] as int) >= n,
    );
  }

  /// Manual links (content links are read from niwaLink nodes).
  final manualLinks = <Json>[];

  Iterable<Json> _contentLinks(Json source) sync* {
    Iterable<Json> walk(Object? n) sync* {
      if (n is! Map) return;
      if (n['type'] == 'niwaLink') yield (n['attrs'] as Map).cast();
      for (final c in (n['content'] as List?) ?? const []) {
        yield* walk(c);
      }
    }

    for (final a in walk(source['content'])) {
      yield {
        'id': 'c-${source['id']}-${a['itemId']}-${a['anchorId']}',
        'sourceId': source['id'],
        'targetId': a['itemId'],
        'targetAnchorId': a['anchorId'],
        'label': null,
        'origin': 'content',
        'targetSection': a['sectionTitle'],
        'createdAt': _ts(),
      };
    }
  }

  List<Json> _allLinks() => [
    for (final i in items.values.where(_live)) ..._contentLinks(i),
    ...manualLinks,
  ];

  /// Answers [o], or null when the path isn't one of these endpoints.
  ResponseBody? handle(RequestOptions o) {
    final path = o.path;
    final body = (o.data is Map ? o.data as Json : const <String, dynamic>{});
    final seg = path.split('/')..removeAt(0);

    switch ((o.method, seg)) {
      case ('GET', ['tree']):
        final archived = o.queryParameters['includeArchived'] == 'true';
        return _json(200, {
          'items': [
            for (final i in items.values)
              if (_filed(i) && (archived || i['archivedAt'] == null))
                _summary(i),
          ],
        });
      case ('GET', ['trash']):
        // Deleted roots only (their descendants come back with them).
        return _json(200, {
          'items': [
            for (final i in items.values)
              if (i['deletedAt'] != null &&
                  (i['parentId'] == null ||
                      items[i['parentId']]?['deletedAt'] == null))
                _summary(i),
          ],
        });
      case ('DELETE', ['items', final id, 'permanent']):
        final batch = [id, ..._descendants(id)]..forEach(items.remove);
        return _json(200, {'ok': true, 'affected': batch.length});
      case ('GET', ['uploads', 'config']):
        return _json(200, {
          'enabled': uploadsEnabled,
          'maxBytes': 10485760,
          'allowedMime': ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
        });
      case ('POST', ['uploads', 'sign']):
        if (!uploadsEnabled) {
          return _error(503, 'NOT_CONFIGURED', 'Image uploads are off.');
        }
        return _json(200, {
          'cloudName': 'demo',
          'apiKey': '123456789012345',
          'timestamp': 1793700000,
          'signature': 'sig-${body['itemId']}',
          'folder': 'niwa/ws',
          'publicId': 'img${attachments.length + 1}',
          'tags': 'niwa-pending',
          'allowedFormats': 'png,jpg,webp,gif',
          'uploadUrl': 'https://api.cloudinary.com/v1_1/demo/image/upload',
        });
      case ('POST', ['attachments']):
        final a = {
          'id': 'att${attachments.length + 1}',
          'itemId': body['itemId'],
          // Cloudinary's public_id already includes the folder.
          'cloudinaryPublicId': body['publicId'],
          'secureUrl':
              'https://res.cloudinary.com/demo/image/upload/v1/${body['publicId']}.png',
          'mime': 'image/png',
          'size': 2048,
          'createdAt': _ts(),
        };
        attachments.add(a);
        return _json(201, {'attachment': a});
      case ('GET', ['inbox']):
        // Newest first, like the backend.
        return _json(200, {
          'items': [
            for (final i in items.values.toList().reversed)
              if (_live(i) && i['inboxedAt'] != null) _summary(i),
          ],
        });
      case ('POST', ['items', final id, 'file']):
        final i = items[id]!;
        if (_versioned(body, i) case final conflict?) return conflict;
        if (i['inboxedAt'] == null) {
          return _error(409, 'CONFLICT', 'This item is already filed.');
        }
        i
          ..['inboxedAt'] = null
          ..['suggestedParentId'] = null;
        if (body['type'] case final String type) {
          i
            ..['type'] = type
            ..['nature'] = natureOf(type);
        }
        if (body.containsKey('dueAt')) i['dueAt'] = body['dueAt'];
        if (body['tags'] case final List<Object?> tags) i['tags'] = tags;
        _place(id, body['parentId'] as String);
        _touch(i);
        return _json(200, {'item': i});
      case ('GET', ['search']):
        final q = (o.queryParameters['q'] as String).toLowerCase();
        final nature = o.queryParameters['nature'];
        final archived = o.queryParameters['includeArchived'] == 'true';
        String plain(Json i) {
          final out = StringBuffer();
          void walk(Object? n) {
            if (n is! Map) return;
            if (n['text'] case final String t) out.write('$t ');
            ((n['content'] as List?) ?? const []).forEach(walk);
          }

          walk(i['content']);
          return out.toString().trim();
        }

        return _json(200, {
          'hits': [
            for (final i in items.values)
              if (_filed(i) &&
                  (nature == null || i['nature'] == nature) &&
                  (archived || i['archivedAt'] == null))
                if ((i['title'] as String).toLowerCase().contains(q))
                  {
                    'item': _summary(i),
                    'snippet': null,
                    'matchedIn': 'title',
                    'score': 3,
                  }
                else if ((i['tags'] as List).any(
                  (t) => (t as String).toLowerCase().contains(q),
                ))
                  {
                    'item': _summary(i),
                    'snippet': null,
                    'matchedIn': 'tags',
                    'score': 2,
                  }
                else if (plain(i).toLowerCase().contains(q))
                  {
                    'item': _summary(i),
                    'snippet': plain(i),
                    'matchedIn': 'content',
                    'score': 1,
                  },
          ],
        });
      case ('GET', ['focus']):
        final today = o.queryParameters['today'] as String? ?? dateOnly(now);
        final open = [
          for (final i in items.values)
            if (_filed(i) &&
                i['archivedAt'] == null &&
                i['nature'] == 'actionable' &&
                i['status'] != 'completed')
              i,
        ];
        bool due(Json i, bool Function(String) test) =>
            i['dueAt'] != null && test(i['dueAt'] as String);
        return _json(200, {
          'inProgress': [
            for (final i in open)
              if (i['status'] == 'in_progress') _summary(i),
          ],
          'highPriority': [
            for (final i in open)
              if (i['priority'] == 'high' || i['priority'] == 'critical')
                _summary(i),
          ],
          'overdue': [
            for (final i in open)
              if (due(i, (d) => d.compareTo(today) < 0)) _summary(i),
          ],
          'upcoming': [
            for (final i in open)
              if (due(i, (d) => d.compareTo(today) >= 0)) _summary(i),
          ],
          'recentlyUpdated': <Json>[],
        });
      case ('POST', ['inbox']):
        // Idempotent on clientId, like the backend.
        final clientId = body['clientId'] as String?;
        final earlier = clientId == null ? null : captured[clientId];
        if (earlier != null) return _json(201, {'item': item(earlier)});
        final id = add(
          body['title'] as String,
          type: body['type'] as String? ?? 'idea',
          content: body['content'] as Json?,
          inbox: true,
        );
        item(id)['suggestedParentId'] = body['suggestedParentId'];
        if (clientId != null) captured[clientId] = id;
        return _json(201, {'item': item(id)});
      case ('GET', ['tags']):
        final counts = <String, int>{};
        for (final i in items.values.where(_live)) {
          for (final t in (i['tags'] as List).cast<String>()) {
            counts[t] = (counts[t] ?? 0) + 1;
          }
        }
        return _json(200, {
          'tags': [
            for (final MapEntry(:key, :value) in counts.entries)
              {'tag': key, 'count': value},
          ],
        });
      case ('POST', ['items']):
        final parent = body['parentId'] as String?;
        final id = add(
          body['title'] as String,
          parent: parent,
          type: body['type'] as String? ?? 'note',
        );
        _place(id, parent, after: body['afterId'] as String?);
        return _json(201, {'item': item(id)});
      case ('GET', ['items', final id]):
        final i = items[id];
        if (i == null || !_live(i)) {
          return _error(404, 'NOT_FOUND', 'Item not found.');
        }
        return _json(200, {'item': i});
      case ('PATCH', ['items', final id]):
        final i = items[id]!;
        if (_versioned(body, i) case final conflict?) return conflict;
        for (final MapEntry(:key, :value) in body.entries) {
          if (key != 'version') i[key] = value;
        }
        i['nature'] = natureOf(i['type'] as String);
        i['completedAt'] = i['status'] == 'completed' ? _ts() : null;
        _touch(i);
        return _json(200, {'item': i});
      case ('POST', ['items', final id, 'move']):
        final i = items[id]!;
        if (_versioned(body, i) case final conflict?) return conflict;
        _place(
          id,
          body['parentId'] as String?,
          before: body['beforeId'] as String?,
          after: body['afterId'] as String?,
        );
        _touch(i);
        return _json(200, {'item': i});
      case ('POST', ['items', final id, final op])
          when op == 'archive' || op == 'unarchive':
        final i = items[id]!;
        if (_versioned(body, i) case final conflict?) return conflict;
        i['archivedAt'] = op == 'archive' ? _ts() : null;
        _touch(i);
        return _json(200, {'item': i});
      case ('DELETE', ['items', final id]):
        final batch = [id, ..._descendants(id)];
        for (final b in batch) {
          items[b]!['deletedAt'] = _ts();
        }
        return _json(200, {'ok': true, 'affected': batch.length});
      case ('GET', ['items', final id, 'links']):
        Json withItem(Json link, String otherId) => {
          'link': link,
          'item': _summary(items[otherId]!),
        };
        final all = _allLinks();
        return _json(200, {
          'outgoing': [
            for (final l in all)
              if (l['sourceId'] == id && items.containsKey(l['targetId']))
                withItem(l, l['targetId'] as String),
          ],
          'backlinks': [
            for (final l in all)
              if (l['targetId'] == id && items.containsKey(l['sourceId']))
                withItem(l, l['sourceId'] as String),
          ],
        });
      case ('POST', ['links']):
        final link = {
          'id': 'm${manualLinks.length + 1}',
          'sourceId': body['sourceId'],
          'targetId': body['targetId'],
          'targetAnchorId': body['targetAnchorId'],
          'label': body['label'],
          'origin': 'manual',
          'targetSection': null,
          'createdAt': _ts(),
        };
        manualLinks.add(link);
        return _json(201, {'link': link});
      case ('DELETE', ['links', final id]):
        manualLinks.removeWhere((l) => l['id'] == id);
        return ResponseBody.fromString('', 204);
      case ('POST', ['items', final id, 'promote-section']):
        // The heading and everything under it (until the next heading of
        // the same or a higher level) becomes a child note.
        final parent = items[id]!;
        if (_versioned(body, parent) case final conflict?) return conflict;
        final blocks = ((parent['content'] as Map)['content'] as List)
            .cast<Json>();
        final at = blocks.indexWhere(
          (b) =>
              b['type'] == 'heading' &&
              (b['attrs'] as Map)['anchorId'] == body['anchorId'],
        );
        if (at < 0) return _error(404, 'NOT_FOUND', 'Section not found.');
        final level = (blocks[at]['attrs'] as Map)['level'] as int;
        var end = at + 1;
        while (end < blocks.length &&
            !(blocks[end]['type'] == 'heading' &&
                ((blocks[end]['attrs'] as Map)['level'] as int) <= level)) {
          end++;
        }
        final heading = blocks[at];
        final title = ((heading['content'] as List?) ?? const [])
            .map((t) => (t as Map)['text'])
            .join();
        final childId = add(
          title,
          parent: id,
          content: {'type': 'doc', 'content': blocks.sublist(at + 1, end)},
        );
        parent['content'] = {
          'type': 'doc',
          'content': [...blocks.sublist(0, at), ...blocks.sublist(end)],
        };
        _touch(parent);
        return _json(200, {'parent': parent, 'child': item(childId)});
      case ('GET', ['schedule']):
        final from = DateTime.parse(o.queryParameters['from'] as String);
        final to = DateTime.parse(o.queryParameters['to'] as String);
        return _json(200, {
          'entries': [
            for (final e in entries.values)
              if (DateTime.parse(e['startAt'] as String).isBefore(to) &&
                  DateTime.parse(e['endAt'] as String).isAfter(from))
                e,
          ],
        });
      case ('GET', ['items', final id, 'schedule']):
        return _json(200, {
          'entries': [
            for (final e in entries.values)
              if (e['itemId'] == id) e,
          ],
        });
      case ('POST', ['schedule']):
        return _json(201, {'entry': createEntry(body)});
      case ('PATCH', ['schedule', final id]):
        final e = entries[id];
        if (e == null) return _error(404, 'NOT_FOUND', 'Entry not found.');
        final scope = o.queryParameters['scope'] ?? 'instance';
        if (scope == 'future' && e['seriesId'] != null) {
          // End the series before this one; start a new one from here.
          final merged = {...e, ...body};
          _dropFollowing(e);
          return _json(200, {'entry': createEntry(merged)});
        }
        for (final MapEntry(:key, :value) in body.entries) {
          if (key != 'recurrence' && key != 'timeZone') e[key] = value;
        }
        e['updatedAt'] = _ts();
        return _json(200, {'entry': e});
      case ('DELETE', ['schedule', final id]):
        final e = entries[id];
        if (e == null) return _error(404, 'NOT_FOUND', 'Entry not found.');
        if (o.queryParameters['scope'] == 'future' && e['seriesId'] != null) {
          _dropFollowing(e);
        } else {
          entries.remove(id);
        }
        return ResponseBody.fromString('', 204);
      case ('POST', ['items', final id, 'restore']):
        final batch = [id, ..._descendants(id)];
        for (final b in batch) {
          items[b]!['deletedAt'] = null;
        }
        final i = items[id]!;
        final parent = i['parentId'] as String?;
        final parentGone =
            parent != null && (items[parent] == null || !_live(items[parent]!));
        if (parentGone) {
          i['parentId'] = null;
          i['inboxedAt'] = _ts();
        }
        _touch(i);
        return _json(200, {
          'item': i,
          'restoredTo': parentGone ? 'inbox' : 'original',
          'restoredCount': batch.length,
        });
    }
    return null;
  }
}
