# NIWA — SCHEDULER.md (scheduler rules)

**Status:** v0.1 — implemented in M5
**Resolves:** `PROJECT-SPECS.md` §16 → `SCHEDULER.md` row
**Parent doc:** `PROJECT-SPECS.md` §4.3, §7, §12.2, §12.5 (wins on conflict)
**Last updated:** 2026-11-03

Covers:
1. Entries and series
2. Time and timezones
3. Recurrence and materialization
4. Editing scopes
5. Drag semantics
6. Overlaps and layout
7. Items ↔ blocks

---

## 1. Entries and series

| Concept | Stored in | Notes |
|---|---|---|
| **Entry** | `schedule_entries` | One row per thing on the calendar. `kind: event \| block` (§12.2). |
| **Series** | `schedule_series` | Only for recurring entries: the rule (`daily \| weekly \| monthly`), the anchor (first start), duration, time zone, and how far it has been materialized. |

- A one-off entry has `recurrence: none`, `seriesId: null`.
- Each occurrence of a recurring entry is a real `schedule_entries` row with `seriesId` + `seriesIndex` (0, 1, 2…). Rows are what the calendar shows, edits and drags.
- A `block` carries `itemId` and shows the item's **live** title; an `event` has its own title and no item.

## 2. Time and timezones

| What | Stored as | Displayed as |
|---|---|---|
| Timed entry | `startAt`/`endAt` UTC instants | Viewer's local time |
| All-day entry | `startAt` = `YYYY-MM-DDT00:00:00Z` of the first day, `endAt` = `00:00Z` of the day **after** the last day (`isAllDay: true`) | The **calendar date** of those UTC values, never shifted by the viewer's zone |
| `dueAt` / `reviewAt` | Date-only strings (unchanged, §12.5) | As is |

- Recurring series store the creator's **IANA time zone** (`timeZone`, default `UTC`). Occurrences are computed in that zone's wall clock, so "every Tuesday 09:00" stays 09:00 across DST changes.
- Week starts on **Monday** (setting later).

## 3. Recurrence and materialization

Simple, instance-based (§7) — no RRULE, no exceptions table.

| Rule | Step (in the series time zone) |
|---|---|
| `daily` | +1 day |
| `weekly` | +7 days |
| `monthly` | +1 month, same day-of-month; clamped to the month's last day (Jan 31 → Feb 28/29 → Mar 31) — always computed from the anchor, so clamping never drifts |

- **Materialization:** `GET /schedule?from&to` first extends every live series in the workspace until its next occurrence starts at or after `to` (at most 2 years past now, max 500 rows per series per request), then returns the rows overlapping `[from, to)`. Creating a series materializes it up to 8 weeks ahead.
- `materializedThrough` (last index created) means an occurrence is **never created twice** — deleting one occurrence doesn't make it come back.
- Occurrence `n` always starts at `anchor + n × step` (computed fresh, not chained), keeping the series stable.

## 4. Editing scopes

Every edit or delete of a recurring occurrence asks **"This event" or "This and following"** (§7: never silently "all").

| Action | `instance` | `future` (this and following) |
|---|---|---|
| **Edit** | Only that row changes; it's marked `detached` so later series changes don't touch it | Series is ended before this index (`untilIndex = n − 1`); rows ≥ n are deleted; a **new series** starts at the edited occurrence with the new values (or a single one-off entry if recurrence was set to `none`) |
| **Delete** | Only that row is deleted (not regenerated) | Series ended before n; rows ≥ n deleted. If n is the first occurrence, the whole series goes |

Setting a one-off entry's recurrence creates a series anchored at that entry.

## 5. Drag semantics

| Where | Gesture | Effect |
|---|---|---|
| Month view | Drag a chip to another day | Moves by whole days; time of day and duration kept |
| Week/day view | Drag empty space | Creates a timed entry over the dragged range (15-min snap), opens the editor |
| Week/day view | Drag an entry | Moves it (15-min snap; across days in week view) |
| Week/day view | Drag the bottom edge | Resizes the end (15-min snap, min 15 min) |

- Drags on a recurring occurrence apply to **that occurrence only** (scope `instance`); the editor offers "this and following".
- All-day entries live in the all-day row of week/day view and are moved in month view or the editor.

## 6. Overlaps and layout

- Overlaps are allowed (it's your calendar). Week/day view lays overlapping timed entries side by side: entries are grouped into clusters of transitively overlapping entries; each cluster is split into the minimum number of columns.
- Month cells show up to 3 entries, then "+N more" (opens the day view).

## 7. Items ↔ blocks

- An item's scheduled time is **derived** from its blocks — there is no `scheduledStartAt` on items (§6.1).
- `GET /items/:id/schedule` lists an item's upcoming blocks (detail panel "Scheduled").
- Item soft-deleted → its blocks are hidden; restored → visible again; purged → its blocks and series are deleted.
- Block titles are optional; the calendar shows the item's current title.
