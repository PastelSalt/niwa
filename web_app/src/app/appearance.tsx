import { ThemeProvider, useColorScheme } from '@mui/material/styles';
import type { PreferencesInput } from '@niwa/contracts';
import { DEFAULT_FONT, DEFAULT_THEME, isFontId, isThemeId, type FontId, type ThemeId } from '@niwa/tokens';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth/AuthProvider.tsx';
import { ensureFontLoaded } from './fonts.ts';
import { createNiwaTheme } from './theme.ts';

/**
 * Theme + font choice (NIWA-PLAN-B-02 V1.P4, V10). The app starts on the defaults (Garden + Fredoka);
 * signed-in screens apply the account's choice with `useUserAppearance`, and public pages — which never call
 * it — keep the defaults. Light/dark is MUI's colour scheme, saved on the account too.
 */
export interface Appearance {
  theme: ThemeId;
  font: FontId;
}

export const DEFAULT_APPEARANCE: Appearance = { theme: DEFAULT_THEME, font: DEFAULT_FONT };

/** Last choice of this browser, so a signed-in visit paints in the right theme before the API answers. */
const CACHE_KEY = 'niwa.appearance';
/** Set once this browser's light/dark has been reconciled with the account. */
const MODE_MIGRATED_KEY = 'niwa.mode.onAccount';

/** Unknown or missing ids fall back to the defaults (another client may know newer themes). */
export function toAppearance(raw: { theme?: unknown; font?: unknown } | null | undefined): Appearance {
  return {
    theme: isThemeId(raw?.theme) ? raw.theme : DEFAULT_THEME,
    font: isFontId(raw?.font) ? raw.font : DEFAULT_FONT,
  };
}

export function readCachedAppearance(): Appearance {
  try {
    return toAppearance(JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as Partial<Appearance> | null);
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

function cacheAppearance(a: Appearance) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(a));
  } catch {
    /* private mode — the account copy still applies */
  }
}

interface AppearanceContextValue {
  /** What is on screen now. */
  active: Appearance;
  /**
   * Apply a choice (signed-in screens) or `null` to go back to the defaults (public pages). A new font is
   * loaded first, so the old one stays on screen until it's ready.
   */
  apply: (a: Appearance | null) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({
  children,
  defaultMode = 'system',
}: {
  children: ReactNode;
  defaultMode?: 'light' | 'dark' | 'system';
}) {
  const [active, setActive] = useState<Appearance>(DEFAULT_APPEARANCE);
  const theme = useMemo(() => createNiwaTheme(active.theme, active.font), [active.theme, active.font]);
  // The latest request wins when fonts finish loading out of order.
  const latest = useRef<Appearance>(DEFAULT_APPEARANCE);
  // Stable, so effects that call it don't re-run when the theme changes.
  const apply = useCallback((a: Appearance | null) => {
    const next = a ?? DEFAULT_APPEARANCE;
    latest.current = next;
    const commit = () => {
      if (latest.current !== next) return;
      setActive((prev) => (prev.theme === next.theme && prev.font === next.font ? prev : next));
    };
    // Same font: switch now. New font: wait until it's loaded so text doesn't flash.
    if (next.font === DEFAULT_FONT || typeof FontFace === 'undefined') commit();
    else void ensureFontLoaded(next.font).then(commit);
  }, []);
  const value = useMemo(() => ({ active, apply }), [active, apply]);
  return (
    <AppearanceContext.Provider value={value}>
      <ThemeProvider theme={theme} defaultMode={defaultMode} noSsr>
        {children}
      </ThemeProvider>
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error('useAppearance must be used inside <AppearanceProvider>');
  return ctx;
}

/**
 * Signed-in screens: show the account's theme, font and light/dark while mounted; back to the default
 * theme and font on sign-out. Before the account is known (or if it has no choice yet) the browser's cache
 * is used. `choice` overrides both (tests).
 */
export function useUserAppearance(choice?: Appearance) {
  const { apply } = useAppearance();
  const { mode: localMode, setMode } = useColorScheme();
  const { api, user } = useAuth();
  const prefs = user?.preferences;
  const { theme, font } = choice ?? (prefs ? toAppearance(prefs) : readCachedAppearance());
  const mode = prefs?.mode;

  useEffect(() => {
    cacheAppearance({ theme, font });
    apply({ theme, font });
    return () => apply(null);
  }, [apply, theme, font]);

  // The account's light/dark follows it to other browsers. The first time an account signs in here, a
  // light/dark picked in this browser before it was saved on accounts is kept and saved, not overridden.
  useEffect(() => {
    if (!mode) return;
    let migrated = true;
    try {
      migrated = localStorage.getItem(MODE_MIGRATED_KEY) === '1';
      localStorage.setItem(MODE_MIGRATED_KEY, '1');
    } catch {
      /* no storage: just follow the account */
    }
    if (!migrated && mode === 'system' && localMode && localMode !== 'system') {
      void api.account.setPreferences({ mode: localMode }).catch(() => {});
      return;
    }
    setMode(mode);
    // localMode is read once, at sign-in; following it afterwards would undo the account's choice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, setMode, api]);
}

/** Settings › Appearance: apply a change at once and save it on the account. */
export function useSavePreferences() {
  const { api } = useAuth();
  const { active, apply } = useAppearance();
  const { setMode } = useColorScheme();
  return useCallback(
    async (input: PreferencesInput) => {
      const next = toAppearance({ ...active, ...input });
      if (input.theme || input.font) {
        cacheAppearance(next);
        apply(next);
      }
      if (input.mode) setMode(input.mode);
      await api.account.setPreferences(input);
    },
    [active, api, apply, setMode],
  );
}
