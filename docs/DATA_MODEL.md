# NIWA — DATA_MODEL.md (schema rules)

**Status:** Draft v0.1 — proposed, pending owner review
**Resolves:** `PROJECT-SPECS.md` §16 → `DATA_MODEL.md` row (needed by M3)
**Parent doc:** `PROJECT-SPECS.md` §6 (wins on conflict)
**Database:** MongoDB Atlas (see `OPS.md`)
**Last updated:** 2026-11-03

Covers:
1. Field additions to §6 (proposed)
2. Validation limits
3. Type transition matrix
4. Ordering (fractional indexing)
5. Soft delete, cascade, restore
6. Tag namespace rules
7. Links
8. Attachments & orphan cleanup
9. Search field extraction

---

## 1. Proposed additions to the §6 schema

These are needed by `CONCEPT.md` flows. Once accepted, fold them into `PROJECT-SPECS.md` §6.

| Collection | Field | Type | Why |
|---|---|---|---|
| `items` | `deleteBatchId` | string \| null | Restore exactly the set deleted together (§5) |
| `items` | `deleteRoot` | boolean | ✅ implemented (M3). True on the item the user deleted; Trash lists only these |
| `items` | `deletedParentId` | string \| null | Remember original parent for restore |
| `links` | `targetAnchorId` | string \| null | Link to a heading section (`CONCEPT.md` §5) |
| `links` | `origin` | `content` \| `manual` | Content links re-sync on save; manual ones don't |
| `links` | `workspaceId`, `createdAt` | — | Ownership boundary + ordering |
| `attachments` | `workspaceId` | string | Ownership boundary |
| `attachments` | `orphanedAt` | ISO timestamp \| null | Orphan cleanup grace period (§8) |
| `schedule_entries` | `workspaceId` | string | Ownership boundary (missing in §6.2) |
| `schedule_entries` | `seriesId`, `seriesIndex`, `detached` | ObjectId \| null, number \| null, boolean | ✅ M5 — recurrence occurrences (see `SCHEDULER.md`) |
| `schedule_series` | `recurrence`, `anchorAt`, `durationMs`, `isAllDay`, `color`, `timeZone`, `materializedThrough`, `untilIndex` | — | ✅ M5 — new collection for recurring rules |
| `refresh_sessions` | `id`, `userId`, `tokenHash`, `familyId`, `expiresAt`, `revokedAt`, `createdAt` | — | Refresh rotation + reuse detection (§12.1) |
| `users` | `workspaceId` | string | Single-workspace MVP link |
| `users` | `disabledAt`, `disabledReason` | Date \| null, string \| null | Operator block (`scripts/admin.ts`); sign-in and refresh refused while set |
| `users` | `onboarding` | `{ status: 'completed' \| 'skipped', version, at }` \| null | First-run tour state (B-01 B7); null until finished or skipped |
| `items` | `captureClientId` | string (UUID) \| null | ✅ A-02 MA5 — idempotency key from offline capture queues (`CaptureInput.clientId`); never returned |

Additional indexes:

```text
links:            { workspaceId, sourceId }, { workspaceId, targetId }
attachments:      { itemId }, { orphanedAt }
schedule_entries: { workspaceId, startAt, endAt }, { seriesId }
refresh_sessions: { tokenHash } unique, { familyId }, { expiresAt } TTL
items:            { deletedAt } (cross-account Trash purge); text index is { workspaceId, title/tags/contentPlainText } so searches stay inside one account
items:            { workspaceId, deleteBatchId }
items:            { workspaceId, captureClientId } unique, partial (string only)
```

**Ownership rule:** every query on every collection is scoped by `workspaceId`, derived from the authenticated user — never from request input.

---

## 2. Validation limits

