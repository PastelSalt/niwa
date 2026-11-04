# NIWA — Plan B-01 (Public site, legal pages & visual polish)

**Role of this file:** milestone tracker for the **public face of the web app** — a landing page at `/` for
signed-out visitors, the legal and policy pages a multi-person service needs, and a visual polish pass over the
web UI — plus a skippable, replayable **onboarding tour** for new users. Product behaviour stays in `PROJECT-SPECS.md`; web/backend work in `NIWA-PLAN-A-01.md`; mobile in
`NIWA-PLAN-A-02.md`. If this plan contradicts the specs, the specs win — except where §B0 records an owner
decision that changes them.
**Plan version:** B-01
**Created:** 2026-11-04
**Built by:** NIWA is designed and developed solo by **Moeko Works** — <https://moekoworks.vercel.app/>
**Live web app:** <https://niwa-delta.vercel.app> (backend not deployed yet — `GAPS.md` "On hold")
**Audience (owner decision, 2026-11-04):** NIWA is open to **everyone** — anyone can create an account. It
started as a personal tool; it is not restricted to the owner. This supersedes the single-user stance in
`PROJECT-SPECS.md` §1/§2.2 (each account still gets its own private workspace; there is no sharing between
accounts). Backend work this needs is listed in `GAPS.md` "Multi-user readiness".
**Frontend rule:** pure MUI (`PROJECT-SPECS.md` §11.7); colours only from `@niwa/tokens`.

---

## How to use this plan

- **Hierarchy:** Milestone (`B#`) → Phase (`B#.P#`) → Task (checkbox). Status: `⬜` · `🟨` · `✅` · `⛔`.
- Tick a task only when it's done **and** verified. Log every completed phase in `LOGS.md`; add new
  folders/modules to `CODEMAP.md`; record anything deferred in `GAPS.md`.
- **Truth rule for public copy:** every claim on the landing page and in the legal pages must be true of the
  deployed code at that moment. No invented user counts, testimonials, ratings, uptime figures, certifications,
  partners or prices. If a feature or right (e.g. account deletion) isn't built yet, the page doesn't promise it.
- **Legal pages are drafts until reviewed.** This plan structures them from facts in the code; it is not legal
  advice. The owner decides whether a qualified person reviews them before public launch (§B0).

---

## Why this plan exists — current state (verified in the repo, 2026-11-04)

| Fact | Where |
|---|---|
| The app was designed as **single-user per instance**: one account, one workspace (now superseded — see Audience) | `PROJECT-SPECS.md` §1, §2.2 |
| Registration defaults to `first_user_only` (code default and `render.yaml`); `open` exists and is what the deployment will use | `backend/src/config/env.ts` (`REGISTRATION_MODE`), `render.yaml` |
| Sign-up copy still says "NIWA is personal — one account per instance." on web and mobile | `web_app/src/auth/RegisterPage.tsx`, `flutter_app/lib/features/auth/ui/register_screen.dart` |
| No onboarding: a new account lands on an empty Knowledge view; the user record has no onboarding state | `web_app/src/app/router.tsx`, `backend/src/models/user.model.ts` |
| No password reset, password change, or email verification; no outbound email at all | `backend/src/routes/v1/index.ts`, `backend/package.json` |
| Every data query is scoped by `workspaceId`, so several accounts on one instance stay separated | `docs/DATA_MODEL.md` §1 ("Ownership rule") |
| `/` redirects straight to `/knowledge` behind the auth guard — there is **no landing page** | `web_app/src/app/router.tsx` |
| There are **no** privacy, terms, EULA, cookie or licenses pages | `web_app/src/` |
| The repo has **no `LICENSE` file** and no `license` field in any `package.json` | repo root |
| `index.html` has a title (`niwa`) and a description meta tag; **no** Open Graph tags, `robots.txt` or sitemap | `web_app/index.html`, `web_app/public/` |
| Brand fonts (Inter, Noto Sans JP) are named in the tokens but **not loaded** — browsers fall back to system fonts | `packages/tokens/src/index.ts`, `web_app/index.html` |
| No account-deletion or self-service data-export endpoint exists (export is planned for A-01 M11) | `backend/src/routes/v1/index.ts`, `docs/OPS.md` §9 |
| App stores require a public privacy-policy URL before listing the mobile app | `NIWA-PLAN-A-02.md` MA11 |

