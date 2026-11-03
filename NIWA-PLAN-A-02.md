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
| MA0 | Toolchain & decisions | ⬜ | — |
| MA1 | Scaffold, theme, models | ⬜ | MA0 |
| MA2 | API client & auth | ⬜ | MA1 |
| MA3 | App shell & navigation | ⬜ | MA2 |
| MA4 | Items, tree & Actionable | ⬜ | MA3 |
| MA5 | Local cache & offline | ⬜ | MA4 |
| MA6 | Notes editor (flutter_quill) | ⬜ | MA4 |
| MA7 | Scheduler | ⬜ | MA4 |
| MA8 | Inbox, capture & search | ⬜ | MA4 (MA5 for offline capture) |
| MA9 | Settings, Trash & images | ⬜ | MA6 |
| MA10 | Quality: accessibility, tests, performance | ⬜ | MA4–MA9 |
| MA11 | Release (Android first, then iOS) | ⬜ | MA10 |

**Exit criteria (whole plan):** the app passes the parity checklist (§ at the end) against the same backend
as the web app; graph and command palette are the documented exceptions (specs §10.1).

---

## Key decisions (proposed — confirm in MA0)

| Topic | Proposal | Why |
|---|---|---|
| Platforms | **Android first**; iOS after (needs a Mac or a macOS CI runner + Apple developer account) | Dev machine is Windows |
| Stack | Flutter 3.x / Dart 3.x, Riverpod 3, go_router, Dio, freezed + json_serializable, Drift, flutter_secure_storage, connectivity_plus, flutter_local_notifications, flutter_quill (specs §11.5) | Fixed by specs |
| Folder layout | feature-first: `lib/app/`, `lib/core/` (api, auth, db, theme, util), `lib/features/<feature>/{data,ui}` | Mirrors `web_app/src/features` so the two codebases are easy to compare |
| Models | Hand-written **freezed** models per contract schema, kept honest by a **contract check** script that compares Dart model fields against `openapi.yaml` (runs in CI) | Generated Dart clients from OpenAPI are heavy and awkward with Zod's unions; a check stops drift |
| Design tokens | Generate `lib/core/theme/tokens.g.dart` from `@niwa/tokens` with a Node script + `--check` mode in CI | One token source (specs §10.1) |
| Auth transport | `X-Client: mobile`; refresh token returned in the body, stored in `flutter_secure_storage`; access token in memory only (specs §12.1) | Already supported by the backend |
| Offline | **Phase 1:** read cache (Drift) for tree, items, inbox, schedule range + **offline capture queue**. **Later:** full offline editing with an outbox | Capture is the main mobile write; full offline edits need conflict UX |
| Editor | flutter_quill with a **ProseMirror JSON ⇄ Quill Delta converter**; nodes it can't edit are kept as locked blocks and written back unchanged | Content stays ProseMirror JSON on the server (specs §12.4); nothing is lost by editing on a phone |
| API base | `--dart-define=API_BASE=…`; prod calls Render directly (no Vercel rewrite needed for native) | Native apps don't need the cookie same-site trick |
| Bundle id | `works.moeko.niwa` (proposal) | Owner to confirm |

---

## MA0 — Toolchain & decisions

**Goal:** a machine that can build and run the app, and the open questions answered.

### MA0.P1 — Toolchain
- [ ] Install Flutter SDK (stable 3.x) and add it to `PATH`; `flutter doctor` clean for Android
- [ ] Android Studio + Android SDK + an emulator (API 34+); USB debugging on a real phone (optional)
- [ ] VS Code Flutter/Dart extensions
- [ ] Decide iOS timing (Mac / CI runner, Apple developer account)

### MA0.P2 — Decisions
- [ ] Confirm the decisions table above (bundle id, offline scope, Android first)
- [ ] Minimum Android version (proposal: API 26 / Android 8)
- [ ] Notifications for scheduler entries: on by default? (proposal: opt-in per entry, default reminder 10 min)

