import RepeatRounded from '@mui/icons-material/RepeatRounded';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import type { ScheduleEntry } from '@niwa/contracts';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import {
  addDays,
  allDayKeys,
  atMinutes,
  dayKey,
  formatRange,
  formatTime,
  MINUTE,
  minutesOfDay,
  snap,
} from '../../lib/dates.ts';
import { visuallyHidden } from '../../lib/a11y.ts';
import { useEntryLook } from './entryDisplay.ts';
import { layoutDay, type Segment } from './layout.ts';

const HOUR_PX = 48;
const PX_PER_MIN = HOUR_PX / 60;
const MIN_DURATION = 15;
const GUTTER = 56;

interface TimeGridProps {
  days: Date[];
  entries: ScheduleEntry[];
  onCreateRange: (start: Date, end: Date) => void;
  onCreateAllDay: (day: Date) => void;
  onOpen: (entry: ScheduleEntry) => void;
  onChange: (entry: ScheduleEntry, start: Date, end: Date) => void;
}

type Drag =
  | { kind: 'create'; day: number; from: number; to: number }
  | {
      kind: 'move';
      entry: ScheduleEntry;
      grabOffset: number;
      duration: number;
      day: number;
      start: number;
      moved: boolean;
    }
  | { kind: 'resize'; entry: ScheduleEntry; day: number; start: number; end: number; moved: boolean };

