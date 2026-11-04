import 'package:niwa/core/api/api_client.dart';

/// Decoding helpers for repository responses, chained onto
/// `ApiClient.request`: `.decode(Item.fromJson)`, `.field('item', …)`,
/// `.list('items', …)`.
extension JsonResponse on Future<Object?> {
  /// The whole body as one model.
  Future<T> decode<T>(T Function(Json) fromJson) =>
      then((body) => fromJson(body! as Json));

  /// One wrapped model, e.g. `{ "item": {...} }`.
  Future<T> field<T>(String key, T Function(Json) fromJson) =>
      then((body) => fromJson((body! as Json)[key]! as Json));

  /// A wrapped list, e.g. `{ "items": [...] }`.
  Future<List<T>> list<T>(String key, T Function(Json) fromJson) => then(
    (body) => [
      for (final e in (body! as Json)[key]! as List<Object?>)
        fromJson(e! as Json),
    ],
  );
}
