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

/**
 * Mobile (Flutter) type settings, generated into Dart. The web uses `fonts` and `typeScale` below
 * (NIWA-PLAN-B-02 V1); mobile adopts them later (A-02).
 */
export const typography = {
  fontFamily: '"Inter", "Noto Sans JP", system-ui, -apple-system, "Segoe UI", sans-serif',
  monoFamily: '"JetBrains Mono", "Noto Sans Mono", ui-monospace, monospace',
  baseSize: 14,
} as const;

// ---------------------------------------------------------------------------------------------------------
// Web design foundations (NIWA-PLAN-B-02 V1). Screens use these through the MUI theme, never as literals.
// ---------------------------------------------------------------------------------------------------------

/** One step of the type scale. `size` in px; `lineHeight` unitless; `letterSpacing` in em. */
export interface TypeStep {
  size: number;
  weight: number;
  lineHeight: number;
  letterSpacing?: number;
}

export type TypeRole = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'small' | 'caption';

/**
 * The type scale (V1.P1). Body text is 15 px; nothing readable is smaller than 12 px.
 * - display: landing hero, policy page titles
 * - title: item and screen titles (responsive — see `responsiveTitle`)
 * - heading: section headings inside a screen
 * - subheading: group headers, dialog titles
 * - body: running text and list rows
 * - small: secondary lines (paths, meta), dense controls
 * - caption: chips, timestamps, scheduler labels
 */
export const typeScale: Record<TypeRole, TypeStep> = {
  display: { size: 40, weight: 600, lineHeight: 1.12, letterSpacing: -0.02 },
  title: { size: 28, weight: 600, lineHeight: 1.2, letterSpacing: -0.01 },
  heading: { size: 20, weight: 600, lineHeight: 1.3 },
  subheading: { size: 17, weight: 600, lineHeight: 1.35 },
  body: { size: 15, weight: 400, lineHeight: 1.55 },
  small: { size: 13, weight: 400, lineHeight: 1.45 },
  caption: { size: 12, weight: 500, lineHeight: 1.35 },
};

/** Item titles shrink on phones so long titles don't take four lines: [min px, max px] (V1.P1). */
export const responsiveTitle = { min: 22, max: 28 } as const;
/** The landing hero / policy titles: [min px, max px]. */
export const responsiveDisplay = { min: 32, max: 52 } as const;

export type FontId = 'fredoka' | 'inter' | 'system';

export interface FontToken {
  /** Name shown in the font picker. */
  label: string;
  /** CSS font-family list, the self-hosted family first (registered by the web app's font loader). */
  stack: string;
  /** Per-font adjustments over `typeScale`, so a wider or tighter face reads the same at 15 px. */
  tune: Partial<Record<TypeRole, Partial<TypeStep>>>;
}

const FALLBACK = '"Noto Sans JP", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/**
 * Fonts (V1.P4 plumbing; picker in V10). Only the selected family's files are downloaded.
 * Fredoka is rounded and wide, so it gets more line height, a touch of tracking, and medium-weight headings
 * (its 600–700 look heavy); Inter is tighter and keeps the base scale.
 */
export const fonts: Record<FontId, FontToken> = {
  fredoka: {
    label: 'Fredoka',
    stack: `"Fredoka Variable", ${FALLBACK}`,
    tune: {
      display: { weight: 600, letterSpacing: -0.01 },
      title: { weight: 600, letterSpacing: 0 },
      heading: { weight: 600 },
      subheading: { weight: 600 },
      body: { lineHeight: 1.6, letterSpacing: 0.005 },
      small: { lineHeight: 1.5, letterSpacing: 0.005 },
      caption: { weight: 500, letterSpacing: 0.01 },
    },
  },
  inter: {
    label: 'Inter',
    stack: `"Inter Variable", "Inter", ${FALLBACK}`,
    tune: {},
  },
  system: {
    label: 'System',
    stack: FALLBACK,
    tune: {},
  },
};

/** The scale for one font: `typeScale` with the font's tuning applied. */
export function typeScaleFor(font: FontId): Record<TypeRole, TypeStep> {
  const tune = fonts[font].tune;
  return Object.fromEntries(
    (Object.keys(typeScale) as TypeRole[]).map((role) => [role, { ...typeScale[role], ...tune[role] }]),
  ) as Record<TypeRole, TypeStep>;
}

export const monoStack = '"JetBrains Mono", "Noto Sans Mono", ui-monospace, monospace';

