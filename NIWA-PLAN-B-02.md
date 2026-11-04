# NIWA — Plan B-02 (Web UI/UX refinement)

**Role of this file:** milestone tracker for refining the **look and feel of the web app** (`web_app/`) — the
signed-in screens first, then the public pages so they match, plus personalisation and an interactive landing page. No new product features; mobile (`flutter_app/`)
is out of scope until the owner says otherwise.
**Plan version:** B-02
**Created:** 2026-11-04
**Built by:** NIWA is designed and developed solo by **Moeko Works** — <https://moekoworks.vercel.app/>
**Live web app:** <https://niwa-delta.vercel.app>
**Rules that still apply:** pure MUI (`PROJECT-SPECS.md` §11.7); colours only from `@niwa/tokens`; light and
dark both first-class; WCAG 2.1 AA; the "truth rule" of `NIWA-PLAN-B-01.md` for any public copy.
**Previous plans:** `NIWA-PLAN-B-01.md` (public site, legal, multi-user — done apart from small leftovers).
**Personalisation (owner, 2026-11-04):** signed-in users can pick a **colour theme** and a **font**. The default
everywhere — app **and** public pages — is the font **Fredoka** with a **pastel** colour theme (the owner's
choice); every alternative theme is pastel too. Visitors can try themes and fonts on an interactive landing page
(V11). See V10; the theme and font plumbing is built into V1 so nothing has to be redone.

---

## How to use this plan

- **Hierarchy:** Milestone (`V#`) → Phase (`V#.P#`) → Task (checkbox). Status: `⬜` · `🟨` · `✅` · `⛔`.
- Tick a task only when it's done **and** verified in both themes at the four audit widths (1440, 820, 390 px and
  the 360 px minimum). Log each finished phase in `LOGS.md` with before/after screenshots described.
- **One component per pattern:** when a task says "unify", the result is one shared component used everywhere,
  not the same styles copied.
- Visual changes must not change behaviour; the existing unit and e2e tests stay green.

---

## Why this plan exists — audit (2026-11-04)

A seeded account (two projects, notes with headings and lists, tasks across all statuses and priorities, events,
a weekly repeat, Inbox captures, tags) was screenshot on every screen at 1440 × 900, 820 × 1180 and 390 × 844, in
light and dark, plus the empty states and main dialogs (71 screenshots). What was found:

### Broken on phones (390 px)
| Finding | Screen |
|---|---|
| Priority and due-date chips **overlap** the item's text and path | Focus |
| Month cells show **only times**, no titles, and two entries collide on one line | Scheduler › Month |
| File / Delete buttons squeeze titles to "Buy p…", "Idea: …"; "2 min ago" wraps | Inbox |
| Item titles render at full desktop size — "CS 301 — Computer Networks" takes four lines | Item page |

### Desktop (1440 px)
| Finding | Screen |
|---|---|
| Content columns hug the left with a wide empty right side; widths differ per screen (≈ 420, 640, 860, 900 px) | Focus, Inbox, Search, Settings |
| The screen name appears three times: top bar title, tree header ("KNOWLEDGE") and the rail | Every lens |
| The four root containers (Knowledge, Projects, College, Personal) use the same icon as a note | Tree |
| Tree titles truncate early ("CS 301 — Comput…") in a 300 px pane; rows are small and dense | Tree |
| The same task shows up in up to three Focus sections (In progress, High priority, Upcoming) | Focus |
| Tasks are a **circle** in the tree and Inside list, a **square checkbox** in Focus | Focus vs tree |
| A grey block replaces the note body for 1–2 s on first open while the editor chunk loads | Note |
| The "Note"/"Project" chip under the title repeats the Type field in Details | Item page |
| Breadcrumb repeats the page title ("… / Week 3: TCP congestion control") | Item page |
| Native date inputs ("mm/dd/yyyy") look different from every other field; timestamps read "Created 11/4/2026, 9:39:55 PM · Updated …" | Details panel |
| Events are heavy solid blocks in the light theme; events without a picked colour all fall back to the same primary green; text is cut off in short blocks | Scheduler › Week/Day |
| The "7 AM" label is clipped under the all-day row | Scheduler › Week |
| Event dialog is titled just "New" | Scheduler |
| Knowledge home is a mostly empty page: a review banner and an empty state, nothing recent | Knowledge |
| Empty Scheduler has no hint at all; other empty states do | Scheduler (new account) |

