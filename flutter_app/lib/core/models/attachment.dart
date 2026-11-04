import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:niwa/core/models/enums.dart';

part 'attachment.freezed.dart';
part 'attachment.g.dart';

/// Contract `Attachment` (Cloudinary image in a note, DATA_MODEL.md §8).
@freezed
abstract class Attachment with _$Attachment {
  const factory({
    required String id,
    required String itemId,
    required String cloudinaryPublicId,
    required String secureUrl,
    @JsonKey(unknownEnumValue: AttachmentMime.unknown)
    required AttachmentMime mime,
    required int size,
    required DateTime createdAt,
  }) = _Attachment;

  factory fromJson(Map<String, dynamic> json) => _$AttachmentFromJson(json);
}

/// Contract `UploadConfigResponse`: whether this server can take images.
@freezed
abstract class UploadConfigResponse with _$UploadConfigResponse {
  const factory({
    required bool enabled,
    required int maxBytes,
    required List<String> allowedMime,
  }) = _UploadConfigResponse;

  factory fromJson(Map<String, dynamic> json) =>
      _$UploadConfigResponseFromJson(json);
}

/// Contract `UploadSignatureResponse`. Every field is signed — send them to
/// Cloudinary exactly as given.
@freezed
abstract class UploadSignatureResponse with _$UploadSignatureResponse {
  const factory({
    required String cloudName,

    /// Public Cloudinary API key (not the secret).
    required String apiKey,
    required int timestamp,
    required String signature,
    required String folder,
    required String publicId,
    required String tags,
    required String allowedFormats,
    required String uploadUrl,
  }) = _UploadSignatureResponse;

  factory fromJson(Map<String, dynamic> json) =>
      _$UploadSignatureResponseFromJson(json);
}
