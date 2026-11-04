import 'package:flutter/material.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/core/util/date_only.dart';
import 'package:niwa/features/items/ui/item_meta.dart';
import 'package:niwa/features/items/ui/item_type_icon.dart';

/// One item in a list: type icon, title, status, due date and child count.
/// [dimmed] rows are ancestors shown only to reach items of this lens.
class ItemRow extends StatelessWidget {
  const new({
    required this.item,
    required this.onTap,
    this.onLongPress,
    this.childCount = 0,
    this.dimmed = false,
    this.trailing,
    super.key,
  });

  final ItemSummary item;
  final int childCount;
  final bool dimmed;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final secondary = NiwaColors.of(context).textSecondary;
    final actionable = item.nature == ItemNature.actionable;
    final done = item.status == ItemStatus.completed;
    final today = dateOnly(DateTime.now());
    final overdue = item.dueAt != null && item.dueAt!.compareTo(today) < 0;

    final meta = <Widget>[
      if (actionable && item.status != ItemStatus.notStarted)
        _Meta(
          dot: statusColor(context, item.status),
          text: statusLabel(item.status),
        ),
      if (item.dueAt case final due?)
        _Meta(
          icon: Icons.event_outlined,
          text: overdue && !done
              ? 'Overdue · ${formatDay(context, due)}'
              : formatDay(context, due),
          color: overdue && !done ? theme.colorScheme.error : null,
        ),
      if (item.archivedAt != null)
        const _Meta(icon: Icons.archive_outlined, text: 'Archived'),
    ];

    return Opacity(
      opacity: dimmed ? 0.6 : 1,
      child: ListTile(
        onTap: onTap,
        onLongPress: onLongPress,
        leading: ItemTypeIcon(item.type, completed: done),
        title: Text(
          item.title,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: done
              ? TextStyle(
                  decoration: TextDecoration.lineThrough,
                  color: secondary,
                )
              : null,
        ),
        subtitle: meta.isEmpty
            ? null
            : Wrap(spacing: NiwaTokens.spacingUnit * 3, children: meta),
        trailing:
            trailing ??
            (childCount > 0
                ? Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '$childCount',
                        semanticsLabel: childCount == 1
                            ? '1 item inside'
                            : '$childCount items inside',
                        style: TextStyle(color: secondary),
                      ),
                      Icon(Icons.chevron_right, color: secondary),
                    ],
                  )
                : null),
      ),
    );
  }
}

class _Meta extends StatelessWidget {
  const new({required this.text, this.icon, this.dot, this.color});

  final String text;
  final IconData? icon;
  final Color? dot;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? NiwaColors.of(context).textSecondary;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (dot != null)
          Icon(Icons.circle, size: 8, color: dot)
        else if (icon != null)
          Icon(icon, size: 14, color: c),
        const SizedBox(width: NiwaTokens.spacingUnit),
        Text(text, style: TextStyle(color: c, fontSize: 12)),
      ],
    );
  }
}
