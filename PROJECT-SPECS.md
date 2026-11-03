# NIWA (庭) — Project Concept & Specification

> **A garden for your ideas.**
> Plant an idea. Grow a project. Let it bloom.

**Status:** Concept ratified. Pre-implementation.
**Role of this file:** The **single source of truth for the concept**. If any other document (plan, codemap, code comments) disagrees with this file, this file wins — or this file gets updated first.
**Supersedes:** the concept sections of `niwa-web`, `niwa-desktop`, `niwa-mobile` specs.
**Owner:** Project owner
**Last updated:** 2026-11-03

**Companion docs (repo root):**

| File | Purpose |
|---|---|
| `PROJECT-SPECS.md` | This file — concept, data model, decisions |
| `NIWA-PLAN-A-01.md` | Milestones → phases → tasks (execution plan) |
| `CODEMAP.md` | Where everything lives in the codebase |
| `LOGS.md` | Chronological log of actions taken |

> **Repo layout note:** `backend/` (NIWA API → Render) and `web_app/` (web client → Vercel), with `packages/`, `desktop_app/`, `flutter_app/`, and `docs/` alongside. The `apps/*` names in §11.6 map onto these folders (see §11.6 note and `CODEMAP.md`). Hosting is in §11.8.
>
> **Detail docs (`docs/`):** `CONCEPT.md` (UX & flows), `DATA_MODEL.md` (schema rules), `OPS.md` (environments, hosting, backups).

---

## 1. Identity

| | |
|---|---|
| Name | NIWA (庭) — Japanese for *garden* |
| Primary wordmark | `niwa` (lowercase) |
| Optional wordmark | `庭` |
| Motif | Small flower or rabbit (optional accent, not required) |
| Primary tagline | A garden for your ideas. |
| Secondary tagline | Plant an idea. Grow a project. Let it bloom. |

**Visual direction:** minimalist, botanical, calm, functional. Sage green accent, warm cream background, cherry-blossom pink secondary, deep charcoal text, muted gray-green secondary text. Light and dark themes both first-class. Colors are defined as centralized tokens (see §11), not scattered values.

---

## 2. What NIWA is

A personal, single-user knowledge and project workspace where **everything is one hierarchical item tree**. You capture ideas, write notes, break work into tasks, and schedule your month — all against the same tree, viewed through **three lenses**.

> **One tree. Three bases. One scheduler.**

Every item can contain children at arbitrary logical depth. A single idea can grow into a full project plan — or a single note can grow into a structured reference page — without leaving the app.

### 2.1 Product principles

1. **Unlimited logical nesting.** No imposed depth limit.
2. **Frictionless capture.** Record before deciding how to organize.
3. **Cross-project focus.** Surface important work across all projects without finishing one first.
4. **Privacy by default.** Personal, single-user, self-contained.
5. **Cross-platform consistency.** Same data and behavior on phone, web, and desktop.
6. **Calm and approachable.** Serious capability without visual noise.

### 2.2 Privacy stance (hard constraints)

| Exclusion | Reason |
|---|---|
| Team collaboration | Personal, single-user app by design |
| External calendar import/sync | NIWA's scheduler is the only scheduler; no external data ingestion |
| Real-time collaboration | No multi-user model |
| Sharing / public workspaces | Data stays in your system |

**One deliberate exception:** DeepSeek AI calls send note content to DeepSeek's API, triggered only by explicit user action, only for the targeted item, and only when AI is enabled (see §8).

---

## 3. Core concept: one tree, three bases

The data model is **one item tree**. The three bases are **lenses over the same tree** — not three databases.

| Base / screen | Lens over the tree | Backing data |
|---|---|---|
| **Knowledge Base** | Items with note-like bodies; writing, linking, revisiting | `content`, `links`, `reviewAt` |
| **Actionable Base** | Items with task/project nature; status, priority, deadlines, Focus | `status`, `dueAt` |
| **Scheduler Base** | Calendar view — events and time blocks | `schedule_entries` |
| **Inbox** | Neutral capture; anything before it is filed | `inboxedAt` |
| **Search** | One search across titles and note bodies | text index |
| **Settings** | Account, appearance, AI, preferences | — |

