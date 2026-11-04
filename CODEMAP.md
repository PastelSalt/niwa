# NIWA — Code Map

**Role of this file:** the map of the codebase. Check here before creating or moving files; update it whenever a folder, module, or key file is added, moved, or removed.
**Last updated:** 2026-11-04

**Legend:** ✅ exists · 🔜 planned (not created yet) · `M#` = milestone in `NIWA-PLAN-A-01.md` that creates it

---

## 1. Repo root

```text
niwa/   (local folder may still be named niwa-site)
├─ PROJECT-SPECS.md          ✅ concept source of truth
├─ NIWA-PLAN-A-01.md         🟨 backend, web, desktop — M1–M7 done; M8 AI paused; M9/M11/M12 open
├─ NIWA-PLAN-A-02.md         🟨 mobile (Flutter) — MA0–MA9 done; MA10 (quality + web parity), MA11 (release) next
├─ NIWA-PLAN-B-01.md         🟨 public site — B0–B3, B5 done; B4/B6/B7 have small leftovers
├─ NIWA-PLAN-B-02.md         🟨 web UI/UX refinement, pastel themes + font picker (default Fredoka), interactive landing — V0–V11 built; owner approval of theme colours + manual phone pass open
├─ LICENSE                   ✅ MIT, © 2026 Moeko Works
├─ GAPS.md                   ✅ deferred / unverified items (add when skipping, tick when closed)
├─ CODEMAP.md                ✅ this file
├─ LOGS.md                   ✅ action log
├─ docs/
│  ├─ CONCEPT.md             ✅ draft — nav shell, lens visibility, capture/file, promotion, section links
│  ├─ DATA_MODEL.md          ✅ draft — field additions, limits, type matrix, ordering, delete/restore, tags, attachments, search
│  ├─ OPS.md                 ✅ services, envs, env vars, Render/Vercel/Atlas/Cloudinary, backups + restore drill, CI
│  ├─ SCHEDULER.md           ✅ drag, recurrence edits, time zones, overlaps (M5)
│  ├─ LEGAL-DRAFTS.md        ✅ approved B0 answers + policy texts (B-01; the web pages are now the source of truth)
│  └─ AI.md · GRAPH.md       🔜 M8 / M11
├─ package.json              ✅ root scripts: dev, dev:memory (no Atlas), build, test, e2e, lint, typecheck, format, openapi; pnpm@12.15.0
├─ pnpm-workspace.yaml       ✅ backend, web_app, desktop_app, packages/* · allowBuilds policy
├─ pnpm-lock.yaml            ✅
├─ tsconfig.base.json        ✅ strict, NodeNext, erasableSyntaxOnly, allowImportingTsExtensions, noEmit
├─ eslint.config.js          ✅ flat config + typescript-eslint
├─ .prettierrc.json / .prettierignore   ✅
├─ .nvmrc                    ✅ 24
├─ .gitignore / .gitattributes / .editorconfig   ✅
├─ scripts/deploy/          ✅ render.sh, vercel.sh, deploy.env.example (OPS §12)
├─ .vercelignore             ✅ keeps Vercel CLI uploads small (no flutter_app/, docs/)
├─ render.yaml               ✅ Render Blueprint: web `niwa-api` + Key Value `niwa-cache`
├─ .github/workflows/ci.yml  ✅ check: lint → format → typecheck → openapi:check → test → build · e2e job
├─ .github/workflows/backup.yml ✅ nightly portable dump → `age`-encrypted artifact (14 days); needs BACKUP_* secrets (OPS §9)
├─ .claude/launch.json       ✅ preview config (pnpm dev:memory on 5173; `niwa-memory-npx` for machines without pnpm on PATH)
├─ packages/
│  ├─ contracts/             ✅ Zod schemas + generated openapi.yaml
│  ├─ tokens/                ✅ design tokens
│  ├─ api-client/            ✅ typed client (web + desktop)
│  └─ ui/                    🔜 M9 shared MUI components
├─ backend/                  ✅ NIWA API → Render
├─ web_app/                  ✅ web client → Vercel
├─ desktop_app/              🔜 M9 Electron Forge (README placeholder; after mobile)
└─ flutter_app/              🟨 Flutter mobile — NIWA-PLAN-A-02.md (outside pnpm); scaffolded (MA1.P1), token theme (MA1.P2), contract models (MA1.P3), CI, API + session + auth screens (MA2), app shell + routes (MA3), item tree + Focus (MA4), offline cache + capture queue (MA5), notes editor (MA6), scheduler + reminders (MA7), inbox filing + search (MA8), settings/trash/images (MA9), bundled fonts + licences page (B-01 B5/B3): lib/{app,core,features}, assets/fonts/ (TTF + OFL texts)
```

