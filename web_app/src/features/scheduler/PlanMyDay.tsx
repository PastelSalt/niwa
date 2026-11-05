import AddRounded from '@mui/icons-material/AddRounded';
import DragIndicatorRounded from '@mui/icons-material/DragIndicatorRounded';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { ItemSummary, ScheduleEntry } from '@niwa/contracts';
import { useMemo } from 'react';
import { messageOf } from '../../api/client.ts';
import { useNotify } from '../../components/Notifier.tsx';
import { addDays, atMinutes, browserTimeZone, dayKey } from '../../lib/dates.ts';
import { dedupeFocus, FOCUS_SECTIONS } from '../actionable/focusSections.ts';
import { DueChip } from '../items/chips.tsx';
import { ItemTypeIcon, todayLocal } from '../items/itemMeta.tsx';
import { useFocus } from '../items/queries.ts';
import { useCreateEntry } from './queries.ts';

/** Drag payload from Plan my day onto the time grid. */
export const PLAN_DRAG_TYPE = 'application/x-niwa-plan';

const HOUR = 60;

/**
 * The first free hour on `day` between 9:00 and 21:00 (from the next whole hour when `day` is today), or
 * null when the day is full.
 */
export function nextFreeHour(day: Date, entries: ScheduleEntry[], now = new Date()): Date | null {
  const isToday = dayKey(day) === dayKey(now);
  const from = Math.max(9 * HOUR, isToday ? (now.getHours() + 1) * HOUR : 0);
  const busy = entries
    .filter((e) => !e.isAllDay)
    .map((e) => [Date.parse(e.startAt), Date.parse(e.endAt)] as const);
  for (let m = from; m + HOUR <= 21 * HOUR; m += HOUR) {
    const s = atMinutes(day, m).getTime();
    const end = s + HOUR * 60_000;
    if (!busy.some(([bs, be]) => bs < end && be > s)) return new Date(s);
  }
  return null;
}

/**
 * Plan my day (NIWA-PLAN-B-01 B12): open tasks worth doing soon, beside the week/day grid. Drag one onto the
 * grid, or press + to give it the next free hour.
 */
export function PlanMyDay({ day, entries }: { day: Date; entries: ScheduleEntry[] }) {
  const today = todayLocal();
  const { data } = useFocus(today);
  const create = useCreateEntry();
  const notify = useNotify();
  const tasks = useMemo(() => {
    if (!data) return [];
    const d = dedupeFocus(data);
    return FOCUS_SECTIONS.filter((s) => s.key !== 'recentlyUpdated')
      .flatMap((s) => d[s.key])
      .filter((i) => i.status !== 'completed')
      .slice(0, 12);
  }, [data]);
  const dayEntries = entries.filter(
    (e) => Date.parse(e.startAt) < addDays(day, 1).getTime() && Date.parse(e.endAt) > day.getTime(),
  );

  const plan = (item: ItemSummary) => {
    const start = nextFreeHour(day, dayEntries);
    if (!start)
      return notify('No free hour left between 9:00 and 21:00 — drag it onto the grid instead.', {
        severity: 'info',
      });
    create.mutate(
      {
        kind: 'block',
        itemId: item.id,
        startAt: start.toISOString(),
        endAt: new Date(start.getTime() + 60 * 60_000).toISOString(),
        isAllDay: false,
        recurrence: 'none',
        timeZone: browserTimeZone(),
      },
      {
        onSuccess: () =>
          notify(
            `Time set for “${item.title}” at ${start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`,
          ),
        onError: (err) => notify(messageOf(err), { severity: 'error' }),
      },
    );
  };

  return (
    <Box
      component="aside"
      aria-labelledby="plan-title"
      sx={{ width: 272, flexShrink: 0, borderLeft: 1, borderColor: 'divider', overflow: 'auto', p: 1.5 }}
    >
      <Typography id="plan-title" variant="subtitle2" component="h2">
        Plan my day
      </Typography>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1.5 }}>
        Drag a task onto the calendar, or press + for the next free hour on{' '}
        {day.toLocaleDateString(undefined, { weekday: 'long' })}.
      </Typography>
      {tasks.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No open tasks that are due soon, in progress or urgent.
        </Typography>
      )}
      <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
        {tasks.map((t) => (
          <Box
            component="li"
            key={t.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(PLAN_DRAG_TYPE, t.id);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              py: 0.75,
              pl: 0.25,
              borderRadius: 1,
              cursor: 'grab',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <DragIndicatorRounded fontSize="inline" sx={{ color: 'text.secondary' }} aria-hidden />
            <ItemTypeIcon type={t.type} fontSize="inline" />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap title={t.title}>
                {t.title}
              </Typography>
              {t.dueAt && <DueChip due={t.dueAt} today={today} />}
            </Box>
            <Tooltip title="Give it the next free hour">
              <IconButton size="small" aria-label={`Plan ${t.title}`} onClick={() => plan(t)}>
                <AddRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
