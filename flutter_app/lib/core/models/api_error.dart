import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:niwa/core/models/enums.dart';

part 'api_error.freezed.dart';
part 'api_error.g.dart';

/// The `error` object of the contract `ErrorEnvelope` (specs §11.2).
@freezed
abstract class ApiError with _$ApiError {
  const factory({
    @JsonKey(unknownEnumValue: ErrorCode.unknown) required ErrorCode code,
    required String message,
    @JsonKey(includeIfNull: false) Object? details,
    @JsonKey(includeIfNull: false) String? requestId,
  }) = _ApiError;

  factory fromJson(Map<String, dynamic> json) => _$ApiErrorFromJson(json);
}

/// Contract `ErrorEnvelope`: every non-2xx response has this shape.
@freezed
abstract class ErrorEnvelope with _$ErrorEnvelope {
  const factory({required ApiError error}) = _ErrorEnvelope;

  factory fromJson(Map<String, dynamic> json) => _$ErrorEnvelopeFromJson(json);
}