### Tablet (820 px)
| Finding | Screen |
|---|---|
| Knowledge home is the tree alone, stretched across the full width | Knowledge |
| Week events cut text after a few characters ("10:00 AM – 11:…") | Scheduler › Week |

### In the code
| Finding | Where |
|---|---|
| Base font size 14 px; body text uses `body2` (≈ 12 px) in most lists — small for reading | `packages/tokens` `typography.baseSize`, 48 × `body2` |
| No type scale or content-width tokens; 22 literal `fontSize` values and assorted `maxWidth` literals | `web_app/src` |
| No motion or elevation tokens; transitions defined ad hoc | `web_app/src` |
| Item rows are built separately in Focus, Inbox, Inside list, Search and Trash | `features/*` |

What works and should be kept: the palette and both themes, the token pipeline, the editor's reading layout once
loaded, the search highlighting, the capture dialog, dark-mode event colours, keyboard shortcuts.

---

## Decisions (owner delegated to the assistant, 2026-11-04)

| Question | Decision | Why |
|---|---|---|
| Base text size | **15 px** body text (tuned per font in V10 — Fredoka is rounded and wide, so its line height is set separately) | 14 px with `body2` lists reads at ≈ 12 px; 15 px stays dense enough for a tree app |
| Wide screens | **Centre** list screens (Focus, Inbox, Search, Settings, Trash) in the space beside the tree, at the `list` width | Removes the empty right half without stretching lines too long |
| Focus duplicates | **Show each task once**, in its most urgent section (Overdue › In progress › High priority › Upcoming › Recently updated); other facts become chips | Same task three times makes the list look longer than it is |
| Tree pane | **Fixed width**, wider on large screens (280 px → 320 px from 1440 px) | Simpler; drag-to-resize can come later if needed |
| Order | **V0 → V1 → V10 plumbing check → phone bugs (V3 rows, V5 month, V7 phone) → the rest → V10 UI → V11 landing** | Foundations first so fixes use the new tokens, but the visible phone bugs follow right after |

---

## Overview

| # | Milestone | Status | Depends on |
|---|---|---|---|
| V0 | Baseline & guardrails (visual audit script, overflow checks) | ✅ | — |
| V1 | Design foundations: type scale, widths, spacing, motion, elevation tokens | ✅ | V0 |
| V2 | App shell & tree | ✅ | V1 |
| V3 | Item rows, chips & lists (Focus, Inbox, Inside, Search, Trash) | ✅ | V1 |
| V4 | Item page, editor & details panel | ✅ | V1, V3 |
| V5 | Scheduler | ✅ | V1 |
| V6 | States & feedback (loading, empty, errors, toasts, focus) | ✅ | V1 |
| V7 | Responsive pass (phone, tablet, wide desktop) | 🟨 | V2–V6 |
| V8 | Public & auth pages brought in line | ✅ | V1 |
| V9 | Quality: accessibility, performance, regression | 🟨 | V2–V8, V10 |
| V10 | Personalisation: pastel colour themes + font picker (default Garden + Fredoka) | 🟨 | V1 (plumbing), V9 checks |
| V11 | Interactive landing page: playground + customisation preview | 🟨 | V3–V5 components, V10 themes/fonts |

**Status (2026-11-04):** V0–V11 built on branch `claude/laughing-ride-f01job`. Open: the owner's approval of
the pastel theme values (V10.P2), a manual pass on a real phone, landscape/200 % zoom, axe runs in CI (welcome
dialog, 404, every dialog, each theme, landing with the playground), and the phone LCP re-measure — see
`GAPS.md` and the `LOGS.md` entries of this date.