| Field | Rule |
|---|---|
| `title` | Trimmed, 1–300 chars |
| `content` | ProseMirror JSON, ≤ 1 MB serialized |
| `contentPlainText` | Server-generated only; client value ignored |
| `tags` | ≤ 20 per item (see §6) |
| `estimatedMinutes` | Integer 1–10 000 or null |
| `dueAt`, `reviewAt` | `^\d{4}-\d{2}-\d{2}$` and a real calendar date |
| `sourceUrl` | `http(s)` URL, ≤ 2048 chars |
| `parentId` | Must exist in same workspace, not deleted, not self, not a descendant (cycle check) |
| `nature` | Never accepted as input; derived from `type` |
| `version` | Required on update; mismatch → `409 VERSION_CONFLICT` |

Depth is unlimited (§2.1 #1). The cycle check walks ancestors from the new parent; that walk is the only depth-proportional operation.

---

## 3. Type transition matrix

All transitions are **allowed** — an idea becoming a project is the core story. What differs is the side effects.

| From ↓ / To → | `idea` | `note` | `task` | `project` |
|---|---|---|---|---|
| `idea` | — | A | B | B |
| `note` | A | — | B | B |
| `task` | C | C | — | A |
| `project` | C | C | A | — |

| Code | Meaning | Side effects |
|---|---|---|
| **A** | Same nature | None besides `type` |
| **B** | knowledge → actionable | `nature` = actionable. If `status` unset → `not_started`. Item now appears in Actionable lens and Focus sections. |
| **C** | actionable → knowledge | `nature` = knowledge. `status`, `priority`, `dueAt`, `estimatedMinutes`, `completedAt` are **kept but hidden** (lossless round trip). Existing `block` schedule entries stay. |

Always preserved: `id`, children, `content`, `links`, `tags`, `inboxedAt`, `reviewAt`, attachments.

---

## 4. Ordering (fractional indexing)

- Library: `fractional-indexing` (base-62 string keys).
- Sibling scope = `(workspaceId, parentId)`. Inbox ordering uses `parentId = null` + `inboxedAt` filter.
- Insert between A and B → `generateKeyBetween(A.orderKey, B.orderKey)`. Append → `generateKeyBetween(last, null)`.
- Move/reorder writes **only the moved row** (§12.7).
- Clients send neighbor ids (`beforeId` / `afterId`); the **server** computes the key. Clients never invent keys.
- **Rebalance** a sibling scope when any key exceeds 50 chars: rewrite all keys in that scope in one transaction.
- Ties (concurrent inserts producing equal keys): server appends a short random suffix.

---

## 5. Soft delete, cascade, restore

**Delete** `DELETE /items/:id`:
1. Generate `deleteBatchId`.
2. Set `deletedAt = now`, `deleteBatchId` on the item and **all non-deleted descendants**. Store `deletedParentId` on the top item.
3. Schedule entries (`block`) of affected items are hidden (filtered by item's `deletedAt`), not deleted.

**Restore** `POST /items/:id/restore`:
- Restores every item sharing that `deleteBatchId` (descendants deleted earlier in a different batch stay deleted).
- If the original parent is alive → back under it (at end of siblings). If not → into **Inbox** (`inboxedAt = now`, `parentId = null`) with a notice.

**Delete permanently** (Trash only):
- Hard-deletes the batch **and every item still under it** (including descendants soft-deleted earlier in another batch — they have nowhere to be restored to), plus their `links` (both directions), `schedule_entries`, and attachments (Cloudinary destroy, then records). ✅ implemented (links M4, schedule M5, attachments M7).
- Purging any member of a batch purges the whole batch from its root.
- Requires an explicit confirm in UI.

**Trash retention:** ✅ implemented (M7) — items in Trash > 30 days are purged by the API's maintenance job (every 6 h). A Settings switch to disable it is not built yet.

**Archive** is separate: sets `archivedAt` on that item only (no cascade); children are hidden with it because their ancestor is hidden, and come back on unarchive.

---

## 6. Tag namespace rules

One shared namespace across all bases.

| Rule | Detail |
|---|---|
| Normalization | trim → collapse inner whitespace to single `-` → lowercase (Unicode-aware) |
| Allowed chars | letters, digits, `-`, `_`, `/` (Unicode letters allowed, e.g. `庭`) |
| Hierarchy | `/` is allowed for loose grouping (`college/cs301`); no special semantics in MVP |
| Length | 1–40 chars after normalization |
| Per item | ≤ 20 tags, de-duplicated |
| Storage | Normalized strings in `items.tags`; **no separate tags collection** in MVP |
| Listing | `GET /tags` = aggregate distinct tags with counts |
| Rename / merge | `POST /tags/rename { from, to }` → `updateMany` across items |

---

## 7. Links

- Self-links rejected. Duplicate `(sourceId, targetId, targetAnchorId, origin)` rejected.
- `origin: content` rows are owned by the editor: on each content save the server diffs `niwaLink` nodes against existing content rows and adds/removes.
- `origin: manual` rows come only from the Related items picker.
- Links to a deleted item are kept (hidden); they reappear on restore and are removed on permanent delete.

---

## 8. Attachments & orphan cleanup

✅ implemented (M7): `attachment.service.ts`, `maintenance.service.ts`, editor `NiwaImage` node (`attachmentId` attr).

Upload flow (Cloudinary, signed):

```text
1. Client  POST /uploads/sign { itemId }          → server returns signature, folder, public_id
2. Client  uploads file directly to Cloudinary
3. Client  POST /attachments { itemId, public_id } → server verifies via Cloudinary API, creates record
4. Editor  inserts image node { attachmentId, src: secureUrl, alt }
```

Cleanup rules:
- On each content save: attachments of that item **not referenced** by any image node get `orphanedAt = now`; referenced ones get `orphanedAt = null` (handles undo/paste-back).
- Maintenance job (every 6 h): `orphanedAt` older than **7 days** → Cloudinary destroy + delete record.
- Uploads signed but never confirmed (step 3 skipped): Cloudinary assets are uploaded with tag `niwa-pending`; the same job removes `niwa-pending` assets older than 24 h that have no record.
- Permanent item delete → destroy all its attachments immediately.
- Limits: images only (`image/png`, `image/jpeg`, `image/webp`, `image/gif`), ≤ 10 MB each, enforced in the signature params and re-checked at step 3.
- Cloudinary folder: `niwa/<env>/<workspaceId>/`.

---

## 9. Search field extraction (`contentPlainText`)

Computed **server-side** on every content save from ProseMirror JSON.

| Node | Extracted as |
|---|---|
| Text | Its text |
| Paragraph, heading, list item, blockquote, table cell | Text + `\n` separator |
| Code block | Its text (searchable) |
| Image | `alt` text |
| `niwaLink` | Target item's title at save time |
| Hard break | `\n` |
| Marks (bold, italic, link…) | Ignored (text only) |

- Collapse runs of whitespace; cap at **100 000 chars**.
- Text index: `title` (weight 10), `tags` (weight 5), `contentPlainText` (weight 1). Language `none` (no stemming) so mixed English/Japanese behaves predictably.
- Search excludes `deletedAt != null`; excludes `archivedAt != null` unless requested.
- Snippets: server returns up to 160 chars around the first match.
- Semantic search (embeddings) is M11 and builds on this same field.

---

## Open questions for owner

- [x] Trash auto-purge after 30 days — kept; published in the Privacy Policy (owner approved 2026-11-04).
- [x] Orphan grace period of 7 days — kept; published in the Privacy Policy.
- [x] Image size cap 10 MB — kept, plus a 200 MB per-account image quota (2026-11-04).

## Account preferences (NIWA-PLAN-B-02 V10, B-01 B8)

`users.preferences` (null until first changed; the API fills defaults): `theme`, `font`, `mode`
(`system`/`light`/`dark`) and `holidays { country, region, observances }`. Country/region are validated against
the server's `date-holidays` list and used only to compute public holidays (`GET /holidays`); nothing is sent to
a third party. Deleted with the account.
