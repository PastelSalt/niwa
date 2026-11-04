import 'dart:convert';
import 'dart:math';

import 'package:dart_quill_delta/dart_quill_delta.dart';

/// ProseMirror JSON (what the web stores, specs §12.4) ⇄ Quill Delta (what
/// flutter_quill edits), plan A-02 MA6.P1.
///
/// Supported both ways, identical round-trip: paragraph, heading 1–3 with
/// `anchorId`, bold / italic / strike / underline / code / link marks, hard
/// break, bullet and ordered lists (nested), blockquote of paragraphs, code
/// block, horizontal rule, `niwaLink`, image with `attachmentId`.
///
/// Anything else — unknown nodes, or known ones in a shape Quill can't hold
/// (a list item with two paragraphs, a code block with a language…) — becomes
/// a **locked block**: an embed carrying the original JSON, written back
/// byte-for-byte. Unsupported inline content locks its whole block.
///
/// Heading anchors can't be Quill line attributes (unknown ones are dropped),
/// so each anchored heading starts with a zero-width `niwaAnchor` embed.

typedef Json = Map<String, dynamic>;

/// Embed types in the Delta.
abstract final class NiwaEmbed {
  static const anchor = 'niwaAnchor';
  static const link = 'niwaLink';
  static const hardBreak = 'niwaBreak';
  static const rule = 'niwaRule';
  static const image = 'niwaImage';
  static const locked = 'niwaLocked';

  static const Set<String> block = {rule, image, locked};
}

/// TipTap Link defaults (StarterKit `link`); other values aren't editable here.
const Map<String, String?> _linkDefaults = {
  'target': '_blank',
  'rel': 'noopener noreferrer nofollow',
  'class': null,
  'title': null,
};

/// ProseMirror sorts marks by schema rank: Link (priority 1000) first, then
/// StarterKit order.
const _markOrder = ['link', 'bold', 'code', 'italic', 'strike', 'underline'];
const _simpleMarks = {'bold', 'italic', 'strike', 'underline', 'code'};

/// Block types whose consecutive Delta lines are read back as one block.
const Set<String> _merging = {
  'bulletList',
  'orderedList',
  'blockquote',
  'codeBlock',
};

const _imageAttrs = {'src', 'alt', 'title', 'width', 'height', 'attachmentId'};

class _Unsupported implements Exception {
  const new();
}

// ---------------------------------------------------------------------------
// ProseMirror → Delta
// ---------------------------------------------------------------------------

Delta pmToDelta(Json? doc) {
  final delta = Delta();
  final blocks = (doc?['content'] as List<Object?>?) ?? const [];
  String? previous;
  for (final node in blocks.cast<Json>()) {
    var out = Delta();
    // Two adjacent lists / quotes / code blocks of the same kind would merge
    // into one in Delta; keep the second exactly as it is instead.
    final type = node['type'] as String?;
    final mergesWithPrevious = type == previous && _merging.contains(type);
    previous = type;
    try {
      if (mergesWithPrevious) throw const _Unsupported();
      _block(out, node);
    } on _Unsupported {
      // Drop whatever was converted before the problem: the whole block is
      // kept as-is instead.
      out = Delta();
      _embedLine(out, NiwaEmbed.locked, jsonEncode(node));
    }
    out.operations.forEach(delta.push);
  }
  if (delta.isEmpty) delta.insert('\n');
  return delta;
}

void _embedLine(Delta d, String type, String data) {
  d
    ..insert({type: data})
    ..insert('\n');
}

List<Json> _children(Json node) =>
    ((node['content'] as List<Object?>?) ?? const []).cast<Json>();

Json _attrs(Json node) => (node['attrs'] as Json?) ?? const {};

bool _attrsAre(Json node, Map<String, Object?> expected) {
  final a = _attrs(node);
  return a.keys.every(expected.containsKey) &&
      expected.entries.every((e) => a[e.key] == e.value);
}

