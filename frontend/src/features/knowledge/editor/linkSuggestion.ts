import type { ItemSummary } from '@niwa/contracts';
import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import type { HeadingEntry } from './headings.ts';
import { LinkPicker, type LinkChoice, type LinkPickerHandle, type LinkPickerProps } from './LinkPicker.tsx';

export interface LinkSuggestionOptions {
  /** Candidate items (the filed tree, minus the note being edited). */
  getItems: () => ItemSummary[];
  fetchHeadings: (itemId: string) => Promise<HeadingEntry[]>;
}

const MAX_RESULTS = 8;

function rank(items: ItemSummary[], query: string): ItemSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, MAX_RESULTS);
  const starts = items.filter((i) => i.title.toLowerCase().startsWith(q));
  const contains = items.filter(
    (i) => !i.title.toLowerCase().startsWith(q) && i.title.toLowerCase().includes(q),
  );
  return [...starts, ...contains].slice(0, MAX_RESULTS);
}

/** Typing `[[` opens the item link picker (CONCEPT.md §5.2). */
export const LinkSuggestion = Extension.create<LinkSuggestionOptions>({
  name: 'linkSuggestion',

  addOptions() {
    return { getItems: () => [], fetchHeadings: async () => [] };
  },

  addProseMirrorPlugins() {
    const { getItems, fetchHeadings } = this.options;
    return [
      Suggestion<ItemSummary, LinkChoice>({
        editor: this.editor,
        pluginKey: new PluginKey('niwaLinkSuggestion'),
        char: '[[',
        allowSpaces: true,
        items: ({ query }) => rank(getItems(), query),
        command: ({ editor, range, props }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent([
              {
                type: 'niwaLink',
                attrs: {
                  itemId: props.item.id,
                  anchorId: props.heading?.anchorId ?? null,
                  title: props.item.title,
                  sectionTitle: props.heading?.text ?? null,
                },
              },
              { type: 'text', text: ' ' },
            ])
            .run();
        },
        render: () => {
          let renderer: ReactRenderer<LinkPickerHandle, LinkPickerProps> | null = null;
          return {
            onStart: (props) => {
              renderer = new ReactRenderer(LinkPicker, {
                editor: props.editor,
                props: {
                  items: props.items,
                  query: props.query,
                  clientRect: props.clientRect,
                  command: props.command,
                  fetchHeadings,
                },
              });
            },
            onUpdate: (props) =>
              renderer?.updateProps({
                items: props.items,
                query: props.query,
                clientRect: props.clientRect,
                command: props.command,
              }),
            onKeyDown: ({ event }) => {
              if (event.key === 'Escape') return false;
              return renderer?.ref?.onKeyDown(event) ?? false;
            },
            onExit: () => {
              renderer?.destroy();
              renderer = null;
            },
          };
        },
      }),
    ];
  },
});
