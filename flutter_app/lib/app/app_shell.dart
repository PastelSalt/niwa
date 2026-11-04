import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/app/destinations.dart';
import 'package:niwa/core/net/network_status.dart';
import 'package:niwa/features/capture/ui/capture_sheet.dart';
import 'package:niwa/features/inbox/data/inbox_providers.dart';
import 'package:niwa/features/scheduler/data/reminders.dart';

/// Phone shell (CONCEPT.md §1): bottom navigation, one back stack per tab,
/// and the capture button on every tab.
class AppShell extends ConsumerWidget {
  const new({required this.navigationShell, super.key});

  final StatefulNavigationShell navigationShell;

  void _select(int index) => navigationShell.goBranch(
    index,
    // Tapping the current tab again returns to its root.
    initialLocation: index == navigationShell.currentIndex,
  );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inboxCount = ref.watch(inboxCountProvider);
    final onFirstTab = navigationShell.currentIndex == 0;
    final online = ref.watch(networkStatusProvider);
    // Keeps reminders scheduled for the coming two weeks while signed in.
    ref.listen(reminderServiceProvider, (_, _) {});

    return PopScope(
      // Android back at a tab's root goes to the first tab, then leaves.
      canPop: onFirstTab,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) navigationShell.goBranch(0);
      },
      child: Scaffold(
        body: navigationShell,
        floatingActionButton: FloatingActionButton(
          tooltip: 'Capture',
          onPressed: () => showCaptureSheet(
            context,
            suggestedParentId: _itemOnScreen(context),
          ),
          child: const Icon(Icons.add),
        ),
        bottomNavigationBar: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!online) const OfflineBanner(),
            NavigationBar(
              selectedIndex: navigationShell.currentIndex,
              onDestinationSelected: _select,
              destinations: [
                for (final d in Destination.values)
                  NavigationDestination(
                    icon: _badged(d, inboxCount, Icon(d.icon)),
                    selectedIcon: _badged(d, inboxCount, Icon(d.selectedIcon)),
                    label: d.label,
                    tooltip: d == Destination.inbox && inboxCount > 0
                        ? 'Inbox, ${_items(inboxCount)}'
                        : null,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// The item whose screen is showing (`/knowledge/:id`, `/actionable/:id`),
  /// suggested as the capture's future home (web: the selected tree item).
  static String? _itemOnScreen(BuildContext context) {
    final path = GoRouter.of(context)
        .routerDelegate
        .currentConfiguration
        .uri
        .path;
    final m = RegExp('^/(knowledge|actionable)/([^/]+)').firstMatch(path);
    final id = m?.group(2);
    return id == 'review' ? null : id;
  }

  static String _items(int n) => n == 1 ? '1 item' : '$n items';

  Widget _badged(Destination d, int count, Widget icon) =>
      d == Destination.inbox && count > 0
      ? Badge(label: Text(count > 99 ? '99+' : '$count'), child: icon)
      : icon;
}

/// Shown above the bottom bar while the server can't be reached.
class OfflineBanner extends StatelessWidget {
  const new({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Semantics(
      liveRegion: true,
      child: Material(
        color: scheme.inverseSurface,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              Icon(Icons.cloud_off, size: 18, color: scheme.onInverseSurface),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Offline — showing saved data. Captures will sync.',
                  style: TextStyle(color: scheme.onInverseSurface),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
