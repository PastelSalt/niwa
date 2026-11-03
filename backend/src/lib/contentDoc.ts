import type { ProseMirrorDoc } from '@niwa/contracts';

/**
 * Structural helpers over ProseMirror JSON (TipTap) — CONCEPT.md §4–5.
 * Node names match the editor: `heading` (attrs.level, attrs.anchorId) and `niwaLink`
 * (attrs.itemId, attrs.anchorId, attrs.title).
 */

export interface PMNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  text?: string;
  marks?: unknown[];
}

const ID = /^[a-f0-9]{24}$/;

function walk(node: PMNode, visit: (n: PMNode) => void) {
  visit(node);
  for (const child of node.content ?? []) walk(child, visit);
}

/** Inline item links in a body, de-duplicated by (item, section). Malformed ids are ignored. */
export function extractContentLinks(doc: ProseMirrorDoc | null | undefined) {
  const out = new Map<string, { targetId: string; targetAnchorId: string | null }>();
  if (!doc) return [];
  walk(doc as PMNode, (n) => {
    if (n.type !== 'niwaLink') return;
    const targetId = n.attrs?.itemId;
    if (typeof targetId !== 'string' || !ID.test(targetId)) return;
    const anchor = typeof n.attrs?.anchorId === 'string' && n.attrs.anchorId ? n.attrs.anchorId : null;
    out.set(`${targetId}#${anchor ?? ''}`, { targetId, targetAnchorId: anchor });
  });
  return [...out.values()];
}

export function textOf(node: PMNode): string {
  let s = '';
  walk(node, (n) => {
    if (typeof n.text === 'string') s += n.text;
  });
  return s.trim();
}

/** Heading anchor → heading text, for backlink section names. */
export function headingTitles(doc: ProseMirrorDoc | null | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const node of ((doc as PMNode | null)?.content ?? []) as PMNode[]) {
    if (node.type === 'heading' && typeof node.attrs?.anchorId === 'string') {
      map.set(node.attrs.anchorId, textOf(node));
    }
  }
  return map;
}

export interface Section {
  start: number;
  end: number; // exclusive
  heading: PMNode;
  title: string;
  body: PMNode[];
}

/**
 * A section = a top-level heading plus everything until the next heading of the same or higher
 * level (CONCEPT.md §4.2). Returns null when the anchor isn't a top-level heading.
 */
export function findSection(doc: ProseMirrorDoc, anchorId: string): Section | null {
  const nodes = ((doc as PMNode).content ?? []) as PMNode[];
  const start = nodes.findIndex((n) => n.type === 'heading' && n.attrs?.anchorId === anchorId);
  if (start < 0) return null;
  const heading = nodes[start]!;
  const level = Number(heading.attrs?.level ?? 1);
  let end = start + 1;
  while (end < nodes.length) {
    const n = nodes[end]!;
    if (n.type === 'heading' && Number(n.attrs?.level ?? 1) <= level) break;
    end++;
  }
  return { start, end, heading, title: textOf(heading), body: nodes.slice(start + 1, end) };
}

/** Replace a section with a paragraph holding an inline link to the new child. */
export function replaceSectionWithLink(
  doc: ProseMirrorDoc,
  section: Section,
  child: { id: string; title: string },
) {
  const nodes = [...(((doc as PMNode).content ?? []) as PMNode[])];
  const linkParagraph: PMNode = {
    type: 'paragraph',
    content: [{ type: 'niwaLink', attrs: { itemId: child.id, anchorId: null, title: child.title } }],
  };
  nodes.splice(section.start, section.end - section.start, linkParagraph);
  return { ...doc, content: nodes } as ProseMirrorDoc;
}
