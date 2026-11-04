# NIWA — Plan A-01 (Execution Plan)

**Role of this file:** the **main milestone tracker**. Every unit of work maps to a milestone → phase → task here.
**Concept source:** `PROJECT-SPECS.md` (§ references below point there). If this plan contradicts the specs, the specs win.
**Plan version:** A-01
**Created:** 2026-11-03
**Repo:** `https://github.com/PastelSalt/niwa.git` (remote `origin`, branch `main`)
**Hosting:** backend → Render · frontend → Vercel · DB → MongoDB Atlas · images → Cloudinary · cache → Render Key Value (`PROJECT-SPECS.md` §11.8, `docs/OPS.md`)
**Frontend rule:** pure MUI (`PROJECT-SPECS.md` §11.7)

---

## How to use this plan

- **Hierarchy:** Milestone (`M#`) → Phase (`M#.P#`) → Task (checkbox).
- **Status per milestone/phase:** `⬜ Not started` · `🟨 In progress` · `✅ Done` · `⛔ Blocked`.
- Tick a task (`- [x]`) only when it's done **and** verified (test passes / runs locally).
- Every completed task or phase gets a line in `LOGS.md`. Every new folder/module gets an entry in `CODEMAP.md`.
- **Exit criteria** must all be true before a milestone is marked ✅.
- **Gate rule (§15):** no client milestone (M2+) starts before `openapi.yaml` v0.1 is frozen (M0/M1).

### Folder mapping

| Spec name | Local folder |
|---|---|
| `apps/api` | `backend/` |
| `apps/web` | `web_app/` |
| `apps/desktop` | `desktop_app/` (created in M9) |
| `apps/mobile` | `flutter_app/` (created in M10) |
| `packages/*` | `packages/*` at repo root (created in M1) |

---

## Overview

| # | Milestone | Status | Depends on |
|---|---|---|---|
| M0 | Contract & docs | 🟨 Owner review (docs + contract freeze) | — |
| M1 | Foundation (backend skeleton + auth) | 🟨 Code ✅ · hosting accounts pending | M0 |
| M2 | Web shell + auth | ✅ Local · live on Vercel (niwa-delta.vercel.app; API not deployed yet) | M1 |
| M3 | Item tree + Actionable base | ✅ Local | M2 |
| M4 | Knowledge base | ✅ Local | M3 |
| M5 | Scheduler | ✅ Local | M3 |
| M6 | Inbox + Search | ✅ Local | M3 |
| M7 | Cloudinary + polish (**MVP complete**) | 🟨 Local · large-tree perf pass + live Cloudinary check open | M4, M5, M6 |
| M8 | AI (DeepSeek) | ⏸ Deferred by owner (2026-11-04) | M7 |
| M9 | Desktop (Electron) → `desktop_app/` | ⬜ After mobile | M7 |
| M10 | Mobile (Flutter) → `flutter_app/` | ➡ Moved to `NIWA-PLAN-A-02.md` (MA0–MA9 done) | M7 |
| M11 | Graph + semantic search + export | ⬜ | M7 |
| M12 | Release | ⬜ | M7 (+ any post-MVP shipped) |

---

## M0 — Contract & docs

**Goal:** freeze the concept and the API contract so every client builds against the same thing.
**Status:** 🟨 In progress

### M0.P1 — Root documents
- [x] Create `backend/` and `web_app/` folders
- [x] Write `PROJECT-SPECS.md` (concept source of truth)
- [x] Write `NIWA-PLAN-A-01.md` (this file)
- [x] Write `CODEMAP.md`
- [x] Write `LOGS.md`

### M0.P2 — Dedicated concept docs (§16) — 🟨 drafted, awaiting owner review
- [x] `docs/CONCEPT.md` — navigation shell for six destinations; cross-base item visibility; capture → classify flow; heading-to-item promotion; links to sections
- [x] `docs/DATA_MODEL.md` — type transition matrix; tag namespace rules; attachment orphan cleanup; `contentPlainText` extraction rules
- [x] `docs/OPS.md` (first pass) — services, environments, local dev, env vars, Render/Vercel/Atlas/Cloudinary config, backups draft, CI/CD
- [ ] Owner answers the "Open questions" at the end of each doc
- [ ] Fold accepted `DATA_MODEL.md` §1 field additions into `PROJECT-SPECS.md` §6; mark the three docs "Accepted"

