import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/db/cached.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/features/capture/data/capture_queue.dart';

/// Inbox contents from the server (cached on the device). Invalidate after
/// capture or filing.
final inboxItemsProvider = StreamProvider<List<ItemSummary>>(
  (ref) => cachedThenFresh(
    ref,
    key: 'inbox',
    fetch: () => ref.watch(inboxRepositoryProvider).list(),
    decode: (j) => [
      for (final e in j! as List<Object?>)
        ItemSummary.fromJson(e! as Map<String, dynamic>),
    ],
    encode: (items) => [for (final i in items) i.toJson()],
  ),
);

/// Badge count: server Inbox plus captures still waiting to sync.
final inboxCountProvider = Provider<int>(
  (ref) =>
      (ref.watch(inboxItemsProvider).value?.length ?? 0) +
      ref.watch(captureQueueProvider).length,
);
