import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/api/error_message.dart';
import 'package:niwa/core/auth/session.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/core/theme/tokens.g.dart';

/// Shown while the stored session is being restored at launch.
class SplashScreen extends StatelessWidget {
  const new({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(semanticsLabel: 'Signing you in'),
      ),
    );
  }
}

/// A session is stored but the server couldn't be reached to restore it.
class SessionUnavailableScreen extends ConsumerWidget {
  const new({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(sessionProvider);
    final theme = Theme.of(context);
    final message = state is SessionUnavailable
        ? messageOf(state.error)
        : "Can't reach the NIWA server.";

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(NiwaTokens.spacingUnit * 6),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.cloud_off_outlined,
                  size: 48,
                  color: NiwaColors.of(context).textSecondary,
                ),
                const SizedBox(height: NiwaTokens.spacingUnit * 4),
                Semantics(
                  header: true,
                  child: Text(
                    'Not connected',
                    style: theme.textTheme.headlineSmall,
                  ),
                ),
                const SizedBox(height: NiwaTokens.spacingUnit * 2),
                Text(message, textAlign: TextAlign.center),
                const SizedBox(height: NiwaTokens.spacingUnit * 6),
                FilledButton.icon(
                  onPressed: () => ref.read(sessionProvider.notifier).restore(),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Try again'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
