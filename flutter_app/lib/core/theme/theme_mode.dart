import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/db/db_providers.dart';

const _key = 'themeMode';

/// Follows the system theme unless the user picks one in Settings; the
/// choice is saved on the device (and survives logout).
class ThemeModeController extends Notifier<ThemeMode> {
  @override
  ThemeMode build() {
    unawaited(_load());
    return ThemeMode.system;
  }

  Future<void> _load() async {
    try {
      final saved = await ref.read(appDatabaseProvider).preference(_key);
      final mode = ThemeMode.values.where((m) => m.name == saved).firstOrNull;
      if (mode != null) state = mode;
    } on Object {
      // No saved choice (or no database yet): keep following the system.
    }
  }

  void set(ThemeMode mode) {
    state = mode;
    unawaited(
      ref
          .read(appDatabaseProvider)
          .setPreference(_key, mode.name)
          .catchError((Object _) {}),
    );
  }
}

final themeModeProvider = NotifierProvider<ThemeModeController, ThemeMode>(
  ThemeModeController.new,
);
