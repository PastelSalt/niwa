# NIWA — Action Log

**Role of this file:** a chronological, append-only record of every meaningful action taken on the project (files created, decisions made, milestones/phases completed, problems hit).
**Rules:**
- Newest entries at the **bottom**. Never rewrite past entries — add a correction entry instead.
- One entry per session or logical unit of work.
- Reference the plan task (`M#.P#`) and any files touched.
- Record decisions and their reason, not just actions.
- Never log secrets, tokens, passwords, or note content.

**Entry template:**

```markdown
### YYYY-MM-DD — <short title>
- **Plan ref:** M#.P#
- **Actions:** what was done
- **Files:** created / modified / removed
- **Decisions:** what was decided and why (if any)
- **Verified:** how it was checked (tests, ran locally, n/a)
- **Next:** what comes after
```

---

## Log

### 2026-11-03 — Project bootstrap (docs only, no code)
- **Plan ref:** M0.P1
- **Actions:** Created the root folder structure and the four root documents.
- **Files:**
  - created `backend/` (empty)
  - created `frontend/` (empty)
  - created `PROJECT-SPECS.md` — concept source of truth (from ratified NIWA spec)
  - created `NIWA-PLAN-A-01.md` — milestones M0–M12 with phases and tasks
  - created `CODEMAP.md` — current + planned code layout
  - created `LOGS.md` — this file
- **Decisions:**
  - Local layout uses `backend/` + `frontend/` instead of `apps/api` + `apps/web`; mapping recorded in `PROJECT-SPECS.md` and `CODEMAP.md`.
  - Placement of shared packages, desktop, and mobile deferred to M0.P3.
  - Work stays local; no remote repo for now.
- **Verified:** n/a (documentation only)
- **Next:** M0.P2 (concept docs) and M0.P3 (scaffold decisions, local `git init`).

### 2026-11-03 — Concept docs, hosting decisions, git setup
- **Plan ref:** M0.P2 (drafted), M0.P3 (done except first push)
- **Actions:**
  - Wrote the three detail docs required before M2–M4.
  - Recorded owner's hosting decisions and pure-MUI rule in the specs.
  - Added root config files; initialized git and connected the GitHub remote (remote is empty; nothing committed or pushed yet).
- **Files:**
  - created `docs/CONCEPT.md`, `docs/DATA_MODEL.md`, `docs/OPS.md`
  - created `.nvmrc` (24), `.gitignore`, `.gitattributes`, `.editorconfig`, `backend/.gitkeep`, `frontend/.gitkeep`
  - modified `PROJECT-SPECS.md` (added §11.7 Pure MUI rule, §11.8 Hosting, folder mapping note, docs index)
  - modified `NIWA-PLAN-A-01.md` (M0.P2/P3 status, new M1.P2b + M2.P1b hosting phases, pure-MUI lint task)
  - modified `CODEMAP.md` (current tree, final folder mapping, conventions)
- **Decisions:**
  - Hosting: backend → **Render**, frontend → **Vercel**, DB → **MongoDB Atlas**, images → **Cloudinary**, Redis → **Render Key Value**. (Owner decision.)
  - Frontend is **pure MUI** — MUI + MUI X only, styled via theme/`sx`/`styled()`; TipTap and React Flow allowed but themed through MUI. (Owner decision.)
  - Web client reaches the API through a **Vercel `/api/*` rewrite** so the refresh cookie is first-party (`SameSite=Lax`) — avoids third-party-cookie blocking between `vercel.app` and `onrender.com`.
  - Shared packages in `packages/` at root; `desktop/` and `mobile/` at root later; one pnpm workspace.
  - Node **24 LTS** (matches local `v24.22.0`); pnpm via Corepack.
  - Git default branch `main`; remote `origin` = `https://github.com/PastelSalt/niwa-site.git`.
- **Verified:** `git remote -v` shows origin; `git ls-remote` returned no refs (empty remote).
- **Next:** Owner reviews open questions in the three docs → first commit + push → M0.P4 (API contract v0.1).

### 2026-11-03 — M0.P4 API contract v0.1 + M1 foundation (backend + auth)
- **Plan ref:** M0.P4, M1.P1, M1.P2, M1.P2b (render.yaml only), M1.P3, M1.P4 (contracts, tokens), M1.P5
- **Actions:**
  - Set up the pnpm workspace with shared TS/ESLint/Prettier config and a CI workflow.
  - Built `@niwa/contracts`: Zod schemas for every domain object and a registry of all 46 API operations; generates `openapi.yaml` (OpenAPI 3.1).
  - Built `@niwa/tokens` (light/dark palettes, type colors, typography, shape).
  - Built the backend skeleton (Express 5, Mongoose 9, ioredis, helmet, CORS, rate limiting, Pino with redaction, central error envelope, health check).
  - Implemented auth: register/login/refresh/logout/me + workspace endpoint, default workspace with the four root containers.
  - Added `render.yaml`, `backend/.env.example`.
