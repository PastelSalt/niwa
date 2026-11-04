import 'package:niwa/core/api/api_exception.dart';
import 'package:niwa/core/models/models.dart';

/// A sentence for the user about [error] (port of `messageOf` in
/// `web_app/src/api/client.ts`, plus mobile cases). Server messages are
/// already written for people, so they're shown as-is.
String messageOf(Object error) => switch (error) {
  OfflineException(timedOut: true) =>
    'The NIWA server is waking up — this can take up to a minute. '
        'Try again shortly.',
  OfflineException() =>
    "Can't reach the NIWA server. Check your connection and try again.",
  ApiException(code: ErrorCode.rateLimited, :final retryAfter?) =>
    'Too many attempts. Try again in ${_wait(retryAfter)}.',
  ApiException(code: ErrorCode.rateLimited) =>
    'Too many attempts. Wait a moment and try again.',
  ApiException(:final message) => message,
  _ => 'Something went wrong. Please try again.',
};

String _wait(Duration d) {
  if (d.inSeconds < 60) return '${d.inSeconds} s';
  final minutes = (d.inSeconds / 60).ceil();
  return minutes == 1 ? '1 minute' : '$minutes minutes';
}
