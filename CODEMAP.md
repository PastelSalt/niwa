# NIWA — Code Map

**Role of this file:** the map of the codebase. Check here before creating or moving files; update it whenever a folder, module, or key file is added, moved, or removed.
**Last updated:** 2026-11-03

**Legend:** ✅ exists · 🔜 planned (not created yet) · `M#` = milestone in `NIWA-PLAN-A-01.md` that creates it

---

## 1. Repo root

```text
niwa-site/
├─ PROJECT-SPECS.md          ✅ concept source of truth
├─ NIWA-PLAN-A-01.md         ✅ milestones → phases → tasks
├─ CODEMAP.md                ✅ this file
├─ LOGS.md                   ✅ action log
├─ docs/
│  ├─ CONCEPT.md             ✅ draft — nav shell, lens visibility, capture/file, promotion, section links
│  ├─ DATA_MODEL.md          ✅ draft — field additions, limits, type matrix, ordering, delete/restore, tags, attachments, search
│  ├─ OPS.md                 ✅ draft — services, envs, env vars, Render/Vercel/Atlas/Cloudinary, backups, CI
│  └─ SCHEDULER.md · AI.md · GRAPH.md   🔜 M5 / M8 / M11
├─ package.json              ✅ root scripts: dev, dev:memory (no Atlas), build, test, e2e, lint, typecheck, format, openapi; pnpm@12.15.0
├─ pnpm-workspace.yaml       ✅ backend, frontend, desktop, packages/* · allowBuilds policy
├─ pnpm-lock.yaml            ✅
├─ tsconfig.base.json        ✅ strict, NodeNext, erasableSyntaxOnly, allowImportingTsExtensions, noEmit
├─ eslint.config.js          ✅ flat config + typescript-eslint
├─ .prettierrc.json / .prettierignore   ✅
├─ .nvmrc                    ✅ 24
├─ .gitignore / .gitattributes / .editorconfig   ✅
├─ render.yaml               ✅ Render Blueprint: web `niwa-api` + Key Value `niwa-cache`
├─ .github/workflows/ci.yml  ✅ check: lint → format → typecheck → openapi:check → test → build · e2e job · 🔜 M7 backup.yml
├─ .claude/launch.json       ✅ preview config (pnpm dev:memory on 5173)
├─ packages/
│  ├─ contracts/             ✅ Zod schemas + generated openapi.yaml
│  ├─ tokens/                ✅ design tokens
│  ├─ api-client/            ✅ typed client (web + desktop)
│  └─ ui/                    🔜 M9 shared MUI components
├─ backend/                  ✅ NIWA API → Render
├─ frontend/                 ✅ web client → Vercel
├─ desktop/                  🔜 M9 Electron Forge
└─ mobile/                   🔜 M10 Flutter (outside pnpm)
```

Git: branch `main`, remote `origin` = `https://github.com/PastelSalt/niwa-site.git` (pushed).

**No build step for TypeScript.** All code uses erasable-only TS syntax, so Node 24 runs `.ts` directly (backend, scripts, and workspace packages). Imports use explicit `.ts` extensions. `tsc` is typecheck-only. Frontend will be bundled by Vite.

---

## 2. Spec → folder mapping

| Spec (§11.6) | Folder | Hosting | Status |
|---|---|---|---|
| `apps/api` | `backend/` | Render | ✅ M1 |
| `apps/web` | `frontend/` | Vercel | ✅ M2 |
| `apps/desktop` | `desktop/` | — | 🔜 M9 |
| `apps/mobile` | `mobile/` | — | 🔜 M10 |
| `packages/contracts` | `packages/contracts/` | — | ✅ |
| `packages/api-client` | `packages/api-client/` | — | ✅ |
| `packages/tokens` | `packages/tokens/` | — | ✅ |
| `packages/ui` | `packages/ui/` | — | 🔜 M9 |

External services: MongoDB Atlas (DB), Cloudinary (images), Render Key Value (Redis). See `docs/OPS.md`.

---

## 3. `packages/contracts/` — API contract (`@niwa/contracts`)

