import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/app/app_shell.dart';
import 'package:niwa/core/auth/session.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/util/date_only.dart';
import 'package:niwa/features/auth/ui/login_screen.dart';
import 'package:niwa/features/auth/ui/register_screen.dart';
import 'package:niwa/features/auth/ui/session_screens.dart';
import 'package:niwa/features/inbox/ui/inbox_screen.dart';
import 'package:niwa/features/items/ui/lens_screens.dart';
import 'package:niwa/features/knowledge/ui/note_editor_screen.dart';
import 'package:niwa/features/scheduler/ui/scheduler_screen.dart';
import 'package:niwa/features/search/ui/search_screen.dart';
import 'package:niwa/features/settings/ui/settings_screen.dart';

/// Paths mirror `web_app/src/app/router.tsx`, so a NIWA link means the same
/// thing on both. Deep links use `niwa://open/<path>`, e.g.
/// `niwa://open/items/<id>#h-<anchor>`.
abstract final class Routes {
  static const home = '/knowledge';
  static const login = '/login';
  static const register = '/register';
  static const splash = '/splash';
  static const unavailable = '/unavailable';
}

const Set<String> _guestOnly = {Routes.login, Routes.register};
const Set<String> _sessionScreens = {Routes.splash, Routes.unavailable};

/// Where [uri] should go for [session], or null to stay (port of the web
/// guards). A signed-out visit to a real page goes to `/login?from=…` and
/// returns there after sign-in.
String? redirectFor(SessionState session, Uri uri) {
  final path = uri.path;
  switch (session) {
    case SessionUnknown():
      return path == Routes.splash ? null : _keepingTarget(Routes.splash, uri);
    case SessionUnavailable():
      return path == Routes.unavailable
          ? null
          : _keepingTarget(Routes.unavailable, uri);
    case SignedOut():
      if (_guestOnly.contains(path)) return null;
      return _keepingTarget(Routes.login, uri);
    case SignedIn():
      if (!_guestOnly.contains(path) && !_sessionScreens.contains(path)) {
        return null;
      }
      final from = uri.queryParameters['from'];
      return from != null && from.startsWith('/') && !from.startsWith('//')
          ? from
          : Routes.home;
  }
}

/// [target] carrying where the user was headed (`from`), unless that was
/// just home or another session screen.
String _keepingTarget(String target, Uri uri) {
  final from =
      _sessionScreens.contains(uri.path) || _guestOnly.contains(uri.path)
      ? uri.queryParameters['from']
      : uri.toString();
  if (from == null || from == '/' || from == Routes.home) return target;
  return Uri(path: target, queryParameters: {'from': from}).toString();
}

/// `…/:itemId/edit` — the note editor, inside the lens's tab.
GoRoute _editRoute() => GoRoute(
  path: 'edit',
  builder: (context, state) =>
      NoteEditorScreen(id: state.pathParameters['itemId']!),
);

GoRoute _redirect(String path, String to) =>
    GoRoute(path: path, redirect: (_, _) => to);

final routerProvider = Provider<GoRouter>((ref) {
  // Bridges Riverpod to go_router's refreshListenable.
  final session = ValueNotifier<SessionState>(ref.read(sessionProvider));
  ref
    ..listen(sessionProvider, (_, next) => session.value = next)
    ..onDispose(session.dispose);

  final router = GoRouter(
    initialLocation: Routes.splash,
    refreshListenable: session,
    redirect: (context, state) => redirectFor(session.value, state.uri),
    errorBuilder: (context, state) => const NotFoundScreen(),
    routes: [
      _redirect('/', Routes.home),
      GoRoute(
        path: Routes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: Routes.register,
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: Routes.splash,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: Routes.unavailable,
        builder: (context, state) => const SessionUnavailableScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => AppShell(navigationShell: shell),
        // Branch order = Destination order.
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/knowledge',
                builder: (context, state) => const KnowledgeScreen(),
                routes: [
                  GoRoute(
                    path: 'review',
                    builder: (context, state) => const ReviewScreen(),
                  ),
                  GoRoute(
                    path: ':itemId',
                    builder: (context, state) => KnowledgeScreen(
                      itemId: state.pathParameters['itemId'],
                      anchor: state.uri.fragment.isEmpty
                          ? null
                          : state.uri.fragment,
                    ),
                    routes: [_editRoute()],
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/actionable',
                builder: (context, state) => const ActionableScreen(),
                routes: [
                  GoRoute(
                    path: ':itemId',
                    builder: (context, state) => ActionableScreen(
                      itemId: state.pathParameters['itemId'],
                    ),
                    routes: [_editRoute()],
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/scheduler',
                // Phones open on the day view (SchedulerHome on the web).
                redirect: (context, state) => state.uri.path == '/scheduler'
                    ? '/scheduler/day/${dateOnly(DateTime.now())}'
                    : null,
                routes: [
                  GoRoute(
                    path: ':view/:date',
                    redirect: (context, state) {
                      final p = state.pathParameters;
                      final valid =
                          SchedulerView.values.any(
                            (v) => v.name == p['view'],
                          ) &&
                          RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(p['date']!);
                      return valid ? null : '/scheduler';
                    },
                    builder: (context, state) => SchedulerScreen(
                      view: SchedulerView.values.byName(
                        state.pathParameters['view']!,
                      ),
                      date: state.pathParameters['date']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/inbox',
                builder: (context, state) => const InboxScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/search',
                builder: (context, state) {
                  final p = state.uri.queryParameters;
                  final nature = ItemNature.values
                      .where((n) => n.name == p['nature'])
                      .firstOrNull;
                  return SearchScreen(
                    query: p['q'] ?? '',
                    nature: nature == ItemNature.unknown ? null : nature,
                    archived: p['archived'] == '1',
                  );
                },
              ),
            ],
          ),
        ],
      ),
      // Full-screen, over the shell.
      GoRoute(
        path: '/items/:id',
        builder: (context, state) => ItemRedirectScreen(
          id: state.pathParameters['id']!,
          fragment: state.uri.fragment.isEmpty ? null : state.uri.fragment,
        ),
      ),
      _redirect('/settings', '/settings/${SettingsSection.appearance.name}'),
      GoRoute(
        path: '/settings/:section',
        redirect: (context, state) =>
            SettingsSection.parse(state.pathParameters['section']) == null
            ? '/settings/${SettingsSection.appearance.name}'
            : null,
        builder: (context, state) => SettingsScreen(
          section: SettingsSection.parse(state.pathParameters['section'])!,
        ),
      ),
    ],
  );
  ref.onDispose(router.dispose);
  return router;
});
