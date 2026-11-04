import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart' show ImageSource;
import 'package:niwa/core/api/api_client.dart';
import 'package:niwa/core/api/refresh_token_store.dart';
import 'package:niwa/core/db/app_database.dart';
import 'package:niwa/features/knowledge/data/image_upload.dart';
import 'package:niwa/features/knowledge/data/uploads_repository.dart';

import 'support/fake_server.dart';
import 'support/fake_workspace.dart';
import 'support/test_app.dart';

/// Stands in for Cloudinary's upload endpoint.
class FakeCloudinary implements HttpClientAdapter {
  final requests = <RequestOptions>[];
  int status = 200;
  Map<String, Object?>? reply;

  /// Multipart fields of the last upload (file excluded).
  Map<String, String> get lastFields => {
    for (final f in (requests.last.data as FormData).fields) f.key: f.value,
  };

  MultipartFile get lastFile =>
      (requests.last.data as FormData).files.single.value;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    final publicId = (options.data as FormData).fields
        .firstWhere((f) => f.key == 'public_id')
        .value;
    return ResponseBody.fromString(
      jsonEncode(reply ?? {'public_id': 'niwa/ws/$publicId'}),
      status,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

class FakePicker implements ImagePickerPort {
  new(this.image);

  PickedImage? image;
  ImageSource? lastSource;

  @override
  Future<PickedImage?> pick(ImageSource source) async {
    lastSource = source;
    return image;
  }
}

final png = PickedImage(
  bytes: Uint8List.fromList(List.filled(64, 1)),
  name: 'bgp-path_selection.png',
  mime: 'image/png',
);

void main() {
  group('image helpers', () {
    test('delivery URL adds f_auto,q_auto once', () {
      const raw = 'https://res.cloudinary.com/demo/image/upload/v1/niwa/x.png';
      final d = deliveryUrl(raw);
      expect(
        d,
        'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1/niwa/x.png',
      );
      expect(deliveryUrl(d), d);
    });

    test('phone URL chains a width after the stored transformation', () {
      const src =
          'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/niwa/x.png';
      expect(
        phoneImageUrl(src, 1000),
        'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/w_1080,c_limit/niwa/x.png',
      );
      // Untransformed and versioned URLs, and folder names with underscores.
      expect(
        phoneImageUrl(
          'https://res.cloudinary.com/d/image/upload/v1/my_folder/x.png',
          300,
        ),
        'https://res.cloudinary.com/d/image/upload/w_360,c_limit/v1/my_folder/x.png',
      );
      expect(
        phoneImageUrl('https://example.com/a.png', 500),
        'https://example.com/a.png',
      );
    });

    test('alt text from the file name; type and size checks', () {
      expect(altFromName('bgp-path_selection.png'), 'bgp path selection');
      expect(
        () => checkImage(
          PickedImage(bytes: Uint8List(1), name: 'a.bmp', mime: 'image/bmp'),
        ),
        throwsA(isA<UploadError>()),
      );
      expect(
        () => checkImage(
          PickedImage(
            bytes: Uint8List(maxImageBytes + 1),
            name: 'big.png',
            mime: 'image/png',
          ),
        ),
        throwsA(
          isA<UploadError>().having((e) => e.message, 'm', contains('10 MB')),
        ),
      );
    });
  });

  group('uploadImage', () {
    late FakeServer server;
    late ApiClient api;
    late FakeCloudinary cloudinary;
    late Dio cloudinaryDio;

    setUp(() async {
      server = FakeServer()..workspace = FakeWorkspace();
      api = ApiClient(
        baseUrl: 'http://api.test/api/v1',
        refreshTokens: MemoryRefreshTokenStore(),
        adapter: server,
      );
      await api.login(email: 'me@example.com', password: 'x' * 12);
      cloudinary = FakeCloudinary();
      cloudinaryDio = Dio()..httpClientAdapter = cloudinary;
    });
    tearDown(() => api.close());

    test('sign → upload straight to Cloudinary → confirm', () async {
      final up = await uploadImage(
        uploads: UploadsRepository(api),
        cloudinary: cloudinaryDio,
        itemId: 'n1',
        image: png,
      );
      final upload = cloudinary.requests.single;
      expect(
        upload.uri.toString(),
        'https://api.cloudinary.com/v1_1/demo/image/upload',
      );
      expect(upload.headers.containsKey('Authorization'), isFalse);
      expect(cloudinary.lastFields, {
        'api_key': '123456789012345',
        'timestamp': '1793700000',
        'signature': 'sig-n1',
        'folder': 'niwa/ws',
        'public_id': 'img1',
        'tags': 'niwa-pending',
        'allowed_formats': 'png,jpg,webp,gif',
      });
      expect(cloudinary.lastFile.filename, 'bgp-path_selection.png');
      final confirm = server.requests.lastWhere(
        (r) => r.path == '/attachments',
      );
      expect(confirm.data, {'itemId': 'n1', 'publicId': 'niwa/ws/img1'});
      expect(up.attachment.id, 'att1');
      expect(up.src, contains('/upload/f_auto,q_auto/'));
    });

    test("Cloudinary's error message is shown", () async {
      cloudinary
        ..status = 400
        ..reply = {
          'error': {'message': 'Invalid image file'},
        };
      await expectLater(
        uploadImage(
          uploads: UploadsRepository(api),
          cloudinary: cloudinaryDio,
          itemId: 'n1',
          image: png,
        ),
        throwsA(
          isA<UploadError>().having(
            (e) => e.message,
            'm',
            'Invalid image file',
          ),
        ),
      );
      expect(server.count('/attachments'), 0);
    });
  });

  group('app', () {
    late FakeServer server;
    late FakeWorkspace ws;

    setUp(() {
      ws = FakeWorkspace();
      server = FakeServer()..workspace = ws;
    });

    Future<void> tap(WidgetTester tester, Finder f) async {
      await tester.ensureVisible(f);
      await tester.tap(f);
      await tester.pumpAndSettle();
    }

    Future<void> open(WidgetTester tester, String path) async {
      GoRouter.of(tester.element(find.byType(NavigationBar).first)).go(path);
      await tester.pumpAndSettle();
    }

    testWidgets('add an image to a note: the web image node is saved', (
      tester,
    ) async {
      ws.add('Network notes', id: 'n');
      final cloudinary = FakeCloudinary();
      final picker = FakePicker(png);
      await pumpSignedIn(
        tester,
        server: server,
        imagePicker: picker,
        cloudinary: Dio()..httpClientAdapter = cloudinary,
      );
      await open(tester, '/knowledge/n/edit');

      await tap(tester, find.byTooltip('Add an image'));
      await tap(tester, find.text('Choose from photos'));
      expect(picker.lastSource, ImageSource.gallery);
      expect(find.text('Describe the image'), findsOneWidget);
      expect(find.text('bgp path selection'), findsOneWidget); // prefilled
      await tap(tester, find.widgetWithText(FilledButton, 'Upload'));
      await tester.pump(const Duration(seconds: 1)); // autosave debounce
      await tester.pumpAndSettle();

      final content = ws.item('n')['content'] as Map;
      final image = (content['content'] as List).firstWhere(
        (b) => (b as Map)['type'] == 'image',
      );
      expect((image as Map)['attrs'], {
        'src': 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1/niwa/ws/img1.png',
        'alt': 'bgp path selection',
        'title': null,
        'width': null,
        'height': null,
        'attachmentId': 'att1',
      });
    });

    testWidgets('no image button when the server has uploads off', (
      tester,
    ) async {
      ws
        ..uploadsEnabled = false
        ..add('Notes', id: 'n');
      await pumpSignedIn(tester, server: server);
      await open(tester, '/knowledge/n/edit');
      expect(find.byTooltip('Add an image'), findsNothing);
      expect(find.byTooltip('Link to an item'), findsOneWidget);
    });

    testWidgets('Trash: restore and delete permanently', (tester) async {
      final folder = ws.add('Old project');
      ws
        ..add('Inside', parent: folder)
        ..add('Scratch', id: 's');
      for (final id in [folder, 's']) {
        ws.item(id)['deletedAt'] = '2026-11-01T00:00:00.000Z';
      }
      for (final i in ws.items.values.where((i) => i['parentId'] == folder)) {
        i['deletedAt'] = '2026-11-01T00:00:00.000Z';
      }
      await pumpSignedIn(tester, server: server);
      await open(tester, '/settings/trash');
      expect(find.text('Old project'), findsOneWidget);
      expect(find.text('Inside'), findsNothing, reason: 'listed by its root');

      await tap(tester, find.byTooltip('Restore Old project'));
      expect(
        find.text('Restored “Old project” and 1 inside it'),
        findsOneWidget,
      );
      expect(ws.item(folder)['deletedAt'], isNull);

      await tap(tester, find.byTooltip('Delete Scratch permanently'));
      expect(find.text('Delete permanently?'), findsOneWidget);
      await tap(tester, find.text('Delete forever'));
      expect(find.text('Deleted 1 item permanently'), findsOneWidget);
      expect(ws.items.containsKey('s'), isFalse);
      expect(find.text('Trash is empty.'), findsOneWidget);
    });

    testWidgets('the theme choice survives a restart and a logout', (
      tester,
    ) async {
      final db = AppDatabase(NativeDatabase.memory());
      addTearDown(db.close);
      await pumpSignedIn(tester, server: server, db: db);
      await open(tester, '/settings/appearance');
      await tap(tester, find.text('Dark'));
      Brightness brightness() =>
          Theme.of(tester.element(find.byType(Scaffold).last)).brightness;
      expect(brightness(), Brightness.dark);

      // Restart with the same database.
      await pumpApp(tester, server: server, db: db);
      expect(brightness(), Brightness.dark);
      expect(await db.preference('themeMode'), 'dark');

      // Logging out wipes account data, not device preferences. (The
      // restarted test app starts signed out, so sign in again first.)
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Email'),
        'me@example.com',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Password'),
        'pw',
      );
      await tap(tester, find.widgetWithText(FilledButton, 'Log in'));
      await tap(tester, find.byTooltip('Account'));
      await tap(tester, find.text('Log out'));
      expect(find.text('Welcome back'), findsOneWidget);
      expect(await db.preference('themeMode'), 'dark');
    });

    testWidgets('sign out everywhere; offline it changes nothing', (
      tester,
    ) async {
      server.routes['/auth/logout-all'] = (_) =>
          ResponseBody.fromString('', 204);
      await pumpSignedIn(tester, server: server);
      await open(tester, '/settings/account');
      expect(find.text('Version 1.0.0 (1)'), findsOneWidget);

      server.offline = true;
      await tap(tester, find.text('Sign out everywhere'));
      await tap(
        tester,
        find.widgetWithText(FilledButton, 'Sign out everywhere'),
      );
      expect(
        find.textContaining("Can't reach the NIWA server"),
        findsOneWidget,
      );
      expect(find.text('Welcome back'), findsNothing);

      server.offline = false;
      await tap(tester, find.text('Sign out everywhere'));
      await tap(
        tester,
        find.widgetWithText(FilledButton, 'Sign out everywhere'),
      );
      expect(server.count('/auth/logout-all'), 1);
      expect(find.text('Welcome back'), findsOneWidget);
    });
  });

  test('schema v4 has the preferences table', () async {
    final db = AppDatabase(NativeDatabase.memory());
    addTearDown(db.close);
    expect(db.schemaVersion, 4);
    await db.setPreference('k', 'v');
    expect(await db.preference('k'), 'v');
  });
}
