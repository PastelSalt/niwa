# NIWA — mobile app (Flutter)

Android + iOS client for the NIWA API. Same data model and behaviour as the web app, with a layout built
for phones (`PROJECT-SPECS.md` §10, §11.5). Plan: **`NIWA-PLAN-A-02.md`** at the repo root.

This folder sits **outside the pnpm workspace**; it talks to the backend only through the HTTP contract
(`packages/contracts/openapi.yaml`).

## Status

Scaffolded (plan A-02 MA1.P1): Android + iOS, bundle id `works.moeko.niwa`, Android `minSdk 26` /
`targetSdk 36`. Theme comes from `@niwa/tokens` (MA1.P2); wire models are checked against the contract (MA1.P3);
CI in `.github/workflows/flutter.yml` (MA1.P4). MA2–MA5 are written: API client, session, login/register, the app shell,
the item tree (Knowledge and Actionable lenses, item view, fields, structure changes, Focus), and offline
support (on-device cache, offline banner, capture queue), the notes editor (MA6), the Scheduler (MA7) and
Inbox filing, capture details and search (MA8), and Settings, Trash and note images (MA9).
Next: quality pass (MA10), then release (MA11).

## Layout

```
lib/
├─ main.dart            ProviderScope → NiwaApp
├─ app/                 app widget, router, shell (bottom bar, capture FAB), top bar
├─ core/                api, auth (session), config, db (Drift), models, net, theme, ui, util
└─ features/<feature>/  data/ (repositories) + ui/, mirroring web_app/src/features
```

## Configuration

Set at build time with `--dart-define`:

| Key | Values | Default |
|---|---|---|
| `APP_ENV` | `local`, `staging`, `prod` | `local` |
| `API_BASE` | API root including `/api/v1` | `http://10.0.2.2:4000/api/v1` (emulator → host) |

## Theme

`lib/core/theme/tokens.g.dart` is **generated** from `packages/tokens/src/index.ts` — never edit it.

```bash
pnpm tokens:dart          # from the repo root: regenerate after changing tokens
pnpm tokens:dart:check    # CI: fails if the Dart file is stale
```

`AppTheme` maps the palette onto a Material 3 `ColorScheme`; colours Material has no slot for (warning,
success, info, item types) are on the `NiwaColors` theme extension: `NiwaColors.of(context).types.task`.

## Models

`lib/core/models/` holds freezed + json_serializable models for the API's wire shapes; import
`package:niwa/core/models/models.dart`. Generated `*.freezed.dart` / `*.g.dart` files are committed. After
changing a model:

```bash
dart run build_runner build -d
```

- Instants (`IsoDateTime`) are `DateTime`; calendar days (`dueAt`, `reviewAt`) stay `YYYY-MM-DD` strings.
- Every enum has an `unknown` member that unrecognised server values decode to. Never send it back.
- `test/contract_test.dart` compares `test/fixtures/<Schema>.json` with `packages/contracts/openapi.yaml`
  and probes each model field (nullability, optional, enum values). When the contract changes, update the
  fixture and the model together. A new model needs an entry in `models` and a fixture.

## API client

`lib/core/api/api_client.dart` mirrors `@niwa/api-client`:

- Sends `X-Client: mobile`, so the refresh token comes back in the body and goes to a `RefreshTokenStore`
  (secure storage in MA2.P2). The access token is kept in memory only.
- On a 401 it refreshes once and retries once. Concurrent 401s share one refresh. A rejected refresh token
  (reused, revoked or expired) signs out: `sessionChanges` emits `null`.
- Errors: `ApiException` (status, `ErrorCode`, details, requestId, `retryAfter`) for server answers;
  `OfflineException` (`timedOut`) when there's no answer at all.

### Repositories and session

- One repository per area in `lib/features/<area>/data/` (items + tags, inbox, search, scheduler, links,
  uploads, workspace), each available through a provider in `lib/core/api/providers.dart`.
- PATCH bodies use `Change<T>`: leaving a field `null` means "don't touch it", `Change(null)` clears it.
- `sessionProvider` (`lib/core/auth/session.dart`) is `SessionUnknown` at launch, then `SignedIn(user)`,
  `SignedOut` or `SessionUnavailable(error)` (stored token, server unreachable — offer a retry via
  `restore()`). It refreshes the access token when the app resumes within a minute of expiry.
