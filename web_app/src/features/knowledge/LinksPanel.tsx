import CloseRounded from '@mui/icons-material/CloseRounded';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { ItemSummary } from '@niwa/contracts';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router';
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

  if (isLoading) return <Skeleton variant="rounded" height={96} />;

  const outgoing = (data?.outgoing ?? []) as Row[];
  const backlinks = (data?.backlinks ?? []) as Row[];

  return (
    <Stack spacing={3}>
      <Box component="section" aria-label="Related items">
        <Typography variant="subtitle2" component="h2" sx={{ mb: 1 }}>
          Links ({outgoing.length})
        </Typography>
        {outgoing.length > 0 && (
          <Paper variant="outlined" sx={{ mb: 1.5 }}>
            <List dense disablePadding>
              {outgoing.map((r) => (
                <ListItem
                  key={r.link.id}
                  disablePadding
                  divider
                  secondaryAction={
                    r.link.origin === 'manual' ? (
                      <Tooltip title="Remove link">
                        <IconButton
                          edge="end"
                          size="small"
                          aria-label={`Remove link to ${r.item.title}`}
                          onClick={() => removeLink.mutate(r.link.id)}
                        >
                          <CloseRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : undefined
                  }
                >
                  <ListItemButton component={RouterLink} to={href(r.item, r.link.targetAnchorId)}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ItemTypeIcon type={r.item.type} fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        r.link.targetSection ? `${r.item.title} › ${r.link.targetSection}` : r.item.title
                      }
                      secondary={r.link.origin === 'content' ? 'Mentioned in the note' : 'Related'}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
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
          sx={{ maxWidth: 420 }}
        />
      </Box>

      <Box component="section" aria-label="Backlinks">
        <Typography variant="subtitle2" component="h2" sx={{ mb: 1 }}>
          Backlinks ({backlinks.length})
        </Typography>
        {backlinks.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nothing links here yet. Type [[ in another note to link to this one.
          </Typography>
        ) : (
          <Paper variant="outlined">
            <List dense disablePadding>
              {backlinks.map((r) => (
                <ListItem key={r.link.id} disablePadding divider>
                  <ListItemButton component={RouterLink} to={href(r.item, null)}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ItemTypeIcon type={r.item.type} fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={r.item.title}
                      secondary={
                        r.link.targetAnchorId
                          ? `Links to “${r.link.targetSection ?? 'a removed section'}”`
                          : r.link.origin === 'manual'
                            ? 'Related'
                            : 'Mentions this item'
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </Stack>
  );
}
