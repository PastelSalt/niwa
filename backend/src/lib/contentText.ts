import { CONTENT_MAX_BYTES, type ProseMirrorDoc } from '@niwa/contracts';
import { AppError } from './errors.ts';

/** Plain-text mirror of a ProseMirror doc for search — DATA_MODEL.md §9. */

const MAX_PLAIN_TEXT = 100_000;
const BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'listItem',
  'blockquote',
  'codeBlock',
  'tableCell',
  'tableHeader',
  'taskItem',
]);

interface PMNode {
  type?: unknown;
  text?: unknown;
  attrs?: Record<string, unknown>;
  content?: unknown;
}

export function extractPlainText(doc: ProseMirrorDoc | null | undefined): string {
  if (!doc) return '';
  const parts: string[] = [];

  const walk = (node: PMNode) => {
    if (typeof node.text === 'string') parts.push(node.text);
    if (node.type === 'hardBreak') parts.push('\n');
    if (node.type === 'image' && typeof node.attrs?.alt === 'string') parts.push(` ${node.attrs.alt} `);
    if (node.type === 'niwaLink' && typeof node.attrs?.title === 'string') parts.push(node.attrs.title);
    if (Array.isArray(node.content)) for (const child of node.content) walk(child as PMNode);
    if (typeof node.type === 'string' && BLOCK_TYPES.has(node.type)) parts.push('\n');
  };
  walk(doc as PMNode);

  return parts
    .join('')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
    .slice(0, MAX_PLAIN_TEXT);
}

export function assertContentSize(doc: ProseMirrorDoc | null | undefined): void {
  if (doc && Buffer.byteLength(JSON.stringify(doc)) > CONTENT_MAX_BYTES) {
    throw new AppError('VALIDATION_ERROR', 'Content is too large (max 1 MB).');
  }
}