void _block(Delta d, Json node) {
  switch (node['type']) {
    case 'paragraph':
      if (node.containsKey('attrs')) throw const _Unsupported();
      _inline(d, _children(node));
      d.insert('\n');
    case 'heading':
      final level = _attrs(node)['level'];
      final anchor = _attrs(node)['anchorId'];
      if (level is! int || level < 1 || level > 3) throw const _Unsupported();
      if (!_attrs(node).keys.every({'level', 'anchorId'}.contains)) {
        throw const _Unsupported();
      }
      if (anchor is String) d.insert({NiwaEmbed.anchor: anchor});
      _inline(d, _children(node));
      d.insert('\n', {'header': level});
    case 'bulletList' || 'orderedList':
      _checkList(node, 0);
      _list(d, node, 0);
    case 'blockquote':
      final paras = _children(node);
      if (paras.isEmpty || paras.any((p) => p['type'] != 'paragraph')) {
        throw const _Unsupported();
      }
      for (final p in paras) {
        if (p.containsKey('attrs')) throw const _Unsupported();
        _inline(d, _children(p));
        d.insert('\n', {'blockquote': true});
      }
    case 'codeBlock':
      if (!_attrsAre(node, {'language': null})) throw const _Unsupported();
      final kids = _children(node);
      if (kids.any((k) => k['type'] != 'text' || k.containsKey('marks'))) {
        throw const _Unsupported();
      }
      final text = kids.map((k) => k['text'] as String).join();
      for (final line in text.split('\n')) {
        d
          ..insert(line)
          ..insert('\n', {'code-block': true});
      }
    case 'horizontalRule':
      if (node.containsKey('attrs') || node.containsKey('content')) {
        throw const _Unsupported();
      }
      _embedLine(d, NiwaEmbed.rule, '');
    case 'image':
      if (!_attrs(node).keys.every(_imageAttrs.contains) ||
          node.containsKey('content')) {
        throw const _Unsupported();
      }
      _embedLine(d, NiwaEmbed.image, jsonEncode(_attrs(node)));
    default:
      throw const _Unsupported();
  }
}

/// Lists Quill can hold: each item is one paragraph optionally followed by
/// nested lists; ordered lists start at 1.
void _checkList(Json list, int depth) {
  if (depth > 8) throw const _Unsupported();
  final ordered = list['type'] == 'orderedList';
  if (ordered
      ? !_attrsAre(list, {'start': 1, 'type': null})
      : list.containsKey('attrs')) {
    throw const _Unsupported();
  }
  final items = _children(list);
  if (items.isEmpty) throw const _Unsupported();
  for (final li in items) {
    final kids = _children(li);
    if (li['type'] != 'listItem' ||
        li.containsKey('attrs') ||
        kids.isEmpty ||
        kids.first['type'] != 'paragraph' ||
        kids.first.containsKey('attrs')) {
      throw const _Unsupported();
    }
    for (final nested in kids.skip(1)) {
      if (nested['type'] != 'bulletList' && nested['type'] != 'orderedList') {
        throw const _Unsupported();
      }
      _checkList(nested, depth + 1);
    }
  }
}

void _list(Delta d, Json list, int depth) {
  final kind = list['type'] == 'orderedList' ? 'ordered' : 'bullet';
  for (final li in _children(list)) {
    final kids = _children(li);
    _inline(d, _children(kids.first));
    d.insert('\n', {'list': kind, if (depth > 0) 'indent': depth});
    for (final nested in kids.skip(1)) {
      _list(d, nested, depth + 1);
    }
  }
}

Map<String, dynamic>? _markAttrs(Json node) {
  final marks = ((node['marks'] as List<Object?>?) ?? const []).cast<Json>();
  if (marks.isEmpty) return null;
  final out = <String, dynamic>{};
  for (final m in marks) {
    final type = m['type'];
    if (_simpleMarks.contains(type)) {
      if (m['attrs'] != null) throw const _Unsupported();
      out[type! as String] = true;
    } else if (type == 'link') {
      final a = (m['attrs'] as Json?) ?? const {};
      final href = a['href'];
      final rest = {...a}..remove('href');
      if (href is! String ||
          !rest.keys.every(_linkDefaults.containsKey) ||
          rest.entries.any((e) => _linkDefaults[e.key] != e.value)) {
        throw const _Unsupported();
      }
      out['link'] = href;
    } else {
      throw const _Unsupported();
    }
  }
  return out;
}

void _inline(Delta d, List<Json> content) {
  for (final n in content) {
    final attrs = _markAttrs(n);
    switch (n['type']) {
      case 'text':
        final text = n['text'] as String? ?? '';
        if (text.contains('\n')) throw const _Unsupported();
        d.insert(text, attrs);
      case 'hardBreak':
        if (n.containsKey('attrs')) throw const _Unsupported();
        d.insert({NiwaEmbed.hardBreak: ''}, attrs);
      case 'niwaLink':
        d.insert({NiwaEmbed.link: jsonEncode(_attrs(n))}, attrs);
      default:
        throw const _Unsupported();
    }
  }
}

