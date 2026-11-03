import AddRounded from '@mui/icons-material/AddRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import DriveFileMoveOutlined from '@mui/icons-material/DriveFileMoveOutlined';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { ItemSummary } from '@niwa/contracts';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { messageOf } from '../../api/client.ts';
import { EmptyState } from '../../components/EmptyState.tsx';
import { ItemTypeIcon, LENS_PATH, TYPE_LABEL } from '../items/itemMeta.tsx';
import { useTree } from '../items/queries.ts';
import { useItemActions } from '../items/useItemActions.ts';
import { useQuickCapture } from './CaptureProvider.tsx';
import { FileDialog } from './FileDialog.tsx';
import { useInbox } from './queries.ts';

function capturedAgo(iso: string): string {
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Neutral capture list — everything before it's filed (specs §3, §12.8). */
export function InboxPage() {
  const { data: items, isLoading, error } = useInbox();
  const { data: tree = [] } = useTree();
  const capture = useQuickCapture();
  const actions = useItemActions();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filing, setFiling] = useState<ItemSummary[] | null>(null);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const list = items ?? [];
  const chosen = list.filter((i) => selected.has(i.id));
  const titleOf = (id: string | null) => (id ? tree.find((t) => t.id === id)?.title : undefined);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900 }}>
      <Stack direction="row" sx={{ alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h2" sx={{ flex: 1 }}>
          Inbox{' '}
          {list.length > 0 && (
            <Typography component="span" color="text.secondary">
              · {list.length}
            </Typography>
          )}
        </Typography>
        <Button variant="contained" startIcon={<AddRounded />} onClick={capture.open}>
          Capture
        </Button>
      </Stack>

      {chosen.length > 0 && (
        <Paper
          variant="outlined"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, mb: 1.5 }}
          role="toolbar"
          aria-label="Selection"
        >
          <Typography variant="body2" sx={{ flex: 1 }}>
            {chosen.length} selected
          </Typography>
          <Button size="small" startIcon={<DriveFileMoveOutlined />} onClick={() => setFiling(chosen)}>
            File selected
          </Button>
          <Button size="small" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </Paper>
      )}

      {isLoading && <Skeleton variant="rounded" height={160} />}
      {error && <Alert severity="error">{messageOf(error)}</Alert>}
      {items && list.length === 0 && (
        <EmptyState
          icon={<InboxOutlined />}
          title="Inbox zero"
          description="Press c anywhere to capture a thought. It waits here until you decide where it belongs."
        />
      )}
      {list.length > 0 && (
        <Paper variant="outlined">
          <List disablePadding aria-label="Inbox items">
            {list.map((it) => {
              const suggested = titleOf(it.suggestedParentId);
              return (
                <ListItem
                  key={it.id}
                  divider
                  disablePadding
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        startIcon={<DriveFileMoveOutlined />}
                        onClick={() => setFiling([it])}
                        aria-label={`File ${it.title}`}
                      >
                        File
                      </Button>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          aria-label={`Delete ${it.title}`}
                          onClick={() => void actions.remove(it, 0)}
                        >
                          <DeleteOutlineRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                  sx={{ pr: 18 }}
                >
                  <Checkbox
                    checked={selected.has(it.id)}
                    onChange={() => toggle(it.id)}
                    slotProps={{ input: { 'aria-label': `Select ${it.title}` } }}
                    sx={{ ml: 1 }}
                  />
                  <ListItemButton
                    component={RouterLink}
                    to={`${LENS_PATH[it.nature]}/${it.id}`}
                    sx={{ minWidth: 0 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ItemTypeIcon type={it.type} fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={it.title}
                      secondary={
                        <Box
                          component="span"
                          sx={{ display: 'inline-flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}
                        >
                          <span>
                            {TYPE_LABEL[it.type]} · {it.inboxedAt ? capturedAgo(it.inboxedAt) : ''}
                          </span>
                          {suggested && <Chip size="small" variant="outlined" label={`→ ${suggested}`} />}
                        </Box>
                      }
                      slotProps={{ primary: { noWrap: true }, secondary: { component: 'span' } }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}

      {filing && (
        <FileDialog items={filing} onClose={() => setFiling(null)} onDone={() => setSelected(new Set())} />
      )}
    </Box>
  );
}
