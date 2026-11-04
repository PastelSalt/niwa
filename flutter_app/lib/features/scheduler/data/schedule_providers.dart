import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart'
    show FutureProviderFamily, StreamProviderFamily;
import 'package:niwa/core/api/change.dart';
import 'package:niwa/core/api/error_message.dart';
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/db/cached.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/net/network_status.dart';
import 'package:niwa/core/ui/snackbars.dart';
import 'package:niwa/core/util/time_zone.dart';
import 'package:niwa/features/scheduler/data/reminders.dart';
import 'package:niwa/features/scheduler/data/schedule_repository.dart';

/// A UTC range `[from, to)`, as a family key.
typedef ScheduleRange = ({DateTime from, DateTime to});

/// Entries overlapping [ScheduleRange], cached on the device (MA5) so the
/// calendar is readable offline.
final StreamProviderFamily<List<ScheduleEntry>, ScheduleRange>
scheduleRangeProvider = StreamProvider.family((ref, range) {
  final from = range.from.toUtc();
  final to = range.to.toUtc();
  return cachedThenFresh(
    ref,
    key: 'schedule:${from.toIso8601String()}:${to.toIso8601String()}',
    fetch: () => ref.watch(scheduleRepositoryProvider).range(from, to),
    decode: (j) => [
      for (final e in j! as List<Object?>)
        ScheduleEntry.fromJson(e! as Map<String, dynamic>),
    ],
    encode: (entries) => [for (final e in entries) e.toJson()],
  );
});

/// An item's blocks (its scheduled time, SCHEDULER.md §7).
final FutureProviderFamily<List<ScheduleEntry>, String> itemScheduleProvider =
    FutureProvider.family(
      (ref, itemId) => ref.watch(scheduleRepositoryProvider).forItem(itemId),
    );

/// Values from the entry sheet.
class EntryDraft {
  const new({
    required this.kind,
    required this.startAt,
    required this.endAt,
    required this.isAllDay,
    required this.recurrence,
    this.title = '',
    this.itemId,
    this.color,
  });

  final ScheduleKind kind;
  final String title;
  final String? itemId;
  final DateTime startAt;
  final DateTime endAt;
  final bool isAllDay;
  final String? color;
  final Recurrence recurrence;
}

/// Schedule writes (port of the web `EntryDialog` save/delete and drags):
/// refresh the calendar, keep reminders in step, report failures.
class ScheduleActions {
  const new(this._ref);

  final Ref _ref;

  ScheduleRepository get _repo => _ref.read(scheduleRepositoryProvider);
  Snackbars get _snackbars => _ref.read(snackbarsProvider);

  bool _offline() {
    if (_ref.read(networkStatusProvider)) return false;
    _snackbars.show(
      "You're offline — changes need a connection. Capture still works.",
    );
    return true;
  }

  Future<String> _timeZone() async {
    try {
      return await _ref.read(deviceTimeZoneProvider.future);
    } on Object {
      return 'UTC';
    }
  }

  void _refresh({String? itemId}) {
    _ref
      ..invalidate(scheduleRangeProvider)
      ..invalidate(itemScheduleProvider);
    unawaited(_ref.read(reminderServiceProvider.notifier).sync());
  }

  Future<ScheduleEntry?> create(EntryDraft d) async {
    if (_offline()) return null;
    try {
      final entry = await _repo.create(
        kind: d.kind,
        title: d.title.isEmpty ? null : d.title,
        itemId: d.itemId,
        startAt: d.startAt,
        endAt: d.endAt,
        isAllDay: d.isAllDay,
        color: d.color,
        recurrence: d.recurrence,
        timeZone: await _timeZone(),
      );
      _refresh(itemId: d.itemId);
      return entry;
    } on Object catch (e) {
      _snackbars.show(messageOf(e));
      return null;
    }
  }

  /// [scope] applies to recurring entries; a one-off is always `instance`.
  /// With `instance`, recurrence isn't sent (only `future` can change it).
  Future<ScheduleEntry?> update(
    ScheduleEntry entry,
    EntryDraft d, {
    EditScope scope = EditScope.instance,
  }) async {
    if (_offline()) return null;
    final recurring = entry.seriesId != null;
    final effective = recurring ? scope : EditScope.instance;
    final sendRecurrence = !recurring || effective == EditScope.future;
    try {
      final saved = await _repo.update(
        entry.id,
        scope: effective,
        title: d.kind == ScheduleKind.event ? d.title : null,
        startAt: d.startAt,
        endAt: d.endAt,
        isAllDay: d.isAllDay,
        color: d.color == entry.color ? null : Change(d.color),
        recurrence: sendRecurrence ? d.recurrence : null,
        timeZone: sendRecurrence ? await _timeZone() : null,
      );
      _refresh(itemId: entry.itemId);
      return saved;
    } on Object catch (e) {
      _snackbars.show(messageOf(e));
      return null;
    }
  }

  /// Drag move/resize: always this occurrence only (SCHEDULER.md §5).
  Future<bool> retime(
    ScheduleEntry entry, {
    required DateTime startAt,
    required DateTime endAt,
  }) async {
    if (_offline()) return false;
    try {
      await _repo.update(entry.id, startAt: startAt, endAt: endAt);
      _refresh(itemId: entry.itemId);
      return true;
    } on Object catch (e) {
      _snackbars.show(messageOf(e));
      _refresh();
      return false;
    }
  }

  Future<bool> remove(
    ScheduleEntry entry, {
    EditScope scope = EditScope.instance,
  }) async {
    if (_offline()) return false;
    final effective = entry.seriesId != null ? scope : EditScope.instance;
    try {
      await _repo.remove(entry.id, scope: effective);
      _refresh(itemId: entry.itemId);
      _snackbars.show(
        effective == EditScope.future
            ? 'Deleted this and following'
            : 'Deleted',
      );
      return true;
    } on Object catch (e) {
      _snackbars.show(messageOf(e));
      return false;
    }
  }
}

final scheduleActionsProvider = Provider<ScheduleActions>(ScheduleActions.new);
