import CloseRounded from '@mui/icons-material/CloseRounded';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { ItemSummary } from '@niwa/contracts';
import { useMemo, useState } from 'react';
import { RowSkeletons } from '../items/RowSkeletons.tsx';
import { SectionHeader } from '../../components/SectionHeader.tsx';
import { ItemRow, ItemRowList } from '../items/ItemRow.tsx';
import { messageOf } from '../../api/client.ts';
import { useNotify } from '../../components/Notifier.tsx';
import { ItemTypeIcon } from '../items/itemMeta.tsx';
import { useTree } from '../items/queries.ts';
import { useCreateLink, useLinks, useRemoveLink } from './queries.ts';

type Row = {
  link: {
    id: string;
    origin: 'content' | 'manual';
    targetAnchorId: string | null;
    targetSection: string | null;
  };
  item: ItemSummary;
};

const href = (item: ItemSummary, anchorId: string | null) =>
  `/items/${item.id}${anchorId ? `#h-${anchorId}` : ''}`;

/** Related items + Backlinks — specs §4.1, CONCEPT.md §5. */
export function LinksPanel({ itemId }: { itemId: string }) {
  const { data, isLoading } = useLinks(itemId);
  const { data: tree = [] } = useTree();
  const createLink = useCreateLink();
  const removeLink = useRemoveLink();
  const notify = useNotify();
  const [picker, setPicker] = useState<ItemSummary | null>(null);

  const linkedIds = useMemo(
    () => new Set((data?.outgoing ?? []).filter((r) => r.link.origin === 'manual').map((r) => r.item.id)),
    [data],
  );
  const options = tree.filter((i) => i.id !== itemId && !linkedIds.has(i.id));

  const add = async (target: ItemSummary | null) => {
    setPicker(null);
    if (!target) return;
    try {
      await createLink.mutateAsync({ sourceId: itemId, targetId: target.id });
    } catch (err) {
      notify(messageOf(err), { severity: 'error' });
    }
  };

  if (isLoading) return <RowSkeletons rows={2} />;

  const outgoing = (data?.outgoing ?? []) as Row[];
  const backlinks = (data?.backlinks ?? []) as Row[];

  return (
    <Stack spacing={3}>
      <Box component="section" aria-label="Related items">
        <SectionHeader title="Links" count={outgoing.length} />
        {outgoing.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Nothing linked yet. Type [[ in the note, or add a related item.
          </Typography>
        ) : (
          <Box sx={{ mb: 1.5 }}>
            <ItemRowList label="Links">
              {outgoing.map((r) => (
                <ItemRow
                  key={r.link.id}
                  item={r.item}
                  to={href(r.item, r.link.targetAnchorId)}
                  title={r.link.targetSection ? `${r.item.title} › ${r.link.targetSection}` : r.item.title}
                  meta={r.link.origin === 'content' ? 'Mentioned in the note' : 'Related'}
                  actions={
                    r.link.origin === 'manual'
                      ? [
                          {
                            label: 'Remove link',
                            ariaLabel: `Remove link to ${r.item.title}`,
                            icon: <CloseRounded fontSize="small" />,
                            onClick: () => removeLink.mutate(r.link.id),
                          },
                        ]
                      : undefined
                  }
                />
              ))}
            </ItemRowList>
          </Box>
        )}
        <Autocomplete
          size="small"
          options={options}
          value={picker}
          onChange={(_, v) => void add(v)}
          getOptionLabel={(o) => o.title}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderOption={(props, o) => {
            const { key, ...rest } = props;
            return (
              <li key={key} {...rest}>
                <ItemTypeIcon type={o.type} fontSize="small" sx={{ mr: 1 }} />
                {o.title}
              </li>
            );
          }}
          renderInput={(params) => <TextField {...params} label="Add related item" />}
          sx={{ maxWidth: (t) => t.niwa.width.narrow }}
        />
      </Box>

      <Box component="section" aria-label="Backlinks">
        <SectionHeader title="Backlinks" count={backlinks.length} />
        {backlinks.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nothing links here yet. Type [[ in another note to link to this one.
          </Typography>
        ) : (
          <ItemRowList label="Backlinks">
            {backlinks.map((r) => (
              <ItemRow
                key={r.link.id}
                item={r.item}
                to={href(r.item, null)}
                meta={
                  r.link.targetAnchorId
                    ? `Links to “${r.link.targetSection ?? 'a removed section'}”`
                    : r.link.origin === 'manual'
                      ? 'Related'
                      : 'Mentions this item'
                }
              />
            ))}
          </ItemRowList>
        )}
      </Box>
    </Stack>
  );
}
