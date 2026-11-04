import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:niwa/core/models/enums.dart';
import 'package:niwa/core/models/item.dart';

part 'search_hit.freezed.dart';
part 'search_hit.g.dart';

/// Contract `SearchHit`. `snippet` is up to ~160 chars of the body around the
/// first match.
@freezed
abstract class SearchHit with _$SearchHit {
  const factory({
    required ItemSummary item,
    required String? snippet,
    @JsonKey(unknownEnumValue: SearchMatch.unknown)
    required SearchMatch matchedIn,
    required double score,
  }) = _SearchHit;

  factory fromJson(Map<String, dynamic> json) => _$SearchHitFromJson(json);
}