### 3.1 Why one tree, not three

A College course (knowledge) contains a problem set (actionable) and a lecture slot (scheduler). If the three bases had separate trees, the course would have to be duplicated. One tree means a single item can legitimately appear in more than one base — a task shows in Actionable for its status and in Scheduler for its time block.

### 3.2 Derived nature

Each item has a derived `nature` used as the base filter:

- `knowledge` — types `note`, `idea`
- `actionable` — types `project`, `task`

`nature` is derived from `type`, never stored separately.

---

## 4. The bases in detail

### 4.1 Knowledge Base

The "notebook garden": topics, notes, course material, reference pages.

- Arbitrary-depth topic tree (e.g. `Network Engineering → TCP/IP → BGP`; `College → CS 301 → Week 1 → lecture notes`).
- Each item has a **content body** with an internal heading outline (collapsible).
- **Related items** picker + **Backlinks** panel.
- **Review queue** for items with `reviewAt` due.
- Inline images in note bodies (via Cloudinary).
- Graph view of the links (see §9).

### 4.2 Actionable Base

Projects and tasks.

- Same tree, filtered to `nature = actionable`.
- Status, priority, deadline, estimated effort, tags.
- Focus sections: **In Progress, High Priority, Overdue, Upcoming, Recently Updated**.
- Create children at any depth; move; reorder.

### 4.3 Scheduler Base

Manual monthly planner. **No external calendar, no ICS import** — NIWA is the source of truth.

Two layers:

| Layer | Interaction |
|---|---|
| **Month view** | Coarse placement — drag a chip to another day; times preserved |
| **Week / day view** | Precise time blocks — drag to create, resize, current-time indicator |

Two kinds of entries, one table:

| `kind` | Meaning | Example |
|---|---|---|
| `event` | Standalone calendar entry, not tied to an item | "Dentist 15:00" |
| `block` | Time allocated to an existing item | "Problem set 1, Tue 14:00–15:30" |

---

## 5. Content hierarchy rule

The single most important interaction rule. The item tree and the content body are **two separate hierarchies that must never collide**.

- **Child item:** anything that deserves its own title, status, deadline, or link target.
- **Content body:** prose about the item you are already in — text, code, images, headings.

Headings inside a content body (H1–H3) produce a **derived document outline** in the editor. They never create items, never appear in the left tree, and never affect `parentId`.

```text
📄 Cybersecurity                  ← item (title)
├─ Content (the "details")        ← document body
│    ## Cryptography      → notes…
│    ## Network Security  → notes…
│
└─ Children (the "more specific") ← item tree
     ├─ CTF notes
     └─ Cryptography basics
```

**Rule of thumb:** if it deserves its own title/status/link target → child item. If it's prose about the current item → content body.

---

## 6. Data model

### 6.1 Item (one model, all types)

| Field | Type | Notes |
|---|---|---|
| `id` | string | Server-generated, stable |
| `workspaceId` | string | Ownership boundary |
| `parentId` | string \| null | Hierarchy link; `null` = root |
| `title` | string | Required |
| `content` | ProseMirror JSON | Note body; plain-text mirror indexed separately |
| `contentPlainText` | string | Extracted on save; used for search |
| `type` | enum | `project` \| `task` \| `note` \| `idea` |
| `nature` | enum (derived) | `knowledge` \| `actionable` |
| `status` | enum | `not_started` \| `in_progress` \| `blocked` \| `completed` |
| `priority` | enum | `none` \| `low` \| `medium` \| `high` \| `critical` |
| `orderKey` | string | Fractional index (see §12.7) |
| `tags` | string[] | Shared namespace across bases |
| `dueAt` | string (`YYYY-MM-DD`) \| null | Calendar-day deadline |
| `estimatedMinutes` | number \| null | Effort estimate |
| `reviewAt` | string (`YYYY-MM-DD`) \| null | Manual review reminder |
| `sourceUrl` | string \| null | Citation / reference URL |
| `inboxedAt` | ISO timestamp \| null | Non-null = in Inbox |
| `archivedAt` | ISO timestamp \| null | Archived |
| `deletedAt` | ISO timestamp \| null | Soft-deleted (cascades to descendants) |
| `version` | number | Optimistic concurrency |
| `createdAt`, `updatedAt`, `completedAt` | ISO timestamps | `completedAt` set when status → completed |

