import { ThemeProvider } from '@mui/material/styles';
import { DEFAULT_FONT, DEFAULT_THEME, isFontId, isThemeId, type FontId, type ThemeId } from '@niwa/tokens';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createNiwaTheme } from './theme.ts';

/**
 * Theme + font choice (NIWA-PLAN-B-02 V1.P4). The app starts on the defaults (Garden + Fredoka); signed-in
 * screens apply the user's choice with `useUserAppearance`, and public pages — which never call it — keep
 * the defaults. Light/dark stays MUI's colour scheme (`useColorScheme`).
 */
export interface Appearance {
  theme: ThemeId;
  font: FontId;
}

export const DEFAULT_APPEARANCE: Appearance = { theme: DEFAULT_THEME, font: DEFAULT_FONT };

/** Last choice of this browser, so a signed-in visit paints in the right theme before the API answers. */
const CACHE_KEY = 'niwa.appearance';

export function readCachedAppearance(): Appearance {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as Partial<Appearance> | null;
    return {
      theme: isThemeId(raw?.theme) ? raw.theme : DEFAULT_THEME,
      font: isFontId(raw?.font) ? raw.font : DEFAULT_FONT,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

function cacheAppearance(a: Appearance) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(a));
  } catch {
    /* private mode — the account copy (V10.P4) still applies */
  }
}

interface AppearanceContextValue {
  /** What is on screen now. */
  active: Appearance;
  /** Apply a choice (signed-in screens) or `null` to go back to the defaults (public pages). */
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
  // Stable, so effects that call it don't re-run when the theme changes.
  const apply = useCallback(
    (a: Appearance | null) =>
      setActive((prev) => {
        const next = a ?? DEFAULT_APPEARANCE;
        return prev.theme === next.theme && prev.font === next.font ? prev : next;
      }),
    [],
  );
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
 * Signed-in screens: show the user's theme and font while mounted, back to the defaults on sign-out.
 * Until preferences are stored on the account (V10.P4) the choice comes from this browser's cache.
 */
export function useUserAppearance(choice: Appearance = readCachedAppearance()) {
  const { apply } = useAppearance();
  const { theme, font } = choice;
  useEffect(() => {
    cacheAppearance({ theme, font });
    apply({ theme, font });
    return () => apply(null);
  }, [apply, theme, font]);
}
