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
- [ ] **MA9 not committed yet** — Settings/Trash/images and `POST /auth/logout-all` are in the working tree,
      tested (Flutter 403, backend 86); held by the owner before commit and MA10.
- [ ] **MongoDB connection trouble** — the owner can't currently connect to MongoDB. This **blocks the backend
      deploy**: `backend/src/server.ts` awaits `connectDb()` before `listen()`, so Render's health check would
      fail. Fix the Atlas connection (IP access list `0.0.0.0/0` for Render, user/password, SRV string), then
      run `scripts/deploy/render.sh`.

### Carried from earlier milestones
- [ ] **Hosting accounts** (M1/M2) — Atlas, Render, Vercel not created yet; `vercel.json` Render hostname is a placeholder.
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
- [ ] **Bundled fonts** — Inter / Noto Sans JP not bundled; phones show the platform font.
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
- [ ] **Flaky `shell.test.tsx` › "hides the tree pane on non-tree destinations"** — fails about 1 run in 3 on
      the Linux laptop (~1.1 s, likely a timing-sensitive wait); untouched code. Seen 2026-11-04.

### Deferred by owner
- [ ] **AI (DeepSeek, M8)** — skipped for now (2026-11-04); mobile (`NIWA-PLAN-A-02.md`) comes first.

## Closed

- [x] **Flutter CI first run** — passed on push of `05ed969` (2026-11-04): analyze, format, codegen freshness, tests and debug APK. LOGS 2026-11-04.
