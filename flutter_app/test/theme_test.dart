import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:niwa/core/theme/app_theme.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/core/util/contrast.dart';

/// Port of `packages/tokens/src/contrast.test.ts`, run against the generated
/// Dart tokens and the Material theme built from them.
void main() {
  final modes = {
    Brightness.light: (NiwaTokens.light, NiwaTokens.lightTypes),
    Brightness.dark: (NiwaTokens.dark, NiwaTokens.darkTypes),
  };

  for (final MapEntry(key: brightness, value: (p, types)) in modes.entries) {
    final typeColors = [types.project, types.task, types.note, types.idea];

    group('${brightness.name} palette', () {
      test('body and secondary text meet AA (4.5:1) on page and surface', () {
        for (final bg in [p.background, p.surface]) {
          expect(contrastRatio(p.textPrimary, bg), greaterThanOrEqualTo(4.5));
          expect(contrastRatio(p.textSecondary, bg), greaterThanOrEqualTo(4.5));
        }
      });

      test('text on primary/secondary meets AA (4.5:1)', () {
        expect(
          contrastRatio(p.primaryContrast, p.primary),
          greaterThanOrEqualTo(4.5),
        );
        expect(
          contrastRatio(p.secondaryContrast, p.secondary),
          greaterThanOrEqualTo(4.5),
        );
      });

      test('primary text 4.5:1; status and type colours 3:1', () {
        for (final bg in [p.background, p.surface]) {
          expect(contrastRatio(p.primary, bg), greaterThanOrEqualTo(4.5));
          for (final c in [
            p.error,
            p.warning,
            p.success,
            p.info,
            ...typeColors,
          ]) {
            expect(contrastRatio(c, bg), greaterThanOrEqualTo(3));
          }
        }
      });

      test('block fills carry white or dark text at 4.5:1', () {
        final fills = [
          p.primary,
          p.secondary,
          p.error,
          p.warning,
          p.success,
          p.info,
          ...typeColors,
        ];
        for (final c in fills) {
          expect(contrastRatio(readableOn(c), c), greaterThanOrEqualTo(4.5));
        }
      });

      test('ThemeData uses the tokens', () {
        final theme = brightness == Brightness.light
            ? AppTheme.light()
            : AppTheme.dark();
        final scheme = theme.colorScheme;
        expect(theme.brightness, brightness);
        expect(scheme.primary, p.primary);
        expect(scheme.onPrimary, p.primaryContrast);
        expect(scheme.surface, p.surface);
        expect(scheme.onSurface, p.textPrimary);
        expect(theme.scaffoldBackgroundColor, p.background);
        expect(
          contrastRatio(scheme.onError, scheme.error),
          greaterThanOrEqualTo(4.5),
        );
        expect(theme.extension<NiwaColors>()?.types.task, types.task);
      });
    });
  }

  test('contrastRatio matches known WCAG values', () {
    const white = Color(0xFFFFFFFF);
    const black = Color(0xFF000000);
    expect(contrastRatio(white, black), closeTo(21, 0.01));
    expect(contrastRatio(white, white), closeTo(1, 0.0001));
  });
}
