import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import DriveFileMoveOutlined from '@mui/icons-material/DriveFileMoveOutlined';
import SkipNextRounded from '@mui/icons-material/SkipNextRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { ItemSummary, ItemType } from '@niwa/contracts';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { messageOf } from '../../api/client.ts';
import { EmptyState } from '../../components/EmptyState.tsx';
import { useNotify } from '../../components/Notifier.tsx';
import { exactTime, timeAgo } from '../../lib/friendlyTime.ts';
import { ItemTypeIcon, TYPE_LABEL } from '../items/itemMeta.tsx';
import { useTree } from '../items/queries.ts';
import { useItemActions } from '../items/useItemActions.ts';
import LocalFloristOutlined from '@mui/icons-material/LocalFloristOutlined';
import { FileDialog } from './FileDialog.tsx';
import { useFileItem } from './queries.ts';

const KINDS: ItemType[] = ['idea', 'note', 'task'];

/**
 * Sort the Inbox one capture at a time (NIWA-PLAN-B-01 B13): decide what it is, pick where it goes — the
 * suggested place or a top-level folder in one tap — or delete or skip it. Ends at "All sorted".
 */
export function InboxTriage({
  items,
  total,
  onExit,
}: {
  items: ItemSummary[];
  total: number;
  onExit: () => void;
}) {
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const queue = items.filter((i) => !skipped.has(i.id));
  const current = queue[0];
  const done = total - items.length;

  if (!current) {
    return (
      <EmptyState
        icon={<LocalFloristOutlined />}
        title={items.length ? 'That’s everything you didn’t skip' : 'All sorted'}
        description={items.length ? 'The skipped ones are still in the Inbox.' : 'Your Inbox is empty. Nice.'}
        action={
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to="/today" variant="contained">
              Back to Today
            </Button>
            <Button onClick={onExit}>Show the Inbox</Button>
          </Stack>
        }
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }} role="status">
          {queue.length} left to sort
        </Typography>
        <Button size="small" onClick={onExit}>
          Done sorting
        </Button>
      </Box>
      <LinearProgress
        variant="determinate"
        value={total ? (done / total) * 100 : 0}
        aria-label="Sorting progress"
        sx={{ height: 6, borderRadius: 3, mb: 2 }}
      />
      {/* Keyed so each capture starts with its own type and places. */}
      <TriageCard
        key={current.id}
        item={current}
        onSkip={() => setSkipped((s) => new Set(s).add(current.id))}
      />
    </Box>
  );
}

function TriageCard({ item, onSkip }: { item: ItemSummary; onSkip: () => void }) {
  const { data: tree = [] } = useTree();
  const fileItem = useFileItem();
  const actions = useItemActions();
  const notify = useNotify();
  const [type, setType] = useState<ItemType>(item.type === 'project' ? 'task' : item.type);
  const [choosing, setChoosing] = useState(false);
  const places = useMemo(() => {
    const suggested = item.suggestedParentId ? tree.find((t) => t.id === item.suggestedParentId) : undefined;
    const roots = tree.filter((t) => t.parentId === null && t.id !== suggested?.id);
    return [
      ...(suggested ? [{ place: suggested, suggested: true }] : []),
      ...roots.map((place) => ({ place, suggested: false })),
    ];
  }, [tree, item.suggestedParentId]);

  const file = (parent: ItemSummary) =>
    fileItem.mutate(
      { id: item.id, input: { version: item.version, parentId: parent.id, type } },
      {
        onSuccess: () => notify(`${TYPE_LABEL[type]} filed under “${parent.title}”`),
        onError: (err) => notify(messageOf(err), { severity: 'error' }),
      },
    );

  return (
    <Paper variant="outlined" component="section" aria-labelledby="triage-title" sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <ItemTypeIcon type={type} sx={{ mt: 0.5 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id="triage-title" variant="h4" component="h3" sx={{ overflowWrap: 'anywhere' }}>
            {item.title}
          </Typography>
          {item.inboxedAt && (
            <Typography variant="body2" color="text.secondary">
              Captured{' '}
              <time dateTime={item.inboxedAt} title={exactTime(item.inboxedAt)}>
                {timeAgo(item.inboxedAt)}
              </time>
            </Typography>
          )}
        </Box>
      </Box>

      <Typography
        variant="overline"
        color="text.secondary"
        component="p"
        sx={{ mt: 3, mb: 0.75 }}
        id="triage-kind"
      >
        It’s a…
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={type}
        onChange={(_, v: ItemType | null) => v && setType(v)}
        aria-labelledby="triage-kind"
      >
        {KINDS.map((k) => (
          <ToggleButton key={k} value={k} sx={{ gap: 0.75, px: 1.5 }}>
            <ItemTypeIcon type={k} fontSize="small" /> {TYPE_LABEL[k]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Typography variant="overline" color="text.secondary" component="p" sx={{ mt: 3, mb: 0.75 }}>
        Put it in…
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {places.map(({ place, suggested }) => (
          <Chip
            key={place.id}
            label={suggested ? `${place.title} (suggested)` : place.title}
            color={suggested ? 'primary' : 'default'}
            variant={suggested ? 'filled' : 'outlined'}
            onClick={() => file(place)}
            disabled={fileItem.isPending}
          />
        ))}
        <Chip
          icon={<DriveFileMoveOutlined />}
          label="Somewhere else…"
          variant="outlined"
          onClick={() => setChoosing(true)}
        />
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 3, justifyContent: 'flex-end' }}>
        <Button
          color="error"
          startIcon={<DeleteOutlineRounded />}
          onClick={() => void actions.remove(item, 0)}
        >
          Delete
        </Button>
        <Button startIcon={<SkipNextRounded />} onClick={onSkip}>
          Skip
        </Button>
      </Stack>
      {choosing && <FileDialog items={[{ ...item, type }]} onClose={() => setChoosing(false)} />}
    </Paper>
  );
}
