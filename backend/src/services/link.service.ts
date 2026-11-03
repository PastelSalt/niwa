import type { CreateLinkInput, ItemLinksResponse, Link } from '@niwa/contracts';
import type { Types } from 'mongoose';
import { headingTitles } from '../lib/contentDoc.ts';
import { AppError, notFound } from '../lib/errors.ts';
import type { ItemDoc } from '../models/item.model.ts';
import type { LinkDoc } from '../models/link.model.ts';
import { itemRepo, toObjectId } from '../repositories/item.repo.ts';
import { linkRepo } from '../repositories/link.repo.ts';
import { toItemSummary } from './serializers.ts';

export function toLink(
  l: LinkDoc,
  sectionTitles?: Map<string, string>,
): Link & { targetSection: string | null } {
  return {
    id: l._id.toString(),
    sourceId: l.sourceId.toString(),
    targetId: l.targetId.toString(),
    targetAnchorId: l.targetAnchorId,
    label: l.label,
    origin: l.origin,
    createdAt: l.createdAt.toISOString(),
    targetSection: l.targetAnchorId ? (sectionTitles?.get(l.targetAnchorId) ?? null) : null,
  };
}

/** Links & backlinks — specs §4.1, CONCEPT.md §5, DATA_MODEL.md §7. */
export const linkService = {
  async forItem(workspaceId: string, id: string): Promise<ItemLinksResponse> {
    const wid = toObjectId(workspaceId);
    const item = await itemRepo.findById(wid, id);
    if (!item) throw notFound('Item');

    const [outgoing, incoming] = await Promise.all([
      linkRepo.bySource(wid, item._id),
      linkRepo.byTarget(wid, item._id),
    ]);
    const otherIds = [...outgoing.map((l) => l.targetId), ...incoming.map((l) => l.sourceId)];
    // Links to/from deleted items are kept but hidden (DATA_MODEL.md §7).
    const others = new Map(
      (await itemRepo.list(wid, { _id: { $in: otherIds } }, { includeInbox: true })).map((d) => [
        d._id.toString(),
        d,
      ]),
    );
    const ownSections = headingTitles(item.content);
    const targetSections = await sectionTitlesFor(wid, outgoing, others);

    const pair = (l: LinkDoc, otherId: Types.ObjectId, sections: Map<string, string> | undefined) => {
      const other = others.get(otherId.toString());
      return other ? [{ link: toLink(l, sections), item: toItemSummary(other) }] : [];
    };

    return {
      outgoing: outgoing.flatMap((l) => pair(l, l.targetId, targetSections.get(l.targetId.toString()))),
      backlinks: incoming.flatMap((l) => pair(l, l.sourceId, ownSections)),
    };
  },

  async createManual(workspaceId: string, input: CreateLinkInput): Promise<Link> {
    const wid = toObjectId(workspaceId);
    if (input.sourceId === input.targetId)
      throw new AppError('VALIDATION_ERROR', 'An item cannot link to itself.');
    const [source, target] = await Promise.all([
      itemRepo.findById(wid, input.sourceId),
      itemRepo.findById(wid, input.targetId),
    ]);
    if (!source || !target) throw notFound('Item');
    try {
      return toLink(
        await linkRepo.create({
          workspaceId: wid,
          sourceId: source._id,
          targetId: target._id,
          targetAnchorId: input.targetAnchorId ?? null,
          label: input.label ?? null,
          origin: 'manual',
        }),
      );
    } catch (err) {
      if ((err as { code?: number }).code === 11000)
        throw new AppError('CONFLICT', 'These items are already related.');
      throw err;
    }
  },

  async removeManual(workspaceId: string, id: string): Promise<void> {
    const wid = toObjectId(workspaceId);
    const link = await linkRepo.findById(wid, id);
    if (!link) throw notFound('Link');
    if (link.origin === 'content') {
      throw new AppError('CONFLICT', 'This link comes from the note text — remove it in the editor.');
    }
    await linkRepo.deleteById(wid, link._id);
  },

  /** Called after every content save. Only links to existing items in this workspace are kept. */
  async syncFromContent(
    workspaceId: Types.ObjectId,
    source: ItemDoc,
    desired: { targetId: string; targetAnchorId: string | null }[],
  ) {
    const candidates = desired.filter((d) => d.targetId !== source._id.toString());
    const existing = candidates.length
      ? new Set(
          (
            await itemRepo.list(
              workspaceId,
              { _id: { $in: candidates.map((d) => d.targetId) } },
              { includeInbox: true, includeArchived: true },
            )
          ).map((d) => d._id.toString()),
        )
      : new Set<string>();
    await linkRepo.syncContentLinks(
      workspaceId,
      source._id,
      candidates.filter((d) => existing.has(d.targetId)),
    );
  },
};

async function sectionTitlesFor(wid: Types.ObjectId, outgoing: LinkDoc[], others: Map<string, ItemDoc>) {
  const out = new Map<string, Map<string, string>>();
  const needing = [...new Set(outgoing.filter((l) => l.targetAnchorId).map((l) => l.targetId.toString()))];
  for (const id of needing) {
    if (!others.has(id)) continue;
    const full = await itemRepo.findById(wid, id);
    out.set(id, headingTitles(full?.content));
  }
  return out;
}
