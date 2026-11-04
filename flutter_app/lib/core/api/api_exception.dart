import 'package:niwa/core/models/models.dart';

/// The server answered with an error (the contract `ErrorEnvelope`, or a
/// synthesised one when the body isn't an envelope, e.g. a proxy's 502 page).
class ApiException implements Exception {
  const new({
    required this.status,
    required this.code,
    required this.message,
    this.details,
    this.requestId,
    this.retryAfter,
  });

  final int status;
  final ErrorCode code;
  final String message;
  final Object? details;
  final String? requestId;

  /// From `Retry-After` on 429 responses, when the server sends it.
  final Duration? retryAfter;

  @override
  String toString() => 'ApiException($status ${code.name}: $message)';
}

/// The request never got an answer: no connection, DNS failure or timeout.
/// Callers show an offline state (or queue the write, MA5) rather than an
/// error from the server.
class OfflineException implements Exception {
  const new(this.message, {this.timedOut = false});

  final String message;

  /// True for timeouts — on Render's free tier usually a cold start.
  final bool timedOut;

  @override
  String toString() => 'OfflineException($message)';
}
