# NIWA — Known gaps

Open items that were deferred or not yet verified. Add here when something is skipped; tick and note the
date + `LOGS.md` entry when closed. Plans: `NIWA-PLAN-A-01.md` (backend, web, desktop), `NIWA-PLAN-A-02.md`
(mobile), `NIWA-PLAN-B-01.md` (public site, legal, multi-user), `NIWA-PLAN-B-02.md` (web UI/UX refinement — current focus).

## Pending by plan (summary — updated 2026-11-04)

Start here. Details for each line are further down or in the plan named.

**Live app** — backend deployed on Render (Singapore) 2026-11-04; sign-up/sign-in confirmed by the owner on 5
devices; images (Cloudinary) confirmed working 2026-11-04. Next: nightly backup secrets.

**A-01 — backend, web, desktop** · done: M1–M7 code, web live on Vercel
- M0: formal sign-off of the docs and contract (low priority — the contract has been in use since M1).
- M1: done — Atlas + Render deployed 2026-11-04.
- M7: browser performance with a 2–5k-item tree (Cloudinary confirmed live).
- M8 AI: paused by the owner.
- M9 Desktop (Electron): not started — after mobile.
- M11: graph view, semantic search, Markdown export + import (JSON export is done).
- M12 Release: nightly backups (needs secrets), monitoring/alerts, user guide, developer README (no root `README.md` yet).

**A-02 — mobile** · done: MA0–MA9 code (409 tests)
- Never built or run on a phone/emulator yet — waiting for the owner's go.
- MA10: accessibility (TalkBack, 200 % text), golden tests, integration tests in CI, 5k-item performance, and
  **parity with the web**: onboarding tour, Settings › Account (password, export, delete, usage), hide sign-up when
  closed, quota/disabled messages.
- MA11: icon/splash, signing, Play Console + data-safety form (privacy URL is ready); iOS needs a Mac + Apple
  developer account.
- Stretch: agenda view, share-to-NIWA, capture tile.

**B-01 — public site, legal, multi-user** · done: B0, B1, B2, B3, B5; quotas, rate limits, admin tools, scale check
- B4: password reset — **skipped for now** (needs an email provider).
- B6: landing load time on phones (3.3 s, target 2.5 s); accessibility audit of the 404 page and welcome dialog.
- B7: tour at 200 % text; empty states linking to tour steps; the mobile tour (A-02 MA10).
- Markdown export (also A-01 M11).

**B-02 — web UI/UX refinement (current focus)** · V0–V11 built 2026-11-04 on `claude/laughing-ride-f01job`
- **Owner:** approve the pastel theme values (Garden, Blossom, Lavender, Sky, Peach — `packages/tokens`) before
  merge; Garden is now the default look everywhere, with pastel contained buttons.
- **Owner:** manual pass on a real phone (V7 exit).
- Landscape phone and 200 % browser zoom not checked (V7).
- Axe runs not done here (the e2e needs the in-memory API, whose MongoDB binary couldn't be downloaded in this
  environment): welcome dialog, 404, every dialog, each theme × mode, and the landing with the playground (V9,
  V10.P5, V11.P4). The new `e2e/playground.spec.ts` passed locally against Vite alone.
- Backend test for `PUT /account/preferences` written but not run here (same reason) — CI runs it.
- Landing LCP on phones not re-measured (B-01 leftover 3.3 s, target 2.5 s) — needs the deployed site.
- Image captions in notes: the editor has no caption node (alt text only) — declined for now (V4).
- Mobile (A-02) doesn't read `preferences` yet.

**B-01 B8–B15 — holidays + calmer UX** · built 2026-11-05 on `claude/laughing-ride-f01job`
- Backend tests (holiday endpoints, `starter`, preferences) and the updated e2e specs weren't run here (the
  in-memory MongoDB can't download in this environment) — CI must run them; expect a few selector fixes.
- Axe on Today, the command box, Settings › Calendar and Inbox triage — with the CI a11y spec.
- Getting started "Hide" is per browser, not on the account (no contract field for it yet).
- Plan my day: drag from the panel is mouse-only; keyboard users press + (next free hour).
- Mobile (A-02) doesn't have Today, the command box, holidays or triage yet.

**B-03 — make it yours (planned 2026-11-06, nothing built)** · `NIWA-PLAN-B-03.md`
- C0 owner check first: the Scrapbook look (from the Kotoha fan site / Moeko Works dashboards) as the new
  default, then backgrounds, item icons, profile page, layout presets; Google integration later (C6).

**Decisions only the owner can make**
- Email provider for password reset/verification (skipped for now).
- When to build and run the mobile app on a device; when to do iOS.
- Whether to resume AI (M8).
- Custom domain, or keep `niwa-delta.vercel.app` (B-01 open question 4).
- Long-term backup copies beyond 14 days (`docs/OPS.md` open questions).

## Open

### From M7 (Cloudinary + polish)
- [ ] **Performance pass on large trees** (M7.P3) — server side measured (2026-11-04, `scale-check`): `/tree`
      ~0.7 s at the 10k-item quota, ~130 KB gzip. Still to do: browser render/expand/drag cost with 2–5k items;
      virtualize the tree or lazy-load branches if it's slow.
