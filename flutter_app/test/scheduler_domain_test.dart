import 'package:flutter/painting.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/core/util/contrast.dart';
import 'package:niwa/features/scheduler/domain/calendar.dart';
import 'package:niwa/features/scheduler/domain/entry_look.dart';
import 'package:niwa/features/scheduler/domain/layout.dart';

// Port of web_app/src/features/scheduler/scheduler.test.ts, plus mobile cases.

ScheduleEntry entry(
  String id,
  DateTime start,
  DateTime end, {
  bool allDay = false,
  String title = 'x',
  ScheduleKind kind = ScheduleKind.event,
  String? itemId,
  String? color,
}) => ScheduleEntry(
  id: id,
  kind: kind,
  itemId: itemId,
  title: title,
  startAt: start.toUtc(),
  endAt: end.toUtc(),
  isAllDay: allDay,
  color: color,
  recurrence: Recurrence.none,
  seriesId: null,
  seriesIndex: null,
  createdAt: DateTime.utc(2026),
  updatedAt: DateTime.utc(2026),
);

void main() {
  group('layoutDay', () {
    Segment<String> seg(String key, int start, int end) =>
        Segment(key, key, start, end);

    test('puts non-overlapping entries in one column', () {
      final out = layoutDay([seg('a', 60, 120), seg('b', 120, 180)]);
      expect(out.map((p) => (p.segment.key, p.column, p.columns)), [
        ('a', 0, 1),
        ('b', 0, 1),
      ]);
    });

    test('splits a cluster into the fewest columns and reuses freed ones', () {
      final out = layoutDay([
        seg('a', 540, 660),
        seg('b', 570, 600),
        seg('c', 600, 630),
        seg('d', 720, 780),
      ]);
      final by = {for (final p in out) p.segment.key: (p.column, p.columns)};
      expect(by['a'], (0, 2));
      expect(by['b'], (1, 2));
      expect(by['c'], (1, 2)); // reuses b's column once b ends
      expect(by['d'], (0, 1)); // new cluster
    });
  });

  group('dates', () {
    test('weeks start on Monday; month grids on the Monday before the 1st', () {
      expect(startOfWeek(DateTime(2026, 11, 8)).weekday, DateTime.monday);
      expect(startOfWeek(DateTime(2026, 11, 8)).day, 2);
      final grid = monthGridStart(DateTime(2026, 11, 15)); // Nov 1 is a Sunday
      expect((grid.month, grid.day, grid.weekday), (10, 26, DateTime.monday));
    });

    test('all-day entries cover calendar dates with an exclusive end', () {
      expect(allDayKeys(utcMidnight('2026-11-20'), utcMidnight('2026-11-22')), [
        '2026-11-20',
        '2026-11-21',
      ]);
      expect(addDaysToKey('2026-12-31', 1), '2027-01-01');
    });

    test('day keys and validation', () {
      expect(dayKey(DateTime(2026, 3, 5)), '2026-03-05');
      expect(parseDay('2026-03-05'), DateTime(2026, 3, 5));
      expect(isDayKey('2026-02-28'), isTrue);
      expect(isDayKey('2026-02-30'), isFalse);
      expect(isDayKey('nope'), isFalse);
    });

    test('adding days is calendar arithmetic (DST-safe)', () {
      // Whatever the host zone, +1 day lands on the next calendar date at
      // the same wall time.
      final d = addDays(DateTime(2026, 3, 28, 9, 30), 1);
      expect((d.month, d.day, d.hour, d.minute), (3, 29, 9, 30));
      expect(addMonths(DateTime(2026, 1, 31), 1), DateTime(2026, 2));
    });

    test('snap to 15 minutes', () {
      expect(snap(7), 0);
      expect(snap(8), 15);
      expect(snap(52), 45);
      expect(snap(53, 30), 60);
    });
  });

  group('day membership', () {
    final day = DateTime(2026, 11, 4);

    test('timed entries are clipped to the day', () {
      final overnight = entry(
        'n',
        DateTime(2026, 11, 3, 22),
        DateTime(2026, 11, 4, 1, 30),
      );
      final today = entry(
        't',
        DateTime(2026, 11, 4, 9),
        DateTime(2026, 11, 4, 10),
      );
      final toMidnight = entry(
        'm',
        DateTime(2026, 11, 4, 23),
        DateTime(2026, 11, 5),
      );
      final segs = {
        for (final s in segmentsForDay([overnight, today, toMidnight], day))
          s.key: (s.start, s.end),
      };
      expect(segs['n'], (0, 90));
      expect(segs['t'], (540, 600));
      expect(segs['m'], (1380, 1440));
    });

    test('all-day entries match calendar dates, never shifted', () {
      final e = entry(
        'a',
        utcMidnight('2026-11-04'),
        utcMidnight('2026-11-05'),
        allDay: true,
      );
      expect(allDayFor([e], day), [e]);
      expect(allDayFor([e], DateTime(2026, 11, 5)), isEmpty);
      expect(segmentsForDay([e], day), isEmpty);
    });

    test('entriesOn lists all-day first, then by start', () {
      final a = entry(
        'a',
        utcMidnight('2026-11-04'),
        utcMidnight('2026-11-05'),
        allDay: true,
      );
      final late = entry(
        'l',
        DateTime(2026, 11, 4, 15),
        DateTime(2026, 11, 4, 16),
      );
      final early = entry(
        'e',
        DateTime(2026, 11, 4, 8),
        DateTime(2026, 11, 4, 9),
      );
      expect(entriesOn([late, a, early], day).map((e) => e.id), [
        'a',
        'e',
        'l',
      ]);
    });
  });

  group('entryLook', () {
    final task = ItemSummary(
      id: 'i',
      workspaceId: 'w',
      parentId: null,
      title: 'Write essay',
      type: ItemType.task,
      nature: ItemNature.actionable,
      status: ItemStatus.notStarted,
      priority: ItemPriority.none,
      orderKey: 'a',
      tags: const [],
      dueAt: null,
      estimatedMinutes: null,
      reviewAt: null,
      sourceUrl: null,
      inboxedAt: null,
      suggestedParentId: null,
      archivedAt: null,
      deletedAt: null,
      version: 1,
      createdAt: DateTime.utc(2026),
      updatedAt: DateTime.utc(2026),
      completedAt: null,
    );
    final start = DateTime(2026, 11, 4, 9);
    final end = DateTime(2026, 11, 4, 10);

    test('blocks show the live item title and type colour', () {
      final block = entry(
        'b',
        start,
        end,
        kind: ScheduleKind.block,
        title: '',
        itemId: 'i',
      );
      final look = entryLook(block, items: {'i': task}, dark: false);
      expect(look.title, 'Write essay');
      expect(look.color, NiwaTokens.lightTypes.task);
      expect(
        entryLook(block, items: const {}, dark: false).title,
        'Time block',
      );
    });

    test('explicit colours win and text stays readable', () {
      for (final (_, c) in entryColors) {
        final e = entry('e', start, end, color: colorHex(c));
        final look = entryLook(e, items: const {}, dark: true);
        expect(look.color, c);
        expect(
          contrastRatio(look.textColor, look.color),
          greaterThanOrEqualTo(4.5),
        );
      }
    });

    test('hex helpers round-trip', () {
      expect(colorHex(const Color(0xFF59765C)), '#59765C');
      expect(parseHex('#59765c'), const Color(0xFF59765C));
      expect(parseHex('red'), isNull);
    });
  });
}
