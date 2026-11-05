import CheckRounded from '@mui/icons-material/CheckRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { EditScope, ItemSummary, Recurrence, ScheduleEntry, ScheduleKind } from '@niwa/contracts';
import { useMemo, useState } from 'react';
import { DateField } from '../../components/DateField.tsx';
import { messageOf } from '../../api/client.ts';
import { useNotify } from '../../components/Notifier.tsx';
import {
  addDaysToKey,
  browserTimeZone,
  dayKey,
  fromInputs,
  toTimeInput,
  utcDayKey,
  utcMidnight,
} from '../../lib/dates.ts';
import { ItemTypeIcon } from '../items/itemMeta.tsx';
import { useTree } from '../items/queries.ts';
import { ENTRY_COLORS } from './entryDisplay.ts';
import { repeatSummary } from './repeatSummary.ts';
import { useCreateEntry, useDeleteEntry, useUpdateEntry } from './queries.ts';

export type EntryDialogRequest =
  | { mode: 'create'; kind: ScheduleKind; start: Date; end: Date; allDay?: boolean; itemId?: string }
  | { mode: 'edit'; entry: ScheduleEntry };

const RECURRENCE_LABEL: Record<Recurrence, string> = {
  none: 'Does not repeat',
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
};

interface FormState {
  kind: ScheduleKind;
  itemId: string | null;
  title: string;
  allDay: boolean;
  startDay: string;
  startTime: string;
  endDay: string;
  endTime: string;
  color: string | null;
  recurrence: Recurrence;
}

function initialState(req: EntryDialogRequest): FormState {
  if (req.mode === 'create') {
    return {
      kind: req.kind,
      itemId: req.itemId ?? null,
      title: '',
      allDay: !!req.allDay,
      startDay: dayKey(req.start),
      startTime: toTimeInput(req.start),
      endDay: dayKey(req.allDay ? req.start : req.end),
      endTime: toTimeInput(req.end),
      color: null,
      recurrence: 'none',
    };
  }
  const e = req.entry;
  const start = new Date(e.startAt);
  const end = new Date(e.endAt);
  return {
    kind: e.kind,
    itemId: e.itemId,
    title: e.title,
    allDay: e.isAllDay,
    // All-day entries are calendar dates; the stored end is exclusive.
    startDay: e.isAllDay ? utcDayKey(e.startAt) : dayKey(start),
    startTime: toTimeInput(start),
    endDay: e.isAllDay ? addDaysToKey(utcDayKey(e.endAt), -1) : dayKey(end),
    endTime: toTimeInput(end),
    color: e.color,
    recurrence: e.recurrence,
  };
}

/**
 * Create / edit a calendar entry — specs §4.3, SCHEDULER.md §4. One "Add to calendar" dialog (B-01 B12): a
 * title and an optional "For a task"; with a task it saves a time block, without one an event (same data).
 */