- **Files:** created `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.base.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `render.yaml`, `.github/workflows/ci.yml`, `packages/contracts/**`, `packages/tokens/**`, `backend/**` (see `CODEMAP.md` §3–5); removed `backend/.gitkeep`; modified `docs/OPS.md` (env vars, Render build/start), `NIWA-PLAN-A-01.md`, `CODEMAP.md`.
- **Decisions:**
  - **No TS build step:** erasable-only TypeScript + Node 24 native type stripping; Render runs `node src/server.ts`. `tsc` is typecheck-only.
  - TypeScript pinned to **6.0.x** (not 7.x) because typescript-eslint supports `<6.1`.
  - Respecting pnpm's `minimumReleaseAge` supply-chain policy: pinned `vitest ~5.0.5` and `express-rate-limit 8.7.2` instead of excluding day-old releases.
  - `mongodb-memory-server` install script disabled (`allowBuilds: false`); it downloads MongoDB lazily on first test run.
  - Password hashing: **Argon2id** via `@node-rs/argon2` (prebuilt, no install scripts); login timing equalized with a dummy hash.
  - Refresh tokens are **opaque random values stored as SHA-256 hashes**, one-time use, rotated in a `familyId`; replay revokes the family. Removed `JWT_REFRESH_SECRET` from OPS.
  - Token transport: web = HttpOnly `SameSite=Lax` cookie on `/api/v1/auth` + `X-Requested-With: niwa` CSRF header; desktop/mobile = `X-Client` header + token in body.
  - **`REGISTRATION_MODE=first_user_only`** by default — enforces the single-user model.
  - Register is not transactional yet (in-memory test Mongo is standalone); partial workspace is cleaned up on failure.
  - `api-client` package deferred to the start of M2 so it's shaped by the first real consumer.
- **Verified:**
  - `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm openapi:check` all pass.
  - `pnpm test`: contracts 8/8, backend 18/18 passing.
  - Smoke test: `node src/server.ts` against an in-memory MongoDB → `/api/v1/health` 200, register 201.
  - Not verified: Render/Atlas/Redis deploy (no accounts connected yet); CI workflow not run on GitHub (nothing pushed).
- **Next:** Owner: create Atlas cluster + Render Blueprint (M1.P2b), review/freeze contract v0.1. Code: M2 (frontend scaffold, api-client, auth UI, shell).

### 2026-11-03 — M2 web shell + auth
- **Plan ref:** M2.P0–P4 (M2.P1b Vercel account steps pending)
- **Actions:**
  - Built `@niwa/api-client` (typed on contract types; memory-only access token; single-flight refresh on 401; `ApiError` from the error envelope; web CSRF header; native `X-Client` + secure-store refresh).
  - Scaffolded `frontend/` (Vite 8, React 19, pure MUI v9 with theme from `@niwa/tokens`, React Router 8, TanStack Query, React Hook Form + Zod).
  - Auth UI: login/register pages using the contract schemas as validators; route guards; session restore on load; logout.
  - App shell: nav rail / bottom nav, lens-scoped tree pane, detail panel, top bar with search + account menu, six destinations with milestone placeholders, Settings (theme Light/Dark/System, account), keyboard shortcuts.
  - Pure-MUI ESLint rule (blocks stylesheet imports and other UI/icon kits) + react-hooks rules.
  - `backend/scripts/dev-memory.ts` + `pnpm dev:memory` (full stack without Atlas); `.claude/launch.json` preview config.
  - `frontend/vercel.json`, `frontend/.env.example`; CI now builds the frontend and runs a Playwright e2e job.
- **Files:** created `packages/api-client/**`, `frontend/**` (see `CODEMAP.md` §6–7), `backend/scripts/dev-memory.ts`, `.claude/launch.json`; modified root `package.json`, `eslint.config.js`, `.github/workflows/ci.yml`, `backend/package.json`, `backend/tsconfig.json`, `docs/OPS.md`, `NIWA-PLAN-A-01.md`, `CODEMAP.md`; removed `frontend/.gitkeep`.
- **Decisions:**
  - **Started M2 before the contract freeze** at owner's request ("Start M2"); M2 touches only auth/workspace endpoints, which are implemented and tested.
  - **api-client is typed from `@niwa/contracts`, not generated.** TS clients share the Zod types directly; OpenAPI codegen is reserved for Dart (M10).
  - After login/register, `GuestOnly` performs the redirect back to the originally requested page (pages don't navigate themselves) — fixes a race where the guard sent users to `/` first (caught by a test).
  - RHF + MUI: `muiField()` passes RHF's ref as `inputRef` so labels/focus/autofill work (fixed overlapping labels seen in the browser).
  - `dev:memory` forces the API onto `API_PORT` (default 4000) because preview tooling exports `PORT` for the web server.
  - api-client gives a friendly message for 5xx responses without an envelope (e.g. proxy 502 when the API is down).
  - No web fonts loaded yet (system font stack fallback from tokens) — avoids third-party font requests; self-hosting Inter/Noto Sans JP can come in M7 polish.
- **Verified:**
  - `pnpm lint`, `format:check`, `typecheck`, `openapi:check`, `build` pass. Unit tests: contracts 8, api-client 6, backend 18, frontend 15 — all passing.
  - Playwright e2e: 4/4 passing (desktop + phone): register → shell → reload keeps session (HttpOnly, SameSite=Lax cookie) → logout → login; theme toggle.
  - Manually in the in-app browser: register, shell in dark + light, phone layout at 375px (no horizontal scroll), logout/login with uppercase email.
  - Not verified: Vercel deploy, CI on GitHub (nothing pushed).
- **Known follow-ups:** JS bundle is ~812 kB (255 kB gzip) — add route-level code splitting in M7 perf pass. `vercel.json` hostname `niwa-api.onrender.com` must match the real Render service name.
- **Next:** M3 — item tree + Actionable base (items API: CRUD, move/reorder, soft delete/restore, Focus; tree UI with x-tree-view; detail panel).

### 2026-11-03 — First commit + push to GitHub
- **Plan ref:** M0.P3 (first commit + push)
- **Actions:** Committed the whole repo (docs, contracts, tokens, api-client, backend, frontend, CI, deploy configs) and pushed `main` to `origin` (`https://github.com/PastelSalt/niwa-site.git`) at owner's request.
- **Verified:** pre-commit check that no `.env`, `node_modules`, build output or test reports are staged.
- **Next:** paused until owner says to continue (next up: M3).

### 2026-11-03 — M3 item tree + Actionable base
- **Plan ref:** M3.P1–P5
- **Actions:**
  - Contract: added `GET /tree`, `RestoreResponse`, `DeleteResponse`; regenerated `openapi.yaml`.
  - Backend: item repository + service + controller — CRUD with optimistic versions, server-minted fractional order keys with rebalance, move with cycle/neighbour validation, archive, cascading soft delete in batches, restore (to original parent, or Inbox if gone), permanent delete, Focus sections, tag counts and rename/merge, plain-text extraction for search.
  - api-client: `items.*` and `tags.*`.
  - Frontend: lens-filtered tree (SimpleTreeView) with drag-and-drop, keyboard moves (Alt+↑/↓, Tab/Shift+Tab, Del) and item menu; create / move-to / confirm dialogs; item view (breadcrumbs, inline title, chips, children); editable detail panel; Focus view with one-click completion; Settings → Trash; snackbar with Undo for delete/archive; `/items/:id` canonical redirect; phone layout uses the tree as the lens home with inline fields.
- **Files:** backend `item.repo.ts` (rewritten), `item.service.ts`, `item.controller.ts`, `lib/contentText.ts`, `item.model.ts` (+`deleteRoot`, tags index), routes; frontend `features/items/**`, `features/actionable/FocusView.tsx`, `components/Notifier.tsx`, `lib/usePersistentState.ts`, `layout/{TreePane,DetailPanel,AppShell,TopBar}.tsx`; tests `backend/tests/items.test.ts`, `frontend/e2e/tree.spec.ts`, `frontend/src/features/items/treeModel.test.ts`; docs `DATA_MODEL.md`, plan, code map.
- **Decisions:**
  - **Whole tree in one `/tree` call** (no content bodies) instead of lazy children — single-user scale, and lens filtering/dimming needs ancestors anyway.
  - **Drag-and-drop via native HTML5 DnD** on our own tree labels: MUI X's built-in reordering is a Pro (paid) feature. Drop zones: top 28% before, bottom 28% after, middle inside.
  - Clients send `beforeId`/`afterId`; **only the server mints order keys**.
  - **Trash lists batch roots only** (`deleteRoot`); restoring any member restores its whole batch. **Purge removes everything under the item**, including earlier-deleted descendants (they'd have no parent to return to).
  - Type changes are always allowed; actionable fields are kept when switching to a knowledge type (lossless round trip).
  - **Rate-limit fix:** the strict auth limiter (20/15 min) no longer applies to `/auth/refresh` — it ran on every page load and would lock out normal use. Refresh tokens are unguessable 256-bit values; the general limiter still applies. Regression test added.
  - Accessibility: tree rows get their title as accessible name (dimmed rows say "(context)"); Focus checkbox updates optimistically.
  - Tab inside the tree indents (per CONCEPT.md); when indenting isn't possible, Tab still moves focus out normally.
- **Verified:**
  - lint, format, typecheck, openapi:check, build: pass.
  - Unit/integration: contracts 8, api-client 6, backend 39, frontend 19 — all pass.
  - E2E 7/7 (desktop + phone; 3 desktop-only tree specs skipped on phone).
  - In the in-app browser: Focus view with seeded data, item view + docked detail panel, phone tree layout.
- **Known gaps:** phone has no drag-and-drop (use the item menu); Trash auto-purge after 30 days not implemented yet; the running `pnpm dev:memory` preview needs a restart to pick up backend changes (no `--watch` in memory mode).
- **Next:** M4 — Knowledge base (TipTap editor, outline, links/backlinks, review queue).

### 2026-11-03 — M4 knowledge base
- **Plan ref:** M4.P1–P5
- **Actions:**
  - Backend: `links` collection (content + manual), content-link sync on every body save, links/backlinks endpoint with section names, manual link create/delete, review queue, heading-section promotion (atomic: child created, parent rewritten with an inline link, child removed if the parent write fails), link cleanup on purge. Contract: `Link.targetSection`, `ItemLinksResponse` type.
  - Frontend: TipTap 3 editor for every item body — anchored headings (stable unique `anchorId`s), inline `niwaLink` node with live titles, `[[` picker with section step, formatting toolbar, outline with jump/copy-link/promote, autosave with conflict handling, section deep links with a "section no longer exists" notice; Links panel (content + related + backlinks); review queue page and Knowledge home summary; phone details moved into a collapsed "Details" section below the note.
- **Files:** backend `models/link.model.ts`, `repositories/link.repo.ts`, `services/link.service.ts`, `lib/contentDoc.ts`, item service/controller/routes/repo; frontend `features/knowledge/**`, `features/items/{ItemView,queries}.tsx/ts`, `features/placeholders.tsx`, `app/router.tsx`, `components/Notifier.tsx`; tests `backend/tests/knowledge.test.ts`, `frontend/src/features/knowledge/editor/useAutosave.test.tsx`, `frontend/e2e/knowledge.spec.ts`; config `backend/src/config/env.ts`, `middleware/rateLimit.ts`, `frontend/playwright.config.ts`, `e2e/fixtures.ts`; docs plan, code map, CONCEPT §4.1, OPS env table.
- **Decisions:**
  - Every item (not only notes) gets a body; the knowledge lens is just where it's emphasised.
  - **Promotion lives in the outline's ⋯ menu** rather than a hover menu inside the editor (avoids fighting text selection). CONCEPT.md updated.
  - Inline links store `itemId`, `anchorId`, and title/section **snapshots**; the chip shows the live title from the tree cache.
  - Autosave always writes against the **newest cached version**; a 409 whose server body equals what we last saved is a field-only change and is retried silently; a real body conflict pauses saving with **Keep mine / Load latest**.
  - **Opening a note never saves it**: the baseline is TipTap's own normalized JSON of what was loaded (verified in the browser: version unchanged after focus/blur).
  - `storeItem()` now updates the item cache **and** its rows in tree caches; moves, archives and field updates use `latestVersion()` — fixes spurious "changed elsewhere" errors after editing (found by e2e under load).
  - `/items/:id` redirect now keeps the `#h-…` hash (section links were losing their target).
  - Focus checkbox holds its optimistic state until the refreshed list agrees (no flicker back).
  - Warnings/errors stay on screen 6 s (was 3.5 s).
  - Rate limits configurable: `RATE_LIMIT_AUTH_MAX` (20/15 min) and `RATE_LIMIT_GENERAL_MAX` (raised default 300 → 600/min); e2e runs set them high. E2E accounts get unique emails per run; per-test timeout 60 s.
- **Verified:**
  - lint, format, typecheck, openapi:check, build pass.
  - Unit/integration: contracts 8, api-client 6, backend 47, frontend 23 — all pass.
  - E2E: 24/24 across 3 repeats (desktop + phone, parallel).
  - In-app browser: phone and desktop layouts of a rich note (headings, code, lists, quote, code block, section link chip), outline, links panel; no save on open.
- **Known follow-ups:** JS bundle is now ~1.46 MB (458 kB gzip) with TipTap — lazy-load the editor/route chunks in the M7 performance pass. Promotion and `[[` linking are desktop-first (work on phone via touch but untested there). Image insertion arrives with Cloudinary (M7).
- **Next:** M5 — Scheduler (write `docs/SCHEDULER.md` first).

### 2026-11-03 — M5 scheduler
- **Plan ref:** M5.P1–P5
- **Actions:**
  - Wrote `docs/SCHEDULER.md` (entries vs series, timezones, recurrence + materialization, edit scopes, drag semantics, overlaps, item ↔ block rules).
  - Contract: schedule inputs gain `timeZone`; entries expose `seriesIndex`; range limited to 62 days; new `GET /items/{id}/schedule`.
  - Backend: `schedule_entries` + `schedule_series` collections; Intl-based time-zone math (`lib/tz.ts`) and recurrence stepping (`lib/recurrence.ts`); range endpoint that materializes recurring series on demand; create/update/delete with "this event" / "this and following" scopes (series split); all-day normalisation to UTC date boundaries; blocks hidden for deleted items and removed on purge.
  - Frontend: scheduler routes `/scheduler/:view/:date` (phones open the day view); month grid with drag-to-another-day; week/day time grid with pointer drag-to-create, move (across days), resize, overlap columns, all-day row and now line; entry dialog (event or item block, all-day, times, colour swatches from tokens, repeat, scope, delete); item details "Scheduled" list + "Schedule time".
- **Files:** `docs/SCHEDULER.md`; contracts `schedule.ts`, `openapi.ts`; backend `lib/{tz,recurrence}.ts`, `models/schedule.model.ts`, `repositories/schedule.repo.ts`, `services/schedule.service.ts`, `controllers/schedule.controller.ts`, routes, item purge hook; api-client `schedule.*`; frontend `features/scheduler/**`, `lib/dates.ts`, `features/items/ItemFields.tsx`, router, placeholders; tests `backend/tests/{schedule,recurrence}.test.ts`, `frontend/src/features/scheduler/scheduler.test.ts`, `frontend/e2e/scheduler.spec.ts`; docs plan, code map, DATA_MODEL §1.
- **Decisions:**
  - **Separate `schedule_series` collection** holds the rule; every occurrence is a real `schedule_entries` row (`seriesId` + `seriesIndex`). `materializedThrough` guarantees a deleted occurrence is never regenerated; `untilIndex` ends a series for "this and following".
  - Occurrence n is computed **from the anchor** (not chained) in the creator's **IANA zone** — weekly 09:00 stays 09:00 across DST; monthly Jan 31 → Feb 28 → Mar 31 without drift. No date library: small Intl helper.
  - **All-day** = UTC date boundaries (end exclusive), displayed as calendar dates regardless of viewer zone.
  - Drags always change **this occurrence only** (a notice says so for repeating entries); the dialog offers "This and following".
  - Week starts Monday; snapping 15 min; month cells show 3 entries then "+N more".
  - Block titles are optional; the calendar shows the item's live title; colours default to the item type colour.
  - Week/day interactions use **pointer events with pointer capture** (work with mouse and touch); month uses native drag-and-drop.
- **Verified:**
  - lint, format, typecheck, openapi:check, build pass.
  - Unit/integration: contracts 8, api-client 6, backend 62, frontend 27 — all pass.
  - E2E 20/20 (repeat ×2, desktop + phone; scheduler spec runs in Asia/Manila at 1440×900).
  - In-app browser: month grid contents (daily series, two-day all-day event, "+1 more", block with live item title), week overlap columns, now line, no horizontal overflow.
- **Known gaps:** month drag isn't available on touch devices (native DnD) — use the dialog; overlapping all-day events in week view stack rather than span; week start isn't configurable yet.
- **Next:** M6 — Inbox + Search.

### 2026-11-03 — M6 inbox + search
- **Plan ref:** M6.P1–P3
- **Actions:**
  - Contract: `Item.suggestedParentId`; `SearchHit.matchedIn`; exported search types.
  - Backend: capture (`POST /inbox`), inbox list (`GET /inbox`), filing (`POST /items/:id/file`: parent, type, due, tags; appends under the parent), search service (weighted text index + substring fallback for partial words, body snippets, filters, inbox included, deleted never, archived on request).
  - Frontend: quick-capture dialog from anywhere (`c` or Capture; Enter / Shift+Enter; type chips; optional details; suggests the open item as parent); Inbox page (newest first, multi-select bulk filing, delete) with a count badge on the nav; filing dialog (parent with path, type, due, tags); "In your Inbox — File" banner on inbox items; Search page (URL-synced debounced query, base filter, archived toggle, highlighted titles/snippets, path and tags). Removed the last placeholders (`features/placeholders.tsx` → `features/pages.tsx`; `PagePlaceholder` deleted).
- **Files:** contracts `item.ts`, `search.ts`; backend `services/search.service.ts`, item model/serializer/repo/service/controller, routes; api-client `inbox.*`, `search()`; frontend `features/inbox/**`, `features/search/SearchPage.tsx`, `features/pages.tsx`, `layout/{AppShell,TopBar,NavRail,useGlobalShortcuts}.tsx/ts`, `features/items/ItemView.tsx`, `app/router.tsx`, `vite.config.ts`; tests `backend/tests/inbox-search.test.ts`, `frontend/e2e/inbox-search.spec.ts`, updated shell/tree tests and fixtures.
- **Decisions:**
  - Search = whole words from the text index, then a substring pass (every term must appear somewhere) so "netw" and "backb" work; fallback hits rank below text hits, title matches first. Language `none` (no stemming) as in DATA_MODEL §9.
  - Inbox items are searchable; deleted never; archived only with the toggle.
  - Filing appends the item as the parent's last child; filing never happens implicitly (moves of inbox items are rejected).
  - **Capture queue:** fast Shift+Enter clears the field immediately and saves in order; closing waits for pending saves; a failed save restores the text. (Found by e2e under load: the old version could miscount and drop text.)
  - **Vite dev fix:** `optimizeDeps.entries` scans all source up front. Without it, the first visit to a screen with a new deep import (icon / TipTap module) re-bundled deps and **force-reloaded every open page** — the root cause of earlier "flaky" e2e runs and a real annoyance in local dev.
  - E2E hardening (test-only): Focus completion uses click (a completed task correctly leaves "In progress"); delete waits for the tree to update before navigating; drag-and-drop measures right before dropping and retries if a busy machine lands on an edge zone.
- **Verified:**
  - lint, format, typecheck, openapi:check, build pass.
  - Unit/integration: contracts 8, api-client 6, backend 72, frontend 27 — all pass.
  - E2E: 42/42 across 3 repeats (desktop + phone), and 40/40 desktop from a cold Vite cache.
  - In-app browser: inbox list with suggestion chip and nav badge; search "backb" → body hit highlighted with path and tag; no horizontal overflow.
- **Known gaps:** bulk delete isn't offered (single delete with Undo only); search has no pagination beyond 40 results; capture has no rich-text body (plain text → paragraphs).
- **Next:** M7 — Cloudinary images + polish (code splitting, accessibility audit, backups) → **MVP complete**.

### 2026-11-03 — Commit + push M3–M6
- **Actions:** Committed and pushed M3 (item tree + Actionable), M4 (knowledge base), M5 (scheduler) and M6 (inbox + search) to `origin/main` at owner's request.
- **Verified:** staged set checked — no `.env`, `node_modules`, build output, test results or traces.

### 2026-11-04 — M7 Cloudinary images + polish
- **Plan ref:** M7.P1–P4 (performance pass on large trees still open)
- **Actions:**
  - **Images (P1):**
    - Contract: `UploadConfigResponse`, `allowedFormats` on the signature, `NOT_CONFIGURED` (503), `GET /uploads/config`.
    - Backend: `lib/cloudinary.ts` (signing, resource lookup, destroy, tag removal; fetch injectable for tests); `attachments` model; `attachment.service.ts`:
      - sign: per-workspace folder, UUID public id, `niwa-pending` tag, allowed formats.
      - confirm: checks folder ownership, resource exists, format and ≤ 10 MB; deletes rejected uploads.
      - Orphan sync on every content save; purge with the item.
    - `maintenance.service.ts`: runs every 6 h — Trash > 30 days, orphans > 7 days, unconfirmed uploads > 24 h.
    - Frontend: `NiwaImage` node (`attachmentId`); paste, drop and toolbar insertion; uploading status; alt-text dialog; insertion disabled with a tooltip when Cloudinary isn't configured. Delivery adds `f_auto,q_auto`.
  - **UX (P2):**
    - Secondary routes and the editor are lazy-loaded: initial JS ≈ 280 KB gzip, down from ≈ 458 KB.
    - `RouteError` boundaries; a stale chunk after a deploy offers a reload.
    - Suspense progress bar and editor skeleton.
  - **Accessibility (P3):** new `e2e/a11y.spec.ts` (axe, WCAG 2.1 A/AA) audits 13 screens plus the capture dialog in light and dark. Fixed:
    - Light tokens darkened: primary `#59765C`, warning, success `#527D55`, info/task `#4F7389`, note `#7D6E52`, idea. `contrast.test.ts` locks these in.
    - Block and chip text colour is chosen per fill (`readableOn`).
    - Status chips use a coloured dot with body-colour text.
    - Nav rail: active item contrast; names match visible labels.
    - Editor is a named multiline textbox; heading buttons say "H1 heading" and so on.
    - Calendar grids get `row` wrappers (`display: contents`), visually hidden dates and no mismatched labels. Out-of-month day numbers use `text.secondary`.
    - Link lists wrap each link in an `<li>` (search, backlinks, children).
  - **Backups (P4):**
    - `lib/backup.ts`: portable gzip'd EJSON NDJSON with a header of counts.
    - `scripts/backup.ts` and `scripts/restore.ts`: restore defaults to a dry run, needs `--drop` to overwrite, verifies counts, then rebuilds indexes.
    - `.github/workflows/backup.yml`: nightly, `age`-encrypted, 14-day artifact.
    - OPS §9 rewritten with setup, decrypt and restore-drill steps. `backups/` is git-ignored.
- **Files:**
  - contracts: `attachment.ts`, `common.ts`, `openapi.ts`, `openapi.yaml`.
  - backend: `lib/{cloudinary,backup}.ts`, `models/attachment.model.ts`, `services/{attachment,maintenance,item}.service.ts`, `controllers/upload.controller.ts`, routes, `app.ts`, `server.ts`, `errors.ts`, `scripts/{backup,restore}.ts`, tests `uploads.test.ts`, `backup.test.ts`, `helpers.ts`.
  - api-client: `uploads.*`.
  - tokens: `index.ts`, `contrast.test.ts`.
  - frontend:
    - `knowledge/editor/{extensions.ts,uploadImage.ts,useImageUploads.tsx,NoteEditor.tsx,EditorToolbar.tsx}`
    - `components/RouteError.tsx`, `app/router.tsx`, `layout/{AppShell,NavRail}.tsx`
    - `items/{ItemView,itemMeta}.tsx`
    - `scheduler/{MonthView,TimeGridView,entryDisplay}`
    - `search/SearchPage.tsx`, `knowledge/LinksPanel.tsx`, `lib/a11y.ts`
    - e2e: `a11y.spec.ts`, `scheduler.spec.ts`, `inbox-search.spec.ts`
  - Removed the unused `VITE_CLOUDINARY_CLOUD_NAME`.
  - docs: OPS §8/§9, DATA_MODEL §5/§8, CODEMAP, plan.
- **Decisions:**
  - No Cloudinary upload preset; the server signs every parameter per upload, so the browser can't widen them.
  - Housekeeping runs inside the API process (unref'd 6 h timer) rather than as a separate cron service. Render free instances sleep, so a sweep simply runs on the next wake.
  - Backups use our own portable format instead of `mongodump`, so no binaries are needed in CI and any Mongo version can restore. Encryption happens before anything leaves the runner.
  - Calendar entry names now follow their visible text ("9:00 AM Dentist", "Deep work 10:00 AM – 11:30 AM") so voice-control users can say what they see (WCAG 2.5.3).
- **Verified:**
  - lint, format, typecheck, openapi:check, build pass.
  - Unit/integration: tokens 8, contracts 8, api-client 6, frontend 31, backend 84 — all pass.
  - E2E: full suite ×2 (desktop + phone). Every desktop test passed. The two phone failures came from a test locator (phone bottom-bar entries are buttons); after fixing it, inbox and smoke pass ×2 on both projects. The a11y audit passes in light and dark.
  - Backup CLI smoke run against a real mongod: dump → dry run → refuses without `--drop` → restore with indexes rebuilt.
  - In-app browser: month grid has 6 rows × 7 cells; chip names read time then title; week blocks are readable in both themes.
- **Known gaps:**
  - No performance pass on large trees yet (M7.P3).
  - Cloudinary not yet tried against a live account (needs credentials, like the M1 hosting accounts).
  - The nightly backup needs the three `BACKUP_*` secrets.
  - Trash auto-purge has no Settings switch.
  - Week-grid creation is pointer-only; the keyboard path is the New button.
- **Next:** M7 large-tree performance pass, then post-MVP milestones (M8 AI / M9 desktop / M11 graph), or hosting setup (Atlas, Render, Vercel, Cloudinary).

### 2026-11-04 — Gaps file, folder rename, mobile plan
- **Plan ref:** A-01 housekeeping; new `NIWA-PLAN-A-02.md`
- **Actions:**
  - `GAPS.md`: open items from M7 (large-tree perf pass, live Cloudinary check, backup secrets, Trash purge switch, keyboard creation in the week grid), earlier carried gaps, and the deferred AI milestone.
  - Renamed `frontend/` → `web_app/` with `git mv`. The package is now `@niwa/web`. Updated the pnpm workspace, root scripts, CI, ESLint globs, `.gitignore`, `.prettierignore`, launch config, OPS, specs, plan and CODEMAP. LOGS history is left as written.
  - New `flutter_app/` (README with setup; the Flutter SDK isn't installed yet, so no `flutter create`) and `desktop_app/` (placeholder). Workspace entry `desktop` → `desktop_app`.
  - `NIWA-PLAN-A-02.md`: mobile plan MA0–MA11 (toolchain, scaffold/theme/models, auth, shell, items, offline cache + capture queue, flutter_quill editor with ProseMirror ⇄ Delta converter, scheduler + reminders, inbox/search, settings/images, quality, release), parity checklist, needed contract changes, open questions.
  - A-01: M8 deferred, M9 after mobile, M10 superseded by A-02.
- **Decisions (owner):** mobile first, then desktop; AI skipped for now. Folder names `web_app`, `flutter_app`, `desktop_app`.
- **Verified:** lint, format, typecheck, unit/integration tests (tokens 8, contracts 8, api-client 6, web 31, backend 84), build and smoke e2e all pass from `web_app/`.
- **Owner action needed:** when the Vercel project is created, set its root directory to `web_app`. Install the Flutter SDK + Android Studio (A-02 MA0).
- **Next:** A-02 MA0 → MA1 scaffold.

### 2026-11-04 — Mobile MA0 toolchain + MA1.P1 scaffold (Linux work laptop)
- **Plan ref:** A-02 MA0 (done), MA1.P1 (done)
- **Actions:**
  - New dev machine (CachyOS laptop): `pnpm install` via `npx pnpm@12.15.0` (Node 26 has no corepack); lint, typecheck and all tests pass (tokens 8, contracts 8, api-client 6, web 31, backend 84).
  - MA0: Flutter 3.47.9 / Dart 3.13.7 at `~/develop/flutter`; `flutter doctor` clean for Android (SDK 36 build-tools, platform 37, Studio JBR); emulator `Medium_Phone_API_37.0`.
  - MA1.P1: `flutter create --org works.moeko --project-name niwa --platforms android,ios` in `flutter_app/`.
    - Android `minSdk 26`, `targetSdk 36`.
    - Lints: `very_good_analysis` + strict casts/inference/raw types; generated `*.g.dart` / `*.freezed.dart` excluded.
    - Dependencies: flutter_riverpod, riverpod_annotation, go_router, dio, freezed_annotation, json_annotation, drift, drift_flutter, flutter_secure_storage, connectivity_plus; dev: build_runner, freezed, json_serializable, riverpod_generator, drift_dev.
    - `lib/main.dart` (ProviderScope), `lib/app/{app,router}.dart`, `lib/core/config/env.dart` (`APP_ENV`, `API_BASE`), `lib/core/theme/app_theme.dart` (seeded placeholder), `lib/features/home/ui/placeholder_screen.dart`; `test/app_test.dart`.
  - `.prettierignore`: whole `flutter_app/` (Dart tooling formats it).
  - Docs: `flutter_app/README.md`, CODEMAP, A-02 plan.
- **Decisions (owner):** bundle id `works.moeko.niwa`; `minSdk 26` / `targetSdk 36`; scheduler reminders opt-in per entry, 10 min default.
- **Decisions:** `flutter_quill` and `flutter_local_notifications` are added in MA6/MA7, where their Android setup (desugaring, permissions) is needed. No Gradle flavors yet; `--dart-define` covers env selection.
- **Verified:** `flutter analyze` no issues; `dart format --set-exit-if-changed` clean; `flutter test` 2 pass (placeholder in light + dark, `APP_ENV` fallback); `flutter build apk --debug` succeeds (first Gradle run ≈ 19 min). Root lint, format:check pass. Not yet run on the emulator.
- **Next:** MA1.P2 theme from tokens, then MA1.P3 models, MA1.P4 CI.

### 2026-11-04 — Mobile MA1.P2 theme from tokens
- **Plan ref:** A-02 MA1.P2 (done)
- **Actions:**
  - `packages/tokens/scripts/generate-dart.ts` writes `flutter_app/lib/core/theme/tokens.g.dart`: `NiwaPalette`, `NiwaTypeColors`, `NiwaTokens` (light/dark palettes and type colours, font families without CSS generics, base size, radii, spacing unit). Output is already `dart format`-clean. `--check` mode like `generate-openapi.ts`.
  - Root scripts `tokens:dart` / `tokens:dart:check`; the check runs in the `ci.yml` `check` job (Node only). Tokens `tsconfig` now includes `scripts/`.
  - Flutter: `core/theme/app_theme.dart` maps tokens onto a Material 3 `ColorScheme` (mirrors `web_app/src/app/theme.ts`: semibold headings and buttons, flat app bar/cards, `radius` 10, chips `radiusSmall`); `core/theme/niwa_colors.dart` theme extension for warning/success/info/item types; `core/theme/theme_mode.dart` (`themeModeProvider`, system by default); `core/util/contrast.dart` (`contrastRatio`, `readableOn`, port of `lib/a11y.ts`).
  - Placeholder screen shows type and status swatches and button styles.
  - `test/theme_test.dart`: port of `contrast.test.ts` on the Dart tokens, plus checks that `ThemeData` uses them.
- **Decisions:** fonts are listed as `fontFamilyFallback` only; Inter / Noto Sans JP aren't bundled yet, so the platform font shows until they are (later: font assets).
- **Verified:** `flutter analyze` no issues; `dart format` clean; `flutter test` 13 pass. `tokens:dart:check`, tokens typecheck + tests (8), root lint, typecheck, format:check pass. No APK build or emulator run (owner will say when).
- **Next:** MA1.P3 models (freezed + contract check).

### 2026-11-04 — Mobile MA1.P3 models + contract check
- **Plan ref:** A-02 MA1.P3 (done)
- **Actions:**
  - `flutter_app/lib/core/models/` (freezed + json_serializable, barrel `models.dart`): `Item`, `ItemSummary`, `User` (contract `PublicUser`), `AuthResponse`, `Workspace`, `Link`, `LinkWithItem`, `ScheduleEntry`, `SearchHit`, `Attachment`, `ApiError` / `ErrorEnvelope`; `enums.dart` with every contract enum.
  - `build.yaml`: `explicit_to_json` so nested models serialise as maps.
  - `test/fixtures/<Schema>.json` (11) and `test/contract_test.dart`:
    - each fixture validates against `openapi.yaml` (types, enums, no extra or missing fields; `$ref` / `allOf` resolved) and covers every field;
    - it round-trips through the model unchanged;
    - per field, including inline nested objects (`ErrorEnvelope.error.*`): `null` accepted only where the contract allows it, optional fields may be absent, every contract enum value decodes, unknown values fall back.
  - Dev deps: `yaml`, `collection`.
- **Decisions:**
  - `IsoDateTime` → `DateTime`; `DateOnly` stays a string (no timezone, specs §12.5).
  - `content` is `Map<String, dynamic>?` (ProseMirror JSON untouched, specs §12.4).
  - Enums: `unknown` member + `unknownEnumValue`; `ErrorCode` uses screaming snake case.
  - Optional contract fields (`refreshToken`, `details`, `requestId`) are omitted from `toJson` when null.
  - No `ScheduleSeries` model: the contract has no series resource.
  - Contract check is a Dart test (runs with `flutter test`) rather than a separate tool.
  - Generated `*.freezed.dart` / `*.g.dart` are committed; MA1.P4 CI will check they're up to date.
  - Constructors use the Dart 3.13 `const factory(...)` / `factory fromJson` form (lint `unnecessary_type_name_in_constructor`); freezed 3 generates fine with it.
- **Verified:**
  - `flutter test` 172 pass (13 earlier + 159 contract).
  - Mutation check: dropping `ItemPriority.critical` and making `Workspace.name` nullable fail `priority: every contract value decodes` (Item, ItemSummary) and `Workspace name: null rejected`; reverted and regenerated.
  - `flutter analyze` no issues, `dart format` clean; root `tokens:dart:check`, lint, format:check pass. No APK build (owner will say when).
- **Next:** MA1.P4 Flutter CI workflow (code only; first CI run when pushed), then MA2 API client & auth.

### 2026-11-04 — Mobile MA1.P4 CI workflow + MA2.P1 API client
- **Plan ref:** A-02 MA1.P4 (written, not yet run), MA2.P1 (client, errors, refresh, tests done; per-area repositories open)
- **Actions:**
  - `.github/workflows/flutter.yml`: on changes to `flutter_app/`, `packages/tokens/`, `packages/contracts/` or itself. Steps: Java 17, Flutter 3.47.9 (cached), `pub get`, `dart format --set-exit-if-changed`, `analyze`, `build_runner` + `git diff --exit-code -- lib` (generated code is fresh), `flutter test`, `build apk --debug`.
  - `lib/core/api/`:
    - `api_client.dart`: Dio with `X-Client: mobile`, `X-Request-Id`, timeouts (15 s connect, 60 s receive). Session in memory with a `sessionChanges` stream. Single-flight `refresh()`, one retry on 401, sign-out when refresh returns 401/403. `restoreSession`, `register`, `login`, `logout` (local sign-out even if the server is unreachable), `me`, `request`, `anonymous`.
    - `api_exception.dart`: `ApiException`, `OfflineException`.
    - `refresh_token_store.dart`: `RefreshTokenStore` interface + `MemoryRefreshTokenStore`.
  - `test/api_client_test.dart` (19 tests) against a fake adapter that rotates refresh tokens and detects reuse.
- **Decisions:**
  - Explicit request wrapper instead of a Dio interceptor, so the flow matches `@niwa/api-client` line for line.
  - `validateStatus` accepts everything; status mapping is done in one place.
  - Non-envelope 5xx → `UPSTREAM_ERROR` with a friendly message, like the TS client.
- **Verified:**
  - `flutter test` 191 pass; `flutter analyze` no issues; `dart format` clean; workflow passes Prettier.
  - Mutation check: removing single-flight fails `concurrent 401s share a single refresh`; restored.
  - Workflow not run yet (needs a push). No APK build (owner will say when).
- **Next:** MA2.P1 repositories (items, links, schedule, inbox, search, uploads); MA2.P2 secure storage + session provider; MA2.P3 login/register screens.

### 2026-11-04 — Mobile MA2.P1 repositories + MA2.P2 session
- **Plan ref:** A-02 MA2.P1 (done), MA2.P2 (done except router redirects, which move to MA2.P3)
- **Actions:**
  - Models: `FocusResponse`, `RestoreResponse` (+ `RestoreTarget`), `DeleteResponse`, `PromoteSectionResponse`, `TagCount`, `ItemLinksResponse`, `UploadConfigResponse`, `UploadSignatureResponse`, each with a fixture and a contract-test entry. Contract test: enum probes now only for string enums (`z.literal(true)` is a boolean enum).
  - `enums.dart`: `alwaysCreate` enum maps + `.wire` extensions; sending `unknown` throws `ArgumentError`.
  - `core/api/change.dart` (`Change<T>`, `putChange`), `core/api/json.dart` (`.decode` / `.field` / `.list` on `Future<Object?>`), `core/util/date_only.dart`.
  - Repositories: `features/items/data/items_repository.dart` (`ItemsRepository`, `ItemChanges`, `TagsRepository`), `inbox/…/inbox_repository.dart`, `search/…/search_repository.dart`, `scheduler/…/schedule_repository.dart` (`EditScope`; instants sent as UTC), `knowledge/…/{links,uploads}_repository.dart`, `settings/…/workspace_repository.dart`.
  - Session:
    - `core/auth/secure_refresh_token_store.dart`: flutter_secure_storage, iOS `first_unlock_this_device`.
    - `core/api/providers.dart`: token store, `ApiClient` and repository providers.
    - `core/auth/session.dart`: sealed `SessionState`, `SessionController` (restore at launch, follows the client's session stream, login/register/logout, refresh on resume within 1 min of expiry).
    - `ApiClient`: `Session.expiresAt`, injectable clock, synchronous session stream.
  - Tests: `repositories_test.dart` (18), `session_test.dart` (10); `FakeServer` moved to `test/support/fake_server.dart`.
- **Decisions:**
  - Repositories return futures directly (no `async`), using chained decode helpers.
  - `SessionUnavailable` covers both offline and 5xx at launch: the stored token is kept and the UI retries; only a 401/403 from refresh signs out.
  - Session stream is synchronous so `await login()` is immediately reflected in `sessionProvider`.
  - Device time zone for schedule writes is a parameter for now (MA7 reads it from the device).
- **Verified:** `flutter test` 273 pass; `flutter analyze` no issues; `dart format` clean; `build_runner` output unchanged; root format:check + `tokens:dart:check` pass. No APK build or emulator run (owner will say when).
- **Next:** MA2.P3 login/register screens + router redirects.

### 2026-11-04 — Mobile MA2.P3 login/register + session routing
- **Plan ref:** A-02 MA2.P3 (done); MA2 code complete (exit check against `pnpm dev:memory` on the emulator still to do)
- **Actions:**
  - `core/api/error_message.dart` (`messageOf`, port of the web one, plus waking-up / offline / rate-limit-with-wait); `core/util/validators.dart` (email, login password, new password 12–256, confirmation).
  - `features/auth/ui/`:
    - `auth_layout.dart`: `AuthLayout`, `FormErrorBanner` (live region), `AuthSwitchPrompt`.
    - `auth_form.dart`: `AuthFormState` mixin, `SubmitButton`.
    - `password_field.dart`: show/hide toggle.
    - `login_screen.dart`, `register_screen.dart`: copy from the web pages; autofill hints; email trimmed.
    - `session_screens.dart`: `SplashScreen`, `SessionUnavailableScreen` with Try again.
  - `app/router.dart`: `Routes`, pure `redirectFor`, `routerProvider` (GoRouter refreshed from `sessionProvider` through a `ValueNotifier`); `NiwaApp` uses it.
  - `SessionController.logout` swallows network/API errors (local sign-out already done). Placeholder home shows the signed-in email and a Log out button.
  - Tests: `test/support/test_app.dart` (`pumpApp`), `test/auth_flow_test.dart` (14 tests), and `app_test.dart` now goes through it.
- **Fixed:** the "First time here? / Create your account" row overflowed at narrow widths and large text. It's now a centred `Wrap`, with a test at 360 px and 2× text.
- **Verified:** `flutter test` all pass; `flutter analyze` no issues; `dart format` clean; root format:check passes. No APK build or emulator run (owner will say when).
- **Next:** MA3 app shell (tabs, routes mirroring web paths, capture FAB, snackbar Undo). MA2's exit check (register/login/logout/restart on the emulator against `pnpm dev:memory`) runs together with the first build.

### 2026-11-04 — Mobile MA3 app shell & navigation
- **Plan ref:** A-02 MA3.P1–P2 (done except shell goldens)
- **Actions:**
  - `app/router.dart`:
    - `StatefulShellRoute.indexedStack` with five branches (Knowledge, Actionable, Scheduler, Inbox, Search) on web paths; full-screen `/items/:id` (redirect to the lens, keeping `#anchor`) and `/settings/:section`.
    - `/scheduler` → today's day view; invalid scheduler or settings params redirect; `errorBuilder` → Not found.
    - `redirectFor(session, Uri)` keeps the target as `?from=` through splash and login (in-app paths only).
  - `app/app_shell.dart`: `NavigationBar` with Inbox `Badge` (99+ cap, count in tooltip); re-tap a tab to return to its root; `PopScope` sends Android back from another tab to Knowledge; capture FAB.
  - `app/destinations.dart`, `app/niwa_app_bar.dart` (search + account menu: email, Settings, Log out).
  - `core/ui/state_views.dart` (`EmptyState`, `ErrorState` with retry, static `ListSkeleton`); `core/ui/snackbars.dart` (root `ScaffoldMessenger` key, Undo action with 8 s duration).
  - Features:
    - `inbox/data/inbox_providers.dart` (`inboxItemsProvider`, `inboxCountProvider`); `inbox/ui/inbox_screen.dart` (real list, pull to refresh, empty/error/loading).
    - `capture/ui/capture_sheet.dart`: title + Idea/Note/Task, refreshes the Inbox and badge, "Captured to Inbox" snackbar.
    - `items/ui/{item_type_icon,lens_screens}.dart`: Knowledge, Actionable, Review and Not found placeholders, and `ItemRedirectScreen`.
    - `scheduler/ui/scheduler_screen.dart`, `search/ui/search_screen.dart` (query in the URL).
    - `settings/ui/settings_screen.dart`: Appearance theme radio (live), Account (email, log out), AI / Trash placeholders.
  - Removed `features/home` (MA1 placeholder).
  - Deep links: Android `VIEW` intent filter `niwa://open`; iOS `CFBundleURLTypes` `niwa`.
  - Tests: `test/shell_test.dart` (9): tabs, per-tab stacks, Android back, badge + capture, Inbox empty/error/retry, `/items/:id` → lens, deep link through login, Settings theme switch, not-found and param redirects. `redirectFor` tests extended (`from` round-trip, external `from` rejected). `pumpApp` disables Riverpod auto-retry.
- **Decisions:**
  - Each tab screen owns its `AppBar` (`NiwaAppBar`); the shell owns the bottom bar and FAB.
  - Deep-link form `niwa://open/<web path>`, so the URL path equals the web path.
  - Inbox badge reads the same provider as the Inbox screen, so capture/filing invalidation updates both.
- **Verified:** `flutter test` 299 pass; `flutter analyze` no issues; `dart format` clean; manifest and plist parse; root format:check passes. No APK build, emulator run or device deep-link test (owner will say when). Gaps recorded in `GAPS.md` § Mobile.
- **Next:** MA4 items, tree & Actionable (lens drill-down, item view and fields, structure changes, Focus).

### 2026-11-04 — Mobile MA4 items, tree & Actionable
- **Plan ref:** A-02 MA4.P1–P4 (done in code; device run pending)
- **Actions:**
  - `features/items/domain/tree_model.dart`: port of `treeModel.ts` (`buildTree`, `ancestorsOf`, `isDescendant`, `lensView`, `visibleChildren`, `moveUp`/`moveDown`/`indent`/`outdent`/`dropMove`), plus `descendantCount`, `reorderMove` (visible neighbour), `moveTargetProblem`.
  - `features/items/data/item_providers.dart`: `treeProvider`, `itemProvider` family, `focusProvider`, `tagsProvider`, `summaryOf`, `ItemActions` (create, update, move, archive with Undo, delete with Undo → restore, "Restored to Inbox" notice, `VERSION_CONFLICT` → reload + notice).
  - UI (`features/items/ui/`):
    - `item_meta.dart` (labels, status colours, lens paths, `formatDay`); `item_row.dart`.
    - `item_menu.dart`: open, add inside/below, move to, move up/down, archive, Trash.
    - `item_dialogs.dart`: create dialog, delete confirmation when it has children, move-to picker with reasons.
    - `item_fields_sheet.dart`: type/status/priority, due/review dates, tags with `/tags` autocomplete and contract normalisation; sends only changes.
    - `item_screen.dart`: breadcrumb, title saved on Done or blur, field chips, read-only content, children with drag-handle reorder (`onReorderItem`) and an optimistic order.
  - `features/items/ui/lens_screens.dart`: Knowledge home (`LensTree`, Review and New actions); Actionable home with Focus / Browse tabs; item routes open `ItemScreen` in the route's lens.
  - `features/actionable/ui/focus_view.dart`: web sections and copy; `FocusRow` with an optimistic checkbox (holds until the server agrees).
  - `features/knowledge/domain/prosemirror_text.dart`: read-only text blocks (headings, paragraphs, lists, quotes, code) until MA6.
  - `NiwaAppBar`: `actions` and `bottom`; `ItemTypeIcon`: completed tasks.
  - Tests:
    - `test/support/fake_workspace.dart`: in-memory backend for tree, items CRUD with version checks, move/orderKeys, archive, cascading delete/restore with the Inbox fallback, Focus, tags and Inbox. Hooked into `FakeServer`.
    - `pumpSignedIn` helper.
    - `tree_model_test.dart` (7), `items_flow_test.dart` (9: the three `tree.spec.ts` scenarios, drag reorder, move-to refusals, field sheet diff + 409 reload, title save, archive Undo, restore-to-Inbox, content rendering).
    - Shell and auth tests updated for the real screens.
- **Decisions:**
  - Drill-down navigation (one screen per item, children listed below) instead of an expandable tree: it fits a phone and keeps one back stack per tab.
  - Archived items leave the tree, as on the web; they stay reachable by link and are unarchived from the menu or Undo.
  - Drag reorder has a non-drag alternative (Move up/down) for switch and screen-reader users.
- **Verified:** `flutter test` 315 pass; `flutter analyze` no issues; `dart format` clean; generated code unchanged; root format:check passes. No APK build or emulator run (owner will say when).
- **Next:** MA5 local cache & offline (Drift read cache, offline capture queue) or MA6 notes editor (flutter_quill + ProseMirror ⇄ Delta).

### 2026-11-04 — Mobile MA5 local cache & offline (+ backend capture idempotency)
- **Plan ref:** A-02 MA5.P1–P3 (done in code; device run pending)
- **Actions:**
  - **Contract + backend:**
    - `CaptureInput.clientId` (optional UUID); OpenAPI regenerated.
    - `items.captureClientId` with a unique partial index `{ workspaceId, captureClientId }`.
    - `itemService.capture` returns the earlier item for a repeated `clientId`; a concurrent duplicate (E11000) returns the winner. The field is never serialised.
    - Test in `inbox-search.test.ts` (repeat, race, independent without an id, invalid id → 400). DATA_MODEL §1 updated.
  - **Flutter:**
    - `core/db/app_database.dart` (Drift v1: `cache_entries`, `outbox`, wipe) and `db_providers.dart`.
    - `core/db/cached.dart` (`cachedThenFresh`); `core/net/network_status.dart` (connectivity_plus + `/health` probe, re-probe while offline); `core/util/uuid.dart`.
    - Cached providers: tree, item, Focus, tags, Inbox.
    - `features/capture/data/capture_queue.dart`: FIFO outbox, `clientId` per capture, stop when offline, backoff on 5xx/429, 4xx → failed with Retry / Discard; drains on capture, reconnect, sign-in and launch.
    - Capture sheet goes through the queue, with an "it'll sync" message offline. The Inbox lists waiting and failed captures; the badge counts them.
    - `OfflineBanner` in the shell; `ItemActions` refuse edits offline with a message.
    - Session: caches the user, so an offline launch opens signed in; wipes the DB on sign-out; `logout()` waits for the wipe.
    - `features/auth/ui/logout.dart` warns about unsynced captures.
  - **Tests:**
    - `test/offline_test.dart` (13): DB, uuid, `cachedThenFresh`, the airplane-mode exit scenario, lost-response retry without a duplicate, backoff, Retry/Discard, logout warning + wipe.
    - Test helpers: in-memory DB, controllable connectivity, real restart (unmount first); `FakeServer.offline`; `FakeWorkspace` POST `/inbox` is idempotent on `clientId`.
    - Shell, repository and session tests updated.
- **Decisions:**
  - Snapshot cache keyed by request instead of normalised tables, until offline editing needs them.
  - Outbox state is reloaded by the queue after each write (no Drift table watcher): simpler, and no lingering Drift timers in widget tests.
  - A launch that can't reach the server opens as the cached user; only a server rejection of the refresh token signs out.
- **Found and fixed:** `clientId` wasn't actually being sent at first; the lost-response test caught it (two items created).
- **Verified:**
  - `flutter test` 328 pass; `flutter analyze` no issues; `dart format` clean; generated code fresh.
  - Backend 85 pass; tokens/contracts/api-client pass; `openapi:check`, lint, format:check pass.
  - Web: 31 pass, but `shell.test.tsx` "hides the tree pane…" failed intermittently (2 of 4 runs); untouched code, logged in GAPS.
  - No APK build or device run (owner will say when).
- **Next:** MA6 notes editor (flutter_quill + ProseMirror ⇄ Delta converter).

### 2026-11-04 — Mobile MA6 notes editor (flutter_quill)
- **Plan ref:** A-02 MA6.P1–P3 (done in code; manual round-trip pending)
- **Actions:**
  - **Web fixtures:** `web_app/src/features/knowledge/editor/editorFixtures.test.ts` builds note bodies with the web editor's real schema (`generateJSON` + StarterKit/AnchoredHeading/NiwaLink/NiwaImage). It checks `flutter_app/test/fixtures/editor/*.json` (7 supported, 4 locked); `UPDATE_EDITOR_FIXTURES=1` rewrites them. It runs in the web test suite, so the mobile fixtures can't go stale.
  - **Converter** `features/knowledge/domain/pm_delta.dart`:
    - `pmToDelta` / `deltaToPm` for every supported node and mark.
    - Heading anchors travel as a `niwaAnchor` inline embed; `niwaLink`, `niwaBreak`, `niwaRule`, `niwaImage` and `niwaLocked` embeds.
    - Canonical mark order and TipTap link defaults; adjacent same-mark text merged.
    - List indents clamped; headings clamped to H1–H3.
    - Unsupported blocks, unsupported inline content and same-kind neighbours become locked blocks.
    - AnchorGuard: missing or duplicate anchors get a fresh id; a deleted anchor is reused by heading text.
  - **Editor:**
    - `features/knowledge/data/note_autosave.dart`: port of `useAutosave` — 800 ms debounce, latest version, silent retry for a field-only 409, content-conflict pause with keep mine / load latest, offline status.
    - `features/knowledge/ui/note_editor_screen.dart`: flutter_quill with a compact toolbar and save status. Outline sheet: jump to a heading, or promote its section to a child note. `[[` and the link button open the picker. Read-only when archived, offline or in conflict. Flushes on leave.
    - `features/knowledge/ui/note_embeds.dart`: invisible anchor, live `niwaLink` chip with a missing state, line break, rule, image, locked card.
    - `features/knowledge/ui/link_picker.dart`: items, then sections (`headingsOf`).
    - `features/knowledge/ui/links_panel.dart` + `data/link_providers.dart`: outgoing and backlinks, related add/remove.
    - Item screen: Edit/Write notes button, read view scrolls to a `#h-` anchor, links panel below the children.
    - Routes `…/:itemId/edit` in both lenses; Quill localizations delegate.
  - **Dependencies:** flutter_quill 11.6, dart_quill_delta, flutter_localizations.
  - **Tests:**
    - `pm_delta_test.dart` (21): every fixture round-trips through flutter_quill's `Document`; locked fixtures, unknown node/mark, non-default link and adjacent same-kind blocks stay byte-identical; edits beside locked blocks; four anchor rules; indent clamp.
    - `note_autosave_test.dart` (8): the web autosave rules.
    - `note_editor_test.dart` (8): edit → saved PM, locked block preserved, `[[` → section link, missing link, outline promote, archived read-only, links panel, `#h-` scroll.
    - `FakeWorkspace`: 409 carries `details.current`; links endpoints; promote-section.
- **Found and fixed:**
  - Unsupported inline content mid-paragraph used to keep the half-converted text in front of the locked block; the block is now reset first.
  - Adjacent same-kind blocks would have merged into one.
- **Verified:** `flutter test` 365 pass; `flutter analyze` no issues; `dart format` clean; generated code fresh; web fixture check (11), lint, format:check, web typecheck pass. No APK build or device run (owner will say when).
- **Next:** MA7 Scheduler (day/week/month views, entries, recurrence scopes, reminders with flutter_local_notifications).

### 2026-11-04 — Mobile MA7 Scheduler + reminders
- **Plan ref:** A-02 MA7.P1–P3 (done in code; agenda view not built; device run pending)
- **Actions:**
  - **Domain:**
    - `scheduler/domain/calendar.dart`: port of `lib/dates.ts` with Monday weeks, calendar-day arithmetic and UTC all-day helpers.
    - `layout.dart`: port of `layout.ts`, plus `segmentsForDay` (clipped to the day), `allDayFor`, `entriesOn`.
    - `entry_look.dart`: live block titles, token colours, readable text.
  - **Data:**
    - `scheduleRangeProvider` (cached `cachedThenFresh` per range) and `itemScheduleProvider`.
    - `ScheduleActions`: create, update with scope (recurrence only sent for one-offs or "this and following"), retime for drags, remove with scope. Offline guard; refreshes and reminder resync.
    - `core/util/time_zone.dart` (flutter_timezone).
  - **Reminders:**
    - Drift v2 adds a `reminders` table (`entry:`/`series:` → minutes); migration from v1 keeps the outbox.
    - `scheduler/data/reminders.dart`: `planReminders` (pure), `ReminderService` (asks permission on first use, syncs 14 days ahead at sign-in/launch and after changes, cancels on logout), `NotificationGateway` + flutter_local_notifications implementation with inexact `zonedSchedule`.
  - **UI:**
    - `time_grid.dart` (day and week): all-day row, overlap columns, now line. Tap a slot to create; long-press drag to move (across days in week); bottom-edge resize from touch-down; 15-min snap.
    - `month_grid.dart`; `entry_sheet.dart` (port of `EntryDialog`: event or item block, dates/times, all-day, colour, repeat, scope, reminder, delete).
    - `scheduler_screen.dart`: view switch, previous/today/next, new entry.
    - `item_schedule_section.dart`: Schedule time + upcoming blocks on actionable items. The shell keeps reminders alive.
  - **Android:**
    - Core library desugaring.
    - `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, the notification receivers.
    - **`INTERNET` in the main manifest** — it was only in the debug/profile manifests, so a release build couldn't have reached the API.
  - **Dependencies:** flutter_timezone, flutter_local_notifications, timezone; dev `sqlite3`.
  - **Tests:**
    - `scheduler_domain_test.dart` (13): the web cases plus clipping, all-day dates, looks and contrast.
    - `scheduler_flow_test.dart` (9): slot create, drag move, edge resize, overlaps, month → day → week, repeat scopes (instance rename, delete this and following), item block, reminders on/off, refused permission, offline cache + refused edit, v1 → v2 migration.
    - `FakeWorkspace` schedule endpoints with series semantics; `FakeNotifications`; time zone override.
- **Decisions:**
  - Reminders live on the phone, not the server; per entry or per series.
  - Inexact alarms, to avoid the exact-alarm permission.
  - All-day entries have no reminder.
- **Found and fixed:** the resize edge lagged the finger by the drag slop; it now counts from touch-down.
- **Verified:** `flutter test` 387 pass; `flutter analyze` no issues; `dart format` clean; generated code fresh; root lint and format:check pass. No APK build or device run (owner will say when).
- **Next:** MA8 Inbox filing, capture details and search results.

### 2026-11-04 — Mobile MA8 Inbox, capture & search
- **Plan ref:** A-02 MA8.P1–P3 (done; stretch items — capture tile/shortcut, share intent — not built)
- **Actions:**
  - **Capture** (`capture/ui/capture_sheet.dart`):
    - Details become one paragraph per line (`textToDoc`, like the web).
    - "Suggest filing under …" offers the item on screen (the shell reads `/knowledge|actionable/:id`).
    - Save & next with an "N captured" counter, then a "Captured N items to Inbox" summary, shown after the sheet closes.
    - Drift v3 adds outbox `body` and `suggested_parent_id`, so details and suggestions survive offline; the queue sends them.
  - **Inbox:**
    - `inbox/ui/inbox_screen.dart`: newest first, suggestion chip, checkboxes and long-press select, selection bar (Delete selected, File selected), per-row File/Delete, "Inbox zero".
    - `inbox/ui/file_sheet.dart`: port of `FileDialog` — place search with paths, the suggested parent preselected, type or "Keep each type", due/tags for single items; "Filed under …" with Open. Partial failures are reported.
    - `ItemActions.removeMany` (one Undo for all); item actions refresh the Inbox.
    - `Snackbars.show` takes a general action label.
  - **Search:**
    - `search/data/search_providers.dart`: `searchProvider` (offline → title/tag search over the cached tree) and `RecentSearches` (on the phone, wiped on logout).
    - `search/ui/search_screen.dart`: 300 ms debounce into `?q=`, All/Knowledge/Actionable (`nature`), "Include archived" (`archived=1`), `Highlight` (port), path, snippet, tags, recent searches, offline banner.
  - **Tests:**
    - `inbox_search_test.dart` (5): the web capture → file single + bulk → tree scenario; details + suggested parent; delete with Undo (one, many); search titles/tags/body with highlights, filter and recents; offline search.
    - The migration test now covers v1 → v3.
    - `FakeWorkspace`: filing, search with snippets, newest-first Inbox, stored capture details.
- **Found and fixed:**
  - The capture summary snackbar was shown during a build (when the sheet closed); it's now posted after the frame.
  - A pending debounced keystroke could undo a tap on a recent search or Clear; both now cancel it.
- **Verified:** `flutter test` 392 pass; `flutter analyze` no issues; `dart format` clean; generated code fresh; root format:check passes. No APK build or device run (owner will say when).
- **Next:** MA9 Settings, Trash and images (persisted theme, Trash list/restore/purge, image upload from the phone).

### 2026-11-04 — Repo rename, push, housekeeping
- **Actions:**
  - Fast-forwarded `main` to `05ed969` and pushed. GitHub repo renamed `niwa-site` → `niwa`; `origin` updated to `https://github.com/PastelSalt/niwa.git`.
  - Docs that describe the current setup (CODEMAP, A-01, specs, OPS) now name `PastelSalt/niwa`; earlier LOGS entries keep the old name as history.
  - Deleted the merged local branch `mobile/a02-ma0-ma8`.
  - Graphify: workspace "Kyle's workspace" (`kyle-s-workspace-d9e680`); `PastelSalt/niwa` indexed at `05ed969`.
- **Verified:** CI (3m39s) and the first Flutter workflow run (7m37s) passed on `05ed969`. GAPS "Flutter CI first run" closed.

### 2026-11-04 — Mobile MA9 Settings, Trash & images (+ backend sign out everywhere)
- **Plan ref:** A-02 MA9 (done in code; live Cloudinary + device check pending)
- **Actions:**
  - **Backend + contract:**
    - `POST /auth/logout-all` (protected): revokes every refresh session of the user (`refreshSessionRepo.revokeAllForUser`, `tokenService.revokeAllForUser`, `authService.logoutAll`, controller clears the web cookie).
    - Index `{ userId, revokedAt }` on refresh sessions; OpenAPI path added.
    - Test: web cookie and phone token both rejected afterwards; 401 without a signed-in user.
  - **Flutter settings:**
    - `ApiClient.logoutEverywhere` / `SessionController.logoutEverywhere` must reach the server; if offline, nothing changes and the error is shown.
    - Settings › Account: "Sign out everywhere" with a confirmation that mentions the ≤ 15-min access-token window; version row (`core/util/app_version.dart`, package_info_plus).
    - Drift v4 adds a `preferences` table that logout doesn't wipe; `ThemeModeController` loads and saves the theme there.
  - **Trash:** `settings/ui/trash_section.dart` (port of `TrashSection`, same copy): roots only, restore (with "to the Inbox (its parent is gone)"), delete permanently with confirmation.
  - **Images:**
    - `knowledge/data/image_upload.dart`: `ImagePickerPort` (image_picker, downscaled), `cloudinaryDioProvider`, `uploadConfigProvider`, `checkImage`, `deliveryUrl`, `phoneImageUrl` (adds `w_…,c_limit` after the stored transformation; recognises transformation segments), `altFromName`, `uploadImage` (sign → multipart → confirm).
    - Editor: "Add an image" (camera or photos) → alt-text dialog → upload with a progress bar → `niwaImage` block with the web's attrs (`src`, `alt`, `title`, `width`, `height`, `attachmentId`); hidden when uploads are off.
    - Image embeds load a screen-sized URL with `cacheWidth`.
    - iOS camera and photo-library usage strings.
  - **Tests:**
    - `settings_trash_images_test.dart` (11): URL and alt helpers, size/type checks, the exact signed multipart fields, a Cloudinary error, the editor image flow saving the web node, uploads off, Trash restore/purge, theme across restart and logout, sign out everywhere offline/online, version, schema v4.
    - The migration test now covers v1 → v4.
    - `FakeWorkspace`: Trash, purge, uploads config/sign, attachments.
- **Found and fixed:** the alt-text dialog disposed its controller while the dialog was still closing; the dialog now owns it.
- **Verified:**
  - `flutter test` 403 pass; `flutter analyze` no issues; `dart format` clean; generated code fresh.
  - Backend 86, web 42, packages pass; `openapi:check`, lint, format:check pass.
  - No APK build or device run (owner will say when).
- **Next:** MA10 quality — accessibility pass (TalkBack/VoiceOver labels, text scaling), golden tests, large-tree performance; then MA11 release.

### 2026-11-04 — Scripted deploys (Render + Vercel); MA9 on hold
- **Actions:**
  - `scripts/deploy/render.sh`: validates `render.yaml` with the Render CLI if installed, finds `niwa-api` via the API, sets the `sync:false` secrets from `deploy.env`, triggers a deploy, waits, and checks `/api/v1/health`. `--env-only` and `--deploy-only` modes.
  - `scripts/deploy/vercel.sh`: creates or updates the `niwa` project via the API (Vite, root `web_app`, filtered frozen install, corepack, Git link when the GitHub app allows), sets `VITE_*`, points the `/api` rewrite at the Render URL, then links and deploys to production with `npx vercel@65.11.0`.
  - `scripts/deploy/deploy.env.example` (the real file is git-ignored); `.vercelignore`; `render.yaml` pins `NODE_VERSION=24` (corepack).
  - OPS §12 documents it. GAPS "On hold" records the uncommitted MA9 and the owner's MongoDB connection trouble, which blocks the backend deploy.
- **Verified:** both scripts pass `bash -n`; a copy of the tracked files minus `.vercelignore` paths installs (`--frozen-lockfile --filter @niwa/web...`) and builds like Vercel will. Nothing was deployed: no tokens yet, Render Blueprint not created, MongoDB unreachable.

### 2026-11-04 — Web app deployed to Vercel (ahead of the backend)
- **Actions:**
  - Committed MA9 + deploy scripts as `7a39bc9` (local; not pushed).
  - Created the Vercel project `niwa` through the Vercel connector, with the same settings as `scripts/deploy/vercel.sh` (no `VERCEL_TOKEN` in `deploy.env` yet): Vite, root `web_app`, filtered frozen pnpm install, corepack, `VITE_*` env, GitHub `PastelSalt/niwa`.
  - Production deploy from GitHub `main` (`703d233`) → READY. Project Node pinned to 24.x (it defaulted to 26.x, which has no corepack); `vercel.sh` now sets it too.
  - The owner approved connector access to the `pastelsalts-projects` scope. The per-deployment API still returned 403, but project and deployment listings work.
- **Verified:** https://niwa-delta.vercel.app returns 200 for `/` and `/knowledge` (SPA routes); `/api/v1/health` returns 404 from the not-yet-existing Render target, as expected. Team-scoped aliases redirect to Vercel login (Vercel Authentication on non-production-domain URLs).
- **Next:** fix MongoDB → Render Blueprint → `scripts/deploy/render.sh` → `CORS_ORIGINS=https://niwa-delta.vercel.app`.

### 2026-11-04 — Plan B-01 drafted (public site, legal pages, visual polish)
- **Actions:** Created `NIWA-PLAN-B-01.md`, which covers:
  - B0 owner decisions;
  - B1 public shell and routes;
  - B2 landing page at `/`;
  - B3 Privacy, Terms, EULA, Cookies and Licenses pages;
  - B4 delete account and export;
  - B5 visual polish;
  - B6 quality.
  The plan opens with a table of the data the service actually handles, checked against the code, as input for the Privacy Policy. Credit: solo developed by Moeko Works (https://moekoworks.vercel.app/).
- **Verified:** every file and section the plan cites exists. No code changed.
- **Next:** the owner answers B0 (registration mode, contact email, jurisdiction, code licence, legal review).

### 2026-11-04 — NIWA opened to everyone; onboarding tour planned
- **Owner decision:** anyone can create an account. The single-user stance in the specs no longer applies; each account keeps its own private workspace.
- **Plan B-01:**
  - B0 records the decision.
  - New milestone **B7**: an onboarding tour that you can skip, that's remembered per account, and that can be replayed from Settings and Help. It's built from MUI only and has optional example notes.
  - B1 replaces the "one account per instance" sign-up copy.
  - B4 adds password change/reset.
- **GAPS:**
  - New section "Multi-user readiness" lists the backend work, none of it coded yet:
    - registration mode;
    - onboarding state;
    - email, password reset and verification;
    - account deletion;
    - per-account quotas;
    - sign-up abuse;
    - scale checks;
    - admin tools.
  - Closed the stale "MA9 not committed" item.
- **Verified:** docs only; no code changed.

### 2026-11-04 — Docs clean-up
- **Actions:**
  - `PROJECT-SPECS.md`:
    - The status now reflects implementation progress, and the companion table lists A-02, B-01 and GAPS.
    - §2, §2.1, §2.2, §14.3 and §17 now say NIWA is open to everyone, with one private workspace per account and no sharing.
    - §16 notes which detail docs exist.
  - `docs/OPS.md`: `REGISTRATION_MODE` row says production should use `open`; the `vercel.json` section is no longer marked "planned".
  - `NIWA-PLAN-A-01.md`:
    - M2 shows the live Vercel deploy.
    - M10 shows MA0–MA9 done.
    - The single-user note is marked superseded.
  - `NIWA-PLAN-A-02.md`: MA11 privacy-policy task points at B-01 B3.P1.
  - `CODEMAP.md`:
    - plan statuses updated;
    - `SCHEDULER.md` shown as written;
    - `.vercelignore` added;
    - B-01 now B0–B7.
  - `GAPS.md`: hosting-accounts item updated (the Vercel project exists).
- **Verified:** every repo path cited in the docs exists; `prettier --check` passes. Docs only; no code changed.

### 2026-11-04 — B-01 B1 + B2: public shell and landing page
- **Plan ref:** NIWA-PLAN-B-01 B1.P1, B1.P2, B1.P4, B2 (partial)
- **Actions:**
  - `web_app/src/public/`:
    - `HomeRoute`: `/` shows the landing page to visitors and sends signed-in users to `/knowledge`.
    - `PublicLayout`: header with Log in and Create account; footer crediting Moeko Works (https://moekoworks.vercel.app/).
    - `LandingPage`, its own lazy chunk, with these sections:
      - hero with a labelled example tree from specs §3.1;
      - the three lenses;
      - Inbox and Search;
      - privacy stance;
      - maker.
    - `site.ts`.
  - Router: `/` moved out of the auth guard. `AppShell` renders `<meta name="robots" content="noindex">`.
  - `index.html`: real title and description, plus Open Graph and Twitter text tags. `public/robots.txt` and `public/sitemap.xml` added.
  - Sign-up subtitle on web and mobile is now "Your own private garden — notes, tasks and plans in one tree."
  - e2e: smoke starts at the landing page; the accessibility audit covers it.
  - `.claude/launch.json`: added `niwa-memory-npx`, since pnpm isn't on PATH on the laptop.
- **Truth check:** every landing claim matches shipped code. Search narrows by lens only, so the copy says that and doesn't mention type or tag filters. No numbers, testimonials or prices.
- **Verified:**
  - Web unit tests 46/46 pass (4 new); typecheck, lint and `format:check` clean; `flutter analyze` on auth clean.
  - In the preview (in-memory API):
    - The landing page renders at desktop and 375 px in light and dark, with no horizontal scroll.
    - Sign-up leads to `/knowledge`, and `/` redirects there once signed in.
    - The app screens carry `noindex`; `robots.txt` and `sitemap.xml` are served.
  - e2e not run locally: the Playwright browser isn't installed.
- **Next:**
  - B3 legal pages, after the B0 answers (contact email, jurisdiction, licence).
  - B1.P3 registration-mode endpoint (backend).
  - Real screenshots.
  - B7 onboarding.

### 2026-11-04 — B-01 B5: visual polish (first pass)
- **Plan ref:** NIWA-PLAN-B-01 B5
- **Actions:**
  - **Fonts:**
    - Inter (variable, Latin and Latin Extended) is self-hosted from `@fontsource-variable/inter@5.3.0`. For 庭, a single 10 KB Noto Sans JP slice is copied into the repo with its OFL licence; the full package was removed because it's an 82 MB install.
    - Both are registered through `MuiCssBaseline` in `web_app/src/app/fonts.ts`, since the pure-MUI lint rule bans stylesheet imports.
    - The theme font is now `"Inter Variable"` followed by the token list.
  - **Icons:** 192, 512, maskable 512 and Apple touch 180 PNGs; `manifest.webmanifest`; `theme-color` per colour scheme. Sources and `generate.sh` are in `web_app/assets/icons/`.
  - **Errors:** `@niwa/api-client` shows "The NIWA server is waking up — this can take up to a minute. Try again shortly." for 502–504 responses without the JSON envelope, the same as mobile. Test added.
  - **Design pass findings, all fixed:**
    - Settings tabs were cut off on phones ("Tra…"); lifted MUI's tab minimum width at xs.
    - The Scheduler day title was truncated on phones; it now uses short weekday and month names like the week title.
    - Settings › AI showed "Arrives in M8"; it now says "Not available yet."
    - Theme copy rewritten.
    - Settings gets an About line crediting Moeko Works.
  - **Reviewed with no issues:** landing, Knowledge, Focus, Scheduler month and day, Inbox, Settings — at desktop and 375 px, light and dark.
- **Verified:**
  - Web 46/46, api-client 7/7 and tokens 8/8 tests pass; typecheck, lint and `format:check` clean.
  - In the preview, `document.fonts` shows `Inter Variable 100–900` and `Noto Sans JP 400` loaded; manifest and Apple icon return 200.
  - e2e not run (no Playwright browser on the laptop).
- **Next:**
  - Rest of the design pass: editor toolbar, Search, item detail, tablet width.
  - Measure layout shift (B6).
  - Bundle fonts in Flutter.

### 2026-11-04 — B-01: account self-service, onboarding tour, policy pages, quality pass
- **Plan ref:** NIWA-PLAN-B-01 B1.P3, B2.P2, B3.P4–P5, B4, B5, B6, B7. The owner approved backend work, the Playwright download, and commit and push.
- **Backend and contracts:**
  - `GET /auth/config` returns `{ registrationOpen }`.
  - `users.onboarding` plus `PUT /account/onboarding`.
  - `POST /account/password`: needs the current password, revokes every session and returns a fresh one.
  - `GET /account/export`: JSON download, this account only.
  - `POST /account/delete`: password-confirmed. It removes the user, workspace, items, links, schedule, attachments (Cloudinary, best effort) and sessions.
  - New Zod schemas, OpenAPI regenerated; `render.yaml` sets `REGISTRATION_MODE=open`.
- **api-client:**
  - New `auth.config` and `account.*` methods.
  - A wrong-password 401 (`INVALID_CREDENTIALS`) no longer triggers a refresh-and-retry. A test caught this: the retry would have deleted the account on the second attempt.
- **Web:**
  - Sign-up is hidden when the server is closed.
  - Visitors on unknown URLs get a public 404.
  - `/cookies` page; `/licenses` page generated at build time by `licenses.plugin.ts` (148 packages).
  - Settings › Account gets change password, export and delete. Settings › Help gets "Replay the tour", and the account menu gets "Take the tour".
  - **B7 tour:**
    - A welcome dialog appears once per account, with Take the tour / Skip and opt-in example notes.
    - Seven steps anchored to `data-tour` elements, using MUI Popper with `auto` placement. Tall targets get a centred card.
    - Esc skips, focus moves in and back, and finishing or skipping is saved on the account.
  - JetBrains Mono loaded for code.
  - Landing has a "See it" section with two real screenshots (example content made for them) and a 1200×630 `og:image`.
  - CLS fix: the landing placeholder reserves height so the footer doesn't jump.
- **Flutter:**
  - Inter (400–700), JetBrains Mono and the 庭 Noto slice are bundled as TTF (converted from @fontsource 5.3.x) with their OFL texts in `LicenseRegistry`.
  - Settings › Account › Open-source licences.
  - `User.onboarding` model, fixtures and fake server updated.
- **Design pass, second round:** note editor, Search, item detail, tablet (820 px) and phone, in light and dark. Found and fixed: the tour card was off-screen or covering its target.
- **Measured** (production build, `vite preview`, landing `/`):
  - Desktop: LCP 0.8 s, CLS 0.000.
  - Phone with 4× CPU and ~4G throttling: LCP 3.3 s, CLS 0.000.
  - Before the fix, CLS was 0.106 on desktop and 0.135 on the phone. In both cases about 340 KB of JS was transferred (uncompressed preview), plus 57 KB of fonts.
- **Verified:**
  - Backend 91, contracts 8, api-client 7, web 55 unit tests pass. Flutter: 409 tests pass and `flutter analyze` is clean.
  - Typecheck, lint, `format:check` and `openapi:check` clean.
  - Playwright full suite green locally (desktop and phone), including the new `account.spec.ts`. The specs needed a `skipWelcome` step after sign-up, and the landing's logo link label was fixed for axe.
- **Still open** (`GAPS.md`):
  - Privacy, Terms, EULA and `LICENSE`, waiting on the owner's B0 answers.
  - Password reset (needs email).
  - Mobile tour and account screens.
  - Markdown export.
  - Phone LCP.
  - axe on the remaining public pages.

### 2026-11-04 — B-01 B0 + B3: owner decisions, legal pages, licence
- **Owner decisions (B0):**
  - Contact: zoletakyle.1111@gmail.com and https://moekoworks.vercel.app/.
  - Governing law: Republic of the Philippines. Users keep their own consumer-law rights.
  - Minimum age 16 ("play it safe").
  - Code licence: open source, MIT.
  - **No legal review — the owner's choice.** The pages say a solo developer wrote them.
  - Hosting region: Singapore for everything.
  - Drafts approved after reading `docs/LEGAL-DRAFTS.md`.
- **Actions:**
  - `/privacy`, `/terms` and `/eula` (app licence) pages from the approved text. Footer links on all public pages, plus a source-code link.
  - Sign-up line on web and mobile: "By creating an account you agree to the Terms of Use and Privacy Policy, and confirm you're at least 16."
  - Contact and policy links in web Settings › Help and mobile Settings › Account. Mobile uses `url_launcher` 6.3.3, with Android `<queries>` for https and mailto.
  - Contact line on `/cookies`; landing privacy section links to the policy; sitemap lists the policy pages.
  - `LICENSE` (MIT, © 2026 Moeko Works), and `"license": "MIT"` in every package.json.
  - `render.yaml`: `region: singapore` for `niwa-api` and `niwa-cache`; before this, no region was set, which Render treats as Oregon. OPS §7: create the Atlas cluster in Singapore.
  - Privacy fix (owner approved): request logs keep paths only — the query string is dropped from both the URL and the `Referer` header, so search terms aren't logged. The serializer is in `backend/src/lib/logger.ts`, with a test.
- **Verified:**
  - Backend 92, web 60 and Flutter 409 tests pass; typecheck, lint, format and OpenAPI checks clean.
  - Playwright full suite green on desktop and phone, now including an axe audit of Privacy, Terms, App licence, Cookies and Licences in light and dark.
  - Pages checked in screenshots: desktop light, phone dark.
- **Open:**
  - Password reset (needs email).
  - Mobile tour and account screens.
  - Axe on the welcome dialog and 404.
  - 200 % text check for the tour.
  - Empty-state links to tour steps.
  - Phone LCP.

### 2026-11-04 — Multi-user readiness: quotas, limits, admin tools, scale check
- **Plan ref:** GAPS "Multi-user readiness" (owner: NIWA is for many users; backend work approved; no commit yet).
- **Actions:**
  - **Quotas** (`backend/src/lib/quota.ts`): `MAX_ITEMS_PER_ACCOUNT` (10,000, Trash included) and `MAX_IMAGE_MB_PER_ACCOUNT` (200).
    - Checked on create, capture, upload sign and upload confirm. An upload over the quota is deleted from Cloudinary.
    - New error code `QUOTA_EXCEEDED`.
    - `GET /account/usage`, shown as two progress bars in Settings › Account.
  - **Rate limits:** per-account limit (600/min) behind sign-in, so one account spread across many IPs can't hog the shared server. A server-wide cap on new accounts (30/hour; failed sign-ups don't count), logged as `signup_cap_reached` when hit. e2e and `dev:memory` raise both.
  - **Admin:**
    - `users.disabledAt` / `disabledReason` and new error code `ACCOUNT_DISABLED`; login and refresh are refused while set.
    - `pnpm --filter @niwa/backend admin list | disable | enable | delete --confirm | indexes` (`scripts/admin.ts`, `services/admin.service.ts`). No admin HTTP endpoint.
    - Account deletion is shared through `purgeAccount()`.
  - **Scale check** (`scripts/scale-check.ts`): 200 accounts × 300 items plus one account at 10k (70k items). It found and fixed:
    - **Indexes in production:** `autoIndex` is off in production, and the "migration script" OPS mentioned didn't exist. A fresh Atlas database would have had no unique-email, session-TTL or per-account indexes. The server now runs `syncIndexes()` on every deployed start.
    - **Text search:** the text index wasn't scoped to the account. It's now `{ workspaceId, text… }`.
    - **Trash purge:** the cross-account purge had no usable index; added `{ deletedAt }`.
    - **Compression:** no response compression; added `compression`. `/tree` at the quota goes from 4.7 MB raw to ~128 KB gzip with the test data.
    - Tried an index for the tree's sort order; it made no difference (the cost is reading 10k docs), so it was reverted.
  - **Policy pages:** two factual additions so they stay true:
    - Privacy: a row for the disabled-account note.
    - Terms §4: accounts have item and image limits, shown in Settings.
  - **Docs:** OPS env table and new §13 (running a shared server); DATA_MODEL (`disabledAt`, indexes); CODEMAP.
- **Measured** (`scale-check`, median):
  - `/tree`: 17 ms (300 items), ~0.7 s (10k items).
  - Search: 6 ms (light) / 25 ms (10k).
  - Focus: 59 ms; usage: 9 ms; create with quota check: 10 ms; register: 38 ms.
  - Every checked query uses an index.
- **Verified:**
  - Backend 97 (new `multiuser.test.ts`, `logger.test.ts`), web 61, Flutter 409 tests pass.
  - Typecheck, lint, format and `openapi:check` clean; full Playwright suite green.
- **Still open:**
  - Email provider, then password reset and (optional) verification.
  - Lazy tree loading if accounts get near the quota.

### 2026-11-04 — Docs clean-up and "Pending by plan" summary
- **Actions:**
  - `GAPS.md` now starts with "Pending by plan": what blocks the live app, what's left in each plan (A-01, A-02, B-01), and the decisions only the owner can make. Email/password reset marked skipped for now; the two large-tree items merged.
  - `NIWA-PLAN-A-01.md`:
    - M10's old task list replaced with a pointer to A-02, where it was done.
    - Vercel project ticked.
    - Large-tree and export notes updated.
  - `NIWA-PLAN-A-02.md`:
    - Open questions answered from the owner's earlier decisions; iOS timing stays open.
    - New MA10.P4 "parity with the web" (tour, account screens, sign-up gating, quota/disabled messages).
    - MA11 privacy URL is live.
  - `NIWA-PLAN-B-01.md`: answered questions struck through, email skipped, GAPS task ticked.
  - `PROJECT-SPECS.md` and `CODEMAP.md` statuses refreshed.
  - `docs/OPS.md`: open questions moved after §13; Render region answered.
  - `docs/DATA_MODEL.md`: retention/size questions settled by the published Privacy Policy.
- **Verified:** docs only; `format:check` clean; cited paths exist.