**Exit criteria (whole plan):** every finding in the audit tables is fixed or explicitly declined in `LOGS.md`;
users can personalise theme and font; visitors can try NIWA on the landing page;
no overlapping or clipped text at 360, 390, 820 or 1440 px (checked by V0's script); axe clean in light and dark;
no literal font sizes or content widths outside the theme; existing tests green.

---

## V0 — Baseline & guardrails

**Goal:** make visual quality measurable before changing anything.

- [x] `web_app/scripts/visual-audit.mjs`: seeds the in-memory API with the audit content above and screenshots
      every screen + dialogs + empty states at 1440 / 820 / 390 / 360 px in both themes into a git-ignored folder.
- [x] Overflow check in the same run: flags elements whose text overflows or overlaps a sibling (bounding-box
      test) and prints the screen, width and selector. Today's run must reproduce the phone findings.
- [x] Commit the "before" screenshot set's findings to `LOGS.md` (images stay local).

**Exit criteria:** one command reproduces the audit; the overlap check fails on today's Focus/Inbox phone bugs.

---

## V1 — Design foundations

**Goal:** a small, named vocabulary in `@niwa/tokens` and the MUI theme, so screens stop inventing sizes.

### V1.P1 — Typography
- [x] Type scale tokens (display, title, heading, body, small, caption) with sizes, weights and line heights;
      body text **15 px** (decided above), small text ≥ 12 px. Sizes and line heights are per font family, so a
      different font (V10) can adjust them without touching screens.
- [x] Map MUI variants to the scale; replace the 22 literal `fontSize` values with variants or tokens.
- [x] Item titles use a responsive size (`clamp`) so long titles don't take four lines on phones.

### V1.P2 — Layout & spacing
- [x] Content-width tokens: `reading` (~ 70 characters, notes), `list` (Focus, Inbox, Search, Trash),
      `form` (Settings), `wide` (Scheduler). Replace the ad-hoc `maxWidth` literals.
- [x] Centre list screens in the space beside the tree (decided above) and apply it everywhere.
- [x] Spacing: keep the 4 px grid; name the common gaps (row, section, page) instead of repeating numbers.

### V1.P3 — Surfaces, motion, icons
- [x] Elevation/border tokens for cards, panels, popovers and dialogs (light and dark).
- [x] Motion tokens (short, medium) used by hovers, panels and dialogs; everything off under
      `prefers-reduced-motion`.
- [x] Icon sizes (inline, row, empty-state) as tokens.
- [x] Semantic colour roles for status and priority (not started, in progress, blocked, done; none → critical)
      from the existing palette, checked by `contrast.test.ts` in both themes.

### V1.P4 — Theme plumbing for personalisation (no UI yet)
- [x] The MUI theme is built from a **theme id + font id + colour mode** at runtime, instead of one fixed theme;
      the defaults are theme `garden` (pastel, V10) + font `fredoka`. Every screen reads colours and fonts only
      from the theme.
- [x] Fonts register lazily: only the selected family's files are fetched (same CssBaseline approach as
      `web_app/src/app/fonts.ts`, so the pure-MUI rule holds).
- [x] Public pages (landing, auth, policies) use the defaults (`garden` + `fredoka`), whatever a signed-in user
      picked — except inside the landing playground (V11), which previews other choices in its own sandbox.

**Exit criteria:** theme exposes the scale and widths; a grep finds no literal font sizes or content widths in
`web_app/src` (exceptions listed in code with a reason); switching the theme id in code recolours every screen.

---

## V2 — App shell & tree

- [x] One place names the current screen (top bar **or** tree header, not both); the rail keeps its label.
- [x] Root containers (Knowledge, Projects, College, Personal) get their own icon and slightly stronger weight,
      so they read as spaces, not notes.
- [x] Tree rows: larger hit area and text, indentation guides, clearer hover/selected/drag states; titles use
      the available width before truncating, with the full title on hover.
- [x] Tree pane width: fixed, 280 px, 320 px from 1440 px wide (decided above).
- [x] Rail: badge placement that never covers a label; consistent active indicator; wordmark spacing.
- [x] Top bar: search, Capture and the detail toggle aligned to one baseline; account menu shows the avatar
      initial in a consistent colour.

