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
