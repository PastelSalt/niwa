import 'dart:async';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/auth/session.dart';
import 'package:niwa/core/db/db_providers.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/util/time_zone.dart';
import 'package:timezone/data/latest.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

/// Default lead time when turning a reminder on (owner decision, MA0.P2).
const defaultReminderMinutes = 10;

/// How far ahead notifications are scheduled; re-synced on every change and
/// when the app opens, so the window keeps moving.
const reminderWindow = Duration(days: 14);

/// A notification to show at [fireAt].
class PlannedReminder {
  const new({
    required this.id,
    required this.fireAt,
    required this.title,
    required this.body,
    required this.payload,
  });

  final int id;
  final DateTime fireAt;
  final String title;
  final String body;

  /// Route opened on tap.
  final String payload;
}

/// The OS notification side, swappable in tests.
abstract interface class NotificationGateway {
  /// Android 13+ / iOS permission; true when notifications may be shown.
  Future<bool> requestPermission();

  /// Replaces every scheduled reminder with [reminders].
  Future<void> replaceAll(List<PlannedReminder> reminders);
}

class LocalNotificationsGateway implements NotificationGateway {
  new(this._timeZone);

  final Future<String> Function() _timeZone;
  final _plugin = FlutterLocalNotificationsPlugin();
  bool _ready = false;

  Future<void> _init() async {
    if (_ready) return;
    tzdata.initializeTimeZones();
    try {
      tz.setLocalLocation(tz.getLocation(await _timeZone()));
    } on Object {
      tz.setLocalLocation(tz.UTC);
    }
    await _plugin.initialize(
      settings: const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(
          requestAlertPermission: false,
          requestBadgePermission: false,
          requestSoundPermission: false,
        ),
      ),
    );
    _ready = true;
  }

  @override
  Future<bool> requestPermission() async {
    await _init();
    final android = _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    if (android != null) {
      return await android.requestNotificationsPermission() ?? false;
    }
    final ios = _plugin
        .resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin
        >();
    return await ios?.requestPermissions(alert: true, sound: true) ?? false;
  }

  @override
  Future<void> replaceAll(List<PlannedReminder> reminders) async {
    await _init();
    await _plugin.cancelAll();
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        'scheduler',
        'Scheduler reminders',
        channelDescription: 'Reminders you set on calendar entries',
        importance: Importance.high,
        priority: Priority.high,
      ),
      iOS: DarwinNotificationDetails(),
    );
    for (final r in reminders) {
      await _plugin.zonedSchedule(
        id: r.id,
        scheduledDate: tz.TZDateTime.from(r.fireAt, tz.local),
        notificationDetails: details,
        // Inexact: no exact-alarm permission; a minute's slack is fine.
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        title: r.title,
        body: r.body,
        payload: r.payload,
      );
    }
  }
}

final notificationGatewayProvider = Provider<NotificationGateway>(
  (ref) =>
      LocalNotificationsGateway(() => ref.read(deviceTimeZoneProvider.future)),
);

String reminderKeyFor(ScheduleEntry e, {required bool wholeSeries}) =>
    wholeSeries && e.seriesId != null
    ? 'series:${e.seriesId}'
    : 'entry:${e.id}';

/// Lead time for [e]: its own reminder, else its series'.
int? reminderFor(ScheduleEntry e, Map<String, int> reminders) =>
    reminders['entry:${e.id}'] ??
    (e.seriesId == null ? null : reminders['series:${e.seriesId}']);

/// Notifications for [entries] (timed ones whose reminder time is ahead).
List<PlannedReminder> planReminders(
  Iterable<ScheduleEntry> entries,
  Map<String, int> reminders, {
  required DateTime now,
  required String Function(ScheduleEntry) titleOf,
  required String Function(DateTime) formatTime,
}) => [
  for (final e in entries)
    if (!e.isAllDay)
      if (reminderFor(e, reminders) case final minutes?)
        if (e.startAt.subtract(Duration(minutes: minutes)) case final at
            when at.isAfter(now))
          PlannedReminder(
            // Stable per entry, positive 31-bit for Android.
            id: e.id.hashCode & 0x7fffffff,
            fireAt: at,
            title: titleOf(e),
            body: minutes == 0
                ? 'Starting now · ${formatTime(e.startAt.toLocal())}'
                : 'In $minutes min · ${formatTime(e.startAt.toLocal())}',
            payload:
                '/scheduler/day/'
                '${e.startAt.toLocal().toIso8601String().substring(0, 10)}',
          ),
];

/// Reminder settings (state: key → minutes before) and syncing them to OS
/// notifications. Logout wipes the table (MA5) and cancels notifications.
class ReminderService extends Notifier<Map<String, int>> {
  /// Entry titles for notifications; blocks use their item's title.
  String Function(ScheduleEntry) titleOf = (e) =>
      e.title.isEmpty ? 'Time block' : e.title;

  /// Whether this run scheduled anything (so "none left" needs a cancel).
  bool _scheduled = false;

  @override
  Map<String, int> build() {
    ref.listen(sessionProvider, (prev, next) {
      if (next is SignedOut && prev is SignedIn) {
        state = const {};
        unawaited(_replace(const []));
      } else if (next is SignedIn && prev is! SignedIn) {
        unawaited(sync());
      }
    });
    unawaited(
      _load().then((_) {
        if (ref.read(sessionProvider) is SignedIn) return sync();
      }),
    );
    return const {};
  }

  Future<void> _replace(List<PlannedReminder> reminders) async {
    if (reminders.isEmpty && !_scheduled) return;
    try {
      await ref.read(notificationGatewayProvider).replaceAll(reminders);
      _scheduled = reminders.isNotEmpty;
    } on Object {
      // Notifications unavailable (no permission, platform error): skip.
    }
  }

  Future<void> _load() async {
    state = await ref.read(appDatabaseProvider).allReminders();
  }

  /// Turns a reminder on ([minutes]) or off (null) and resyncs. Turning one
  /// on asks for notification permission first; false if refused.
  Future<bool> set(String key, int? minutes) async {
    if (minutes != null &&
        !await ref.read(notificationGatewayProvider).requestPermission()) {
      return false;
    }
    await ref.read(appDatabaseProvider).setReminder(key, minutes);
    await _load();
    await sync();
    return true;
  }

  /// Reschedules notifications for the next [reminderWindow].
  Future<void> sync({DateTime? now}) async {
    final reminders = state.isEmpty
        ? await ref.read(appDatabaseProvider).allReminders()
        : state;
    if (reminders.isEmpty) {
      await _replace(const []);
      return;
    }
    final at = now ?? DateTime.now();
    List<ScheduleEntry> entries;
    try {
      entries = await ref
          .read(scheduleRepositoryProvider)
          .range(at, at.add(reminderWindow));
    } on Object {
      return; // offline: keep what's scheduled
    }
    await _replace(
      planReminders(
        entries,
        reminders,
        now: at,
        titleOf: titleOf,
        formatTime: (t) =>
            '${t.hour.toString().padLeft(2, '0')}:'
            '${t.minute.toString().padLeft(2, '0')}',
      ),
    );
  }
}

final reminderServiceProvider =
    NotifierProvider<ReminderService, Map<String, int>>(ReminderService.new);
