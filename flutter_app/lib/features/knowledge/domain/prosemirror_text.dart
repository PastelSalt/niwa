/// Read-only view of ProseMirror JSON until the editor (MA6): the document
/// as a flat list of text blocks. Unknown nodes contribute their text.
library;

enum BlockKind { heading, paragraph, listItem, quote, code }

class TextBlock {
  const new(this.kind, this.text, {this.level = 0, this.anchorId});

  final BlockKind kind;
  final String text;

  /// Headings: the section anchor (deep links scroll here).
  final String? anchorId;

  /// Heading level (1–3) or list nesting depth.
  final int level;
}

List<TextBlock> textBlocks(Map<String, dynamic>? doc) {
  final out = <TextBlock>[];
  void walk(Object? node, {int listDepth = 0, bool inQuote = false}) {
    if (node is! Map<String, dynamic>) return;
    final type = node['type'];
    final children = (node['content'] as List<Object?>?) ?? const [];
    switch (type) {
      case 'heading':
        final attrs = (node['attrs'] as Map?) ?? const {};
        final level = attrs['level'];
        out.add(
          TextBlock(
            BlockKind.heading,
            _inline(node),
            level: level is int ? level : 1,
            anchorId: attrs['anchorId'] as String?,
          ),
        );
      case 'paragraph':
        final text = _inline(node);
        if (text.isEmpty) return;
        out.add(
          TextBlock(
            listDepth > 0
                ? BlockKind.listItem
                : inQuote
                ? BlockKind.quote
                : BlockKind.paragraph,
            text,
            level: listDepth,
          ),
        );
      case 'codeBlock':
        out.add(TextBlock(BlockKind.code, _inline(node)));
      case 'bulletList' || 'orderedList' || 'taskList':
        for (final c in children) {
          walk(c, listDepth: listDepth + 1, inQuote: inQuote);
        }
      case 'blockquote':
        for (final c in children) {
          walk(c, listDepth: listDepth, inQuote: true);
        }
      default:
        for (final c in children) {
          walk(c, listDepth: listDepth, inQuote: inQuote);
        }
    }
  }

  walk(doc);
  return out;
}

String _inline(Map<String, dynamic> node) {
  final buf = StringBuffer();
  void collect(Object? n) {
    if (n is! Map<String, dynamic>) return;
    if (n['type'] == 'text') buf.write(n['text'] ?? '');
    if (n['type'] == 'niwaLink') {
      final a = (n['attrs'] as Map?) ?? const {};
      buf.write(a['title'] ?? '');
      if (a['sectionTitle'] case final String section) buf.write(' › $section');
    }
    if (n['type'] == 'hardBreak') buf.write('\n');
    ((n['content'] as List<Object?>?) ?? const []).forEach(collect);
  }

  collect(node);
  return buf.toString();
}

/// A top-level heading: the document outline (port of web `headingsOf`).
class HeadingEntry {
  const new(this.anchorId, this.level, this.text);

  final String anchorId;
  final int level;
  final String text;
}

List<HeadingEntry> headingsOf(Map<String, dynamic>? doc) => [
  for (final n
      in ((doc?['content'] as List<Object?>?) ?? const [])
          .whereType<Map<String, dynamic>>())
    if (n['type'] == 'heading' && (n['attrs'] as Map?)?['anchorId'] is String)
      HeadingEntry(
        (n['attrs']! as Map)['anchorId'] as String,
        ((n['attrs']! as Map)['level'] as int?) ?? 1,
        _inline(n).trim().isEmpty ? 'Untitled heading' : _inline(n).trim(),
      ),
];
