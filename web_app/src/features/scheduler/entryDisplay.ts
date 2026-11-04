import { useColorScheme, useTheme } from '@mui/material/styles';
import type { ItemSummary, ScheduleEntry } from '@niwa/contracts';
import { palettes, themes } from '@niwa/tokens';
import { useCallback, useMemo } from 'react';
import { readableOn } from '../../lib/a11y.ts';
import { useTree } from '../items/queries.ts';

/**
 * Colour choices for entries — taken from the design tokens and stored on the entry as hex (specs §1), so
 * they're a fixed list rather than following the active theme.
 */
export const ENTRY_COLORS = [
  { name: 'Sage', hex: palettes.light.primary },
  { name: 'Blossom', hex: palettes.light.secondary },
  { name: 'Sky', hex: palettes.light.info },
  { name: 'Amber', hex: palettes.light.warning },
  { name: 'Moss', hex: palettes.light.success },
  { name: 'Clay', hex: palettes.light.error },
] as const;

export interface EntryLook {
  title: string;
  /** Background colour (hex). */
  color: string;
  /** Text colour on `color`, chosen for contrast (WCAG 1.4.3). */
  textColor: string;
  item: ItemSummary | undefined;
}

/** Blocks show their item's live title; colour falls back to the item type or the primary colour. */
export function useEntryLook() {
  const { colorScheme } = useColorScheme();
  const mode = colorScheme === 'dark' ? 'dark' : 'light';
  // Uncoloured entries follow the active theme (B-02 V1.P4).
  const { palettes: active, typeColors } = themes[useTheme().niwa.themeId];
  const { data: tree } = useTree();
  const byId = useMemo(() => new Map((tree ?? []).map((i) => [i.id, i])), [tree]);

  return useCallback(
    (e: ScheduleEntry): EntryLook => {
      const item = e.itemId ? byId.get(e.itemId) : undefined;
      const title = e.kind === 'block' ? e.title || item?.title || 'Time block' : e.title;
      const color = e.color ?? (item ? typeColors[mode][item.type] : active[mode].primary);
      return { title, color, textColor: readableOn(color), item };
    },
    [byId, mode, active, typeColors],
  );
}
