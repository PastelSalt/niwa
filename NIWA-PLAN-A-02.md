# NIWA — Plan A-02 (Mobile app, Flutter)

**Role of this file:** detailed plan for the **mobile client** in `flutter_app/`. It replaces M10 of
`NIWA-PLAN-A-01.md`, which stays the tracker for backend, web and desktop.
**Concept source:** `PROJECT-SPECS.md` (§10 parity, §11.5 mobile stack, §12 decisions). If this plan contradicts the specs, the specs win.
**Plan version:** A-02
**Created:** 2026-11-04
**Priority (owner, 2026-11-04):** mobile first → then desktop (`desktop_app/`, A-01 M9). AI (A-01 M8) is deferred.
**Builds on:** the MVP backend + contract from A-01 M1–M7 (`packages/contracts/openapi.yaml`). Open gaps: `GAPS.md`.

---

## How to use this plan

Same rules as A-01:
- **Hierarchy:** Milestone (`MA#`) → Phase (`MA#.P#`) → Task (checkbox).
- **Status:** `⬜ Not started` · `🟨 In progress` · `✅ Done` · `⛔ Blocked`.
- Tick a task only when it's done **and** verified (test passes / runs on an emulator or device).
- Every completed phase gets a `LOGS.md` entry; every new folder/module gets a `CODEMAP.md` entry.
- Anything skipped goes into `GAPS.md`.
- **Contract rule:** the app talks to the API only through the documented contract. If mobile needs a new
  endpoint or field, it's added to `@niwa/contracts` first (A-01 rule), then the backend, then the app.

## Overview

| # | Milestone | Status | Depends on |
|---|---|---|---|
| MA0 | Toolchain & decisions | ✅ | — |
| MA1 | Scaffold, theme, models | 🟨 | MA0 |
| MA2 | API client & auth | 🟨 (code done; emulator check pending) | MA1 |
| MA3 | App shell & navigation | 🟨 (goldens open) | MA2 |
| MA4 | Items, tree & Actionable | ✅ (code; device run pending) | MA3 |
| MA5 | Local cache & offline | ✅ (code; device run pending) | MA4 |
| MA6 | Notes editor (flutter_quill) | ✅ (code; manual round-trip pending) | MA4 |
| MA7 | Scheduler | ✅ (code; device run pending) | MA4 |
| MA8 | Inbox, capture & search | ✅ (code; stretch items open) | MA4 (MA5 for offline capture) |
| MA9 | Settings, Trash & images | ⬜ | MA6 |
| MA10 | Quality: accessibility, tests, performance | ⬜ | MA4–MA9 |
| MA11 | Release (Android first, then iOS) | ⬜ | MA10 |

**Exit criteria (whole plan):** the app passes the parity checklist (§ at the end) against the same backend
as the web app; graph and command palette are the documented exceptions (specs §10.1).

---

## Key decisions (proposed — confirm in MA0)

| Topic | Proposal | Why |
|---|---|---|
| Platforms | **Android first**; iOS after (needs a Mac or a macOS CI runner + Apple developer account) | Dev machines: Windows and a Linux (CachyOS) work laptop — neither builds iOS |
| Stack | Flutter 3.x / Dart 3.x, Riverpod 3, go_router, Dio, freezed + json_serializable, Drift, flutter_secure_storage, connectivity_plus, flutter_local_notifications, flutter_quill (specs §11.5) | Fixed by specs |
| Folder layout | feature-first: `lib/app/`, `lib/core/` (api, auth, db, theme, util), `lib/features/<feature>/{data,ui}` | Mirrors `web_app/src/features` so the two codebases are easy to compare |
| Models | Hand-written **freezed** models per contract schema, kept honest by a **contract check** script that compares Dart model fields against `openapi.yaml` (runs in CI) | Generated Dart clients from OpenAPI are heavy and awkward with Zod's unions; a check stops drift |
| Design tokens | Generate `lib/core/theme/tokens.g.dart` from `@niwa/tokens` with a Node script + `--check` mode in CI | One token source (specs §10.1) |
| Auth transport | `X-Client: mobile`; refresh token returned in the body, stored in `flutter_secure_storage`; access token in memory only (specs §12.1) | Already supported by the backend |
| Offline | **Phase 1:** read cache (Drift) for tree, items, inbox, schedule range + **offline capture queue**. **Later:** full offline editing with an outbox | Capture is the main mobile write; full offline edits need conflict UX |
| Editor | flutter_quill with a **ProseMirror JSON ⇄ Quill Delta converter**; nodes it can't edit are kept as locked blocks and written back unchanged | Content stays ProseMirror JSON on the server (specs §12.4); nothing is lost by editing on a phone |
| API base | `--dart-define=API_BASE=…`; prod calls Render directly (no Vercel rewrite needed for native) | Native apps don't need the cookie same-site trick |
| Bundle id | `works.moeko.niwa` | Confirmed by owner 2026-11-04 |