**Not stored on the item:** `scheduledStartAt`. A task's scheduled time is derived from its `schedule_entries` rows — one source of truth.

### 6.2 Supporting tables

| Table | Fields |
|---|---|
| `workspaces` | `id`, `name`, `createdAt`, `updatedAt` |
| `links` | `id`, `sourceId`, `targetId`, `label?` |
| `attachments` | `id`, `itemId`, `cloudinaryPublicId`, `secureUrl`, `mime`, `size`, `createdAt` |
| `schedule_entries` | `id`, `kind` (`event`\|`block`), `itemId?`, `title`, `startAt` (UTC), `endAt` (UTC), `isAllDay`, `color`, `recurrence` (see §7), `createdAt`, `updatedAt` |
| `users` | `id`, `email`, `passwordHash`, `aiApiKeyEncrypted`, `aiKeyIv`, `aiKeyAuthTag`, `aiEnabled`, `createdAt`, `updatedAt` |

### 6.3 Indexes

```text
items:            { workspaceId, parentId, orderKey }
                  { workspaceId, inboxedAt }
                  { workspaceId, deletedAt }
                  { workspaceId, status, dueAt }
                  { workspaceId, updatedAt }
items (text):     { title, contentPlainText }
schedule_entries: { startAt, endAt }
links:            { sourceId } and { targetId }
```

### 6.4 Type transitions

An item may change `type` (e.g. `idea → project`). The backend validates the transition matrix and preserves children, content, links, and inbox status. `nature` is recomputed on type change.

---

## 7. Recurrence (scoped)

Simple, instance-based recurrence only — no full RRULE engine.

- Field `recurrence` on `schedule_entries`: `none` \| `daily` \| `weekly` \| `monthly`.
- Instances are **materialized** when the previous instance is completed or when the month view is opened for the target range.
- Editing a recurring event offers "this instance" or "this and future" (never silently "all").
- Full RRULE, exceptions, and external sync are out of scope.

---

## 8. AI (DeepSeek)

### 8.1 Key storage — server-side only

```text
User pastes key once (any client)
        ↓
POST /api/v1/ai/key → encrypt with AES-256-GCM
        ↓  (32-byte AI_ENCRYPTION_KEY from secret manager,
        ↓   random 12-byte IV per record)
Store encrypted in users.aiApiKeyEncrypted
        ↓
Client calls POST /api/v1/ai/…
        ↓
Server decrypts, calls DeepSeek, returns result
        ↓
Client never sees the key again
```

DeepSeek's API is OpenAI-compatible. Use the `openai` package with `baseURL: 'https://api.deepseek.com'` and the decrypted DeepSeek key. This keeps the integration trivial and lets the provider be swapped later.

### 8.2 AI actions (v1)

| Action | Behavior |
|---|---|
| **Summarize item** | Returns a summary; user chooses whether to append |
| **Suggest child breakdown** | Proposed subtasks **land in Inbox as drafts**, never auto-created |
| **Auto-tag** | Suggests 3–5 tags; user accepts/rejects |

### 8.3 AI rules

- Never auto-create or auto-modify items without explicit user acceptance.
- AI calls are explicit and per-item. Nothing background-processes notes.
- Visible indicator before each call ("sending this item to DeepSeek").
- Workspace- or item-level `aiEnabled` toggle; sensitive notes excluded.
- Only the targeted item (and optionally its children) is sent. Never attachments or sibling items.
- Invalid or expired keys surface clearly; key is never returned to a client.

---

## 9. Graph view

Read-only in v1; render items and links as a node/edge graph.

