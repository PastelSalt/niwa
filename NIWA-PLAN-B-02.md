# NIWA — Plan B-02 (Web UI/UX refinement)

**Role of this file:** milestone tracker for refining the **look and feel of the web app** (`web_app/`) — the
signed-in screens first, then the public pages so they match. No new product features; mobile (`flutter_app/`)
is out of scope until the owner says otherwise.
**Plan version:** B-02
**Created:** 2026-11-04
**Built by:** NIWA is designed and developed solo by **Moeko Works** — <https://moekoworks.vercel.app/>
**Live web app:** <https://niwa-delta.vercel.app>
**Rules that still apply:** pure MUI (`PROJECT-SPECS.md` §11.7); colours only from `@niwa/tokens`; light and
dark both first-class; WCAG 2.1 AA; the "truth rule" of `NIWA-PLAN-B-01.md` for any public copy.
**Previous plans:** `NIWA-PLAN-B-01.md` (public site, legal, multi-user — done apart from small leftovers).
**Personalisation (owner, 2026-11-04):** signed-in users can pick a **colour theme** and a **font**; the in-app
default font is **Fredoka** (the owner's choice). Public pages keep the brand font (Inter). See V10; the theme
and font plumbing is built into V1 so nothing has to be redone.

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
| Order | **V0 → V1 → V10 plumbing check → phone bugs (V3 rows, V5 month, V7 phone) → the rest** | Foundations first so fixes use the new tokens, but the visible phone bugs follow right after |

---

## Overview

| # | Milestone | Status | Depends on |
|---|---|---|---|
| V0 | Baseline & guardrails (visual audit script, overflow checks) | ⬜ | — |
| V1 | Design foundations: type scale, widths, spacing, motion, elevation tokens | ⬜ | V0 |
| V2 | App shell & tree | ⬜ | V1 |
| V3 | Item rows, chips & lists (Focus, Inbox, Inside, Search, Trash) | ⬜ | V1 |
| V4 | Item page, editor & details panel | ⬜ | V1, V3 |
| V5 | Scheduler | ⬜ | V1 |
| V6 | States & feedback (loading, empty, errors, toasts, focus) | ⬜ | V1 |
| V7 | Responsive pass (phone, tablet, wide desktop) | ⬜ | V2–V6 |
| V8 | Public & auth pages brought in line | ⬜ | V1 |
| V9 | Quality: accessibility, performance, regression | ⬜ | V2–V8, V10 |
| V10 | Personalisation: colour themes + in-app font (default Fredoka) | ⬜ | V1 (plumbing), V9 checks |

**Exit criteria (whole plan):** every finding in the audit tables is fixed or explicitly declined in `LOGS.md`;
no overlapping or clipped text at 360, 390, 820 or 1440 px (checked by V0's script); axe clean in light and dark;
no literal font sizes or content widths outside the theme; existing tests green.

---

## V0 — Baseline & guardrails

**Goal:** make visual quality measurable before changing anything.

- [ ] `web_app/scripts/visual-audit.mjs`: seeds the in-memory API with the audit content above and screenshots
      every screen + dialogs + empty states at 1440 / 820 / 390 / 360 px in both themes into a git-ignored folder.
- [ ] Overflow check in the same run: flags elements whose text overflows or overlaps a sibling (bounding-box
      test) and prints the screen, width and selector. Today's run must reproduce the phone findings.
- [ ] Commit the "before" screenshot set's file list and findings to `LOGS.md` (images stay local).

**Exit criteria:** one command reproduces the audit; the overlap check fails on today's Focus/Inbox phone bugs.

---

## V1 — Design foundations

**Goal:** a small, named vocabulary in `@niwa/tokens` and the MUI theme, so screens stop inventing sizes.

### V1.P1 — Typography
- [ ] Type scale tokens (display, title, heading, body, small, caption) with sizes, weights and line heights;
      body text **15 px** (decided above), small text ≥ 12 px. Sizes and line heights are per font family, so a
      different font (V10) can adjust them without touching screens.
- [ ] Map MUI variants to the scale; replace the 22 literal `fontSize` values with variants or tokens.
- [ ] Item titles use a responsive size (`clamp`) so long titles don't take four lines on phones.

### V1.P2 — Layout & spacing
- [ ] Content-width tokens: `reading` (~ 70 characters, notes), `list` (Focus, Inbox, Search, Trash),
      `form` (Settings), `wide` (Scheduler). Replace the ad-hoc `maxWidth` literals.
- [ ] Centre list screens in the space beside the tree (decided above) and apply it everywhere.
- [ ] Spacing: keep the 4 px grid; name the common gaps (row, section, page) instead of repeating numbers.

### V1.P3 — Surfaces, motion, icons
- [ ] Elevation/border tokens for cards, panels, popovers and dialogs (light and dark).
- [ ] Motion tokens (short, medium) used by hovers, panels and dialogs; everything off under
      `prefers-reduced-motion`.
- [ ] Icon sizes (inline, row, empty-state) as tokens.
- [ ] Semantic colour roles for status and priority (not started, in progress, blocked, done; none → critical)
      from the existing palette, checked by `contrast.test.ts` in both themes.

### V1.P4 — Theme plumbing for personalisation (no UI yet)
- [ ] The MUI theme is built from a **theme id + font id + colour mode** at runtime, instead of one fixed theme;
      today's look is theme `sage` + font `inter`. Every screen reads colours and fonts only from the theme.
- [ ] Fonts register lazily: only the selected family's files are fetched (same CssBaseline approach as
      `web_app/src/app/fonts.ts`, so the pure-MUI rule holds).
- [ ] Public pages (landing, auth, policies) always use theme `sage` + font `inter`, whatever a signed-in user picked.

**Exit criteria:** theme exposes the scale and widths; a grep finds no literal font sizes or content widths in
`web_app/src` (exceptions listed in code with a reason); switching the theme id in code recolours every screen.

---

## V2 — App shell & tree

- [ ] One place names the current screen (top bar **or** tree header, not both); the rail keeps its label.
- [ ] Root containers (Knowledge, Projects, College, Personal) get their own icon and slightly stronger weight,
      so they read as spaces, not notes.
- [ ] Tree rows: larger hit area and text, indentation guides, clearer hover/selected/drag states; titles use
      the available width before truncating, with the full title on hover.
- [ ] Tree pane width: fixed, 280 px, 320 px from 1440 px wide (decided above).
- [ ] Rail: badge placement that never covers a label; consistent active indicator; wordmark spacing.
- [ ] Top bar: search, Capture and the detail toggle aligned to one baseline; account menu shows the avatar
      initial in a consistent colour.

**Exit criteria:** shell checked at all four widths; tree keyboard navigation and drag-and-drop e2e still green.

---

## V3 — Item rows, chips & lists

- [ ] One `ItemRow` component (icon/checkbox, title, path, meta chips, actions) used by Focus, Inbox, Inside,
      Search and Trash; actions collapse into a "⋯" menu on narrow widths.
- [ ] One completion control for tasks everywhere (same shape in the tree, Focus and lists).
- [ ] Chip system: status, priority, due (overdue / today / soon), tags — distinct but quiet, from V1.P3 roles;
      chips wrap below the title on phones instead of overlapping it.
- [ ] Focus: each task once, in its most urgent section, other facts as chips (decided above); section headers
      with counts and collapse.
- [ ] Inbox: titles get the full line; File/Delete move to the row menu on phones; time shown compactly.
- [ ] Search results and Trash rows match `ItemRow`; highlight style kept.

**Exit criteria:** no overlap at 360/390 px (V0 check); Focus, Inbox and Search look like one family.

---

## V4 — Item page, editor & details panel

- [ ] Header: breadcrumb without repeating the title; type shown once (keep the Type field, drop the duplicate
      chip or make the chip the control); responsive title size from V1.
- [ ] Editor loading: replace the grey block with a text-shaped placeholder and start loading the editor chunk
      when a note is hovered or the tree is opened, so the wait is shorter and calmer.
- [ ] Toolbar: grouped controls, sticky while scrolling long notes, wraps cleanly on phones.
- [ ] Reading typography inside notes: measure, heading rhythm, list spacing, quotes, code (JetBrains Mono),
      images with captions — checked against long real notes.
- [ ] Inside / Links / Backlinks sections: consistent headers, counts and empty text; Inside uses `ItemRow`.
- [ ] Details panel: dates in the same style as other fields (MUI date input built from MUI pieces, no new
      library — pure-MUI rule), friendly timestamps ("Created 4 Nov 2026 · edited 2 h ago"), grouped fields.

**Exit criteria:** a long note with every block type reads well at 1440 and 390 px in both themes.

---

## V5 — Scheduler

- [ ] Event colours: picked colours and item-type colours already work (`entryDisplay.ts`); give uncoloured
      events a calmer default and use a lighter fill with a strong left edge in light mode (dark mode already
      reads well).
- [ ] Short events show title first, time on hover/focus; no clipped text at 820 px.
- [ ] Week/Day: first hour label not clipped under the all-day row; current-time line always visible when today
      is in view; working-hours shading; weekend tint.
- [ ] Month on phones: a dot per entry in the grid plus the selected day's list below (titles readable), instead
      of times squeezed into cells.
- [ ] Dialog: title says what it makes ("New event" / "New time block"); fields grouped; repeat summary in words.
- [ ] Empty Scheduler: short hint on how to add an entry.

**Exit criteria:** month/week/day readable at all four widths; scheduler e2e still green.

---

## V6 — States & feedback

- [ ] One loading pattern per kind: page (skeleton shaped like the page), list (row skeletons), inline (spinner
      in the button); no bare grey blocks.
- [ ] Empty states: consistent illustration size, one sentence, one action — Knowledge home also shows recently
      edited notes and the review queue instead of only an empty state.
- [ ] Toasts: consistent placement and wording; Undo always where an action can be undone.
- [ ] Error pages and inline errors share one style; "server waking up" shown as a calm banner, not an error.
- [ ] Focus rings visible on every interactive element in both themes; hover and pressed states consistent.
- [ ] Subtle transitions for panels, dialogs and tree expand using V1 motion tokens (off with reduced motion).

**Exit criteria:** every screen's loading, empty and error state reviewed in both themes.

---

## V7 — Responsive pass

- [ ] Phone (360/390): every audit finding fixed; bottom nav, top bar and dialogs (full-screen on phones where
      it helps) checked; touch targets ≥ 44 px.
- [ ] Tablet (820): Knowledge and Actionable use two panes (tree + content) instead of a full-width tree; detail
      panel as a drawer.
- [ ] Wide desktop (1440+): content widths from V1; the detail panel never squeezes the editor below the
      reading width.
- [ ] Landscape phone and 200 % browser zoom don't break the shell.

**Exit criteria:** V0's overflow check passes at all widths; manual pass on a real phone (owner).

---

## V8 — Public & auth pages

- [ ] Login, register, landing, policy pages and 404 use the V1 type scale and widths, so they match the app.
- [ ] Auth pages: password visibility toggle, clearer errors, consistent spacing with the landing header.
- [ ] Landing screenshots retaken after V2–V5 so they show the refined UI (content made for the shot).

**Exit criteria:** public pages visually consistent with the app; B-01 axe audit still green.

---

## V9 — Quality

- [ ] Axe audit extended to the welcome dialog, 404 and every dialog, light and dark.
- [ ] Token contrast tests cover the new status/priority roles.
- [ ] Visual regression: the V0 script's screenshots compared before/after each milestone (local, not CI — fonts
      differ between machines).