- [ ] **Nightly backup secrets** — `.github/workflows/backup.yml` needs `BACKUP_MONGODB_URI`,
      `BACKUP_MONGODB_DB`, `BACKUP_AGE_RECIPIENT` and an `age` key pair (OPS.md §9). First manual run + restore
      drill into staging not done.
- [ ] **Trash auto-purge switch** — the 30-day purge always runs; no Settings toggle (DATA_MODEL.md §5).
- [ ] **Keyboard creation in the week grid** — creating by drag is pointer-only; keyboard users use **New**.

### Multi-user readiness (owner, 2026-11-04 — NIWA is open to everyone)
NIWA was built single-user per instance; the owner has opened it to anyone. Data is already separated per
account (every query is scoped by `workspaceId`), but these backend items are still needed or worth doing.
Product side is in `NIWA-PLAN-B-01.md`.
- [ ] **Outbound email** — *skipped for now (owner, 2026-11-04).* None exists. Needed for password reset and (optionally) email verification; pick a
      provider and add its secret to `render.yaml` as `sync: false`.
- [ ] **Password reset** — change is done (`POST /account/password`, 2026-11-04); reset still needs single-use, short-lived, hashed tokens and must
      revoke all refresh sessions (reuse `revokeAllForUser`).
- [ ] **Email verification** — accounts are usable without proving the address; decide whether to require it.

### Carried from earlier milestones
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
- [ ] **Landing LCP on phones** — 3.3 s with 4× CPU / ~4G throttling (desktop 0.8 s; CLS 0.000). Visitors still
      download the shared MUI/app chunks; splitting them further would bring it under 2.5 s.
- [ ] **Accessibility leftovers (B-01 B6/B7)** — axe not yet run on the 404 page or the welcome dialog;
      tour not checked at 200 % text; empty states don't link to tour steps yet.
- [ ] **Export as Markdown** — export is JSON only (`GET /account/export`); Markdown per note still to do.
- [ ] **Mobile: tour and account actions** — the Flutter app reads `onboarding` but has no tour, change-password,
      export or delete-account screens yet (web has them). Fold into A-02 MA10/MA11.
- [ ] **Flaky `shell.test.tsx` › "hides the tree pane on non-tree destinations"** — fails about 1 run in 3 on
      the Linux laptop (~1.1 s, likely a timing-sensitive wait); untouched code. Seen 2026-11-04.

### Deferred by owner
- [ ] **AI (DeepSeek, M8)** — skipped for now (2026-11-04); mobile (`NIWA-PLAN-A-02.md`) comes first.

## Closed

- [x] **Cloudinary against a live account** — keys set in Render; uploads confirmed by the owner (2026-11-04).

- [x] **Hosting accounts** (M1/M2) — Vercel `niwa`, Render `niwa-api` + `niwa-cache` (Singapore), Atlas all live (2026-11-04).

- [x] **MongoDB connection / backend deploy** — Atlas connected, Render Blueprint applied, `niwa-api.onrender.com` healthy; web works through the Vercel rewrite (2026-11-04).

- [x] **Per-account limits** — item and image-storage quotas (`lib/quota.ts`, env-tunable), per-account rate limit; usage in Settings › Account (2026-11-04).
- [x] **Sign-up abuse** — server-wide cap on new accounts per hour, logged when hit (2026-11-04).
- [x] **Scale checks** — `scale-check` script; fixed per-account text index, cross-account purge index, missing production indexes, added gzip (2026-11-04).
- [x] **Admin basics** — `scripts/admin.ts`: list, disable/enable, delete, indexes (2026-11-04).
- [x] **Legal pages (B-01 B3)** — Privacy, Terms, App licence live; MIT `LICENSE`; sign-up agreement + age line and
      privacy contact on web and mobile; owner's B0 answers recorded in `docs/LEGAL-DRAFTS.md` (2026-11-04).
- [x] **Link previews on the live site** — `og:image`, `robots.txt`, `sitemap.xml` served by Vercel (2026-11-04).
- [x] **Search terms in request logs** — query strings (URL and `Referer`) dropped from logs (2026-11-04).
- [x] **Registration mode** — `render.yaml` sets `REGISTRATION_MODE=open`; `GET /auth/config` tells clients (2026-11-04).
- [x] **Onboarding state** — `users.onboarding` + `PUT /account/onboarding` (2026-11-04).
- [x] **Account deletion** — `POST /account/delete`, password-confirmed (2026-11-04).
- [x] **B-01 B5 leftovers** — design pass finished, JetBrains Mono loaded, layout shift measured (2026-11-04).
- [x] **Playwright on the laptop** — Chromium installed; full e2e suite green locally (2026-11-04).
- [x] **Bundled fonts (Flutter)** — Inter, JetBrains Mono and the 庭 slice bundled with OFL texts (2026-11-04).
- [x] **MA9 not committed** — committed as `7a39bc9` and pushed with `738aeb6` (2026-11-04).
- [x] **Flutter CI first run** — passed on push of `05ed969` (2026-11-04): analyze, format, codegen freshness, tests and debug APK. LOGS 2026-11-04.