/**
 * Content widths in px (V1.P2).
 * - reading: note bodies, ~70 characters
 * - list: Focus, Inbox, Search, Trash, Knowledge home
 * - form: Settings, account forms
 * - wide: Scheduler
 * - narrow: auth cards, small forms, empty states
 */
export const contentWidth = {
  /** Floating cards (onboarding tour step). */
  card: 360,
  narrow: 420,
  reading: 720,
  form: 760,
  list: 880,
  wide: 1280,
} as const;
export type ContentWidth = keyof typeof contentWidth;

/** Named gaps in MUI spacing units (1 = 8 px); halves keep everything on the 4 px grid. */
export const gaps = {
  /** Between elements inside a row (icon ↔ text, chip ↔ chip). */
  inline: 1,
  /** Between rows or fields in a stack. */
  row: 1.5,
  /** Between groups inside a section. */
  stack: 2,
  /** Between sections of a screen. */
  section: 4,
  /** Page padding: phones / larger. */
  pageX: { xs: 2, md: 4 },
  pageY: { xs: 2, md: 4 },
} as const;

/** Icon sizes in px (V1.P3). */
export const iconSize = {
  inline: 16,
  row: 20,
  nav: 24,
  feature: 32,
  emptyState: 48,
} as const;

/** Motion (V1.P3): durations in ms; the web theme turns all of them off under prefers-reduced-motion. */
export const motion = {
  short: 120,
  medium: 200,
  long: 280,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
  easingExit: 'cubic-bezier(0.3, 0, 1, 1)',
} as const;

/**
 * Surfaces (V1.P3). Cards and panels are flat with a hairline border; only floating layers cast a shadow.
 * Shadow colours are part of the token set so dark mode can use deeper ones.
 */
export const elevation: Record<ColorMode, { card: string; popover: string; dialog: string }> = {
  light: {
    card: 'none',
    popover: '0 6px 24px rgba(43, 43, 43, 0.12), 0 1px 3px rgba(43, 43, 43, 0.08)',
    dialog: '0 16px 48px rgba(43, 43, 43, 0.18), 0 2px 6px rgba(43, 43, 43, 0.08)',
  },
  dark: {
    card: 'none',
    popover: '0 6px 24px rgba(0, 0, 0, 0.45), 0 1px 3px rgba(0, 0, 0, 0.3)',
    dialog: '0 16px 48px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(0, 0, 0, 0.3)',
  },
};

export type StatusRole = 'not_started' | 'in_progress' | 'blocked' | 'completed';
export type PriorityRole = 'none' | 'low' | 'medium' | 'high' | 'critical';

/** Which palette colour carries each status / priority (V1.P3) — roles, so every theme maps them the same. */
const STATUS_FROM: Record<StatusRole, keyof Palette> = {
  not_started: 'textSecondary',
  in_progress: 'info',
  blocked: 'warning',
  completed: 'success',
};
const PRIORITY_FROM: Record<PriorityRole, keyof Palette> = {
  none: 'textSecondary',
  low: 'info',
  medium: 'success',
  high: 'warning',
  critical: 'error',
};

export function statusColors(p: Palette): Record<StatusRole, string> {
  return Object.fromEntries(Object.entries(STATUS_FROM).map(([k, v]) => [k, p[v]])) as Record<
    StatusRole,
    string
  >;
}
export function priorityColors(p: Palette): Record<PriorityRole, string> {
  return Object.fromEntries(Object.entries(PRIORITY_FROM).map(([k, v]) => [k, p[v]])) as Record<
    PriorityRole,
    string
  >;
}

export type ThemeId = 'garden';

export interface ThemeToken {
  label: string;
  palettes: Record<ColorMode, Palette>;
  typeColors: Record<ColorMode, Record<'project' | 'task' | 'note' | 'idea', string>>;
}

/**
 * Colour themes (V1.P4 plumbing). `garden` is today's sage-and-blossom palette; its pastel redesign and the
 * other pastel themes (Blossom, Lavender, Sky, Peach) arrive in V10 after the owner approves the values.
 */
export const themes: Record<ThemeId, ThemeToken> = {
  garden: { label: 'Garden', palettes, typeColors },
};

export const DEFAULT_THEME: ThemeId = 'garden';
export const DEFAULT_FONT: FontId = 'fredoka';

export const isThemeId = (v: unknown): v is ThemeId => typeof v === 'string' && v in themes;
export const isFontId = (v: unknown): v is FontId => typeof v === 'string' && v in fonts;

export const shape = {
  radius: 10,
  radiusSmall: 6,
} as const;

/** 4px spacing grid. */
export const spacingUnit = 4;
