import EventRepeatOutlined from '@mui/icons-material/EventRepeatOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import type { ItemSummary } from '@niwa/contracts';
import { Link as RouterLink } from 'react-router';
import { Page } from '../../components/Page.tsx';
import { messageOf } from '../../api/client.ts';
import { EmptyState } from '../../components/EmptyState.tsx';
import { useNotify } from '../../components/Notifier.tsx';
import { formatDay, ItemTypeIcon, LENS_PATH, todayLocal } from '../items/itemMeta.tsx';
import { useUpdateItem } from '../items/queries.ts';
import { useReview } from './queries.ts';

const AGAIN = [
  { label: '1 week', days: 7 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
] as const;

function addDays(day: string, days: number): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return todayLocal(new Date(y, m - 1, d + days));
}

/** Manual review queue — items with reviewAt due today or earlier (specs §4.1). */
export function ReviewQueue() {
  const today = todayLocal();
  const { data, isLoading, error } = useReview(today);

  return (
    <Page width="list">
      <Typography variant="h5" component="h2" sx={{ mb: 0.5 }}>
        Review queue
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Notes you asked to revisit. Set “Review on” in an item’s details to add it here.
      </Typography>
      {isLoading && <Skeleton variant="rounded" height={120} />}
      {error && <Alert severity="error">{messageOf(error)}</Alert>}
      {data?.length === 0 && (
        <EmptyState
          icon={<EventRepeatOutlined />}
          title="Nothing to review today"
          description="Come back later — or schedule a review from any item’s details."
        />
      )}
      {!!data?.length && (
        <Paper variant="outlined">
          <List disablePadding aria-label="Due for review">
            {data.map((item) => (
              <ReviewRow key={item.id} item={item} today={today} />
            ))}
          </List>
        </Paper>
      )}
    </Page>
  );
}

function ReviewRow({ item, today }: { item: ItemSummary; today: string }) {
  const update = useUpdateItem();
  const notify = useNotify();
  const overdue = !!item.reviewAt && item.reviewAt < today;

  const reschedule = (reviewAt: string | null) =>
    update.mutate(
      { id: item.id, input: { version: item.version, reviewAt } },
      {
        onSuccess: () =>
          notify(reviewAt ? `Next review ${formatDay(reviewAt)}` : `Marked “${item.title}” reviewed`),
        onError: (err) => notify(messageOf(err), { severity: 'error' }),
      },
    );

  return (
    <ListItem divider disablePadding sx={{ flexWrap: 'wrap', pr: 1 }}>
      <ListItemButton
        component={RouterLink}
        to={`${LENS_PATH[item.nature]}/${item.id}`}
        sx={{ flex: '1 1 260px' }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
          <ItemTypeIcon type={item.type} fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={item.title} />
        {item.reviewAt && (
          <Chip
            size="small"
            variant="outlined"
            color={overdue ? 'warning' : 'default'}
            label={overdue ? `Since ${formatDay(item.reviewAt)}` : 'Today'}
          />
        )}
      </ListItemButton>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, pl: { xs: 2, sm: 0 } }}>
        <Typography variant="caption" color="text.secondary">
          Again in
        </Typography>
        <ButtonGroup size="small" variant="outlined" aria-label={`Review ${item.title} again in`}>
          {AGAIN.map((a) => (
            <Button key={a.days} onClick={() => reschedule(addDays(today, a.days))}>
              {a.label}
            </Button>
          ))}
        </ButtonGroup>
        <Button size="small" onClick={() => reschedule(null)}>
          Done
        </Button>
      </Box>
    </ListItem>
  );
}
