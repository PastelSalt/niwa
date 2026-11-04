import 'dart:async';
import 'dart:math';

import 'package:flutter/gestures.dart' show DragStartBehavior;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/features/items/data/item_providers.dart';
import 'package:niwa/features/scheduler/data/schedule_providers.dart';
import 'package:niwa/features/scheduler/domain/calendar.dart';
import 'package:niwa/features/scheduler/domain/entry_look.dart';
import 'package:niwa/features/scheduler/domain/layout.dart';

const double hourHeight = 56;
const double _gutter = 44;
const int _snapMinutes = 15;

String _hm(BuildContext context, DateTime t) =>
    MaterialLocalizations.of(context).formatTimeOfDay(
      TimeOfDay.fromDateTime(t),
      alwaysUse24HourFormat: MediaQuery.alwaysUse24HourFormatOf(context),
    );

/// Day or week time grid (SCHEDULER.md §5–§6): all-day row, hour lines,
/// side-by-side overlapping entries and a now line.
///
/// - Tap empty space → [onCreate] at that 15-minute slot.
/// - Tap an entry → [onOpen].
/// - Long-press and drag an entry → move (15-min snap; across days in week).
/// - Drag an entry's bottom edge → resize (15-min snap, min 15 min).
///
/// Drags change only that occurrence; the sheet offers "this and following".
class TimeGrid extends ConsumerStatefulWidget {
  const new({
    required this.days,
    required this.entries,
    required this.onCreate,
    required this.onOpen,
    super.key,
  });

  final List<DateTime> days;
  final List<ScheduleEntry> entries;
  final void Function(DateTime start, {bool allDay}) onCreate;
  final void Function(ScheduleEntry entry) onOpen;

  @override
  ConsumerState<TimeGrid> createState() => _TimeGridState();
}

class _TimeGridState extends ConsumerState<TimeGrid> {
  late final ScrollController _scroll = ScrollController(
    initialScrollOffset: _initialOffset(),
  );
  Timer? _tick;

  /// Entry being dragged: (id, minutes moved, days moved, minutes resized).
  ({String id, int dMin, int dDay, int dEnd})? _drag;

  /// Raw resize distance in minutes; snapped when shown and on release.
  double _resizeRaw = 0;

  double _initialOffset() {
    final now = DateTime.now();
    final showsToday = widget.days.any((d) => dayKey(d) == dayKey(now));
    final hour = showsToday ? max(0, now.hour - 1) : 8;
    return hour * hourHeight;
  }