/** Week / day planner — precise blocks: drag to create, move, resize (SCHEDULER.md §5). */
export function TimeGridView({
  days,
  entries,
  onCreateRange,
  onCreateAllDay,
  onOpen,
  onChange,
}: TimeGridProps) {
  const look = useEntryLook();
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), MINUTE);
    return () => window.clearInterval(t);
  }, []);

  // Open at 07:00 so the working day is in view.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_PX;
  }, []);

  const dayKeys = days.map(dayKey);
  const timed = entries.filter((e) => !e.isAllDay);
  const allDay = entries.filter((e) => e.isAllDay);

  const placedByDay = useMemo(
    () =>
      days.map((day) => {
        const dayStart = day.getTime();
        const dayEnd = addDays(day, 1).getTime();
        const segs: Segment<ScheduleEntry>[] = [];
        for (const e of timed) {
          const s = Date.parse(e.startAt);
          const en = Date.parse(e.endAt);
          if (s >= dayEnd || en <= dayStart) continue;
          segs.push({
            key: e.id,
            value: e,
            start: Math.max(0, (s - dayStart) / MINUTE),
            end: Math.min(1440, (en - dayStart) / MINUTE),
          });
        }
        return layoutDay(segs);
      }),
    [days, timed],
  );

  const pointer = (e: PointerEvent) => {
    const rect = gridRef.current!.getBoundingClientRect();
    const col = Math.min(
      days.length - 1,
      Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * days.length)),
    );
    const minutes = Math.min(1440, Math.max(0, (e.clientY - rect.top) / PX_PER_MIN));
    return { col, minutes };
  };

  const begin = (e: PointerEvent, next: Drag) => {
    e.preventDefault();
    e.stopPropagation();
    gridRef.current?.setPointerCapture(e.pointerId);
    setDrag(next);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!drag) return;
    const { col, minutes } = pointer(e);
    if (drag.kind === 'create') setDrag({ ...drag, to: snap(minutes) });
    else if (drag.kind === 'move') {
      const start = Math.min(1440 - MIN_DURATION, Math.max(0, snap(minutes - drag.grabOffset)));
      if (start !== drag.start || col !== drag.day) setDrag({ ...drag, day: col, start, moved: true });
    } else {
      const end = Math.max(drag.start + MIN_DURATION, Math.min(1440, snap(minutes)));
      if (end !== drag.end) setDrag({ ...drag, end, moved: true });
    }
  };

  const onPointerUp = () => {
    if (!drag) return;
    const d = drag;
    setDrag(null);
    if (d.kind === 'create') {
      const a = Math.min(d.from, d.to);
      const b = Math.max(d.from, d.to);
      const day = days[d.day]!;
      // A click (no drag) proposes one hour.
      onCreateRange(atMinutes(day, a), atMinutes(day, b - a >= MIN_DURATION ? b : a + 60));
    } else if (d.kind === 'move') {
      if (!d.moved) return onOpen(d.entry);
      const start = atMinutes(days[d.day]!, d.start);
      onChange(d.entry, start, new Date(start.getTime() + d.duration * MINUTE));
    } else if (d.moved) {
      const day = days[d.day]!;
      onChange(d.entry, new Date(d.entry.startAt), atMinutes(day, d.end));
    }
  };

  const ghost = (dayIndex: number) => {
    if (!drag || drag.day !== dayIndex) return null;
    if (drag.kind === 'create') {
      const a = Math.min(drag.from, drag.to);
      const b = Math.max(drag.from, drag.to, a + MIN_DURATION);
      return {
        top: a,
        height: b - a,
        label: formatRange(atMinutes(days[dayIndex]!, a), atMinutes(days[dayIndex]!, b)),
      };
    }
    if (drag.kind === 'move' && drag.moved) {
      return {
        top: drag.start,
        height: drag.duration,
        label: formatRange(
          atMinutes(days[dayIndex]!, drag.start),
          atMinutes(days[dayIndex]!, drag.start + drag.duration),
        ),
        color: look(drag.entry).color,
      };
    }
    return null;
  };

  const todayIndex = dayKeys.indexOf(dayKey(now));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Day headers */}
      <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', pl: `${GUTTER}px` }}>
        {days.map((d, i) => (
          <Box key={dayKeys[i]} sx={{ flex: 1, minWidth: 0, textAlign: 'center', py: 0.75 }}>
            <Typography variant="caption" color="text.secondary" component="div">
              {d.toLocaleDateString(undefined, { weekday: 'short' })}
            </Typography>
            <Typography
              variant="subtitle2"
              component="div"
              sx={{
                mx: 'auto',
                width: 28,
                height: 28,
                lineHeight: '28px',
                borderRadius: '50%',
                ...(i === todayIndex && { bgcolor: 'primary.main', color: 'primary.contrastText' }),
              }}
            >
              {d.getDate()}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* All-day row */}
      <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', minHeight: 32 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ width: GUTTER, flexShrink: 0, pt: 0.75, pr: 1, textAlign: 'right' }}
        >
          All day
        </Typography>
        {days.map((d, i) => {
          const list = allDay.filter((e) => allDayKeys(e.startAt, e.endAt).includes(dayKey(d).slice(0, 10)));
          return (
            <Box
              key={dayKeys[i]}
              onClick={(ev) => ev.target === ev.currentTarget && onCreateAllDay(d)}
              sx={{ flex: 1, minWidth: 0, borderLeft: 1, borderColor: 'divider', p: 0.25, cursor: 'pointer' }}
            >
              {list.map((e) => {
                const l = look(e);
                return (
                  <ButtonBase
                    key={e.id}
                    onClick={() => onOpen(e)}
                    sx={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      px: 0.75,
                      mb: 0.25,
                      borderRadius: 0.75,
                      typography: 'caption',
                      lineHeight: 1.6,
                      bgcolor: l.color,
                      color: l.textColor,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {l.title}
                  </ButtonBase>
                );
              })}
            </Box>
          );
        })}
      </Box>

      {/* Time grid */}
      <Box ref={scrollRef} sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <Box sx={{ display: 'flex', position: 'relative', height: 24 * HOUR_PX }}>
          <Box sx={{ width: GUTTER, flexShrink: 0, position: 'relative' }} aria-hidden>
            {Array.from({ length: 23 }, (_, h) => (
              <Typography
                key={h}
                variant="caption"
                color="text.secondary"
                sx={{ position: 'absolute', top: (h + 1) * HOUR_PX - 8, right: 8 }}
              >
                {formatTime(atMinutes(days[0]!, (h + 1) * 60)).replace(':00', '')}
              </Typography>
            ))}
          </Box>
          <Box
            ref={gridRef}
            role="grid"
            aria-label="Time grid"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setDrag(null)}
            sx={{
              flex: 1,
              display: 'flex',
              position: 'relative',
              touchAction: drag ? 'none' : 'pan-y',
              userSelect: 'none',
              backgroundImage: (theme) =>
                `repeating-linear-gradient(to bottom, ${(theme.vars ?? theme).palette.divider} 0 1px, transparent 1px ${HOUR_PX}px)`,
            }}
          >
            {/* display: contents keeps the flex layout while giving the grid its required row. */}
            <Box role="row" sx={{ display: 'contents' }}>
              {days.map((day, i) => (
                <Box
                  key={dayKeys[i]}
                  role="gridcell"
                  data-day={dayKeys[i]}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    const { minutes } = pointer(e);
                    const at = Math.floor(minutes / 15) * 15;
                    begin(e, { kind: 'create', day: i, from: at, to: at });
                  }}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    position: 'relative',
                    borderLeft: 1,
                    borderColor: 'divider',
                    cursor: 'crosshair',
                  }}
                >
                  <Box component="span" sx={visuallyHidden}>
                    {day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </Box>
                  {placedByDay[i]!.map((p) => {
                    const e = p.value;
                    const l = look(e);
                    const resizing = drag?.kind === 'resize' && drag.entry.id === e.id;
                    const moving = drag?.kind === 'move' && drag.entry.id === e.id && drag.moved;
                    const end = resizing ? drag.end : p.end;
                    const startD = new Date(e.startAt);
                    const endD = resizing ? atMinutes(day, drag.end) : new Date(e.endAt);
                    const height = Math.max(MIN_DURATION, end - p.start) * PX_PER_MIN;
                    return (
                      <Box
                        key={p.key}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && onOpen(e)}
                        onPointerDown={(ev) => {
                          if (ev.button !== 0) return;
                          const { minutes } = pointer(ev);
                          begin(ev, {
                            kind: 'move',
                            entry: e,
                            grabOffset: minutes - p.start, // keep the grab point under the pointer
                            duration: (Date.parse(e.endAt) - Date.parse(e.startAt)) / MINUTE,
                            day: i,
                            start: p.start,
                            moved: false,
                          });
                        }}
                        sx={{
                          position: 'absolute',
                          top: p.start * PX_PER_MIN,
                          height,
                          left: `calc(${(p.column / p.columns) * 100}% + 2px)`,
                          width: `calc(${100 / p.columns}% - 4px)`,
                          bgcolor: l.color,
                          color: l.textColor,
                          borderRadius: 1,
                          px: 0.75,
                          py: 0.25,
                          overflow: 'hidden',
                          cursor: 'grab',
                          opacity: moving ? 0.35 : 1,
                          boxShadow: 1,
                          zIndex: 1,
                          '&:focus-visible': { outline: 2, outlineColor: 'text.primary', outlineOffset: 1 },
                        }}
                      >
                        <Typography
                          variant="caption"
                          component="div"
                          sx={{
                            fontWeight: 600,
                            lineHeight: 1.3,
                            display: 'flex',
                            gap: 0.5,
                            alignItems: 'center',
                          }}
                          noWrap
                        >
                          {l.title}
                          {e.seriesId && <RepeatRounded sx={{ fontSize: '1em' }} />}
                        </Typography>
                        {/* Short blocks hide the time visually; keep it in the accessible name. */}
                        {height >= 34 ? (
                          <Typography variant="caption" component="div" sx={{ lineHeight: 1.3 }} noWrap>
                            {formatRange(startD, endD)}
                          </Typography>
                        ) : (
                          <Box component="span" sx={visuallyHidden}>
                            {formatRange(startD, endD)}
                          </Box>
                        )}
                        <Box
                          aria-hidden
                          onPointerDown={(ev) => {
                            if (ev.button !== 0) return;
                            begin(ev, {
                              kind: 'resize',
                              entry: e,
                              day: i,
                              start: p.start,
                              end: p.end,
                              moved: false,
                            });
                          }}
                          sx={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: 8,
                            cursor: 'ns-resize',
                          }}
                        />
                      </Box>
                    );
                  })}

                  {(() => {
                    const g = ghost(i);
                    if (!g) return null;
                    return (
                      <Box
                        aria-hidden
                        sx={(theme) => ({
                          position: 'absolute',
                          top: g.top * PX_PER_MIN,
                          height: g.height * PX_PER_MIN,
                          left: 2,
                          right: 2,
                          borderRadius: 1,
                          border: 2,
                          borderColor: g.color ?? 'primary.main',
                          bgcolor: theme.alpha(g.color ?? (theme.vars ?? theme).palette.primary.main, 0.25),
                          px: 0.75,
                          zIndex: 2,
                          pointerEvents: 'none',
                        })}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {g.label}
                        </Typography>
                      </Box>
                    );
                  })()}

                  {i === todayIndex && (
                    <Box
                      aria-hidden
                      sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: minutesOfDay(now) * PX_PER_MIN,
                        height: 2,
                        bgcolor: 'secondary.main',
                        zIndex: 3,
                        pointerEvents: 'none',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: -4,
                          top: -3,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'secondary.main',
                        },
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
