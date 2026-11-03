import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import RepeatRounded from '@mui/icons-material/RepeatRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import type { Item } from '@niwa/contracts';
import { useState } from 'react';
import { atMinutes, formatRange, MINUTE } from '../../lib/dates.ts';
import { EntryDialog, type EntryDialogRequest } from './EntryDialog.tsx';
import { useItemSchedule } from './queries.ts';

/** Next free-ish slot: the next full hour, for the item's estimate (or an hour). */
function proposal(item: Item) {
  const now = new Date();
  const start = atMinutes(now, (now.getHours() + 1) * 60);
  return { start, end: new Date(start.getTime() + (item.estimatedMinutes ?? 60) * MINUTE) };
}

/** An item's derived scheduled time = its upcoming blocks (specs §6.1, SCHEDULER.md §7). */
export function ItemScheduleSection({ item }: { item: Item }) {
  const { data: blocks = [] } = useItemSchedule(item.id);
  const [dialog, setDialog] = useState<EntryDialogRequest | null>(null);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
        Scheduled
      </Typography>
      {blocks.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          No time blocked yet.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
          {blocks.slice(0, 5).map((b) => (
            <ButtonBase
              key={b.id}
              onClick={() => setDialog({ mode: 'edit', entry: b })}
              sx={{
                justifyContent: 'flex-start',
                gap: 0.75,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: 'action.hover',
                textAlign: 'left',
              }}
            >
              <Typography variant="body2" sx={{ flex: 1 }}>
                {new Date(b.startAt).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
                {' · '}
                {b.isAllDay ? 'All day' : formatRange(new Date(b.startAt), new Date(b.endAt))}
              </Typography>
              {b.seriesId && <RepeatRounded sx={{ fontSize: 14, color: 'text.secondary' }} />}
            </ButtonBase>
          ))}
          {blocks.length > 5 && (
            <Typography variant="caption" color="text.secondary">
              +{blocks.length - 5} more in the Scheduler
            </Typography>
          )}
        </Box>
      )}
      <Button
        size="small"
        startIcon={<EventAvailableOutlined />}
        onClick={() => setDialog({ mode: 'create', kind: 'block', itemId: item.id, ...proposal(item) })}
      >
        Schedule time
      </Button>
      {dialog && <EntryDialog request={dialog} onClose={() => setDialog(null)} />}
    </Box>
  );
}
