import 'package:flutter/material.dart';
import 'package:niwa/core/api/error_message.dart';

/// Submit handling shared by login and register: validates, shows progress,
/// turns failures into a banner message.
mixin AuthFormState<T extends StatefulWidget> on State<T> {
  final formKey = GlobalKey<FormState>();
  bool submitting = false;
  String? error;

  Future<void> submitWith(Future<void> Function() action) async {
    if (submitting || !(formKey.currentState?.validate() ?? false)) return;
    setState(() {
      submitting = true;
      error = null;
    });
    try {
      await action();
      // On success the router redirects away; nothing else to do here.
    } on Object catch (e) {
      if (mounted) setState(() => error = messageOf(e));
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }
}

/// Full-width primary button with an inline spinner while [busy].
class SubmitButton extends StatelessWidget {
  const new({
    required this.label,
    required this.busy,
    required this.onPressed,
    super.key,
  });

  final String label;
  final bool busy;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: busy ? null : onPressed,
      style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
      child: busy
          ? SizedBox.square(
              dimension: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                semanticsLabel: '$label in progress',
              ),
            )
          : Text(label),
    );
  }
}