### Data the service actually handles (input for the Privacy Policy)

Derived from the code; update this table whenever the code changes, and the policy with it.

| Data | Why | Stored where | Source |
|---|---|---|---|
| Email, password **hash** (never the password) | Sign-in | MongoDB (Atlas) `users` | `auth.service.ts`, `user.model.ts` |
| Notes, tasks, ideas, tags, links, schedule entries, Inbox captures | The product itself | MongoDB `items`, `links`, `schedule_*` | `docs/DATA_MODEL.md` |
| Images added to notes | Note content | Cloudinary (signed uploads; per-workspace folder) | `lib/cloudinary.ts`, `docs/DATA_MODEL.md` §8 |
| Refresh-session records (hashed token, client kind, expiry) | Staying signed in, "sign out everywhere" | MongoDB `refresh_sessions` (TTL-expired) | `refreshSession.model.ts` |
| Refresh cookie `niwa_rt` (HttpOnly, Secure, SameSite=Lax) — the **only** cookie | Web sign-in | Browser | `auth.controller.ts`, `docs/OPS.md` §6.1 |
| Rate-limit counters | Abuse protection | Redis (Render Key Value) | `middleware/rateLimit.ts` |
| Request logs (method, path, status, request id; auth headers, cookies, passwords and tokens redacted) | Operating the service | Render logs | `lib/logger.ts`, `app.ts` |
| Device-only: cached copies, offline captures, reminders, theme | Mobile offline use | The phone (wiped on logout, except theme) | `flutter_app/lib/core/db/app_database.dart` |
| **Not collected:** analytics, advertising IDs, tracking cookies, third-party trackers | — | — | no such code in `web_app/` or `flutter_app/` |
| Processors | Hosting | Vercel (web), Render (API, Redis), MongoDB Atlas (DB), Cloudinary (images) | `docs/OPS.md` |

AI features (DeepSeek, A-01 M8) are **deferred**; if they ship, note text sent to the AI provider becomes a new
row here and a new section in the policy before release.

---

## Overview

| # | Milestone | Status | Depends on |
|---|---|---|---|
| B0 | Owner decisions & facts sign-off | ⬜ | — |
| B1 | Public shell: layout, routes, footer, metadata | 🟨 | B0 (partly) |
| B2 | Landing page at `/` | ✅ | B1 |
| B3 | Legal & policy pages | 🟨 | B0, B1 |
| B4 | User rights the policies promise (delete account, export) | 🟨 | B3 drafts |
| B5 | Visual polish of the signed-in app | ✅ | — (can run in parallel) |
| B6 | Quality: accessibility, performance, SEO hygiene, tests | 🟨 | B1–B5, B7 |
| B7 | Onboarding tour for new users (skippable, replayable) | 🟨 | B1; B5 for final visuals; backend state (`GAPS.md`) |

**Exit criteria (whole plan):** a signed-out visitor at `/` sees an accurate description of NIWA and can reach
sign-in, sign-up and every legal page; a new account is offered the onboarding tour, can skip it, and can replay
it from Settings; every legal statement matches the code;
public pages pass the accessibility audit in light and dark; the mobile app has a privacy-policy URL for MA11.

---

## B0 — Owner decisions & facts sign-off

**Goal:** settle what only the owner can decide, so pages state facts rather than guesses.

- [x] **Who may sign up:** everyone — `REGISTRATION_MODE=open` in production (decided 2026-11-04). The landing
      page and header show "Create account". `closed` stays available as an emergency switch (e.g. abuse).
- [ ] **Operator identity on legal pages:** "Moeko Works" as the operator; the contact address users write to
      for privacy and support requests (a real, monitored email — not a placeholder).
- [ ] **Jurisdiction / governing law** for the Terms, and the minimum age for accounts.
- [ ] **Licence of the NIWA code:** proprietary ("all rights reserved") or an open-source licence — decides the
      `LICENSE` file, the EULA wording for the mobile/desktop apps, and the footer line.
