import 'package:niwa/core/api/api_client.dart';
import 'package:niwa/core/api/json.dart';
import 'package:niwa/core/models/models.dart';

/// Inbox capture and filing (specs §12.8) — mirrors `api.inbox`.
class InboxRepository {
  const new(this._api);

  final ApiClient _api;

  Future<List<ItemSummary>> list() =>
      _api.request('GET', '/inbox').list('items', ItemSummary.fromJson);

  Future<Item> capture({
    required String title,
    ItemType type = ItemType.idea,
    Map<String, dynamic>? content,
    String? suggestedParentId,

    /// Idempotency key: a retry with the same id can't create a duplicate.
    String? clientId,
  }) => _api
      .request(
        'POST',
        '/inbox',
        body: {
          'title': title,
          'type': type.wire,
          'content': ?content,
          'suggestedParentId': ?suggestedParentId,
          'clientId': ?clientId,
        },
      )
      .field('item', Item.fromJson);

  /// Files an inbox item under [parentId].
  Future<Item> file(
    String id, {
    required int version,
    required String parentId,
    ItemType? type,
    String? dueAt,
    List<String>? tags,
  }) => _api
      .request(
        'POST',
        '/items/$id/file',
        body: {
          'version': version,
          'parentId': parentId,
          'type': ?type?.wire,
          'dueAt': ?dueAt,
          'tags': ?tags,
        },
      )
      .field('item', Item.fromJson);
}
