import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import type { FocusResponse, ItemSummary } from '@niwa/contracts';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { messageOf } from '../../api/client.ts';
import { EmptyState } from '../../components/EmptyState.tsx';
import { useNotify } from '../../components/Notifier.tsx';
import { formatDay, PRIORITY_LABEL, STATUS_LABEL, todayLocal } from '../items/itemMeta.tsx';
import { useFocus, useTree, useUpdateItem } from '../items/queries.ts';
import { ancestorsOf, buildTree, type TreeModel } from '../items/treeModel.ts';

const SECTIONS: { key: keyof FocusResponse; title: string; empty: string }[] = [
  { key: 'overdue', title: 'Overdue', empty: 'Nothing overdue.' },
  { key: 'inProgress', title: 'In progress', empty: 'Nothing in progress.' },
  { key: 'highPriority', title: 'High priority', empty: 'No high-priority work open.' },
  { key: 'upcoming', title: 'Upcoming (7 days)', empty: 'Nothing due this week.' },
  { key: 'recentlyUpdated', title: 'Recently updated', empty: 'No recent changes.' },
];

/** Cross-project focus — specs §2.1 #3, §4.2. */
export function FocusView() {
  const today = todayLocal();
  const { data, isLoading, error } = useFocus(today);
  const { data: treeItems } = useTree();
  const model = useMemo(() => buildTree(treeItems ?? []), [treeItems]);

  if (error)
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {messageOf(error)}
      </Alert>
    );

  const empty = data && Object.values(data).every((list) => list.length === 0);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 960 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 0.5 }}>
        Focus
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        What matters across every project, today ({formatDay(today)}).
      </Typography>

      {isLoading && [1, 2, 3].map((k) => <Skeleton key={k} variant="rounded" height={96} sx={{ mb: 2 }} />)}

      {empty && (
        <EmptyState
          icon={<TaskAltOutlined />}
          title="A calm garden"
          description="Create projects and tasks in the tree on the left. Anything in progress, urgent or due soon will show up here."
        />
      )}

      {data &&
        !empty &&
        SECTIONS.map((s) => (
          <Box key={s.key} component="section" aria-label={s.title} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" component="h3" sx={{ mb: 1 }}>
              {s.title}{' '}
              <Typography component="span" variant="caption" color="text.secondary">
                {data[s.key].length}
              </Typography>
            </Typography>
            {data[s.key].length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {s.empty}
              </Typography>
            ) : (
              <Paper variant="outlined">
                <List dense disablePadding>
                  {data[s.key].map((item) => (
                    <FocusRow key={item.id} item={item} model={model} today={today} />
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        ))}
    </Box>
  );
}

function FocusRow({ item, model, today }: { item: ItemSummary; model: TreeModel; today: string }) {
  const update = useUpdateItem();
  const notify = useNotify();
  // Optimistic: the checkbox flips immediately; the server result (or an error) settles it.
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const serverDone = item.status === 'completed';
  // Hold the optimistic value until the refreshed list agrees (avoids a flicker back).
  if (optimistic !== null && optimistic === serverDone) setOptimistic(null);
  const done = optimistic ?? serverDone;
  const path = ancestorsOf(model, item.id)
    .map((a) => a.title)
    .join(' › ');
  const overdue = !!item.dueAt && item.dueAt < today && !done;

  const toggle = () => {
    const next = !done;
    setOptimistic(next);
    update.mutate(
      { id: item.id, input: { version: item.version, status: next ? 'completed' : 'in_progress' } },
      {
        onSuccess: () => next && notify(`Completed “${item.title}”`),
        onError: (err) => {
          setOptimistic(null);
          notify(messageOf(err), { severity: 'error' });
        },
      },
    );
  };

  return (
    <ListItem
      disablePadding
      divider
      secondaryAction={
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {item.priority !== 'none' && item.priority !== 'low' && (
            <Chip size="small" variant="outlined" label={PRIORITY_LABEL[item.priority]} />
          )}
          {item.dueAt && (
            <Chip
              size="small"
              variant="outlined"
              color={overdue ? 'error' : 'default'}
              label={formatDay(item.dueAt)}
            />
          )}
        </Box>
      }
    >
      <Checkbox
        edge="start"
        checked={done}
        onChange={toggle}
        sx={{ ml: 1 }}
        slotProps={{ input: { 'aria-label': done ? `Reopen ${item.title}` : `Complete ${item.title}` } }}
      />
      <ListItemButton component={RouterLink} to={`/actionable/${item.id}`} sx={{ pr: 18 }}>
        <ListItemText
          primary={item.title}
          secondary={[path, item.status !== 'not_started' ? STATUS_LABEL[item.status] : null]
            .filter(Boolean)
            .join(' · ')}
          slotProps={{
            primary: { sx: { textDecoration: done ? 'line-through' : 'none' } },
            secondary: { noWrap: true },
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}