```text
packages/contracts/
├─ openapi.yaml              ✅ GENERATED (OpenAPI 3.1) — never edit by hand; `pnpm openapi`
├─ scripts/generate-openapi.ts ✅ writes openapi.yaml; `--check` for CI
└─ src/
   ├─ index.ts               ✅ re-exports everything below
   ├─ common.ts              ✅ Id, DateOnly, IsoDateTime, ErrorCode, ErrorEnvelope, HealthResponse
   ├─ auth.ts                ✅ Register/Login/Refresh inputs, AuthResponse, PublicUser, cookie/header constants
   ├─ workspace.ts           ✅ Workspace, ROOT_CONTAINERS
   ├─ item.ts                ✅ enums, natureOf(), tag rules, Item/ItemSummary, create/update/move/file/capture/promote, Focus, tags
   ├─ link.ts                ✅ Link, CreateLinkInput, ItemLinksResponse
   ├─ schedule.ts            ✅ ScheduleEntry + inputs (provisional until SCHEDULER.md)
   ├─ attachment.ts          ✅ Cloudinary sign/confirm, Attachment, MIME/size limits
   ├─ search.ts              ✅ SearchQuery, SearchHit
   ├─ ai.ts                  ✅ key/settings/status, summarize/breakdown/autotag responses
   ├─ openapi.ts             ✅ registry: every path (46 ops) → generateOpenApiDocument()
   └─ contracts.test.ts      ✅
```

Rule: **a new endpoint is added here first** (schema + `add(...)` in `openapi.ts`), then implemented in `backend/src/routes/v1/`.

## 4. `packages/tokens/` — design tokens (`@niwa/tokens`)

```text
packages/tokens/src/index.ts ✅ palettes (light/dark), typeColors, typography, shape, spacingUnit
```

---

## 5. `backend/` — layered: routes → controllers → services → repositories

```text
backend/
├─ package.json              ✅ dev: node --watch src/server.ts · start: node src/server.ts
├─ .env.example              ✅
├─ vitest.config.ts          ✅
├─ scripts/dev-memory.ts     ✅ in-memory MongoDB + real server (local dev without Atlas, e2e)
├─ src/
│  ├─ server.ts              ✅ process entry: config → db → redis → app.listen, graceful shutdown
│  ├─ app.ts                 ✅ createApp(): trust proxy, pino-http, helmet, CORS, json, cookies, rate limit, /api/v1, errors
│  ├─ config/env.ts          ✅ Zod env schema, loadConfig() fail-fast, secureCookies
│  ├─ lib/
│  │  ├─ logger.ts           ✅ Pino + redaction (pretty in local, silent in test)
│  │  ├─ errors.ts           ✅ AppError(code → HTTP status), notFound(), unauthorized()
│  │  ├─ parse.ts            ✅ parse(schema, data) — ZodError → 400 via error middleware
│  │  ├─ db.ts               ✅ Mongoose connect/disconnect
│  │  ├─ redis.ts            ✅ ioredis client or null (local/test)
│  │  ├─ orderKey.ts         ✅ fractional-indexing helpers (keyBetween, keysAfter, rebalance threshold)
│  │  ├─ contentText.ts      ✅ ProseMirror JSON → contentPlainText; 1 MB content cap
│  │  ├─ tz.ts               ✅ IANA wall-clock ↔ UTC via Intl (DST-safe)
│  │  ├─ recurrence.ts       ✅ occurrenceStart(anchor, rule, n, tz, allDay)
│  │  ├─ contentDoc.ts       ✅ niwaLink extraction, heading titles, section find/replace (promotion)
│  │  └─ crypto.ts           🔜 M8 AES-256-GCM for AI key
│  ├─ middleware/
│  │  ├─ auth.ts             ✅ requireAuth(tokens) → res.locals.auth; authOf()
│  │  ├─ error.ts            ✅ notFoundHandler, errorHandler (one envelope)
│  │  └─ rateLimit.ts        ✅ general + auth limiters (Redis store when available)
│  ├─ models/
│  │  ├─ user.model.ts       ✅
│  │  ├─ workspace.model.ts  ✅
│  │  ├─ item.model.ts       ✅ all §6.1 fields + deleteBatchId/deleteRoot/deletedParentId + indexes + weighted text index
│  │  ├─ refreshSession.model.ts ✅ hashed tokens, familyId, TTL index
│  │  ├─ link.model.ts       ✅ source → target (+ anchor), origin content|manual, unique per pair
│  │  ├─ schedule.model.ts   ✅ ScheduleEntry (events/blocks/occurrences) + ScheduleSeries (recurring rule)
│  │  └─ attachment          🔜 M7
│  ├─ repositories/
│  │  ├─ item.repo.ts        ✅ tree/list/siblings, versioned update, ancestors, descendants, soft delete/restore/hard delete, trash, focus queries, tag counts/rename
│  │  ├─ schedule.repo.ts    ✅ entries (overlap, upcoming per item), series (open, materialized, end-before), purge by item
│  │  ├─ link.repo.ts        ✅ by source/target, content-link sync, delete for purge
│  │  └─ user · workspace · refreshSession ✅   (always .lean())
│  ├─ services/
│  │  ├─ token.service.ts    ✅ access JWT sign/verify, refresh issue/rotate/revoke (reuse → family revoke)
│  │  ├─ auth.service.ts     ✅ register (+workspace +root containers), login, refresh, logout, me
│  │  ├─ item.service.ts     ✅ item rules: create/update/move (cycles, server-minted keys, rebalance), archive, delete/restore/purge batches, focus, tags, review, promoteSection, capture, inbox, file; syncs content links on save
│  │  ├─ schedule.service.ts ✅ range + materialization, create/update/delete with scopes, all-day normalisation, item blocks
│  │  ├─ search.service.ts   ✅ text index + substring fallback, snippets, matchedIn
│  │  ├─ link.service.ts     ✅ links + backlinks with section names, manual links, content sync
│  │  ├─ workspace.service.ts ✅
│  │  └─ serializers.ts      ✅ DB doc → contract DTO (strips secrets; derives nature)
│  ├─ controllers/
│  │  ├─ auth.controller.ts  ✅ cookie vs native-client token transport, CSRF header check
│  │  ├─ schedule.controller.ts ✅ /schedule, /items/:id/schedule
│  │  ├─ item.controller.ts  ✅ items, tree, trash, focus, tags, review, promote-section, links, inbox, file, search
│  │  └─ system.controller.ts ✅ health, workspace
│  └─ routes/v1/index.ts     ✅ mounts every implemented path
└─ tests/
   ├─ helpers.ts             ✅ in-memory Mongo, buildApp(), refreshCookie()
   ├─ auth.test.ts           ✅ incl. rate limits
   ├─ items.test.ts          ✅ tree, ordering, moves, versions, delete/restore/purge, focus, tags
   ├─ schedule.test.ts       ✅ events, recurrence, scopes, blocks
   ├─ recurrence.test.ts     ✅ tz + DST + month clamping
   ├─ inbox-search.test.ts   ✅ capture, filing, search ranking/filters
   ├─ knowledge.test.ts      ✅ content links, backlinks, manual links, review, promote section
   └─ system.test.ts         ✅ health, error envelope, env validation
```

