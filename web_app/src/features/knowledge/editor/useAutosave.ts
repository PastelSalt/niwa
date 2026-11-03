import { ApiError } from '@niwa/api-client';
import type { Item, ProseMirrorDoc } from '@niwa/contracts';
import { useQueryClient } from '@tanstack/react-query';
import type { Editor } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { messageOf } from '../../../api/client.ts';
import { useAuth } from '../../../auth/AuthProvider.tsx';
import { useNotify } from '../../../components/Notifier.tsx';
import { itemKeys, storeItem } from '../../items/queries.ts';
import { knowledgeKeys } from '../queries.ts';
import { asEditorContent } from './headings.ts';

export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error' | 'conflict';

const DEBOUNCE_MS = 800;
const str = (doc: unknown) => JSON.stringify(doc ?? null);

/**
 * Debounced, version-checked autosave for an item body (M4.P1).
 * - Always saves against the latest cached version, so field edits in the detail panel don't conflict.
 * - A 409 whose server content equals what we last saved is a field-only change → retried silently.
 * - A real content conflict pauses saving and lets the user keep theirs or load the latest.
 */
export function useAutosave(item: Item, editor: Editor | null) {
  const { api } = useAuth();
  const qc = useQueryClient();
  const notify = useNotify();
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [conflict, setConflict] = useState<Item | null>(null);
  const lastSaved = useRef(str(item.content));
  const timer = useRef<number | undefined>(undefined);
  const inFlight = useRef<Promise<void> | null>(null);
  const paused = useRef(false);
  // flush re-runs itself after an in-flight save or a silent retry; the ref avoids a self-referencing callback.
  const flushRef = useRef<() => Promise<void>>(async () => {});

  // Baseline = the editor's own serialization of what was loaded. TipTap normalizes stored JSON
  // (default attrs, an empty paragraph for a missing body), and opening a note must not count as an edit.
  useEffect(() => {
    if (editor) lastSaved.current = str(editor.getJSON());
  }, [editor]);

  const currentVersion = useCallback(
    () => qc.getQueryData<{ item: Item }>(itemKeys.item(item.id))?.item.version ?? item.version,
    [qc, item.id, item.version],
  );

  const accept = useCallback(
    (saved: Item) => {
      lastSaved.current = str(saved.content);
      storeItem(qc, saved);
      void qc.invalidateQueries({ queryKey: knowledgeKeys.links(item.id) });
    },
    [qc, item.id],
  );

  const flush = useCallback(async (): Promise<void> => {
    window.clearTimeout(timer.current);
    if (!editor || editor.isDestroyed || paused.current) return;
    if (inFlight.current) {
      await inFlight.current;
      return flushRef.current();
    }
    const doc = editor.getJSON() as ProseMirrorDoc;
    const body = str(doc);
    if (body === lastSaved.current) {
      setStatus('saved');
      return;
    }
    setStatus('saving');
    let retry = false;
    inFlight.current = (async () => {
      try {
        const res = await api.items.update(item.id, { version: currentVersion(), content: doc });
        accept(res.item);
        setStatus(editor.isDestroyed || str(editor.getJSON()) === body ? 'saved' : 'dirty');
      } catch (err) {
        if (err instanceof ApiError && err.code === 'VERSION_CONFLICT') {
          const current = (err.details as { current?: Item } | undefined)?.current;
          if (current && str(current.content) === lastSaved.current) {
            qc.setQueryData(itemKeys.item(item.id), { item: current });
            retry = true;
          } else if (current) {
            paused.current = true;
            setConflict(current);
            setStatus('conflict');
          }
        } else {
          setStatus('error');
          notify(messageOf(err), { severity: 'error' });
        }
      } finally {
        inFlight.current = null;
      }
    })();
    await inFlight.current;
    if (retry) return flushRef.current();
  }, [editor, api, item.id, currentVersion, accept, qc, notify]);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const schedule = useCallback(() => {
    if (paused.current) return;
    setStatus('dirty');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), DEBOUNCE_MS);
  }, [flush]);

  // Save on leave; warn before closing the tab with unsaved text.
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (editor && !editor.isDestroyed && str(editor.getJSON()) !== lastSaved.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      void flush();
    };
  }, [editor, flush]);

  const keepMine = useCallback(() => {
    if (!conflict) return;
    qc.setQueryData(itemKeys.item(item.id), { item: conflict });
    lastSaved.current = str(conflict.content);
    paused.current = false;
    setConflict(null);
    void flush();
  }, [conflict, qc, item.id, flush]);

  const loadLatest = useCallback(() => {
    if (!conflict || !editor) return;
    editor.commands.setContent(asEditorContent(conflict.content), { emitUpdate: false });
    accept(conflict);
    paused.current = false;
    setConflict(null);
    setStatus('saved');
  }, [conflict, editor, accept]);

  /** Replace the body with server content (e.g. after promoting a section). */
  const replaceWith = useCallback(
    (saved: Item) => {
      editor?.commands.setContent(asEditorContent(saved.content), { emitUpdate: false });
      accept(saved);
      setStatus('saved');
    },
    [editor, accept],
  );

  return { status, conflict, schedule, flush, keepMine, loadLatest, replaceWith, currentVersion };
}
