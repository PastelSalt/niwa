import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/core/api/error_message.dart';
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/core/ui/snackbars.dart';
import 'package:niwa/features/items/ui/item_type_icon.dart';
import 'package:niwa/features/knowledge/data/link_providers.dart';
import 'package:niwa/features/knowledge/ui/link_picker.dart';

/// Links from this item (content links and manual "related"), and backlinks
/// (port of web `LinksPanel`). Manual links can be added and removed here;
/// content links follow the note body.
class LinksPanel extends ConsumerWidget {
  const new({required this.item, super.key});

  final Item item;

  Future<void> _addRelated(BuildContext context, WidgetRef ref) async {
    final target = await showLinkPicker(context, excludeId: item.id);
    if (target == null) return;
    try {
      await ref
          .read(linksRepositoryProvider)
          .create(
            sourceId: item.id,
            targetId: target.itemId,
            targetAnchorId: target.anchorId,
          );
      ref.invalidate(itemLinksProvider(item.id));
    } on Object catch (e) {
      ref.read(snackbarsProvider).show(messageOf(e));
    }
  }

  Future<void> _remove(WidgetRef ref, Link link) async {
    try {
      await ref.read(linksRepositoryProvider).remove(link.id);
      ref.invalidate(itemLinksProvider(item.id));
    } on Object catch (e) {
      ref.read(snackbarsProvider).show(messageOf(e));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final links = ref.watch(itemLinksProvider(item.id)).value;
    final secondary = NiwaColors.of(context).textSecondary;
    final title = Theme.of(context).textTheme.titleSmall;

    Widget row(LinkWithItem l, {required bool removable}) => ListTile(
      leading: ItemTypeIcon(l.item.type),
      title: Text(l.item.title),
      subtitle: l.link.targetSection == null
          ? null
          : Text('› ${l.link.targetSection}'),
      onTap: () => context.push(
        l.link.targetAnchorId == null || !removable
            ? '/items/${l.item.id}'
            : '/items/${l.item.id}#h-${l.link.targetAnchorId}',
      ),
      trailing: removable && l.link.origin == LinkOrigin.manual
          ? IconButton(
              tooltip: 'Remove link to “${l.item.title}”',
              icon: const Icon(Icons.link_off),
              onPressed: () => _remove(ref, l.link),
            )
          : null,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ListTile(
          title: Semantics(header: true, child: Text('Links', style: title)),
          trailing: TextButton.icon(
            icon: const Icon(Icons.add_link),
            label: const Text('Related'),
            onPressed: () => _addRelated(context, ref),
          ),
        ),
        if (links == null)
          const SizedBox.shrink()
        else ...[
          if (links.outgoing.isEmpty && links.backlinks.isEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Text(
                'No links yet. Type [[ in a note, or add a related item.',
                style: TextStyle(color: secondary),
              ),
            ),
          for (final l in links.outgoing) row(l, removable: true),
          if (links.backlinks.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Text('Linked from', style: TextStyle(color: secondary)),
            ),
            for (final l in links.backlinks) row(l, removable: false),
          ],
        ],
      ],
    );
  }
}
