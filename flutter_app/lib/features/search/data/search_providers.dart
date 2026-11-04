import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show FutureProviderFamily;
import 'package:niwa/core/api/api_exception.dart';
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/db/db_providers.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/features/items/data/item_providers.dart';

typedef SearchParams = ({String q, ItemNature? nature, bool archived});

class SearchResult {
  const new(this.hits, {this.offline = false});

  final List<SearchHit> hits;

  /// Served from the saved tree (titles and tags only) because the server
  /// couldn't be reached.
  final bool offline;
}

/// Server search; offline, a title/tag search over the cached tree.
final FutureProviderFamily<SearchResult, SearchParams> searchProvider =
    FutureProvider.family((ref, p) async {
      try {
        final hits = await ref
            .watch(searchRepositoryProvider)
            .search(p.q, nature: p.nature, includeArchived: p.archived);
        return SearchResult(hits);
      } on OfflineException {
        final model = await ref.read(treeProvider.future);
        final terms = p.q.toLowerCase().split(RegExp(r'\s+'));
        bool matches(String s) =>
            terms.every((t) => s.toLowerCase().contains(t));
        return SearchResult([
          for (final i in model.byId.values)
            if ((p.nature == null || i.nature == p.nature) &&
                (p.archived || i.archivedAt == null) &&
                (matches(i.title) || i.tags.any(matches)))
              SearchHit(
                item: i,
                snippet: null,
                matchedIn: matches(i.title)
                    ? SearchMatch.title
                    : SearchMatch.tags,
                score: 0,
              ),
        ], offline: true);
      }
    });

const _recentKey = 'search:recent';
const _maxRecent = 8;

/// Recent queries on this phone (wiped on logout with the cache).
class RecentSearches extends Notifier<List<String>> {
  @override
  List<String> build() {
    unawaited(Future.microtask(_load));
    return const [];
  }

  Future<void> _load() async {
    final json = await ref.read(appDatabaseProvider).readCache(_recentKey);
    if (json is List) state = json.whereType<String>().toList();
  }

  Future<void> add(String q) async {
    final query = q.trim();
    if (query.isEmpty) return;
    state = [
      query,
      ...state.where((s) => s.toLowerCase() != query.toLowerCase()),
    ].take(_maxRecent).toList();
    await ref.read(appDatabaseProvider).writeCache(_recentKey, state);
  }

  Future<void> clear() async {
    state = const [];
    await ref.read(appDatabaseProvider).writeCache(_recentKey, state);
  }
}

final recentSearchesProvider = NotifierProvider<RecentSearches, List<String>>(
  RecentSearches.new,
);