**Exit criteria:** `flutter doctor` passes for Android; decisions recorded in `LOGS.md`.

---

## MA1 — Scaffold, theme, models

**Goal:** an empty app with NIWA's look, typed models, and CI.

### MA1.P1 — Project
- [ ] `flutter create --org works.moeko --project-name niwa --platforms android,ios .` inside `flutter_app/`
- [ ] Lints: `flutter_lints` (or `very_good_analysis`) + `analysis_options.yaml` with strict casts/inference
- [ ] Dependencies from the stack table; `build_runner` for freezed/json/drift/riverpod generators
- [ ] Folder layout (`lib/app`, `lib/core`, `lib/features`) + `main.dart` with `ProviderScope`
- [ ] Flavors / `--dart-define`: `APP_ENV` (local, staging, prod), `API_BASE`
- [ ] Update root `.gitignore`, `CODEMAP.md` (§ flutter_app), `flutter_app/README.md`

### MA1.P2 — Theme from tokens
- [ ] `packages/tokens/scripts/generate-dart.ts` → `flutter_app/lib/core/theme/tokens.g.dart` (palettes light/dark, type colours, shape, spacing, typography)
- [ ] `pnpm tokens:dart` + `pnpm tokens:dart:check` (CI fails if the Dart file is stale)
- [ ] `ThemeData` light + dark (Material 3) built from tokens; follows system theme, overridable in Settings
- [ ] Widget test: contrast of text on primary/secondary/surface ≥ 4.5:1 (port of `contrast.test.ts`)

### MA1.P3 — Models
- [ ] freezed models: `User`, `Workspace`, `Item` / `ItemSummary`, `Link`, `ScheduleEntry`, `ScheduleSeries` rule, `SearchHit`, `Attachment`, error envelope (`ApiError` codes from `common.ts`)
- [ ] Enums with unknown-value fallback (a newer server must not crash an older app)
- [ ] `tool/contract_check.dart` (or Node script): every schema/field in `openapi.yaml` used by the app has a matching Dart field and type
- [ ] JSON fixtures copied from backend responses; round-trip tests (`fromJson` → `toJson`)

### MA1.P4 — CI
- [ ] `.github/workflows/flutter.yml`: on changes in `flutter_app/`, `packages/tokens/`, `packages/contracts/` → `flutter analyze`, `dart format --set-exit-if-changed`, `flutter test`, tokens + contract checks, `flutter build apk --debug`

**Exit criteria:** app launches on the emulator showing a themed placeholder in light and dark; CI green.

---

## MA2 — API client & auth

**Goal:** sign in and stay signed in, safely.

### MA2.P1 — HTTP client
- [ ] Dio instance: base URL from `API_BASE`, `X-Client: mobile`, JSON, timeouts, request id
- [ ] Error mapping: envelope → typed `ApiException` (code, message, details); network/timeout → `OfflineException`
- [ ] Bearer interceptor with **single-flight refresh** on 401 (one refresh at a time, queued requests retried once) — same behaviour as `@niwa/api-client`
- [ ] Typed repositories per area (auth, items, links, schedule, inbox, search, uploads) — mirror `packages/api-client/src/index.ts`
- [ ] Unit tests with a mock adapter: refresh rotation, concurrent 401s, reuse → signed out

### MA2.P2 — Session
- [ ] Refresh token in `flutter_secure_storage` (Android Keystore / iOS Keychain); never logged
- [ ] Access token in memory only; restore session on launch via `/auth/refresh`
- [ ] Session provider (Riverpod): `unknown → signedOut | signedIn(user)`; router redirects on change
- [ ] Logout clears secure storage + local DB (MA5) + notifications
- [ ] Refresh on app resume if the access token is near expiry

### MA2.P3 — Screens
- [ ] Login and Register (respects `REGISTRATION_MODE` errors), form validation matching contract rules
- [ ] Friendly errors: wrong password, rate-limited (429 with retry time), offline, server down (Render cold start → "Waking the server…" with retry)

