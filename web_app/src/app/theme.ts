import { createTheme, type ColorSystemOptions, type Theme } from '@mui/material/styles';
import type { TypographyStyle, TypographyVariantsOptions } from '@mui/material/styles';

type TypographyStyleOptionsLike = NonNullable<TypographyVariantsOptions['body1']>;
import {
  contentWidth,
  DEFAULT_FONT,
  DEFAULT_THEME,
  elevation,
  fonts,
  gaps,
  iconSize,
  monoStack,
  motion,
  priorityColors,
  responsiveDisplay,
  responsiveTitle,
  shape,
  statusColors,
  themes,
  typeScaleFor,
  type ColorMode,
  type FontId,
  type PriorityRole,
  type StatusRole,
  type ThemeId,
  type ThemePalette,
  type TypeStep,
  densities,
  layouts,
  mixHex,
  pageTint,
  type DensityId,
  type LayoutId,
  type LayoutToken,
} from '@niwa/tokens';
import { DEFAULT_PREFERENCES, type BackgroundPreference } from '@niwa/contracts';
import { fontFacesFor } from './fonts.ts';

/**
 * The MUI theme, built at runtime from a theme id + font id (NIWA-PLAN-B-02 V1.P4); light/dark stays MUI's
 * colour scheme. Everything comes from @niwa/tokens — no colour, font size or content width literals in
 * screens (specs §1, §11.7).
 */

type ItemTypeColors = (typeof themes)['garden']['typeColors']['light'];

/** Design vocabulary screens read through `theme.niwa` (widths, gaps, icon sizes, motion). */
/** A layout with the user's options applied (B-03 C5). */
export interface ResolvedLayout extends LayoutToken {
  id: LayoutId;
  /** Row heights for the chosen density. */
  rows: { row: number; tree: number };
}

export function resolveLayout(
  id: LayoutId = 'scrapbook',
  opts: { density?: DensityId | null; sidebar?: 'labels' | 'icons' | null; stickers?: boolean | null } = {},
): ResolvedLayout {
  const base = layouts[id] ?? layouts.scrapbook;
  const density = opts.density ?? base.density;
  return {
    ...base,
    id: layouts[id] ? id : 'scrapbook',
    density,
    sidebar: opts.sidebar ?? base.sidebar,
    stickers: opts.stickers ?? base.stickers,
    rows: { row: densities[density].row, tree: densities[density].tree },
  };
}

export const DEFAULT_LAYOUT = resolveLayout();

export interface NiwaThemeExtras {
  themeId: ThemeId;
  fontId: FontId;
  layout: ResolvedLayout;
  /** Page pattern (B-03 C2). */
  background: BackgroundPreference;
  width: typeof contentWidth;
  gaps: typeof gaps;
  iconSize: typeof iconSize;
  motion: typeof motion;
  monoFamily: string;
}

declare module '@mui/material/styles' {
  interface Palette {
    itemType: ItemTypeColors;
    /** Scrapbook surfaces (B-03 C1): tinted shadows, sticker outline/shadow, the page tint. */
    surface: SurfaceColors;
    /** Pastel fill + deep text for contained buttons and selections (V10). */
    primaryContainer: { main: string; contrastText: string };
    status: Record<StatusRole, string>;
    priority: Record<PriorityRole, string>;
  }
  interface PaletteOptions {
    itemType?: ItemTypeColors;
    surface?: SurfaceColors;
    primaryContainer?: { main: string; contrastText: string };
    status?: Record<StatusRole, string>;
    priority?: Record<PriorityRole, string>;
  }
  interface Theme {
    niwa: NiwaThemeExtras;
  }
  interface ThemeOptions {
    niwa?: NiwaThemeExtras;
  }
}

declare module '@mui/material/styles' {
  interface TypographyVariants {
    lead: TypographyStyle;
  }
  interface TypographyVariantsOptions {
    lead?: TypographyStyleOptionsLike;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    /** Intro paragraphs under a page or section heading. */
    lead: true;
  }
}

declare module '@mui/material/SvgIcon' {
  interface SvgIconPropsSizeOverrides {
    /** 16 px — inside text and dense buttons. */
    inline: true;
    /** 32 px — feature lists. */
    feature: true;
    /** 48 px — empty states. */
    emptyState: true;
  }
}

interface SurfaceColors {
  shadow: string;
  lift: string;
  outline: string;
  sticker: string;
  page: string;
  edge: string;
}

const rgba = (hex: string, a: number) =>
  `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ')} / ${a})`;

