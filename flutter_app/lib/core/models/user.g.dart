// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_User _$UserFromJson(Map<String, dynamic> json) => _User(
  id: json['id'] as String,
  email: json['email'] as String,
  workspaceId: json['workspaceId'] as String,
  aiEnabled: json['aiEnabled'] as bool,
  hasAiKey: json['hasAiKey'] as bool,
  createdAt: DateTime.parse(json['createdAt'] as String),
  onboarding: json['onboarding'] == null
      ? null
      : OnboardingState.fromJson(json['onboarding'] as Map<String, dynamic>),
);

Map<String, dynamic> _$UserToJson(_User instance) => <String, dynamic>{
  'id': instance.id,
  'email': instance.email,
  'workspaceId': instance.workspaceId,
  'aiEnabled': instance.aiEnabled,
  'hasAiKey': instance.hasAiKey,
  'createdAt': instance.createdAt.toIso8601String(),
  'onboarding': instance.onboarding?.toJson(),
};

_OnboardingState _$OnboardingStateFromJson(Map<String, dynamic> json) =>
    _OnboardingState(
      status: $enumDecode(
        _$OnboardingStatusEnumMap,
        json['status'],
        unknownValue: OnboardingStatus.unknown,
      ),
      version: (json['version'] as num).toInt(),
      at: DateTime.parse(json['at'] as String),
    );

Map<String, dynamic> _$OnboardingStateToJson(_OnboardingState instance) =>
    <String, dynamic>{
      'status': _$OnboardingStatusEnumMap[instance.status]!,
      'version': instance.version,
      'at': instance.at.toIso8601String(),
    };

const _$OnboardingStatusEnumMap = {
  OnboardingStatus.completed: 'completed',
  OnboardingStatus.skipped: 'skipped',
  OnboardingStatus.unknown: 'unknown',
};

_AuthResponse _$AuthResponseFromJson(Map<String, dynamic> json) =>
    _AuthResponse(
      accessToken: json['accessToken'] as String,
      expiresIn: (json['expiresIn'] as num).toInt(),
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      refreshToken: json['refreshToken'] as String?,
    );

Map<String, dynamic> _$AuthResponseToJson(_AuthResponse instance) =>
    <String, dynamic>{
      'accessToken': instance.accessToken,
      'expiresIn': instance.expiresIn,
      'user': instance.user.toJson(),
      'refreshToken': ?instance.refreshToken,
    };