| Client | Library |
|---|---|
| Web + Desktop | React Flow (`@xyflow/react`) with Dagre or ELKjs layout |
| Mobile | Simplified `graphview` or custom painter — or deferred |

- v1: pan/zoom, filter by workspace/tag/type, click a node to open its detail.
- v2: drag-arrange with persisted `graphPosition`, cluster expand/collapse, path highlighting.
- Graph view is a **view mode of the Knowledge base** — it reads the `links` table, no new storage.

**Explicit parity note:** graph is rich on web/desktop and simplified or deferred on mobile. This is a documented asymmetry, not a missing feature.

---

## 10. Cross-platform strategy

Three clients, one backend, one contract:

```text
Web (React/MUI)     Desktop (Electron/MUI)     Mobile (Flutter)
      │                      │                        │
      └──────────────────────┼────────────────────────┘
                             │  HTTPS / JSON
                      NIWA API (Express)
                             │
                          MongoDB
```

### 10.1 Parity matrix

| Layer | Parity |
|---|---|
| Data model, statuses, hierarchy rules, Focus logic, search | **Full** — same backend, same OpenAPI contract |
| Design language | **Full** — shared token source → MUI theme (React) + Dart theme (Flutter) |
| UI layout | **Differentiated** — Flutter rebuilt to spec, not a clone |
| Graph | **Simplified on mobile** |
| Editor | **TipTap** on web/desktop; **flutter_quill** on mobile |
| Command palette | **Web/desktop only** |

"Seamless" means one data model, one behavior spec, one token source, per-platform UI built to the same spec — not identical UI on every device.

---

## 11. Tech stack

### 11.1 Shared

| Layer | Choice |
|---|---|
| Runtime | Node.js LTS (pinned via `.nvmrc`) |
| Language | TypeScript strict (clients + API); Dart on mobile |
| API | REST, `/api/v1`, HTTPS/JSON |
| Contract | OpenAPI, generated from Zod schemas |
| Database | MongoDB (backend-only; clients never connect directly) |
| IDs | Server-generated; ISO 8601 timestamps |
| Image storage | **Cloudinary** — signed uploads (server signs, browser uploads directly) |

### 11.2 Backend

| Layer | Choice |
|---|---|
| Framework | Express |
| ODM | Mongoose (`.lean()` on all reads) |
| Validation | Zod (bodies + env at startup) |
| Architecture | Routes → Controllers → Services → Repositories |
| Cache | Redis (sessions, rate limits, hot reads) |
| Security | helmet, narrow CORS, rate limiting |
| Logging | Pino (redacted) |
| Errors | Centralized error middleware, consistent envelope |
| Tests | Vitest + Supertest + `mongodb-memory-server` |

### 11.3 React clients (Web + Desktop — one stack)

| Layer | Choice |
|---|---|
| Framework | React 19 |
| Design system | **MUI v9** (`@mui/material`) — **pure MUI** (see §11.7) |
| Icons | `@mui/icons-material` v9 |
| Styling engine | Emotion 11 (default for MUI v9) |
| Tree | `@mui/x-tree-view` v9 |
| Pickers | `@mui/x-date-pickers` v9 |
| Large lists | `@mui/x-data-grid` v9 (only if needed) |
| Graph | `@xyflow/react` (React Flow) |
| Editor | TipTap (ProseMirror-based) |
| Routing | React Router |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod |
| Build | Vite |
| Tests | Vitest + React Testing Library + Playwright |
| Package manager | pnpm workspace |

### 11.4 Desktop-only

| Layer | Choice |
|---|---|
| Runtime | Electron |
| Security | `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` |
| Local UI state | Zustand (panel/window state only) |
| IPC | Explicit `contextBridge` API, named channels only |
| Packaging | **Electron Forge** |

### 11.5 Mobile

