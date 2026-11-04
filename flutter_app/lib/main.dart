import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/app/app.dart';

void main() {
  LicenseRegistry.addLicense(_fontLicenses);
  runApp(const ProviderScope(child: NiwaApp()));
}

/// The bundled fonts' OFL texts, shown on the licences page
/// (Settings › Account).
Stream<LicenseEntry> _fontLicenses() async* {
  for (final (font, file) in const [
    ('Inter', 'Inter-OFL.txt'),
    ('JetBrains Mono', 'JetBrainsMono-OFL.txt'),
    ('Noto Sans JP', 'NotoSansJP-OFL.txt'),
  ]) {
    yield LicenseEntryWithLineBreaks([
      font,
    ], await rootBundle.loadString('assets/fonts/$file'));
  }
}
