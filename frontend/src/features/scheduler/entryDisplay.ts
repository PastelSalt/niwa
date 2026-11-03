import { useTheme } from '@mui/material/styles';
import type { ItemSummary, ScheduleEntry } from '@niwa/contracts';
import { palettes } from '@niwa/tokens';
import { useCallback, useMemo } from 'react';
import { useTree } from '../items/queries.ts';

/** Colour choices for entries — taken from the design tokens (stored as hex, specs §1). */
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
  color: string;
  item: ItemSummary | undefined;
}

/** Blocks show their item's live title; colour falls back to the item type or the primary colour. */
export function useEntryLook() {
  const theme = useTheme();
  const { data: tree } = useTree();
  const byId = useMemo(() => new Map((tree ?? []).map((i) => [i.id, i])), [tree]);
  const vars = theme.vars ?? theme;

  return useCallback(
    (e: ScheduleEntry): EntryLook => {
      const item = e.itemId ? byId.get(e.itemId) : undefined;
      const title = e.kind === 'block' ? e.title || item?.title || 'Time block' : e.title;
      const color = e.color ?? (item ? vars.palette.itemType[item.type] : vars.palette.primary.main);
      return { title, color, item };
    },
    [byId, vars],
  );
}
