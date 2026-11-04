import 'package:flutter/material.dart';
import 'package:niwa/core/api/error_message.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/core/theme/tokens.g.dart';

/// Shared empty / error / loading states, so every screen looks and reads
/// the same when there's nothing to show yet.

class EmptyState extends StatelessWidget {
  const new({
    required this.icon,
    required this.title,
    this.message,
    this.action,
    super.key,
  });

  final IconData icon;
  final String title;
  final String? message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final secondary = NiwaColors.of(context).textSecondary;
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(NiwaTokens.spacingUnit * 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: secondary),
            const SizedBox(height: NiwaTokens.spacingUnit * 4),
            Text(
              title,
              style: theme.textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            if (message case final message?) ...[
              const SizedBox(height: NiwaTokens.spacingUnit * 2),
              Text(
                message,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(color: secondary),
              ),
            ],
            if (action case final action?) ...[
              const SizedBox(height: NiwaTokens.spacingUnit * 6),
              action,
            ],
          ],
        ),
      ),
    );
  }
}

/// A failed load, with the user-facing message and a retry.
class ErrorState extends StatelessWidget {
  const new({required this.error, required this.onRetry, super.key});

  final Object error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      liveRegion: true,
      child: EmptyState(
        icon: Icons.cloud_off_outlined,
        title: "Couldn't load this",
        message: messageOf(error),
        action: FilledButton.icon(
          onPressed: onRetry,
          icon: const Icon(Icons.refresh),
          label: const Text('Try again'),
        ),
      ),
    );
  }
}

/// Placeholder rows while a list loads. Static (no shimmer), so it's calm
/// and fine with reduced motion.
class ListSkeleton extends StatelessWidget {
  const new({this.rows = 6, super.key});

  final int rows;

  @override
  Widget build(BuildContext context) {
    final fill = Theme.of(context).colorScheme.outlineVariant;
    Widget bar(double widthFactor, double height) => FractionallySizedBox(
      alignment: Alignment.centerLeft,
      widthFactor: widthFactor,
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: fill,
          borderRadius: BorderRadius.circular(NiwaTokens.radiusSmall),
        ),
      ),
    );

    return Semantics(
      label: 'Loading',
      child: ExcludeSemantics(
        child: ListView.separated(
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.all(NiwaTokens.spacingUnit * 4),
          itemCount: rows,
          separatorBuilder: (_, _) =>
              const SizedBox(height: NiwaTokens.spacingUnit * 5),
          itemBuilder: (_, i) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              bar(i.isEven ? 0.7 : 0.5, 16),
              const SizedBox(height: NiwaTokens.spacingUnit * 2),
              bar(0.3, 12),
            ],
          ),
        ),
      ),
    );
  }
}
