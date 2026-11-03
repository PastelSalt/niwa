/**
 * NIWA design tokens — the single source for colors and type (specs §1, §10.1).
 * Consumed by the MUI theme (web_app/desktop) and, later, generated into a Dart theme (mobile).
 * Never hardcode these values elsewhere.
 */

export type ColorMode = 'light' | 'dark';

export interface Palette {
  /** Sage green — primary accent */
  primary: string;
  primaryContrast: string;
  /** Cherry-blossom pink — secondary accent */
  secondary: string;
  secondaryContrast: string;
  /** Warm cream page background (light) / deep moss (dark) */
  background: string;
  /** Cards, panels, drawers */
  surface: string;
  /** Deep charcoal body text */
  textPrimary: string;
  /** Muted gray-green secondary text */
  textSecondary: string;
  divider: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export const palettes: Record<ColorMode, Palette> = {
  light: {
    primary: '#59765C', // sage, deepened for WCAG AA (4.5:1 on cream and with white text)
    primaryContrast: '#FFFFFF',
    secondary: '#E3A1B4',
    secondaryContrast: '#2B2B2B',
    background: '#FAF6EE',
    surface: '#FFFDF8',
    textPrimary: '#2B2B2B',
    textSecondary: '#66756A',
    divider: '#E4DED2',
    error: '#B5524C',
    warning: '#B8843C',
    success: '#527D55',
    info: '#4F7389',
  },
  dark: {
    primary: '#9DBFA1',
    primaryContrast: '#1A1D1B',
    secondary: '#F0B8C8',
    secondaryContrast: '#1A1D1B',
    background: '#1A1D1B',
    surface: '#232825',
    textPrimary: '#ECEAE3',
    textSecondary: '#A3B0A6',
    divider: '#343B36',
    error: '#E08A84',
    warning: '#E2B36F',
    success: '#93BD96',
    info: '#8FB3C8',
  },
};

/** Item-type accents (tree icons, scheduler blocks). */
export const typeColors: Record<ColorMode, Record<'project' | 'task' | 'note' | 'idea', string>> = {
  // Icon colours need 3:1 against the background (WCAG 1.4.11).
  light: { project: '#59765C', task: '#4F7389', note: '#7D6E52', idea: '#B17E8C' },
  dark: { project: '#9DBFA1', task: '#8FB3C8', note: '#C9B78E', idea: '#F0B8C8' },
};

export const typography = {
  fontFamily: '"Inter", "Noto Sans JP", system-ui, -apple-system, "Segoe UI", sans-serif',
  monoFamily: '"JetBrains Mono", "Noto Sans Mono", ui-monospace, monospace',
  baseSize: 14,
} as const;

export const shape = {
  radius: 10,
  radiusSmall: 6,
} as const;

/** 4px spacing grid. */
export const spacingUnit = 4;
