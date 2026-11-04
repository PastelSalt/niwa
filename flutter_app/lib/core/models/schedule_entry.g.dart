// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'schedule_entry.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ScheduleEntry _$ScheduleEntryFromJson(Map<String, dynamic> json) =>
    _ScheduleEntry(
      id: json['id'] as String,
      kind: $enumDecode(
        _$ScheduleKindEnumMap,
        json['kind'],
        unknownValue: ScheduleKind.unknown,
      ),
      itemId: json['itemId'] as String?,
      title: json['title'] as String,
      startAt: DateTime.parse(json['startAt'] as String),
      endAt: DateTime.parse(json['endAt'] as String),
      isAllDay: json['isAllDay'] as bool,
      color: json['color'] as String?,
      recurrence: $enumDecode(
        _$RecurrenceEnumMap,
        json['recurrence'],
        unknownValue: Recurrence.unknown,
      ),
      seriesId: json['seriesId'] as String?,
      seriesIndex: (json['seriesIndex'] as num?)?.toInt(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$ScheduleEntryToJson(_ScheduleEntry instance) =>
    <String, dynamic>{
      'id': instance.id,
      'kind': _$ScheduleKindEnumMap[instance.kind]!,
      'itemId': instance.itemId,
      'title': instance.title,
      'startAt': instance.startAt.toIso8601String(),
      'endAt': instance.endAt.toIso8601String(),
      'isAllDay': instance.isAllDay,
      'color': instance.color,
      'recurrence': _$RecurrenceEnumMap[instance.recurrence]!,
      'seriesId': instance.seriesId,
      'seriesIndex': instance.seriesIndex,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

const _$ScheduleKindEnumMap = {
  ScheduleKind.event: 'event',
  ScheduleKind.block: 'block',
  ScheduleKind.unknown: 'unknown',
};

const _$RecurrenceEnumMap = {
  Recurrence.none: 'none',
  Recurrence.daily: 'daily',
  Recurrence.weekly: 'weekly',
  Recurrence.monthly: 'monthly',
  Recurrence.unknown: 'unknown',
};
