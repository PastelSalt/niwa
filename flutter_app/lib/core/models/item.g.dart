// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'item.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Item _$ItemFromJson(Map<String, dynamic> json) => _Item(
  id: json['id'] as String,
  workspaceId: json['workspaceId'] as String,
  parentId: json['parentId'] as String?,
  title: json['title'] as String,
  content: json['content'] as Map<String, dynamic>?,
  type: $enumDecode(
    _$ItemTypeEnumMap,
    json['type'],
    unknownValue: ItemType.unknown,
  ),
  nature: $enumDecode(
    _$ItemNatureEnumMap,
    json['nature'],
    unknownValue: ItemNature.unknown,
  ),
  status: $enumDecode(
    _$ItemStatusEnumMap,
    json['status'],
    unknownValue: ItemStatus.unknown,
  ),
  priority: $enumDecode(
    _$ItemPriorityEnumMap,
    json['priority'],
    unknownValue: ItemPriority.unknown,
  ),
  orderKey: json['orderKey'] as String,
  tags: (json['tags'] as List<dynamic>).map((e) => e as String).toList(),
  dueAt: json['dueAt'] as String?,
  estimatedMinutes: (json['estimatedMinutes'] as num?)?.toInt(),
  reviewAt: json['reviewAt'] as String?,
  sourceUrl: json['sourceUrl'] as String?,
  inboxedAt: json['inboxedAt'] == null
      ? null
      : DateTime.parse(json['inboxedAt'] as String),
  suggestedParentId: json['suggestedParentId'] as String?,
  archivedAt: json['archivedAt'] == null
      ? null
      : DateTime.parse(json['archivedAt'] as String),
  deletedAt: json['deletedAt'] == null
      ? null
      : DateTime.parse(json['deletedAt'] as String),
  version: (json['version'] as num).toInt(),
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
  completedAt: json['completedAt'] == null
      ? null
      : DateTime.parse(json['completedAt'] as String),
);

Map<String, dynamic> _$ItemToJson(_Item instance) => <String, dynamic>{
  'id': instance.id,
  'workspaceId': instance.workspaceId,
  'parentId': instance.parentId,
  'title': instance.title,
  'content': instance.content,
  'type': _$ItemTypeEnumMap[instance.type]!,
  'nature': _$ItemNatureEnumMap[instance.nature]!,
  'status': _$ItemStatusEnumMap[instance.status]!,
  'priority': _$ItemPriorityEnumMap[instance.priority]!,
  'orderKey': instance.orderKey,
  'tags': instance.tags,
  'dueAt': instance.dueAt,
  'estimatedMinutes': instance.estimatedMinutes,
  'reviewAt': instance.reviewAt,
  'sourceUrl': instance.sourceUrl,
  'inboxedAt': instance.inboxedAt?.toIso8601String(),
  'suggestedParentId': instance.suggestedParentId,
  'archivedAt': instance.archivedAt?.toIso8601String(),
  'deletedAt': instance.deletedAt?.toIso8601String(),
  'version': instance.version,
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt.toIso8601String(),
  'completedAt': instance.completedAt?.toIso8601String(),
};

const _$ItemTypeEnumMap = {
  ItemType.project: 'project',
  ItemType.task: 'task',
  ItemType.note: 'note',
  ItemType.idea: 'idea',
  ItemType.unknown: 'unknown',
};

const _$ItemNatureEnumMap = {
  ItemNature.knowledge: 'knowledge',
  ItemNature.actionable: 'actionable',
  ItemNature.unknown: 'unknown',
};

const _$ItemStatusEnumMap = {
  ItemStatus.notStarted: 'not_started',
  ItemStatus.inProgress: 'in_progress',
  ItemStatus.blocked: 'blocked',
  ItemStatus.completed: 'completed',
  ItemStatus.unknown: 'unknown',
};

const _$ItemPriorityEnumMap = {
  ItemPriority.none: 'none',
  ItemPriority.low: 'low',
  ItemPriority.medium: 'medium',
  ItemPriority.high: 'high',
  ItemPriority.critical: 'critical',
  ItemPriority.unknown: 'unknown',
};

_ItemSummary _$ItemSummaryFromJson(Map<String, dynamic> json) => _ItemSummary(
  id: json['id'] as String,
  workspaceId: json['workspaceId'] as String,
  parentId: json['parentId'] as String?,
  title: json['title'] as String,
  type: $enumDecode(
    _$ItemTypeEnumMap,
    json['type'],
    unknownValue: ItemType.unknown,
  ),
  nature: $enumDecode(
    _$ItemNatureEnumMap,
    json['nature'],
    unknownValue: ItemNature.unknown,
  ),
  status: $enumDecode(
    _$ItemStatusEnumMap,
    json['status'],
    unknownValue: ItemStatus.unknown,
  ),
  priority: $enumDecode(
    _$ItemPriorityEnumMap,
    json['priority'],
    unknownValue: ItemPriority.unknown,
  ),
  orderKey: json['orderKey'] as String,
  tags: (json['tags'] as List<dynamic>).map((e) => e as String).toList(),
  dueAt: json['dueAt'] as String?,
  estimatedMinutes: (json['estimatedMinutes'] as num?)?.toInt(),
  reviewAt: json['reviewAt'] as String?,
  sourceUrl: json['sourceUrl'] as String?,
  inboxedAt: json['inboxedAt'] == null
      ? null
      : DateTime.parse(json['inboxedAt'] as String),
  suggestedParentId: json['suggestedParentId'] as String?,
  archivedAt: json['archivedAt'] == null
      ? null
      : DateTime.parse(json['archivedAt'] as String),
  deletedAt: json['deletedAt'] == null
      ? null
      : DateTime.parse(json['deletedAt'] as String),
  version: (json['version'] as num).toInt(),
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
  completedAt: json['completedAt'] == null
      ? null
      : DateTime.parse(json['completedAt'] as String),
);

