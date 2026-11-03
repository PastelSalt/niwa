import type { ProseMirrorDoc } from '@niwa/contracts';
import type { JSONContent } from '@tiptap/core';

export interface HeadingEntry {
  anchorId: string;
  level: number;
  text: string;
}

interface JsonNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: JsonNode[];
}

const textOf = (n: JsonNode): string => (n.text ?? '') + (n.content ?? []).map(textOf).join('');

/** Top-level H1–H3 of a stored body — the derived document outline (specs §5). */
export function headingsOf(doc: ProseMirrorDoc | null | undefined): HeadingEntry[] {
  const nodes = ((doc as JsonNode | null)?.content ?? []) as JsonNode[];
  return nodes
    .filter((n) => n.type === 'heading' && typeof n.attrs?.anchorId === 'string')
    .map((n) => ({
      anchorId: n.attrs!.anchorId as string,
      level: Number(n.attrs!.level ?? 1),
      text: textOf(n).trim() || 'Untitled heading',
    }));
}

/** Stored ProseMirror JSON → TipTap content (same shape; the contract type is looser). */
export function asEditorContent(doc: ProseMirrorDoc | null | undefined): JSONContent | string {
  return (doc as JSONContent | null | undefined) ?? '';
}
