# NIWA — Plan B-03 (Make it yours: layout, backgrounds, icons, profile; Google later)

**Role of this file:** milestone tracker for the next round of **personalisation** in the web app (`web_app/`)
plus the backend/contract fields it needs: a new default layout in the style of the owner's other sites,
layout and background choices, custom item icons, a profile page, and (later) Google integration.
**Plan version:** B-03
**Created:** 2026-11-06
**Built by:** NIWA is designed and developed solo by **Moeko Works** — <https://moekoworks.vercel.app/>
**Status:** plan only — nothing built yet (owner, 2026-11-06: "plan first, no coding yet").
**Previous plans:** `NIWA-PLAN-B-02.md` (UI refinement, pastel themes, fonts, playground) and
`NIWA-PLAN-B-01.md` B8–B15 (holidays, Today, Garden, command box, calmer item page).
**Rules that still apply:** pure MUI (`PROJECT-SPECS.md` §11.7); colours only from `@niwa/tokens`; light and dark
both first-class; WCAG 2.1 AA; reduced motion respected; the B-01 truth rule for public copy; contract first for
any API change; mobile (`flutter_app/`) keeps working (new fields are optional for it).

---

## Owner request (2026-11-06)

1. **Icon customisation** — choose an item's icon (e.g. a folder, or "work").
2. **Google integration** — soon.
3. **Background customisation** — patterns, like the Kotoha fan site.
4. **Layout customisation** — with a default; **update the current app so the default looks like the Kotoha fan
   site / Moeko Works dashboard**.
5. **Profile page** — e.g. a profile picture.

---

## The reference look (studied 2026-11-06)

Read from the owner's repositories `PastelSalt/kotoha-fansite` (admin panel, `public/css/admin.css`, v2 tokens)
and `PastelSalt/moekoworks_official` (admin dashboard, `src/app/admin/admin.css`, `src/theme/tokens.css`). Both
dashboards share one recipe, which this plan calls **Scrapbook**:

