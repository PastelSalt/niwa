# NIWA — Known gaps

Open items that were deferred or not yet verified. Add here when something is skipped; tick and note the
date + `LOGS.md` entry when closed. Plans: `NIWA-PLAN-A-01.md` (web/backend), `NIWA-PLAN-A-02.md` (mobile).

## Open

### From M7 (Cloudinary + polish)
- [ ] **Performance pass on large trees** (M7.P3) — not done. Seed ~2,000–5,000 items, measure `GET /tree`
      time and tree-pane render/expand/drag cost; virtualize the tree or lazy-load branches if it's slow.
- [ ] **Cloudinary against a live account** — only tested against a fake Cloudinary API. Needs
      `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET`; then upload, confirm, orphan sweep and purge by hand.
- [ ] **Nightly backup secrets** — `.github/workflows/backup.yml` needs `BACKUP_MONGODB_URI`,
      `BACKUP_MONGODB_DB`, `BACKUP_AGE_RECIPIENT` and an `age` key pair (OPS.md §9). First manual run + restore
      drill into staging not done.
- [ ] **Trash auto-purge switch** — the 30-day purge always runs; no Settings toggle (DATA_MODEL.md §5).
- [ ] **Keyboard creation in the week grid** — creating by drag is pointer-only; keyboard users use **New**.

### On hold (owner, 2026-11-04)
- [ ] **MongoDB connection trouble** — the owner can't currently connect to MongoDB. This **blocks the backend
      deploy**: `backend/src/server.ts` awaits `connectDb()` before `listen()`, so Render's health check would
      fail. Fix the Atlas connection (IP access list `0.0.0.0/0` for Render, user/password, SRV string), then
      run `scripts/deploy/render.sh`.

### Multi-user readiness (owner, 2026-11-04 — NIWA is open to everyone)
NIWA was built single-user per instance; the owner has opened it to anyone. Data is already separated per
account (every query is scoped by `workspaceId`), but these backend items are still needed or worth doing.
Product side is in `NIWA-PLAN-B-01.md`.
- [ ] **Outbound email** — none exists. Needed for password reset and (optionally) email verification; pick a
      provider and add its secret to `render.yaml` as `sync: false`.
- [ ] **Password reset** — change is done (`POST /account/password`, 2026-11-04); reset still needs single-use, short-lived, hashed tokens and must
      revoke all refresh sessions (reuse `revokeAllForUser`).
- [ ] **Email verification** — accounts are usable without proving the address; decide whether to require it.
- [ ] **Per-account limits** — rate limits are per IP only (`middleware/rateLimit.ts`); there's a per-image size
      cap but no per-account quota on items, attachments or total Cloudinary storage. Free-tier Cloudinary and
      Atlas (512 MB) are shared by all accounts, so one heavy account can fill them.
- [ ] **Sign-up abuse** — register only has the auth IP limiter; consider a per-email cooldown and alerting on
      bursts of new accounts.
- [ ] **Scale checks** — indexes are workspace-scoped already; re-check `GET /tree`, search and the maintenance
      job with many accounts (ties to "Performance pass on large trees").
- [ ] **Admin basics** — no way for the operator to disable an abusive account other than editing the database.

### Carried from earlier milestones
- [ ] **Hosting accounts** (M1/M2) — Vercel project `niwa` exists; Atlas and the Render service don't yet. `web_app/vercel.json` points at the default `niwa-api.onrender.com` until Render assigns the real host.
      Deploys are scripted (`scripts/deploy/`, OPS §12). **Web is live** at https://niwa-delta.vercel.app (2026-11-04);
      the backend waits on the MongoDB connection (see On hold), so sign-in and data calls fail until then.
      Vercel root directory is now `web_app` (renamed from `frontend`).
- [ ] **Month drag on touch** (M5) — native drag-and-drop doesn't work on touch; use the dialog.
- [ ] **Overlapping all-day events in week view** (M5) — stack rather than span.
- [ ] **Week start** (M5) — fixed to Monday, not configurable.
- [ ] **Bulk delete in Inbox** (M6) — web: single delete with Undo only (mobile has bulk delete since A-02 MA8).
- [ ] **Search pagination** (M6) — capped at 40 results.
- [ ] **Capture body** (M6) — plain text only, no rich text.

### Mobile (A-02)
- [ ] **First build + emulator run** — MA1 placeholder, MA2 register/login/logout/restart against `pnpm dev:memory`,
      and MA3 tabs have only run in widget tests; owner will say when to build.
