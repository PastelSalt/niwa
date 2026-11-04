import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show StreamProviderFamily;
import 'package:niwa/core/api/api_exception.dart';
import 'package:niwa/core/api/error_message.dart';
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/db/cached.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/net/network_status.dart';
import 'package:niwa/core/ui/snackbars.dart';
import 'package:niwa/core/util/date_only.dart';
import 'package:niwa/features/inbox/data/inbox_providers.dart';
import 'package:niwa/features/items/data/items_repository.dart';
import 'package:niwa/features/items/domain/tree_model.dart';

List<T> _decodeList<T>(Object? json, T Function(Map<String, dynamic>) f) => [
  for (final e in json! as List<Object?>) f(e! as Map<String, dynamic>),
];

/// The whole filed tree, as a [TreeModel]. Cached on the device.
final treeProvider = StreamProvider<TreeModel>(
  (ref) => cachedThenFresh(
    ref,
    key: 'tree',
    fetch: () => ref.watch(itemsRepositoryProvider).tree(),
    decode: (j) => _decodeList(j, ItemSummary.fromJson),
    encode: (items) => [for (final i in items) i.toJson()],
  ).map(buildTree),
);

/// One item with its content. Cached on the device.
final StreamProviderFamily<Item, String> itemProvider = StreamProvider.family(
  (ref, id) => cachedThenFresh(
    ref,
    key: 'item:$id',
    fetch: () => ref.watch(itemsRepositoryProvider).get(id),
    decode: (j) => Item.fromJson(j! as Map<String, dynamic>),
    encode: (item) => item.toJson(),
  ),
);

/// The tree row for [item] (same fields minus `content`).
ItemSummary summaryOf(Item item) =>
    ItemSummary.fromJson(item.toJson()..remove('content'));

/// Actionable Focus sections for the user's local today.
final focusProvider = StreamProvider<FocusResponse>((ref) {
  final today = dateOnly(DateTime.now());
  return cachedThenFresh(
    ref,
    key: 'focus:$today',
    fetch: () => ref.watch(itemsRepositoryProvider).focus(today),
    decode: (j) => FocusResponse.fromJson(j! as Map<String, dynamic>),
    encode: (f) => f.toJson(),
  );
});

/// Tag suggestions for the field sheet.
final tagsProvider = StreamProvider<List<TagCount>>(
  (ref) => cachedThenFresh(
    ref,
    key: 'tags',
    fetch: () => ref.watch(tagsRepositoryProvider).list(),
    decode: (j) => _decodeList(j, TagCount.fromJson),
    encode: (tags) => [for (final t in tags) t.toJson()],
  ),
);

/// Item commands shared by every screen (port of `useItemActions`): each
/// refreshes the views that show items and reports failures in a snackbar.
/// Methods return whether they succeeded, so callers can close sheets or
/// roll back optimistic state.
class ItemActions {
  const new(this._ref);

  final Ref _ref;

  ItemsRepository get _items => _ref.read(itemsRepositoryProvider);
  Snackbars get _snackbars => _ref.read(snackbarsProvider);

  /// Edits need the server (offline editing is a later phase); capture is
  /// the one write that works offline.
  bool _offline() {
    if (_ref.read(networkStatusProvider)) return false;
    _snackbars.show(
      "You're offline — changes need a connection. Capture still works.",
    );
    return true;
  }

  void _refresh([String? itemId]) {
    _ref
      ..invalidate(treeProvider)
      ..invalidate(focusProvider)
      ..invalidate(inboxItemsProvider);
    if (itemId != null) _ref.invalidate(itemProvider(itemId));
  }

  void _fail(Object error, [String? itemId]) {
    if (error is ApiException && error.code == ErrorCode.versionConflict) {
      // Someone (another device, the web) saved first: show their version.
      _refresh(itemId);
      _snackbars.show('This item changed elsewhere — showing the latest.');
      return;
    }
    _snackbars.show(messageOf(error));
  }

  Future<Item?> create({
    required String? parentId,
    required String title,
    required ItemType type,
    String? afterId,
  }) async {
    if (_offline()) return null;
    try {
      final item = await _items.create(
        parentId: parentId,
        title: title,
        type: type,
        afterId: afterId,
      );
      _refresh(parentId);
      return item;
    } on Object catch (e) {
      _fail(e);
      return null;
    }
  }

  Future<Item?> update(String id, ItemChanges changes) async {
    if (_offline()) return null;
    try {
      final item = await _items.update(id, changes);
      _refresh(id);
      return item;
    } on Object catch (e) {
      _fail(e, id);
      return null;
    }
  }

  Future<bool> move(MoveRequest? m) async {
    if (m == null || _offline()) return false;
    try {
      await _items.move(
        m.id,
        version: m.version,
        parentId: m.parentId,
        beforeId: m.beforeId,
        afterId: m.afterId,
      );
      _refresh(m.id);
      return true;
    } on Object catch (e) {
      _fail(e, m.id);
      _refresh(m.id);
      return false;
    }
  }

  Future<bool> setArchived(ItemSummary item, {required bool archived}) async {
    if (_offline()) return false;
    try {
      final updated = archived
          ? await _items.archive(item.id, version: item.version)
          : await _items.unarchive(item.id, version: item.version);
      _refresh(item.id);
      _snackbars.show(
        archived ? 'Archived “${item.title}”' : 'Unarchived “${item.title}”',
        onUndo: archived
            ? () => _undo(
                () => _items.unarchive(item.id, version: updated.version),
                item.id,
              )
            : null,
      );
      return true;
    } on Object catch (e) {
      _fail(e, item.id);
      return false;
    }
  }

  /// Moves [item] and its descendants to Trash, with Undo. Callers confirm
  /// first when there are children.
  Future<bool> remove(ItemSummary item) async {
    if (_offline()) return false;
    try {
      final res = await _items.remove(item.id);
      _refresh(item.id);
      _snackbars.show(
        res.affected > 1
            ? 'Moved ${res.affected} items to Trash'
            : 'Moved “${item.title}” to Trash',
        onUndo: () => _restore(item.id),
      );
      return true;
    } on Object catch (e) {
      _fail(e, item.id);
      return false;
    }
  }

  /// Moves several items to Trash with one Undo (Inbox bulk delete).
  Future<bool> removeMany(List<ItemSummary> items) async {
    if (items.length == 1) return await remove(items.single);
    if (_offline()) return false;
    final done = <String>[];
    try {
      for (final i in items) {
        await _items.remove(i.id);
        done.add(i.id);
      }
      return true;
    } on Object catch (e) {
      _fail(e);
      return false;
    } finally {
      _refresh();
      if (done.isNotEmpty) {
        _snackbars.show(
          'Moved ${done.length} items to Trash',
          onUndo: () async {
            for (final id in done) {
              await _restore(id);
            }
          },
        );
      }
    }
  }

  Future<void> _restore(String id) async {
    try {
      final res = await _items.restore(id);
      _refresh(id);
      _ref.invalidate(inboxItemsProvider);
      if (res.restoredTo == RestoreTarget.inbox) {
        // DATA_MODEL.md §5: the original parent is gone.
        _snackbars.show('Restored to Inbox — its folder no longer exists.');
      }
    } on Object catch (e) {
      _fail(e, id);
    }
  }

  Future<void> _undo(Future<Object?> Function() action, String id) async {
    try {
      await action();
      _refresh(id);
    } on Object catch (e) {
      _fail(e, id);
    }
  }
}

final itemActionsProvider = Provider<ItemActions>(ItemActions.new);
