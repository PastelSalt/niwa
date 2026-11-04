import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/ui/state_views.dart';
import 'package:niwa/features/items/data/item_providers.dart';
import 'package:niwa/features/items/domain/tree_model.dart';
import 'package:niwa/features/items/ui/item_type_icon.dart';
import 'package:niwa/features/knowledge/domain/prosemirror_text.dart';

/// What the user picked: an item, optionally one of its sections.
class LinkTarget {
  const new({
    required this.itemId,
    required this.title,
    this.anchorId,
    this.sectionTitle,
  });

  final String itemId;
  final String title;
  final String? anchorId;
  final String? sectionTitle;

  /// `niwaLink` node attrs (web `NiwaLinkAttrs`).
  Map<String, Object?> toAttrs() => {
    'itemId': itemId,
    'anchorId': anchorId,
    'title': title,
    'sectionTitle': sectionTitle,
  };
}

/// `[[` link picker (port of web `LinkPicker`): search items, then the →
/// button lists that item's sections. [excludeId] is the note being edited.
Future<LinkTarget?> showLinkPicker(BuildContext context, {String? excludeId}) =>
    Navigator.of(context).push<LinkTarget>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => _LinkPicker(excludeId: excludeId),
      ),
    );

class _LinkPicker extends ConsumerStatefulWidget {
  const new({this.excludeId});

  final String? excludeId;

  @override
  ConsumerState<_LinkPicker> createState() => _LinkPickerState();
}

class _LinkPickerState extends ConsumerState<_LinkPicker> {
  final _query = TextEditingController();
  ItemSummary? _sectionsOf;

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final section = _sectionsOf;
    return Scaffold(
      appBar: AppBar(
        title: Text(section == null ? 'Link to…' : section.title),
        leading: section == null
            ? null
            : BackButton(onPressed: () => setState(() => _sectionsOf = null)),
      ),
      body: section == null ? _items(context) : _sections(context, section),
    );
  }

  Widget _items(BuildContext context) {
    final model = ref.watch(treeProvider).value;
    final q = _query.text.trim().toLowerCase();
    final matches = <ItemSummary>[
      if (model != null)
        for (final i in model.byId.values)
          if (i.id != widget.excludeId &&
              (q.isEmpty || i.title.toLowerCase().contains(q)))
            i,
    ]..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: _query,
            autofocus: true,
            decoration: const InputDecoration(
              labelText: 'Find an item',
              prefixIcon: Icon(Icons.search),
            ),
            onChanged: (_) => setState(() {}),
          ),
        ),
        Expanded(
          child: matches.isEmpty
              ? const EmptyState(icon: Icons.search_off, title: 'No matches')
              : ListView.builder(
                  itemCount: matches.length.clamp(0, 50),
                  itemBuilder: (context, i) {
                    final item = matches[i];
                    final path = model == null
                        ? ''
                        : ancestorsOf(
                            model,
                            item.id,
                          ).map((a) => a.title).join(' › ');
                    return ListTile(
                      leading: ItemTypeIcon(item.type),
                      title: Text(item.title),
                      subtitle: path.isEmpty ? null : Text(path),
                      onTap: () => Navigator.of(context)
                          .pop(LinkTarget(itemId: item.id, title: item.title)),
                      trailing: IconButton(
                        tooltip: 'Link to a section of “${item.title}”',
                        icon: const Icon(Icons.arrow_forward),
                        onPressed: () => setState(() => _sectionsOf = item),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _sections(BuildContext context, ItemSummary item) {
    return FutureBuilder<Item>(
      future: ref.read(itemsRepositoryProvider).get(item.id),
      builder: (context, snap) {
        if (snap.hasError) {
          return ErrorState(error: snap.error!, onRetry: () => setState(() {}));
        }
        final full = snap.data;
        if (full == null) return const ListSkeleton(rows: 3);
        final headings = headingsOf(full.content);
        return ListView(
          children: [
            ListTile(
              leading: const Icon(Icons.description_outlined),
              title: const Text('The whole item'),
              onTap: () =>
                  Navigator.of(context)
                      .pop(LinkTarget(itemId: item.id, title: item.title)),
            ),
            if (headings.isEmpty)
              const ListTile(title: Text('No sections in this item')),
            for (final h in headings)
              ListTile(
                contentPadding: EdgeInsetsDirectional.only(
                  start: 16.0 * h.level,
                  end: 16,
                ),
                leading: const Icon(Icons.tag),
                title: Text(h.text),
                onTap: () => Navigator.of(context).pop(
                  LinkTarget(
                    itemId: item.id,
                    title: item.title,
                    anchorId: h.anchorId,
                    sectionTitle: h.text,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
