import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { DESTINATIONS } from './destinations.tsx';

const SEQUENCE_TIMEOUT_MS = 1000;

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * `g k` / `g a` / `g s` / `g i` navigate, `/` focuses search, `c` captures (CONCEPT.md §1.4).
 * Ignored while typing in a field or the editor.
 */
export function useGlobalShortcuts(focusSearch: () => void, capture: () => void) {
  const navigate = useNavigate();

  useEffect(() => {
    let pendingG: number | null = null;

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;

      if (pendingG !== null) {
        window.clearTimeout(pendingG);
        pendingG = null;
        const dest = DESTINATIONS.find((d) => d.shortcut === e.key.toLowerCase());
        if (dest) {
          e.preventDefault();
          navigate(dest.path);
        }
        return;
      }
      if (e.key === 'g') {
        pendingG = window.setTimeout(() => (pendingG = null), SEQUENCE_TIMEOUT_MS);
      } else if (e.key === '/') {
        e.preventDefault();
        focusSearch();
      } else if (e.key === 'c' && !document.querySelector('[role="dialog"]')) {
        e.preventDefault();
        capture();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (pendingG !== null) window.clearTimeout(pendingG);
    };
  }, [navigate, focusSearch, capture]);
}
