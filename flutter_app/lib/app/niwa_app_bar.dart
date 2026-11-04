import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/core/auth/session.dart';
import 'package:niwa/features/auth/ui/logout.dart';

/// Top bar for tab screens: title, search and the account menu.
class NiwaAppBar extends StatelessWidget implements PreferredSizeWidget {
  const new({
    required this.title,
    this.showSearch = true,
    this.actions = const [],
    this.bottom,
    super.key,
  });

  final String title;
  final bool showSearch;

  /// Screen-specific actions, shown before search and the account menu.
  final List<Widget> actions;
  final PreferredSizeWidget? bottom;

  @override
  Size get preferredSize =>
      Size.fromHeight(kToolbarHeight + (bottom?.preferredSize.height ?? 0));

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(title),
      bottom: bottom,
      actions: [
        ...actions,
        if (showSearch)
          IconButton(
            tooltip: 'Search',
            icon: const Icon(Icons.search),
            onPressed: () => context.go('/search'),
          ),
        const AccountMenu(),
      ],
    );
  }
}

enum _AccountAction { settings, logout }

class AccountMenu extends ConsumerWidget {
  const new({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final email = session is SignedIn ? session.user.email : null;

    return PopupMenuButton<_AccountAction>(
      tooltip: 'Account',
      icon: const Icon(Icons.account_circle_outlined),
      onSelected: (action) => switch (action) {
        _AccountAction.settings => context.push('/settings'),
        _AccountAction.logout => confirmAndLogout(context, ref),
      },
      itemBuilder: (context) => [
        if (email != null)
          PopupMenuItem<_AccountAction>(
            enabled: false,
            child: Text(email, overflow: TextOverflow.ellipsis),
          ),
        const PopupMenuItem(
          value: _AccountAction.settings,
          child: ListTile(
            leading: Icon(Icons.settings_outlined),
            title: Text('Settings'),
          ),
        ),
        const PopupMenuItem(
          value: _AccountAction.logout,
          child: ListTile(leading: Icon(Icons.logout), title: Text('Log out')),
        ),
      ],
    );
  }
}
