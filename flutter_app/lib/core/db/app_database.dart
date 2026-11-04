import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

part 'app_database.g.dart';

/// Read cache: the last response for each request (`tree`, `item:<id>`,
/// `inbox`, `focus:<day>`, `tags`), as JSON. Screens show it first and
/// refresh from the network (stale-while-revalidate).
class CacheEntries extends Table {
  TextColumn get key => text()();
  TextColumn get json => text()();
  DateTimeColumn get savedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {key};
}

/// Captures waiting for `POST /inbox`, sent oldest first (MA5.P3).
class Outbox extends Table {
  IntColumn get id => integer().autoIncrement()();

  /// Idempotency key sent as `CaptureInput.clientId`.
  TextColumn get clientId => text().unique()();
  TextColumn get title => text()();
  TextColumn get type => text()();

  /// Optional details as ProseMirror JSON (v3).
  TextColumn get body => text().nullable()();

  /// Where capture suggested filing it (v3).
  TextColumn get suggestedParentId => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  IntColumn get attempts => integer().withDefault(const Constant(0))();

  /// Set when the server refused it for good (4xx); the user retries or
  /// discards from the Inbox.
  TextColumn get failedMessage => text().nullable()();
}

/// Scheduler reminders chosen on this phone (MA7.P3). The server has no
/// reminder field: they're per device, like the notifications themselves.
/// [key] is `entry:<id>` (one occurrence) or `series:<id>` (every one).
class Reminders extends Table {
  TextColumn get key => text()();
  IntColumn get minutesBefore => integer()();

  @override
  Set<Column<Object>> get primaryKey => {key};
}

@DriftDatabase(tables: [CacheEntries, Outbox, Reminders])
class AppDatabase extends _$AppDatabase {
  new([QueryExecutor? executor])
    : super(executor ?? driftDatabase(name: 'niwa'));

  /// v1: cache + outbox (MA5). v2: reminders (MA7). v3: capture details and
  /// suggested parent in the outbox (MA8).
  @override
  int get schemaVersion => 3;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) => m.createAll(),
    // Cache tables can always be rebuilt from the server; the outbox can't,
    // so versions must migrate it rather than drop it.
    onUpgrade: (m, from, to) async {
      if (from < 2) await m.createTable(reminders);
      if (from < 3) {
        await m.addColumn(outbox, outbox.body);
        await m.addColumn(outbox, outbox.suggestedParentId);
      }
    },
  );

  // ---- Cache ----

  Future<Object?> readCache(String key) async {
    final row = await (select(
      cacheEntries,
    )..where((t) => t.key.equals(key))).getSingleOrNull();
    return row == null ? null : jsonDecode(row.json);
  }

  Future<void> writeCache(String key, Object? value) =>
      into(cacheEntries).insertOnConflictUpdate(
        CacheEntriesCompanion.insert(
          key: key,
          json: jsonEncode(value),
          savedAt: DateTime.now(),
        ),
      );

  // ---- Outbox ----

  Future<List<OutboxData>> outboxEntries() =>
      (select(outbox)..orderBy([(t) => OrderingTerm.asc(t.id)])).get();

  Future<void> enqueue({
    required String clientId,
    required String title,
    required String type,
    Map<String, dynamic>? body,
    String? suggestedParentId,
  }) => into(outbox).insert(
    OutboxCompanion.insert(
      clientId: clientId,
      title: title,
      type: type,
      body: Value(body == null ? null : jsonEncode(body)),
      suggestedParentId: Value(suggestedParentId),
      createdAt: DateTime.now(),
    ),
  );

  Future<void> removeFromOutbox(int id) =>
      (delete(outbox)..where((t) => t.id.equals(id))).go();

  Future<void> markAttempt(int id, {String? failedMessage}) => customUpdate(
    'UPDATE outbox SET attempts = attempts + 1, failed_message = ? '
    'WHERE id = ?',
    variables: [Variable(failedMessage), Variable(id)],
    updates: {outbox},
  );

  Future<void> clearFailure(int id) =>
      (update(outbox)..where((t) => t.id.equals(id))).write(
        const OutboxCompanion(failedMessage: Value(null), attempts: Value(0)),
      );

  // ---- Reminders ----

  Future<Map<String, int>> allReminders() async => {
    for (final r in await select(reminders).get()) r.key: r.minutesBefore,
  };

  Future<void> setReminder(String key, int? minutesBefore) =>
      minutesBefore == null
      ? (delete(reminders)..where((t) => t.key.equals(key))).go()
      : into(reminders).insertOnConflictUpdate(
          RemindersCompanion.insert(key: key, minutesBefore: minutesBefore),
        );

  /// Everything goes on logout: the next user must not see this one's data.
  Future<void> wipe() => transaction(() async {
    await delete(cacheEntries).go();
    await delete(outbox).go();
    await delete(reminders).go();
  });
}
