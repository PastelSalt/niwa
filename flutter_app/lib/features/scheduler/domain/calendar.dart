/// Calendar helpers (port of `web_app/src/lib/dates.ts`, docs/SCHEDULER.md
/// §2). Timed entries are UTC instants shown in local time; all-day entries
/// are UTC date boundaries shown as calendar dates, never shifted by the
/// viewer's zone. Weeks start on Monday.
///
/// Local dates are built with `DateTime(y, m, d)` arithmetic, never by adding
/// 24-hour durations, so DST days stay one calendar day long.
library;

String _pad(int n) => n.toString().padLeft(2, '0');

/// Local calendar day key `YYYY-MM-DD`.
String dayKey(DateTime d) => '${d.year}-${_pad(d.month)}-${_pad(d.day)}';

/// Local midnight of a `YYYY-MM-DD` key.
DateTime parseDay(String key) {
  final p = key.split('-').map(int.parse).toList();
  return DateTime(p[0], p[1], p[2]);
}

bool isDayKey(String? v) {
  if (v == null || !RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(v)) return false;
  return dayKey(parseDay(v)) == v; // rejects 2026-02-30
}

DateTime startOfDay(DateTime d) => DateTime(d.year, d.month, d.day);

DateTime addDays(DateTime d, int n) =>
    DateTime(d.year, d.month, d.day + n, d.hour, d.minute);

/// Monday of [d]'s week.
DateTime startOfWeek(DateTime d) {
  final s = startOfDay(d);
  return addDays(s, -(s.weekday - DateTime.monday));
}

DateTime startOfMonth(DateTime d) => DateTime(d.year, d.month);

DateTime addMonths(DateTime d, int n) => DateTime(d.year, d.month + n);

/// First cell of the 6-week grid covering [d]'s month (a Monday).
DateTime monthGridStart(DateTime d) => startOfWeek(startOfMonth(d));

int minutesOfDay(DateTime d) => d.hour * 60 + d.minute;

DateTime atMinutes(DateTime day, int minutes) =>
    DateTime(day.year, day.month, day.day, 0, minutes);

// ---- All-day (UTC calendar dates) ----

/// `YYYY-MM-DD` of a UTC instant — for all-day entries.
String utcDayKey(DateTime instant) {
  final u = instant.toUtc();
  return '${u.year}-${_pad(u.month)}-${_pad(u.day)}';
}

DateTime utcMidnight(String key) {
  final p = key.split('-').map(int.parse).toList();
  return DateTime.utc(p[0], p[1], p[2]);
}

/// Calendar days covered by an all-day entry (end exclusive).
List<String> allDayKeys(DateTime startAt, DateTime endAt) {
  final out = <String>[];
  var t = utcMidnight(utcDayKey(startAt));
  while (t.isBefore(endAt) && out.length < 366) {
    out.add(utcDayKey(t));
    t = DateTime.utc(t.year, t.month, t.day + 1);
  }
  return out;
}

String addDaysToKey(String key, int n) {
  final t = utcMidnight(key);
  return utcDayKey(DateTime.utc(t.year, t.month, t.day + n));
}

/// Snap minutes to a step (default 15).
int snap(num minutes, [int step = 15]) => (minutes / step).round() * step;
