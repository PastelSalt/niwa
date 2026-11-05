import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { DESTINATIONS } from './destinations.tsx';

const SEQUENCE_TIMEOUT_MS = 1000;

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * `g t` Today · `g g` Garden · `g c` Calendar · `g i` Inbox · `g s` Search; `/` or Ctrl+K opens the command box;
 * `c` captures (CONCEPT.md §1.4, B-01 B9).
 * Ignored while typing in a field or the editor.
 */
export function useGlobalShortcuts(openCommand: () => void, capture: () => void) {
  const navigate = useNavigate();

  useEffect(() => {
    let pendingG: number | null = null;

    const onKey = (e: KeyboardEvent) => {
      // Ctrl+K / ⌘K opens the command box from anywhere, even while typing.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCommand();
        return;
      }
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
        openCommand();
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
  }, [navigate, openCommand, capture]);
}
