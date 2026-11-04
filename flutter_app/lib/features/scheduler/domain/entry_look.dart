import 'dart:ui';

import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/core/util/contrast.dart';

/// Colour choices for entries, from the design tokens (stored as hex, specs
/// §1) — same list as the web `ENTRY_COLORS`.
final entryColors = <(String, Color)>[
  ('Sage', NiwaTokens.light.primary),
  ('Blossom', NiwaTokens.light.secondary),
  ('Sky', NiwaTokens.light.info),
  ('Amber', NiwaTokens.light.warning),
  ('Moss', NiwaTokens.light.success),
  ('Clay', NiwaTokens.light.error),
];

String colorHex(Color c) {
  final rgb = (c.toARGB32() & 0xFFFFFF).toRadixString(16).padLeft(6, '0');
  return '#${rgb.toUpperCase()}';
}

Color? parseHex(String? hex) {
  if (hex == null || !RegExp(r'^#[0-9a-fA-F]{6}$').hasMatch(hex)) return null;
  return Color(0xFF000000 | int.parse(hex.substring(1), radix: 16));
}

/// How an entry is drawn (port of web `useEntryLook`): blocks show their
/// item's live title; colour falls back to the item type, then primary.
class EntryLook {
  const new(this.title, this.color, this.textColor, this.item);

  final String title;
  final Color color;

  /// Readable on [color] (WCAG 1.4.3).
  final Color textColor;
  final ItemSummary? item;
}

EntryLook entryLook(
  ScheduleEntry e, {
  required Map<String, ItemSummary> items,
  required bool dark,
}) {
  final item = e.itemId == null ? null : items[e.itemId];
  final title = e.kind == ScheduleKind.block
      ? (e.title.isNotEmpty ? e.title : item?.title ?? 'Time block')
      : e.title;
  final palette = dark ? NiwaTokens.dark : NiwaTokens.light;
  final types = dark ? NiwaTokens.darkTypes : NiwaTokens.lightTypes;
  final typeColor = switch (item?.type) {
    ItemType.project => types.project,
    ItemType.task => types.task,
    ItemType.note => types.note,
    ItemType.idea => types.idea,
    _ => null,
  };
  final color = parseHex(e.color) ?? typeColor ?? palette.primary;
  return EntryLook(title, color, readableOn(color), item);
}
