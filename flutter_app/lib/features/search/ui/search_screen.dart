import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/app/niwa_app_bar.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/core/ui/state_views.dart';
import 'package:niwa/features/items/data/item_providers.dart';
import 'package:niwa/features/items/domain/tree_model.dart';
import 'package:niwa/features/items/ui/item_meta.dart';
import 'package:niwa/features/items/ui/item_type_icon.dart';
import 'package:niwa/features/search/data/search_providers.dart';

/// `/search?q=&nature=&archived=1` — same parameters as the web, so links
/// work on both. Typing is debounced into the URL.
class SearchScreen extends ConsumerStatefulWidget {
  const new({this.query = '', this.nature, this.archived = false, super.key});

  final String query;
  final ItemNature? nature;
  final bool archived;

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late final _controller = TextEditingController(text: widget.query);
  Timer? _debounce;

  @override
  void didUpdateWidget(SearchScreen old) {
    super.didUpdateWidget(old);
    // Navigated to another query (recent search, link): show it.
    if (widget.query != old.query) {
      // A pending keystroke mustn't undo this navigation.
      if (_controller.text.trim() != widget.query) {
        _debounce?.cancel();
        _controller.text = widget.query;
      }
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _go({
    String? q,
    ItemNature? nature,
    bool? archived,
    bool clearNature = false,
  }) {
    final query = (q ?? widget.query).trim();
    final n = clearNature ? null : nature ?? widget.nature;
    final a = archived ?? widget.archived;
    context.go(
      Uri(
        path: '/search',
        queryParameters: {
          if (query.isNotEmpty) 'q': query,
          if (n != null) 'nature': n.wire,
          if (a) 'archived': '1',
        },
      ).toString(),
    );
  }

  void _typed(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (mounted) _go(q: v);
    });
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.query;
    return Scaffold(
      appBar: const NiwaAppBar(title: 'Search', showSearch: false),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: SearchBar(
              controller: _controller,
              hintText: 'Search titles, tags and notes',
              leading: const Icon(Icons.search),
              textInputAction: TextInputAction.search,
              onChanged: _typed,
              onSubmitted: (v) {
                _debounce?.cancel();
                _go(q: v);
              },
              trailing: [
                if (_controller.text.isNotEmpty)
                  IconButton(
                    tooltip: 'Clear search',
                    icon: const Icon(Icons.close),
                    onPressed: () {
                      _debounce?.cancel();
                      _controller.clear();
                      _go(q: '');
                    },
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: SegmentedButton<ItemNature?>(
                    showSelectedIcon: false,
                    segments: const [
                      ButtonSegment(value: null, label: Text('All')),
                      ButtonSegment(
                        value: ItemNature.knowledge,
                        label: Text('Knowledge'),
                      ),
                      ButtonSegment(
                        value: ItemNature.actionable,
                        label: Text('Actionable'),
                      ),
                    ],
                    selected: {widget.nature},
                    onSelectionChanged: (s) =>
                        _go(nature: s.single, clearNature: s.single == null),
                  ),
                ),
              ],
            ),
          ),
          SwitchListTile(
            dense: true,
            title: const Text('Include archived'),
            value: widget.archived,
            onChanged: (v) => _go(archived: v),
          ),
          Expanded(
            child: q.isEmpty
                ? const _Recent()
                : _Results(
                    params: (
                      q: q,
                      nature: widget.nature,
                      archived: widget.archived,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _Recent extends ConsumerWidget {
  const new();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recent = ref.watch(recentSearchesProvider);
    if (recent.isEmpty) {
      return const EmptyState(
        icon: Icons.manage_search,
        title: 'Find anything',
        message: 'Search titles, tags and note text.',
      );
    }
    return ListView(
      children: [
        ListTile(
          title: Text(
            'Recent searches',
            style: Theme.of(context).textTheme.titleSmall,
          ),
          trailing: TextButton(
            onPressed: () => ref.read(recentSearchesProvider.notifier).clear(),
            child: const Text('Clear'),
          ),
        ),
        for (final r in recent)
          ListTile(
            leading: const Icon(Icons.history),
            title: Text(r),
            onTap: () => context.go(
              Uri(path: '/search', queryParameters: {'q': r}).toString(),
            ),
          ),
      ],
    );
  }
}

class _Results extends ConsumerWidget {
  const new({required this.params});

  final SearchParams params;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final result = ref.watch(searchProvider(params));
    final model = ref.watch(treeProvider).value;
    final terms = params.q.split(RegExp(r'\s+'));
    ref.listen(searchProvider(params), (_, next) {
      if (next.hasValue) {
        unawaited(ref.read(recentSearchesProvider.notifier).add(params.q));
      }
    });

    return switch (result) {
      AsyncData(:final value) when value.hits.isEmpty => EmptyState(
        icon: Icons.search_off,
        title: 'No results for “${params.q}”',
        message: value.offline
            ? "You're offline — only saved titles and tags were searched."
            : null,
      ),
      AsyncData(:final value) => Column(
        children: [
          if (value.offline)
            const MaterialBanner(
              content: Text('Offline — searching saved titles and tags only.'),
              actions: [SizedBox.shrink()],
            ),
          Expanded(
            child: Semantics(
              label: 'Search results',
              container: true,
              child: ListView.separated(
                itemCount: value.hits.length,
                separatorBuilder: (_, _) => const Divider(height: 1),
                itemBuilder: (context, i) =>
                    _HitRow(hit: value.hits[i], terms: terms, model: model),
              ),
            ),
          ),
        ],
      ),
      AsyncError(:final error) => ErrorState(
        error: error,
        onRetry: () => ref.invalidate(searchProvider(params)),
      ),
      _ => const ListSkeleton(rows: 4),
    };
  }
}

class _HitRow extends StatelessWidget {
  const new({required this.hit, required this.terms, this.model});

  final SearchHit hit;
  final List<String> terms;
  final TreeModel? model;

  @override
  Widget build(BuildContext context) {
    final item = hit.item;
    final secondary = NiwaColors.of(context).textSecondary;
    final model = this.model;
    final path = model == null
        ? ''
        : ancestorsOf(model, item.id).map((a) => a.title).join(' › ');

    return ListTile(
      leading: ItemTypeIcon(item.type),
      title: Highlight(text: item.title, terms: terms),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (path.isNotEmpty)
            Text(path, style: TextStyle(color: secondary, fontSize: 12)),
          if (hit.snippet case final snippet?)
            Highlight(text: snippet, terms: terms, maxLines: 2),
          if (item.tags.isNotEmpty)
            Wrap(
              spacing: 6,
              children: [
                for (final t in item.tags)
                  Highlight(text: '#$t', terms: terms, fontSize: 12),
              ],
            ),
        ],
      ),
      onTap: () => context.push('${lensPath(item.nature)}/${item.id}'),
    );
  }
}

/// Text with every match of any term marked (port of web `Highlight`).
class Highlight extends StatelessWidget {
  const new({
    required this.text,
    required this.terms,
    this.maxLines,
    this.fontSize,
    super.key,
  });

  final String text;
  final List<String> terms;
  final int? maxLines;
  final double? fontSize;

  @override
  Widget build(BuildContext context) {
    final clean = terms.where((t) => t.isNotEmpty).map(RegExp.escape).toList();
    final style = DefaultTextStyle.of(context).style
        .copyWith(fontSize: fontSize);
    if (clean.isEmpty) return Text(text, style: style, maxLines: maxLines);
    final re = RegExp('(${clean.join('|')})', caseSensitive: false);
    final mark = Theme.of(context).colorScheme.secondary
        .withValues(alpha: 0.35);
    final spans = <InlineSpan>[];
    var last = 0;
    for (final m in re.allMatches(text)) {
      if (m.start > last) {
        spans.add(TextSpan(text: text.substring(last, m.start)));
      }
      spans.add(
        TextSpan(
          text: m.group(0),
          style: TextStyle(backgroundColor: mark),
          semanticsLabel: m.group(0),
        ),
      );
      last = m.end;
    }
    if (last < text.length) spans.add(TextSpan(text: text.substring(last)));
    return Text.rich(
      TextSpan(style: style, children: spans),
      maxLines: maxLines,
      overflow: maxLines == null ? null : TextOverflow.ellipsis,
    );
  }
}
