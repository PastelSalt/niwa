import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// App-wide snackbars, shown through the root `ScaffoldMessenger` so they
/// survive navigation (e.g. delete an item, then its screen closes).
class Snackbars {
  final key = GlobalKey<ScaffoldMessengerState>();

  /// Shows [message]; with [onUndo], an Undo action (delete, archive), or any
  /// other action via [actionLabel] + [onAction] (e.g. "Open" after filing).
  /// Replaces any snackbar already showing.
  void show(
    String message, {
    VoidCallback? onUndo,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    final label = onUndo != null ? 'Undo' : actionLabel;
    final onPressed = onUndo ?? onAction;
    key.currentState
      ?..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          behavior: SnackBarBehavior.floating,
          // Undo needs time to reach; TalkBack users get longer by default.
          duration: Duration(seconds: onPressed == null ? 4 : 8),
          action: label == null || onPressed == null
              ? null
              : SnackBarAction(label: label, onPressed: onPressed),
        ),
      );
  }
}

final snackbarsProvider = Provider<Snackbars>((ref) => Snackbars());
