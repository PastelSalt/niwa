import 'package:niwa/core/api/api_client.dart';
import 'package:niwa/core/api/change.dart';
import 'package:niwa/core/api/json.dart';
import 'package:niwa/core/models/models.dart';

/// Partial update for `PATCH /items/:id` (contract `UpdateItemInput`).
/// `version` is required for optimistic concurrency; a stale one fails with
/// `ErrorCode.versionConflict` (409).
class ItemChanges {
  const new({
    required this.version,
    this.title,
    this.type,
    this.status,
    this.priority,
    this.tags,
    this.content,
    this.dueAt,
    this.estimatedMinutes,
    this.reviewAt,
    this.sourceUrl,
  });

  final int version;
  final String? title;
  final ItemType? type;
  final ItemStatus? status;
  final ItemPriority? priority;
  final List<String>? tags;
  final Change<Map<String, dynamic>?>? content;
  final Change<String?>? dueAt;
  final Change<int?>? estimatedMinutes;
  final Change<String?>? reviewAt;
  final Change<String?>? sourceUrl;

  Json toJson() =>
      <String, Object?>{
          'version': version,
          'title': ?title,
          'type': ?type?.wire,
          'status': ?status?.wire,
          'priority': ?priority?.wire,
          'tags': ?tags,
        }
        ..putChange('content', content)
        ..putChange('dueAt', dueAt)
        ..putChange('estimatedMinutes', estimatedMinutes)
        ..putChange('reviewAt', reviewAt)
        ..putChange('sourceUrl', sourceUrl);
}

/// Items, tree, Trash, Focus and Review — mirrors `api.items` in
/// `@niwa/api-client`.
class ItemsRepository {
  const new(this._api);

  final ApiClient _api;

  /// The whole filed tree (no deleted or inboxed items).
  Future<List<ItemSummary>> tree({bool includeArchived = false}) => _api
      .request(
        'GET',
        '/tree',
        query: {'includeArchived': includeArchived ? true : null},
      )
      .list('items', ItemSummary.fromJson);

  /// `parentId: 'root'` lists top-level items.
  Future<List<ItemSummary>> list({
    String? parentId,
    ItemNature? nature,
    ItemType? type,
    ItemStatus? status,
    String? tag,
    bool includeArchived = false,
  }) => _api
      .request(
        'GET',
        '/items',
        query: {
          'parentId': parentId,
          'nature': nature?.wire,
          'type': type?.wire,
          'status': status?.wire,
          'tag': tag,
          'includeArchived': includeArchived ? true : null,
        },
      )
      .list('items', ItemSummary.fromJson);

  Future<Item> get(String id) =>
      _api.request('GET', '/items/$id').field('item', Item.fromJson);

  Future<List<ItemSummary>> ancestors(String id) => _api
      .request('GET', '/items/$id/ancestors')
      .list('items', ItemSummary.fromJson);

  /// [afterId] inserts after that sibling; omitted appends.
  Future<Item> create({
    required String? parentId,
    required String title,
    ItemType type = ItemType.note,
    Map<String, dynamic>? content,
    ItemStatus? status,
    ItemPriority? priority,
    List<String>? tags,
    String? dueAt,
    int? estimatedMinutes,
    String? reviewAt,
    String? sourceUrl,
    String? afterId,
  }) => _api
      .request(
        'POST',
        '/items',
        body: {
          'parentId': parentId,
          'title': title,
          'type': type.wire,
          'content': ?content,
          'status': ?status?.wire,
          'priority': ?priority?.wire,
          'tags': ?tags,
          'dueAt': ?dueAt,
          'estimatedMinutes': ?estimatedMinutes,
          'reviewAt': ?reviewAt,
          'sourceUrl': ?sourceUrl,
          'afterId': ?afterId,
        },
      )
      .field('item', Item.fromJson);

  Future<Item> update(String id, ItemChanges changes) => _api
      .request('PATCH', '/items/$id', body: changes.toJson())
      .field('item', Item.fromJson);

  /// Move/reorder; the server computes the new `orderKey` from neighbours.
  Future<Item> move(
    String id, {
    required int version,
    required String? parentId,
    String? beforeId,
    String? afterId,
  }) => _api
      .request(
        'POST',
        '/items/$id/move',
        body: {
          'version': version,
          'parentId': parentId,
          'beforeId': ?beforeId,
          'afterId': ?afterId,
        },
      )
      .field('item', Item.fromJson);

  Future<Item> archive(String id, {required int version}) => _api
      .request('POST', '/items/$id/archive', body: {'version': version})
      .field('item', Item.fromJson);

  Future<Item> unarchive(String id, {required int version}) => _api
      .request('POST', '/items/$id/unarchive', body: {'version': version})
      .field('item', Item.fromJson);

  /// Moves the item and its descendants to Trash.
  Future<DeleteResponse> remove(String id) =>
      _api.request('DELETE', '/items/$id').decode(DeleteResponse.fromJson);

  Future<RestoreResponse> restore(String id) => _api
      .request('POST', '/items/$id/restore')
      .decode(RestoreResponse.fromJson);

  /// Permanent delete from Trash.
  Future<DeleteResponse> purge(String id) => _api
      .request('DELETE', '/items/$id/permanent')
      .decode(DeleteResponse.fromJson);

  Future<List<ItemSummary>> trash() =>
      _api.request('GET', '/trash').list('items', ItemSummary.fromJson);

  /// [today] is the user's local calendar day (`YYYY-MM-DD`).
  Future<FocusResponse> focus(String today, {int? upcomingDays}) => _api
      .request(
        'GET',
        '/focus',
        query: {'today': today, 'upcomingDays': upcomingDays},
      )
      .decode(FocusResponse.fromJson);

  Future<List<ItemSummary>> review(String today) => _api
      .request('GET', '/review', query: {'today': today})
      .list('items', ItemSummary.fromJson);

  Future<ItemLinksResponse> links(String id) => _api
      .request('GET', '/items/$id/links')
      .decode(ItemLinksResponse.fromJson);

  /// Turns the section under heading [anchorId] into a child note.
  Future<PromoteSectionResponse> promoteSection(
    String id, {
    required int version,
    required String anchorId,
  }) => _api
      .request(
        'POST',
        '/items/$id/promote-section',
        body: {'version': version, 'anchorId': anchorId},
      )
      .decode(PromoteSectionResponse.fromJson);
}

/// Tags — mirrors `api.tags`.
class TagsRepository {
  const new(this._api);

  final ApiClient _api;

  Future<List<TagCount>> list() =>
      _api.request('GET', '/tags').list('tags', TagCount.fromJson);

  /// Returns how many items were updated.
  Future<int> rename({required String from, required String to}) => _api
      .request('POST', '/tags/rename', body: {'from': from, 'to': to})
      .then((body) => (body! as Map<String, dynamic>)['updated']! as int);
}
