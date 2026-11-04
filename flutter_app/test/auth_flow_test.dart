import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:niwa/app/router.dart';
import 'package:niwa/core/api/refresh_token_store.dart';
import 'package:niwa/core/auth/session.dart';
import 'package:niwa/core/models/models.dart';

import 'support/fake_server.dart';
import 'support/test_app.dart';

Finder field(String label) => find.widgetWithText(TextFormField, label);

void main() {
  late FakeServer server;
  setUp(() => server = FakeServer());

  Future<void> logIn(WidgetTester tester, {String password = 'pw'}) async {
    await tester.enterText(field('Email'), ' me@example.com ');
    await tester.enterText(field('Password'), password);
    await tester.tap(find.widgetWithText(FilledButton, 'Log in'));
    await tester.pumpAndSettle();
  }

  group('redirectFor', () {
    final user = User.fromJson(FakeServer.user);
    String? go(SessionState s, String location) =>
        redirectFor(s, Uri.parse(location));

    test('launch states own the screen', () {
      expect(go(const SessionUnknown(), '/knowledge'), Routes.splash);
      expect(go(const SessionUnknown(), Routes.splash), isNull);
      expect(go(const SessionUnavailable('x'), '/'), Routes.unavailable);
    });

    test('signed out: only login and register', () {
      expect(go(const SignedOut(), '/knowledge'), Routes.login);
      expect(go(const SignedOut(), Routes.splash), Routes.login);
      expect(go(const SignedOut(), Routes.register), isNull);
    });

    test('signed in: away from guest and launch screens', () {
      expect(go(SignedIn(user), Routes.login), Routes.home);
      expect(go(SignedIn(user), Routes.unavailable), Routes.home);
      expect(go(SignedIn(user), '/inbox'), isNull);
    });

    test('a deep link survives sign-in', () {
      final login = go(const SignedOut(), '/items/abc#h-intro')!;
      expect(login, startsWith('/login?from='));
      expect(go(SignedIn(user), login), '/items/abc#h-intro');
    });

    test('the target survives launch → login', () {
      final splash = go(const SessionUnknown(), '/inbox')!;
      expect(splash, '/splash?from=%2Finbox');
      final login = go(const SignedOut(), splash)!;
      expect(go(SignedIn(user), login), '/inbox');
    });

    test('from must be an in-app path', () {
      expect(go(SignedIn(user), '/login?from=https://evil.test'), Routes.home);
      expect(go(SignedIn(user), '/login?from=//evil.test'), Routes.home);
    });
  });

  testWidgets('signed out at launch → login → home → logout', (tester) async {
    await pumpApp(tester, server: server);
    expect(find.text('Welcome back'), findsOneWidget);

    await logIn(tester);
    expect(find.text('Nothing planted yet'), findsOneWidget);
    // Email is trimmed before sending.
    final login = server.requests.firstWhere((r) => r.path == '/auth/login');
    expect(login.data, {'email': 'me@example.com', 'password': 'pw'});

    await tester.tap(find.byTooltip('Account'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Log out'));
    await tester.pumpAndSettle();
    expect(find.text('Welcome back'), findsOneWidget);
  });

  testWidgets('a stored session opens straight to home', (tester) async {
    server.issue();
    final store = MemoryRefreshTokenStore();
    await store.write('r1');
    await pumpApp(tester, server: server, store: store);
    expect(find.text('Nothing planted yet'), findsOneWidget);
  });

  testWidgets('login validates before sending', (tester) async {
    await pumpApp(tester, server: server);
    await tester.enterText(field('Email'), 'not-an-email');
    await tester.tap(find.widgetWithText(FilledButton, 'Log in'));
    await tester.pumpAndSettle();
    expect(find.text('Enter a valid email'), findsOneWidget);
    expect(find.text('Enter your password'), findsOneWidget);
    expect(server.count('/auth/login'), 0);
  });

  testWidgets('wrong password shows the server message', (tester) async {
    server.routes['/auth/login'] = (_) => FakeServer.json(401, {
      'error': {
        'code': 'INVALID_CREDENTIALS',
        'message': 'Email or password is incorrect.',
      },
    });
    await pumpApp(tester, server: server);
    await logIn(tester);
    expect(find.text('Email or password is incorrect.'), findsOneWidget);
    expect(find.text('Welcome back'), findsOneWidget);
    // A failed login is not a reason to try a token refresh.
    expect(server.count('/auth/refresh'), 0);
  });

  testWidgets('rate limit says how long to wait', (tester) async {
    server.routes['/auth/login'] = (_) => FakeServer.json(
      429,
      {
        'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests'},
      },
      headers: {
        'retry-after': ['90'],
      },
    );
    await pumpApp(tester, server: server);
    await logIn(tester);
    expect(
      find.text('Too many attempts. Try again in 2 minutes.'),
      findsOneWidget,
    );
  });

  testWidgets('offline login explains the connection', (tester) async {
    server.routes['/auth/login'] = (_) => throw const SocketException('x');
    await pumpApp(tester, server: server);
    await logIn(tester);
    expect(find.textContaining("Can't reach the NIWA server"), findsOneWidget);
  });

  testWidgets('register: confirm must match; closed instance', (tester) async {
    server.routes['/auth/register'] = (_) => FakeServer.json(403, {
      'error': {
        'code': 'REGISTRATION_CLOSED',
        'message': 'Registration is closed for this NIWA instance.',
      },
    });
    await pumpApp(tester, server: server);
    await tester.tap(find.text('Create your account'));
    await tester.pumpAndSettle();
    expect(find.text('Plant your garden'), findsOneWidget);

    await tester.enterText(field('Email'), 'me@example.com');
    await tester.enterText(field('Password'), 'short');
    await tester.enterText(field('Confirm password'), 'different');
    await tester.tap(find.widgetWithText(FilledButton, 'Create account'));
    await tester.pumpAndSettle();
    expect(find.text('At least 12 characters'), findsOneWidget);
    expect(find.text("Passwords don't match"), findsOneWidget);
    expect(server.count('/auth/register'), 0);

    const pw = 'a long enough password';
    await tester.enterText(field('Password'), pw);
    await tester.enterText(field('Confirm password'), pw);
    await tester.tap(find.widgetWithText(FilledButton, 'Create account'));
    await tester.pumpAndSettle();
    expect(
      find.text('Registration is closed for this NIWA instance.'),
      findsOneWidget,
    );
  });

  testWidgets('register success lands on home', (tester) async {
    await pumpApp(tester, server: server);
    await tester.tap(find.text('Create your account'));
    await tester.pumpAndSettle();
    const pw = 'a long enough password';
    await tester.enterText(field('Email'), 'me@example.com');
    await tester.enterText(field('Password'), pw);
    await tester.enterText(field('Confirm password'), pw);
    await tester.tap(find.widgetWithText(FilledButton, 'Create account'));
    await tester.pumpAndSettle();
    expect(find.text('Nothing planted yet'), findsOneWidget);
  });

  testWidgets('server unreachable at launch → retry → home', (tester) async {
    server.issue();
    final store = MemoryRefreshTokenStore();
    await store.write('r1');
    server.routes['/auth/refresh'] = (_) => throw const SocketException('x');

    await pumpApp(tester, server: server, store: store);
    expect(find.text('Not connected'), findsOneWidget);

    server.routes.remove('/auth/refresh');
    await tester.tap(find.text('Try again'));
    await tester.pumpAndSettle();
    expect(find.text('Nothing planted yet'), findsOneWidget);
  });

  testWidgets('password visibility toggles', (tester) async {
    await pumpApp(tester, server: server);
    EditableText password() => tester.widget<EditableText>(
      find.descendant(
        of: field('Password'),
        matching: find.byType(EditableText),
      ),
    );
    expect(password().obscureText, isTrue);
    await tester.tap(find.byTooltip('Show password'));
    await tester.pump();
    expect(password().obscureText, isFalse);
  });

  testWidgets('no overflow on a small phone with 2× text', (tester) async {
    tester.view
      ..physicalSize = const Size(360, 740)
      ..devicePixelRatio = 1;
    tester.platformDispatcher.textScaleFactorTestValue = 2;
    addTearDown(() {
      tester.view.reset();
      tester.platformDispatcher.clearTextScaleFactorTestValue();
    });

    await pumpApp(tester, server: server);
    expect(find.text('Welcome back'), findsOneWidget);
    await tester.tap(find.widgetWithText(FilledButton, 'Log in'));
    await tester.pumpAndSettle(); // validation messages too
    await tester.ensureVisible(find.text('Create your account'));
    await tester.tap(find.text('Create your account'));
    await tester.pumpAndSettle();
    expect(find.text('Plant your garden'), findsOneWidget);
    // Any RenderFlex overflow would have failed the test by now.
    expect(tester.takeException(), isNull);
  });
}
