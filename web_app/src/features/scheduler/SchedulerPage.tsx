import AddRounded from '@mui/icons-material/AddRounded';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type { ScheduleEntry } from '@niwa/contracts';
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { messageOf } from '../../api/client.ts';
import { useNotify } from '../../components/Notifier.tsx';
import {
  addDays,
  addDaysToKey,
  addMonths,
  atMinutes,
  dayKey,
  isDayKey,
  monthGridStart,
  parseDay,
  startOfWeek,
  utcDayKey,
  utcMidnight,
} from '../../lib/dates.ts';
import { EntryDialog, type EntryDialogRequest } from './EntryDialog.tsx';
import { MonthView } from './MonthView.tsx';
import { useScheduleRange, useUpdateEntry } from './queries.ts';
import { TimeGridView } from './TimeGridView.tsx';

type View = 'month' | 'week' | 'day';
const VIEWS: View[] = ['month', 'week', 'day'];

/** `/scheduler` → this month on desktop, today on phones. */
export function SchedulerHome() {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  return <Navigate to={`/scheduler/${isPhone ? 'day' : 'month'}/${dayKey(new Date())}`} replace />;
}

/** Scheduler base — manual monthly planner (specs §4.3, docs/SCHEDULER.md). */
export function SchedulerPage() {
  const params = useParams<{ view: string; date: string }>();
  const navigate = useNavigate();
  const notify = useNotify();
  const update = useUpdateEntry();
  const [dialog, setDialog] = useState<EntryDialogRequest | null>(null);

  const view = VIEWS.includes(params.view as View) ? (params.view as View) : null;
  const date = isDayKey(params.date) ? parseDay(params.date) : null;

  const { from, to, days, title } = useMemo(() => {
    if (!view || !date) return { from: '', to: '', days: [] as Date[], title: '' };
    if (view === 'month') {
      const start = monthGridStart(date);
      return {
        from: start.toISOString(),
        to: addDays(start, 42).toISOString(),
        days: [] as Date[],
        title: date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      };
    }
    const start = view === 'week' ? startOfWeek(date) : date;
    const list = Array.from({ length: view === 'week' ? 7 : 1 }, (_, i) => addDays(start, i));
    const last = list.at(-1)!;
    return {
      from: start.toISOString(),
      to: addDays(last, 1).toISOString(),
      days: list,
      title:
        view === 'day'
          ? // Short names, like the week title, so the header fits a phone.
            date.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the URL values
  }, [view, params.date]);

  const { data: entries = [], isFetching, error } = useScheduleRange(from, to);

  if (!view || !date) return <Navigate to="/scheduler" replace />;

  const go = (v: View, d: Date) => navigate(`/scheduler/${v}/${dayKey(d)}`);
  const step = (dir: 1 | -1) =>
    go(view, view === 'month' ? addMonths(date, dir) : addDays(date, dir * (view === 'week' ? 7 : 1)));

  const save = (entry: ScheduleEntry, startAt: string, endAt: string) => {
    update.mutate(
      { id: entry.id, input: { startAt, endAt }, scope: 'instance' },
      {
        onSuccess: () => entry.seriesId && notify('Moved this occurrence only', { severity: 'info' }),
        onError: (err) => notify(messageOf(err), { severity: 'error' }),
      },
    );
  };

  const moveDays = (entry: ScheduleEntry, n: number) => {
    if (entry.isAllDay) {
      save(
        entry,
        utcMidnight(addDaysToKey(utcDayKey(entry.startAt), n)),
        utcMidnight(addDaysToKey(utcDayKey(entry.endAt), n)),
      );
    } else {
      save(
        entry,
        addDays(new Date(entry.startAt), n).toISOString(),
        addDays(new Date(entry.endAt), n).toISOString(),
      );
    }
  };

  const newEvent = (day: Date) =>
    setDialog({ mode: 'create', kind: 'event', start: atMinutes(day, 9 * 60), end: atMinutes(day, 10 * 60) });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          px: { xs: 1.5, md: 2 },
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Button size="small" variant="outlined" onClick={() => go(view, new Date())}>
          Today
        </Button>
        <Tooltip title="Previous">
          <IconButton size="small" aria-label="Previous" onClick={() => step(-1)}>
            <ChevronLeftRounded />
          </IconButton>
        </Tooltip>
        <Tooltip title="Next">
          <IconButton size="small" aria-label="Next" onClick={() => step(1)}>
            <ChevronRightRounded />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" component="h2" sx={{ flex: 1, minWidth: 160 }} noWrap>
          {title}
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={view}
          onChange={(_, v: View | null) => v && go(v, date)}
          aria-label="View"
        >
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="day">Day</ToggleButton>
        </ToggleButtonGroup>
        <Button size="small" variant="contained" startIcon={<AddRounded />} onClick={() => newEvent(date)}>
          New
        </Button>
      </Box>
      <Box sx={{ height: 2 }}>{isFetching && <LinearProgress sx={{ height: 2 }} />}</Box>
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {messageOf(error)}
        </Alert>
      )}

      <Box sx={{ flex: 1, minHeight: 0, overflow: view === 'month' ? 'auto' : 'hidden' }}>
        {view === 'month' ? (
          <MonthView
            gridStart={monthGridStart(date)}
            month={date.getMonth()}
            entries={entries}
            onCreate={newEvent}
            onOpen={(entry) => setDialog({ mode: 'edit', entry })}
            onMoveDays={moveDays}
            onShowDay={(d) => go('day', d)}
          />
        ) : (
          <TimeGridView
            key={from}
            days={days}
            entries={entries}
            onCreateRange={(start, end) => setDialog({ mode: 'create', kind: 'event', start, end })}
            onCreateAllDay={(day) =>
              setDialog({ mode: 'create', kind: 'event', start: day, end: day, allDay: true })
            }
            onOpen={(entry) => setDialog({ mode: 'edit', entry })}
            onChange={(entry, start, end) => save(entry, start.toISOString(), end.toISOString())}
          />
        )}
      </Box>

      {dialog && (
        <EntryDialog
          key={dialog.mode === 'edit' ? dialog.entry.id : 'new'}
          request={dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </Box>
  );
}
