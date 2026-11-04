import 'package:niwa/core/api/api_client.dart';
import 'package:niwa/core/api/json.dart';
import 'package:niwa/core/models/models.dart';

/// Full-text search — mirrors `api.search`.
class SearchRepository {
  const new(this._api);

  final ApiClient _api;

  Future<List<SearchHit>> search(
    String q, {
    ItemType? type,
    ItemNature? nature,
    ItemStatus? status,
    String? tag,
    bool includeArchived = false,
    int? limit,
  }) => _api
      .request(
        'GET',
        '/search',
        query: {
          'q': q,
          'type': type?.wire,
          'nature': nature?.wire,
          'status': status?.wire,
          'tag': tag,
          'includeArchived': includeArchived ? true : null,
          'limit': limit,
        },
      )
      .list('hits', SearchHit.fromJson);
}