**Exit criteria:** register/login/logout/restart-and-still-signed-in work against `pnpm dev:memory`; tests green.

---

## MA3 — App shell & navigation

**Goal:** the phone layout from `docs/CONCEPT.md` §1 (bottom navigation, lens homes), built natively.

### MA3.P1 — Routing
- [ ] go_router with a `StatefulShellRoute` (one stack per tab): Knowledge, Actionable, Scheduler, Inbox, Search
- [ ] Routes mirror web paths (`/knowledge/:id`, `/actionable/:id`, `/scheduler/:view/:date`, `/inbox`, `/search?q=`, `/settings/...`) so links and deep links share one shape
- [ ] Guards: signed-out → login; Android back button behaves per tab
- [ ] Deep links (`niwa://` + later app links) to items and section anchors

### MA3.P2 — Shell
- [ ] Bottom navigation bar with Inbox count badge; top app bar with search + account menu
- [ ] Capture FAB available from every tab (opens MA8 capture sheet)
- [ ] Snackbar service with **Undo** (used by delete, archive, file)
- [ ] Empty, loading (skeletons) and error states as shared widgets

**Exit criteria:** every tab reachable, back stack correct, badge updates, golden tests for shell in light/dark.

---

## MA4 — Items, tree & Actionable

**Goal:** full item hierarchy behaviour (specs §3–§7, DATA_MODEL.md §2–§6) on a phone.

### MA4.P1 — Tree browsing
- [ ] Lens home = drill-down list of the tree filtered by lens (visible vs dimmed rules from `treeModel.ts`)
- [ ] Item rows: type icon, title, status, due, child count; long-press menu
- [ ] Breadcrumb path; open item view
- [ ] Port `treeModel.ts` logic to Dart (`buildTree`, `ancestorsOf`, `lensView`) with the same unit tests

### MA4.P2 — Item view & fields
- [ ] Item view: editable title, chips (type, status, priority, due, tags, archived), children list, content (read view until MA6)
- [ ] Field editing sheet: type, status, priority, due date, review date, tags (autocomplete from `/tags`)
- [ ] Optimistic updates with `version`; **409 VERSION_CONFLICT** → reload + "changed elsewhere" notice

### MA4.P3 — Structure changes
- [ ] Create child / sibling (server mints `orderKey`)
- [ ] Reorder by drag handle in the children list (`ReorderableListView`) → `/items/:id/move`
- [ ] Move-to picker (cycle-safe; disabled targets explained)
- [ ] Archive / unarchive; delete with Undo (restore batch); restore notice when the parent is gone (→ Inbox)

### MA4.P4 — Actionable lens
- [ ] Focus sections (Overdue, Today, In progress, Up next…) from `/focus`
- [ ] Complete checkbox with optimistic state (same rule as web `FocusView`)

**Exit criteria:** tree/Actionable scenarios from `web_app/e2e/tree.spec.ts` pass as widget/integration tests.

---

## MA5 — Local cache & offline

**Goal:** opens instantly, readable on a train, capture never lost.

### MA5.P1 — Drift database
- [ ] Tables: items (summary + content JSON), links, schedule entries (by range), inbox, tags, outbox
- [ ] Repositories read cache first, then network (stale-while-revalidate); Riverpod providers expose both
- [ ] Wipe on logout; schema migrations tested

### MA5.P2 — Connectivity
- [ ] connectivity_plus + a real reachability check (`/health`); offline banner
- [ ] Writes while offline: blocked with a clear message **except** capture (MA5.P3)

### MA5.P3 — Offline capture queue
- [ ] Captures go to the outbox first, then `POST /inbox` in order when online (same queue rules as web `CaptureProvider`)
- [ ] Retries with backoff; failures surface in Inbox with "Retry" / "Discard"
- [ ] Idempotency: client-generated id per capture so a retried request can't duplicate — **needs a contract addition** (`clientId` on capture, unique per workspace)

