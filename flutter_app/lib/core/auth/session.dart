import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/api/api_client.dart';
import 'package:niwa/core/api/api_exception.dart';
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/db/db_providers.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/net/network_status.dart';

/// Where the app stands on sign-in. The router (MA2.P3) redirects on change.
sealed class SessionState {
  const new();
}

/// Launching: restoring from the stored refresh token.
final class SessionUnknown extends SessionState {
  const new();
}

final class SignedOut extends SessionState {
  const new();
}

final class SignedIn extends SessionState {
  const new(this.user);

  final User user;
}

/// A refresh token is stored but the server couldn't be reached to use it
/// (offline, or Render waking up). The UI offers a retry; until MA5's cache
/// there's no data to show offline.
final class SessionUnavailable extends SessionState {
  const new(this.error);

  final Object error;
}

/// Refresh this long before the access token expires (e.g. on app resume).
const refreshMargin = Duration(minutes: 1);

bool needsRefresh(Session session, DateTime now) =>
    !session.expiresAt.isAfter(now.add(refreshMargin));

/// Owns the signed-in state: restores it at launch, follows the client's
/// session stream (refresh, reuse → signed out) and refreshes on resume when
/// the access token is about to expire.
class SessionController extends Notifier<SessionState> {
  late ApiClient _api;
  Future<void>? _wiping;

  @override
  SessionState build() {
    _api = ref.watch(apiClientProvider);
    final sub = _api.sessionChanges.listen((s) {
      final db = ref.read(appDatabaseProvider);
      if (s == null && state is SignedIn) {
        // Signed out (here or by a revoked token): drop this user's data.
        // If the app is shutting down the database may already be closed.
        _wiping = db.wipe().catchError((_) {});
      } else if (s != null) {
        // Lets the app open offline next time (restore below).
        unawaited(db.writeCache(_userKey, s.user.toJson()).catchError((_) {}));
      }
      state = s == null ? const SignedOut() : SignedIn(s.user);
    });
    final lifecycle = AppLifecycleListener(onResume: onResume);
    ref.onDispose(() {
      unawaited(sub.cancel());
      lifecycle.dispose();
    });
    unawaited(restore());
    return const SessionUnknown();
  }

  /// Also the retry for [SessionUnavailable].
  ///
  /// Offline (or the server erroring) with a stored token: open signed in as
  /// the cached user so saved data is browsable (MA5); the client refreshes
  /// the token on the first request once the server answers. Without a
  /// cached user there's nothing to show, so [SessionUnavailable].
  Future<void> restore() async {
    state = const SessionUnknown();
    try {
      final session = await _api.restoreSession();
      state = session == null ? const SignedOut() : SignedIn(session.user);
    } on OfflineException catch (e) {
      ref.read(networkStatusProvider.notifier).reportOffline();
      state = await _cachedUser() ?? SessionUnavailable(e);
    } on ApiException catch (e) {
      // 5xx etc.: the token may still be good, so don't sign out.
      state = await _cachedUser() ?? SessionUnavailable(e);
    }
  }

  static const _userKey = 'session:user';

  Future<SignedIn?> _cachedUser() async {
    try {
      final json = await ref.read(appDatabaseProvider).readCache(_userKey);
      return json == null
          ? null
          : SignedIn(User.fromJson(json as Map<String, dynamic>));
    } on Object {
      return null;
    }
  }

  Future<void> login({required String email, required String password}) =>
      _api.login(email: email, password: password);

  Future<void> register({required String email, required String password}) =>
      _api.register(email: email, password: password);

  /// Clears the refresh token, the in-memory session and the on-device
  /// database (via the session stream); MA7 also cancels notifications.
  /// Signing out locally always succeeds; if the server can't be told, its
  /// copy of the refresh token simply expires.
  Future<void> logout() async {
    try {
      await _api.logout();
    } on OfflineException {
      // Already signed out locally.
    } on ApiException {
      // Same.
    }
    await _wiping;
  }

  @visibleForTesting
  Future<void> onResume() async {
    final session = _api.session;
    if (session == null || !needsRefresh(session, DateTime.now())) return;
    try {
      await _api.refresh();
    } on Exception {
      // Offline or server down: the next request retries the refresh.
    }
  }
}

final sessionProvider = NotifierProvider<SessionController, SessionState>(
  SessionController.new,
);
