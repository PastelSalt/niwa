import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:niwa/core/models/enums.dart';

part 'schedule_entry.freezed.dart';
part 'schedule_entry.g.dart';

/// Contract `ScheduleEntry` (docs/SCHEDULER.md). Recurring entries are
/// materialised occurrences sharing a `seriesId`; there is no separate series
/// resource on the wire. `title` is empty for blocks that show the item title.
@freezed
abstract class ScheduleEntry with _$ScheduleEntry {
  const factory({
    required String id,
    @JsonKey(unknownEnumValue: ScheduleKind.unknown) required ScheduleKind kind,
    required String? itemId,
    required String title,
    required DateTime startAt,
    required DateTime endAt,
    required bool isAllDay,
    required String? color,
    @JsonKey(unknownEnumValue: Recurrence.unknown)
    required Recurrence recurrence,
    required String? seriesId,
    required int? seriesIndex,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _ScheduleEntry;

  factory fromJson(Map<String, dynamic> json) => _$ScheduleEntryFromJson(json);
}
