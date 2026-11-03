# NIWA — Plan A-01 (Execution Plan)

**Role of this file:** the **main milestone tracker**. Every unit of work maps to a milestone → phase → task here.
**Concept source:** `PROJECT-SPECS.md` (§ references below point there). If this plan contradicts the specs, the specs win.
**Plan version:** A-01
**Created:** 2026-11-03
**Repo:** `https://github.com/PastelSalt/niwa-site.git` (remote `origin`, branch `main`)
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
| `apps/web` | `frontend/` |
| `apps/desktop` | `desktop/` (created in M9) |
| `apps/mobile` | `mobile/` (created in M10) |
| `packages/*` | `packages/*` at repo root (created in M1) |

---

## Overview

| # | Milestone | Status | Depends on |
|---|---|---|---|
| M0 | Contract & docs | 🟨 Owner review (docs + contract freeze) | — |
| M1 | Foundation (backend skeleton + auth) | 🟨 Code ✅ · hosting accounts pending | M0 |
| M2 | Web shell + auth | ✅ Local · Vercel pending | M1 |
| M3 | Item tree + Actionable base | ⬜ | M2 |
| M4 | Knowledge base | ⬜ | M3 |
| M5 | Scheduler | ⬜ | M3 |
| M6 | Inbox + Search | ⬜ | M3 |
| M7 | Cloudinary + polish (**MVP complete**) | ⬜ | M4, M5, M6 |
| M8 | AI (DeepSeek) | ⬜ | M7 |
| M9 | Desktop (Electron) | ⬜ | M7 |
| M10 | Mobile (Flutter) | ⬜ | M7 |
| M11 | Graph + semantic search + export | ⬜ | M7 |
| M12 | Release | ⬜ | M7 (+ any post-MVP shipped) |

---

## M0 — Contract & docs

**Goal:** freeze the concept and the API contract so every client builds against the same thing.
**Status:** 🟨 In progress

### M0.P1 — Root documents
- [x] Create `backend/` and `frontend/` folders
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
- [x] Future `desktop/` and `mobile/` folders at repo root
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
- [x] `REGISTRATION_MODE` (default `first_user_only`) — enforces single-user

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

### M2.P1 — Frontend scaffold (`frontend/`) — ✅
- [x] Vite 8 + React 19 + TypeScript strict
- [x] MUI v9 + Emotion; theme built from `@niwa/tokens` (light + dark via CSS variables, `data-light`/`data-dark`)
- [x] React Router 8, TanStack Query, React Hook Form + Zod (contract schemas as form validators)
- [x] Enforce **pure MUI**: ESLint `no-restricted-imports` blocking other UI/styling libs and any stylesheet imports (verified it fires)
- [x] Vite dev proxy `/api` → `http://localhost:4000` (`API_PROXY_TARGET` overridable)
- [x] `frontend/.env.example`
- [x] `pnpm dev:memory` — full stack locally with an in-memory MongoDB (no Atlas needed)

### M2.P1b — Hosting setup (frontend) — needs owner accounts
- [ ] Vercel project (root `frontend`, Vite preset, ignored build step)
- [x] `frontend/vercel.json` with `/api/*` → Render rewrite + SPA fallback (`docs/OPS.md` §6) — update the Render hostname once the service exists
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
**Status:** ⬜

### M3.P1 — Items API
- [ ] `items` model with all §6.1 fields + indexes (§6.3)
- [ ] Derived `nature` from `type`
- [ ] CRUD endpoints with optimistic concurrency (`version`)
- [ ] Type transition validation (per `DATA_MODEL.md`)
- [ ] `completedAt` set/cleared on status change

### M3.P2 — Move, reorder, delete
- [ ] Fractional indexing for `orderKey` (§12.7) — move writes one row
- [ ] Move to new parent (cycle prevention)
- [ ] Soft delete with cascade to descendants; restore
- [ ] Archive / unarchive
- [ ] Trash view endpoint + "delete permanently"

### M3.P3 — Tree UI
- [ ] `@mui/x-tree-view` tree with lazy children
- [ ] Create child at any depth; rename inline
- [ ] Drag to move/reorder
- [ ] Item detail panel (title, type, status, priority, dueAt, estimate, tags)

### M3.P4 — Actionable lens
- [ ] Filter tree to `nature = actionable`
- [ ] Focus sections: In Progress, High Priority, Overdue, Upcoming, Recently Updated
- [ ] Tag editing (shared namespace)

### M3.P5 — Tests
- [ ] Service tests: orderKey generation, cascade delete, type transitions, cycle prevention
- [ ] E2E: create project → add tasks → reorder → complete

**Exit criteria:** can build a multi-level project, reorder/move it, see it in Focus sections, soft-delete and restore.

---

## M4 — Knowledge base

**Goal:** notes with rich content, outline, links, and review.
**Status:** ⬜

### M4.P1 — Editor
- [ ] TipTap editor storing ProseMirror JSON in `content`
- [ ] `contentPlainText` extraction on save (server-side)
- [ ] Autosave with version conflict handling

