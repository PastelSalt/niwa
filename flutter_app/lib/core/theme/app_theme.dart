import 'package:flutter/material.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/core/util/contrast.dart';

/// Material 3 themes built only from `@niwa/tokens` (via `tokens.g.dart`) —
/// no colour literals anywhere else (specs §1, §10.1). Mirrors
/// `web_app/src/app/theme.ts`.
abstract final class AppTheme {
  static ThemeData light() =>
      _build(Brightness.light, NiwaTokens.light, NiwaTokens.lightTypes);

  static ThemeData dark() =>
      _build(Brightness.dark, NiwaTokens.dark, NiwaTokens.darkTypes);

  static ColorScheme colorScheme(Brightness brightness, NiwaPalette p) =>
      ColorScheme(
        brightness: brightness,
        primary: p.primary,
        onPrimary: p.primaryContrast,
        secondary: p.secondary,
        onSecondary: p.secondaryContrast,
        error: p.error,
        onError: readableOn(p.error),
        surface: p.surface,
        onSurface: p.textPrimary,
        onSurfaceVariant: p.textSecondary,
        surfaceContainerLowest: p.background,
        outline: p.textSecondary,
        outlineVariant: p.divider,
      );

  static ThemeData _build(
    Brightness brightness,
    NiwaPalette p,
    NiwaTypeColors types,
  ) {
    final scheme = colorScheme(brightness, p);
    const radius = BorderRadius.all(Radius.circular(NiwaTokens.radius));
    const radiusSmall = BorderRadius.all(
      Radius.circular(NiwaTokens.radiusSmall),
    );
    const buttonShape = WidgetStatePropertyAll<OutlinedBorder>(
      RoundedRectangleBorder(borderRadius: radius),
    );
    const buttonText = WidgetStatePropertyAll<TextStyle>(
      TextStyle(fontWeight: FontWeight.w600),
    );
    const buttonStyle = ButtonStyle(shape: buttonShape, textStyle: buttonText);

    final base = ThemeData(
      colorScheme: scheme,
      scaffoldBackgroundColor: p.background,
      dividerColor: p.divider,
      // Bundled in pubspec.yaml; the rest of the token list is the fallback.
      fontFamily: NiwaTokens.fontFamilies.first,
      fontFamilyFallback: NiwaTokens.fontFamilies.skip(1).toList(),
      extensions: [NiwaColors(palette: p, types: types)],
    );
    final text = base.textTheme;
    TextStyle? semibold(TextStyle? s) =>
        s?.copyWith(fontWeight: FontWeight.w600);

    return base.copyWith(
      // Headings are semibold, as on the web.
      textTheme: text.copyWith(
        displaySmall: semibold(text.displaySmall),
        headlineLarge: semibold(text.headlineLarge),
        headlineMedium: semibold(text.headlineMedium),
        headlineSmall: semibold(text.headlineSmall),
        titleLarge: semibold(text.titleLarge),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: p.background,
        foregroundColor: p.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      cardTheme: CardThemeData(
        color: p.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: radius,
          side: BorderSide(color: p.divider),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: p.surface,
        shape: const RoundedRectangleBorder(borderRadius: radius),
      ),
      filledButtonTheme: const FilledButtonThemeData(style: buttonStyle),
      outlinedButtonTheme: const OutlinedButtonThemeData(style: buttonStyle),
      textButtonTheme: const TextButtonThemeData(style: buttonStyle),
      chipTheme: const ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: radiusSmall),
      ),
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(borderRadius: radius),
      ),
    );
  }
}
