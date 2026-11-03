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
| `pnpm e2e` | Playwright smoke (starts in-memory API on 4100 + Vite on 5174). First time: `pnpm --filter @niwa/web exec playwright install chromium` |
| `pnpm build` | Production build of the web client (`web_app/dist`) |
| `pnpm lint` · `pnpm typecheck` · `pnpm format:check` · `pnpm openapi:check` | What CI runs |

- **MongoDB:** point `MONGODB_URI` at an Atlas `niwa_dev` database (simplest on Windows), or a local `mongod` / Docker container.
- **Redis:** optional locally. If `REDIS_URL` is unset in `local`, the backend falls back to an in-memory store for rate limits and sessions (never in production — startup fails if missing there).
- **Vite proxy:** `web_app/vite.config.ts` proxies `/api` → `http://localhost:4000`, mirroring the Vercel rewrite so cookies behave the same locally.
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
| `RATE_LIMIT_AUTH_MAX` | Login/register attempts per 15 min per IP. Default `20`; e2e raises it |
| `RATE_LIMIT_GENERAL_MAX` | All `/api/v1` requests per minute per IP. Default `600` |
| `CORS_ORIGINS` | Comma list, e.g. `http://localhost:5173,https://niwa.vercel.app` |
| `COOKIE_DOMAIN` | Unset (host-only cookie on the Vercel domain via rewrite) |
| `CLOUDINARY_CLOUD_NAME` | — |
| `CLOUDINARY_API_KEY` | secret |
| `CLOUDINARY_API_SECRET` | secret, server only |
| `CLOUDINARY_FOLDER` | `niwa/local` / `niwa/prod` |
| `AI_ENCRYPTION_KEY` | 32 bytes base64 (M8, secret) |
| `LOG_LEVEL` | `info` |

All validated by Zod at startup (`backend/src/config/env.ts`); missing/invalid → process exits.

### 4.2 Frontend (`web_app/.env`, Vercel env vars)

| Var | Note |
|---|---|
| `VITE_API_BASE` | `/api/v1` (relative — goes through rewrite/proxy) |
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
| Root directory | `web_app` (with "include files outside root" enabled for `packages/*`) |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Ignored build step | skip if no changes in `web_app/`, `packages/`, `pnpm-lock.yaml` |

`web_app/vercel.json` (planned):

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
- No upload preset needed: the server signs `folder`, `public_id`, `tags=niwa-pending` and `allowed_formats` per upload (`POST /uploads/sign`); the browser posts the file straight to Cloudinary, then `POST /attachments` verifies it (folder, format, ≤ 10 MB) and removes the pending tag (`DATA_MODEL.md` §8).
- Delivery via `secure_url` with `f_auto,q_auto` (added client-side).
- Without the three `CLOUDINARY_*` credentials the API answers `503 NOT_CONFIGURED` and the editor disables image insertion with a tooltip.
- Housekeeping runs in the API process every 6 h (`maintenance.service.ts`): orphans > 7 days and unconfirmed uploads > 24 h are destroyed; Trash > 30 days is purged.

---

## 9. Backups

Atlas **M0 has no automated backups**, so NIWA ships its own (M7.P4). Layers:

| Layer | What | When | Status |
|---|---|---|---|
| 1. Portable dump | `.github/workflows/backup.yml`: `pnpm --filter @niwa/backend backup` → `age`-encrypted archive → workflow artifact (14 days) | Nightly 03:17 UTC + manual | ✅ M7 |
| 2. Atlas backups | Move prod to M10+ with continuous cloud backup | When data becomes important | Later |
| 3. User export | In-app full export (JSON + Markdown) | On demand | M11 |
| Images | Cloudinary keeps the originals; the dump includes every `attachments` record (public id + URL) | — | ✅ |

**Format.** One gzip'd NDJSON file: a header line (`format`, `version`, `createdAt`, `database`, per-collection counts), then one Extended JSON line per document (`{"c": collection, "d": doc}`). ObjectIds, dates and binary round-trip exactly; no `mongodump` binary or matching server version is needed. Indexes are not stored — restore rebuilds them from the models.

**Local / manual use** (reads `MONGODB_URI` and `MONGODB_DB` from `backend/.env` or the environment):

```bash
pnpm --filter @niwa/backend backup                       # → backend/backups/niwa-<db>-<time>.ndjson.gz
pnpm --filter @niwa/backend restore <file>               # dry run: prints what's inside
pnpm --filter @niwa/backend restore <file> --yes         # into an empty database
pnpm --filter @niwa/backend restore <file> --yes --drop  # replace existing data
```

Restore refuses to write into non-empty collections without `--drop`, and fails if any collection's restored count differs from the header. `backups/` and `*.ndjson.gz(.age)` are git-ignored — dumps contain personal data.

**Nightly workflow setup** (one-time, by the owner):
1. `age-keygen -o niwa-backup.key` on your machine; keep the key file offline (password manager / USB). The printed `age1…` line is the public recipient.
2. In Atlas, create a **read-only** database user for `niwa_prod`; allow GitHub runners in Network Access (Atlas M0 needs `0.0.0.0/0` — the user is read-only and the password long).
3. GitHub → Settings → Secrets → Actions: `BACKUP_MONGODB_URI`, `BACKUP_MONGODB_DB` (`niwa_prod`), `BACKUP_AGE_RECIPIENT`.
4. Run the workflow once by hand (Actions → Backup → Run workflow) and check the artifact appears.

**Decrypt + restore:** download the artifact, `age -d -i niwa-backup.key -o niwa.ndjson.gz <file>.age`, then `restore` as above.

- **Restore drill:** monthly, restore the latest archive into `niwa_staging` (`MONGODB_DB=niwa_staging … --yes --drop`), sign in on staging, spot-check a note with an image and the calendar; log the result in `LOGS.md`.
- **Retention:** 14 daily artifacts (GitHub limit on free plans is 90 days; raise `retention-days` if wanted). Weekly long-term copies: download one artifact a week to your own storage until a bucket is chosen (open question below).

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

- [ ] Long-term backup copies: nightly archives live 14 days as encrypted workflow artifacts — add a bucket (e.g. Cloudflare R2 / B2) for weekly copies, or move to Atlas M10?
- [ ] Production domain: stay on `*.vercel.app` or use a custom domain? (A custom domain lets the API be `api.<domain>` on Render as a same-site alternative to the rewrite.)
- [ ] Render region (pick the one closest to you and to the Atlas cluster region).