---

## MA0 — Toolchain & decisions

**Goal:** a machine that can build and run the app, and the open questions answered.

### MA0.P1 — Toolchain
- [x] Flutter 3.47.9 / Dart 3.13.7 at `~/develop/flutter`; `flutter doctor` clean for Android (2026-11-04)
- [x] Android Studio + Android SDK (platform 37) on the Linux work laptop; emulator `Medium_Phone_API_37.0`; USB debugging on a real phone (optional)
- [ ] VS Code Flutter/Dart extensions
- [ ] Decide iOS timing (Mac / CI runner, Apple developer account)

### MA0.P2 — Decisions
- [x] Confirm the decisions table above (bundle id, offline scope, Android first)
- [x] Android versions: `minSdk 26` (Android 8.0), `targetSdk 36` (Android 16) — owner, 2026-11-04
- [x] Scheduler notifications: opt-in per entry, default reminder 10 min — owner, 2026-11-04

**Exit criteria:** `flutter doctor` passes for Android; decisions recorded in `LOGS.md`.

---

## MA1 — Scaffold, theme, models

**Goal:** an empty app with NIWA's look, typed models, and CI.

### MA1.P1 — Project
- [x] `flutter create --org works.moeko --project-name niwa --platforms android,ios .` inside `flutter_app/`
- [x] Lints: `very_good_analysis` + `analysis_options.yaml` with strict casts/inference/raw types
- [x] Dependencies from the stack table; `build_runner` for freezed/json/drift/riverpod generators (`flutter_quill` → MA6, `flutter_local_notifications` → MA7)
- [x] Folder layout (`lib/app`, `lib/core`, `lib/features`) + `main.dart` with `ProviderScope`
- [x] `--dart-define`: `APP_ENV` (local, staging, prod), `API_BASE` (no Gradle flavors yet)
- [x] Update root `.gitignore`, `CODEMAP.md` (§ flutter_app), `flutter_app/README.md`

### MA1.P2 — Theme from tokens
- [x] `packages/tokens/scripts/generate-dart.ts` → `flutter_app/lib/core/theme/tokens.g.dart` (palettes light/dark, type colours, shape, spacing, typography)
- [x] `pnpm tokens:dart` + `pnpm tokens:dart:check` (CI fails if the Dart file is stale) — in `ci.yml` `check` job
- [x] `ThemeData` light + dark (Material 3) built from tokens; follows system theme, overridable via `themeModeProvider` (Settings UI + persistence in MA9)
- [x] Test: contrast of text on primary/secondary/surface ≥ 4.5:1 (port of `contrast.test.ts`, `test/theme_test.dart`)

### MA1.P3 — Models
- [x] freezed models: `User`, `AuthResponse`, `Workspace`, `Item` / `ItemSummary`, `Link` / `LinkWithItem`, `ScheduleEntry`, `SearchHit`, `Attachment`, `ErrorEnvelope` / `ApiError` (`lib/core/models/`). No `ScheduleSeries`: the contract has none (occurrences share `seriesId`)
- [x] Enums with unknown-value fallback (a newer server must not crash an older app)
- [x] Contract check as `test/contract_test.dart`: fixtures match `openapi.yaml` and round-trip; per field, nullability, optionality and every enum value are probed through the model
- [x] JSON fixtures (`test/fixtures/<Schema>.json`, hand-written to the contract); round-trip tests (`fromJson` → `toJson`)

### MA1.P4 — CI
- [x] `.github/workflows/flutter.yml` (written 2026-11-04; first run on push): on changes in `flutter_app/`, `packages/tokens/`, `packages/contracts/` → `flutter analyze`, `dart format --set-exit-if-changed`, `flutter test` (includes the contract check), tokens check, generated code up to date (`build_runner` + `git diff --exit-code`), `flutter build apk --debug`

