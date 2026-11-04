import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/db/app_database.dart';

/// The on-device database. Tests override it with an in-memory one.
final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
});
