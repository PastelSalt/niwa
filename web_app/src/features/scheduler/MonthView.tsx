import AddRounded from '@mui/icons-material/AddRounded';
import RepeatRounded from '@mui/icons-material/RepeatRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type { ScheduleEntry } from '@niwa/contracts';
import { useMemo, useState } from 'react';
import { addDays, allDayKeys, dayKey, formatTime, weekdayNames } from '../../lib/dates.ts';
import { visuallyHidden } from '../../lib/a11y.ts';
import { entryBlockSx, useEntryLook } from './entryDisplay.ts';

const MAX_CHIPS = 3;
/** Phones: dots per day in the grid (V5), the day's titles in the list below. */
const MAX_DOTS = 3;
const DRAG_TYPE = 'application/x-niwa-entry';

interface MonthViewProps {
  gridStart: Date;
  month: number;
  entries: ScheduleEntry[];
  onCreate: (day: Date) => void;
  onOpen: (entry: ScheduleEntry) => void;
  /** Move by whole days, keeping time of day and duration (SCHEDULER.md §5). */
  onMoveDays: (entry: ScheduleEntry, days: number) => void;
  onShowDay: (day: Date) => void;
}

/** Days an entry appears on: all-day by calendar date, timed by local start day. */
function dayKeysOf(e: ScheduleEntry): string[] {
  return e.isAllDay ? allDayKeys(e.startAt, e.endAt) : [dayKey(new Date(e.startAt))];
}

