import 'package:niwa/core/api/api_client.dart';
import 'package:niwa/core/api/change.dart';
import 'package:niwa/core/api/json.dart';
import 'package:niwa/core/models/models.dart';

/// "This instance" or "this and future" — never silently "all"
/// (docs/SCHEDULER.md).
enum EditScope { instance, future }

String _instant(DateTime t) => t.toUtc().toIso8601String();

/// Scheduler entries — mirrors `api.schedule`.
///
/// `timeZone` is the IANA zone recurring entries step through in wall-clock
/// time (e.g. `Asia/Manila`); MA7 reads it from the device.
class ScheduleRepository {
  const new(this._api);

  final ApiClient _api;

  /// Entries overlapping [from]–[to] (at most 62 days).
  Future<List<ScheduleEntry>> range(DateTime from, DateTime to) => _api
      .request(
        'GET',
        '/schedule',
        query: {'from': _instant(from), 'to': _instant(to)},
      )
      .list('entries', ScheduleEntry.fromJson);

  Future<List<ScheduleEntry>> forItem(String itemId) => _api
      .request('GET', '/items/$itemId/schedule')
      .list('entries', ScheduleEntry.fromJson);

  /// A `block` needs [itemId]; an `event` needs [title] and no item.
  Future<ScheduleEntry> create({
    required ScheduleKind kind,
    required DateTime startAt,
    required DateTime endAt,
    String? itemId,
    String? title,
    bool isAllDay = false,
    String? color,
    Recurrence recurrence = Recurrence.none,
    String timeZone = 'UTC',
  }) => _api
      .request(
        'POST',
        '/schedule',
        body: {
          'kind': kind.wire,
          'itemId': ?itemId,
          'title': ?title,
          'startAt': _instant(startAt),
          'endAt': _instant(endAt),
          'isAllDay': isAllDay,
          'color': ?color,
          'recurrence': recurrence.wire,
          'timeZone': timeZone,
        },
      )
      .field('entry', ScheduleEntry.fromJson);

  Future<ScheduleEntry> update(
    String id, {
    EditScope scope = EditScope.instance,
    String? title,
    DateTime? startAt,
    DateTime? endAt,
    bool? isAllDay,
    Change<String?>? color,
    Recurrence? recurrence,
    String? timeZone,
  }) => _api
      .request(
        'PATCH',
        '/schedule/$id',
        query: {'scope': scope.name},
        body: <String, Object?>{
          'title': ?title,
          'startAt': ?startAt == null ? null : _instant(startAt),
          'endAt': ?endAt == null ? null : _instant(endAt),
          'isAllDay': ?isAllDay,
          'recurrence': ?recurrence?.wire,
          'timeZone': ?timeZone,
        }..putChange('color', color),
      )
      .field('entry', ScheduleEntry.fromJson);

  Future<void> remove(String id, {EditScope scope = EditScope.instance}) =>
      _api.request('DELETE', '/schedule/$id', query: {'scope': scope.name});
}
