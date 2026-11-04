import 'package:freezed_annotation/freezed_annotation.dart';

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
  }) = _User;

  factory fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
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