| Layer | Choice |
|---|---|
| Framework | Flutter 3.x / Dart 3.x |
| State | Riverpod 3 |
| Navigation | go_router |
| HTTP | Dio |
| Serialization | freezed + json_serializable |
| Local DB | Drift / SQLite |
| Secure storage | flutter_secure_storage |
| Connectivity | connectivity_plus |
| Notifications | flutter_local_notifications |
| Editor | `flutter_quill` |
| Tests | `flutter_test` + `integration_test` |

### 11.6 Shared packages (pnpm workspace)

```text
apps/web, apps/desktop, apps/mobile, apps/api
packages/ui         → shared MUI components (web + desktop)
packages/api-client → generated TS client
packages/tokens     → design tokens → MUI theme + Dart theme
packages/contracts  → OpenAPI → TS client + Dart models (generated in CI)
```

> **Local mapping (decided 2026-11-03):** `apps/api` → `backend/`; `apps/web` → `web_app/`; `apps/desktop` → `desktop_app/`; `apps/mobile` → `flutter_app/`; `packages/*` → `packages/*` at repo root. One pnpm workspace at the root covers `backend`, `web_app`, `desktop_app`, and `packages/*` (Flutter `flutter_app/` sits outside pnpm). See `CODEMAP.md`.
>
> **Renamed 2026-11-04:** `frontend/` → `web_app/` (package `@niwa/web`), `mobile/` → `flutter_app/`, `desktop/` → `desktop_app/`. Mobile is built before desktop and AI — see `NIWA-PLAN-A-02.md`.

### 11.7 Pure MUI rule (frontend)

All React UI is built with **MUI only**:

- Components: `@mui/material`, `@mui/icons-material`, and MUI X (`@mui/x-tree-view`, `@mui/x-date-pickers`, `@mui/x-data-grid` if needed).
- Styling: MUI theme + `sx` prop + `styled()` (Emotion) only. **No** Tailwind, CSS Modules, plain `.css` files for components, shadcn/ui, Radix, Headless UI, Chakra, Ant, Bootstrap, or other icon sets.
- Layout uses MUI primitives (`Box`, `Stack`, `Grid`, `Container`).
- Non-UI libraries that render content (TipTap editor, React Flow graph) are allowed, but are **styled through the MUI theme** (tokens via `sx`/`styled`/`GlobalStyles`), never with a second styling system.
- The only global CSS allowed is `CssBaseline` + `GlobalStyles`.

---

### 11.8 Hosting & infrastructure (decided 2026-11-03)

| Concern | Service | Notes |
|---|---|---|
| Source control | **GitHub** — `https://github.com/PastelSalt/niwa-site.git` | Single monorepo |
| Backend API | **Render** (Web Service, Node) | Root dir `backend/`; health check `/api/v1/health` |
| Frontend (web) | **Vercel** | Root dir `web_app/`; Vite static build |
| Database | **MongoDB Atlas** (cloud) | Backend-only access; IP allowlist / Render egress |
| Images | **Cloudinary** | Signed uploads (server signs) |
| Cache / sessions / rate limits | **Render Key Value** (Redis-compatible) | Confirms §11.2 Redis choice |

**Cross-origin auth consequence:** Vercel and Render serve from different domains. To keep the refresh cookie first-party (`SameSite=Lax`, `HttpOnly`, `Secure`), the web client calls the API through a **Vercel rewrite** (`/api/*` → Render). Details in `docs/OPS.md`.

---

## 12. Ratified architectural decisions

All 13 recorded as **Accepted**.

