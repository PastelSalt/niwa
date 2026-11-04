// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'api_error.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ApiError _$ApiErrorFromJson(Map<String, dynamic> json) => _ApiError(
  code: $enumDecode(
    _$ErrorCodeEnumMap,
    json['code'],
    unknownValue: ErrorCode.unknown,
  ),
  message: json['message'] as String,
  details: json['details'],
  requestId: json['requestId'] as String?,
);

Map<String, dynamic> _$ApiErrorToJson(_ApiError instance) => <String, dynamic>{
  'code': _$ErrorCodeEnumMap[instance.code]!,
  'message': instance.message,
  'details': ?instance.details,
  'requestId': ?instance.requestId,
};

const _$ErrorCodeEnumMap = {
  ErrorCode.validationError: 'VALIDATION_ERROR',
  ErrorCode.unauthorized: 'UNAUTHORIZED',
  ErrorCode.forbidden: 'FORBIDDEN',
  ErrorCode.notFound: 'NOT_FOUND',
  ErrorCode.conflict: 'CONFLICT',
  ErrorCode.versionConflict: 'VERSION_CONFLICT',
  ErrorCode.rateLimited: 'RATE_LIMITED',
  ErrorCode.registrationClosed: 'REGISTRATION_CLOSED',
  ErrorCode.invalidCredentials: 'INVALID_CREDENTIALS',
  ErrorCode.aiKeyMissing: 'AI_KEY_MISSING',
  ErrorCode.aiKeyInvalid: 'AI_KEY_INVALID',
  ErrorCode.aiDisabled: 'AI_DISABLED',
  ErrorCode.upstreamError: 'UPSTREAM_ERROR',
  ErrorCode.notConfigured: 'NOT_CONFIGURED',
  ErrorCode.internalError: 'INTERNAL_ERROR',
  ErrorCode.unknown: 'UNKNOWN',
};

_ErrorEnvelope _$ErrorEnvelopeFromJson(Map<String, dynamic> json) =>
    _ErrorEnvelope(
      error: ApiError.fromJson(json['error'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$ErrorEnvelopeToJson(_ErrorEnvelope instance) =>
    <String, dynamic>{'error': instance.error.toJson()};