/** Tinted, never grey-black shadows (like the fan site's paper), a sticker outline and the page tint. */
function surfaceColors(p: ThemePalette, mode: ColorMode): SurfaceColors {
  const tint = mixHex(p.primary, p.textPrimary, 0.5);
  return mode === 'light'
    ? {
        shadow: `inset 0 1px 0 rgb(255 255 255 / 0.85), 0 12px 26px -16px ${rgba(tint, 0.4)}, 0 2px 6px -2px ${rgba(tint, 0.16)}`,
        lift: `0 22px 42px -20px ${rgba(tint, 0.45)}, 0 6px 14px -6px ${rgba(tint, 0.22)}`,
        outline: p.textPrimary,
        sticker: p.secondary,
        page: pageTint(p, mode),
        edge: 'rgb(255 255 255 / 0.75)',
      }
    : {
        shadow: '0 12px 26px -14px rgb(0 0 0 / 0.6), 0 2px 6px -2px rgb(0 0 0 / 0.35)',
        lift: '0 22px 42px -18px rgb(0 0 0 / 0.65), 0 6px 14px -6px rgb(0 0 0 / 0.4)',
        outline: p.textSecondary,
        sticker: mixHex(p.secondary, p.background, 0.55),
        page: pageTint(p, mode),
        edge: p.divider,
      };
}

function colorScheme(p: ThemePalette, types: ItemTypeColors, mode: ColorMode): ColorSystemOptions {
  return {
    palette: {
      itemType: types,
      surface: surfaceColors(p, mode),
      primaryContainer: { main: p.primaryContainer, contrastText: p.onPrimaryContainer },
      status: statusColors(p),
      priority: priorityColors(p),
      primary: { main: p.primary, contrastText: p.primaryContrast },
      secondary: { main: p.secondary, contrastText: p.secondaryContrast },
      background: { default: p.background, paper: p.surface },
      text: { primary: p.textPrimary, secondary: p.textSecondary },
      divider: p.divider,
      error: { main: p.error },
      warning: { main: p.warning },
      success: { main: p.success },
      info: { main: p.info },
    },
  };
}

const rem = (px: number) => `${px / 16}rem`;

/** Fluid size between 360 px and 1440 px viewports. */
export function fluid(min: number, max: number): string {
  const slope = (max - min) / (1440 - 360);
  const base = min - slope * 360;
  return `clamp(${rem(min)}, ${rem(base)} + ${(slope * 100).toFixed(3)}vw, ${rem(max)})`;
}

function step(s: TypeStep, size: string = rem(s.size)): TypographyStyleOptionsLike {
  return {
    fontSize: size,
    fontWeight: s.weight,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing ? `${s.letterSpacing}em` : undefined,
  };
}

/** Shadows by layer; dark mode uses deeper ones (V1.P3). */
const layered = (layer: 'popover' | 'dialog') => (theme: Theme) => ({
  boxShadow: elevation.light[layer],
  ...theme.applyStyles('dark', { boxShadow: elevation.dark[layer] }),
});