- [ ] **Shell golden tests** (MA3 exit) — font-dependent; generate on one fixed machine or in CI.
- [ ] **Deep links on a device** — `niwa://open/…` intent filter / URL type not yet tried on Android or iOS.
- [ ] **Airplane-mode run on a device** (MA5 exit) — covered by `test/offline_test.dart` only.
- [ ] **Schedule + links in the offline cache** — join with MA7 / MA6.
- [ ] **Manual web → phone → web note round-trip** (MA6 exit) — automated round-trip only so far.
- [ ] **Images between phone and web** (MA9 exit) — same node shape and tested against fakes; needs a live
      Cloudinary account (see "Cloudinary against a live account") and a device.
- [ ] **Image disk cache** — phone images use Flutter's in-memory cache only; re-downloaded after a restart.
- [ ] **Locked shapes** — multi-paragraph list items, quotes with lists, code blocks with a language,
      ordered lists not starting at 1 and custom link attrs are view-only on mobile.
- [ ] **Reminders on a device** — permission prompt, delivery after reboot and DST not yet seen on a phone.
- [ ] **Tapping a reminder** — opens the app but not yet the entry's day (payload is set; handler not wired).
- [ ] **Share-to-NIWA and a Capture shortcut/tile** (MA8 stretch) — not built.
- [ ] **Agenda view** (MA7 proposal) — not built; the tab opens on the day view.
- [ ] **Sign out everywhere delay** — other devices keep their access token until it expires (≤ 15 min);
      only refresh is revoked. Fine for now; a token denylist would close it.
- [ ] **Offline editing** — edits are refused offline (only capture queues); a full outbox needs conflict UX (A-02 "later").

### Web
- [ ] **Legal pages (B-01 B3)** — Privacy, Terms, EULA, the repo `LICENSE`, the sign-up "you agree" line and a
      privacy contact all wait on the owner's B0 answers (contact email, jurisdiction, minimum age, code licence,
      review). Cookies and Licences are live.
- [ ] **Landing LCP on phones** — 3.3 s with 4× CPU / ~4G throttling (desktop 0.8 s; CLS 0.000). Visitors still
      download the shared MUI/app chunks; splitting them further would bring it under 2.5 s.
- [ ] **Accessibility leftovers (B-01 B6/B7)** — axe not yet run on Cookies, Licences, 404 or the welcome dialog;
      tour not checked at 200 % text; empty states don't link to tour steps yet.
- [ ] **Export as Markdown** — export is JSON only (`GET /account/export`); Markdown per note still to do.
- [ ] **Mobile: tour and account actions** — the Flutter app reads `onboarding` but has no tour, change-password,
      export or delete-account screens yet (web has them). Fold into A-02 MA10/MA11.
- [ ] **Link previews on the live site** — `og:image` and `robots.txt`/`sitemap.xml` checked locally only; check
      on niwa-delta.vercel.app after this deploys.
- [ ] **Flaky `shell.test.tsx` › "hides the tree pane on non-tree destinations"** — fails about 1 run in 3 on
      the Linux laptop (~1.1 s, likely a timing-sensitive wait); untouched code. Seen 2026-11-04.

### Deferred by owner
- [ ] **AI (DeepSeek, M8)** — skipped for now (2026-11-04); mobile (`NIWA-PLAN-A-02.md`) comes first.

## Closed

- [x] **Registration mode** — `render.yaml` sets `REGISTRATION_MODE=open`; `GET /auth/config` tells clients (2026-11-04).
- [x] **Onboarding state** — `users.onboarding` + `PUT /account/onboarding` (2026-11-04).
- [x] **Account deletion** — `POST /account/delete`, password-confirmed (2026-11-04).
- [x] **B-01 B5 leftovers** — design pass finished, JetBrains Mono loaded, layout shift measured (2026-11-04).
- [x] **Playwright on the laptop** — Chromium installed; full e2e suite green locally (2026-11-04).
- [x] **Bundled fonts (Flutter)** — Inter, JetBrains Mono and the 庭 slice bundled with OFL texts (2026-11-04).

- [x] **MA9 not committed** — committed as `7a39bc9` and pushed with `738aeb6` (2026-11-04).

- [x] **Flutter CI first run** — passed on push of `05ed969` (2026-11-04): analyze, format, codegen freshness, tests and debug APK. LOGS 2026-11-04.
