import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import ShortTextRounded from '@mui/icons-material/ShortTextRounded';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Typography from '@mui/material/Typography';
import type { ItemSummary } from '@niwa/contracts';
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { ItemTypeIcon } from '../../items/itemMeta.tsx';
import type { HeadingEntry } from './headings.ts';

export interface LinkChoice {
  item: ItemSummary;
  heading: HeadingEntry | null;
}

export interface LinkPickerProps {
  items: ItemSummary[];
  query: string;
  clientRect?: (() => DOMRect | null) | null;
  command: (choice: LinkChoice) => void;
  fetchHeadings: (itemId: string) => Promise<HeadingEntry[]>;
}

export interface LinkPickerHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

/**
 * `[[` picker (CONCEPT.md §5.2): choose an item, or press → / Tab on it to choose one of its sections.
 * Rendered by the editor's suggestion plugin; positioned with an MUI Popper at the caret.
 */
export const LinkPicker = forwardRef<LinkPickerHandle, LinkPickerProps>(function LinkPicker(
  { items, query, clientRect, command, fetchHeadings },
  ref,
) {
  const [index, setIndex] = useState(0);
  const [sectionsOf, setSectionsOf] = useState<{ item: ItemSummary; headings: HeadingEntry[] | null } | null>(
    null,
  );
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    setIndex(0);
    setSectionsOf(null);
  }

  const rows = useMemo(
    () =>
      sectionsOf
        ? [
            { kind: 'whole' as const },
            ...(sectionsOf.headings ?? []).map((h) => ({ kind: 'heading' as const, h })),
          ]
        : items.map((item) => ({ kind: 'item' as const, item })),
    [items, sectionsOf],
  );

  const openSections = async (item: ItemSummary) => {
    setSectionsOf({ item, headings: null });
    setIndex(0);
    const headings = await fetchHeadings(item.id).catch(() => []);
    setSectionsOf((cur) => (cur?.item.id === item.id ? { item, headings } : cur));
  };

  const choose = (i: number) => {
    const row = rows[i];
    if (!row) return;
    if (row.kind === 'item') command({ item: row.item, heading: null });
    else if (sectionsOf) command({ item: sectionsOf.item, heading: row.kind === 'heading' ? row.h : null });
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (event.key === 'ArrowDown') {
        setIndex((i) => (rows.length ? (i + 1) % rows.length : 0));
        return true;
      }
      if (event.key === 'ArrowUp') {
        setIndex((i) => (rows.length ? (i - 1 + rows.length) % rows.length : 0));
        return true;
      }
      if (event.key === 'Enter') {
        choose(index);
        return true;
      }
      if ((event.key === 'ArrowRight' || event.key === 'Tab') && !sectionsOf) {
        const row = rows[index];
        if (row?.kind === 'item') void openSections(row.item);
        return true;
      }
      if (event.key === 'ArrowLeft' && sectionsOf) {
        setSectionsOf(null);
        setIndex(0);
        return true;
      }
      return false;
    },
  }));

  const anchorEl = clientRect
    ? { getBoundingClientRect: () => clientRect() ?? new DOMRect(), contextElement: undefined }
    : null;

  return (
    <Popper open={!!anchorEl} anchorEl={anchorEl} placement="bottom-start" sx={{ zIndex: 'modal' }}>
      <Paper elevation={6} sx={{ width: 340, maxHeight: 320, overflow: 'auto', mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1.5, pt: 1 }}>
          {sectionsOf
            ? `Link to a section of “${sectionsOf.item.title}”  ·  ← back`
            : 'Link to item  ·  → for a section'}
        </Typography>
        {sectionsOf?.headings === null ? (
          <Box sx={{ p: 2, display: 'grid', placeItems: 'center' }}>
            <CircularProgress size={18} />
          </Box>
        ) : rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1.5, py: 1.5 }}>
            No matching items
          </Typography>
        ) : (
          <List dense role="listbox" aria-label="Link suggestions">
            {rows.map((row, i) => (
              <ListItemButton
                key={row.kind === 'item' ? row.item.id : row.kind === 'heading' ? row.h.anchorId : 'whole'}
                selected={i === index}
                role="option"
                aria-selected={i === index}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {row.kind === 'item' ? (
                    <ItemTypeIcon type={row.item.type} fontSize="small" />
                  ) : (
                    <ShortTextRounded fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    row.kind === 'item' ? row.item.title : row.kind === 'heading' ? row.h.text : 'Whole item'
                  }
                  slotProps={{ primary: { noWrap: true } }}
                  sx={row.kind === 'heading' ? { pl: (row.h.level - 1) * 1.5 } : undefined}
                />
                {row.kind === 'item' && (
                  <ChevronRightRounded fontSize="small" sx={{ color: 'text.disabled' }} />
                )}
              </ListItemButton>
            ))}
          </List>
        )}
        {sectionsOf && sectionsOf.headings?.length === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1.5, pb: 1 }}>
            This item has no headings yet.
          </Typography>
        )}
      </Paper>
    </Popper>
  );
});
