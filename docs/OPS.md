# NIWA — OPS.md (environments, hosting, backups)

**Status:** Draft v0.1 — hosting decided, details proposed
**Resolves:** `PROJECT-SPECS.md` §16 → `OPS.md` row (first pass; finalized in M7.P4 / M12.P1)
**Parent doc:** `PROJECT-SPECS.md` §11.8 (wins on conflict)
**Last updated:** 2026-11-03

---

## 1. Services

| Concern | Service | Plan / tier (start) |
|---|---|---|
| Source | GitHub — `PastelSalt/niwa-site` | — |
| Backend API | Render Web Service (Node) | Free → Starter when cold starts annoy |
| Cache / sessions / rate limits | Render Key Value (Redis-compatible) | Free |
| Frontend | Vercel (Vite static build) | Hobby |
| Database | MongoDB Atlas | M0 free (dev) → M10 when backups needed |
| Images | Cloudinary | Free |
| AI | DeepSeek API | Pay-as-you-go (M8) |

```text
Browser ──HTTPS──► Vercel (frontend static)
   │                 │  rewrite /api/*  ──HTTPS──►  Render (backend, Express)
   │                                                   │        │
   └──── direct signed upload ──► Cloudinary ◄─────────┘        ├──► MongoDB Atlas
                                                                └──► Render Key Value
```

---

## 2. Environments

| Env | Frontend | Backend | Database | Cloudinary folder |
|---|---|---|---|---|
| `local` | `http://localhost:5173` (Vite) | `http://localhost:4000` | Atlas `niwa_dev` db (or local Mongo) | `niwa/local/…` |
| `preview` | Vercel preview deploy per branch/PR | shared staging Render service (optional, later) | Atlas `niwa_staging` | `niwa/staging/…` |
| `production` | Vercel production (`main`) | Render production (`main`) | Atlas `niwa_prod` | `niwa/prod/…` |

- Separate **Atlas database users** per env, each with access to only its own db.
- Production data is never copied into local/preview.

---

## 3. Local development

**Prerequisites:** Node 24 LTS (`.nvmrc`), pnpm (via Corepack), Git.

```bash
corepack enable
pnpm install
pnpm dev            # backend (4000, needs backend/.env with MONGODB_URI) + frontend (5173)
pnpm dev:memory     # same, but the API uses a throwaway in-memory MongoDB — no Atlas needed
```

| Command | What it does |
|---|---|
| `pnpm test` | Unit/integration tests in every package |
| `pnpm e2e` | Playwright smoke (starts in-memory API on 4100 + Vite on 5174). First time: `pnpm --filter @niwa/frontend exec playwright install chromium` |
| `pnpm build` | Production build of the web client (`frontend/dist`) |
| `pnpm lint` · `pnpm typecheck` · `pnpm format:check` · `pnpm openapi:check` | What CI runs |

- **MongoDB:** point `MONGODB_URI` at an Atlas `niwa_dev` database (simplest on Windows), or a local `mongod` / Docker container.
- **Redis:** optional locally. If `REDIS_URL` is unset in `local`, the backend falls back to an in-memory store for rate limits and sessions (never in production — startup fails if missing there).
- **Vite proxy:** `frontend/vite.config.ts` proxies `/api` → `http://localhost:4000`, mirroring the Vercel rewrite so cookies behave the same locally.
- **Tests** use `mongodb-memory-server` — no external DB needed.

---

## 4. Environment variables

Each app ships a committed `.env.example`; real `.env` files are git-ignored.

### 4.1 Backend (`backend/.env`, Render env vars)

| Var | Example / note |
|---|---|
| `NODE_ENV` | `development` \| `production` \| `test` |
| `APP_ENV` | `local` \| `staging` \| `production` |
| `PORT` | `4000` locally; Render injects its own |
| `MONGODB_URI` | Atlas SRV string (secret) |
| `MONGODB_DB` | `niwa_dev` / `niwa_prod` |
| `REDIS_URL` | Render Key Value internal URL (secret) |
| `JWT_ACCESS_SECRET` | ≥ 32 chars (secret); Render generates it |
| `ACCESS_TOKEN_TTL_SECONDS` | `600` (allowed 300–900) |
| `REFRESH_TOKEN_TTL_DAYS` | `14` (allowed 7–30). Refresh tokens are opaque random values stored as SHA-256 hashes — no signing secret needed |
| `REGISTRATION_MODE` | `first_user_only` (default) \| `open` \| `closed` — single-user app, so only the first account can register by default |
| `CORS_ORIGINS` | Comma list, e.g. `http://localhost:5173,https://niwa.vercel.app` |
| `COOKIE_DOMAIN` | Unset (host-only cookie on the Vercel domain via rewrite) |
| `CLOUDINARY_CLOUD_NAME` | — |
| `CLOUDINARY_API_KEY` | secret |
| `CLOUDINARY_API_SECRET` | secret, server only |
| `CLOUDINARY_FOLDER` | `niwa/local` / `niwa/prod` |
| `AI_ENCRYPTION_KEY` | 32 bytes base64 (M8, secret) |
| `LOG_LEVEL` | `info` |

All validated by Zod at startup (`backend/src/config/env.ts`); missing/invalid → process exits.

### 4.2 Frontend (`frontend/.env`, Vercel env vars)

| Var | Note |
|---|---|
| `VITE_API_BASE` | `/api/v1` (relative — goes through rewrite/proxy) |
| `VITE_CLOUDINARY_CLOUD_NAME` | Public, used for delivery URLs |
| `VITE_APP_ENV` | `local` / `preview` / `production` |

