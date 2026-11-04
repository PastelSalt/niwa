import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:drift/drift.dart' show driftRuntimeOptions;
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:niwa/app/app.dart';
import 'package:niwa/core/api/api_client.dart';
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/api/refresh_token_store.dart';
import 'package:niwa/core/db/app_database.dart';
import 'package:niwa/core/db/db_providers.dart';
import 'package:niwa/core/net/network_status.dart';
import 'package:niwa/core/util/app_version.dart';
import 'package:niwa/core/util/time_zone.dart';
import 'package:niwa/features/capture/data/capture_queue.dart';
import 'package:niwa/features/knowledge/data/image_upload.dart';
import 'package:niwa/features/scheduler/data/reminders.dart';

import 'fake_server.dart';
import 'fake_workspace.dart';

/// Pumps the whole app (router, session, screens) against [server].
Future<void> pumpApp(
  WidgetTester tester, {
  required FakeServer server,
  RefreshTokenStore? store,
  AppDatabase? db,
  Stream<List<ConnectivityResult>>? connectivity,
  FakeNotifications? notifications,
  ImagePickerPort? imagePicker,
  Dio? cloudinary,
}) async {
  server.workspace ??= FakeWorkspace();
  // Each pump gets its own in-memory database; that's intended here.
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;
  final database = db ?? AppDatabase(NativeDatabase.memory());
  if (db == null) addTearDown(database.close);
  // Unmount any earlier app, so a second call is a real restart.
  await tester.pumpWidget(const SizedBox());
  await tester.pumpWidget(
    ProviderScope(
      // Deterministic error states: no automatic provider retries.
      retry: (_, _) => null,
      overrides: [
        appDatabaseProvider.overrideWithValue(database),
        notificationGatewayProvider.overrideWithValue(
          notifications ?? FakeNotifications(),
        ),
        deviceTimeZoneProvider.overrideWith((ref) async => 'Asia/Manila'),
        appVersionProvider.overrideWith((ref) async => '1.0.0 (1)'),
        if (imagePicker != null)
          imagePickerProvider.overrideWithValue(imagePicker),
        if (cloudinary != null)
          cloudinaryDioProvider.overrideWithValue(cloudinary),
        connectivityChangesProvider.overrideWithValue(
          connectivity ?? const Stream.empty(),
        ),
        offlineProbeIntervalProvider.overrideWithValue(
          const Duration(seconds: 1),
        ),
        captureRetryBaseProvider.overrideWithValue(
          const Duration(milliseconds: 100),
        ),
        apiClientProvider.overrideWith((ref) {
          final api = ApiClient(
            baseUrl: 'http://api.test/api/v1',
            refreshTokens: store ?? MemoryRefreshTokenStore(),
            adapter: server,
          );
          ref.onDispose(api.close);
          return api;
        }),
      ],
      child: const NiwaApp(),
    ),
  );
  await tester.pumpAndSettle();
}

/// [pumpApp], then logs in through the real login screen.
Future<void> pumpSignedIn(
  WidgetTester tester, {
  required FakeServer server,
  AppDatabase? db,
  Stream<List<ConnectivityResult>>? connectivity,
  FakeNotifications? notifications,
  ImagePickerPort? imagePicker,
  Dio? cloudinary,
}) async {
  await pumpApp(
    tester,
    server: server,
    db: db,
    connectivity: connectivity,
    notifications: notifications,
    imagePicker: imagePicker,
    cloudinary: cloudinary,
  );
  await tester.enterText(
    find.widgetWithText(TextFormField, 'Email'),
    'me@example.com',
  );
  await tester.enterText(find.widgetWithText(TextFormField, 'Password'), 'pw');
  await tester.tap(find.widgetWithText(FilledButton, 'Log in'));
  await tester.pumpAndSettle();
}

/// Records what would be scheduled with the OS.
class FakeNotifications implements NotificationGateway {
  List<PlannedReminder> scheduled = const [];
  bool permission = true;
  int permissionRequests = 0;

  @override
  Future<bool> requestPermission() async {
    permissionRequests++;
    return permission;
  }

  @override
  Future<void> replaceAll(List<PlannedReminder> reminders) async =>
      scheduled = reminders;
}
