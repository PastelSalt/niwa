import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import EventOutlined from '@mui/icons-material/EventOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Popover from '@mui/material/Popover';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useId, useState } from 'react';
import { addDays, addMonths, dayKey, monthGridStart, parseDay, weekdayNames } from '../lib/dates.ts';

/**
 * Date-only field built from MUI pieces (NIWA-PLAN-B-02 V4 — pure-MUI rule, no picker library). Looks like
 * every other text field: shows "4 Nov 2026", accepts a typed date ("2026-11-04", "4 Nov 2026",
 * "Nov 4 2026") and has a small month calendar. Values are `YYYY-MM-DD` strings (specs §12.5) or null.
 */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** A typed date → `YYYY-MM-DD`, or null when it isn't a complete, real date. */
export function parseDateInput(text: string): string | null {
  const t = text.trim().toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ');
  let y: number, m: number, d: number;
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (match) [y, m, d] = [+match[1]!, +match[2]!, +match[3]!];
  else {
    // Optional weekday first ("wed 4 nov 2026"), then "4 nov 2026" or "nov 4 2026".
    const words = t.split(' ').filter((w) => !/^(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?$/.test(w));
    const monthAt = words.findIndex((w) => MONTHS.includes(w.slice(0, 3)));
    if (monthAt < 0 || words.length !== 3) return null;
    const nums = words.filter((_, i) => i !== monthAt).map(Number);
    if (nums.some((n) => !Number.isInteger(n))) return null;
    m = MONTHS.indexOf(words[monthAt]!.slice(0, 3)) + 1;
    [d, y] = [nums[0]!, nums[1]!];
  }
  if (y < 1000 || y > 9999) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return dayKey(date);
}

export function formatDateValue(value: string): string {
  return parseDay(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export interface DateFieldProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'defaultValue' | 'type'> {
  value: string | null;
  onChange: (value: string | null) => void;
  /** Allow clearing (empty → null). Default true. */
  clearable?: boolean;
}

export function DateField({ value, onChange, clearable = true, label, slotProps, ...rest }: DateFieldProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(false);
  // The calendar anchors to the whole field.
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const openFrom = (el: Element) => setAnchor(el.closest<HTMLElement>('.MuiFormControl-root'));
  const shown = focused ? draft : value ? formatDateValue(value) : '';

  const commit = (next: string | null) => {
    if (next !== value) onChange(next);
  };

  return (
    <>
      <TextField
        {...rest}
        label={label}
        value={shown}
        error={error || rest.error}
        placeholder="e.g. 4 Nov 2026"
        onFocus={() => {
          setFocused(true);
          setDraft(value ? formatDateValue(value) : '');
        }}
        onChange={(e) => {
          const text = e.target.value;
          setDraft(text);
          setError(false);
          // Commit as soon as the text is a complete date, like a native date input.
          const parsed = parseDateInput(text);
          if (parsed) commit(parsed);
          else if (!text.trim() && clearable) commit(null);
        }}
        onBlur={() => {
          setFocused(false);
          const parsed = parseDateInput(draft);
          if (draft.trim() && !parsed) setError(true);
          else if (!draft.trim() && !clearable && value) setDraft(formatDateValue(value));
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && e.altKey) {
            e.preventDefault();
            openFrom(e.currentTarget);
          }
        }}
        helperText={error ? 'Use a date like 4 Nov 2026' : rest.helperText}
        slotProps={{
          ...slotProps,
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  edge="end"
                  // Not the field's label, so "getByLabel('Due')" style lookups find only the input.
                  aria-label="Open calendar"
                  onClick={(e) => openFrom(e.currentTarget)}
                >
                  <EventOutlined fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <MonthCalendar
          value={value}
          onPick={(d) => {
            setAnchor(null);
            setError(false);
            setFocused(false);
            commit(d);
          }}
          onClear={
            clearable && value
              ? () => {
                  setAnchor(null);
                  commit(null);
                }
              : undefined
          }
        />
      </Popover>
    </>
  );
}

function MonthCalendar({
  value,
  onPick,
  onClear,
}: {
  value: string | null;
  onPick: (day: string) => void;
  onClear?: () => void;
}) {
  const today = dayKey(new Date());
  const [month, setMonth] = useState(() => parseDay(value ?? today));
  const titleId = useId();
  const start = monthGridStart(month);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7));

  return (
    <Box sx={{ p: 1.5, width: 296 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <IconButton size="small" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
          <ChevronLeftRounded />
        </IconButton>
        <Typography id={titleId} variant="subtitle2" sx={{ flex: 1, textAlign: 'center' }}>
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Typography>
        <IconButton size="small" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
          <ChevronRightRounded />
        </IconButton>
      </Box>
      <Box role="grid" aria-labelledby={titleId}>
        <Box role="row" sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {weekdayNames().map((n) => (
            <Typography
              key={n}
              role="columnheader"
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: 'center', py: 0.5 }}
            >
              {n.slice(0, 2)}
            </Typography>
          ))}
        </Box>
        {weeks.map((week) => (
          <Box
            key={dayKey(week[0]!)}
            role="row"
            sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}
          >
            {week.map((d) => {
              const key = dayKey(d);
              const selected = key === value;
              const inMonth = d.getMonth() === month.getMonth();
              return (
                <Box
                  key={key}
                  role="gridcell"
                  aria-selected={selected}
                  sx={{ display: 'grid', placeItems: 'center' }}
                >
                  <ButtonBase
                    onClick={() => onPick(key)}
                    aria-label={d.toLocaleDateString(undefined, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      typography: 'body2',
                      color: selected ? 'primary.contrastText' : inMonth ? 'text.primary' : 'text.secondary',
                      bgcolor: selected ? 'primary.main' : 'transparent',
                      fontWeight: key === today ? 700 : 400,
                      border: key === today && !selected ? 1 : 0,
                      borderColor: 'primary.main',
                      '&:hover': { bgcolor: selected ? 'primary.main' : 'action.hover' },
                      '&.Mui-focusVisible': { outline: 2, outlineColor: 'primary.main', outlineOffset: 1 },
                    }}
                  >
                    {d.getDate()}
                  </ButtonBase>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
        <Button size="small" onClick={() => onPick(today)}>
          Today
        </Button>
        {onClear && (
          <Button size="small" color="inherit" onClick={onClear}>
            Clear
          </Button>
        )}
      </Box>
    </Box>
  );
}