| # | Decision | Resolution |
|---|---|---|
| 1 | **Auth transport** | Bearer access token everywhere (in-memory on web). Refresh token: HttpOnly cookie on web, OS keychain on desktop (`safeStorage`), `flutter_secure_storage` on mobile. Access: 5–15 min. Refresh: 7–30 days, rotated on every use, reuse revokes session. One request-auth path; platform-specific refresh storage. |
| 2 | **Standalone events** | **Yes.** One `schedule_entries` table with `kind: event \| block`. `block` carries `itemId`; `event` does not. |
| 3 | **Workspace layout** | **Single workspace, root containers** (Knowledge / Projects / College / Personal). `workspaces` table exists from day one; multi-workspace is post-MVP. |
| 4 | **Editor** | **TipTap** on web/desktop, stored as ProseMirror JSON with a `contentPlainText` mirror. **flutter_quill** on mobile. |
| 5 | **`dueAt` semantics** | **Date-only string** (`YYYY-MM-DD`), no timezone conversion. Timed things live in `schedule_entries` as UTC instants. `reviewAt` is also date-only. |
| 6 | **Archive vs delete** | Soft delete (`deletedAt`) + archive (`archivedAt`) with restore. Delete **cascades to descendants**. Trash view with restore and "delete permanently." Normal queries filter `deletedAt: null`. |
| 7 | **Reorder** | **Fractional indexing** — sortable string `orderKey` per sibling scope. Move writes only the moved row (O(1)). Index `{ workspaceId, parentId, orderKey }`. Rebalance only when key length grows unreasonable. |
| 8 | **Inbox membership** | **Explicit `inboxedAt` timestamp.** Set on capture, cleared on filing. Query `{ inboxedAt: { $ne: null }, deletedAt: null }`. |
| 9 | **Electron packaging** | **Electron Forge** (official; ASAR integrity + native fuses). |
| 10 | **DeepSeek key storage** | **Server-side AES-256-GCM**, random IV per record, master key from env secret. Proxy-only; key never returned to clients. |
| 11 | **AI action scope** | **Summarize + suggest child breakdown + auto-tag.** Never auto-create or auto-modify; AI output lands in Inbox for review. Per-item confirmation. |
| 12 | **Graph library** | **React Flow** on web/desktop. Simplified or deferred on mobile. |
| 13 | **Mobile parity** | **Full data/behavior parity; differentiated UI.** Graph and editor are the only deliberate gaps. |

---

## 13. Security & privacy

- HTTPS in production.
- Passwords hashed (bcrypt or argon2); never stored in client storage.
- Access tokens in memory; refresh tokens in platform-appropriate secure storage.
- Signed Cloudinary uploads — server signs, browser uploads directly; API secret never leaves the server.
- DeepSeek key encrypted at rest; never returned to clients.
- Electron: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, restrictive CSP, navigation restricted to trusted origins, IPC payloads validated.
- Centralized rate limiting on the API.
- No logging of passwords, tokens, or note content.
- Client route protection is usability only; the API enforces authorization on every protected operation.
- No team collaboration, no sharing, no external calendar — enforced by product design, not just configuration.

---

## 14. Scope

### 14.1 MVP (ship this first)

- Authentication (register, login, logout, session refresh)
- Single workspace with root containers
- One hierarchical item model, arbitrary depth
- Knowledge base: content editing, outline, related items, backlinks, review queue
- Actionable base: status, priority, deadline, effort, tags, Focus sections
- Move and reorder (fractional indexing)
- Inbox quick capture and filing
- Global search across titles and content
- Scheduler: month + week/day views, events and blocks, manual entry
- Cloudinary image uploads in note bodies
- Light/dark themes, keyboard navigation, responsive layout
- Web client first (reference implementation)
- Core automated tests

### 14.2 Planned (post-MVP)

- Electron desktop client (reuses React stack + shared UI)
- Flutter mobile client
- Graph view (web/desktop first, mobile simplified/deferred)
- DeepSeek AI (summarize, suggest breakdown, auto-tag)
- Semantic search (embeddings)
- Notifications for `dueAt` and `reviewAt`
- Undo for destructive operations
- Export / import (data portability — see §16)
- Multi-workspace
- Spaced repetition (SM-2 / FSRS)
- Import from Obsidian / Notion
- Command palette (desktop)

### 14.3 Permanently excluded

- Team collaboration
- External calendar import or sync
- Real-time collaboration
- Multi-user workspaces
- Sharing / public workspaces

---

## 15. Milestone plan (summary)

Build **web first** as the reference implementation, then port to desktop and mobile against the frozen contract. The detailed, phase-by-phase breakdown lives in **`NIWA-PLAN-A-01.md`**.

