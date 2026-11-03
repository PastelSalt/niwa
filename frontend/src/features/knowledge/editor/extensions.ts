import { Extension, mergeAttributes, Node } from '@tiptap/core';
import Heading from '@tiptap/extension-heading';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NiwaLinkView } from './NiwaLinkView.tsx';

/** Short random id for heading anchors (CONCEPT.md §5.1). */
export function newAnchorId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** H1–H3 with a stable `anchorId`, rendered as `id="h-<anchorId>"` for deep links. */
export const AnchoredHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      anchorId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-anchor-id'),
        renderHTML: (attrs) =>
          attrs.anchorId ? { 'data-anchor-id': attrs.anchorId, id: `h-${attrs.anchorId}` } : {},
      },
    };
  },
}).configure({ levels: [1, 2, 3] });

/**
 * Keeps heading anchors present and unique: new headings get one, and copies (paste, split)
 * get a fresh one so two sections never share a link target.
 */
export const AnchorGuard = Extension.create({
  name: 'anchorGuard',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('anchorGuard'),
        appendTransaction: (transactions, _old, state) => {
          if (!transactions.some((t) => t.docChanged)) return null;
          const seen = new Set<string>();
          const tr = state.tr;
          state.doc.descendants((node, pos) => {
            if (node.type.name !== 'heading') return;
            const id = node.attrs.anchorId as string | null;
            if (!id || seen.has(id)) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, anchorId: newAnchorId() });
            } else {
              seen.add(id);
            }
          });
          return tr.docChanged ? tr.setMeta('addToHistory', false) : null;
        },
      }),
    ];
  },
});

export interface NiwaLinkAttrs {
  itemId: string;
  anchorId: string | null;
  /** Title snapshot at insert time — fallback display and search text; the view shows the live title. */
  title: string;
  /** Heading text snapshot when linking to a section. */
  sectionTitle: string | null;
}

/** Inline link to another item (optionally a section) — CONCEPT.md §5.2. */
export const NiwaLink = Node.create({
  name: 'niwaLink',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      itemId: { default: null, parseHTML: (el) => el.getAttribute('data-item-id') },
      anchorId: { default: null, parseHTML: (el) => el.getAttribute('data-anchor-id') },
      title: { default: '', parseHTML: (el) => el.textContent ?? '' },
      sectionTitle: { default: null, parseHTML: (el) => el.getAttribute('data-section-title') },
    };
  },

  parseHTML() {
    return [{ tag: 'a[data-niwa-link]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { itemId, anchorId, title, sectionTitle } = node.attrs as NiwaLinkAttrs;
    return [
      'a',
      mergeAttributes(HTMLAttributes, {
        'data-niwa-link': '',
        'data-item-id': itemId,
        'data-anchor-id': anchorId ?? undefined,
        'data-section-title': sectionTitle ?? undefined,
        href: `/items/${itemId}${anchorId ? `#h-${anchorId}` : ''}`,
      }),
      title,
    ];
  },

  renderText({ node }) {
    return `[[${(node.attrs as NiwaLinkAttrs).title}]]`;
  },

  addNodeView() {
    return ReactNodeViewRenderer(NiwaLinkView, { as: 'span' });
  },
});