export function createNiwaTheme(
  themeId: ThemeId = DEFAULT_THEME,
  fontId: FontId = DEFAULT_FONT,
  layout: ResolvedLayout = DEFAULT_LAYOUT,
  background: BackgroundPreference = DEFAULT_PREFERENCES.background,
): Theme {
  const t = themes[themeId];
  const s = typeScaleFor(fontId);
  const modes: ColorMode[] = ['light', 'dark'];
  const schemes = Object.fromEntries(modes.map((m) => [m, colorScheme(t.palettes[m], t.typeColors[m], m)]));
  const paper = layout.surface === 'paper';
  const surf = (theme: Theme) => (theme.vars ?? theme).palette.surface;

  return createTheme({
    cssVariables: { colorSchemeSelector: 'data' },
    colorSchemes: schemes as { light: ColorSystemOptions; dark: ColorSystemOptions },
    niwa: {
      themeId,
      fontId,
      layout,
      background,
      width: contentWidth,
      gaps,
      iconSize,
      motion,
      monoFamily: monoStack,
    },
    typography: {
      fontFamily: fonts[fontId].stack,
      // 14 keeps MUI's internal pxToRem at 1:1; every variant below sets its own size from the scale.
      fontSize: 14,
      h1: step(s.display, fluid(responsiveDisplay.min, responsiveDisplay.max)),
      h2: step(s.title, fluid(responsiveTitle.min, responsiveTitle.max)),
      h3: step(s.title),
      h4: step(s.heading),
      h5: step(s.heading),
      h6: step(s.subheading),
      subtitle1: { ...step(s.body), fontWeight: 600 },
      subtitle2: { ...step(s.small), fontWeight: 600 },
      lead: { ...step(s.subheading), fontWeight: 400, lineHeight: 1.55 },
      body1: step(s.body),
      body2: step(s.small),
      caption: step(s.caption),
      overline: { ...step(s.caption), fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
      button: { ...step({ ...s.small, size: 14 }), fontWeight: 600, textTransform: 'none' },
    },
    shape: { borderRadius: shape.radius },
    transitions: {
      duration: {
        shortest: motion.short,
        shorter: motion.short,
        short: motion.medium,
        standard: motion.medium,
        complex: motion.long,
        enteringScreen: motion.medium,
        leavingScreen: motion.short,
      },
      easing: { easeInOut: motion.easing, easeOut: motion.easing, easeIn: motion.easingExit },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: `${fontFacesFor(fontId)}
a:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
  border-radius: 2px;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}`,
      },
      // One visible focus ring for every button-like control (V6), in the theme's primary colour.
      MuiButtonBase: {
        styleOverrides: {
          root: ({ theme }) => ({
            '&.Mui-focusVisible': {
              outline: `2px solid ${(theme.vars ?? theme).palette.primary.main}`,
              outlineOffset: 2,
            },
          }),
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        // Scrapbook (B-03): pill buttons.
        styleOverrides: paper ? { root: { borderRadius: layout.radius.control } } : {},
        // Pastel rules (V10): primary buttons are a pastel fill with deep text, not a dark fill with white.
        variants: [
          // Sticker buttons (B-03, like the Moeko Works dashboard): outlined, with an offset pastel shadow.
          ...(layout.stickers
            ? [
                {
                  props: { variant: 'contained' as const, color: 'primary' as const },
                  style: ({ theme }: { theme: Theme }) => ({
                    boxShadow: `inset 0 0 0 2px ${surf(theme).outline}, 3px 4px 0 ${surf(theme).sticker}`,
                    '&:hover': {
                      boxShadow: `inset 0 0 0 2px ${surf(theme).outline}, 4px 5px 0 ${surf(theme).sticker}`,
                    },
                    '&:active': {
                      boxShadow: `inset 0 0 0 2px ${surf(theme).outline}, 1px 2px 0 ${surf(theme).sticker}`,
                    },
                  }),
                },
              ]
            : []),
          {
            props: { variant: 'contained', color: 'primary' },
            style: ({ theme }) => {
              const pal = (theme.vars ?? theme).palette;
              return {
                backgroundColor: pal.primaryContainer.main,
                color: pal.primaryContainer.contrastText,
                '&:hover': {
                  backgroundColor: `color-mix(in srgb, ${pal.primaryContainer.main} 88%, ${pal.primaryContainer.contrastText})`,
                },
              };
            },
          },
        ],
      },
      // Touch screens: every icon button is at least 44 × 44 px (WCAG 2.5.5 target size, V7).
      MuiIconButton: {
        styleOverrides: { root: { '@media (pointer: coarse)': { minWidth: 44, minHeight: 44 } } },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        // Scrapbook (B-03): outlined papers become paper cards with a tinted shadow and a white edge.
        variants: paper
          ? [
              {
                props: { variant: 'outlined' as const },
                style: ({ theme }: { theme: Theme }) => ({
                  borderColor: surf(theme).edge,
                  borderRadius: layout.radius.card,
                  boxShadow: surf(theme).shadow,
                }),
              },
            ]
          : [],
      },
      MuiOutlinedInput: paper ? { styleOverrides: { root: { borderRadius: 14 } } } : {},
      MuiPopover: { styleOverrides: { paper: ({ theme }) => layered('popover')(theme) } },
      MuiMenu: { styleOverrides: { paper: ({ theme }) => layered('popover')(theme) } },
      MuiAutocomplete: { styleOverrides: { paper: ({ theme }) => layered('popover')(theme) } },
      MuiDialog: {
        styleOverrides: {
          paper: ({ theme }) => ({
            ...layered('dialog')(theme),
            ...(paper && { borderRadius: layout.radius.panel }),
          }),
        },
      },
      MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit' } },
      MuiTextField: { defaultProps: { fullWidth: true } },
      MuiTooltip: { defaultProps: { arrow: true } },
      MuiSvgIcon: {
        variants: [
          { props: { fontSize: 'inline' }, style: { fontSize: rem(iconSize.inline) } },
          { props: { fontSize: 'feature' }, style: { fontSize: rem(iconSize.feature) } },
          { props: { fontSize: 'emptyState' }, style: { fontSize: rem(iconSize.emptyState) } },
        ],
      },
    },
  });
}

/** The default look (Garden + Fredoka) — public pages always use it (V1.P4). */
export const theme = createNiwaTheme();
