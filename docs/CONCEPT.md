# NIWA — CONCEPT.md (UX & flows)

**Status:** Draft v0.1 — proposed, pending owner review
**Resolves:** `PROJECT-SPECS.md` §16 → `CONCEPT.md` row (needed by M2–M4)
**Parent doc:** `PROJECT-SPECS.md` (wins on conflict)
**Last updated:** 2026-11-03

Covers:
1. Navigation shell for the six destinations
2. Cross-base item visibility
3. Capture → classify flow
4. Heading-to-item promotion
5. Links to specific sections

---

## 1. Navigation shell

### 1.1 Layout (web / desktop, ≥ 1200px)

```text
┌──────┬────────────────┬──────────────────────────────┬──────────────────┐
│ Rail │  Tree pane     │  Main view                   │  Detail panel    │
│      │  (lens-scoped) │  (editor / Focus / calendar) │  (item fields)   │
│  K   │  ▸ Knowledge   │                              │  Status          │
│  A   │  ▸ Projects    │                              │  Priority        │
│  S   │  ▸ College     │                              │  Due / Review    │
│  I   │  ▸ Personal    │                              │  Tags            │
│  ⌕   │                │                              │  Links/Backlinks │
│  ⚙   │                │                              │                  │
└──────┴────────────────┴──────────────────────────────┴──────────────────┘
```

| Region | MUI building block | Behavior |
|---|---|---|
| Rail | `Drawer` (permanent, mini) + `List` | Six destinations, icon + tooltip; Inbox shows a count `Badge` |
| Tree pane | `Drawer` (resizable) + `@mui/x-tree-view` | Collapsible; hidden on Scheduler, Search, Settings |
| Main view | `Box` | Changes per destination |
| Detail panel | `Drawer` (persistent, right) | Opens when an item is selected; collapsible |
| Top bar | `AppBar` (dense) | Breadcrumb of the selected item, quick-capture button, search field |

### 1.2 Responsive behavior

| Width | Rail | Tree | Detail |
|---|---|---|---|
| ≥ 1200px | Mini rail | Docked | Docked |
| 900–1199px | Mini rail | Docked | Overlay drawer |
| < 900px (phone) | `BottomNavigation` (Knowledge, Actionable, Scheduler, Inbox, Search; Settings in top-bar menu) | Full-screen view, drill-down | Full-screen sheet |

### 1.3 Routes (web)

| Route | View |
|---|---|
| `/knowledge` | Knowledge lens; tree + empty state or last opened note |
| `/knowledge/review` | Review queue |
| `/actionable` | Focus sections (default) |
| `/actionable/tree` | Actionable tree view |
| `/scheduler/month/:yyyy-mm` | Month view |
| `/scheduler/week/:yyyy-mm-dd` · `/scheduler/day/:yyyy-mm-dd` | Week / day view |
| `/inbox` | Inbox list + filing |
| `/search?q=…&type=…&tag=…` | Search results |
| `/settings/:section` | `appearance`, `account`, `ai`, `trash` |
| `/items/:id` | **Canonical item URL** — opens the item in the lens matching its `nature` |
| `/items/:id#h-<anchorId>` | Item scrolled to a heading (see §5) |

Rules:
- Item ids are the same in every lens; switching lens with an item selected keeps it selected if visible there.
- Unknown / deleted item → "This item was moved to Trash" state with a Restore action.

### 1.4 Keyboard (web/desktop)

| Key | Action |
|---|---|
| `c` | Quick capture (opens capture dialog from anywhere) |
| `/` | Focus search |
| `g k` / `g a` / `g s` / `g i` | Go to Knowledge / Actionable / Scheduler / Inbox |
| `↑ ↓ ← →` | Navigate tree (x-tree-view default) |
| `Enter` / `F2` | Open / rename selected item |
| `Tab` / `Shift+Tab` (in tree) | Indent / outdent (move under previous sibling / to grandparent) |
| `Ctrl/Cmd+K` | Command palette (desktop, post-MVP) |

Shortcuts are disabled while typing in an input or the editor (except `Esc`).

---

## 2. Cross-base item visibility

The tree is one tree; each lens decides **what to show** and **what to dim**.