| Element | Kotoha admin | Moeko Works admin | NIWA Scrapbook (proposed) |
|---|---|---|---|
| Page | brand pink with a white dot grid (26 px) | pink with dots + two soft colour washes in the corners | theme's page colour + dot pattern (B-03 C2 default) + soft washes |
| Sidebar | floating rounded card, grouped links | floating paper panel inset 14 px from the edges, groups with small flower labels, dashed dividers | the rail becomes a floating **labelled sidebar card** (groups: Today/Garden/Calendar/Inbox · Spaces · Settings) |
| Current nav item | — | pastel fill, 2 px dark outline, offset "sticker" shadow | same, in the theme's container colour |
| Top bar | sticky, brand + user badge | sticky, brand + user badge (avatar) + actions | sticky top bar with brand, command box, Capture and the **profile avatar** (C4) |
| Cards | "paper" (#fffaf2), radius 20–28, tinted soft shadows, white hairline | same, radius 22–28 | `Paper` surfaces with tinted shadows (elevation tokens per theme) |
| Titles | green "sticker" titles | tilted sticker titles (−2°), outlined, offset shadow | section titles as **stickers** (Today's sections, Settings); never tilted on data rows |
| Featured | stitched dashed inset border | stitched dashed inset border | Getting started, empty states, drop zones get the **stitch** |
| Buttons | pill buttons, primary with sticker shadow | pill, pastel fill + dark outline + offset shadow | primary buttons get the sticker outline + shadow; others stay quiet |
| Motion | calm admin, no tape/tilt on data | one tempo, pop easing | V1 motion tokens + a "pop" easing for stickers; all off under reduced motion |

**Not copied:** the fan site's artwork backdrops, character art and logos (they're Kotoha's / third-party
artwork — not ours to reuse), the 3-second loader, scroll-gliding sections and confetti. NIWA is a daily tool:
the look comes along, the showpiece motion doesn't.

---

## Decisions (proposed — confirm in C0)

| Question | Proposal | Why |
|---|---|---|
| What "layout" means | Three independent choices: **theme** (colours, B-02), **background** (pattern/image, C2) and **layout** (shell shape, surfaces, density, C1/C5) | Lets any theme work with any layout; keeps each picker simple |
| New default | **Scrapbook** layout + **dots** background + Garden + Fredoka | Matches the owner's sites; Garden's sage-and-blossom already fits the pink/green scrapbook palette |
| Other layouts | **Classic** (today's B-02 shell: slim rail, flat surfaces) and **Compact** (Classic with tighter rows, for big trees) | Existing users can keep what they know |
| Existing accounts | Get Scrapbook too (it's the new default), with a one-time "New look — keep it or switch back to Classic" card on Today | The owner wants the default to change; one tap undoes it |
| Item icons | A curated set of ~60 icons from `@mui/icons-material` (folder, work, school, home, heart, star, book, code, music, travel, money, health, garden…) + a colour from the theme's palette roles; no emoji, no uploads | Pure-MUI rule, consistent look, contrast-tested colours, small bundle (icons are per-import) |
| Backgrounds | Built-in CSS/SVG patterns drawn in the theme's colours (no image files) + one optional **uploaded image** per account | Patterns follow light/dark and every theme automatically; an image is the "make it mine" escape hatch |
| Profile picture | Upload (Cloudinary, cropped square, 512 px) **or** initials on a colour **or** one of a few NIWA-made garden avatars (flower, clover, leaf…) | Not everyone wants a photo; uploads reuse the existing signed-upload flow |
| Google | Phase **C6, later**: start with **Google sign-in**, then **read-only Google Calendar import**; no Drive/Gmail | Smallest useful step; Calendar write and Drive need Google's app verification and much more privacy work |
| Mobile | Reads the new optional fields later (A-02); shows default icons/avatars until then | Out of scope here |

---

## Overview

| # | Milestone | Status | Depends on |
|---|---|---|---|
| C0 | Owner check: reference look, decisions, mock-ups | ⬜ | — |
| C1 | **Scrapbook layout** (the new default shell and surfaces) | ⬜ | C0 |
| C2 | **Backgrounds**: patterns + uploaded image | ⬜ | C1 |
| C3 | **Item icons**: pick an icon and colour for any item | ⬜ | C0 |
| C4 | **Profile page** and profile picture | ⬜ | C0 |
| C5 | **Layout customisation** UI (Scrapbook · Classic · Compact + options) and the landing playground | ⬜ | C1, C2 |
| C6 | **Google integration** (later): sign-in, then Calendar import | ⬜ | owner go-ahead; C4 |
| C7 | Quality: accessibility, performance, docs, legal pages | ⬜ | C1–C5 |

**Exit criteria (C0–C5, C7):** a new account opens to the Scrapbook look by default; any user can switch layout,
background, item icons and profile picture in Settings or on the item/profile page, and the choice follows the
account; every combination of theme × mode × layout × background passes the visual audit and axe; no new
literal colours outside `@niwa/tokens`.

---

## C0 — Owner check

- [ ] Confirm the reference table above: what to take from the two sites and what to leave out.
- [ ] Confirm the decisions (default for existing accounts, icon set, background list, avatar options, Google
      scope).
- [ ] Review mock-ups before building: Today, Garden, an item page and Settings in **Scrapbook** (light + dark,
      desktop + phone), made from the real components (an Artifact or the visual-audit screenshots).

---

## C1 — Scrapbook layout (new default)

**Goal:** the app reads like the owner's dashboards, while staying calm enough for daily use.

### C1.P1 — Tokens
- [x] `@niwa/tokens`: a `layouts` record (`scrapbook`, `classic`, `compact`) describing shape, not colour:
      surface radius (card/panel), surface style (`paper` with tinted shadow vs `flat` with hairline), sidebar
      kind (`floating` labelled card vs `rail`), title style (`sticker` vs `plain`), density (row height, gaps),
      button style (`sticker` vs `plain`).
- [x] Per-theme **tinted shadows** (paper, lift, sticker) and an **outline** ink colour, light and dark, so the
      sticker look works in all five themes; contrast tests for the outline (3:1) and sticker fills.
- [ ] A "pop" easing next to the V1 motion tokens; off with reduced motion.

### C1.P2 — Shell
- [x] Floating **labelled sidebar** (≥ 1280 px; icons-only floating rail 720–1280 px; bottom nav on phones):
      Today, Garden, Calendar, Inbox; a "Spaces" group listing top-level folders with their icons (C3); Settings
      and the profile avatar at the foot. Current item = sticker pill.
- [x] Sticky top bar on paper: brand, command box, Capture, profile avatar menu (C4).
- [x] Page background from C2 (default dots) behind everything; the tree pane and the Details panel become
      floating paper cards in Scrapbook.
- [x] `theme.niwa.layout` drives all of the above; Classic reproduces today's shell exactly (no regressions).

### C1.P3 — Surfaces and content
- [x] One `Surface` component (paper or flat) used by cards, panels, lists, dialogs.
- [x] `StickerTitle` for section headings (Today's sections, Settings sections, Calendar title), tilted −2°
      only in Scrapbook and never on lists or data.
- [x] `stitch` style for featured cards (Getting started, empty states, upload drop zones, the B-01 "new look"
      card).
- [x] Primary buttons: pastel fill + outline + sticker shadow in Scrapbook; plain in Classic.
- [ ] Today and Garden get a dashboard-style grid on wide screens (two columns: calendar + Next up; Inbox,
      review and spaces as small cards), single column on phones.

> **Done 2026-11-06 (C1.P1–P3):** `layouts`/`densities`/`patterns`/`pageTint` tokens (page tint AA-tested);
> `theme.niwa.layout` + `palette.surface`; `Surface.tsx` helpers (floating card, list surface, stitch, sticker,
> sticker title) rather than one component; floating `Sidebar` with a Spaces group (labels ≥ 1280 px, icons
> below; phones keep the bottom nav); floating top bar, tree, main and Details. **Not yet:** the "pop" easing,
> outline/sticker contrast tests, the two-column Today/Garden grid, the avatar (C4).

### C1.P4 — Rollout
- [x] New accounts: Scrapbook. Existing accounts: Scrapbook with the one-time "New look" card on Today
      (Keep it · Switch back to Classic), saved on the account.
- [x] Landing page and public pages follow the new default look (hero, cards, buttons); screenshots retaken.

**Exit criteria:** Scrapbook and Classic both clean in the visual audit (all screens, four widths, light/dark,
five themes); e2e green; owner sign-off on the look.

---

## C2 — Backgrounds

### C2.P1 — Patterns (built in)
- [x] Patterns drawn with CSS gradients / tiny inline SVG, coloured from the theme (so they recolour with the
      theme and with dark mode): **None · Dots** (default) **· Gingham · Grid paper · Lined paper · Stripes ·
      Clover · Flowers · Paper grain**.
- [x] Each pattern has a strength (Soft · Normal) and stays behind paper surfaces, so text contrast never
      depends on it; checked by the audit at both strengths in every theme × mode.
- [x] Optional corner **washes** (soft colour blobs like the Moeko Works dashboard), on by default in Scrapbook.

> **Done 2026-11-06 (C2.P1, C2.P3 without image):** `PageBackground` draws all nine patterns from the theme
> (white ink in light, text ink at 7 % in dark), Soft/Normal, corner washes; fixed layer behind the shell.
> The contract has `pattern`, `strength`, `washes` (no `kind`/`image` yet — added with C2.P2).

### C2.P2 — Your own image
- [ ] Upload one background image (Cloudinary, signed upload like note images; WebP; max 4 MB; resized to
      2560 px), with **fit** (cover / tile), **dim** (0–60 % paper overlay) and **blur** options so the app stays
      readable; light and dark can use different dims.
- [ ] Remove/replace; counted against the image quota; deleted with the account (Privacy Policy update, C7).

### C2.P3 — Saving
- [x] Contract: `preferences.background { kind: 'pattern' | 'image' | 'none', pattern, strength, washes,
      image: { attachmentId, fit, dimLight, dimDark, blur } | null }` → OpenAPI → backend → api-client.
- [x] Settings › Appearance › Background: pattern swatches (live preview), upload, options; instant apply.

**Exit criteria:** every pattern and an uploaded image readable in all themes and modes; nothing scrolls jankily
(background fixed, no repaint storms); uploads respect quotas.

---

## C3 — Item icons

- [ ] Contract: optional `Item.icon { name: IconName, color: IconColor } | null` (enum of the curated set;
      colours are palette roles like `primary`, `secondary`, `info`, `success`, `warning`, `error`,
      `itemType.*`), included in `ItemSummary`; `PATCH /items/{id}` accepts it; unknown names fall back to the
      type icon on old clients.
- [ ] Backend: model field, validation, export/backup/restore include it; tests.
- [ ] Web: `ItemIcon` (custom icon or the type default) everywhere icons show today: tree, rows, item title,
      command box, breadcrumbs, Spaces in the sidebar, Calendar blocks' tooltip.
- [ ] Icon picker: from the item's **Turn into…** button and the tree's "⋯" menu — a searchable grid (~60
      icons in groups: Places, Work & study, Life, Hobbies, Symbols) + colour swatches + "Use default".
- [ ] Root folders: My garden and the classic four keep their current icons as **defaults** (now changeable).
- [ ] Contrast: icon colours ≥ 3:1 on surfaces in every theme (test).

**Exit criteria:** any item can carry a chosen icon/colour shown everywhere, on every device signed in.

---

## C4 — Profile page

- [ ] Contract: `PublicUser.profile { displayName, avatar: { kind: 'upload' | 'initials' | 'preset', url?,
      preset?, color? } }`; `PUT /account/profile`; avatar upload via a signed Cloudinary upload scoped to
      `avatars/` (square crop, 512 px, WebP); old avatar deleted when replaced.
- [ ] `/profile` page (also from the avatar menu): profile picture (upload with a crop/zoom dialog built from MUI
      pieces, or initials + colour, or a preset garden avatar), display name, member since, and a few quiet
      garden stats (pages, tasks done this week, days with something captured). Links to Appearance and
      Account settings.
- [ ] The avatar shows in the top bar, sidebar foot, Today's greeting ("Good morning, Moeko") and the account
      menu; initials fallback everywhere.
- [ ] Privacy: display name and picture are only visible to the user (NIWA has no sharing); Privacy Policy and
      data export updated; deleted with the account.

**Exit criteria:** a user can set a picture and name, see them across the app and other devices, and remove
them.

---

## C5 — Layout customisation

- [x] Contract: `preferences.layout { preset: 'scrapbook' | 'classic' | 'compact', density?: 'comfortable' |
      'cozy' | 'compact', sidebar?: 'labels' | 'icons', stickers?: boolean }` (presets set the defaults; options
      override); unknown values fall back to Scrapbook.
- [x] Settings › Appearance › Layout: three preset cards with live mini-previews (like the theme swatches), then
      the options; **Reset to default** returns to Scrapbook + Dots + Garden + Fredoka.
- [x] The landing playground's "Make it yours" panel gains Layout and Background (preview only).
> **Done 2026-11-06:** presets + density/sidebar/stickers options; a preset change clears the overrides; the
> "New look" card (accounts created before 2026-11-06 with `layout.chosen = false`). Visual audit gained
> `--layout` and `--pattern` flags.

- [ ] Today's widgets: show/hide and order (calendar, Next up, Inbox, review, spaces) — saved with the layout.

**Exit criteria:** every preset × option combination works at the four widths; switching is instant and follows
the account.

---

## C6 — Google integration (later — design only until the owner says go)

**Order:** sign-in first, then Calendar read-only import; nothing else in this plan.

- [ ] **Owner decisions first:** which Google features, Google Cloud project and OAuth consent screen (brand,
      privacy URL, support email), whether to go through Google's verification (needed for the Calendar scope
      for public users), and costs/limits.
- [ ] **C6.P1 Sign in with Google:** OAuth 2.0 / OpenID Connect (authorization code + PKCE) on the backend;
      link to an existing account by verified email or create one (respecting `registrationOpen`); unlink;
      password stays optional. Contract + OpenAPI first; tokens never reach the browser.
- [ ] **C6.P2 Google Calendar (read-only):** pick calendars to show; events imported into the Calendar as a
      separate read-only layer (like holidays: not editable in NIWA), refreshed on view and every few hours;
      refresh tokens encrypted at rest with the same AES-GCM key handling as AI keys; disconnect deletes them.
- [ ] Privacy Policy, Terms and the Licences page updated before release (Google API Services User Data Policy:
      limited use, disclosure).
- [ ] Later candidates (not planned): two-way Calendar sync, Google Tasks import, Drive attachments.

---

## C7 — Quality

- [x] Visual audit gains `--layout` and `--pattern` flags; run all screens × four widths × light/dark for
      every layout, every pattern (one theme) and every theme (default pattern).
- [ ] Axe audit for the Scrapbook shell, icon picker, profile page, crop dialog and background settings.
- [ ] Performance: patterns cost no network requests; an uploaded background is lazy and sized per screen;
      bundle growth reported in `LOGS.md` (icon picker and crop dialog lazy-loaded).
- [ ] Docs: `docs/DATA_MODEL.md` (icon, profile, background, layout), Privacy Policy, `CODEMAP.md`, `GAPS.md`.
- [ ] Mobile (A-02) note: read `icon`, `profile`, `preferences.layout/background` later.

---

## Open questions for owner

1. Should existing accounts be switched to Scrapbook (with a one-tap "switch back"), or keep Classic until they
   choose?
2. Any patterns from the fan site you especially want (gingham, clover, lined paper…) or ones to leave out?
3. Profile picture: are preset garden avatars wanted, or upload + initials only?
4. Google: sign-in first, then Calendar import — is that the right order, and are you willing to go through
   Google's app verification for the Calendar scope?
5. Should the "Spaces" group in the sidebar list every top-level folder, or only ones you pin?
