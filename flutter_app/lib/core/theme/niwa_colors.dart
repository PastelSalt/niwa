import 'package:flutter/material.dart';
import 'package:niwa/core/theme/tokens.g.dart';

/// NIWA colours that have no Material [ColorScheme] slot: status colours and
/// item-type accents. Read with `NiwaColors.of(context)`.
@immutable
class NiwaColors extends ThemeExtension<NiwaColors> {
  const new({required this.palette, required this.types});

  final NiwaPalette palette;
  final NiwaTypeColors types;

  Color get warning => palette.warning;
  Color get success => palette.success;
  Color get info => palette.info;
  Color get textSecondary => palette.textSecondary;

  static NiwaColors of(BuildContext context) =>
      Theme.of(context).extension<NiwaColors>()!;

  @override
  NiwaColors copyWith({NiwaPalette? palette, NiwaTypeColors? types}) =>
      NiwaColors(palette: palette ?? this.palette, types: types ?? this.types);

  /// Tokens are discrete per mode, so there is nothing to tween.
  @override
  NiwaColors lerp(NiwaColors? other, double t) =>
      t < 0.5 || other == null ? this : other;
}
