/**
 * The note editor (TipTap) is the heaviest chunk. Start fetching it as soon as a tree is on screen or an item
 * is hovered, so opening a note doesn't wait on the download (NIWA-PLAN-B-02 V4). Repeated calls share one
 * request.
 */
let pending: ReturnType<typeof load> | null = null;
const load = () => import('./NoteEditor.tsx');

export function preloadNoteEditor() {
  pending ??= load();
  return pending;
}

/** Preload when the browser is idle (falls back to a short timeout). */
export function preloadNoteEditorWhenIdle() {
  if (pending) return;
  const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(() => void preloadNoteEditor());
  else window.setTimeout(() => void preloadNoteEditor(), 1500);
}
