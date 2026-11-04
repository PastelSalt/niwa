import { describe, expect, it } from 'vitest';
import {
  palettes,
  priorityColors,
  statusColors,
  themes,
  typeColors,
  typeScaleFor,
  fonts,
  type ColorMode,
  type FontId,
} from './index.ts';

/** WCAG 2.x relative luminance / contrast ratio. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

const modes: ColorMode[] = ['light', 'dark'];

describe.each(modes)('%s palette', (mode) => {
  const p = palettes[mode];

  it('body and secondary text meet WCAG AA (4.5:1) on page and surface', () => {
    for (const bg of [p.background, p.surface]) {
      expect(contrast(p.textPrimary, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.textSecondary, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('text on primary/secondary buttons meets AA (4.5:1)', () => {
    expect(contrast(p.primaryContrast, p.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.secondaryContrast, p.secondary)).toBeGreaterThanOrEqual(4.5);
  });

  it('primary as text/links/icons meets 4.5:1 and status colours meet 3:1 (UI components)', () => {
    for (const bg of [p.background, p.surface]) {
      expect(contrast(p.primary, bg)).toBeGreaterThanOrEqual(4.5);
      for (const c of [p.error, p.warning, p.success, p.info])
        expect(contrast(c, bg)).toBeGreaterThanOrEqual(3);
      for (const c of Object.values(typeColors[mode])) expect(contrast(c, bg)).toBeGreaterThanOrEqual(3);
    }
  });

  it('scheduler block colours carry white or dark text at 4.5:1', () => {
    const fills = [
      p.primary,
      p.secondary,
      p.error,
      p.warning,
      p.success,
      p.info,
      ...Object.values(typeColors[mode]),
    ];
    for (const c of fills) {
      expect(Math.max(contrast('#FFFFFF', c), contrast('#1A1D1B', c))).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe.each(Object.entries(themes))('theme %s', (_id, theme) => {
  it.each(modes)('status and priority roles reach 3:1 as dots, icons and chip borders (%s)', (mode) => {
    const p = theme.palettes[mode];
    for (const bg of [p.background, p.surface]) {
      for (const c of [...Object.values(statusColors(p)), ...Object.values(priorityColors(p))])
        expect(contrast(c, bg)).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(modes)('text stays AA on every surface (%s)', (mode) => {
    const p = theme.palettes[mode];
    for (const bg of [p.background, p.surface]) {
      expect(contrast(p.textPrimary, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.textSecondary, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('type scale', () => {
  it.each(Object.keys(fonts) as FontId[])('%s: nothing readable under 12 px; body is 15 px', (font) => {
    const scale = typeScaleFor(font);
    expect(scale.body.size).toBe(15);
    for (const step of Object.values(scale)) expect(step.size).toBeGreaterThanOrEqual(12);
  });
});
