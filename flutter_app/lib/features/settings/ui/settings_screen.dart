import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/core/api/error_message.dart';
import 'package:niwa/core/auth/session.dart';
import 'package:niwa/core/theme/theme_mode.dart';
import 'package:niwa/core/ui/snackbars.dart';
import 'package:niwa/core/ui/state_views.dart';
import 'package:niwa/core/util/app_version.dart';
import 'package:niwa/core/util/links.dart';
import 'package:niwa/features/auth/ui/logout.dart';
import 'package:niwa/features/settings/ui/trash_section.dart';

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
            SettingsSection.trash => const TrashSection(),
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
        ListTile(
          leading: const Icon(Icons.devices_other),
          title: const Text('Sign out everywhere'),
          subtitle: const Text('Every phone and browser signed in to NIWA'),
          onTap: () => _signOutEverywhere(context, ref),
        ),
        const Divider(),
        ListTile(
          leading: const Icon(Icons.info_outline),
          title: const Text('NIWA for mobile'),
          subtitle: Text(
            'Version ${ref.watch(appVersionProvider).value ?? '…'}',
          ),
        ),
        ListTile(
          leading: const Icon(Icons.mail_outline),
          title: const Text('Questions or privacy requests'),
          subtitle: const Text(NiwaLinks.contactEmail),
          onTap: () => openLink(NiwaLinks.contact),
        ),
        ListTile(
          leading: const Icon(Icons.privacy_tip_outlined),
          title: const Text('Privacy Policy'),
          onTap: () => openLink(NiwaLinks.privacy),
        ),
        ListTile(
          leading: const Icon(Icons.gavel_outlined),
          title: const Text('Terms of Use'),
          onTap: () => openLink(NiwaLinks.terms),
        ),
        ListTile(
          leading: const Icon(Icons.verified_outlined),
          title: const Text('App licence (MIT)'),
          onTap: () => openLink(NiwaLinks.appLicence),
        ),
        ListTile(
          leading: const Icon(Icons.code),
          title: const Text('Source code'),
          onTap: () => openLink(NiwaLinks.source),
        ),
        ListTile(
          leading: const Icon(Icons.description_outlined),
          title: const Text('Open-source licences'),
          onTap: () => showLicensePage(
            context: context,
            applicationName: 'NIWA',
            applicationVersion: ref.read(appVersionProvider).value,
            applicationLegalese: 'Designed and built solo by Moeko Works',
          ),
        ),
      ],
    );
  }

  Future<void> _signOutEverywhere(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign out everywhere?'),
        content: const Text(
          'Every device signed in to your account will need to log in again. '
          'Other devices may stay signed in for up to 15 minutes.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Sign out everywhere'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(sessionProvider.notifier).logoutEverywhere();
    } on Object catch (e) {
      ref.read(snackbarsProvider).show(messageOf(e));
    }
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