export function MonthView({
  gridStart,
  month,
  entries,
  onCreate,
  onOpen,
  onMoveDays,
  onShowDay,
}: MonthViewProps) {
  const look = useEntryLook();
  const theme = useTheme();
  // Phones get dots in the grid and the selected day's entries below it, so titles stay readable (V5).
  const compact = useMediaQuery(theme.breakpoints.down('sm'));
  const [dropDay, setDropDay] = useState<string | null>(null);
  const today = dayKey(new Date());
  const [picked, setPicked] = useState<string | null>(null);
  const days = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart]);
  // Selected day on phones: the one tapped, else today when it's in this month, else the 1st.
  const inThisMonth = days.filter((d) => d.getMonth() === month).map(dayKey);
  const selected =
    picked && inThisMonth.includes(picked) ? picked : inThisMonth.includes(today) ? today : inThisMonth[0]!;
  const weeks = useMemo(() => Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7)), [days]);

  const byDay = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    for (const e of entries) {
      for (const k of dayKeysOf(e)) map.set(k, [...(map.get(k) ?? []), e]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => Number(b.isAllDay) - Number(a.isAllDay) || a.startAt.localeCompare(b.startAt));
    }
    return map;
  }, [entries]);

  if (compact) {
    const selectedDate = days.find((d) => dayKey(d) === selected)!;
    const list = byDay.get(selected) ?? [];
    return (
      <Box>
        <WeekdayHeader />
        <Box
          role="grid"
          aria-label="Month"
          sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
        >
          {weeks.map((week) => (
            <Box key={dayKey(week[0]!)} role="row" sx={{ display: 'contents' }}>
              {week.map((day) => {
                const key = dayKey(day);
                const entriesOn = byDay.get(key) ?? [];
                const inMonth = day.getMonth() === month;
                const isSelected = key === selected;
                return (
                  <Box
                    key={key}
                    role="gridcell"
                    data-day={key}
                    aria-selected={isSelected}
                    sx={{ borderBottom: 1, borderColor: 'divider', minWidth: 0 }}
                  >
                    <ButtonBase
                      onClick={() => (inMonth ? setPicked(key) : onShowDay(day))}
                      aria-label={`${day.toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}${entriesOn.length ? `, ${entriesOn.length} ${entriesOn.length === 1 ? 'entry' : 'entries'}` : ''}`}
                      sx={(t) => ({
                        width: '100%',
                        minHeight: 52,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.5,
                        py: 0.75,
                        bgcolor: isSelected
                          ? t.alpha((t.vars ?? t).palette.primary.main, 0.12)
                          : 'transparent',
                        '&.Mui-focusVisible': { outline: 2, outlineColor: 'primary.main', outlineOffset: -2 },
                      })}
                    >
                      <DayNumber day={day} isToday={key === today} inMonth={inMonth} />
                      <Box aria-hidden sx={{ display: 'flex', gap: 0.375, height: 6 }}>
                        {entriesOn.slice(0, MAX_DOTS).map((e) => (
                          <Box
                            key={e.id}
                            sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: look(e).color }}
                          />
                        ))}
                      </Box>
                    </ButtonBase>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>

        <Box component="section" aria-label="Selected day" sx={{ px: 2, pt: 2, pb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle1" component="h3" sx={{ flex: 1 }}>
              {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Typography>
            <Button size="small" startIcon={<AddRounded />} onClick={() => onCreate(selectedDate)}>
              Add
            </Button>
          </Box>
          {list.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nothing planned.
            </Typography>
          ) : (
            <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
              {list.map((e) => {
                const l = look(e);
                return (
                  <li key={`${e.id}-${selected}`}>
                    <ButtonBase
                      onClick={() => onOpen(e)}
                      sx={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        gap: 1.5,
                        py: 1,
                        px: 1,
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Box
                        aria-hidden
                        sx={{
                          width: 4,
                          alignSelf: 'stretch',
                          borderRadius: 1,
                          bgcolor: l.color,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ width: 64, flexShrink: 0 }}>
                        {e.isAllDay ? 'All day' : formatTime(new Date(e.startAt))}
                      </Typography>
                      <Typography variant="body1" sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                        {l.title}
                      </Typography>
                      {e.seriesId && <RepeatRounded fontSize="inline" sx={{ color: 'text.secondary' }} />}
                    </ButtonBase>
                  </li>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520 }}>
      <WeekdayHeader />
      <Box
        role="grid"
        aria-label="Month"
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gridAutoRows: 'minmax(96px, 1fr)',
        }}
      >
        {weeks.map((week) => (
          // display: contents keeps the CSS grid while giving the grid its required rows.
          <Box key={dayKey(week[0]!)} role="row" sx={{ display: 'contents' }}>
            {week.map((day) => {
              const key = dayKey(day);
              const list = byDay.get(key) ?? [];
              const inMonth = day.getMonth() === month;
              const hidden = list.length - MAX_CHIPS;
              return (
                <Box
                  key={key}
                  role="gridcell"
                  data-day={key}
                  onClick={(e) => e.target === e.currentTarget && onCreate(day)}
                  onDragOver={(e) => {
                    if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
                    e.preventDefault();
                    setDropDay(key);
                  }}
                  onDragLeave={() => setDropDay((d) => (d === key ? null : d))}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDropDay(null);
                    const [id, fromKey] = e.dataTransfer.getData(DRAG_TYPE).split('|');
                    const entry = entries.find((x) => x.id === id);
                    if (!entry || !fromKey) return;
                    const delta = Math.round(
                      (day.getTime() - new Date(`${fromKey}T12:00:00`).getTime()) / 86_400_000,
                    );
                    if (delta !== 0) onMoveDays(entry, delta);
                  }}
                  sx={(theme) => ({
                    borderRight: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    p: 0.5,
                    minWidth: 0,
                    cursor: 'pointer',
                    bgcolor:
                      dropDay === key
                        ? theme.alpha((theme.vars ?? theme).palette.primary.main, 0.12)
                        : inMonth
                          ? 'background.paper'
                          : 'background.default',
                  })}
                >
                  <Box component="span" sx={visuallyHidden}>
                    {day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </Box>
                  <Box sx={{ mb: 0.25 }}>
                    <DayNumber day={day} isToday={key === today} inMonth={inMonth} />
                  </Box>
                  {list.slice(0, MAX_CHIPS).map((e) => {
                    const l = look(e);
                    return (
                      <ButtonBase
                        key={`${e.id}-${key}`}
                        draggable
                        onDragStart={(ev) => {
                          ev.dataTransfer.setData(DRAG_TYPE, `${e.id}|${key}`);
                          ev.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={() => onOpen(e)}
                        title={e.isAllDay ? l.title : `${formatTime(new Date(e.startAt))} ${l.title}`}
                        // Timed chips are named by their visible text (time, title); all-day ones add "all day".
                        aria-label={
                          e.isAllDay ? `${l.title}, all day` : `${formatTime(new Date(e.startAt))} ${l.title}`
                        }
                        sx={(theme) => ({
                          display: 'flex',
                          containerType: 'inline-size',
                          width: '100%',
                          justifyContent: 'flex-start',
                          gap: 0.5,
                          px: 0.5,
                          py: 0.125,
                          mb: 0.25,
                          borderRadius: 0.75,
                          typography: 'caption',
                          lineHeight: 1.5,
                          textAlign: 'left',
                          ...(e.isAllDay
                            ? { fontWeight: 600, ...entryBlockSx(l)(theme) }
                            : { '&:hover': { bgcolor: 'action.hover' } }),
                        })}
                      >
                        {!e.isAllDay && (
                          <Box
                            component="span"
                            sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: l.color, flexShrink: 0 }}
                          />
                        )}
                        {!e.isAllDay && (
                          <Box
                            component="span"
                            sx={{
                              color: 'text.secondary',
                              flexShrink: 0,
                              // Narrow cells (tablets): the title gets the room; the time is in the tooltip.
                              '@container (max-width: 150px)': { display: 'none' },
                            }}
                          >
                            {formatTime(new Date(e.startAt))}
                          </Box>
                        )}
                        <Box
                          component="span"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {l.title}
                        </Box>
                        {e.seriesId && (
                          <RepeatRounded sx={{ fontSize: '1em', opacity: 0.7, flexShrink: 0 }} />
                        )}
                      </ButtonBase>
                    );
                  })}
                  {hidden > 0 && (
                    <ButtonBase
                      onClick={() => onShowDay(day)}
                      sx={{
                        typography: 'caption',
                        color: 'text.secondary',
                        px: 0.5,
                        borderRadius: 0.75,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      +{hidden} more
                    </ButtonBase>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function WeekdayHeader() {
  return (
    <Box
      aria-hidden
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {weekdayNames().map((n) => (
        <Typography
          key={n}
          variant="caption"
          color="text.secondary"
          sx={{ px: { xs: 0, sm: 1 }, py: 0.75, fontWeight: 600, textAlign: { xs: 'center', sm: 'left' } }}
        >
          {n}
        </Typography>
      ))}
    </Box>
  );
}

function DayNumber({ day, isToday, inMonth }: { day: Date; isToday: boolean; inMonth: boolean }) {
  return (
    <Typography
      variant="caption"
      component="div"
      aria-hidden
      sx={{
        width: 22,
        height: 22,
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        pointerEvents: 'none',
        fontWeight: isToday ? 700 : 400,
        color: isToday ? 'primary.contrastText' : inMonth ? 'text.primary' : 'text.secondary',
        bgcolor: isToday ? 'primary.main' : 'transparent',
      }}
    >
      {day.getDate()}
    </Typography>
  );
}