Implemented endpoints: health · auth (register, login, refresh, logout, me) · workspace · `GET /tree` · items (list, create, get, patch, delete, ancestors, move, archive, unarchive, restore, permanent) · trash · focus · tags (list, rename) · review · promote-section · links (item links, create, delete) · schedule (range, create, update, delete, item blocks). inbox (list, capture, file) · search. Not yet: uploads, ai.

---

## 6. `packages/api-client/` — typed client (`@niwa/api-client`)

```text
packages/api-client/src/
├─ index.ts                  ✅ createApiClient(): request(), session (memory), restoreSession(), single-flight refresh, ApiError, auth.*, workspace.*, items.* (incl. links, review, promoteSection), links.*, schedule.*, inbox.*, search(), tags.*
└─ client.test.ts            ✅
```

Add a namespace here (e.g. `items.*`) whenever backend endpoints land. Types come from `@niwa/contracts`.

## 7. `frontend/` — Vite + React 19 + pure MUI v9 → Vercel

```text
frontend/
├─ index.html                ✅
├─ public/favicon.svg        ✅
├─ vite.config.ts            ✅ dev proxy /api → API_PROXY_TARGET (default localhost:4000) + vitest (jsdom)
├─ vercel.json               ✅ /api/* → niwa-api.onrender.com rewrite + SPA fallback
├─ playwright.config.ts      ✅ starts in-memory API (4100) + Vite (5174); desktop + phone projects
├─ .env.example              ✅
├─ e2e/
│  ├─ fixtures.ts            ✅ throwaway test account for the in-memory backend
│  ├─ smoke.spec.ts          ✅ auth + shell + theme (desktop + phone)
│  ├─ tree.spec.ts           ✅ build/reorder/indent/complete/delete/restore, lens filtering, drag and drop (desktop)
│  ├─ scheduler.spec.ts      ✅ month create/drag, week create/move/resize, repeat scopes, item block (desktop, Asia/Manila)
│  ├─ inbox-search.spec.ts   ✅ capture → file → tree; search highlights (desktop + phone)
│  └─ knowledge.spec.ts      ✅ editor, outline, [[ section links, backlinks, promote, broken section, review (desktop)
└─ src/
   ├─ main.tsx               ✅ entry
   ├─ app/
   │  ├─ App.tsx             ✅ ThemeProvider + CssBaseline + QueryClient + AuthProvider + RouterProvider
   │  ├─ router.tsx          ✅ route tree (CONCEPT.md §1.3): guest routes, protected shell routes
   │  └─ theme.ts            ✅ MUI theme from @niwa/tokens (colorSchemes light/dark, CSS vars)
   ├─ api/client.ts          ✅ app-wide `api` instance + messageOf(err)
   ├─ auth/
   │  ├─ AuthProvider.tsx    ✅ session context: status, user, login/register/logout; restores on load
   │  ├─ guards.tsx          ✅ RequireAuth (→ /login with `from`), GuestOnly (→ back to `from`)
   │  ├─ AuthLayout.tsx      ✅
   │  ├─ LoginPage.tsx       ✅
   │  ├─ RegisterPage.tsx    ✅
   │  └─ auth.test.tsx       ✅
   ├─ layout/
   │  ├─ AppShell.tsx        ✅ Notifier + ItemDialogs providers; rail | tree | main | detail; phone: tree as lens home
   │  ├─ destinations.tsx    ✅ the six destinations (label, path, icon, shortcut, showsTree)
   │  ├─ NavRail.tsx         ✅ NavRail (≥ md) + BottomNav (< md)
   │  ├─ TopBar.tsx          ✅ title, search, capture (disabled until M6), detail toggle, account menu
   │  ├─ TreePane.tsx        ✅ lens-filtered SimpleTreeView, drag-and-drop zones, keyboard moves, hover actions
   │  ├─ DetailPanel.tsx     ✅ selected item's ItemFields (docked ≥ lg, drawer otherwise)
   │  ├─ useGlobalShortcuts.ts ✅ g-shortcuts + `/`
   │  └─ shell.test.tsx      ✅
   ├─ features/
   │  ├─ pages.tsx           ✅ Knowledge/Actionable pages (item view when `:itemId`), ItemRedirect (/items/:id)
   │  ├─ items/
   │  │  ├─ queries.ts       ✅ TanStack Query hooks: tree, item, focus, trash, tags + mutations; storeItem() keeps item + tree caches in step; latestVersion() for writes
   │  │  ├─ treeModel.ts     ✅ buildTree, ancestors, lensView (visible/dimmed), moveUp/Down, indent/outdent, dropMove
   │  │  ├─ itemMeta.tsx     ✅ labels, type icons/colors, LENS_PATH, todayLocal, formatDay
   │  │  ├─ ItemView.tsx     ✅ main item view: breadcrumbs, editable title, chips, children
   │  │  ├─ ItemFields.tsx   ✅ editable fields (detail panel / inline on phone)
   │  │  ├─ ItemMenu.tsx     ✅ per-item command menu
   │  │  ├─ ItemDialogs.tsx  ✅ create / move-to / confirm dialogs (context)
   │  │  ├─ useItemActions.ts ✅ move, delete (+Undo), archive (+Undo)
   │  │  ├─ TrashSection.tsx ✅ Settings → Trash
   │  │  ├─ EditableTitle.tsx · useSelectedItemId.ts ✅
   │  │  └─ treeModel.test.ts ✅
   │  ├─ actionable/FocusView.tsx ✅ Focus sections with completion checkbox (optimistic)
   │  ├─ settings/SettingsPage.tsx ✅ tabs: appearance (theme), account, ai (M8), trash
   │  ├─ knowledge/
   │  │  ├─ editor/NoteEditor.tsx   ✅ TipTap body: extensions, outline, toolbar, autosave, deep-link scroll, promote
   │  │  ├─ editor/extensions.ts    ✅ AnchoredHeading (anchorId), AnchorGuard (unique ids), NiwaLink node
   │  │  ├─ editor/NiwaLinkView.tsx ✅ inline link chip (live title, section name, missing state)
   │  │  ├─ editor/linkSuggestion.ts + LinkPicker.tsx ✅ [[ picker with → for sections
   │  │  ├─ editor/useAutosave.ts   ✅ debounced versioned save, silent field-conflict retry, conflict pause
   │  │  ├─ editor/Outline.tsx · EditorToolbar.tsx · headings.ts ✅
   │  │  ├─ LinksPanel.tsx      ✅ links (content + related, add/remove) and backlinks
   │  │  ├─ ReviewQueue.tsx · KnowledgeHome.tsx ✅
   │  │  └─ queries.ts          ✅ links, review, create/remove link
   │  ├─ scheduler/
   │  │  ├─ SchedulerPage.tsx   ✅ /scheduler/:view/:date — header, view switch, dialogs, drag saves; SchedulerHome redirect
   │  │  ├─ MonthView.tsx       ✅ 6-week grid, chips, all-day bars, drag to another day
   │  │  ├─ TimeGridView.tsx    ✅ week/day grid: pointer create/move/resize, overlap columns, now line
   │  │  ├─ EntryDialog.tsx     ✅ create/edit event or block, repeat, colour, scope, delete
   │  │  ├─ ItemScheduleSection.tsx ✅ item details: upcoming blocks + Schedule time
   │  │  ├─ layout.ts · entryDisplay.ts · queries.ts ✅
   │  │  └─ scheduler.test.ts   ✅
   │  ├─ inbox/
   │  │  ├─ CaptureProvider.tsx ✅ quick capture dialog + useQuickCapture() (c / Capture button), queued saves
   │  │  ├─ InboxPage.tsx       ✅ newest-first list, multi-select, file / delete
   │  │  ├─ FileDialog.tsx      ✅ filing panel (parent with path, type, due, tags; bulk)
   │  │  └─ queries.ts          ✅ inbox, capture, file
   │  ├─ search/SearchPage.tsx  ✅ URL-synced search, filters, Highlight
   │  └─ ai (M8) · graph (M11)   🔜
   ├─ components/            ✅ Wordmark, EmptyState, FullPageLoader, NotFoundPage, Notifier (snackbar + Undo)
   ├─ lib/dates.ts           ✅ local grid math, all-day UTC date keys, input/format helpers
   ├─ lib/forms.ts           ✅ muiField(): RHF register → TextField inputRef
   ├─ lib/usePersistentState.ts ✅ localStorage-backed UI state (expanded nodes, toggles)
   └─ test/                  ✅ setup.ts (jest-dom, matchMedia), renderApp.tsx (real routes + mocked fetch)
```

