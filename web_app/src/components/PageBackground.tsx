import Box from '@mui/material/Box';
import { useColorScheme, useTheme } from '@mui/material/styles';
import type { BackgroundPreference } from '@niwa/contracts';
import { pageTint, themes, type ColorMode, type PatternId, type ThemeId } from '@niwa/tokens';
import type { CSSProperties } from 'react';

/**
 * The patterned page behind NIWA's floating cards (NIWA-PLAN-B-03 C2), in the style of the Kotoha fan site and
 * the Moeko Works dashboards. Patterns are CSS gradients or tiny inline SVGs drawn in the theme's colours — no
 * image files — so they recolour with the theme and with dark mode. Text never sits on a pattern without a
 * paper surface (or the contrast-tested page tint) underneath.
 */

const rgba = (hex: string, a: number) =>
  `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ')} / ${a})`;
const svg = (body: string, size: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>${body}</svg>`,
  )}")`;

/** One five-petal flower (the Moeko Works motion-toggle flower), centred on (x, y). */
const flower = (x: number, y: number, r: number, fill: string) =>
  [0, 72, 144, 216, 288]
    .map((deg) => {
      const a = ((deg - 90) * Math.PI) / 180;
      return `<circle cx='${(x + Math.cos(a) * r).toFixed(1)}' cy='${(y + Math.sin(a) * r).toFixed(1)}' r='${r}' fill='${fill}'/>`;
    })
    .join('');

/** A four-leaf clover (the fan site's clover pattern). */
const clover = (x: number, y: number, r: number, fill: string) =>
  [
    [0, -r],
    [r, 0],
    [0, r],
    [-r, 0],
  ]
    .map(([dx, dy]) => `<circle cx='${x + dx!}' cy='${y + dy!}' r='${r}' fill='${fill}'/>`)
    .join('');

/** CSS for a pattern on a page colour. `mark` is the pattern's ink (white in light mode, text in dark). */
export function patternStyle(pattern: PatternId, page: string, mark: string, alpha: number): CSSProperties {
  const m = rgba(mark, alpha);
  const half = rgba(mark, alpha * 0.55);
  switch (pattern) {
    case 'dots':
      return {
        backgroundColor: page,
        backgroundImage: `radial-gradient(${m} 1.6px, transparent 1.8px)`,
        backgroundSize: '26px 26px',
      };
    case 'gingham':
      return {
        backgroundColor: page,
        backgroundImage: `repeating-linear-gradient(0deg, ${half} 0 16px, transparent 16px 32px), repeating-linear-gradient(90deg, ${half} 0 16px, transparent 16px 32px)`,
      };
    case 'grid':
      return {
        backgroundColor: page,
        backgroundImage: `linear-gradient(${m} 1px, transparent 1px), linear-gradient(90deg, ${m} 1px, transparent 1px)`,
        backgroundSize: '22px 22px',
      };
    case 'lined':
      return {
        backgroundColor: page,
        backgroundImage: `repeating-linear-gradient(180deg, transparent 0 27px, ${m} 27px 28px)`,
      };
    case 'stripes':
      return {
        backgroundColor: page,
        backgroundImage: `repeating-linear-gradient(115deg, ${half} 0 18px, transparent 18px 36px)`,
      };
    case 'clover':
      return {
        backgroundColor: page,
        backgroundImage: svg(clover(24, 28, 6, m) + clover(84, 87, 5, m), 120),
        backgroundSize: '120px 120px',
      };
    case 'flowers':
      return {
        backgroundColor: page,
        backgroundImage: svg(flower(26, 26, 5, m) + flower(80, 78, 4, half), 104),
        backgroundSize: '104px 104px',
      };
    case 'grain':
      return {
        backgroundColor: page,
        // The fan site's paper grain: fractal noise, very faint.
        backgroundImage: svg(
          `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${(alpha * 0.5).toFixed(2)} 0'/></filter><rect width='160' height='160' filter='url(%23n)'/>`.replace(
            '%23',
            '#',
          ),
          160,
        ),
      };
    default:
      return { backgroundColor: page };
  }
}

/** Everything the page layer needs for one theme, mode and background choice. */
export function pageStyle(themeId: ThemeId, mode: ColorMode, bg: BackgroundPreference): CSSProperties {
  const p = themes[themeId].palettes[mode];
  const page = pageTint(p, mode);
  const light = mode === 'light';
  const mark = light ? '#FFFFFF' : p.textPrimary;
  const alpha = (light ? 0.5 : 0.07) * (bg.strength === 'soft' ? 0.55 : 1);
  const base = patternStyle(bg.pattern, page, mark, alpha);
  if (!bg.washes) return base;
  // Soft colour washes in two corners, like the Moeko Works dashboard.
  const washA = rgba(p.primaryContainer, light ? 0.75 : 0.35);
  const washB = rgba(light ? p.secondary : p.primaryContainer, light ? 0.55 : 0.25);
  const washes = `radial-gradient(42rem 32rem at -6rem -8rem, ${washA}, transparent 70%), radial-gradient(40rem 30rem at calc(100% + 6rem) calc(100% + 8rem), ${washB}, transparent 70%)`;
  return {
    ...base,
    backgroundImage: base.backgroundImage ? `${washes}, ${base.backgroundImage}` : washes,
    backgroundSize: base.backgroundSize ? `auto, auto, ${base.backgroundSize}` : undefined,
  };
}

/** The fixed layer behind a screen; its children sit on top. */
export function PageBackground({ background }: { background?: BackgroundPreference }) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const mode: ColorMode = colorScheme === 'dark' ? 'dark' : 'light';
  return (
    <Box
      aria-hidden
      data-testid="page-background"
      style={pageStyle(theme.niwa.themeId, mode, background ?? theme.niwa.background)}
      sx={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}
    />
  );
}
