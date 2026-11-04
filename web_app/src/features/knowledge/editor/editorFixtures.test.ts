import { generateJSON } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AnchoredHeading, NiwaImage, NiwaLink } from './extensions.ts';

/**
 * Note-body fixtures for the mobile ProseMirror ⇄ Quill Delta converter (NIWA-PLAN-A-02 MA6.P1),
 * produced by this editor's real schema so they match what the web stores. The mobile tests
 * round-trip each one.
 *
 * Checks the committed files; `UPDATE_EDITOR_FIXTURES=1 pnpm --filter @niwa/web test` rewrites them.
 */

// Same schema as NoteEditor (minus view-only extensions: placeholder, suggestion).
const extensions = [
  StarterKit.configure({ heading: false, link: { openOnClick: false, autolink: true } }),
  AnchoredHeading,
  NiwaLink,
  NiwaImage,
];

const link = (id: string, title: string, anchor?: string, section?: string) =>
  `<a data-niwa-link data-item-id="${id}"${anchor ? ` data-anchor-id="${anchor}"` : ''}${
    section ? ` data-section-title="${section}"` : ''
  }>${title}</a>`;

/** Content mobile edits natively — must round-trip identically. */
const SUPPORTED: Record<string, string> = {
  empty: '<p></p>',
  headings:
    '<h1 data-anchor-id="a1">Title</h1><h2 data-anchor-id="b2">Section</h2><h3 data-anchor-id="c3">Sub</h3><p>Body</p>',
  marks:
    '<p>plain <strong>bold</strong> <em>italic</em> <s>strike</s> <u>under</u> <code>code()</code> ' +
    '<a href="https://example.com">link</a> <strong><em>both</em></strong> ' +
    '<a href="https://niwa.test/x"><strong>bold link</strong></a></p>',
  breaks: '<p>line one<br>line two</p><p></p><p>after an empty paragraph</p>',
  lists:
    '<ul><li><p>one</p></li><li><p>two</p><ul><li><p>two.a</p></li><li><p>two.b</p><ol><li><p>deep</p></li></ol></li></ul></li><li><p>three</p></li></ul>' +
    '<ol><li><p>first</p></li><li><p>second <strong>bold</strong></p></li></ol>',
  blocks:
    '<blockquote><p>quoted</p><p>second quoted paragraph</p></blockquote>' +
    '<pre><code>const a = 1;\nconst b = 2;</code></pre><hr><p>after rule</p>',
  embeds:
    `<p>See ${link('6745f0c2a1b2c3d4e5f60718', 'Thesis outline')} and ` +
    `${link('6745f0c2a1b2c3d4e5f60719', 'Reading notes', 'b2', 'Section')}.</p>` +
    '<img src="https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/niwa/x.png" alt="Diagram" data-attachment-id="6745f0c2a1b2c3d4e5f60740">' +
    '<p>end</p>',
};

/** Valid web content mobile can't edit — must come back byte-identical as locked blocks. */
const LOCKED: Record<string, string> = {
  multiParagraphListItem: '<ul><li><p>item</p><p>second paragraph in the same item</p></li></ul><p>x</p>',
  quoteWithList: '<blockquote><ul><li><p>listed quote</p></li></ul></blockquote><p>x</p>',
  codeWithLanguage: '<pre><code class="language-ts">let x: number;</code></pre><p>x</p>',
  orderedFromThree: '<ol start="3"><li><p>third</p></li></ol><p>x</p>',
};

// Vitest runs from web_app/ (jsdom's import.meta.url isn't a file URL).
const dir = `${resolve(process.cwd(), '../flutter_app/test/fixtures/editor')}/`;
const update = process.env.UPDATE_EDITOR_FIXTURES === '1';

function check(name: string, html: string) {
  const json = `${JSON.stringify(generateJSON(html, extensions), null, 2)}\n`;
  const path = `${dir}${name}.json`;
  if (update) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(path, json);
    return;
  }
  let committed = '';
  try {
    committed = readFileSync(path, 'utf8');
  } catch {
    // missing → mismatch below
  }
  expect(committed, `${name}.json is stale — run with UPDATE_EDITOR_FIXTURES=1`).toBe(json);
}

describe('mobile editor fixtures', () => {
  for (const [name, html] of Object.entries(SUPPORTED)) it(`supported/${name}`, () => check(name, html));
  for (const [name, html] of Object.entries(LOCKED))
    it(`locked/${name}`, () => check(`locked_${name}`, html));
});