---

## 8. Key conventions (quick reference)

| Topic | Rule | Spec |
|---|---|---|
| API base | `/api/v1` | §11.1 |
| Contract first | add schema + path in `@niwa/contracts`, then implement | §15 rule |
| Input parsing | `parse(ContractSchema, req.body)` in controllers | — |
| Error shape | throw `AppError(code, msg)`; central middleware sends the envelope | §11.2 |
| Reads | Mongoose `.lean()` always | §11.2 |
| Ownership | every query scoped by `workspaceId` from `res.locals.auth`, never from input | DATA_MODEL §1 |
| Deleted items | filter `deletedAt: null` in normal queries | §12.6 |
| Inbox | `inboxedAt != null` | §12.8 |
| Dates | `dueAt`/`reviewAt` = `YYYY-MM-DD`; schedule = UTC instants | §12.5 |
| Ordering | fractional `orderKey` per sibling scope, server-minted | §12.7 |
| `nature` | derived via `natureOf(type)`, never stored | §3.2 |
| Headings | never create items automatically | §5 |
| TS syntax | erasable only (no enums, namespaces-with-values, parameter properties); `.ts` import extensions | OPS §5 |
| Colors | only from `@niwa/tokens`, never hardcoded | §1, §11 |
| Frontend styling | pure MUI: theme + `sx` + `styled()`; no Tailwind/CSS files/other UI kits | §11.7 |
| API calls (web) | relative `/api/v1` → Vercel rewrite (prod) / Vite proxy (local) | OPS §6 |
| Secrets | never logged, never sent to clients, nothing secret behind `VITE_` | §13, OPS §4.2 |

---

## 9. Where to find things

| Concern | Location |
|---|---|
| Env vars | `backend/src/config/env.ts`, `backend/.env.example` |
| Auth flow | `backend/src/services/{auth,token}.service.ts`, `backend/src/controllers/auth.controller.ts` |
| Item model | `backend/src/models/item.model.ts` · contract `packages/contracts/src/item.ts` |
| API contract | `packages/contracts/openapi.yaml` (generated) |
| Theme / tokens | `packages/tokens/src/index.ts` · `frontend/src/app/theme.ts` |
| Deploy config | `render.yaml` · `frontend/vercel.json` |
| Routes | `frontend/src/app/router.tsx` · destinations in `frontend/src/layout/destinations.tsx` |
| Session (web) | `frontend/src/auth/AuthProvider.tsx` → `@niwa/api-client` |