- [ ] Performance: no bundle growth beyond what a milestone needs (report sizes in `LOGS.md`); landing LCP on
      phones measured again (B-01 leftover: 3.3 s, target 2.5 s).
- [ ] `GAPS.md` updated with anything deferred.

**Exit criteria:** CI green; checks above recorded in `LOGS.md`.

---

## V10 — Personalisation (signed-in app only)

**Goal:** let each user choose a colour theme and a font for the app. Defaults: font **Fredoka**, theme
**Sage** (today's palette). Choices follow the account across devices; public pages are not affected.

### V10.P1 — Choices
- [ ] **Fonts** (self-hosted, OFL, Latin + Latin Extended, loaded only when chosen):
      **Fredoka** (default — `@fontsource-variable/fredoka` 5.3.0, weights 300–700, ≈ 30 KB Latin),
      **Inter** (current), **Atkinson Hyperlegible** (high legibility), and **System** (the device font, nothing to
      download). Code blocks stay JetBrains Mono; the wordmark's 庭 stays the Noto Sans JP slice (Fredoka has no
      Japanese).
- [ ] **Colour themes**, each with light and dark variants defined in `@niwa/tokens`: **Sage** (default, today's
      palette) plus a small set of alternatives (e.g. Blossom, Ocean, Dusk) — final names and colours designed in
      V10.P2. Every theme must pass `contrast.test.ts` (WCAG AA text, 3:1 icons) in both modes before it ships.