  @override
  void initState() {
    super.initState();
    // Keep the now line moving.
    _tick = Timer.periodic(const Duration(minutes: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _tick?.cancel();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _commit(ScheduleEntry e) async {
    final d = _drag;
    if (d == null || d.id != e.id) return;
    setState(() => _drag = null);
    if (d.dMin == 0 && d.dDay == 0 && d.dEnd == 0) return;
    final start = e.startAt.toLocal();
    final end = e.endAt.toLocal();
    final newStart = addDays(start, d.dDay).add(Duration(minutes: d.dMin));
    var newEnd = addDays(end, d.dDay).add(Duration(minutes: d.dMin + d.dEnd));
    if (!newEnd.isAfter(newStart.add(const Duration(minutes: 14)))) {
      newEnd = newStart.add(const Duration(minutes: _snapMinutes));
    }
    await ref
        .read(scheduleActionsProvider)
        .retime(e, startAt: newStart, endAt: newEnd);
  }

  @override
  Widget build(BuildContext context) {
    final items = ref.watch(treeProvider).value?.byId ?? const {};
    final dark = Theme.of(context).brightness == Brightness.dark;
    final divider = Theme.of(context).colorScheme.outlineVariant;
    final secondary = NiwaColors.of(context).textSecondary;
    final week = widget.days.length > 1;
    final today = dayKey(DateTime.now());

    EntryLook look(ScheduleEntry e) => entryLook(e, items: items, dark: dark);

    final allDay = [for (final d in widget.days) allDayFor(widget.entries, d)];
    final hasAllDay = allDay.any((l) => l.isNotEmpty);

    return Column(
      children: [
        if (week)
          Padding(
            padding: const EdgeInsets.only(left: _gutter),
            child: Row(
              children: [
                for (final d in widget.days)
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Column(
                        children: [
                          Text(
                            MaterialLocalizations.of(context)
                                .narrowWeekdays[d.weekday % 7],
                            style: TextStyle(color: secondary, fontSize: 12),
                          ),
                          Text(
                            '${d.day}',
                            style: TextStyle(
                              fontWeight: dayKey(d) == today
                                  ? FontWeight.w700
                                  : null,
                              color: dayKey(d) == today
                                  ? Theme.of(context).colorScheme.primary
                                  : null,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        if (hasAllDay)
          Padding(
            padding: const EdgeInsets.only(left: _gutter, bottom: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final list in allDay)
                  Expanded(
                    child: Column(
                      children: [
                        for (final e in list)
                          _AllDayChip(
                            entry: e,
                            look: look(e),
                            compact: week,
                            onTap: () => widget.onOpen(e),
                          ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        Divider(height: 1, color: divider),
        Expanded(
          child: SingleChildScrollView(
            controller: _scroll,
            child: SizedBox(
              height: 24 * hourHeight,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: _gutter,
                    child: Stack(
                      children: [
                        for (var h = 1; h < 24; h++)
                          Positioned(
                            top: h * hourHeight - 7,
                            right: 6,
                            child: Text(
                              _hm(context, DateTime(2026, 1, 1, h)),
                              style: TextStyle(color: secondary, fontSize: 10),
                            ),
                          ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final colWidth =
                            constraints.maxWidth / widget.days.length;
                        return Row(
                          children: [
                            for (final (i, d) in widget.days.indexed)
                              SizedBox(
                                width: colWidth,
                                child: _dayColumn(
                                  context,
                                  d,
                                  i,
                                  colWidth,
                                  look,
                                  divider,
                                ),
                              ),
                          ],
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _dayColumn(
    BuildContext context,
    DateTime day,
    int index,
    double width,
    EntryLook Function(ScheduleEntry) look,
    Color divider,
  ) {
    final placed = layoutDay(segmentsForDay(widget.entries, day));
    final now = DateTime.now();
    final isToday = dayKey(day) == dayKey(now);
    final primary = Theme.of(context).colorScheme.primary;

    return Semantics(
      label: MaterialLocalizations.of(context).formatFullDate(day),
      container: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapUp: (details) {
          final minutes = (details.localPosition.dy / hourHeight * 60).floor();
          final slot = minutes - minutes % _snapMinutes;
          widget.onCreate(atMinutes(day, slot));
        },
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            for (var h = 0; h < 24; h++)
              Positioned(
                top: h * hourHeight,
                left: 0,
                right: 0,
                child: Divider(height: 1, color: divider),
              ),
            Positioned(
              top: 0,
              bottom: 0,
              left: 0,
              child: VerticalDivider(width: 1, color: divider),
            ),
            for (final p in placed)
              _block(context, p, index, width, look(p.segment.value)),
            if (isToday)
              Positioned(
                top: minutesOfDay(now) / 60 * hourHeight - 1,
                left: 0,
                right: 0,
                child: ExcludeSemantics(
                  child: Container(height: 2, color: primary),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _block(
    BuildContext context,
    Placed<ScheduleEntry> p,
    int dayIndex,
    double colWidth,
    EntryLook look,
  ) {
    final e = p.segment.value;
    final d = _drag?.id == e.id ? _drag! : null;
    final start = p.segment.start + (d?.dMin ?? 0);
    final end = p.segment.end + (d?.dMin ?? 0) + (d?.dEnd ?? 0);
    final width = colWidth / p.columns;
    final top = start / 60 * hourHeight;
    final height = max((end - start) / 60 * hourHeight, 20).toDouble();
    final label =
        '${_hm(context, e.startAt.toLocal())} ${look.title}'; // visible order

    return Positioned(
      top: top,
      height: height,
      left: p.column * width + (d?.dDay ?? 0) * colWidth + 1,
      width: width - 2,
      child: Semantics(
        button: true,
        label: label,
        child: GestureDetector(
          onTap: () => widget.onOpen(e),
          onLongPressStart: (_) =>
              setState(() => _drag = (id: e.id, dMin: 0, dDay: 0, dEnd: 0)),
          onLongPressMoveUpdate: (m) => setState(
            () => _drag = (
              id: e.id,
              dMin: snap(m.offsetFromOrigin.dy / hourHeight * 60),
              dDay: widget.days.length > 1
                  ? (m.offsetFromOrigin.dx / colWidth).round().clamp(
                      -dayIndex,
                      widget.days.length - 1 - dayIndex,
                    )
                  : 0,
              dEnd: 0,
            ),
          ),
          onLongPressEnd: (_) => _commit(e),
          child: Container(
            decoration: BoxDecoration(
              color: look.color.withValues(alpha: d == null ? 1 : 0.8),
              borderRadius: BorderRadius.circular(NiwaTokens.radiusSmall),
              boxShadow: d == null
                  ? null
                  : const [BoxShadow(blurRadius: 6, color: Color(0x33000000))],
            ),
            padding: const EdgeInsets.fromLTRB(4, 2, 4, 0),
            child: Stack(
              children: [
                ExcludeSemantics(
                  child: Text(
                    height < 34
                        ? label
                        : '${look.title}\n${_hm(context, e.startAt.toLocal())}',
                    maxLines: max(1, (height / 16).floor()),
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: look.textColor, fontSize: 12),
                  ),
                ),
                // Bottom edge: drag to resize.
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 12,
                  child: GestureDetector(
                    key: ValueKey('resize-${e.id}'),
                    behavior: HitTestBehavior.opaque,
                    // Count from touch-down, so the edge tracks the finger
                    // instead of lagging by the drag slop.
                    dragStartBehavior: DragStartBehavior.down,
                    onVerticalDragStart: (_) => setState(() {
                      _resizeRaw = 0;
                      _drag = (id: e.id, dMin: 0, dDay: 0, dEnd: 0);
                    }),
                    onVerticalDragUpdate: (u) => setState(() {
                      _resizeRaw += u.delta.dy / hourHeight * 60;
                      _drag = (
                        id: e.id,
                        dMin: 0,
                        dDay: 0,
                        // Never shorter than 15 minutes.
                        dEnd: max(
                          snap(_resizeRaw),
                          _snapMinutes - (p.segment.end - p.segment.start),
                        ),
                      );
                    }),
                    onVerticalDragEnd: (_) => unawaited(_commit(e)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AllDayChip extends StatelessWidget {
  const new({
    required this.entry,
    required this.look,
    required this.compact,
    required this.onTap,
  });

  final ScheduleEntry entry;
  final EntryLook look;
  final bool compact;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'All day ${look.title}',
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: double.infinity,
          margin: const EdgeInsets.all(1),
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
          decoration: BoxDecoration(
            color: look.color,
            borderRadius: BorderRadius.circular(NiwaTokens.radiusSmall),
          ),
          child: ExcludeSemantics(
            child: Text(
              look.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: look.textColor,
                fontSize: compact ? 10 : 12,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
