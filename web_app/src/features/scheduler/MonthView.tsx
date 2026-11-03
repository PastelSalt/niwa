import RepeatRounded from '@mui/icons-material/RepeatRounded';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import type { ScheduleEntry } from '@niwa/contracts';
import { useMemo, useState } from 'react';
import { addDays, allDayKeys, dayKey, formatTime, weekdayNames } from '../../lib/dates.ts';
import { visuallyHidden } from '../../lib/a11y.ts';
import { useEntryLook } from './entryDisplay.ts';

const MAX_CHIPS = 3;
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
  const [dropDay, setDropDay] = useState<string | null>(null);
  const today = dayKey(new Date());
  const days = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart]);
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520 }}>
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
            sx={{ px: 1, py: 0.75, fontWeight: 600 }}
          >
            {n}
          </Typography>
        ))}
      </Box>
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
                      mb: 0.25,
                      pointerEvents: 'none',
                      fontWeight: key === today ? 700 : 400,
                      color:
                        key === today ? 'primary.contrastText' : inMonth ? 'text.primary' : 'text.secondary',
                      bgcolor: key === today ? 'primary.main' : 'transparent',
                    }}
                  >
                    {day.getDate()}
                  </Typography>
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
                        // Timed chips are named by their visible text (time, title); all-day ones add "all day".
                        aria-label={e.isAllDay ? `${l.title}, all day` : undefined}
                        sx={{
                          display: 'flex',
                          width: '100%',
                          justifyContent: 'flex-start',
                          gap: 0.5,
                          px: 0.5,
                          py: 0.125,
                          mb: 0.25,
                          borderRadius: 0.75,
                          fontSize: 12,
                          lineHeight: 1.5,
                          textAlign: 'left',
                          ...(e.isAllDay
                            ? { bgcolor: l.color, color: l.textColor }
                            : { '&:hover': { bgcolor: 'action.hover' } }),
                        }}
                      >
                        {!e.isAllDay && (
                          <Box
                            component="span"
                            sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: l.color, flexShrink: 0 }}
                          />
                        )}
                        {!e.isAllDay && (
                          <Box component="span" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                            {formatTime(new Date(e.startAt))}
                          </Box>
                        )}
                        <Box
                          component="span"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {l.title}
                        </Box>
                        {e.seriesId && <RepeatRounded sx={{ fontSize: 12, opacity: 0.7, flexShrink: 0 }} />}
                      </ButtonBase>
                    );
                  })}
                  {hidden > 0 && (
                    <ButtonBase
                      onClick={() => onShowDay(day)}
                      sx={{
                        fontSize: 12,
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