### M4.P2 — Outline (§5)
- [ ] Derived H1–H3 outline panel (collapsible, click to scroll)
- [ ] Guarantee headings never create items or touch `parentId`

### M4.P3 — Links
- [ ] `links` model + endpoints
- [ ] Related items picker
- [ ] Backlinks panel

### M4.P4 — Review queue
- [ ] Set/clear `reviewAt` (date-only)
- [ ] Review queue view (due today + overdue)

### M4.P5 — Tests
- [ ] Plain-text extraction tests
- [ ] Link/backlink tests
- [ ] E2E: write note with headings → outline appears → link another note → backlink shows

**Exit criteria:** knowledge lens works end-to-end with outline, links, backlinks, review queue.

---

## M5 — Scheduler

**Goal:** manual month + week/day planner with events and blocks.
**Status:** ⬜
**Pre-req doc:** `docs/SCHEDULER.md`

### M5.P1 — Scheduler doc
- [ ] Write `docs/SCHEDULER.md`: drag semantics, recurrence instances, timezone display, overlaps

### M5.P2 — Schedule API
- [ ] `schedule_entries` model (`kind: event | block`, UTC instants)
- [ ] Range query endpoint (`startAt`/`endAt` index)
- [ ] Block ↔ item linkage (derived scheduled time; no `scheduledStartAt` on item)
- [ ] Recurrence: `none | daily | weekly | monthly`, materialized instances
- [ ] Edit scope: "this instance" vs "this and future"

### M5.P3 — Month view
- [ ] Month grid with entry chips
- [ ] Drag chip to another day (preserve time)

### M5.P4 — Week / day view
- [ ] Time grid with current-time indicator
- [ ] Drag to create, drag to move, resize
- [ ] Schedule an item as a block from its detail panel

### M5.P5 — Tests
- [ ] Recurrence materialization tests
- [ ] Timezone display tests (UTC storage, local display)
- [ ] E2E: create event, create block for a task, move in month view

**Exit criteria:** can plan a month, time-block tasks, and manage simple recurrence.

---

## M6 — Inbox + Search

**Goal:** frictionless capture and one search across everything.
**Status:** ⬜

### M6.P1 — Inbox
- [ ] Quick capture endpoint (sets `inboxedAt`)
- [ ] Inbox view (query `inboxedAt != null, deletedAt == null`)
- [ ] Filing flow: pick parent + type → clears `inboxedAt`
- [ ] Global quick-capture shortcut in the web shell

### M6.P2 — Search
- [ ] MongoDB text index on `title` + `contentPlainText`
- [ ] Search endpoint with filters (type, nature, tag, status)
- [ ] Search UI with result snippets and jump-to-item

### M6.P3 — Tests
- [ ] Inbox capture/file tests
- [ ] Search relevance + filter tests

**Exit criteria:** capture → file works in under a few seconds; search finds items by title and body.

---

## M7 — Cloudinary + polish (MVP complete)

**Goal:** images in notes and a production-quality MVP.
**Status:** ⬜

### M7.P1 — Cloudinary
- [ ] Server-side upload signature endpoint (secret never leaves server)
- [ ] Browser direct upload; `attachments` record
- [ ] TipTap image insertion
- [ ] Orphan attachment cleanup (per `DATA_MODEL.md`)

### M7.P2 — UX states
- [ ] Empty, loading, and error states on every screen
- [ ] Keyboard navigation across tree, editor, scheduler

### M7.P3 — Accessibility & quality
- [ ] Accessibility audit (contrast in both themes, focus order, ARIA on tree/calendar)
- [ ] Performance pass on large trees
- [ ] Core test suite green; coverage review

### M7.P4 — Backups (flagged gap)
- [ ] Finalize backup strategy in `docs/OPS.md`
- [ ] Local backup script for MongoDB

**Exit criteria:** every §14.1 MVP bullet works locally; backups defined.

---

## M8 — AI (DeepSeek)

**Goal:** explicit, per-item AI help with zero silent changes.
**Status:** ⬜
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
**Status:** ⬜

### M10.P1 — Scaffold
- [ ] Flutter 3.x project; Riverpod 3; go_router; Dio
- [ ] Dart models generated from OpenAPI (freezed + json_serializable)
- [ ] Dart theme from `tokens`

### M10.P2 — Auth & storage
- [ ] Refresh token in `flutter_secure_storage`
- [ ] Drift/SQLite local cache; connectivity_plus handling

### M10.P3 — Features
- [ ] Tree, Actionable lens, Focus sections
- [ ] `flutter_quill` editor (content conversion strategy defined)
- [ ] Scheduler (month + day)
- [ ] Inbox capture, Search

### M10.P4 — Tests
- [ ] `flutter_test` unit/widget tests
- [ ] `integration_test` against local API

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
- [ ] Export format (JSON + Markdown) per `docs/OPS.md`
- [ ] Full export endpoint + import with validation

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