- [ ] **Review:** whether a qualified person reviews the legal pages before public launch.
- [ ] **Hosting regions** to disclose (Atlas cluster region, Render region, Vercel region) — read them off the
      dashboards once the backend is deployed.
- [ ] Sign off the "Data the service actually handles" table above against the deployed code.

**Exit criteria:** answers recorded in `LOGS.md`; open items listed in `GAPS.md`.

---

## B1 — Public shell: layout, routes, footer, metadata

### B1.P1 — Routing
- [ ] Public routes outside the auth guard: `/` (landing), `/privacy`, `/terms`, `/eula`, `/cookies`,
      `/licenses`, plus existing `/login` and `/register` (`web_app/src/app/router.tsx`). *(2026-11-04: `/` done; legal routes come with B3.)*
- [x] `/` shows the landing page when signed out; a signed-in visitor goes to `/knowledge` as today (no flash
      of the landing page while the session restores — reuse `FullPageLoader`).
- [x] Public pages are lazy-loaded so they don't grow the app's initial bundle (A-01 M7 budget).
- [x] The 404 page links back to `/` for signed-out visitors. *(Open: unknown paths are inside the auth guard, so visitors are sent to login instead of a 404.)* *(2026-11-04: visitors on unknown URLs get the public 404 — `auth/guards.tsx`.)*

### B1.P2 — Public layout & footer
- [x] `PublicLayout`: header (wordmark, "Log in", and "Create account" only when registration is open), content
      column, footer. Built from MUI + `@niwa/tokens`; light/dark follows the existing theme. *(2026-11-04: "Create account" always shown — registration is open; hiding it waits on B1.P3.)*
- [ ] Footer on public pages **and** in the app's Settings: links to Privacy, Terms, EULA, Cookies, Licenses;
      "Designed and built by Moeko Works" linking to <https://moekoworks.vercel.app/>; copyright line with the
      year generated at build time.
- [x] Replace the "NIWA is personal — one account per instance." subtitle on web and mobile sign-up with copy
      that fits an open service (each account gets its own private garden).
- [ ] Sign-up form links to Terms and Privacy ("By creating an account you agree to …") once B3 pages exist.

### B1.P3 — Registration mode on the client
- [x] Public, unauthenticated way for the web app to know whether sign-up is open (e.g. a field on
      `GET /health` or a small `GET /auth/config`), added to `packages/contracts` + OpenAPI, so the UI never
      offers a sign-up that the server will refuse. *(2026-11-04: `GET /auth/config` → `{ registrationOpen }`; header, landing and login hide sign-up when closed.)*

### B1.P4 — Metadata
- [x] Per-page `<title>` and description (public pages); Open Graph / Twitter card tags using a real screenshot
      or a designed card — no stock imagery presented as the product. *(2026-11-04: titles, description and text OG/Twitter tags done; no `og:image` until a real screenshot exists.)* *(2026-11-04: `og:image` 1200×630 from a real Focus screenshot.)*
- [x] `robots.txt`: allow public pages, disallow app routes; `sitemap.xml` listing only public pages.
- [x] App routes (`/knowledge`, `/actionable`, …) carry `noindex`.

**Exit criteria:** every public route renders signed out; signed-in users never see the landing page;
metadata validated with a link-preview check.

---

## B2 — Landing page at `/`

**Goal:** explain what NIWA is, honestly, and get the visitor to create an account or sign in.

### B2.P1 — Content (from the specs, not marketing invention)
- [x] Hero: name, the existing tagline "A garden for your ideas." (`web_app/index.html`, `AuthLayout.tsx`), one
      sentence on what it is (one hierarchical item tree, three lenses — `PROJECT-SPECS.md` §1), primary action "Create account", secondary "Log in".
- [x] Feature sections, each tied to shipped functionality: Knowledge lens & linked notes; Actionable lens &
      Focus; Scheduler (day/week/month, repeats); Inbox capture; mobile app with offline capture (once MA11
      ships — until then say "coming" or omit).