| # | Milestone | Deliverable |
|---|---|---|
| 0 | **Contract & docs** | Specs ratified. `openapi.yaml` v0.1 frozen. `DATA_MODEL.md`, `CONCEPT.md` written. Workspace scaffolded. |
| 1 | **Foundation** | pnpm workspace. API skeleton (layered). Auth endpoints. OpenAPI generation in CI. Tokens package. |
| 2 | **Web shell + auth** | Login/register, protected routes, theme, navigation shell for six destinations. |
| 3 | **Item tree + Actionable base** | Tree view, create/edit, move, reorder, status/priority, detail panel. |
| 4 | **Knowledge base** | TipTap content, outline, related items + backlinks, review queue. |
| 5 | **Scheduler** | `schedule_entries`, month + week views, drag/resize, recurrence. |
| 6 | **Inbox + Search** | Capture, filing, cross-base search with `contentPlainText`. |
| 7 | **Cloudinary + polish** | Signed uploads, image insertion, empty/loading/error states, accessibility audit. |
| 8 | **AI** | Key storage, summarize, suggest breakdown, auto-tag, review UX. |
| 9 | **Desktop** | Electron Forge, preload bridge, shared UI, native menus, window persistence. |
| 10 | **Mobile** | Flutter app, Riverpod, go_router, flutter_quill, parity against the contract. |
| 11 | **Graph + semantic search + export** | React Flow, embeddings, data export/import. |
| 12 | **Release** | Deploy, backup strategy, monitoring, documentation. |

**Rule:** no client milestone starts before `openapi.yaml` v0.1 is frozen, so all three clients build against the same contract.

---

## 16. Remaining gaps (to resolve in dedicated docs)

These do not block milestone 1 but must be resolved before the milestone that needs them.

| Doc | Must resolve | Needed by |
|---|---|---|
| `CONCEPT.md` | Navigation shell for six destinations; cross-base item visibility; capture → classify flow; heading-to-item promotion; links to specific sections | Milestone 2–4 |
| `DATA_MODEL.md` | Type transition matrix; tag shared-namespace rules; attachment orphan cleanup; search field extraction details | Milestone 3 |
| `SCHEDULER.md` | Drag semantics; recurrence instance handling; timezone display rules; overlapping entry handling | Milestone 5 |
| `AI.md` | Prompts; streaming; long-note context strategy; invalid/expired key UX; rate-limit handling; token cost visibility; AI testing strategy | Milestone 8 |
| `OPS.md` | Backend hosting; MongoDB hosting (Atlas vs self-hosted); Redis confirmation; CI/CD; backups; monitoring; export/import format | Milestone 0–1 |
| `GRAPH.md` | Layout algorithm choice; rendering trigger; performance target for 1000+ nodes | Milestone 11 |
| `NOTIFICATIONS.md` | Which client sends `dueAt`/`reviewAt` reminders; local vs push; dedup | Post-MVP |

**Two gaps worth flagging now:**
- **Backups.** For a personal knowledge base, no backup strategy is a serious risk. Define in `OPS.md` before MVP ships.
- **Export / import.** Data portability is a baseline expectation for a knowledge app. Plan the export format early — it also enables the later Obsidian/Notion import.

---

## 17. Relationship to original specs

This document supersedes the **concept and scope** sections of `niwa-web`, `niwa-desktop`, and `niwa-mobile`. Those specs' **security, accessibility, testing, and error-handling principles** remain valid and are incorporated here.

Changed from the original specs:

- **Removed:** Tailwind, shadcn/ui, Lucide, CSS Modules, three separate auth paths, ICS calendar import, team collaboration, multi-workspace in MVP.
- **Added:** MUI v9 as the single React UI layer, Cloudinary, DeepSeek AI, graph view, scheduler as a first-class base, fractional indexing, soft delete + cascade, explicit Inbox rule, shared pnpm workspace with `packages/ui`, `packages/tokens`, `packages/contracts`.

---

*NIWA is one coherent ecosystem: one tree, three bases, one scheduler, three clients built against one contract.*