**Exit criteria:** shell checked at all four widths; tree keyboard navigation and drag-and-drop e2e still green.

---

## V3 — Item rows, chips & lists

- [x] One `ItemRow` component (icon/checkbox, title, path, meta chips, actions) used by Focus, Inbox, Inside,
      Search and Trash; actions collapse into a "⋯" menu on narrow widths.
- [x] One completion control for tasks everywhere (same shape in the tree, Focus and lists).
- [x] Chip system: status, priority, due (overdue / today / soon), tags — distinct but quiet, from V1.P3 roles;
      chips wrap below the title on phones instead of overlapping it.
- [x] Focus: each task once, in its most urgent section, other facts as chips (decided above); section headers
      with counts and collapse.
- [x] Inbox: titles get the full line; File/Delete move to the row menu on phones; time shown compactly.
- [x] Search results and Trash rows match `ItemRow`; highlight style kept.

**Exit criteria:** no overlap at 360/390 px (V0 check); Focus, Inbox and Search look like one family.

---

## V4 — Item page, editor & details panel

- [x] Header: breadcrumb without repeating the title; type shown once (keep the Type field, drop the duplicate
      chip or make the chip the control); responsive title size from V1.
- [x] Editor loading: replace the grey block with a text-shaped placeholder and start loading the editor chunk
      when a note is hovered or the tree is opened, so the wait is shorter and calmer.
- [x] Toolbar: grouped controls, sticky while scrolling long notes, wraps cleanly on phones.
- [x] Reading typography inside notes: measure, heading rhythm, list spacing, quotes, code (JetBrains Mono)
      — checked against the audit's long note at 1440/820/390. *Image captions declined for now: the editor
      schema has no caption node (alt text exists); see GAPS.*
- [x] Inside / Links / Backlinks sections: consistent headers, counts and empty text; Inside uses `ItemRow`.
- [x] Details panel: dates in the same style as other fields (MUI date input built from MUI pieces, no new
      library — pure-MUI rule), friendly timestamps ("Created 4 Nov 2026 · edited 2 h ago"), grouped fields.

**Exit criteria:** a long note with every block type reads well at 1440 and 390 px in both themes.

---

## V5 — Scheduler

- [x] Event colours: picked colours and item-type colours already work (`entryDisplay.ts`); give uncoloured
      events a calmer default and use a lighter fill with a strong left edge in light mode (dark mode already
      reads well).
- [x] Short events show title first, time on hover/focus; no clipped text at 820 px.
- [x] Week/Day: first hour label not clipped under the all-day row; current-time line always visible when today
      is in view; working-hours shading; weekend tint.
- [x] Month on phones: a dot per entry in the grid plus the selected day's list below (titles readable), instead
      of times squeezed into cells.
- [x] Dialog: title says what it makes ("New event" / "New time block"); fields grouped; repeat summary in words.
- [x] Empty Scheduler: short hint on how to add an entry.

**Exit criteria:** month/week/day readable at all four widths; scheduler e2e still green.

---

## V6 — States & feedback

- [x] One loading pattern per kind: page (skeleton shaped like the page), list (row skeletons), inline (spinner
      in the button); no bare grey blocks.
- [x] Empty states: consistent illustration size, one sentence, one action — Knowledge home also shows recently
      edited notes and the review queue instead of only an empty state.
- [x] Toasts: consistent placement and wording; Undo always where an action can be undone.
- [x] Error pages and inline errors share one style; "server waking up" shown as a calm banner, not an error.
- [x] Focus rings visible on every interactive element in both themes; hover and pressed states consistent.
- [x] Subtle transitions for panels, dialogs and tree expand using V1 motion tokens (off with reduced motion).

**Exit criteria:** every screen's loading, empty and error state reviewed in both themes.

---

## V7 — Responsive pass

- [x] Phone (360/390): every audit finding fixed; bottom nav, top bar and dialogs checked (they fit at 360 px,
      so none needed full-screen); touch targets ≥ 44 px on touch screens.
- [x] Tablet (820): Knowledge and Actionable use two panes (tree + content) instead of a full-width tree; detail
      panel as a drawer.