Rule: **nothing secret ever gets a `VITE_` prefix** — those are bundled into public JS.

---

## 5. Render (backend)

| Setting | Value |
|---|---|
| Service type | Web Service, runtime Node |
| Root directory | repo root (so pnpm workspace + `packages/*` resolve) |
| Build command | `corepack enable && pnpm install --frozen-lockfile --filter @niwa/backend...` (no compile step) |
| Start command | `pnpm --filter @niwa/backend start` (→ `node src/server.ts`, Node 24 native type stripping) |
| Health check path | `/api/v1/health` |
| Auto-deploy | On push to `main` |
| Build filter (paths) | `backend/**`, `packages/**`, `pnpm-lock.yaml` |
| Node version | from `.nvmrc` |

- Config captured as **`render.yaml`** (Blueprint) at repo root: web service `niwa-api` + Key Value `niwa-cache`. Values marked `sync: false` (Mongo URI, CORS origins, Cloudinary) are entered in the Render dashboard.
- **No build step:** all TypeScript is written with erasable syntax only (`erasableSyntaxOnly`), so Node 24 runs `.ts` files directly — including workspace packages like `@niwa/contracts`. `tsc` is used only for typechecking.
- Express: `app.set('trust proxy', 1)` (needed for secure cookies + rate limiting behind Render's proxy).
- Free tier spins down after inactivity → first request can take ~30–60 s. Acceptable for dev; upgrade before relying on it daily.

---

## 6. Vercel (frontend)

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Root directory | `frontend` (with "include files outside root" enabled for `packages/*`) |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Ignored build step | skip if no changes in `frontend/`, `packages/`, `pnpm-lock.yaml` |

`frontend/vercel.json` (planned):

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://<render-service>.onrender.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 6.1 Why the rewrite (auth cookies)

Vercel (`*.vercel.app`) and Render (`*.onrender.com`) are different sites. Browsers increasingly block third-party cookies, so a refresh cookie set by Render directly would be unreliable. Through the rewrite, the browser only ever talks to the Vercel origin, so the refresh cookie is **first-party**:

```text
Set-Cookie: niwa_rt=…; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth
```

- Access token: in memory only (§12.1).
- CSRF: refresh endpoint requires a custom header (`X-Requested-With: niwa`) + `SameSite=Lax`; all other endpoints use Bearer tokens (not cookies) so they aren't CSRF-able.
- CORS stays narrow (`CORS_ORIGINS`) for direct calls (desktop/mobile/preview); the rewrite path is same-origin.

---

## 7. MongoDB Atlas

- One project `niwa`, cluster per tier; databases `niwa_dev`, `niwa_staging`, `niwa_prod`.
- **Network access:** Render free/Starter services don't have a fixed IP by default. Options:
  1. Use Render's published **outbound IP ranges for the service region** in the Atlas allowlist (preferred).
  2. `0.0.0.0/0` + strong unique credentials + TLS (only as a temporary dev fallback — record it in `LOGS.md` if used).
- Database users: least privilege (`readWrite` on one db).
- Indexes are created by the app at startup in `local`; in production via a migration script (no `autoIndex` in prod).

---

## 8. Cloudinary

- Signed uploads only; `CLOUDINARY_API_SECRET` lives only in Render env.
- Folder per env + workspace: `niwa/<env>/<workspaceId>/`.
- Upload preset: signed, images only, max 10 MB, tag `niwa-pending` until confirmed (`DATA_MODEL.md` §8).
- Delivery via `secure_url` with `f_auto,q_auto`.

---

## 9. Backups (flagged gap — must be solved before MVP ships)

Atlas **M0 has no automated backups**. Proposed layered approach:

| Layer | What | When |
|---|---|---|
| 1. Scheduled dump | GitHub Actions cron → `mongodump` of `niwa_prod` → encrypted (`age`) archive → stored off-Atlas (see open question) | Nightly |
| 2. Atlas backups | Move prod to M10+ with continuous cloud backup | When data becomes important / before daily use |
| 3. User export | In-app full export (JSON + Markdown), M11 | On demand |
| Images | Cloudinary retains originals; export includes `public_id`s | — |

- **Restore drill:** restore the latest dump into `niwa_staging` monthly; log the result in `LOGS.md`.
- Retention: 14 daily + 8 weekly.

---

## 10. CI/CD (GitHub Actions)

| Workflow | Trigger | Steps |
|---|---|---|
| `ci.yml` | PR + push to `main` | install → lint → typecheck → test (backend + frontend) → OpenAPI regen + diff check |
| `backup.yml` | nightly cron | `mongodump` → encrypt → upload |
| Deploys | — | Handled by Render and Vercel Git integrations (no deploy secrets in GitHub) |

Branching: `main` = production. Work on feature branches → PR → merge. Vercel builds previews for every PR.

---

## 11. Monitoring & logs

- Backend: Pino JSON logs → Render log stream (redacted: no passwords, tokens, note content).
- Request id per request (`x-request-id`), echoed in error envelopes.
- Uptime: Render health check; optional external ping later.
- Error tracking (e.g. Sentry) — **open**, decide in M12.

---

## Open questions for owner

- [ ] Where should nightly backup archives live (private GitHub release assets, a cloud bucket, or rely on Atlas M10)?
- [ ] Production domain: stay on `*.vercel.app` or use a custom domain? (A custom domain lets the API be `api.<domain>` on Render as a same-site alternative to the rewrite.)
- [ ] Render region (pick the one closest to you and to the Atlas cluster region).
