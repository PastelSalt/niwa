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

### Carried from earlier milestones
- [ ] **Hosting accounts** (M1/M2) — Atlas, Render, Vercel not created yet; `vercel.json` Render hostname is a placeholder.
      Vercel root directory is now `web_app` (renamed from `frontend`).
- [ ] **Month drag on touch** (M5) — native drag-and-drop doesn't work on touch; use the dialog.
- [ ] **Overlapping all-day events in week view** (M5) — stack rather than span.
- [ ] **Week start** (M5) — fixed to Monday, not configurable.
- [ ] **Bulk delete in Inbox** (M6) — single delete with Undo only.
- [ ] **Search pagination** (M6) — capped at 40 results.
- [ ] **Capture body** (M6) — plain text only, no rich text.

### Deferred by owner
- [ ] **AI (DeepSeek, M8)** — skipped for now (2026-11-04); mobile (`NIWA-PLAN-A-02.md`) comes first.

## Closed

_None yet._
