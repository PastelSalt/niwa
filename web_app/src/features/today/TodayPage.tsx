import EventRepeatOutlined from '@mui/icons-material/EventRepeatOutlined';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import RepeatRounded from '@mui/icons-material/RepeatRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ScheduleEntry } from '@niwa/contracts';
import { useMemo, useState, type ReactNode } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import { Page } from '../../components/Page.tsx';
import { SectionHeader } from '../../components/SectionHeader.tsx';
import { addDays, dayKey, formatTime, startOfDay } from '../../lib/dates.ts';
import { FocusRow } from '../actionable/FocusView.tsx';
import { dedupeFocus, FOCUS_SECTIONS } from '../actionable/focusSections.ts';
import { useInbox } from '../inbox/queries.ts';
import { todayLocal } from '../items/itemMeta.tsx';
import { ItemRowList } from '../items/ItemRow.tsx';
import { RowSkeletons } from '../items/RowSkeletons.tsx';
import { useFocus, useTree } from '../items/queries.ts';
import { buildTree } from '../items/treeModel.ts';
import { useReview } from '../knowledge/queries.ts';
import { EntryDialog, type EntryDialogRequest } from '../scheduler/EntryDialog.tsx';
import { entryBlockSx, useEntryLook } from '../scheduler/entryDisplay.ts';
import { HolidayLabel } from '../scheduler/HolidayLabel.tsx';
import { holidaysByDay, useHolidays, useScheduleRange } from '../scheduler/queries.ts';
import { GettingStarted } from './GettingStarted.tsx';

const NEXT_UP = 5;

function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/**
 * Today (NIWA-PLAN-B-01 B9): the calm home. What's on today, the next few tasks, what's waiting in the Inbox
 * and what's due for review — each part hides when there's nothing to show.
 */
export function TodayPage() {
  const today = todayLocal();
  const now = new Date();

  return (
    <Page width="list">
      <Typography variant="h2" component="h2">
        {greeting(now)}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
      </Typography>

      <Stack spacing={4}>
        <GettingStarted />
        <TodaysCalendar today={today} />
        <NextUp today={today} />
        <Waiting today={today} />
      </Stack>
    </Page>
  );
}

function TodaysCalendar({ today }: { today: string }) {
  const start = startOfDay(new Date());
  const { data: entries, isLoading } = useScheduleRange(start.toISOString(), addDays(start, 1).toISOString());
  const { data: holidayList } = useHolidays(today, today);
  const holidays = holidaysByDay(holidayList).get(today) ?? [];
  const look = useEntryLook();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<EntryDialogRequest | null>(null);
  const list = useMemo(
    () =>
      [...(entries ?? [])].sort(
        (a, b) => Number(b.isAllDay) - Number(a.isAllDay) || a.startAt.localeCompare(b.startAt),
      ),
    [entries],
  );
  // Read once per render of the list; the page re-renders on data changes, which is often enough here.
  const [nowMs] = useState(() => Date.now());

  return (
    <section aria-labelledby="today-calendar">
      <SectionHeader
        id="today-calendar"
        title="Today’s calendar"
        action={
          <Button size="small" component={RouterLink} to={`/scheduler/day/${dayKey(start)}`}>
            Open calendar
          </Button>
        }
      />
      {isLoading && <RowSkeletons rows={2} />}
      {holidays.map((h) => (
        <HolidayLabel key={h.name} holiday={h} />
      ))}
      {!isLoading && list.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Nothing planned today.{' '}
          <Button
            size="small"
            onClick={() =>
              setDialog({
                mode: 'create',
                kind: 'event',
                start: new Date(Math.ceil(nowMs / 3_600_000) * 3_600_000),
                end: new Date(Math.ceil(nowMs / 3_600_000) * 3_600_000 + 3_600_000),
              })
            }
          >
            Add to calendar
          </Button>
        </Typography>
      )}
      {list.length > 0 && (
        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
          {list.map((e) => {
            const l = look(e);
            const past = !e.isAllDay && Date.parse(e.endAt) < nowMs;
            const current = !e.isAllDay && Date.parse(e.startAt) <= nowMs && !past;
            return (
              <li key={e.id}>
                <AgendaRow
                  entry={e}
                  title={l.title}
                  color={l.color}
                  textColor={l.textColor}
                  past={past}
                  current={current}
                  onOpen={() =>
                    l.item ? navigate(`/items/${l.item.id}`) : setDialog({ mode: 'edit', entry: e })
                  }
                />
              </li>
            );
          })}
        </Box>
      )}
      {dialog && <EntryDialog key="today" request={dialog} onClose={() => setDialog(null)} />}
    </section>
  );
}