### M0.P3 — Workspace scaffold decisions — ✅
- [x] Shared packages live in `packages/` at repo root (one pnpm workspace)
- [x] Future `desktop_app/` and `flutter_app/` folders at repo root
- [x] Pin Node 24 LTS in `.nvmrc`; pnpm via Corepack (version pinned in root `package.json` `packageManager` in M1)
- [x] `git init` (branch `main`) + remote `origin` → GitHub + `.gitignore` + `.editorconfig` + `.gitattributes`
- [x] Record hosting (Render / Vercel / Atlas / Cloudinary / Render Key Value) and pure-MUI rule in `PROJECT-SPECS.md`
- [x] First commit + push to `origin/main`

### M0.P4 — API contract v0.1 — 🟨 generated, awaiting owner freeze
- [x] Draft Zod schemas for `Item`, `Workspace`, `Link`, `ScheduleEntry`, `Attachment`, `User` (§6) — `packages/contracts/src/`
- [x] Define error envelope shape (`{ error: { code, message, details?, requestId? } }`) + `ErrorCode` enum
- [x] Define endpoints list: health, auth, workspace, items, focus, review, inbox, trash, tags, links, schedule, search, uploads, ai (46 operations)
- [x] Generate `packages/contracts/openapi.yaml` (OpenAPI 3.1) from Zod — `pnpm openapi`; CI fails if stale (`pnpm openapi:check`)
- [ ] Owner review against spec → **freeze v0.1** (scheduler paths stay provisional until `SCHEDULER.md`)

**Exit criteria:** all root + concept docs exist; `openapi.yaml` v0.1 frozen; folder layout decided.

---

## M1 — Foundation

**Goal:** a runnable, tested, layered backend with working auth.
**Status:** 🟨 In progress — code done and tested locally; hosting accounts (M1.P2b) and api-client pending

### M1.P1 — Monorepo tooling — ✅
- [x] pnpm workspace config at root (`pnpm-workspace.yaml`, `allowBuilds` policy)
- [x] Shared `tsconfig.base.json` (strict, `erasableSyntaxOnly` → Node runs `.ts` directly, no build)
- [x] ESLint (flat config, typescript-eslint) + Prettier shared config
- [x] Root scripts: `dev`, `start`, `test`, `lint`, `typecheck`, `format`, `openapi`, `openapi:check`
- [x] `.github/workflows/ci.yml` — lint, format, typecheck, OpenAPI check, tests

### M1.P2 — Backend skeleton (`backend/`) — ✅
- [x] Express 5 app (`src/app.ts`) + server entry (`src/server.ts`) with graceful shutdown
- [x] Zod-validated env loading at startup (fail fast) — `src/config/env.ts`
- [x] Layered folders: `routes → controllers → services → repositories`
- [x] MongoDB connection (Mongoose, `.lean()` on reads; `autoIndex` only local/test)
- [x] Redis connection (ioredis; optional locally)
- [x] helmet, narrow CORS, rate limiting (general 300/min, auth 20/15 min; Redis store when available)
- [x] Pino logger with redaction (no passwords/tokens/keys/cookies/note content) + request ids
- [x] Centralized error middleware + consistent envelope (AppError, ZodError, bad JSON, 404)
- [x] `GET /api/v1/health`
- [x] `trust proxy` set (Render); in-memory rate-limit fallback only when `APP_ENV=local|test`
- [x] `backend/.env.example`

### M1.P2b — Hosting setup (backend) — needs owner accounts
- [ ] MongoDB Atlas project + `niwa_dev` / `niwa_prod` databases + least-privilege users
- [ ] Atlas network access (Render outbound IPs) — see `docs/OPS.md` §7
- [x] `render.yaml` Blueprint (web service `niwa-api` + Key Value `niwa-cache`), health check `/api/v1/health`
- [ ] Connect repo in Render (Blueprint), fill `sync: false` env vars
- [ ] First Render deploy of the health endpoint