// ---------------------------------------------------------------------------
// Delta → ProseMirror
// ---------------------------------------------------------------------------

class _Line {
  new(this.segments, this.attrs);

  /// Text strings and embed maps, each with its inline attributes.
  final List<(Object, Map<String, dynamic>?)> segments;
  final Map<String, dynamic> attrs;

  String? get blockEmbed {
    if (segments.length != 1) return null;
    final data = segments.single.$1;
    if (data is! Map || data.length != 1) return null;
    final type = data.keys.single as String;
    return NiwaEmbed.block.contains(type) ? type : null;
  }

  Object? get blockEmbedData => (segments.single.$1 as Map).values.single;

  String get text => [
    for (final (d, _) in segments)
      if (d is String) d,
  ].join();
}

List<_Line> _lines(Delta delta) {
  final lines = <_Line>[];
  var current = <(Object, Map<String, dynamic>?)>[];
  for (final op in delta.operations) {
    if (!op.isInsert) continue;
    final data = op.data;
    if (data is String) {
      final parts = data.split('\n');
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].isNotEmpty) current.add((parts[i], op.attributes));
        if (i < parts.length - 1) {
          lines.add(_Line(current, op.attributes ?? const {}));
          current = [];
        }
      }
    } else if (data != null) {
      current.add((data, op.attributes));
    }
  }
  if (current.isNotEmpty) lines.add(_Line(current, const {}));
  return lines;
}

/// [original] is the body that was loaded: its anchors are reused for
/// headings whose anchor embed got deleted, so links into them survive.
Json deltaToPm(Delta delta, {Json? original, Random? random}) {
  final lines = _lines(delta);
  final blocks = <Json>[];
  var i = 0;
  while (i < lines.length) {
    final line = lines[i];
    final a = line.attrs;
    if (line.blockEmbed case final type?) {
      blocks.add(_blockEmbed(type, line.blockEmbedData));
      i++;
    } else if (a['code-block'] == true) {
      final run = <String>[];
      while (i < lines.length && lines[i].attrs['code-block'] == true) {
        run.add(lines[i++].text);
      }
      final text = run.join('\n');
      blocks.add({
        'type': 'codeBlock',
        'attrs': {'language': null},
        if (text.isNotEmpty)
          'content': [
            {'type': 'text', 'text': text},
          ],
      });
    } else if (a['header'] case final int level) {
      // The web schema has H1–H3; Quill's menu offers more.
      blocks.add(_heading(line, level.clamp(1, 3)));
      i++;
    } else if (a['list'] is String) {
      final run = <_Line>[];
      while (i < lines.length &&
          lines[i].attrs['list'] is String &&
          lines[i].blockEmbed == null &&
          lines[i].attrs['code-block'] != true &&
          lines[i].attrs['header'] == null) {
        run.add(lines[i++]);
      }
      blocks.addAll(_lists(run));
    } else if (a['blockquote'] == true) {
      final paras = <Json>[];
      while (i < lines.length &&
          lines[i].attrs['blockquote'] == true &&
          lines[i].attrs['list'] == null &&
          lines[i].attrs['header'] == null &&
          lines[i].blockEmbed == null) {
        paras.add(_paragraph(lines[i++]));
      }
      blocks.add({'type': 'blockquote', 'content': paras});
    } else {
      blocks.add(_paragraph(line));
      i++;
    }
  }
  if (blocks.isEmpty) blocks.add({'type': 'paragraph'});
  final doc = {'type': 'doc', 'content': blocks};
  _guardAnchors(doc, original, random ?? Random());
  return doc;
}

Json _blockEmbed(String type, Object? data) => switch (type) {
  NiwaEmbed.rule => {'type': 'horizontalRule'},
  NiwaEmbed.image => {'type': 'image', 'attrs': jsonDecode(data! as String)},
  _ => jsonDecode(data! as String) as Json, // locked: the original node
};

Json _paragraph(_Line line) {
  final content = _inlineNodes(line.segments);
  return {'type': 'paragraph', if (content.isNotEmpty) 'content': content};
}

Json _heading(_Line line, int level) {
  String? anchor;
  for (final (d, _) in line.segments) {
    if (d is Map && d[NiwaEmbed.anchor] is String) {
      anchor ??= d[NiwaEmbed.anchor] as String;
    }
  }
  final content = _inlineNodes(line.segments);
  return {
    'type': 'heading',
    'attrs': {'level': level, 'anchorId': anchor},
    if (content.isNotEmpty) 'content': content,
  };
}

