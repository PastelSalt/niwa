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
