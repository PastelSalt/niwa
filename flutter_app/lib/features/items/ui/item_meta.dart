import 'package:flutter/material.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/niwa_colors.dart';

/// Labels for item enums (port of `itemMeta.tsx`).

String typeLabel(ItemType t) => switch (t) {
  ItemType.project => 'Project',
  ItemType.task => 'Task',
  ItemType.note => 'Note',
  ItemType.idea => 'Idea',
  ItemType.unknown => 'Item',
};

String statusLabel(ItemStatus s) => switch (s) {
  ItemStatus.notStarted => 'Not started',
  ItemStatus.inProgress => 'In progress',
  ItemStatus.blocked => 'Blocked',
  ItemStatus.completed => 'Completed',
  ItemStatus.unknown => 'Unknown',
};

String priorityLabel(ItemPriority p) => switch (p) {
  ItemPriority.none => 'None',
  ItemPriority.low => 'Low',
  ItemPriority.medium => 'Medium',
  ItemPriority.high => 'High',
  ItemPriority.critical => 'Critical',
  ItemPriority.unknown => 'Unknown',
};

/// Status accent, used as a dot (never as text colour).
Color statusColor(BuildContext context, ItemStatus s) {
  final niwa = NiwaColors.of(context);
  return switch (s) {
    ItemStatus.inProgress => niwa.info,
    ItemStatus.blocked => niwa.warning,
    ItemStatus.completed => niwa.success,
    _ => Theme.of(context).colorScheme.outline,
  };
}

/// Default type when creating inside a lens.
ItemType defaultTypeFor(ItemNature nature) =>
    nature == ItemNature.actionable ? ItemType.task : ItemType.note;

String lensPath(ItemNature nature) =>
    nature == ItemNature.actionable ? '/actionable' : '/knowledge';

/// `YYYY-MM-DD` → short local date, e.g. "Nov 20".
String formatDay(BuildContext context, String day) {
  final p = day.split('-').map(int.parse).toList();
  return MaterialLocalizations.of(context)
      .formatShortMonthDay(DateTime(p[0], p[1], p[2]));
}