**Exit criteria:** app launches on the emulator showing a themed placeholder in light and dark; CI green.

---

## MA2 — API client & auth

**Goal:** sign in and stay signed in, safely.

### MA2.P1 — HTTP client
- [x] Dio instance: base URL from `API_BASE`, `X-Client: mobile`, JSON, timeouts (60 s receive for Render cold starts), request id (`lib/core/api/api_client.dart`)
- [x] Error mapping: envelope → typed `ApiException` (code, message, details, requestId, `Retry-After`); network/timeout → `OfflineException(timedOut)`
- [x] Bearer auth with **single-flight refresh** on 401 (explicit wrapper around Dio, not an interceptor) (one refresh at a time, queued requests retried once) — same behaviour as `@niwa/api-client`
- [x] Typed repositories per area (auth in `ApiClient`; items + tags, links, schedule, inbox, search, uploads, workspace in `lib/features/*/data/`) — mirror `packages/api-client/src/index.ts`; `Change<T>` for clear-vs-omit in PATCH bodies
- [x] Unit tests with a fake adapter (`test/api_client_test.dart`): refresh rotation, concurrent 401s, reuse → signed out

### MA2.P2 — Session
- [x] Refresh token in `flutter_secure_storage` (Android Keystore / iOS Keychain, `first_unlock_this_device`); never logged
- [x] Access token in memory only; restore session on launch via `/auth/refresh`
- [x] Session provider (Riverpod): `unknown → signedOut | signedIn(user) | unavailable(error)` (`lib/core/auth/session.dart`); router redirects in `lib/app/router.dart` (`redirectFor`)
- [x] Logout clears secure storage + in-memory session (local DB → MA5, notifications → MA7)
- [x] Refresh on app resume if the access token is near expiry (1-minute margin)

### MA2.P3 — Screens
- [x] Login and Register (respects `REGISTRATION_MODE` errors), form validation matching contract rules (`lib/features/auth/ui/`, `lib/core/util/validators.dart`)
- [x] Friendly errors: wrong password, rate-limited (429 with retry time), offline, server down (Render cold start → "waking up" message; launch failure → Not connected screen with Try again) — `lib/core/api/error_message.dart`

**Exit criteria:** register/login/logout/restart-and-still-signed-in work against `pnpm dev:memory`; tests green.

---

## MA3 — App shell & navigation

**Goal:** the phone layout from `docs/CONCEPT.md` §1 (bottom navigation, lens homes), built natively.

### MA3.P1 — Routing
- [x] go_router with a `StatefulShellRoute` (one stack per tab): Knowledge, Actionable, Scheduler, Inbox, Search (`lib/app/router.dart`, `app_shell.dart`)
- [x] Routes mirror web paths (`/knowledge/:id`, `/knowledge/review`, `/actionable/:id`, `/items/:id` → lens, `/scheduler/:view/:date`, `/inbox`, `/search?q=`, `/settings/:section`) so links and deep links share one shape; tab screens are placeholders until MA4–MA8
- [x] Guards: signed-out → login (target kept as `?from=`); Android back pops within the tab, then goes to the first tab, then leaves
- [x] Deep links `niwa://open/<path>` (Android intent filter, iOS URL type) to items and `#anchor`s — not yet tried on a device; https app links later

### MA3.P2 — Shell
- [x] Bottom navigation bar with Inbox count badge; top app bar with search + account menu (email, Settings, Log out)
- [x] Capture FAB available from every tab — basic sheet (title + type → Inbox); MA8 extends it
- [x] Snackbar service with **Undo** (`lib/core/ui/snackbars.dart`, root ScaffoldMessenger)
- [x] Empty, loading (skeletons) and error states as shared widgets (`lib/core/ui/state_views.dart`)

