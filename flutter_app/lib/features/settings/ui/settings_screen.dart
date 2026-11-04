import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/core/auth/session.dart';
import 'package:niwa/core/theme/theme_mode.dart';
import 'package:niwa/core/ui/state_views.dart';
import 'package:niwa/features/auth/ui/logout.dart';

/// Settings sections, same keys as the web (`/settings/:section`).
enum SettingsSection {
  appearance('Appearance', Icons.palette_outlined),
  account('Account', Icons.person_outline),
  ai('AI', Icons.auto_awesome_outlined),
  trash('Trash', Icons.delete_outline);

  new(this.label, this.icon);

  final String label;
  final IconData icon;

  static SettingsSection? parse(String? key) =>
      values.where((s) => s.name == key).firstOrNull;
}

class SettingsScreen extends ConsumerWidget {
  const new({required this.section, super.key});

  final SettingsSection section;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: Text(section.label)),
      body: ListView(
        children: [
          SizedBox(
            height: 56,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                for (final s in SettingsSection.values)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Text(s.label),
                      avatar: Icon(s.icon, size: 18),
                      selected: s == section,
                      onSelected: (_) => context.replace('/settings/${s.name}'),
                    ),
                  ),
              ],
            ),
          ),
          const Divider(height: 1),
          switch (section) {
            SettingsSection.appearance => const _Appearance(),
            SettingsSection.account => const _Account(),
            SettingsSection.ai => const _Later(
              'AI features are switched off for now.',
            ),
            SettingsSection.trash => const _Later(
              'Trash arrives in a later update.',
            ),
          },
        ],
      ),
    );
  }
}

class _Appearance extends ConsumerWidget {
  const new();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeModeProvider);
    return RadioGroup<ThemeMode>(
      groupValue: mode,
      onChanged: (m) => ref.read(themeModeProvider.notifier).set(m!),
      child: const Column(
        children: [
          RadioListTile(value: ThemeMode.system, title: Text('Match system')),
          RadioListTile(value: ThemeMode.light, title: Text('Light')),
          RadioListTile(value: ThemeMode.dark, title: Text('Dark')),
        ],
      ),
    );
  }
}

class _Account extends ConsumerWidget {
  const new();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    return Column(
      children: [
        if (session case SignedIn(:final user))
          ListTile(
            leading: const Icon(Icons.email_outlined),
            title: const Text('Email'),
            subtitle: Text(user.email),
          ),
        ListTile(
          leading: const Icon(Icons.logout),
          title: const Text('Log out'),
          onTap: () => confirmAndLogout(context, ref),
        ),
      ],
    );
  }
}

class _Later extends StatelessWidget {
  const new(this.message);

  final String message;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 320,
    child: EmptyState(icon: Icons.hourglass_empty, title: message),
  );
}
