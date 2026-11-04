import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/app/niwa_app_bar.dart';
import 'package:niwa/core/ui/state_views.dart';
import 'package:niwa/features/scheduler/data/schedule_providers.dart';
import 'package:niwa/features/scheduler/domain/calendar.dart';
import 'package:niwa/features/scheduler/ui/entry_sheet.dart';
import 'package:niwa/features/scheduler/ui/month_grid.dart';
import 'package:niwa/features/scheduler/ui/time_grid.dart';

enum SchedulerView { day, week, month }

/// `/scheduler/:view/:date` (docs/SCHEDULER.md): day, week and month views
/// over cached schedule ranges, same paths as the web.
class SchedulerScreen extends ConsumerWidget {
  const new({required this.view, required this.date, super.key});

  final SchedulerView view;

  /// `YYYY-MM-DD`.
  final String date;

  /// The days on screen, widened by a day each side so all-day entries
  /// (UTC dates) are caught whatever the viewer's zone.
  static ScheduleRange rangeFor(SchedulerView view, DateTime day) {
    final (from, to) = switch (view) {
      SchedulerView.day => (day, addDays(day, 1)),
      SchedulerView.week => (startOfWeek(day), addDays(startOfWeek(day), 7)),
      SchedulerView.month => (
        monthGridStart(day),
        addDays(monthGridStart(day), 42),
      ),
    };
    return (from: addDays(from, -1).toUtc(), to: addDays(to, 1).toUtc());
  }

  void _go(BuildContext context, SchedulerView v, DateTime day) =>
      context.go('/scheduler/${v.name}/${dayKey(day)}');

  DateTime _step(DateTime day, int n) => switch (view) {
    SchedulerView.day => addDays(day, n),
    SchedulerView.week => addDays(day, 7 * n),
    SchedulerView.month => addMonths(day, n),
  };

  String _title(BuildContext context, DateTime day) {
    final loc = MaterialLocalizations.of(context);
    return switch (view) {
      SchedulerView.day => loc.formatMediumDate(day),
      SchedulerView.week =>
        '${loc.formatShortMonthDay(startOfWeek(day))} – '
            '${loc.formatShortMonthDay(addDays(startOfWeek(day), 6))}',
      SchedulerView.month => loc.formatMonthYear(day),
    };
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final day = parseDay(date);
    final entries = ref.watch(scheduleRangeProvider(rangeFor(view, day)));

    final body = switch (entries) {
      AsyncData(value: final list) => switch (view) {
        SchedulerView.month => MonthGrid(
          month: day,
          entries: list,
          onDay: (d) => _go(context, SchedulerView.day, d),
        ),
        _ => TimeGrid(
          key: ValueKey('${view.name}-$date'),
          days: view == SchedulerView.day
              ? [day]
              : [for (var i = 0; i < 7; i++) addDays(startOfWeek(day), i)],
          entries: list,
          onCreate: (start, {allDay = false}) =>
              showEntrySheet(context, start: start, allDay: allDay),
          onOpen: (e) => showEntrySheet(context, entry: e),
        ),
      },
      AsyncError(:final error) => ErrorState(
        error: error,
        onRetry: () =>
            ref.invalidate(scheduleRangeProvider(rangeFor(view, day))),
      ),
      _ => const ListSkeleton(),
    };

    return Scaffold(
      appBar: NiwaAppBar(
        title: _title(context, day),
        actions: [
          IconButton(
            tooltip: 'Previous',
            icon: const Icon(Icons.chevron_left),
            onPressed: () => _go(context, view, _step(day, -1)),
          ),
          IconButton(
            tooltip: 'Today',
            icon: const Icon(Icons.today),
            onPressed: () => _go(context, view, DateTime.now()),
          ),
          IconButton(
            tooltip: 'Next',
            icon: const Icon(Icons.chevron_right),
            onPressed: () => _go(context, view, _step(day, 1)),
          ),
          IconButton(
            tooltip: 'New entry',
            icon: const Icon(Icons.add_alarm),
            onPressed: () => showEntrySheet(
              context,
              start: view == SchedulerView.month
                  ? atMinutes(day, 9 * 60)
                  : null,
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(52),
          child: Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: SegmentedButton<SchedulerView>(
              segments: const [
                ButtonSegment(value: SchedulerView.day, label: Text('Day')),
                ButtonSegment(value: SchedulerView.week, label: Text('Week')),
                ButtonSegment(value: SchedulerView.month, label: Text('Month')),
              ],
              selected: {view},
              onSelectionChanged: (s) => _go(context, s.single, day),
            ),
          ),
        ),
      ),
      body: body,
    );
  }
}
