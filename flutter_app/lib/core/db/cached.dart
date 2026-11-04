import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/api/api_exception.dart';
import 'package:niwa/core/db/db_providers.dart';
import 'package:niwa/core/net/network_status.dart';

/// Stale-while-revalidate for a provider: emits the cached copy of [key]
/// first (if any), then fetches, saves and emits the fresh one.
///
/// When the fetch fails but a cached copy was shown, that copy stays — the
/// offline banner says it may be old. With nothing cached, the error goes to
/// the screen's error state.
Stream<T> cachedThenFresh<T>(
  Ref ref, {
  required String key,
  required Future<T> Function() fetch,
  required T Function(Object? json) decode,
  required Object? Function(T value) encode,
}) async* {
  final db = ref.read(appDatabaseProvider);
  final network = ref.read(networkStatusProvider.notifier);
  T? cached;
  final json = await db.readCache(key);
  if (json != null) {
    try {
      cached = decode(json);
    } on Object {
      // Shape changed after an app update; ignore the stale copy.
    }
    if (cached != null) yield cached;
  }
  try {
    final fresh = await fetch();
    network.reportOnline();
    await db.writeCache(key, encode(fresh));
    yield fresh;
  } on OfflineException {
    network.reportOffline();
    if (cached == null) rethrow;
  } on ApiException {
    if (cached == null) rethrow;
  }
}
