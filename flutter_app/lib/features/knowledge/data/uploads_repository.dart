import 'package:niwa/core/api/api_client.dart';
import 'package:niwa/core/api/json.dart';
import 'package:niwa/core/models/models.dart';

/// Signed Cloudinary uploads (DATA_MODEL.md §8) — mirrors `api.uploads`.
/// The upload itself goes straight to Cloudinary with the signature (MA9).
class UploadsRepository {
  const new(this._api);

  final ApiClient _api;

  Future<UploadConfigResponse> config() => _api
      .request('GET', '/uploads/config')
      .decode(UploadConfigResponse.fromJson);

  Future<UploadSignatureResponse> sign(String itemId) => _api
      .request('POST', '/uploads/sign', body: {'itemId': itemId})
      .decode(UploadSignatureResponse.fromJson);

  Future<Attachment> confirm({
    required String itemId,
    required String publicId,
  }) => _api
      .request(
        'POST',
        '/attachments',
        body: {'itemId': itemId, 'publicId': publicId},
      )
      .field('attachment', Attachment.fromJson);

  Future<void> remove(String id) => _api.request('DELETE', '/attachments/$id');
}
