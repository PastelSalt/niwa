import type { SearchHit, SearchQuery } from '@niwa/contracts';
import type { ItemDoc } from '../models/item.model.ts';
import { itemRepo, toObjectId } from '../repositories/item.repo.ts';
import { toItemSummary } from './serializers.ts';

/**
 * One search across titles, tags and note bodies — specs §3, DATA_MODEL.md §9.
 * Whole words come from the weighted text index; partial words fall back to a substring match.
 * Deleted items never appear; archived only on request; Inbox items are included.
 */

const SNIPPET_RADIUS = 80;
const ACTIONABLE = ['project', 'task'];
const KNOWLEDGE = ['note', 'idea'];

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function snippetOf(text: string, terms: string[]): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  const hit = terms
    .map((t) => lower.indexOf(t.toLowerCase()))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0];
  if (hit === undefined) return null;
  const start = Math.max(0, hit - SNIPPET_RADIUS);
  const end = Math.min(text.length, hit + SNIPPET_RADIUS);
  const body = text.slice(start, end).replace(/\s+/g, ' ').trim();
  return `${start > 0 ? '… ' : ''}${body}${end < text.length ? ' …' : ''}`;
}

function matchedIn(doc: ItemDoc, terms: string[]): SearchHit['matchedIn'] {
  const has = (s: string) => terms.some((t) => s.toLowerCase().includes(t.toLowerCase()));
  if (has(doc.title)) return 'title';
  if (doc.tags.some(has)) return 'tags';
  return 'content';
}

export const searchService = {
  async search(workspaceId: string, q: SearchQuery): Promise<SearchHit[]> {
    const wid = toObjectId(workspaceId);
    const filter: Record<string, unknown> = {};
    if (q.type) filter.type = q.type;
    else if (q.nature) filter.type = { $in: q.nature === 'actionable' ? ACTIONABLE : KNOWLEDGE };
    if (q.status) filter.status = q.status;
    if (q.tag) filter.tags = q.tag.toLowerCase();
    if (!q.includeArchived) filter.archivedAt = null;

    const terms = q.q.split(/\s+/).filter(Boolean);
    const text = await itemRepo.textSearch(wid, q.q, filter, q.limit);
    const seen = new Set(text.map((d) => d._id.toString()));

    // Partial-word fallback: every term must appear somewhere in title, tags or body.
    let extra: ItemDoc[] = [];
    if (text.length < q.limit) {
      const all = terms.map((t) => new RegExp(escapeRegex(t), 'i'));
      const candidates = await itemRepo.substringSearch(wid, all[0]!, filter, q.limit * 3);
      extra = candidates
        .filter((d) => !seen.has(d._id.toString()))
        .filter((d) =>
          all.every(
            (re) => re.test(d.title) || d.tags.some((t) => re.test(t)) || re.test(d.contentPlainText),
          ),
        )
        .slice(0, q.limit - text.length);
    }

    const toHit = (d: ItemDoc, score: number): SearchHit => ({
      item: toItemSummary(d),
      snippet: snippetOf(d.contentPlainText, terms),
      matchedIn: matchedIn(d, terms),
      score,
    });

    return [
      ...text.map((d) => toHit(d, d.score)),
      // Fallback hits rank below whole-word hits; title matches first among them.
      ...extra.map((d) => toHit(d, matchedIn(d, terms) === 'title' ? 0.5 : 0.1)),
    ];
  },
};