Git: branch `main`, remote `origin` = `https://github.com/PastelSalt/niwa.git` (renamed from `niwa-site` 2026-11-04; pushed).

**No build step for TypeScript.** All code uses erasable-only TS syntax, so Node 24 runs `.ts` directly (backend, scripts, and workspace packages). Imports use explicit `.ts` extensions. `tsc` is typecheck-only. Frontend will be bundled by Vite.

---

## 2. Spec → folder mapping

| Spec (§11.6) | Folder | Hosting | Status |
|---|---|---|---|
| `apps/api` | `backend/` | Render | ✅ M1 |
| `apps/web` | `web_app/` | Vercel | ✅ M2 |
| `apps/desktop` | `desktop_app/` | — | 🔜 M9 |
| `apps/mobile` | `flutter_app/` | — | 🟨 A-02 (MA0–MA9 done) |
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
packages/tokens/src/index.ts ✅ palettes (light/dark; mobile), typeColors, typography, shape, spacingUnit · B-02: typeScale + fonts (per-font tuning), contentWidth, layout thresholds, gaps, iconSize, motion, elevation, status/priority roles, five pastel `themes` (ThemePalette with containers)
packages/tokens/src/contrast.test.ts ✅ WCAG contrast guarantees for every theme × mode (text, primary ink, pastel containers, status/priority roles, type colours, block fills) + type scale minimums
packages/tokens/scripts/generate-dart.ts ✅ writes flutter_app/lib/core/theme/tokens.g.dart (`pnpm tokens:dart`, `--check` in CI)
```

---

## 5. `backend/` — layered: routes → controllers → services → repositories

```text
backend/
├─ package.json              ✅ dev: node --watch src/server.ts · start: node src/server.ts
├─ .env.example              ✅
├─ vitest.config.ts          ✅
├─ scripts/dev-memory.ts     ✅ in-memory MongoDB + real server (local dev without Atlas, e2e)
├─ scripts/backup.ts         ✅ `pnpm --filter @niwa/backend backup [--out f]` → gzip'd EJSON NDJSON
├─ scripts/restore.ts        ✅ `… restore <file> --yes [--drop]` (dry run without --yes) + syncIndexes
├─ scripts/admin.ts          ✅ operator tools: list / disable / enable / delete accounts, indexes (OPS §13)
├─ scripts/scale-check.ts    ✅ in-memory many-accounts timing + index-use check (OPS §13)
├─ src/
│  ├─ server.ts              ✅ process entry: config → db → redis → app.listen, graceful shutdown
│  ├─ app.ts                 ✅ createApp(): trust proxy, pino-http, helmet, CORS, json, cookies, rate limit, /api/v1, errors
│  ├─ config/env.ts          ✅ Zod env schema, loadConfig() fail-fast, secureCookies
│  ├─ lib/
│  │  ├─ logger.ts           ✅ Pino + redaction (pretty in local, silent in test); request URLs/Referer logged without query strings
│  │  ├─ quota.ts            ✅ per-account item + image-storage quotas, usage (multi-user)
│  │  ├─ errors.ts           ✅ AppError(code → HTTP status), notFound(), unauthorized()
│  │  ├─ parse.ts            ✅ parse(schema, data) — ZodError → 400 via error middleware
│  │  ├─ db.ts               ✅ Mongoose connect/disconnect
│  │  ├─ redis.ts            ✅ ioredis client or null (local/test)
│  │  ├─ orderKey.ts         ✅ fractional-indexing helpers (keyBetween, keysAfter, rebalance threshold)
│  │  ├─ contentText.ts      ✅ ProseMirror JSON → contentPlainText; 1 MB content cap
│  │  ├─ tz.ts               ✅ IANA wall-clock ↔ UTC via Intl (DST-safe)
│  │  ├─ recurrence.ts       ✅ occurrenceStart(anchor, rule, n, tz, allDay)
│  │  ├─ contentDoc.ts       ✅ niwaLink extraction, heading titles, section find/replace (promotion)
│  │  ├─ cloudinary.ts       ✅ signed-params, upload URL, resource lookup, destroy, tag removal (fetch-based, injectable)
│  │  ├─ backup.ts           ✅ exportDatabase / restoreDatabase / readHeader (portable format, count-verified)
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
│  │  └─ attachment.model.ts ✅ Cloudinary public id (unique), url, mime, size, orphanedAt
│  ├─ repositories/
│  │  ├─ item.repo.ts        ✅ tree/list/siblings, versioned update, ancestors, descendants, soft delete/restore/hard delete, trash, focus queries, tag counts/rename
│  │  ├─ schedule.repo.ts    ✅ entries (overlap, upcoming per item), series (open, materialized, end-before), purge by item
│  │  ├─ link.repo.ts        ✅ by source/target, content-link sync, delete for purge
│  │  └─ user · workspace · refreshSession ✅   (always .lean())
│  ├─ services/
│  │  ├─ admin.service.ts    ✅ list/disable/enable/delete accounts (used by scripts/admin.ts only)
│  │  ├─ token.service.ts    ✅ access JWT sign/verify, refresh issue/rotate/revoke (reuse → family revoke)
│  │  ├─ auth.service.ts     ✅ register (+workspace +root containers), login, refresh, logout, me
│  │  ├─ item.service.ts     ✅ item rules: create/update/move (cycles, server-minted keys, rebalance), archive, delete/restore/purge batches, focus, tags, review, promoteSection, capture, inbox, file; syncs content links on save
│  │  ├─ schedule.service.ts ✅ range + materialization, create/update/delete with scopes, all-day normalisation, item blocks
│  │  ├─ search.service.ts   ✅ text index + substring fallback, snippets, matchedIn
│  │  ├─ link.service.ts     ✅ links + backlinks with section names, manual links, content sync
│  │  ├─ attachment.service.ts ✅ upload config/sign/confirm (folder, format, size checks), remove, syncFromContent (orphanedAt), purgeForItems, sweep
│  │  ├─ maintenance.service.ts ✅ every 6 h: Trash > 30 days purge + attachment sweep (orphans 7 d, unconfirmed 24 h)
│  │  ├─ workspace.service.ts ✅
│  │  └─ serializers.ts      ✅ DB doc → contract DTO (strips secrets; derives nature)
│  ├─ controllers/
│  │  ├─ auth.controller.ts  ✅ cookie vs native-client token transport, CSRF header check
│  │  ├─ schedule.controller.ts ✅ /schedule, /items/:id/schedule
│  │  ├─ item.controller.ts  ✅ items, tree, trash, focus, tags, review, promote-section, links, inbox, file, search
│  │  ├─ upload.controller.ts ✅ /uploads/config, /uploads/sign, /attachments
│  │  └─ system.controller.ts ✅ health, workspace
│  └─ routes/v1/index.ts     ✅ mounts every implemented path
└─ tests/
   ├─ helpers.ts             ✅ in-memory Mongo, buildApp(overrides, fetch?), refreshCookie()
   ├─ uploads.test.ts        ✅ sign/confirm/reject, orphan sync, sweep, purge (fake Cloudinary)
   ├─ backup.test.ts         ✅ export → restore round trip, drop guard, format check
   ├─ auth.test.ts           ✅ incl. rate limits
   ├─ account.test.ts        ✅ auth config, onboarding, change password, export, delete account (B-01)
   ├─ items.test.ts          ✅ tree, ordering, moves, versions, delete/restore/purge, focus, tags
   ├─ schedule.test.ts       ✅ events, recurrence, scopes, blocks
   ├─ recurrence.test.ts     ✅ tz + DST + month clamping
   ├─ inbox-search.test.ts   ✅ capture, filing, search ranking/filters
   ├─ knowledge.test.ts      ✅ content links, backlinks, manual links, review, promote section
   └─ system.test.ts         ✅ health, error envelope, env validation
