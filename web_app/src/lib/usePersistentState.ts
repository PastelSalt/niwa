import { useCallback, useState } from 'react';

/** useState mirrored to localStorage — per-viewer UI conveniences only (expanded nodes, toggles). */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // storage unavailable (private mode) — keep in memory only
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, set] as const;
}
