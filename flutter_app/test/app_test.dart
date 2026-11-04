import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:niwa/core/config/env.dart';

import 'support/fake_server.dart';
import 'support/test_app.dart';

void main() {
  testWidgets('renders in light and dark', (tester) async {
    for (final brightness in Brightness.values) {
      tester.platformDispatcher.platformBrightnessTestValue = brightness;
      await pumpApp(tester, server: FakeServer());

      expect(find.text('NIWA'), findsWidgets);
      final context = tester.element(find.byType(Scaffold));
      expect(Theme.of(context).brightness, brightness);
    }
    tester.platformDispatcher.clearPlatformBrightnessTestValue();
  });

  test('unknown APP_ENV falls back to local', () {
    expect(AppEnv.parse('nope'), AppEnv.local);
    expect(AppEnv.parse('prod'), AppEnv.prod);
  });
}