Map<String, dynamic> _$ItemSummaryToJson(_ItemSummary instance) =>
    <String, dynamic>{
      'id': instance.id,
      'workspaceId': instance.workspaceId,
      'parentId': instance.parentId,
      'title': instance.title,
      'type': _$ItemTypeEnumMap[instance.type]!,
      'nature': _$ItemNatureEnumMap[instance.nature]!,
      'status': _$ItemStatusEnumMap[instance.status]!,
      'priority': _$ItemPriorityEnumMap[instance.priority]!,
      'orderKey': instance.orderKey,
      'tags': instance.tags,
      'dueAt': instance.dueAt,
      'estimatedMinutes': instance.estimatedMinutes,
      'reviewAt': instance.reviewAt,
      'sourceUrl': instance.sourceUrl,
      'inboxedAt': instance.inboxedAt?.toIso8601String(),
      'suggestedParentId': instance.suggestedParentId,
      'archivedAt': instance.archivedAt?.toIso8601String(),
      'deletedAt': instance.deletedAt?.toIso8601String(),
      'version': instance.version,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'completedAt': instance.completedAt?.toIso8601String(),
    };

_FocusResponse _$FocusResponseFromJson(Map<String, dynamic> json) =>
    _FocusResponse(
      inProgress: (json['inProgress'] as List<dynamic>)
          .map((e) => ItemSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
      highPriority: (json['highPriority'] as List<dynamic>)
          .map((e) => ItemSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
      overdue: (json['overdue'] as List<dynamic>)
          .map((e) => ItemSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
      upcoming: (json['upcoming'] as List<dynamic>)
          .map((e) => ItemSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
      recentlyUpdated: (json['recentlyUpdated'] as List<dynamic>)
          .map((e) => ItemSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$FocusResponseToJson(
  _FocusResponse instance,
) => <String, dynamic>{
  'inProgress': instance.inProgress.map((e) => e.toJson()).toList(),
  'highPriority': instance.highPriority.map((e) => e.toJson()).toList(),
  'overdue': instance.overdue.map((e) => e.toJson()).toList(),
  'upcoming': instance.upcoming.map((e) => e.toJson()).toList(),
  'recentlyUpdated': instance.recentlyUpdated.map((e) => e.toJson()).toList(),
};

_RestoreResponse _$RestoreResponseFromJson(Map<String, dynamic> json) =>
    _RestoreResponse(
      item: Item.fromJson(json['item'] as Map<String, dynamic>),
      restoredTo: $enumDecode(
        _$RestoreTargetEnumMap,
        json['restoredTo'],
        unknownValue: RestoreTarget.unknown,
      ),
      restoredCount: (json['restoredCount'] as num).toInt(),
    );

Map<String, dynamic> _$RestoreResponseToJson(_RestoreResponse instance) =>
    <String, dynamic>{
      'item': instance.item.toJson(),
      'restoredTo': _$RestoreTargetEnumMap[instance.restoredTo]!,
      'restoredCount': instance.restoredCount,
    };

const _$RestoreTargetEnumMap = {
  RestoreTarget.original: 'original',
  RestoreTarget.inbox: 'inbox',
  RestoreTarget.unknown: 'unknown',
};

_DeleteResponse _$DeleteResponseFromJson(Map<String, dynamic> json) =>
    _DeleteResponse(
      ok: json['ok'] as bool,
      affected: (json['affected'] as num).toInt(),
    );

Map<String, dynamic> _$DeleteResponseToJson(_DeleteResponse instance) =>
    <String, dynamic>{'ok': instance.ok, 'affected': instance.affected};

_PromoteSectionResponse _$PromoteSectionResponseFromJson(
  Map<String, dynamic> json,
) => _PromoteSectionResponse(
  parent: Item.fromJson(json['parent'] as Map<String, dynamic>),
  child: Item.fromJson(json['child'] as Map<String, dynamic>),
);

Map<String, dynamic> _$PromoteSectionResponseToJson(
  _PromoteSectionResponse instance,
) => <String, dynamic>{
  'parent': instance.parent.toJson(),
  'child': instance.child.toJson(),
};

_TagCount _$TagCountFromJson(Map<String, dynamic> json) => _TagCount(
  tag: json['tag'] as String,
  count: (json['count'] as num).toInt(),
);

Map<String, dynamic> _$TagCountToJson(_TagCount instance) => <String, dynamic>{
  'tag': instance.tag,
  'count': instance.count,
};
