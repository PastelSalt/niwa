import 'package:niwa/core/api/api_client.dart';
import 'package:niwa/core/api/json.dart';
import 'package:niwa/core/models/models.dart';

/// Manual "related item" links — mirrors `api.links`. Content links are
/// synced by the server when a note is saved.
class LinksRepository {
  const new(this._api);

  final ApiClient _api;

  Future<Link> create({
    required String sourceId,
    required String targetId,
    String? targetAnchorId,
    String? label,
  }) => _api
      .request(
        'POST',
        '/links',
        body: {
          'sourceId': sourceId,
          'targetId': targetId,
          'targetAnchorId': ?targetAnchorId,
          'label': ?label,
        },
      )
      .field('link', Link.fromJson);

  Future<void> remove(String id) => _api.request('DELETE', '/links/$id');
}