- [x] Wide desktop (1440+): content widths from V1; the detail panel never squeezes the editor below the
      reading width.
- [ ] Landscape phone and 200 % browser zoom don't break the shell. *(Not checked yet — GAPS.)*

**Exit criteria:** V0's overflow check passes at all widths; manual pass on a real phone (owner).

---

## V8 — Public & auth pages

- [x] Login, register, landing, policy pages and 404 use the V1 type scale and widths, so they match the app.
- [x] Auth pages: password visibility toggle, clearer errors, consistent spacing with the landing header.
- [x] Landing screenshots retaken after V2–V5 so they show the refined UI (content made for the shot).

**Exit criteria:** public pages visually consistent with the app; B-01 axe audit still green.

---

## V9 — Quality

- [ ] Axe audit extended to the welcome dialog, 404 and every dialog, light and dark. *(Not done: the axe
      e2e needs the in-memory API, which couldn't run in this environment — GAPS.)*
- [x] Token contrast tests cover the new status/priority roles.
- [x] Visual regression: the V0 script's screenshots compared before/after each milestone (local, not CI — fonts
      differ between machines).
- [x] Performance: no bundle growth — main chunk 596.8 → 572.7 KB (186.9 → 180.4 KB gzip), playground boot is
      its own 13 KB chunk (LOGS). *Landing LCP on phones not re-measured yet (needs the live site) — GAPS.*
- [x] `GAPS.md` updated with anything deferred.

**Exit criteria:** CI green; checks above recorded in `LOGS.md`.

---

## V10 — Personalisation (signed-in app)

