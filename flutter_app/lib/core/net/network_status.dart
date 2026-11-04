import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/api/api_exception.dart';
import 'package:niwa/core/api/providers.dart';

/// OS network changes. Tests override it.
final connectivityChangesProvider = Provider<Stream<List<ConnectivityResult>>>(
  (ref) => Connectivity().onConnectivityChanged,
);

/// How often to re-check `/health` while offline.
final offlineProbeIntervalProvider = Provider<Duration>(
  (ref) => const Duration(seconds: 20),
);

/// Whether the NIWA server is reachable. A Wi-Fi icon isn't proof (captive
/// portals, a sleeping Render instance), so "online" means `/health`
/// answered; any request that gets no answer reports offline.
class NetworkStatus extends Notifier<bool> {
  Timer? _probe;

  @override
  bool build() {
    final sub = ref.watch(connectivityChangesProvider).listen((results) {
      if (results.every((r) => r == ConnectivityResult.none)) {
        reportOffline();
      } else {
        unawaited(probe());
      }
    });
    ref.onDispose(() {
      unawaited(sub.cancel());
      _probe?.cancel();
    });
    return true; // optimistic until a request or the OS says otherwise
  }

  void reportOffline() {
    if (state) state = false;
    _probe ??= Timer.periodic(
      ref.read(offlineProbeIntervalProvider),
      (_) => unawaited(probe()),
    );
  }

  void reportOnline() {
    _probe?.cancel();
    _probe = null;
    if (!state) state = true;
  }

  /// Checks `/health`; any answer from the server counts as online.
  Future<void> probe() async {
    try {
      await ref.read(apiClientProvider).anonymous('GET', '/health');
      reportOnline();
    } on OfflineException {
      reportOffline();
    } on ApiException {
      reportOnline();
    }
  }
}

final networkStatusProvider = NotifierProvider<NetworkStatus, bool>(
  NetworkStatus.new,
);
