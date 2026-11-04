import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/features/items/data/item_providers.dart';
import 'package:niwa/features/knowledge/data/image_upload.dart';
import 'package:niwa/features/knowledge/domain/pm_delta.dart';
import 'package:niwa/features/knowledge/domain/prosemirror_text.dart';

/// Embed builders for the NIWA Delta embeds (see `pm_delta.dart`).
List<EmbedBuilder> niwaEmbedBuilders() => const [
  _AnchorEmbed(),
  NiwaLinkEmbed(),
  _BreakEmbed(),
  _RuleEmbed(),
  _ImageEmbed(),
  _LockedEmbed(),
];

Object? _data(EmbedContext c) => c.node.value.data;

/// Heading anchor: invisible, zero width.
class _AnchorEmbed extends EmbedBuilder {
  const new();

  @override
  String get key => NiwaEmbed.anchor;

  @override
  bool get expanded => false;

  @override
  String toPlainText(Embed node) => '';

  @override
  Widget build(BuildContext context, EmbedContext embedContext) =>
      const SizedBox.shrink();
}

/// Hard line break (Shift+Enter on the web) shown as a subtle return mark.
class _BreakEmbed extends EmbedBuilder {
  const new();

  @override
  String get key => NiwaEmbed.hardBreak;

  @override
  bool get expanded => false;

  @override
  String toPlainText(Embed node) => '\n';

  @override
  Widget build(BuildContext context, EmbedContext embedContext) => Icon(
    Icons.keyboard_return,
    size: 14,
    color: NiwaColors.of(context).textSecondary,
    semanticLabel: 'Line break',
  );
}

/// Link to another item or one of its sections (CONCEPT.md §5.2): live title
/// from the tree, "missing" when the item is gone; tap opens it.
class NiwaLinkEmbed extends EmbedBuilder {
  const new();

  @override
  String get key => NiwaEmbed.link;

  @override
  bool get expanded => false;

  @override
  String toPlainText(Embed node) {
    final attrs = jsonDecode(node.value.data as String) as Map;
    return '[[${attrs['title']}]]';
  }

  @override
  Widget build(BuildContext context, EmbedContext embedContext) {
    final attrs = jsonDecode(_data(embedContext)! as String) as Map;
    return NiwaLinkChip(
      itemId: attrs['itemId'] as String,
      anchorId: attrs['anchorId'] as String?,
      title: attrs['title'] as String? ?? '',
      sectionTitle: attrs['sectionTitle'] as String?,
    );
  }
}

class NiwaLinkChip extends ConsumerWidget {
  const new({
    required this.itemId,
    required this.title,
    this.anchorId,
    this.sectionTitle,
    super.key,
  });

  final String itemId;
  final String? anchorId;
  final String title;
  final String? sectionTitle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final model = ref.watch(treeProvider).value;
    final live = model?.byId[itemId];
    // Inbox items aren't in the tree, so only call it missing once loaded.
    final missing = model != null && live == null;
    final scheme = Theme.of(context).colorScheme;
    final name = live?.title ?? title;
    final label = sectionTitle == null ? name : '$name › $sectionTitle';
    return Semantics(
      link: true,
      label: missing ? 'Missing link: $label' : 'Link: $label',
      child: InkWell(
        onTap: () => context.push(
          '/items/$itemId${anchorId == null ? '' : '#h-$anchorId'}',
        ),
        borderRadius: BorderRadius.circular(NiwaTokens.radiusSmall),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
            color: missing
                ? scheme.errorContainer
                : scheme.primary.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(NiwaTokens.radiusSmall),
          ),
          child: ExcludeSemantics(
            child: Text(
              missing ? '$label (missing)' : label,
              style: TextStyle(
                color: missing ? scheme.onErrorContainer : scheme.primary,
                decoration: missing ? TextDecoration.lineThrough : null,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RuleEmbed extends EmbedBuilder {
  const new();

  @override
  String get key => NiwaEmbed.rule;

  @override
  Widget build(BuildContext context, EmbedContext embedContext) =>
      const Divider(height: 24);
}

/// Body image (Cloudinary, with `f_auto,q_auto` delivery already in `src`).
class _ImageEmbed extends EmbedBuilder {
  const new();

  @override
  String get key => NiwaEmbed.image;

  @override
  Widget build(BuildContext context, EmbedContext embedContext) {
    final attrs = jsonDecode(_data(embedContext)! as String) as Map;
    final alt = attrs['alt'] as String?;
    final dpr = MediaQuery.devicePixelRatioOf(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(NiwaTokens.radius),
        child: LayoutBuilder(
          builder: (context, c) => Image.network(
            // Sized for this screen; the stored src stays as the web wrote it.
            phoneImageUrl(
              attrs['src'] as String,
              c.maxWidth.isFinite ? c.maxWidth * dpr : 1080,
            ),
            cacheWidth: c.maxWidth.isFinite ? (c.maxWidth * dpr).round() : null,
            semanticLabel: alt,
            errorBuilder: (context, _, _) => Container(
              height: 120,
              alignment: Alignment.center,
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              child: Text(alt == null || alt.isEmpty ? 'Image' : alt),
            ),
          ),
        ),
      ),
    );
  }
}

/// Content the phone can't edit (CONCEPT: nothing is lost by editing on a
/// phone): shown read-only, written back unchanged.
class _LockedEmbed extends EmbedBuilder {
  const new();

  @override
  String get key => NiwaEmbed.locked;

  @override
  Widget build(BuildContext context, EmbedContext embedContext) {
    final node = jsonDecode(_data(embedContext)! as String) as Json;
    final text = textBlocks({
      'type': 'doc',
      'content': [node],
    }).map((b) => b.text).join('\n');
    final secondary = NiwaColors.of(context).textSecondary;
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        borderRadius: BorderRadius.circular(NiwaTokens.radiusSmall),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.lock_outline, size: 16, color: secondary),
              const SizedBox(width: 6),
              Text(
                'Edit on web or desktop',
                style: TextStyle(color: secondary, fontSize: 12),
              ),
            ],
          ),
          if (text.isNotEmpty) ...[const SizedBox(height: 6), Text(text)],
        ],
      ),
    );
  }
}