| Lens | Shows | Context ancestors | Notes |
|---|---|---|---|
| Knowledge | `nature = knowledge` items | Actionable ancestors shown **dimmed** so the path still makes sense | Root containers always shown |
| Actionable | `nature = actionable` items | Knowledge ancestors shown **dimmed** | Focus sections list items flat, with breadcrumb |
| Scheduler | `schedule_entries` in range | — | A `block` shows its item's title + type icon; click opens item |
| Inbox | `inboxedAt != null` | — | Inboxed items are **hidden from every lens tree** until filed |
| Search | Everything not deleted | Breadcrumb per result | Filters for type/nature/tag/status |

Additional rules:
- **Archived** items are hidden everywhere by default; each tree has a "Show archived" toggle. Search excludes archived unless filtered in.
- **Deleted** items appear only in Settings → Trash.
- A dimmed ancestor is clickable (opens it in its own lens) but children created from a dimmed node default to the current lens's nature.
- Children of an item are always shown in the item's detail panel (all natures), so nothing is ever "lost" from view.

---

## 3. Capture → classify flow

**Principle:** capture first, decide later (§2.1 #2). Capture must take one field and one keystroke.

### 3.1 Capture

```text
Press c  →  dialog: [ Title.................. ]  (Enter = save, Shift+Enter = save & new)
                    optional: body (collapsed), type chip (default "idea")
         →  item created: type=idea, parentId=null, inboxedAt=now, orderKey=end of inbox
```

- Captured from inside an item's detail panel ("+ capture child") → still goes to Inbox but pre-fills **suggested parent** = that item.
- AI breakdown drafts (M8) land here the same way, with an "AI draft" chip.

### 3.2 Inbox view

List (newest first) with per-row actions:

| Action | Effect |
|---|---|
| **File** | Opens filing panel (below) |
| **Keep as idea at root** | Sets `parentId` = a root container picked once; clears `inboxedAt` |
| **Delete** | Soft delete |
| Multi-select → **File all to…** | Bulk filing to one parent |

### 3.3 Filing panel

Fields: **Parent** (tree picker with search), **Type** (`idea`/`note`/`task`/`project`), optional **Due**, **Tags**.
On confirm: set `parentId`, set `type` (validated by transition matrix), `orderKey` = end of new siblings, `inboxedAt = null`. One API call (`POST /items/:id/file`).

---

## 4. Heading-to-item promotion

Lets a section that grew too big become its own child item — without breaking §5 (headings never create items **automatically**).

### 4.1 Trigger

Explicit only: **Outline → heading ⋯ menu → "Promote to child item"** (implemented M4; the outline menu replaced an in-editor heading hover menu, which fought with text selection). Not available on mobile in v1.

### 4.2 Behavior

```text
Before (item "Cybersecurity"):           After:
  ## Cryptography                          [→ Cryptography]   ← inline item link
     notes A…                              ## Network Security
  ## Network Security                         notes B…
     notes B…
                                          New child "Cryptography" (type: note)
                                            content: notes A…
```

1. Section = the heading + everything until the next heading of the **same or higher** level.
2. New child item: `title` = heading text, `type` = `note` (or `task` if parent is actionable), `content` = section body (heading removed), appended as last child.
3. In the parent, the section is replaced by an **inline item link** node to the new child.
4. A `links` row is created (`origin: content`).
5. Single server call (`POST /items/:id/promote-section`) — atomic; one undo step in the editor history.

Demote (item → section) is **post-MVP**.

---

## 5. Links to specific sections

### 5.1 Heading anchors

- Every H1–H3 node in ProseMirror JSON carries a stable `attrs.anchorId` (short random id, generated on creation, kept across text edits).
- URL form: `/items/:id#h-<anchorId>`.

### 5.2 Link kinds

| Kind | Created by | Stored in |
|---|---|---|
| **Inline link** | Typing `[[` in the editor → item picker → optional "› section" step | `niwaLink` node in content `{ itemId, anchorId? }` **and** `links` row with `origin: content` |
| **Related item** | Related items picker in the detail panel | `links` row with `origin: manual` |

- Content links are re-synced on every save (add new, remove ones no longer present). Manual links are never touched by saves.
- Backlinks panel lists both kinds, grouped by source item, showing the section name when `targetAnchorId` is set.

### 5.3 Broken anchors

If the target heading was deleted, the link opens the item at the top with a dismissible notice: "The linked section no longer exists." The link is not auto-removed.

---

## Open questions for owner

- [ ] Default type on capture: `idea` (proposed) or ask every time?
- [ ] Should the Knowledge tree hide actionable items entirely instead of dimming them?
- [ ] Phone layout: is Settings-in-menu acceptable, or do you want a 6th bottom tab?