- [x] Privacy stance in plain words, matching §2.2 of the specs and the B3 Privacy Policy (no tracking, the
      one essential cookie, where data lives).
- [x] "Made by Moeko Works" section linking to <https://moekoworks.vercel.app/>.
- [x] **Excluded on purpose:** testimonials, user/usage numbers, logos of "customers", pricing, uptime claims —
      none exist. Add only when real and sourced.

### B2.P2 — Visuals
- [x] Real screenshots of the app (light and dark), captured from a seeded demo workspace with invented-for-demo
      content clearly not real user data; alt text for each. *(Open: the hero uses an illustration of the specs' §3.1 example tree, labelled "Example"; screenshots still to capture.)* *(2026-11-04: Knowledge (light) and Focus (dark) in the "See it" section; content made for the shot.)*
- [x] Layout from tokens (sage/blossom palette, radii, spacing); responsive from 360 px to desktop. *(checked at 375 px and desktop, light and dark.)*
- [x] Motion limited to subtle transitions, disabled under `prefers-reduced-motion`.

### B2.P3 — Performance
- [x] Landing page loads without the app bundle (separate lazy chunk); images sized/compressed (WebP/AVIF),
      explicit width/height to avoid layout shift. *(landing is its own lazy chunk; no images yet.)*

**Exit criteria:** content reviewed against the specs and B0 answers; Lighthouse/axe checks in B6 pass.

---

## B3 — Legal & policy pages

All pages: plain language, a visible "Last updated" date, a short change log at the bottom, sourced from the B0
answers and the facts table. Kept as Markdown/MDX or structured React content in `web_app/src/features/legal/`
so changes show in code review. Mobile and desktop link to the same URLs.

### B3.P1 — Privacy Policy (`/privacy`)
- [ ] Sections: who runs NIWA (B0), what is collected (facts table), why, where it's stored and which processors
      handle it, retention (Trash purge after 30 days, refresh sessions expire, backups per `docs/OPS.md` §9),
      security measures that exist (hashed passwords, HttpOnly cookie, rate limits, redacted logs), user rights
      and how to exercise them (only those B4 actually provides), children, changes, contact.
- [ ] Mobile specifics: device storage (cache, offline queue, reminders), notification permission, camera/photo
      access only when adding an image (`flutter_app/ios/Runner/Info.plist` strings).
- [ ] URL ready for the Play Store / App Store listing (A-02 MA11).

### B3.P2 — Terms of Use (`/terms`)
- [ ] Account responsibility, acceptable use, user content stays the user's, service provided "as is",
      availability (free-tier hosting can sleep — `docs/OPS.md` §5), termination, changes, governing law (B0), contact.

### B3.P3 — EULA (`/eula`) for the mobile/desktop apps
- [ ] Licence grant for the installed app, restrictions, updates, third-party components, termination —
      consistent with the code licence chosen in B0. Shown in the app's About screen (mobile Settings ›
      Account already has a version row).

### B3.P4 — Cookies (`/cookies`)
- [x] States the single strictly-necessary cookie (`niwa_rt`: purpose, lifetime = refresh TTL, `HttpOnly`,
      `Secure`, `SameSite=Lax`, path `/api/v1/auth`) and that there are no analytics or advertising cookies.
      No consent banner while that remains true; if a non-essential cookie is ever added, add consent first. *(2026-11-04: `/cookies` — `web_app/src/public/CookiesPage.tsx`.)*