List<Object?>? _marks(Map<String, dynamic>? attrs) {
  if (attrs == null) return null;
  final marks = <Json>[];
  for (final type in _markOrder) {
    final v = attrs[type];
    if (v == null || v == false) continue;
    marks.add(
      type == 'link'
          ? {
              'type': 'link',
              'attrs': {'href': v, ..._linkDefaults},
            }
          : {'type': type},
    );
  }
  return marks.isEmpty ? null : marks;
}

List<Json> _inlineNodes(List<(Object, Map<String, dynamic>?)> segments) {
  final out = <Json>[];
  for (final (data, attrs) in segments) {
    final marks = _marks(attrs);
    if (data is String) {
      // Adjacent text with the same marks is one node in ProseMirror.
      final last = out.isEmpty ? null : out.last;
      if (last != null &&
          last['type'] == 'text' &&
          jsonEncode(last['marks']) == jsonEncode(marks)) {
        last['text'] = '${last['text']}$data';
      } else {
        out.add({'type': 'text', 'marks': ?marks, 'text': data});
      }
    } else if (data is Map && data.length == 1) {
      final type = data.keys.single;
      final value = data.values.single;
      switch (type) {
        case NiwaEmbed.link:
          out.add({
            'type': 'niwaLink',
            'attrs': jsonDecode(value as String),
            'marks': ?marks,
          });
        case NiwaEmbed.hardBreak:
          out.add({'type': 'hardBreak', 'marks': ?marks});
        // Anchors are heading attributes; other embeds can't be inline.
      }
    }
  }
  return out;
}

/// Lines with a `list` attribute → nested bullet/ordered lists. Indents that
/// jump by more than one level are clamped.
List<Json> _lists(List<_Line> run) {
  final levels = <int>[];
  var prev = -1;
  for (final l in run) {
    final want = (l.attrs['indent'] as int?) ?? 0;
    final level = min(want, prev + 1);
    levels.add(level);
    prev = level;
  }
  var i = 0;
  Json parse(int depth) {
    final kind = run[i].attrs['list'] == 'ordered'
        ? 'orderedList'
        : 'bulletList';
    final items = <Json>[];
    while (i < run.length && levels[i] >= depth) {
      if (levels[i] == depth) {
        final type = run[i].attrs['list'] == 'ordered'
            ? 'orderedList'
            : 'bulletList';
        if (type != kind) break;
        items.add({
          'type': 'listItem',
          'content': [_paragraph(run[i])],
        });
        i++;
      } else {
        // Deeper lines nest inside the latest item.
        (items.last['content'] as List<Json>).add(parse(depth + 1));
      }
    }
    return {
      'type': kind,
      if (kind == 'orderedList') 'attrs': {'start': 1, 'type': null},
      'content': items,
    };
  }

  final lists = <Json>[];
  while (i < run.length) {
    lists.add(parse(0));
  }
  return lists;
}

// ---------------------------------------------------------------------------
// Anchors (web `AnchorGuard`): present and unique on every heading.
// ---------------------------------------------------------------------------

const _anchorChars = 'abcdefghijklmnopqrstuvwxyz0123456789';

String newAnchorId(Random random) =>
    List.generate(8, (_) => _anchorChars[random.nextInt(36)]).join();

String _textOf(Json node) =>
    (node['text'] as String? ?? '') + _children(node).map(_textOf).join();

void _guardAnchors(Json doc, Json? original, Random random) {
  final headings = [
    for (final b in _children(doc))
      if (b['type'] == 'heading') b,
  ];
  // Anchors from the loaded body, by heading text, for reuse.
  final spare = <String, List<String>>{};
  for (final h in _children(original ?? const {})) {
    final id = _attrs(h)['anchorId'];
    if (h['type'] == 'heading' && id is String) {
      (spare[_textOf(h).trim()] ??= []).add(id);
    }
  }
  final used = <String>{};
  for (final h in headings) {
    final id = _attrs(h)['anchorId'];
    if (id is String && !used.contains(id)) used.add(id);
  }
  final seen = <String>{};
  for (final h in headings) {
    final attrs = h['attrs'] as Json;
    final id = attrs['anchorId'];
    if (id is String && seen.add(id)) continue;
    final reuse = spare[_textOf(h).trim()]?.where((s) => !used.contains(s));
    final next = reuse != null && reuse.isNotEmpty
        ? reuse.first
        : newAnchorId(random);
    attrs['anchorId'] = next;
    used.add(next);
    seen.add(next);
  }
}