**Goal:** let each user choose a colour theme and a font for the app. Defaults: font **Fredoka**, theme
**Garden** (a pastel take on today's sage-and-blossom palette). Choices follow the account across devices. Public
pages always show the defaults (Fredoka + Garden).

**Pastel, but readable:** pastel colours are used for backgrounds, surfaces, chips, highlights, event blocks and
buttons; **text stays deep** (charcoal / deep ink of the theme's hue) so it meets WCAG AA. Primary buttons are a
pastel fill with dark text rather than a dark fill with white text. Dark mode uses muted, desaturated pastels on a
deep background, not neon.

### V10.P1 — Choices
- [x] **Fonts** (self-hosted, OFL, Latin + Latin Extended, loaded only when chosen):
      **Fredoka** (default — `@fontsource-variable/fredoka` 5.3.0, weights 300–700, ≈ 30 KB Latin),
      **Inter** (today's font), **Atkinson Hyperlegible** (high legibility), and **System** (the device font, nothing to
      download). Code blocks stay JetBrains Mono; the wordmark's 庭 stays the Noto Sans JP slice (Fredoka has no
      Japanese).
- [x] **Colour themes — all pastel**, each with light and dark variants defined in `@niwa/tokens`:
      **Garden** (default: pastel sage + blossom pink, from today's palette), plus a starting set such as
      **Blossom** (pink), **Lavender** (lilac), **Sky** (baby blue) and **Peach** (apricot) — final names and
      values designed in V10.P2 and shown to the owner before they ship. *(Designed and contrast-tested; Garden,
      Blossom, Lavender, Sky, Peach built in `packages/tokens` — **awaiting the owner's approval before merge**.)* Every theme must pass
      `contrast.test.ts` (WCAG AA text, 3:1 icons and focus rings) in both modes.
- [x] Light / Dark / System stays a separate switch, so any theme works in either mode.

### V10.P2 — Design
- [x] Per-font tuning table (size, line height, letter spacing for body/headings) so Fredoka's rounded shapes
      and Inter's tighter ones both read at 15 px.
- [x] Pastel palette rules: which roles may be pastel (fills) and which must stay deep (text, icons, focus rings,
      borders on inputs); applied to every theme so they all feel like one family.
- [x] Theme palettes: background, surface, primary, secondary, text, divider, item-type and status colours —
      no screen-specific colours.
- [x] Item-type colours (project/task/note/idea) stay recognisable in every theme.

### V10.P3 — Settings › Appearance
- [x] Theme picker: swatch cards showing each palette in the current mode; selecting applies instantly.
- [x] Font picker: each option rendered in its own font with a sample line; selecting applies instantly (the font
      file loads on demand, with the old font kept until it's ready — no flash of unstyled text).
- [x] "Reset to defaults" (Garden + Fredoka + System mode).

### V10.P4 — Saving the choice
- [x] Backend: `users.preferences { theme, font }` with defaults; contract + OpenAPI; read with `GET /auth/me`,
      saved with `PUT /account/preferences`; unknown ids fall back to the default.
- [x] Web: apply the account's preferences after sign-in; cache them locally so the next visit paints in the
      right theme before the API answers; the existing light/dark choice moves to the account too.
- [ ] Mobile reads the same fields later (A-02); not in this plan.

### V10.P5 — Checks
- [x] Unit tests: theme/font ids → theme; unknown ids fall back; public pages ignore preferences.
- [x] V0 visual script run per theme × mode (all five themes, 0 findings) and with Inter. *Axe per theme still
      to run in CI — GAPS.*
- [x] Bundle: only the chosen font's file is downloaded (checked in the network panel and recorded in `LOGS.md`).

**Exit criteria:** a user can switch theme and font, the choice follows them to another browser, every
combination is readable, and visitors see the public site in Garden + Fredoka (apart from their own playground
preview, V11).

---

## V11 — Interactive landing page ("try it before you sign up")

**Goal:** visitors can play with a small, working preview of NIWA on the landing page — including the
customisation — so they see what the private app is like before creating an account.

**Truth rule (B-01) applies:** the playground uses invented example content, clearly labelled "Example", runs
entirely in the visitor's browser (no account, no network calls, nothing saved), and only shows features the real
app has.

### V11.P1 — Playground
- [x] A framed mini-app on the landing page built from the **same components** as the real app (tree, `ItemRow`,
      note view, Focus, a week strip of the scheduler), fed by an in-memory example workspace — not screenshots.
- [x] Things a visitor can do: expand/collapse the tree, open a note, tick a task and watch it leave Focus,
      capture an idea and see it appear in the Inbox, switch lens (Knowledge / Actionable / Scheduler).
- [x] **Customise panel** beside it: theme swatches (all V10 themes), font picker (all V10 fonts), light/dark
      toggle — applied to the playground only, instantly. A short note: "Your choices are saved to your account
      after you sign up."
- [x] "Start fresh" resets the playground; a gentle "Create account" call-to-action under it (hidden when sign-up
      is closed, as today).

### V11.P2 — Page refresh around it
- [x] Hero rewritten around the playground (replaces the static example tree); the real screenshots stay further
      down as a "full app" view, retaken after V2–V5.
- [x] Landing sections restyled with the pastel default theme and Fredoka; subtle motion (scroll-in, hover) using
      V1 motion tokens, off with reduced motion.

### V11.P3 — Accessibility & performance
- [x] Playground fully keyboard operable, announced as an interactive example (`role="region"`, clear label), no
      keyboard traps; the rest of the page usable without touching it.
- [x] Loaded lazily when scrolled into view (`<iframe loading="lazy">`, fixed height so CLS stays 0); the boot
      is its own 13 KB chunk. *Phone LCP re-measure is with V9 — GAPS.*
- [x] Works at 360 px: the customise panel becomes a sheet under the preview.

### V11.P4 — Tests
- [x] Unit/e2e: playground actions work offline (no `/api` requests made), theme/font switches only affect the
      playground, reset works, sign-up CTA respects `registrationOpen`.
- [ ] Axe audit of the landing with the playground in light and dark. *(Runs with the existing a11y e2e in CI,
      which scans frames; not run here — GAPS.)*

**Exit criteria:** a visitor can try the main ideas and the customisation without an account, the page stays
fast and accessible, and nothing in the playground claims more than the app does.

---

## Open questions for owner

All earlier questions are answered (Decisions above; 2026-11-04: Fredoka on public pages too, pastel default and
pastel alternatives). The final theme colours will be shown to the owner for approval in V10.P2 before they ship.