### M1.P3 — Auth (§12.1) — ✅
- [x] `users` model; password hashing (Argon2id via `@node-rs/argon2`, timing-equalized login)
- [x] `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `GET /auth/me`, `GET /workspace`
- [x] Access token (HS256 JWT, 10 min default, Bearer) + opaque refresh token (14 days default, rotated, reuse revokes family)
- [x] Refresh token via HttpOnly `SameSite=Lax` cookie on web (+ `X-Requested-With: niwa` CSRF guard); body token for `X-Client: desktop|mobile`
- [x] Auth middleware on protected routes
- [x] Create default workspace + root containers (Knowledge / Projects / College / Personal) on register
- [x] `REGISTRATION_MODE` (default `first_user_only`) — enforces single-user *(2026-11-04: NIWA is now open to everyone; production moves to `open` — `NIWA-PLAN-B-01.md`, `GAPS.md`)*

### M1.P4 — Contract & tokens packages
- [x] `contracts` package: Zod → OpenAPI generation script
- [x] `api-client` package — done in M2.P0 (typed from contracts, not generated)
- [x] `tokens` package: NIWA palette (sage, cream, blossom pink, charcoal, gray-green) for light + dark (§1)

### M1.P5 — Tests — ✅
- [x] Vitest + Supertest + `mongodb-memory-server` setup
- [x] Auth flow tests (register, login, refresh rotation, reuse revocation, CSRF, logout, native client)
- [x] Error envelope + env validation tests
- [x] Contract tests (tags, dates, nature, schedule refinements, OpenAPI paths)

**Exit criteria:** `pnpm dev` runs the API locally; auth tests green; OpenAPI regenerates from Zod.

---

## M2 — Web shell + auth

**Goal:** a themed, navigable web client with login.
**Status:** ✅ Done locally (2026-11-03) — Vercel hosting (M2.P1b) pending owner accounts
**Note:** started before the contract freeze at owner's request; M2 uses only auth/workspace endpoints, which are stable.

### M2.P0 — API client — ✅
- [x] `packages/api-client`: typed client on `@niwa/contracts` types (no codegen needed for TS); in-memory access token, single-flight refresh on 401, error envelope → `ApiError`, CSRF header on web, `X-Client` + secure-store refresh for native

### M2.P1 — Frontend scaffold (`web_app/`) — ✅
- [x] Vite 8 + React 19 + TypeScript strict
- [x] MUI v9 + Emotion; theme built from `@niwa/tokens` (light + dark via CSS variables, `data-light`/`data-dark`)
- [x] React Router 8, TanStack Query, React Hook Form + Zod (contract schemas as form validators)
- [x] Enforce **pure MUI**: ESLint `no-restricted-imports` blocking other UI/styling libs and any stylesheet imports (verified it fires)
- [x] Vite dev proxy `/api` → `http://localhost:4000` (`API_PROXY_TARGET` overridable)
- [x] `web_app/.env.example`
- [x] `pnpm dev:memory` — full stack locally with an in-memory MongoDB (no Atlas needed)

### M2.P1b — Hosting setup (frontend) — needs owner accounts
- [x] Vercel project (root `web_app`, Vite preset, ignored build step) — `niwa`, live at https://niwa-delta.vercel.app (2026-11-04)
- [x] `web_app/vercel.json` with `/api/*` → Render rewrite + SPA fallback (`docs/OPS.md` §6) — update the Render hostname once the service exists
- [ ] Verify refresh cookie works end-to-end on the Vercel preview URL

### M2.P2 — Auth UI — ✅
- [x] Login and register pages (server errors shown inline; registration-closed message)
- [x] Access token in memory; silent refresh via cookie (session survives reload)
- [x] Protected routes (usability only — API enforces auth); return to requested page after login
- [x] Logout (account menu + Settings → Account)

### M2.P3 — Navigation shell — ✅
- [x] Layout: rail, lens-scoped tree pane, main panel, detail panel (docked ≥ lg, overlay md–lg)
- [x] Six destinations: Knowledge, Actionable, Scheduler, Inbox, Search, Settings (routes per CONCEPT.md §1.3; placeholders name their milestone)
- [x] Theme toggle (Light / Dark / System) in Settings → Appearance, persisted
- [x] Responsive layout: phone uses BottomNavigation, no horizontal scroll at 375px
- [x] Keyboard: `g k/a/s/i`, `/` focuses search (ignored while typing); top-bar search → `/search?q=`

### M2.P4 — Tests — ✅
- [x] RTL tests for auth forms, route guards, shell, shortcuts, search, logout (15)
- [x] Playwright smoke (desktop + phone): register → shell → reload keeps session → logout → login; theme toggle
- [x] CI: frontend build + e2e job

