import Box from '@mui/material/Box';
import Chip, { type ChipProps } from '@mui/material/Chip';
import type { ItemPriority, ItemStatus } from '@niwa/contracts';
import { PRIORITY_LABEL, STATUS_LABEL, formatDay } from './itemMeta.tsx';

/**
 * Meta chips for item rows (NIWA-PLAN-B-02 V3): status, priority, due and tags. Quiet by design — deep text
 * on the surface for AA, with the role colour carried by a dot and the outline (3:1, `contrast.test.ts`).
 */

function Dot({ color }: { color: string }) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0, ml: 0.75 }}
    />
  );
}

function MetaChip({ tone, label, ...props }: { tone?: string; label: string } & Omit<ChipProps, 'label'>) {
  return (
    <Chip
      size="small"
      variant="outlined"
      icon={tone ? <Dot color={tone} /> : undefined}
      label={label}
      {...props}
      sx={[
        { color: 'text.primary', typography: 'caption', ...(tone && { borderColor: tone }) },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    />
  );
}

export function StatusChip({ status }: { status: ItemStatus }) {
  return <MetaChip tone={`status.${status}`} label={STATUS_LABEL[status]} />;
}

export function PriorityChip({ priority }: { priority: ItemPriority }) {
  if (priority === 'none') return null;
  return <MetaChip tone={`priority.${priority}`} label={PRIORITY_LABEL[priority]} />;
}

const DAY = 86_400_000;
const dayNumber = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / DAY;

/** Due date: overdue / today / soon (≤ 3 days) get their own wording and tone; done items stay neutral. */
export function DueChip({ due, today, done = false }: { due: string; today: string; done?: boolean }) {
  const days = dayNumber(due) - dayNumber(today);
  if (done) return <MetaChip label={`Due ${formatDay(due)}`} />;
  if (days < 0) return <MetaChip tone="error.main" label={`Overdue · ${formatDay(due)}`} />;
  if (days === 0) return <MetaChip tone="warning.main" label="Due today" />;
  if (days === 1) return <MetaChip tone="info.main" label="Due tomorrow" />;
  if (days <= 3) return <MetaChip tone="info.main" label={`Due ${formatDay(due)}`} />;
  return <MetaChip label={`Due ${formatDay(due)}`} />;
}

export function TagChip({ tag }: { tag: string }) {
  return <MetaChip label={`#${tag}`} sx={{ bgcolor: 'action.hover', borderColor: 'transparent' }} />;
}

/** A plain hint chip (e.g. the Inbox's suggested place). */
export function HintChip({ label }: { label: string }) {
  return <MetaChip label={label} />;
}
