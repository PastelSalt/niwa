import type { SxProps, Theme } from '@mui/material/styles';

/** An `sx` callback (theme → style object); usable in `sx` arrays or spread inside another callback. */
type SxFn = Extract<SxProps<Theme>, (theme: Theme) => unknown>;

/**
 * Surface helpers (NIWA-PLAN-B-03 C1). In Scrapbook, shell pieces and lists are paper cards with a tinted
 * shadow and a white edge; in Classic/Compact they keep the flat hairline look.
 */

/** A floating card (sidebar, top bar, tree, main, details) — Scrapbook only. */
export const floatingCardSx: SxFn = (t) => ({
  position: 'relative',
  bgcolor: 'background.paper',
  borderRadius: `${t.niwa.layout.radius.panel}px`,
  // One shorthand with its colour, so it wins over any border set before it when merged.
  border: `1px solid ${(t.vars ?? t).palette.surface.edge}`,
  boxShadow: (t.vars ?? t).palette.surface.shadow,
  overflow: 'hidden',
});

/** A list or card surface: paper card (Scrapbook) or a hairline box (Classic). */
export const listSurfaceSx: SxFn = (t) =>
  t.niwa.layout.surface === 'paper'
    ? {
        bgcolor: 'background.paper',
        borderRadius: `${t.niwa.layout.radius.card}px`,
        border: `1px solid ${(t.vars ?? t).palette.surface.edge}`,
        boxShadow: (t.vars ?? t).palette.surface.shadow,
      }
    : { bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 };

/** Stitched featured card (the fan site's dashed inset line) — when stickers are on. */
export const stitchSx: SxFn = (t) =>
  t.niwa.layout.stickers
    ? {
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 7,
          pointerEvents: 'none',
          border: '2px dashed',
          borderColor: `color-mix(in srgb, ${(t.vars ?? t).palette.primary.main} 45%, transparent)`,
          borderRadius: `${Math.max(t.niwa.layout.radius.card - 6, 4)}px`,
        },
      }
    : {};

/** Sticker look for the current nav item / titles. */
export const stickerSx: SxFn = (t) => ({
  bgcolor: (t.vars ?? t).palette.primaryContainer.main,
  color: (t.vars ?? t).palette.primaryContainer.contrastText,
  boxShadow: `inset 0 0 0 2px ${(t.vars ?? t).palette.surface.outline}, 3px 4px 0 ${(t.vars ?? t).palette.surface.sticker}`,
});

/** A section title as a small sticker label (Scrapbook with stickers on); plain text otherwise. */
export const titleStickerSx: SxFn = (t) =>
  t.niwa.layout.stickers
    ? {
        ...(stickerSx(t) as object),
        display: 'inline-block',
        px: 1.5,
        py: 0.25,
        borderRadius: '999px',
        // Room for the offset shadow.
        mr: '4px',
        mb: '4px',
        // A slight tilt, like a sticker put on by hand (titles only, never lists or data).
        transform: 'rotate(-2deg)',
      }
    : {};
