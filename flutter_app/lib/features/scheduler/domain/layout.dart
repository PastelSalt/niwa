import 'package:niwa/core/models/models.dart';
import 'package:niwa/features/scheduler/domain/calendar.dart';

/// Side-by-side layout for overlapping timed entries in one day column
/// (port of `layout.ts`, SCHEDULER.md §6): transitively overlapping entries
/// form a cluster; each cluster uses the fewest columns.
class Segment<T> {
  const new(this.key, this.value, this.start, this.end);

  final String key;
  final T value;

  /// Minutes from the day's start (0–1440).
  final int start;
  final int end;
}

class Placed<T> {
  new(this.segment, this.column);

  final Segment<T> segment;
  final int column;
  int columns = 1;
}

List<Placed<T>> layoutDay<T>(List<Segment<T>> segments) {
  final sorted = [...segments]
    ..sort((a, b) {
      final byStart = a.start.compareTo(b.start);
      return byStart != 0 ? byStart : b.end.compareTo(a.end);
    });
  final out = <Placed<T>>[];
  var cluster = <Placed<T>>[];
  var colEnds = <int>[];
  var clusterEnd = -1;

  void flush() {
    for (final p in cluster) {
      p.columns = colEnds.length;
    }
    out.addAll(cluster);
    cluster = [];
    colEnds = [];
  }

  for (final s in sorted) {
    if (cluster.isNotEmpty && s.start >= clusterEnd) flush();
    var column = colEnds.indexWhere((end) => end <= s.start);
    if (column < 0) {
      column = colEnds.length;
      colEnds.add(s.end);
    } else {
      colEnds[column] = s.end;
    }
    cluster.add(Placed(s, column));
    if (s.end > clusterEnd) clusterEnd = s.end;
  }
  flush();
  return out;
}

/// Timed entries overlapping local [day], clipped to it, as segments.
List<Segment<ScheduleEntry>> segmentsForDay(
  Iterable<ScheduleEntry> entries,
  DateTime day,
) {
  final start = startOfDay(day);
  final end = addDays(start, 1);
  return [
    for (final e in entries)
      if (!e.isAllDay &&
          e.startAt.toLocal().isBefore(end) &&
          e.endAt.toLocal().isAfter(start))
        Segment(
          e.id,
          e,
          e.startAt.toLocal().isBefore(start)
              ? 0
              : minutesOfDay(e.startAt.toLocal()),
          // Ends at or after the next midnight → runs to the end of this day.
          e.endAt.toLocal().isBefore(end)
              ? minutesOfDay(e.endAt.toLocal())
              : 1440,
        ),
  ];
}

/// All-day entries covering the calendar date of local [day].
List<ScheduleEntry> allDayFor(Iterable<ScheduleEntry> entries, DateTime day) {
  final key = dayKey(day);
  return [
    for (final e in entries)
      if (e.isAllDay && allDayKeys(e.startAt, e.endAt).contains(key)) e,
  ];
}

/// Everything shown on [day] (all-day first, then by start), for month cells
/// and the agenda.
List<ScheduleEntry> entriesOn(Iterable<ScheduleEntry> entries, DateTime day) {
  final timed = segmentsForDay(entries, day).map((s) => s.value).toList()
    ..sort((a, b) => a.startAt.compareTo(b.startAt));
  return [...allDayFor(entries, day), ...timed];
}
