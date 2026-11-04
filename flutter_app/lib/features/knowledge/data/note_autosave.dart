import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:niwa/core/api/api_exception.dart';
import 'package:niwa/core/api/change.dart';
import 'package:niwa/core/api/error_message.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/features/items/data/items_repository.dart';

enum SaveStatus { saved, dirty, saving, offline, error, conflict }

/// Debounced, version-checked autosave for a note body — port of the web
/// `useAutosave.ts`:
/// - always saves against the latest known version, so field edits elsewhere
///   don't conflict;
/// - a 409 whose server content equals what we last saved is a field-only
///   change → retried silently with the new version;
/// - a real content conflict pauses saving until the user keeps theirs or
///   loads the latest.
class NoteAutosave extends ChangeNotifier {
  new({
    required this.items,
    required Item item,
    required this.read,
    required this.onSaved,
    this.debounce = const Duration(milliseconds: 800),
  }) : _id = item.id,
       _version = item.version,
       _lastSaved = jsonEncode(read());

  final ItemsRepository items;

  /// The editor's current body as ProseMirror JSON.
  final Map<String, dynamic> Function() read;

  /// A save landed (refresh caches, links).
  final void Function(Item saved) onSaved;
  final Duration debounce;

  final String _id;
  int _version;
  String _lastSaved;
  Timer? _timer;
  Future<void>? _inFlight;
  bool _disposed = false;

  SaveStatus status = SaveStatus.saved;
  String? errorMessage;

  /// Set while paused on a content conflict: the server's version.
  Item? conflict;

  bool get hasUnsavedChanges => jsonEncode(read()) != _lastSaved;

  void _set(SaveStatus next, {String? error}) {
    if (_disposed) return;
    status = next;
    errorMessage = error;
    notifyListeners();
  }

  /// Someone else's save (fields, title) bumped the version.
  void observeVersion(int version) {
    if (version > _version) _version = version;
  }

  /// Call on every edit.
  void schedule() {
    if (conflict != null) return;
    _set(SaveStatus.dirty);
    _timer?.cancel();
    _timer = Timer(debounce, () => unawaited(flush()));
  }

  Future<void> flush() async {
    _timer?.cancel();
    if (conflict != null) return;
    if (_inFlight case final running?) {
      await running;
      return await flush();
    }
    final doc = read();
    final body = jsonEncode(doc);
    if (body == _lastSaved) {
      if (status != SaveStatus.saved) _set(SaveStatus.saved);
      return;
    }
    _set(SaveStatus.saving);
    var retry = false;
    final run = () async {
      try {
        final saved = await items.update(
          _id,
          ItemChanges(version: _version, content: Change(doc)),
        );
        _accept(saved);
        _set(jsonEncode(read()) == body ? SaveStatus.saved : SaveStatus.dirty);
      } on ApiException catch (e) {
        final current = _currentFrom(e);
        if (e.code == ErrorCode.versionConflict && current != null) {
          if (jsonEncode(current.content) == _lastSaved) {
            _version = current.version; // fields changed elsewhere
            retry = true;
          } else {
            conflict = current;
            _set(SaveStatus.conflict);
          }
        } else {
          _set(SaveStatus.error, error: messageOf(e));
        }
      } on OfflineException catch (e) {
        _set(SaveStatus.offline, error: messageOf(e));
      }
    }();
    _inFlight = run;
    await run;
    _inFlight = null;
    if (retry) await flush();
  }

  Item? _currentFrom(ApiException e) {
    final details = e.details;
    if (details is! Map || details['current'] is! Map) return null;
    try {
      return Item.fromJson((details['current'] as Map).cast<String, dynamic>());
    } on Object {
      return null;
    }
  }

  void _accept(Item saved) {
    _version = saved.version;
    _lastSaved = jsonEncode(saved.content);
    onSaved(saved);
  }

  /// Conflict: overwrite the server with this phone's text.
  Future<void> keepMine() async {
    final c = conflict;
    if (c == null) return;
    _version = c.version;
    _lastSaved = jsonEncode(c.content);
    conflict = null;
    await flush();
  }

  /// Conflict: drop local edits; the caller shows [Item.content].
  Item? loadLatest() {
    final c = conflict;
    if (c == null) return null;
    conflict = null;
    _accept(c);
    _set(SaveStatus.saved);
    return c;
  }

  /// Body replaced from the server (e.g. after promoting a section).
  void replacedWith(Item saved) {
    _accept(saved);
    _set(SaveStatus.saved);
  }

  @override
  void dispose() {
    _disposed = true;
    _timer?.cancel();
    super.dispose();
  }
}
