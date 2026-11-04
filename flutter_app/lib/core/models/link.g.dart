// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'link.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Link _$LinkFromJson(Map<String, dynamic> json) => _Link(
  id: json['id'] as String,
  sourceId: json['sourceId'] as String,
  targetId: json['targetId'] as String,
  targetAnchorId: json['targetAnchorId'] as String?,
  label: json['label'] as String?,
  origin: $enumDecode(
    _$LinkOriginEnumMap,
    json['origin'],
    unknownValue: LinkOrigin.unknown,
  ),
  targetSection: json['targetSection'] as String?,
  createdAt: DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$LinkToJson(_Link instance) => <String, dynamic>{
  'id': instance.id,
  'sourceId': instance.sourceId,
  'targetId': instance.targetId,
  'targetAnchorId': instance.targetAnchorId,
  'label': instance.label,
  'origin': _$LinkOriginEnumMap[instance.origin]!,
  'targetSection': instance.targetSection,
  'createdAt': instance.createdAt.toIso8601String(),
};

const _$LinkOriginEnumMap = {
  LinkOrigin.content: 'content',
  LinkOrigin.manual: 'manual',
  LinkOrigin.unknown: 'unknown',
};

_LinkWithItem _$LinkWithItemFromJson(Map<String, dynamic> json) =>
    _LinkWithItem(
      link: Link.fromJson(json['link'] as Map<String, dynamic>),
      item: ItemSummary.fromJson(json['item'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$LinkWithItemToJson(_LinkWithItem instance) =>
    <String, dynamic>{
      'link': instance.link.toJson(),
      'item': instance.item.toJson(),
    };

_ItemLinksResponse _$ItemLinksResponseFromJson(Map<String, dynamic> json) =>
    _ItemLinksResponse(
      outgoing: (json['outgoing'] as List<dynamic>)
          .map((e) => LinkWithItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      backlinks: (json['backlinks'] as List<dynamic>)
          .map((e) => LinkWithItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$ItemLinksResponseToJson(_ItemLinksResponse instance) =>
    <String, dynamic>{
      'outgoing': instance.outgoing.map((e) => e.toJson()).toList(),
      'backlinks': instance.backlinks.map((e) => e.toJson()).toList(),
    };
