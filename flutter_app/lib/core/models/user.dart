import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:niwa/core/models/enums.dart';

part 'user.freezed.dart';
part 'user.g.dart';

/// Contract `PublicUser`.
@freezed
abstract class User with _$User {
  const factory({
    required String id,
    required String email,
    required String workspaceId,
    required bool aiEnabled,
    required bool hasAiKey,
    required DateTime createdAt,

    /// First-run tour; null until finished or skipped (B-01 B7).
    required OnboardingState? onboarding,
  }) = _User;

  factory fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}

/// Contract `OnboardingState`.
@freezed
abstract class OnboardingState with _$OnboardingState {
  const factory({
    @JsonKey(unknownEnumValue: OnboardingStatus.unknown)
    required OnboardingStatus status,
    required int version,
    required DateTime at,
  }) = _OnboardingState;

  factory fromJson(Map<String, dynamic> json) =>
      _$OnboardingStateFromJson(json);
}

/// Contract `AuthResponse`. `refreshToken` is only present because the app
/// sends `X-Client: mobile` (specs §12.1); it goes to secure storage, never
/// to logs.
@freezed
abstract class AuthResponse with _$AuthResponse {
  const factory({
    required String accessToken,

    /// Access token lifetime in seconds.
    required int expiresIn,
    required User user,
    @JsonKey(includeIfNull: false) String? refreshToken,
  }) = _AuthResponse;

  factory fromJson(Map<String, dynamic> json) => _$AuthResponseFromJson(json);
}