- `lib/app/router.dart`: `redirectFor(session, location)` sends launch states to `/splash` or `/unavailable`,
  signed-out users to `/login` (or `/register`) and signed-in users away from those.
- User-facing error text comes from `messageOf` (`lib/core/api/error_message.dart`).
- Items: `treeProvider` (`TreeModel` from `/tree`), `itemProvider(id)`, `focusProvider`, and `itemActionsProvider`
  for every change (refreshes views, Undo snackbars, conflict reloads). Tree logic in
  `lib/features/items/domain/tree_model.dart` is a port of the web `treeModel.ts`.
- Tests override `refreshTokenStoreProvider` / `apiClientProvider`; `test/support/fake_server.dart` is an
  in-memory auth server and
  `test/support/test_app.dart` pumps the whole app against it; `fake_workspace.dart` serves items, tree, Focus,
  Trash and Inbox in memory.

## Routes and deep links

Paths match the web app (`web_app/src/app/router.tsx`): `/knowledge[/:id]`, `/knowledge/review`,
`/actionable[/:id]`, `/items/:id` (redirects to the item's lens, keeping `#anchor`),
`/scheduler/:view/:date` (`/scheduler` → today's day view), `/inbox`, `/search?q=`, `/settings/:section`.

Deep links use `niwa://open/<path>`:

```bash
adb shell am start -a android.intent.action.VIEW -d 'niwa://open/items/<id>'
```

A link opened while signed out is kept (`/login?from=…`) and opened after sign-in.

## Offline

- `lib/core/db/app_database.dart` (Drift): `cache_entries` holds the last response per request; `outbox`
  holds captures not yet sent. Wiped on logout.
- Read providers use `cachedThenFresh` (`lib/core/db/cached.dart`): cached copy first, then the network.
- `networkStatusProvider` is "can we reach `/health`", not just "is there Wi-Fi"; the shell shows a banner
  when it's false. Edits are refused offline with a message; capture always works.
- `captureQueueProvider` sends the outbox oldest first with a `clientId` each, so retries can't duplicate.
  Refused captures show in the Inbox with Retry / Discard; logout warns if any are unsent.
- After changing tables: bump `schemaVersion`, add a migration, regenerate (`dart run build_runner build -d`).

## Notes editor

- Bodies stay ProseMirror JSON on the server. `lib/features/knowledge/domain/pm_delta.dart` converts to Quill
  Delta for flutter_quill and back; content the phone can't edit becomes a locked block written back unchanged.
- Fixtures in `test/fixtures/editor/` are generated by the **web** editor's schema. After changing the web
  editor's extensions, regenerate them and re-run the Dart tests:

```bash
UPDATE_EDITOR_FIXTURES=1 pnpm --filter @niwa/web test   # from the repo root
```

- `NoteAutosave` follows the web `useAutosave` rules (debounce, latest version, conflict pause).

## Scheduler

- Day / week / month at the web's paths (`/scheduler/:view/:date`). Ranges are cached like other reads.
- Date maths in `lib/features/scheduler/domain/calendar.dart` (port of `web_app/src/lib/dates.ts`): local
  dates via calendar arithmetic (DST-safe), all-day entries as UTC calendar dates.
- Writes send the device's IANA zone (`deviceTimeZoneProvider`), so recurring entries keep wall-clock time.
- Reminders are per phone (Drift `reminders`), opt-in, 10 minutes before; `ReminderService` keeps the next 14
  days scheduled with flutter_local_notifications (inexact alarms; permission asked on first use).

## Checks

```bash
flutter analyze                          # very_good_analysis + strict casts/inference/raw types
dart format --set-exit-if-changed lib test
flutter test
flutter build apk --debug
```

The SDK on the Linux laptop lives at `~/develop/flutter` — add `~/develop/flutter/bin` to `PATH`.

## Local development (once scaffolded)

```bash
pnpm dev:memory                                   # from the repo root: API on :4000 with in-memory MongoDB
flutter run --dart-define=API_BASE=http://10.0.2.2:4000/api/v1   # Android emulator → host machine
flutter run --dart-define=API_BASE=http://localhost:4000/api/v1  # iOS simulator
```
