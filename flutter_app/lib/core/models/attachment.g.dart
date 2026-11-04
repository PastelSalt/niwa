// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'attachment.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Attachment _$AttachmentFromJson(Map<String, dynamic> json) => _Attachment(
  id: json['id'] as String,
  itemId: json['itemId'] as String,
  cloudinaryPublicId: json['cloudinaryPublicId'] as String,
  secureUrl: json['secureUrl'] as String,
  mime: $enumDecode(
    _$AttachmentMimeEnumMap,
    json['mime'],
    unknownValue: AttachmentMime.unknown,
  ),
  size: (json['size'] as num).toInt(),
  createdAt: DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$AttachmentToJson(_Attachment instance) =>
    <String, dynamic>{
      'id': instance.id,
      'itemId': instance.itemId,
      'cloudinaryPublicId': instance.cloudinaryPublicId,
      'secureUrl': instance.secureUrl,
      'mime': _$AttachmentMimeEnumMap[instance.mime]!,
      'size': instance.size,
      'createdAt': instance.createdAt.toIso8601String(),
    };

const _$AttachmentMimeEnumMap = {
  AttachmentMime.png: 'image/png',
  AttachmentMime.jpeg: 'image/jpeg',
  AttachmentMime.webp: 'image/webp',
  AttachmentMime.gif: 'image/gif',
  AttachmentMime.unknown: 'unknown',
};

_UploadConfigResponse _$UploadConfigResponseFromJson(
  Map<String, dynamic> json,
) => _UploadConfigResponse(
  enabled: json['enabled'] as bool,
  maxBytes: (json['maxBytes'] as num).toInt(),
  allowedMime: (json['allowedMime'] as List<dynamic>)
      .map((e) => e as String)
      .toList(),
);

Map<String, dynamic> _$UploadConfigResponseToJson(
  _UploadConfigResponse instance,
) => <String, dynamic>{
  'enabled': instance.enabled,
  'maxBytes': instance.maxBytes,
  'allowedMime': instance.allowedMime,
};

_UploadSignatureResponse _$UploadSignatureResponseFromJson(
  Map<String, dynamic> json,
) => _UploadSignatureResponse(
  cloudName: json['cloudName'] as String,
  apiKey: json['apiKey'] as String,
  timestamp: (json['timestamp'] as num).toInt(),
  signature: json['signature'] as String,
  folder: json['folder'] as String,
  publicId: json['publicId'] as String,
  tags: json['tags'] as String,
  allowedFormats: json['allowedFormats'] as String,
  uploadUrl: json['uploadUrl'] as String,
);

Map<String, dynamic> _$UploadSignatureResponseToJson(
  _UploadSignatureResponse instance,
) => <String, dynamic>{
  'cloudName': instance.cloudName,
  'apiKey': instance.apiKey,
  'timestamp': instance.timestamp,
  'signature': instance.signature,
  'folder': instance.folder,
  'publicId': instance.publicId,
  'tags': instance.tags,
  'allowedFormats': instance.allowedFormats,
  'uploadUrl': instance.uploadUrl,
};