export function EntryDialog({ request, onClose }: { request: EntryDialogRequest; onClose: () => void }) {
  const [f, setF] = useState<FormState>(() => initialState(request));
  const [scope, setScope] = useState<EditScope>('instance');
  const [error, setError] = useState<string | null>(null);
  const { data: tree = [] } = useTree();
  const create = useCreateEntry();
  const update = useUpdateEntry();
  const remove = useDeleteEntry();
  const notify = useNotify();

  const editing = request.mode === 'edit' ? request.entry : null;
  const recurring = !!editing?.seriesId;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));
  const item = f.itemId ? (tree.find((i) => i.id === f.itemId) ?? null) : null;
  // Open tasks and projects first, then everything else (blocks can be for any item).
  const options = useMemo(
    () =>
      [...tree]
        .filter((i) => !(i.nature === 'actionable' && i.status === 'completed'))
        .sort((a, b) => Number(b.nature === 'actionable') - Number(a.nature === 'actionable')),
    [tree],
  );

  const times = () => {
    if (f.allDay) {
      return { startAt: utcMidnight(f.startDay), endAt: utcMidnight(addDaysToKey(f.endDay, 1)) };
    }
    return {
      startAt: fromInputs(f.startDay, f.startTime).toISOString(),
      endAt: fromInputs(f.endDay, f.endTime).toISOString(),
    };
  };

  const save = async () => {
    setError(null);
    const { startAt, endAt } = times();
    if (new Date(endAt) <= new Date(startAt)) return setError('End must be after start.');
    if (f.kind === 'event' && !f.title.trim()) return setError('Give it a title, or pick the task it’s for.');
    if (f.kind === 'block' && !f.itemId) return setError('Pick the task this time is for.');
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          scope: recurring ? scope : 'instance',
          input: {
            title: f.title.trim(),
            startAt,
            endAt,
            isAllDay: f.allDay,
            color: f.color,
            ...(recurring && scope === 'instance'
              ? {}
              : { recurrence: f.recurrence, timeZone: browserTimeZone() }),
          },
        });
        notify('Saved');
      } else {
        await create.mutateAsync({
          kind: f.kind,
          itemId: f.kind === 'block' ? f.itemId : null,
          title: f.title.trim() || undefined,
          startAt,
          endAt,
          isAllDay: f.allDay,
          color: f.color,
          recurrence: f.recurrence,
          timeZone: browserTimeZone(),
        });
        notify(f.kind === 'block' ? `Time set for “${item?.title ?? 'task'}”` : 'Added to the calendar');
      }
      onClose();
    } catch (err) {
      setError(messageOf(err));
    }
  };

  const del = async () => {
    if (!editing) return;
    try {
      await remove.mutateAsync({ id: editing.id, scope: recurring ? scope : 'instance' });
      notify(recurring && scope === 'future' ? 'Deleted this and following' : 'Deleted', {
        severity: 'info',
      });
      onClose();
    } catch (err) {
      setError(messageOf(err));
    }
  };

  const busy = create.isPending || update.isPending || remove.isPending;

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {editing ? (f.kind === 'block' ? 'Time for a task' : 'Event') : 'Add to calendar'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={f.kind === 'block' ? 'Title (optional)' : 'Title'}
            value={f.title}
            onChange={(e) => set('title', e.target.value)}
            autoFocus={!editing && !f.itemId}
            helperText={f.kind === 'block' ? 'Leave empty to show the task’s name.' : undefined}
            slotProps={{ htmlInput: { maxLength: 300 } }}
          />

          {/* With a task this is time for it (a block); without, an event (B-01 B12). */}
          <Autocomplete<ItemSummary>
            options={options}
            value={item}
            disabled={!!editing}
            onChange={(_, v) => setF((s) => ({ ...s, itemId: v?.id ?? null, kind: v ? 'block' : 'event' }))}
            getOptionLabel={(o) => o.title}
            groupBy={(o) => (o.nature === 'actionable' ? 'Tasks and projects' : 'Pages')}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderOption={(props, o) => {
              const { key, ...rest } = props;
              return (
                <li key={key} {...rest}>
                  <ItemTypeIcon type={o.type} fontSize="small" sx={{ mr: 1 }} />
                  {o.title}
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="For a task (optional)"
                helperText={editing ? undefined : 'Pick one to give that task time on your calendar.'}
              />
            )}
          />

          <Typography variant="overline" color="text.secondary" component="p" sx={{ mb: -1 }}>
            When
          </Typography>
          <FormControlLabel
            control={<Switch checked={f.allDay} onChange={(e) => set('allDay', e.target.checked)} />}
            label="All day"
          />

          <Stack direction="row" spacing={1}>
            <DateField
              label={f.allDay ? 'From' : 'Date'}
              value={f.startDay}
              clearable={false}
              onChange={(v) => v && setF((s) => ({ ...s, startDay: v, endDay: s.endDay < v ? v : s.endDay }))}
            />
            {!f.allDay && (
              <TextField
                type="time"
                label="Start"
                value={f.startTime}
                onChange={(e) => set('startTime', e.target.value)}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 900 } }}
              />
            )}
          </Stack>
          <Stack direction="row" spacing={1}>
            <DateField
              label={f.allDay ? 'To' : 'End date'}
              value={f.endDay}
              clearable={false}
              onChange={(v) => v && set('endDay', v)}
            />
            {!f.allDay && (
              <TextField
                type="time"
                label="End"
                value={f.endTime}
                onChange={(e) => set('endTime', e.target.value)}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 900 } }}
              />
            )}
          </Stack>

          <TextField
            select
            label="Repeat"
            value={f.recurrence}
            onChange={(e) => set('recurrence', e.target.value as Recurrence)}
            disabled={recurring && scope === 'instance'}
            helperText={
              recurring && scope === 'instance'
                ? 'Choose “This and following” to change the repeat.'
                : (repeatSummary(f.recurrence, f.startDay, f.startTime, f.allDay) ?? undefined)
            }
          >
            {(Object.keys(RECURRENCE_LABEL) as Recurrence[]).map((r) => (
              <MenuItem key={r} value={r}>
                {RECURRENCE_LABEL[r]}
              </MenuItem>
            ))}
          </TextField>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Colour
            </Typography>
            <Box role="radiogroup" aria-label="Colour" sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Tooltip title="Automatic">
                <ButtonBase
                  role="radio"
                  aria-checked={f.color === null}
                  aria-label="Automatic"
                  onClick={() => set('color', null)}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: 2,
                    borderColor: f.color === null ? 'text.primary' : 'divider',
                    typography: 'caption',
                  }}
                >
                  A
                </ButtonBase>
              </Tooltip>
              {ENTRY_COLORS.map((c) => (
                <Tooltip key={c.hex} title={c.name}>
                  <ButtonBase
                    role="radio"
                    aria-checked={f.color === c.hex}
                    aria-label={c.name}
                    onClick={() => set('color', c.hex)}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: c.hex,
                      color: 'common.white',
                      outline: f.color === c.hex ? 2 : 0,
                      outlineOffset: 2,
                      outlineColor: 'text.primary',
                    }}
                  >
                    {f.color === c.hex && <CheckRounded fontSize="inline" />}
                  </ButtonBase>
                </Tooltip>
              ))}
            </Box>
          </Box>

          {recurring && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                This is a repeating {f.kind === 'block' ? 'block' : 'event'}. Apply changes to:
              </Typography>
              <RadioGroup row value={scope} onChange={(e) => setScope(e.target.value as EditScope)}>
                <FormControlLabel value="instance" control={<Radio size="small" />} label="This event" />
                <FormControlLabel
                  value="future"
                  control={<Radio size="small" />}
                  label="This and following"
                />
              </RadioGroup>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        {editing && (
          <Button
            color="error"
            startIcon={<DeleteOutlineRounded />}
            onClick={() => void del()}
            disabled={busy}
            sx={{ mr: 'auto' }}
          >
            Delete
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => void save()} loading={busy}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
