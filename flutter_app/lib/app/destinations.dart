import 'package:flutter/material.dart';

/// Bottom-bar destinations (port of `web_app/src/layout/destinations.tsx`;
/// Settings lives in the account menu, as on the web phone layout). The
/// order is the `StatefulShellRoute` branch order.
enum Destination {
  knowledge(
    'Knowledge',
    '/knowledge',
    Icons.auto_stories_outlined,
    Icons.auto_stories,
  ),
  actionable(
    'Actionable',
    '/actionable',
    Icons.task_alt_outlined,
    Icons.task_alt,
  ),
  scheduler(
    'Scheduler',
    '/scheduler',
    Icons.calendar_month_outlined,
    Icons.calendar_month,
  ),
  inbox('Inbox', '/inbox', Icons.inbox_outlined, Icons.inbox),
  search('Search', '/search', Icons.search_outlined, Icons.search);

  new(this.label, this.path, this.icon, this.selectedIcon);

  final String label;
  final String path;
  final IconData icon;
  final IconData selectedIcon;
}
