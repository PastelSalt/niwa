import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_timezone/flutter_timezone.dart';

/// The device's IANA time zone (e.g. `Asia/Manila`), sent with schedule
/// writes so recurring entries keep their wall-clock time across DST
/// (SCHEDULER.md §2). Falls back to UTC. Tests override it.
final deviceTimeZoneProvider = FutureProvider<String>((ref) async {
  try {
    return (await FlutterTimezone.getLocalTimezone()).identifier;
  } on Object {
    return 'UTC';
  }
});