**Exit criteria:** every tab reachable, back stack correct, badge updates, golden tests for shell in light/dark.
_Status 2026-11-04: all but goldens covered by `test/shell_test.dart`; goldens open (generate on one fixed machine / CI, since they're font-dependent)._

---

## MA4 — Items, tree & Actionable

**Goal:** full item hierarchy behaviour (specs §3–§7, DATA_MODEL.md §2–§6) on a phone.

### MA4.P1 — Tree browsing
- [x] Lens home = drill-down list of the tree filtered by lens (visible vs dimmed rules from `treeModel.ts`) — `LensTree`, item screen children
- [x] Item rows: type icon, title, status, due (overdue), child count; long-press menu (`item_row.dart`, `item_menu.dart`)
- [x] Breadcrumb path; open item view
- [x] Port `treeModel.ts` logic to Dart (`buildTree`, `ancestorsOf`, `lensView`, moves) with the same unit tests, plus `reorderMove` / `moveTargetProblem`

### MA4.P2 — Item view & fields
- [x] Item view: editable title, chips (type, status, priority, due, review, tags, archived), children list, content (read view until MA6)
- [x] Field editing sheet: type, status, priority, due date, review date, tags (autocomplete from `/tags`, contract normalisation)
- [x] Updates with `version`; **409 VERSION_CONFLICT** → reload + "changed elsewhere" notice (optimistic for Focus completion and reorder)

### MA4.P3 — Structure changes
- [x] Create child / sibling (server mints `orderKey`)
- [x] Reorder by drag handle in the children list (`ReorderableListView`) → `/items/:id/move`; Move up/down in the menu as the non-drag path
- [x] Move-to picker (cycle-safe; disabled targets explained)
- [x] Archive / unarchive (Undo); delete with Undo (restore batch, confirm when it has children); restore notice when the parent is gone (→ Inbox)

### MA4.P4 — Actionable lens
- [x] Focus sections from `/focus` (web order and copy: Overdue, In progress, High priority, Upcoming, Recently updated)
- [x] Complete checkbox with optimistic state (same rule as web `FocusView`)

**Exit criteria:** tree/Actionable scenarios from `web_app/e2e/tree.spec.ts` pass as widget/integration tests.

---

## MA5 — Local cache & offline

**Goal:** opens instantly, readable on a train, capture never lost.

### MA5.P1 — Drift database
- [x] Tables: `cache_entries` (response snapshots by request key: `tree`, `item:<id>`, `inbox`, `focus:<day>`, `tags`, `session:user`) and `outbox` — decision 2026-11-04: snapshots instead of normalised per-type tables until offline editing; schedule ranges join with MA7, links with MA6
- [x] Providers read cache first, then network (stale-while-revalidate, `cachedThenFresh`); a failed refresh keeps the cached copy
- [x] Wipe on logout (and on revoked-token sign-out); schema v1 creation tested — migration tests start with v2

### MA5.P2 — Connectivity
- [x] connectivity_plus + a real reachability check (`/health`, re-probed every 20 s while offline); offline banner above the bottom bar
- [x] Writes while offline: blocked with a clear message **except** capture (MA5.P3); launch offline opens signed in as the cached user

### MA5.P3 — Offline capture queue
- [x] Captures go to the outbox first, then `POST /inbox` in order when online (the web has no queue; rules defined in `capture_queue.dart`)
- [x] Retries with backoff (2 s doubling, ≤ 5 min, or `Retry-After`); 4xx failures surface in Inbox with "Retry" / "Discard"
- [x] Idempotency: client-generated id per capture so a retried request can't duplicate — contract `CaptureInput.clientId` (UUID) + backend `captureClientId` (unique per workspace, race-safe)

**Exit criteria:** airplane-mode test: open app → browse cached tree/notes/schedule → capture 3 items → reconnect → all 3 appear once, in order.
_Status 2026-11-04: passes as `test/offline_test.dart` (tree + notes; schedule caching lands with MA7). Real-device airplane-mode run pending._

---

## MA6 — Notes editor (flutter_quill)

**Goal:** read and edit note bodies on mobile without ever losing web-only content.

### MA6.P1 — Format converter (core risk — do first)
- [x] `ProseMirrorDelta` converter in pure Dart: PM JSON → Delta and Delta → PM JSON (`lib/features/knowledge/domain/pm_delta.dart`)
- [x] Supported: paragraph, heading 1–3 (**keeps `anchorId`** via a zero-width `niwaAnchor` embed — Quill drops unknown line attributes), bold, italic, strike, underline, inline code, link, bullet/ordered list (nested), blockquote, code block, hard break, horizontal rule, `niwaLink` (embed), image with `attachmentId` (embed)
- [x] Anything else → a **locked block embed** that stores the original PM JSON and writes it back unchanged ("Edit on web or desktop"). Also locked: shapes Quill can't hold (multi-paragraph list items, quotes with lists, code blocks with a language, ordered lists not starting at 1, non-default link attrs, same-kind blocks right after each other)
- [x] Golden round-trip tests on fixtures exported from the web editor (`web_app/.../editorFixtures.test.ts` → `flutter_app/test/fixtures/editor/`, checked in CI): `PM → Delta → Quill Document → Delta → PM` is identical for supported content and byte-identical for locked blocks
- [x] Heading anchors survive edits (same uniqueness rule as web `AnchorGuard`; an anchor deleted by accident is restored by heading text)

### MA6.P2 — Editor screen
- [x] flutter_quill editor with a compact toolbar (headings, bold/italic/strike/underline, inline code, lists, indent, quote, code block, link, undo/redo); H4+ clamped to H3
- [x] Autosave: debounced, versioned, conflict pause (keep mine / load latest) — same rules as web `useAutosave.ts`; offline → "Not saved — offline", retried
- [x] Outline sheet (headings → jump); deep-link to `#anchor` scrolls there (item read view)
- [x] Read-only mode for archived items (and while offline, per MA5)

### MA6.P3 — Links
- [x] `[[` picker (or the link button): search items, then `→` for sections (same as web `LinkPicker`)
- [x] niwaLink chips show live titles, section names and a "missing" state; tap opens the item/section
- [x] Links panel: content links, related (add/remove), backlinks
- [x] Promote section to child item (from the outline)

**Exit criteria:** a note written on web with every feature opens, edits and saves on mobile, then reopens on web with nothing lost (manual + automated round-trip).
_Status 2026-11-04: automated round-trip passes (`pm_delta_test.dart`, `note_editor_test.dart`); manual web → phone → web check pending a device build._

---

## MA7 — Scheduler

**Goal:** month + day views (specs §8; SCHEDULER.md) with phone-friendly interactions.

### MA7.P1 — Views
- [x] Month view: 6-week grid (Monday first), chips per day (+n), tap a day → day view
- [x] Day view: time grid with overlap columns and now line (port `layout.ts` + tests); all-day row. Week view uses the same grid with 7 columns
- [ ] Agenda list (next 14 days) — not built; the tab opens on the day view, as the web does on phones
- [x] Time zone math matches the server: series are computed server-side from the anchor; `lib/dates.ts` ported (`calendar.dart`, calendar-day arithmetic) with the same tests; device IANA zone (flutter_timezone) sent with writes

### MA7.P2 — Editing
- [x] Entry sheet: event / item block, title, start/end, all-day, colour (tokens), repeat (daily/weekly/monthly), scope (this / this and following), delete
- [x] Long-press + drag in day/week view to move (across days in week); drag bottom edge to resize (15-min snap, min 15); tap an empty slot to create; month → move via sheet
- [x] "Schedule time" from an item; upcoming blocks on the item view (actionable items)

### MA7.P3 — Reminders
- [x] flutter_local_notifications: reminder per entry or per series (opt-in, 10 min, stored on the phone — Drift v2 `reminders`), rescheduled for the next 14 days when entries or reminders change and at launch; cancelled on logout
- [x] Android 13+ notification permission asked when the first reminder is turned on; inexact alarms, so no exact-alarm permission. Desugaring + boot receivers configured

**Exit criteria:** scenarios from `web_app/e2e/scheduler.spec.ts` (create, move, resize, repeat scopes, item block) pass as integration tests.
_Status 2026-11-04: pass as widget tests (`test/scheduler_flow_test.dart`); real-device notification check pending._

---

## MA8 — Inbox, capture & search

### MA8.P1 — Capture
- [x] Capture sheet from the FAB: title, type chips, optional details (one paragraph per line), suggested parent = the item on screen; Enter/Save closes, "Save & next" keeps it open ("N captured", then "Captured N items to Inbox"); all through the offline queue (Drift v3 adds body + suggested parent)
- [ ] Android quick-settings tile / app shortcut "Capture" (stretch)
- [ ] Share-to-NIWA intent: shared text/URL becomes a capture (stretch)

### MA8.P2 — Inbox
- [x] Newest-first list with suggestion chip; multi-select; file (parent with path, type or keep each, due, tags) single and bulk with "Open"; delete with Undo, single and bulk (one Undo restores all)

### MA8.P3 — Search
- [x] Debounced search with highlights, path, tags, base filter, archived toggle (same URL params as the web); recent searches (local); offline → saved titles/tags

**Exit criteria:** scenarios from `web_app/e2e/inbox-search.spec.ts` pass as integration tests.
_Status 2026-11-04: pass as widget tests (`test/inbox_search_test.dart`). Stretch items (quick-settings tile, share intent) not built._

---

## MA9 — Settings, Trash & images

- [ ] Settings: appearance (system/light/dark), account (email, sign out, sign out everywhere), about/version
- [ ] Trash: list, restore, delete permanently (confirm)
- [ ] Images in notes: pick from camera/gallery → `POST /uploads/sign` → direct upload to Cloudinary (Dio multipart) → `POST /attachments`; alt-text prompt; disabled when `/uploads/config` says off
- [ ] Image display with `f_auto,q_auto` + width transformation for phone screens; cached

**Exit criteria:** an image added on mobile shows on web and vice versa; orphan rules unchanged (server-side).

---

## MA10 — Quality: accessibility, tests, performance

### MA10.P1 — Accessibility
- [ ] Semantics labels on every control; names match visible text (same rule as web)
- [ ] Text scaling to 200% without clipping; touch targets ≥ 48 dp
- [ ] TalkBack pass over every screen (checklist in `LOGS.md`)
- [ ] Contrast from tokens (MA1.P2 test) in both themes

### MA10.P2 — Tests
- [ ] Unit: converters, tree model, dates/layout, refresh interceptor, outbox
- [ ] Widget + golden tests for main screens (light/dark, phone + small tablet)
- [ ] `integration_test` against `pnpm dev:memory` on an Android emulator — CI job (emulator runner)

### MA10.P3 — Performance
- [ ] 5,000-item tree: drill-down lists stay smooth (lazy lists, memoised lens view), cold start < 2 s on a mid-range phone
- [ ] Shares findings with the web large-tree pass (`GAPS.md`)

**Exit criteria:** parity checklist green; no TalkBack blockers; CI green including integration tests.

---

## MA11 — Release

### MA11.P1 — Android
- [ ] App icon, splash, name; versioning from git tag
- [ ] Release signing (upload key kept out of git; GitHub secret for CI)
- [ ] `flutter build appbundle` in CI; Play Console internal testing track
- [ ] Privacy policy / data safety form (single-user, own server)

### MA11.P2 — iOS (after Android)
- [ ] Mac or macOS CI runner; Apple developer account
- [ ] Keychain access group, notification entitlement, TestFlight build

**Exit criteria:** owner uses the Android build daily against prod for a week with no data loss.

---

## Parity checklist (specs §10.1)

| Area | Web | Mobile target |
|---|---|---|
| Auth, session restore, logout | ✅ | MA2 |
| Tree, lens filtering, item fields, move/reorder, archive, delete/restore | ✅ | MA4 |
| Focus | ✅ | MA4 |
| Note editor, headings/anchors, `[[` links, backlinks, promote, review queue | ✅ | MA6 (+ review list in MA6.P3) |
| Scheduler month/week | ✅ | MA7 (month + day + agenda) |
| Recurrence + scopes, item blocks | ✅ | MA7 |
| Inbox capture/file, search | ✅ | MA8 |
| Images | ✅ | MA9 |
| Trash, appearance | ✅ | MA9 |
| Offline read + capture | — | MA5 (mobile-only extra) |
| Reminders | — | MA7.P3 (mobile-only extra) |
| Graph | M11 | simplified or deferred (documented exception) |
| Command palette | web/desktop | not on mobile (documented exception) |

## Backend / contract changes this plan needs

| Change | For | Milestone |
|---|---|---|
| `clientId` on `POST /inbox` (idempotent capture) | offline queue | MA5.P3 |
| Optional: `GET /items/changes?since=` (delta sync) | faster cache refresh | MA5 (only if full reloads are slow) |
| Optional: reminder offset field on schedule entries | reminders synced across devices | MA7.P3 |

## Open questions for owner

- [ ] Bundle id `works.moeko.niwa` OK? App display name "NIWA"?
- [ ] iOS now or after Android ships?
- [ ] Offline scope: is read cache + offline capture enough for v1?
- [ ] Reminder default (off / 10 min before)?
- [ ] Scheduler tab default on phones: agenda or month?

## Change log

| Date | Change |
|---|---|
| 2026-11-04 | Plan A-02 created; mobile prioritised over desktop and AI. |
