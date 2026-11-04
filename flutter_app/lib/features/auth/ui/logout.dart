import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/auth/session.dart';
import 'package:niwa/features/capture/data/capture_queue.dart';

/// Logs out, first warning if captures haven't synced (logout wipes this
/// phone's data, outbox included).
Future<void> confirmAndLogout(BuildContext context, WidgetRef ref) async {
  final waiting = ref.read(captureQueueProvider).length;
  if (waiting > 0) {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log out?'),
        content: Text(
          waiting == 1
              ? "1 capture hasn't synced yet and will be lost."
              : "$waiting captures haven't synced yet and will be lost.",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Log out anyway'),
          ),
        ],
      ),
    );
    if (ok != true) return;
  }
  await ref.read(sessionProvider.notifier).logout();
}