**Exit criteria:** ✅ can register, log in, navigate all six destinations, switch theme (verified in browser + e2e).

---

## M3 — Item tree + Actionable base

**Goal:** the core item tree with CRUD, move, reorder, and the Actionable lens.
**Status:** ✅ Done locally (2026-11-03)

### M3.P1 — Items API — ✅
- [x] `items` model with all §6.1 fields + indexes (§6.3) + `deleteRoot`, tags index
- [x] Derived `nature` from `type` (serializer; never stored)
- [x] CRUD endpoints with optimistic concurrency (`version`; 409 `VERSION_CONFLICT` returns the current item)
- [x] Type transitions: all allowed, actionable fields kept across round trips (DATA_MODEL.md §3)
- [x] `completedAt` set/cleared on status change
- [x] `GET /tree` (whole filed tree, no content) + `GET /items/:id/ancestors`
- [x] `contentPlainText` extraction on save (ready for M4/M6)

### M3.P2 — Move, reorder, delete — ✅
- [x] Fractional indexing for `orderKey` (§12.7) — server-minted from `beforeId`/`afterId`; rebalance past 50 chars
- [x] Move to new parent (cycle + self prevention; neighbours must be siblings)
- [x] Soft delete with cascade to descendants; restore by batch (to original parent, or Inbox if it's gone)
- [x] Archive / unarchive (hides the subtree)
- [x] Trash view endpoint + "delete permanently" (removes everything under the item)
- [x] `GET /focus`, `GET /tags`, `POST /tags/rename` (merge)

### M3.P3 — Tree UI — ✅
- [x] `@mui/x-tree-view` SimpleTreeView (full tree loaded once — per-account scale; no lazy loading needed)
- [x] Create child at any depth (hover +, menu, Inside list); rename inline in the item view
- [x] Drag to move/reorder (native HTML5 DnD: before / inside / after zones) — MUI X drag-reorder is Pro-only
- [x] Keyboard: Alt+↑/↓ reorder, Tab/Shift+Tab indent/outdent, Del delete; item menu with Move to…
- [x] Item detail panel (type, status, priority, due, estimate, review, tags, source URL, move/archive/delete)
- [x] Item view: breadcrumbs, editable title, chips, children list; delete with Undo snackbar
- [x] Phone: tree is the lens home; item fields shown inline

### M3.P4 — Actionable lens — ✅
- [x] Lens filtering: items of the lens's nature + dimmed context ancestors; roots always shown (CONCEPT.md §2)
- [x] Focus sections: Overdue, In Progress, High Priority, Upcoming (7 days), Recently Updated; complete with a checkbox
- [x] Tag editing (shared namespace, normalized, suggestions from existing tags)
- [x] Settings → Trash: restore / delete permanently

### M3.P5 — Tests — ✅
- [x] Backend integration (19 new): order keys, rebalance, cascade delete/restore batches, Inbox fallback, purge, cycles, versions, type round trip, plain text, focus, tags, cross-workspace isolation
- [x] Frontend unit: treeModel (lens view, moves, drop rules)
- [x] E2E: create project → add tasks → keyboard reorder/indent → status → complete from Focus → delete/undo → Trash restore; lens filtering; drag and drop

**Exit criteria:** ✅ build a multi-level project, reorder/move it, see it in Focus, soft-delete and restore (e2e verified).

---

## M4 — Knowledge base

**Goal:** notes with rich content, outline, links, and review.
**Status:** ✅ Done locally (2026-11-03)

### M4.P1 — Editor — ✅
- [x] TipTap 3 editor storing ProseMirror JSON in `content` (every item type has a body; styled via MUI `sx`)
- [x] `contentPlainText` extraction on save (server-side)
- [x] Autosave (800 ms debounce, flush on blur/leave, tab-close warning) with version conflict handling: field-only conflicts retried silently; real conflicts pause with "Keep mine / Load latest"
- [x] Formatting toolbar (H1–H3, bold, italic, strike, code, lists, quote, code block, link-to-item) + save status
- [x] Opening a note never counts as an edit (baseline = editor's normalized JSON)

### M4.P2 — Outline (§5) — ✅
- [x] Derived H1–H3 outline panel (collapsible, click to scroll, updates the `#h-` hash)
- [x] Stable heading `anchorId`s (unique even after copy/paste)
- [x] Headings never create items or touch `parentId` — only explicit **Promote to child item** (outline menu) does
- [x] Promote section → child item + inline link left behind (`POST /items/:id/promote-section`, atomic)
- [x] Section deep links `/items/:id#h-<anchor>`; missing section → notice (CONCEPT.md §5.3)

### M4.P3 — Links — ✅
- [x] `links` model + endpoints (`GET /items/:id/links`, `POST /links`, `DELETE /links/:id`)
- [x] Inline `[[` links with optional section (→ / Tab in the picker); content links synced on every save
- [x] Related items picker (manual links)
- [x] Backlinks panel with section names; links to deleted items hidden, removed on purge

### M4.P4 — Review queue — ✅
- [x] Set/clear `reviewAt` (date-only) in details
- [x] Review queue view `/knowledge/review` (due today + overdue) with "again in 1 week / 1 month / 3 months / Done"
- [x] Knowledge home shows how many notes are due

### M4.P5 — Tests — ✅
- [x] Backend (8 new): content-link sync, ignores self/unknown ids, deleted/restored/purged targets, manual links, review queue, promote (incl. nested headings, stale version, missing heading)
- [x] Frontend unit: autosave latest-version, silent retry, conflict pause/keep/load
- [x] E2E: headings → outline → `[[` link to a section → reload persists → follow link → backlink → promote → broken-section notice → review queue

**Exit criteria:** ✅ knowledge lens works end-to-end with outline, links, backlinks, review queue (e2e verified, 3× repeat).

---

## M5 — Scheduler

**Goal:** manual month + week/day planner with events and blocks.
**Status:** ✅ Done locally (2026-11-03)
**Pre-req doc:** `docs/SCHEDULER.md` ✅

### M5.P1 — Scheduler doc — ✅
- [x] `docs/SCHEDULER.md`: entries vs series, timezones (UTC + IANA wall-clock stepping, all-day as UTC dates), recurrence + materialization, edit scopes, drag semantics, overlaps, item ↔ block rules

### M5.P2 — Schedule API — ✅
- [x] `schedule_entries` model (`kind: event | block`, UTC instants) + `schedule_series` (rule, anchor, duration, timeZone, materializedThrough, untilIndex)
- [x] Range query endpoint (overlap on `startAt`/`endAt`, ≤ 62 days) that materializes recurrences on demand
- [x] Block ↔ item linkage (derived scheduled time via `GET /items/:id/schedule`; hidden when the item is deleted, removed on purge)
- [x] Recurrence: `none | daily | weekly | monthly`, DST-safe in the creator's zone, monthly clamping without drift, never re-creates deleted occurrences
- [x] Edit/delete scope: "this event" (detached) vs "this and following" (splits the series)

### M5.P3 — Month view — ✅
- [x] Month grid (Monday start) with entry chips, all-day bars, "+N more" → day view, today marker
- [x] Drag chip to another day (preserves time and duration)

### M5.P4 — Week / day view — ✅
- [x] Time grid with current-time indicator, all-day row, side-by-side overlap layout
- [x] Drag to create, drag to move (across days), resize bottom edge (15-min snap); click to edit
- [x] Schedule an item as a block from its detail panel ("Scheduled" list + "Schedule time")
- [x] Entry dialog: event / time block, all-day, dates/times, colour (token swatches), repeat, scope choice, delete
- [x] Phones open on the day view

### M5.P5 — Tests — ✅
- [x] Recurrence/timezone unit tests (Manila, New York DST gap, weekly across DST, month-end clamping, leap year, all-day)
- [x] API tests: overlap ranges, validation, all-day normalisation, materialization, both scopes for edit and delete, one-off ↔ series, blocks (upcoming, hide on delete, purge)
- [x] Frontend unit: overlap layout, week/month grid dates, all-day keys
- [x] E2E: month create + drag to another day; week drag-create, move, resize; weekly repeat with "this and following" and single delete; schedule a block from an item

**Exit criteria:** ✅ can plan a month, time-block tasks, and manage simple recurrence (e2e verified).

---

## M6 — Inbox + Search

**Goal:** frictionless capture and one search across everything.
**Status:** ✅ Done locally (2026-11-03)

### M6.P1 — Inbox — ✅
- [x] Quick capture endpoint `POST /inbox` (sets `inboxedAt`, default type idea, optional body and `suggestedParentId`)
- [x] Inbox view `GET /inbox` (newest first) with count badge on the nav
- [x] Filing flow `POST /items/:id/file`: parent + type (+ due, tags) → clears `inboxedAt`, appends to the parent
- [x] Bulk filing (multi-select → one parent, keep or set type)
- [x] Global quick capture: `c` anywhere / Capture button; Enter saves, Shift+Enter saves and keeps going; suggests the open item as parent
- [x] Opening an inbox item shows "In your Inbox — File"

### M6.P2 — Search — ✅
- [x] MongoDB weighted text index (`title` 10, `tags` 5, `contentPlainText` 1) + substring fallback for partial words
- [x] `GET /search` with filters (type, nature, status, tag, include archived); inbox included, deleted never
- [x] Search UI: URL-synced query (debounced), base filter, archived toggle, highlighted titles and body snippets, path + tags, jump to item

### M6.P3 — Tests — ✅
- [x] Backend (10): capture, suggested parent, filing (type/due/tags), guards (double file, stale version, inbox parent, move), ranking, tags, partial words, filters, archived, deleted, regex-safe input
- [x] E2E (desktop + phone): capture ×3 with Shift+Enter → inbox badge → file one → bulk-file two → in the tree; search by partial word, tag and body with highlights → open result

**Exit criteria:** ✅ capture → file in seconds; search finds items by title, tags and body (e2e verified).

---

## M7 — Cloudinary + polish (MVP complete)

**Goal:** images in notes and a production-quality MVP.
**Status:** 🟨 Local — all phases done except the large-tree performance pass; Cloudinary verified against a fake API (live account pending, like M1 hosting).

### M7.P1 — Cloudinary
- [x] Server-side upload signature endpoint (secret never leaves server)
- [x] Browser direct upload; `attachments` record
- [x] TipTap image insertion (paste, drop, toolbar; alt-text dialog)
- [x] Orphan attachment cleanup (per `DATA_MODEL.md`) + Trash 30-day purge

### M7.P2 — UX states
- [x] Empty, loading, and error states on every screen (route error boundaries, stale-chunk reload, lazy-route progress)
- [x] Keyboard navigation across tree, editor, scheduler (entries are focusable buttons; create via New)

### M7.P3 — Accessibility & quality
- [x] Accessibility audit (contrast in both themes, focus order, ARIA on tree/calendar) — `e2e/a11y.spec.ts` + token contrast tests
- [ ] Performance pass on large trees *(2026-11-04: server side measured by `pnpm --filter @niwa/backend scale-check` — `/tree` ~0.7 s at 10k items, gzip on; browser rendering of a 2–5k tree still to measure — `GAPS.md`)*
- [x] Core test suite green (coverage review: every endpoint group has integration tests; UI flows covered by e2e)

### M7.P4 — Backups (flagged gap)
- [x] Finalize backup strategy in `docs/OPS.md`
- [x] Local backup script for MongoDB (`backup` / `restore`, portable format) + nightly encrypted workflow

**Exit criteria:** every §14.1 MVP bullet works locally; backups defined.

---

## M8 — AI (DeepSeek)

**Goal:** explicit, per-item AI help with zero silent changes.
**Status:** ⏸ Deferred by owner (2026-11-04) — mobile first.
**Pre-req doc:** `docs/AI.md`

### M8.P1 — AI doc
- [ ] Write `docs/AI.md`: prompts, streaming, long-note strategy, key-error UX, rate limits, cost visibility, testing

### M8.P2 — Key storage (§8.1, §12.10)
- [ ] `POST /api/v1/ai/key` — AES-256-GCM, random 12-byte IV, auth tag stored
- [ ] `AI_ENCRYPTION_KEY` from env (32 bytes)
- [ ] Key never returned; delete/replace key endpoint
- [ ] `aiEnabled` toggle (workspace + item level)

### M8.P3 — AI actions (§8.2)
- [ ] `openai` package with `baseURL: https://api.deepseek.com`
- [ ] Summarize item (user chooses to append)
- [ ] Suggest child breakdown → drafts land in Inbox
- [ ] Auto-tag (3–5 suggestions, accept/reject)

### M8.P4 — UX & rules (§8.3)
- [ ] "Sending this item to DeepSeek" indicator before every call
- [ ] Only targeted item (± children) sent; never attachments/siblings
- [ ] Clear invalid/expired key messages

### M8.P5 — Tests
- [ ] Encryption round-trip tests
- [ ] Mocked DeepSeek tests for each action
- [ ] Test: nothing auto-created without acceptance

**Exit criteria:** all three actions work with a real key; no AI path modifies data without confirmation.

---

## M9 — Desktop (Electron)

**Goal:** desktop client reusing the React stack.
**Status:** ⬜

### M9.P1 — Shell
- [ ] Electron Forge project
- [ ] `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, strict CSP
- [ ] Navigation restricted to trusted origins

### M9.P2 — Integration
- [ ] Preload `contextBridge` API with named, validated channels
- [ ] Refresh token in OS keychain (`safeStorage`)
- [ ] Reuse shared UI package

### M9.P3 — Desktop features
- [ ] Native menus + shortcuts
- [ ] Window state persistence (Zustand for panel/window state)
- [ ] Command palette

### M9.P4 — Packaging
- [ ] ASAR integrity + fuses
- [ ] Build installers for target OS

**Exit criteria:** packaged desktop app with parity to web MVP.

---

## M10 — Mobile (Flutter)

**Goal:** mobile client with full data/behavior parity, differentiated UI.
**Status:** ➡ Superseded by **`NIWA-PLAN-A-02.md`** (MA0–MA11). The tasks below are kept for reference only.

All of M10's original tasks were done in A-02 MA1–MA9 (2026-11-04), except `integration_test` against the local
API, which is A-02 MA10.P2. Models are hand-written freezed classes checked against `openapi.yaml`
(`flutter_app/test/contract_test.dart`) rather than generated.

**Exit criteria:** mobile passes parity checklist against the contract (graph excepted).

---

## M11 — Graph + semantic search + export

**Status:** ⬜
**Pre-req doc:** `docs/GRAPH.md`

### M11.P1 — Graph view
- [ ] Write `docs/GRAPH.md` (layout choice, trigger, 1000+ node target)
- [ ] React Flow + Dagre/ELKjs, read-only, pan/zoom, filters, click-to-open

### M11.P2 — Semantic search
- [ ] Embedding generation + storage
- [ ] Hybrid search (text + semantic)

### M11.P3 — Export / import
- [ ] Export format (JSON + Markdown) per `docs/OPS.md` *(2026-11-04: JSON export shipped — `GET /account/export`, B-01 B4; Markdown still open)*
- [ ] Full export endpoint + import with validation *(export done; import open)*

**Exit criteria:** graph renders 1000+ nodes within target; export → import round-trips cleanly.

---

## M12 — Release

**Status:** ⬜

### M12.P1 — Ops
- [ ] Finalize `docs/OPS.md`: hosting, MongoDB (Atlas vs self-hosted), Redis, CI/CD
- [ ] HTTPS, secrets management

### M12.P2 — Reliability
- [ ] Automated backups + tested restore
- [ ] Monitoring + error alerting

### M12.P3 — Docs
- [ ] User guide
- [ ] Developer README (setup, scripts, architecture)

**Exit criteria:** deployed, backed up, monitored, documented.

---

## Change history

| Date | Change |
|---|---|
| 2026-11-03 | Plan A-01 created. M0.P1 complete. |
| 2026-11-03 | M0.P2 drafted, M0.P3 done. Added hosting tasks (M1.P2b, M2.P1b) and pure-MUI enforcement task. |
| 2026-11-03 | M0.P4 contract generated. M1.P1/P2/P3/P5 done; api-client moved to start of M2. |
| 2026-11-03 | M2 done locally (api-client, frontend scaffold, auth UI, shell, tests). |
| 2026-11-03 | M3 done locally (items API, tree UI, detail panel, Focus, Trash). |
| 2026-11-03 | M4 done locally (editor, outline, promote, links/backlinks, review queue). |
| 2026-11-03 | M5 done locally (SCHEDULER.md, schedule API with recurrence, month + week/day views, item blocks). |
| 2026-11-03 | M6 done locally (quick capture, inbox + filing, search). Only M7 remains for the MVP. |
| 2026-11-04 | M7 done locally except large-tree perf pass (see `GAPS.md`). Folders renamed: `frontend` → `web_app`, plus `flutter_app/`, `desktop_app/`. M8 deferred; mobile moved to `NIWA-PLAN-A-02.md` as next priority. |
