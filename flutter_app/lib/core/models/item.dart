import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:niwa/core/models/enums.dart';

part 'item.freezed.dart';
part 'item.g.dart';

/// Contract `Item`. `dueAt` / `reviewAt` are calendar days (`YYYY-MM-DD`, no
/// timezone — specs §12.5), so they stay strings; instants are [DateTime].
/// `content` is ProseMirror JSON, kept as-is (specs §12.4).
@freezed
abstract class Item with _$Item {
  const factory({
    required String id,
    required String workspaceId,
    required String? parentId,
    required String title,
    required Map<String, dynamic>? content,
    @JsonKey(unknownEnumValue: ItemType.unknown) required ItemType type,
    @JsonKey(unknownEnumValue: ItemNature.unknown) required ItemNature nature,
    @JsonKey(unknownEnumValue: ItemStatus.unknown) required ItemStatus status,
    @JsonKey(unknownEnumValue: ItemPriority.unknown)
    required ItemPriority priority,
    required String orderKey,
    required List<String> tags,
    required String? dueAt,
    required int? estimatedMinutes,
    required String? reviewAt,
    required String? sourceUrl,
    required DateTime? inboxedAt,
    required String? suggestedParentId,
    required DateTime? archivedAt,
    required DateTime? deletedAt,
    required int version,
    required DateTime createdAt,
    required DateTime updatedAt,
    required DateTime? completedAt,
  }) = _Item;

  factory fromJson(Map<String, dynamic> json) => _$ItemFromJson(json);
}

/// Contract `ItemSummary`: [Item] without `content` (tree rows, Focus lists,
/// search hits).
@freezed
abstract class ItemSummary with _$ItemSummary {
  const factory({
    required String id,
    required String workspaceId,
    required String? parentId,
    required String title,
    @JsonKey(unknownEnumValue: ItemType.unknown) required ItemType type,
    @JsonKey(unknownEnumValue: ItemNature.unknown) required ItemNature nature,
    @JsonKey(unknownEnumValue: ItemStatus.unknown) required ItemStatus status,
    @JsonKey(unknownEnumValue: ItemPriority.unknown)
    required ItemPriority priority,
    required String orderKey,
    required List<String> tags,
    required String? dueAt,
    required int? estimatedMinutes,
    required String? reviewAt,
    required String? sourceUrl,
    required DateTime? inboxedAt,
    required String? suggestedParentId,
    required DateTime? archivedAt,
    required DateTime? deletedAt,
    required int version,
    required DateTime createdAt,
    required DateTime updatedAt,
    required DateTime? completedAt,
  }) = _ItemSummary;

  factory fromJson(Map<String, dynamic> json) => _$ItemSummaryFromJson(json);
}

/// Contract `FocusResponse`: the Actionable lens sections (specs §4.2).
@freezed
abstract class FocusResponse with _$FocusResponse {
  const factory({
    required List<ItemSummary> inProgress,
    required List<ItemSummary> highPriority,
    required List<ItemSummary> overdue,
    required List<ItemSummary> upcoming,
    required List<ItemSummary> recentlyUpdated,
  }) = _FocusResponse;

  factory fromJson(Map<String, dynamic> json) => _$FocusResponseFromJson(json);
}

/// Contract `RestoreResponse`. `restoredTo` is `inbox` when the original
/// parent no longer exists.
@freezed
abstract class RestoreResponse with _$RestoreResponse {
  const factory({
    required Item item,
    @JsonKey(unknownEnumValue: RestoreTarget.unknown)
    required RestoreTarget restoredTo,
    required int restoredCount,
  }) = _RestoreResponse;

  factory fromJson(Map<String, dynamic> json) =>
      _$RestoreResponseFromJson(json);
}

/// Contract `DeleteResponse`: `affected` counts the item and its descendants.
@freezed
abstract class DeleteResponse with _$DeleteResponse {
  const factory({required bool ok, required int affected}) = _DeleteResponse;

  factory fromJson(Map<String, dynamic> json) => _$DeleteResponseFromJson(json);
}

/// Contract `PromoteSectionResponse` (heading promotion, CONCEPT.md §4).
@freezed
abstract class PromoteSectionResponse with _$PromoteSectionResponse {
  const factory({required Item parent, required Item child}) =
      _PromoteSectionResponse;

  factory fromJson(Map<String, dynamic> json) =>
      _$PromoteSectionResponseFromJson(json);
}

/// Contract `TagCount`.
@freezed
abstract class TagCount with _$TagCount {
  const factory({required String tag, required int count}) = _TagCount;

  factory fromJson(Map<String, dynamic> json) => _$TagCountFromJson(json);
}
