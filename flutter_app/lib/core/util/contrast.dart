import 'dart:math' as math;
import 'dart:ui' show Color;

/// WCAG 2.x relative luminance (port of `web_app/src/lib/a11y.ts`).
double _luminance(Color c) {
  double channel(double v) =>
      v <= 0.03928 ? v / 12.92 : math.pow((v + 0.055) / 1.055, 2.4).toDouble();
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

/// WCAG contrast ratio between two opaque colours.
double contrastRatio(Color a, Color b) {
  final x = _luminance(a);
  final y = _luminance(b);
  return (math.max(x, y) + 0.05) / (math.min(x, y) + 0.05);
}

const Color _lightText = Color(0xFFFFFFFF);
const Color _darkText = Color(0xFF1A1D1B);

/// Whichever of white or near-black text reads better on [background].
Color readableOn(Color background) =>
    contrastRatio(_lightText, background) >=
        contrastRatio(_darkText, background)
    ? _lightText
    : _darkText;
