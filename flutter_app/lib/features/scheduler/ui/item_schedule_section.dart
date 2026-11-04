import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/features/scheduler/data/schedule_providers.dart';
import 'package:niwa/features/scheduler/ui/entry_sheet.dart';

/// An item's scheduled time = its upcoming blocks (specs §6.1, SCHEDULER.md
/// §7), with "Schedule time" to add one.
class ItemScheduleSection extends ConsumerWidget {
  const new({required this.item, super.key});

  final Item item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final blocks = ref.watch(itemScheduleProvider(item.id)).value;
    final now = DateTime.now();
    final upcoming = [
      for (final e in blocks ?? const <ScheduleEntry>[])
        if (e.endAt.isAfter(now)) e,
    ]..sort((a, b) => a.startAt.compareTo(b.startAt));
    final loc = MaterialLocalizations.of(context);
    final secondary = NiwaColors.of(context).textSecondary;

    String when(ScheduleEntry e) {
      final s = e.startAt.toLocal();
      final end = e.endAt.toLocal();
      if (e.isAllDay) return '${loc.formatMediumDate(e.startAt)} · All day';
      return '${loc.formatMediumDate(s)} · '
          '${loc.formatTimeOfDay(TimeOfDay.fromDateTime(s))} – '
          '${loc.formatTimeOfDay(TimeOfDay.fromDateTime(end))}';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ListTile(
          title: Semantics(
            header: true,
            child: Text(
              'Scheduled',
              style: Theme.of(context).textTheme.titleSmall,
            ),
          ),
          trailing: TextButton.icon(
            icon: const Icon(Icons.add_alarm),
            label: const Text('Schedule time'),
            onPressed: () => showEntrySheet(context, itemId: item.id),
          ),
        ),
        if (blocks != null && upcoming.isEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Text(
              'No time blocked yet.',
              style: TextStyle(color: secondary),
            ),
          ),
        for (final e in upcoming.take(5))
          ListTile(
            leading: const Icon(Icons.schedule),
            title: Text(when(e)),
            onTap: () => showEntrySheet(context, entry: e),
          ),
      ],
    );
  }
}
