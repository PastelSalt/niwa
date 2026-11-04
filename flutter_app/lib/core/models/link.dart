import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:niwa/core/models/enums.dart';
import 'package:niwa/core/models/item.dart';

part 'link.freezed.dart';
part 'link.g.dart';

/// Contract `Link`. `targetSection` is the heading text of `targetAnchorId`,
/// or null when there is no anchor or the section is gone.
@freezed
abstract class Link with _$Link {
  const factory({
    required String id,
    required String sourceId,
    required String targetId,
    required String? targetAnchorId,
    required String? label,
    @JsonKey(unknownEnumValue: LinkOrigin.unknown) required LinkOrigin origin,
    required String? targetSection,
    required DateTime createdAt,
  }) = _Link;

  factory fromJson(Map<String, dynamic> json) => _$LinkFromJson(json);
}

/// Contract `LinkWithItem`: `item` is the other end of the link.
@freezed
abstract class LinkWithItem with _$LinkWithItem {
  const factory({required Link link, required ItemSummary item}) =
      _LinkWithItem;

  factory fromJson(Map<String, dynamic> json) => _$LinkWithItemFromJson(json);
}

/// Contract `ItemLinksResponse`.
@freezed
abstract class ItemLinksResponse with _$ItemLinksResponse {
  const factory({
    required List<LinkWithItem> outgoing,
    required List<LinkWithItem> backlinks,
  }) = _ItemLinksResponse;

  factory fromJson(Map<String, dynamic> json) =>
      _$ItemLinksResponseFromJson(json);
}
