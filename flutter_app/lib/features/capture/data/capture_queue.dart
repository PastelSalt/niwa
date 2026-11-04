import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/api/api_exception.dart';
import 'package:niwa/core/api/error_message.dart';
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/auth/session.dart';
import 'package:niwa/core/db/app_database.dart';
import 'package:niwa/core/db/db_providers.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/net/network_status.dart';
import 'package:niwa/core/util/uuid.dart';
import 'package:niwa/features/inbox/data/inbox_providers.dart';

/// Base delay for retrying after a server error; doubles per attempt.
final captureRetryBaseProvider = Provider<Duration>(
  (ref) => const Duration(seconds: 2),
);

/// Offline-safe capture (MA5.P3). Every capture goes to the on-device outbox
/// first, then to `POST /inbox` oldest first, one at a time, each with its
/// own `clientId` so a retry can never duplicate.
///
/// - No connection: stop; resume when the network comes back.
/// - Server error or rate limit: retry with backoff (2 s, 4 s … 5 min).
/// - Refused for good (4xx): keep it, marked failed, for Retry / Discard in
///   the Inbox; the rest of the queue carries on.
///
/// State is the outbox (pending and failed captures, oldest first).
class CaptureQueue extends Notifier<List<OutboxData>> {
  bool _draining = false;
  bool _disposed = false;
  Timer? _retry;

  AppDatabase get _db => ref.read(appDatabaseProvider);

  /// Every outbox write goes through this class, so it refreshes [state]
  /// itself (no table watcher: simpler, and no drift timers in tests).
  Future<void> _reload() async {
    if (_disposed) return;
    final rows = await _db.outboxEntries();
    if (!_disposed) state = rows;
  }

  @override
  List<OutboxData> build() {
    ref.watch(appDatabaseProvider);
    unawaited(Future.microtask(_reload));
    ref
      ..listen(networkStatusProvider, (_, online) {
        if (online) unawaited(drain());
      })
      ..listen(sessionProvider, (_, s) {
        if (s is SignedIn) unawaited(drain());
      })
      ..onDispose(() {
        _disposed = true;
        _retry?.cancel();
      });
    if (ref.read(sessionProvider) is SignedIn) {
      // Leftovers from an earlier run.
      unawaited(Future.microtask(drain));
    }
    return const [];
  }

  /// Queues a capture and tries to send it now. Returns true if it reached
  /// the server, false if it's waiting in the outbox.
  Future<bool> capture({
    required String title,
    required ItemType type,
    Map<String, dynamic>? content,
    String? suggestedParentId,
  }) async {
    final clientId = uuidV4();
    await _db.enqueue(
      clientId: clientId,
      title: title,
      type: type.wire,
      body: content,
      suggestedParentId: suggestedParentId,
    );
    await _reload();
    await drain();
    final waiting = await _db.outboxEntries();
    return !waiting.any((e) => e.clientId == clientId);
  }

  Future<void> drain() async {
    if (_draining || ref.read(sessionProvider) is! SignedIn) return;
    _draining = true;
    _retry?.cancel();
    try {
      for (final e in await _db.outboxEntries()) {
        if (e.failedMessage != null) continue; // waits for the user
        if (!await _send(e)) return;
      }
    } finally {
      _draining = false;
      await _reload();
    }
  }

  /// Returns false when the queue should stop for now.
  Future<bool> _send(OutboxData e) async {
    final network = ref.read(networkStatusProvider.notifier);
    try {
      await ref
          .read(inboxRepositoryProvider)
          .capture(
            title: e.title,
            type: ItemType.values.firstWhere(
              (t) => t.name == e.type,
              orElse: () => ItemType.idea,
            ),
            content: e.body == null
                ? null
                : jsonDecode(e.body!) as Map<String, dynamic>,
            suggestedParentId: e.suggestedParentId,
            clientId: e.clientId,
          );
      await _db.removeFromOutbox(e.id);
      network.reportOnline();
      ref.invalidate(inboxItemsProvider);
      return true;
    } on OfflineException {
      await _db.markAttempt(e.id);
      network.reportOffline();
      return false; // resumes when the network does
    } on ApiException catch (err) {
      if (err.status == 401) return false; // signed out; nothing to do
      if (err.status >= 500 || err.code == ErrorCode.rateLimited) {
        await _db.markAttempt(e.id);
        _scheduleRetry(err.retryAfter, e.attempts + 1);
        return false;
      }
      await _db.markAttempt(e.id, failedMessage: messageOf(err));
      return true;
    }
  }

  void _scheduleRetry(Duration? retryAfter, int attempts) {
    final base = ref.read(captureRetryBaseProvider);
    final backoff = base * pow(2, min(attempts - 1, 8)).toInt();
    final delay = retryAfter ?? backoff;
    _retry?.cancel();
    _retry = Timer(
      delay > const Duration(minutes: 5) ? const Duration(minutes: 5) : delay,
      () => unawaited(drain()),
    );
  }

  Future<void> retry(OutboxData e) async {
    await _db.clearFailure(e.id);
    await drain();
  }

  Future<void> discard(OutboxData e) async {
    await _db.removeFromOutbox(e.id);
    await _reload();
  }
}

final captureQueueProvider = NotifierProvider<CaptureQueue, List<OutboxData>>(
  CaptureQueue.new,
);