function AgendaRow({
  entry,
  title,
  color,
  textColor,
  past,
  current,
  onOpen,
}: {
  entry: ScheduleEntry;
  title: string;
  color: string;
  textColor: string;
  past: boolean;
  current: boolean;
  onOpen: () => void;
}) {
  return (
    <ButtonBase
      onClick={onOpen}
      sx={(t) => ({
        width: '100%',
        justifyContent: 'flex-start',
        textAlign: 'left',
        gap: 1.5,
        px: 1.5,
        py: 1,
        mb: 0.75,
        borderRadius: 1,
        opacity: past ? 0.6 : 1,
        ...entryBlockSx({ color, textColor })(t),
        ...(current && { outline: 2, outlineColor: 'primary.main', outlineStyle: 'solid' }),
      })}
    >
      <Typography variant="body2" sx={{ width: 72, flexShrink: 0, fontWeight: 600 }}>
        {entry.isAllDay ? 'All day' : formatTime(new Date(entry.startAt))}
      </Typography>
      <Typography variant="body1" sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
        {title}
      </Typography>
      {current && (
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          Now
        </Typography>
      )}
      {entry.seriesId && <RepeatRounded fontSize="inline" />}
    </ButtonBase>
  );
}

/** The first few tasks from Focus, most urgent first, each once. */
function NextUp({ today }: { today: string }) {
  const { data, isLoading } = useFocus(today);
  const { data: items } = useTree();
  const model = useMemo(() => buildTree(items ?? []), [items]);
  const next = useMemo(() => {
    if (!data) return [];
    const d = dedupeFocus(data);
    return FOCUS_SECTIONS.flatMap((s) => d[s.key].map((item) => ({ item, section: s.key })))
      .filter(({ item }) => item.status !== 'completed')
      .slice(0, NEXT_UP);
  }, [data]);

  return (
    <section aria-labelledby="next-up">
      <SectionHeader
        id="next-up"
        title="Next up"
        action={
          <Button size="small" component={RouterLink} to="/actionable">
            All tasks
          </Button>
        }
      />
      {isLoading && <RowSkeletons rows={3} />}
      {!isLoading && next.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No open tasks with a date, priority or progress. New tasks you start or give a date show up here.
        </Typography>
      )}
      {next.length > 0 && (
        <ItemRowList label="Next up">
          {next.map(({ item, section }) => (
            <FocusRow key={item.id} item={item} model={model} today={today} section={section} />
          ))}
        </ItemRowList>
      )}
    </section>
  );
}

/** The Inbox and the review queue, as two quiet cards — only when there's something in them. */
function Waiting({ today }: { today: string }) {
  const { data: inbox = [] } = useInbox();
  const { data: review = [] } = useReview(today);
  if (inbox.length === 0 && review.length === 0) return null;
  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
      {inbox.length > 0 && (
        <WaitingCard
          icon={<InboxOutlined />}
          title={inbox.length === 1 ? '1 thought to sort' : `${inbox.length} thoughts to sort`}
          text="Captured, not filed yet."
          action={
            <Button variant="contained" size="small" component={RouterLink} to="/inbox?sort=1">
              Sort now
            </Button>
          }
        />
      )}
      {review.length > 0 && (
        <WaitingCard
          icon={<EventRepeatOutlined />}
          title={review.length === 1 ? '1 note to review' : `${review.length} notes to review`}
          text="Notes you asked to revisit."
          action={
            <Button variant="outlined" size="small" component={RouterLink} to="/knowledge/review">
              Review
            </Button>
          }
        />
      )}
    </Box>
  );
}

function WaitingCard({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action: ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
      <Box sx={{ color: 'primary.main', display: 'flex', pt: 0.25 }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" component="h3">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {text}
        </Typography>
        {action}
      </Box>
    </Paper>
  );
}
