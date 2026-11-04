import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/features/items/data/item_providers.dart';
import 'package:niwa/features/scheduler/domain/calendar.dart';
import 'package:niwa/features/scheduler/domain/entry_look.dart';
import 'package:niwa/features/scheduler/domain/layout.dart';

/// Six-week month grid (Monday first). Each day shows up to three entries;
/// tapping a day opens its day view. Entries move between days via the sheet
/// (touch has no drag-and-drop here — GAPS "Month drag on touch").
class MonthGrid extends ConsumerWidget {
  const new({
    required this.month,
    required this.entries,
    required this.onDay,
    super.key,
  });

  final DateTime month;
  final List<ScheduleEntry> entries;
  final void Function(DateTime day) onDay;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(treeProvider).value?.byId ?? const {};
    final dark = Theme.of(context).brightness == Brightness.dark;
    final secondary = NiwaColors.of(context).textSecondary;
    final divider = Theme.of(context).colorScheme.outlineVariant;
    final primary = Theme.of(context).colorScheme.primary;
    final loc = MaterialLocalizations.of(context);
    final start = monthGridStart(month);
    final today = dayKey(DateTime.now());

    return Column(
      children: [
        Row(
          children: [
            for (var i = 0; i < 7; i++)
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Text(
                    // narrowWeekdays starts on Sunday.
                    loc.narrowWeekdays[(i + 1) % 7],
                    textAlign: TextAlign.center,
                    style: TextStyle(color: secondary, fontSize: 12),
                  ),
                ),
              ),
          ],
        ),
        Expanded(
          child: Column(
            children: [
              for (var w = 0; w < 6; w++)
                Expanded(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      for (var d = 0; d < 7; d++)
                        Expanded(
                          child: _cell(
                            context,
                            addDays(start, w * 7 + d),
                            items,
                            dark,
                            secondary,
                            divider,
                            primary,
                            today,
                          ),
                        ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _cell(
    BuildContext context,
    DateTime day,
    Map<String, ItemSummary> items,
    bool dark,
    Color secondary,
    Color divider,
    Color primary,
    String today,
  ) {
    final list = entriesOn(entries, day);
    final inMonth = day.month == month.month;
    final isToday = dayKey(day) == today;
    final loc = MaterialLocalizations.of(context);
    final label =
        '${loc.formatFullDate(day)}, '
        '${list.isEmpty
            ? 'no entries'
            : list.length == 1
            ? '1 entry'
            : '${list.length} entries'}';

    return Semantics(
      button: true,
      label: label,
      child: InkWell(
        onTap: () => onDay(day),
        child: Container(
          decoration: BoxDecoration(
            border: Border(
              top: BorderSide(color: divider),
              left: BorderSide(color: divider, width: 0.5),
            ),
          ),
          padding: const EdgeInsets.all(2),
          child: ExcludeSemantics(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: isToday
                        ? BoxDecoration(
                            color: primary,
                            borderRadius: BorderRadius.circular(10),
                          )
                        : null,
                    child: Text(
                      '${day.day}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isToday ? FontWeight.w700 : null,
                        color: isToday
                            ? Theme.of(context).colorScheme.onPrimary
                            : inMonth
                            ? null
                            : secondary,
                      ),
                    ),
                  ),
                ),
                for (final e in list.take(3))
                  Builder(
                    builder: (context) {
                      final look = entryLook(e, items: items, dark: dark);
                      return Container(
                        margin: const EdgeInsets.only(top: 2),
                        padding: const EdgeInsets.symmetric(horizontal: 2),
                        decoration: BoxDecoration(
                          color: look.color,
                          borderRadius: BorderRadius.circular(
                            NiwaTokens.radiusSmall / 2,
                          ),
                        ),
                        child: Text(
                          look.title,
                          maxLines: 1,
                          overflow: TextOverflow.clip,
                          style: TextStyle(color: look.textColor, fontSize: 9),
                        ),
                      );
                    },
                  ),
                if (list.length > 3)
                  Text(
                    '+${list.length - 3}',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: secondary, fontSize: 9),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