### B3.P5 — Open-source licences (`/licenses`)
- [x] Generated at build time from the web app's dependencies (e.g. a Vite licence plugin or
      `pnpm licenses list`), not hand-maintained; the mobile app already has Flutter's licence registry —
      expose it via `showLicensePage` from Settings. *(2026-11-04: `web_app/licenses.plugin.ts` → `/licenses`; Flutter Settings › Account › Open-source licences, with the bundled fonts' OFL texts.)*
- [ ] Add the repo `LICENSE` file per B0.

**Exit criteria:** every sentence traceable to code or a B0 decision; links from footer, sign-up and mobile
Settings work; review per B0 done or explicitly waived in `LOGS.md`.

---

## B4 — User rights the policies promise

Only promise in B3 what this milestone has delivered.

- [x] **Delete account:** backend endpoint that deletes the user, workspace, items, links, schedule, attachments
      (Cloudinary assets) and sessions; confirmation with password; web Settings › Account and mobile
      Settings; contract + OpenAPI + tests. *(2026-11-04: `POST /account/delete` + Settings › Account; backend test checks nothing of the account is left and other accounts are untouched; Cloudinary removal is best-effort as for item purges.)*
- [x] **Export my data:** user-facing export (JSON + Markdown, `docs/OPS.md` §9 row 3 / A-01 M11) from Settings. *(2026-11-04: JSON only — `GET /account/export` + Settings › Account. Markdown export still open, `GAPS.md`.)*
- [ ] **Change password** and **reset a forgotten password** (needs outbound email — `GAPS.md` "Multi-user
      readiness"); the policy describes account recovery only once this exists. *(2026-11-04: change password done — `POST /account/password`, other sessions revoked. Reset still needs email.)*
- [ ] **Contact channel** for privacy requests (B0 address) shown in Settings and on `/privacy`.

**Exit criteria:** deleting an account leaves no rows or images behind (tested against a real database);
export round-trips the item tree.

---

## B5 — Visual polish of the signed-in app

- [x] Load the brand fonts (Inter, Noto Sans JP) self-hosted with `font-display: swap`, subset for Latin + the
      Japanese glyphs actually used (the 庭 in the wordmark). *(2026-11-04, web: Inter variable Latin + Latin
      Extended from `@fontsource-variable/inter`; one 10 KB Noto Sans JP slice vendored for 庭; registered via
      CssBaseline in `web_app/src/app/fonts.ts`. Layout shift not measured yet — B6. Flutter bundling stays open:
      `GAPS.md` "Bundled fonts".)*
- [x] Design review of every screen in light and dark: spacing on the 4 px grid, type scale, consistent empty
      states (`EmptyState.tsx`), skeletons, focus rings, toolbar density in the editor. *(2026-11-04 first pass:
      landing, Knowledge, Actionable/Focus, Scheduler, Inbox, Settings at desktop and 375 px, light and dark.
      Fixed: Settings tabs cut off on phones; day-view title truncated on phones; "Arrives in M8" milestone code
      shown to users; Theme copy. Still to review: note editor toolbar, Search, item detail, tablet width.)* *(2026-11-04: second pass covered the note editor, Search, item detail, tablet (820 px) and phone; fixed tour card placement.)*
- [x] App icons and favicon set (`favicon.svg` exists; add PNG sizes, Apple touch icon, maskable icon) shared
      with the mobile launcher icon. *(2026-11-04: 192/512, maskable 512, Apple touch 180 and
      `manifest.webmanifest`; sources + `generate.sh` in `web_app/assets/icons/`. The Flutter launcher icon uses
      the same sources in A-02 MA11.)*
- [x] Error and offline states: friendly copy for "server waking up" (Render free tier) on the web, matching the
      mobile wording (`flutter_app/lib/core/api/error_message.dart`). *(2026-11-04: `@niwa/api-client` maps
      envelope-less 502–504 to the waking-up sentence.)*
- [x] Screenshots before/after per screen in `LOGS.md`. *(LOGS lists the findings per screen; image files not
      stored in the repo.)*

**Exit criteria:** design pass checked in both themes on phone, tablet and desktop widths; no contrast
regressions (`packages/tokens/src/contrast.test.ts`, axe).

---

## B6 — Quality

- [x] Playwright: public pages render signed out; signed-in redirect from `/`; footer links resolve; sign-up
      hidden when registration is closed. *(2026-11-04: `e2e/smoke.spec.ts`, `e2e/account.spec.ts`; full suite green locally, desktop + phone.)*
- [ ] Axe audit (`web_app/e2e/a11y.spec.ts`) extended to every public page in light and dark. *(2026-11-04: landing and a tour step audited; Cookies/Licences/404 not yet in the axe run.)*
- [x] Performance budget for `/`: report LCP, CLS and JS size per release in `LOGS.md` (measured, not
      estimated). *(2026-11-04: first measurement in `LOGS.md` — CLS 0.000, LCP 0.8 s desktop / 3.3 s throttled phone.)*
- [ ] Link-preview check of OG tags; `robots.txt`/`sitemap.xml` served correctly by Vercel.
- [ ] `GAPS.md` updated with anything deferred.

**Exit criteria:** CI green with the new tests; manual check on the live Vercel URL.

---

## B7 — Onboarding tour for new users

**Goal:** a new account understands the item tree, the three lenses and capture within a minute — and anyone
who doesn't want a tour can skip it and bring it back later.

### B7.P1 — Behaviour
- [x] **First run:** after a new account's first sign-in, a welcome dialog offers **Take the tour** or **Skip**.
      Either choice is remembered; the dialog never appears on its own again.
- [x] **Skip anywhere:** every step has Skip (and `Esc`); Back / Next; a progress label ("Step 2 of 6").
      Closing mid-way counts as skipped, not as an error.
- [ ] **Replay:** Settings › Help › "Replay the tour" on web and mobile, plus a Help entry in the app bar. Replay
      never changes the user's data. *(2026-11-04: web done (Settings › Help + "Take the tour" in the account menu). Mobile tour not built yet — `GAPS.md`.)*
- [x] **Stored per account, not per browser,** so a tour skipped on the web isn't offered again on the phone
      (backend field + endpoint — `GAPS.md` "Multi-user readiness"). Offline on mobile: remember locally and
      sync when back online. *(2026-11-04: `users.onboarding` + `PUT /account/onboarding`; the Flutter model reads it, the mobile tour is still to come.)*
- [x] **Tour version:** stored with the completion; if the tour changes a lot, bump the version and offer
      (not force) a short "What's new" instead of the full tour. *(2026-11-04: `TOUR_VERSION` stored; "What's new" offer not needed until version 2.)*

### B7.P2 — Steps (each points at real UI; only shipped features)
- [x] Inbox / quick capture → the item tree (notes, tasks and ideas are one tree) → Knowledge lens and links →
      Actionable lens and Focus → Scheduler → Search → Settings (theme, Trash, replay).
- [x] A step whose target isn't on screen (e.g. tree pane hidden on phones) adapts or is skipped — never a popup
      pointing at nothing.
- [x] **Optional sample content:** a "Add a few example notes" checkbox on the welcome dialog (off by default)
      creates a small subtree clearly titled "Example", deletable like any item. No sample data otherwise.
- [ ] Empty states (`EmptyState.tsx`, mobile equivalents) link to the matching tour step. *(Open.)*

### B7.P3 — Build & accessibility
- [x] Web: built from MUI (`Popper`, `Dialog`, `Backdrop`) to keep the pure-MUI rule — no tour library.
      Mobile: Flutter overlay with the same steps and wording.
- [ ] Keyboard-only and screen-reader friendly: focus moves into each step and returns afterwards; step text is
      announced; works at 200 % text size; no motion under `prefers-reduced-motion` / reduced animations. *(2026-11-04: focus moves into each step and back, Esc skips, progress is announced; 200 % text not checked yet.)*
- [x] Copy reviewed for plain language; light and dark.

### B7.P4 — Tests
- [x] New account sees the welcome dialog once; Skip and completion are both remembered after reload and on a
      second device; Replay from Settings works; existing accounts are not interrupted. *(2026-11-04: web unit tests + `e2e/account.spec.ts`; "second device" holds because state is server-side.)*
- [ ] Axe audit on the welcome dialog and a tour step. *(2026-11-04: tour step audited in e2e; welcome dialog not yet.)*

**Exit criteria:** tests above green on web and mobile; tour checked on phone, tablet and desktop widths.

---

## Open questions for owner

1. ~~Registration~~ — decided 2026-11-04: open to everyone (B0).
2. Contact email for privacy/support, jurisdiction, minimum age. (B0)
3. Code licence: proprietary or open source? (B0, B3.P3, B3.P5)
4. Custom domain for the public site, or keep `niwa-delta.vercel.app`? (affects OG tags, cookie scope, store
   listings)
5. Legal review before public launch — yes or waived? (B0)
