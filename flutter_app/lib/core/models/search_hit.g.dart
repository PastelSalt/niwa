// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'search_hit.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_SearchHit _$SearchHitFromJson(Map<String, dynamic> json) => _SearchHit(
  item: ItemSummary.fromJson(json['item'] as Map<String, dynamic>),
  snippet: json['snippet'] as String?,
  matchedIn: $enumDecode(
    _$SearchMatchEnumMap,
    json['matchedIn'],
    unknownValue: SearchMatch.unknown,
  ),
  score: (json['score'] as num).toDouble(),
);

Map<String, dynamic> _$SearchHitToJson(_SearchHit instance) =>
    <String, dynamic>{
      'item': instance.item.toJson(),
      'snippet': instance.snippet,
      'matchedIn': _$SearchMatchEnumMap[instance.matchedIn]!,
      'score': instance.score,
    };

const _$SearchMatchEnumMap = {
  SearchMatch.title: 'title',
  SearchMatch.tags: 'tags',
  SearchMatch.content: 'content',
  SearchMatch.unknown: 'unknown',
};