- [ ] Light / Dark / System stays a separate switch, so any theme works in either mode.

### V10.P2 — Design
- [ ] Per-font tuning table (size, line height, letter spacing for body/headings) so Fredoka's rounded shapes
      and Inter's tighter ones both read at 15 px.
- [ ] Theme palettes: background, surface, primary, secondary, text, divider, item-type and status colours —
      no screen-specific colours.
- [ ] Item-type colours (project/task/note/idea) stay recognisable in every theme.

### V10.P3 — Settings › Appearance
- [ ] Theme picker: swatch cards showing each palette in the current mode; selecting applies instantly.
- [ ] Font picker: each option rendered in its own font with a sample line; selecting applies instantly (the font
      file loads on demand, with the old font kept until it's ready — no flash of unstyled text).
- [ ] "Reset to defaults" (Sage + Fredoka + System mode).

### V10.P4 — Saving the choice
- [ ] Backend: `users.preferences { theme, font }` with defaults; contract + OpenAPI; read with `GET /auth/me`,
      saved with `PUT /account/preferences`; unknown ids fall back to the default.
- [ ] Web: apply the account's preferences after sign-in; cache them locally so the next visit paints in the
      right theme before the API answers; the existing light/dark choice moves to the account too.
- [ ] Mobile reads the same fields later (A-02); not in this plan.

### V10.P5 — Checks
- [ ] Unit tests: theme/font ids → theme; unknown ids fall back; public pages ignore preferences.
- [ ] Axe audit and the V0 visual script run once per theme × mode with the default font, and once per font with
      the default theme.
- [ ] Bundle: only the chosen font's file is downloaded (checked in the network panel and recorded in `LOGS.md`).

**Exit criteria:** a user can switch theme and font, the choice follows them to another browser, every
combination is readable, and visitors still see the public site in Sage + Inter.

---

## Open questions for owner

All five original questions were delegated and are answered in **Decisions** above. Still open:

1. **Public pages font:** keep Inter for visitors (current plan), or use Fredoka there too so the brand matches the
   app default?
2. **Theme set:** happy with Sage + three alternatives to start, or a specific list/colour you have in mind?
