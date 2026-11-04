import 'package:flutter/material.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/core/theme/tokens.g.dart';

/// Shared frame for the signed-out screens (port of `AuthLayout.tsx`).
class AuthLayout extends StatelessWidget {
  const new({
    required this.title,
    required this.subtitle,
    required this.child,
    super.key,
  });

  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final secondary = NiwaColors.of(context).textSecondary;
    const unit = NiwaTokens.spacingUnit;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(
              horizontal: unit * 4,
              vertical: unit * 6,
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'NIWA',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.displaySmall?.copyWith(
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: unit * 1.5),
                  Text(
                    'A garden for your ideas.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: secondary,
                    ),
                  ),
                  const SizedBox(height: unit * 8),
                  Semantics(
                    header: true,
                    child: Text(title, style: theme.textTheme.headlineSmall),
                  ),
                  const SizedBox(height: unit),
                  Text(
                    subtitle,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: secondary,
                    ),
                  ),
                  const SizedBox(height: unit * 6),
                  child,
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Error banner for a failed submit; announced to screen readers.
class FormErrorBanner extends StatelessWidget {
  const new(this.message, {super.key});

  final String message;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Semantics(
      liveRegion: true,
      container: true,
      child: Container(
        padding: const EdgeInsets.all(NiwaTokens.spacingUnit * 3),
        decoration: BoxDecoration(
          color: scheme.errorContainer,
          borderRadius: BorderRadius.circular(NiwaTokens.radiusSmall),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.error_outline, color: scheme.onErrorContainer),
            const SizedBox(width: NiwaTokens.spacingUnit * 2),
            Expanded(
              child: Text(
                message,
                style: TextStyle(color: scheme.onErrorContainer),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// "First time here? Create your account" — wraps onto two lines when the
/// text is large rather than overflowing.
class AuthSwitchPrompt extends StatelessWidget {
  const new({
    required this.question,
    required this.action,
    required this.onPressed,
    super.key,
  });

  final String question;
  final String action;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Text(question),
        TextButton(onPressed: onPressed, child: Text(action)),
      ],
    );
  }
}