```

Implemented endpoints: health · auth (register, login, refresh, logout, me) · workspace · `GET /tree` · items (list, create, get, patch, delete, ancestors, move, archive, unarchive, restore, permanent) · trash · focus · tags (list, rename) · review · promote-section · links (item links, create, delete) · schedule (range, create, update, delete, item blocks). inbox (list, capture, file) · search · uploads (config, sign) · attachments (confirm, delete). Not yet: ai.

---

## 6. `packages/api-client/` — typed client (`@niwa/api-client`)

```text
packages/api-client/src/
├─ index.ts                  ✅ createApiClient(): request(), session (memory), restoreSession(), single-flight refresh, ApiError, auth.*, workspace.*, items.* (incl. links, review, promoteSection), links.*, schedule.*, inbox.*, search(), tags.*, uploads.*
└─ client.test.ts            ✅
```

Add a namespace here (e.g. `items.*`) whenever backend endpoints land. Types come from `@niwa/contracts`.

## 7. `web_app/` — Vite + React 19 + pure MUI v9 → Vercel

```text
web_app/
├─ index.html                ✅ title, description, Open Graph / Twitter tags
├─ public/                   ✅ favicon.svg · icon PNGs (192/512/maskable/apple-touch) · manifest.webmanifest · robots.txt (app routes disallowed) · sitemap.xml · og-image.png · screens/*.webp (landing screenshots)
├─ assets/icons/             ✅ icon SVG sources + generate.sh (rsvg-convert → public/*.png)
├─ vite.config.ts            ✅ dev proxy /api → API_PROXY_TARGET (default localhost:4000) + vitest (jsdom) + licences plugin
├─ licenses.plugin.ts        ✅ `virtual:licenses` — production dependency licences read at build time (B-01 B3.P5)
├─ vercel.json               ✅ /api/* → niwa-api.onrender.com rewrite + SPA fallback
├─ playwright.config.ts      ✅ starts in-memory API (4100) + Vite (5174); desktop + phone projects
├─ scripts/visual-audit.mjs  ✅ B-02 V0: seeds an account, screenshots 24 screens × 1440/820/390/360 × light/dark into .visual-audit/ (ignored), flags overlapping/spilling/squeezed text; `--mock` (no MongoDB), `--theme/--font`, `--landing-shots`
├─ scripts/audit-mock-api.mjs ✅ routes /api/v1 to the playground's MemoryWorkspace for `--mock`
├─ .env.example              ✅
├─ e2e/
│  ├─ fixtures.ts            ✅ throwaway test account for the in-memory backend
│  ├─ smoke.spec.ts          ✅ landing → auth + shell + theme (desktop + phone)
│  ├─ tree.spec.ts           ✅ build/reorder/indent/complete/delete/restore, lens filtering, drag and drop (desktop)
│  ├─ scheduler.spec.ts      ✅ month create/drag, week create/move/resize, repeat scopes, item block (desktop, Asia/Manila)
│  ├─ inbox-search.spec.ts   ✅ capture → file → tree; search highlights (desktop + phone)
│  ├─ a11y.spec.ts           ✅ axe WCAG 2.1 A/AA audit of the landing page and every main screen + capture dialog, light and dark (desktop)
│  ├─ knowledge.spec.ts      ✅ editor, outline, [[ section links, backlinks, promote, broken section, review (desktop)
│  ├─ account.spec.ts        ✅ tour once per account + replay, export, change password, delete; public pages + 404
│  └─ playground.spec.ts     ✅ landing playground: tick, capture, switch lens/theme, start fresh — zero /api requests
└─ src/
   ├─ main.tsx               ✅ entry (`/playground` boots the playground instead of the app)
   ├─ app/
   │  ├─ App.tsx             ✅ AppearanceProvider + CssBaseline + QueryClient + AuthProvider + RouterProvider
   │  ├─ appearance.tsx      ✅ B-02: theme id + font id at runtime; useUserAppearance (account prefs, local cache, light/dark), useSavePreferences; public pages keep Garden + Fredoka
   │  ├─ router.tsx          ✅ route tree (CONCEPT.md §1.3): `/` HomeRoute, guest routes, protected shell routes; secondary screens lazy-loaded; RouteError boundaries
   │  ├─ theme.ts            ✅ createNiwaTheme(themeId, fontId): type scale → variants (+ `lead`), theme.niwa (widths, gaps, icons, motion), status/priority/container palette roles, pastel contained buttons, focus rings, 44 px touch targets, reduced motion
   │  └─ fonts.ts            ✅ self-hosted @font-face for the chosen font only (Fredoka/Inter/Atkinson; System = none) + Noto Sans JP 庭 slice + JetBrains Mono; ensureFontLoaded()
   ├─ assets/fonts/          ✅ vendored Noto Sans JP slice + OFL licence
   ├─ api/client.ts          ✅ app-wide `api` instance + messageOf(err)
   ├─ auth/
   │  ├─ AuthProvider.tsx    ✅ session context: status, user, login/register/logout; restores on load
   │  ├─ guards.tsx          ✅ RequireAuth (→ /login with `from`), GuestOnly (→ back to `from`)
   │  ├─ AuthLayout.tsx      ✅
   │  ├─ LoginPage.tsx       ✅
   │  ├─ RegisterPage.tsx    ✅
   │  ├─ PasswordField.tsx   ✅ show/hide toggle
   │  └─ auth.test.tsx       ✅
   ├─ public/               ✅ signed-out pages (NIWA-PLAN-B-01)
   │  ├─ HomeRoute.tsx       ✅ `/`: landing for visitors, → /knowledge when signed in
   │  ├─ PublicLayout.tsx    ✅ header (Log in / Create account) + SiteFooter (Moeko Works credit)
   │  ├─ LandingPage.tsx     ✅ hero + playground, three lenses, screenshots, capture, privacy, maker (own lazy chunk)
   │  ├─ Playground.tsx      ✅ B-02 V11: lazy iframe of /playground + "Make it yours" panel (themes, fonts, light/dark; postMessage)
   │  ├─ site.ts             ✅ public facts (name, tagline, maker link) + useDocumentTitle
   │  ├─ PrivacyPage.tsx · TermsPage.tsx · EulaPage.tsx ✅ approved policy pages (B3; source text in docs/LEGAL-DRAFTS.md)
   │  ├─ CookiesPage.tsx · LicensesPage.tsx · LegalPage.tsx ✅ policy pages (B3)
   │  ├─ useRegistrationOpen.ts ✅ `GET /auth/config` → hide sign-up when closed
   │  └─ public.test.tsx     ✅
   ├─ playground/            ✅ B-02 V11 — the real app on an in-memory example garden
   │  ├─ memoryApi.ts        ✅ MemoryWorkspace: in-browser stand-in for /api/v1 (also the audit's --mock)
   │  ├─ exampleWorkspace.ts ✅ invented example content, dated relative to today
   │  ├─ PlaygroundApp.tsx   ✅ boot: in-memory storage, memory router, message bridge
   │  └─ protocol.ts         ✅ landing ⇄ iframe messages (same origin)
   ├─ layout/
   │  ├─ AppShell.tsx        ✅ `noindex` meta; Notifier + ItemDialogs providers; rail | tree | main | detail; phone: tree as lens home
   │  ├─ destinations.tsx    ✅ the six destinations (label, path, icon, shortcut, showsTree)
   │  ├─ useLayout.ts        ✅ useShellLayout(): single (< 720) · panes (720–1280, details overlay) · docked (≥ 1280)
   │  ├─ NavRail.tsx         ✅ NavRail (two-pane+) + BottomNav (single pane)
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
   │  │  ├─ ItemView.tsx     ✅ main item view: breadcrumbs (no repeated title), responsive title, chips, Inside rows; editor preloaded + text-shaped placeholder
   │  │  ├─ ItemRow.tsx      ✅ B-02 V3: one row for every list (select, completion circle, title/meta/extra, chips that wrap, actions → ⋯ on phones) + ItemRowList, CompleteToggle
   │  │  ├─ chips.tsx        ✅ Status/Priority/Due/Tag/Hint chips (deep text, role-coloured dot)
   │  │  ├─ RowSkeletons.tsx ✅ list loading pattern
   │  │  ├─ ItemFields.tsx   ✅ editable fields (detail panel / inline on phone)
   │  │  ├─ ItemMenu.tsx     ✅ per-item command menu
   │  │  ├─ ItemDialogs.tsx  ✅ create / move-to / confirm dialogs (context)
   │  │  ├─ useItemActions.ts ✅ move, delete (+Undo), archive (+Undo)
   │  │  ├─ TrashSection.tsx ✅ Settings → Trash
   │  │  ├─ EditableTitle.tsx · useSelectedItemId.ts ✅
   │  │  └─ treeModel.test.ts ✅
   │  ├─ actionable/FocusView.tsx ✅ Focus sections (each task once, collapsible) on ItemRow; focusSections.ts (+ test)
   │  ├─ settings/SettingsPage.tsx ✅ tabs: appearance, account, ai (M8), trash, help (replay tour); About credit
   │  ├─ settings/AppearanceSection.tsx ✅ B-02 V10: theme swatches, font picker (each in its own face), light/dark, reset — saved on the account
   │  ├─ settings/Section.tsx ✅ titled card
   │  ├─ settings/AccountActions.tsx ✅ change password, export my data, delete account (B-01 B4)
   │  ├─ onboarding/          ✅ OnboardingProvider (welcome + MUI Popper tour), tour.ts (steps, TOUR_VERSION), examples.ts (B-01 B7)
   │  ├─ knowledge/
   │  │  ├─ editor/NoteEditor.tsx   ✅ TipTap body: extensions, outline, toolbar, autosave, deep-link scroll, promote
   │  │  ├─ editor/extensions.ts    ✅ AnchoredHeading (anchorId), AnchorGuard (unique ids), NiwaLink node, NiwaImage (attachmentId)
   │  │  ├─ editor/uploadImage.ts   ✅ checkImage, signed direct upload → confirm, deliveryUrl (f_auto,q_auto)
   │  │  ├─ editor/useImageUploads.tsx ✅ paste/drop/pick insertion, uploading count, alt-text dialog
   │  │  ├─ editor/NiwaLinkView.tsx ✅ inline link chip (live title, section name, missing state)
   │  │  ├─ editor/linkSuggestion.ts + LinkPicker.tsx ✅ [[ picker with → for sections
   │  │  ├─ editor/useAutosave.ts   ✅ debounced versioned save, silent field-conflict retry, conflict pause
   │  │  ├─ editor/Outline.tsx · EditorToolbar.tsx · headings.ts ✅
   │  │  ├─ LinksPanel.tsx      ✅ links (content + related, add/remove) and backlinks
   │  │  ├─ ReviewQueue.tsx · KnowledgeHome.tsx ✅
   │  │  └─ queries.ts          ✅ links, review, create/remove link
   │  ├─ scheduler/
   │  │  ├─ SchedulerPage.tsx   ✅ /scheduler/:view/:date — header, view switch, dialogs, drag saves; SchedulerHome redirect
   │  │  ├─ MonthView.tsx       ✅ 6-week grid, chips, all-day bars, drag to another day; phones: dots + selected day's list
   │  │  ├─ TimeGridView.tsx    ✅ week/day grid: pointer create/move/resize, overlap columns, now line
   │  │  ├─ EntryDialog.tsx     ✅ create/edit event or block, repeat (summary in words — repeatSummary.ts), colour, scope, delete
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
   ├─ components/            ✅ Wordmark, EmptyState, FullPageLoader ("waking up" after 4 s), NotFoundPage, Notifier (snackbar + Undo), RouteError (stale chunk → reload) · B-02: Page (centred token-width column), SectionHeader, DateField (pure-MUI date input + calendar, + test)
   ├─ lib/dates.ts           ✅ local grid math, all-day UTC date keys, input/format helpers
   ├─ lib/forms.ts           ✅ muiField(): RHF register → TextField inputRef
   ├─ lib/a11y.ts            ✅ visuallyHidden, contrastRatio, readableOn (text colour for a fill)
   ├─ lib/friendlyTime.ts    ✅ friendlyDate / timeAgo / exactTime (+ test)
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
| Theme / tokens | `packages/tokens/src/index.ts` · `web_app/src/app/theme.ts` |
| Deploy config | `render.yaml` · `web_app/vercel.json` |
| Routes | `web_app/src/app/router.tsx` · destinations in `web_app/src/layout/destinations.tsx` |
| Session (web) | `web_app/src/auth/AuthProvider.tsx` → `@niwa/api-client` |