**Exit criteria:** airplane-mode test: open app → browse cached tree/notes/schedule → capture 3 items → reconnect → all 3 appear once, in order.

---

## MA6 — Notes editor (flutter_quill)

**Goal:** read and edit note bodies on mobile without ever losing web-only content.

### MA6.P1 — Format converter (core risk — do first)
- [ ] `ProseMirrorDelta` converter in pure Dart: PM JSON → Delta and Delta → PM JSON
- [ ] Supported: paragraph, heading 1–3 (**keeps `anchorId`**), bold, italic, strike, inline code, link, bullet/ordered list, blockquote, code block, hard break, horizontal rule, `niwaLink` (embed), image with `attachmentId` (embed)
- [ ] Anything else → a **locked block embed** that stores the original PM JSON and writes it back unchanged ("Edit on web/desktop")
- [ ] Golden round-trip tests on fixtures exported from the web editor (every node/mark combo): `PM → Delta → PM` is identical for supported content and byte-identical for locked blocks
- [ ] Heading anchors survive edits (same uniqueness rule as web `AnchorGuard`)

### MA6.P2 — Editor screen
- [ ] flutter_quill editor with a compact toolbar (headings, bold/italic, lists, quote, code, link)
- [ ] Autosave: debounced, versioned, conflict pause — same rules as web `useAutosave.ts`
- [ ] Outline sheet (headings → jump); deep-link to `#anchor` scrolls there
- [ ] Read-only mode for archived items

### MA6.P3 — Links
- [ ] `[[` picker: search items, then `→` for sections (same as web `LinkPicker`)
- [ ] niwaLink chips show live titles, section names and a "missing" state
- [ ] Links panel: content links, related (add/remove), backlinks
- [ ] Promote section to child item

**Exit criteria:** a note written on web with every feature opens, edits and saves on mobile, then reopens on web with nothing lost (manual + automated round-trip).

---

## MA7 — Scheduler

**Goal:** month + day views (specs §8; SCHEDULER.md) with phone-friendly interactions.

### MA7.P1 — Views
- [ ] Month view: 6-week grid, dots/chips per day, tap a day → day agenda
- [ ] Day view: time grid with overlap columns and now line (port `layout.ts` + tests); all-day row
- [ ] Agenda list (next 14 days) as the Scheduler tab's default on phones (proposal)
- [ ] Time zone math matches the server (series computed from anchor; DST-safe) — port `lib/dates.ts` helpers with the same tests

### MA7.P2 — Editing
- [ ] Entry sheet: event / item block, title, start/end, all-day, colour (tokens), repeat (daily/weekly/monthly), scope (this / this and following), delete
- [ ] Long-press + drag in day view to move; drag bottom edge to resize (15-min snap); month → move via sheet
- [ ] "Schedule time" from an item; upcoming blocks on the item view

### MA7.P3 — Reminders
- [ ] flutter_local_notifications: reminder per entry (default from MA0.P2), rescheduled when entries change or sync
- [ ] Android 13+ notification permission flow; exact-alarm permission only if needed

**Exit criteria:** scenarios from `web_app/e2e/scheduler.spec.ts` (create, move, resize, repeat scopes, item block) pass as integration tests.

---

## MA8 — Inbox, capture & search

### MA8.P1 — Capture
- [ ] Capture sheet from the FAB: title, type chips, optional details; Enter saves, "save & next" keeps it open
- [ ] Android quick-settings tile / app shortcut "Capture" (stretch)
- [ ] Share-to-NIWA intent: shared text/URL becomes a capture (stretch)

### MA8.P2 — Inbox
- [ ] Newest-first list with suggestion chip; multi-select; file (parent with path, type, due, tags); delete with Undo

### MA8.P3 — Search
- [ ] Debounced search with highlights, path, tags, base filter, archived toggle; recent searches (local)

**Exit criteria:** scenarios from `web_app/e2e/inbox-search.spec.ts` pass as integration tests.

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
