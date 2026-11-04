import 'package:niwa/core/api/api_client.dart';
import 'package:niwa/core/api/json.dart';
import 'package:niwa/core/models/models.dart';

/// The signed-in user's workspace — mirrors `api.workspace`.
class WorkspaceRepository {
  const new(this._api);

  final ApiClient _api;

  Future<Workspace> get() =>
      _api.request('GET', '/workspace').field('workspace', Workspace.fromJson);
}
