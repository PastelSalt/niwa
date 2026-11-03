import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import FolderOutlined from '@mui/icons-material/FolderOutlined';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import type { ItemNature, ItemPriority, ItemStatus, ItemType } from '@niwa/contracts';

/** Labels, icons and theme colors for item enums. Colors resolve via theme.palette.itemType (tokens). */

export const TYPE_LABEL: Record<ItemType, string> = {
  project: 'Project',
  task: 'Task',
  note: 'Note',
  idea: 'Idea',
};

export const STATUS_LABEL: Record<ItemStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  blocked: 'Blocked',
  completed: 'Completed',
};

export const STATUS_COLOR: Record<ItemStatus, 'default' | 'info' | 'warning' | 'success'> = {
  not_started: 'default',
  in_progress: 'info',
  blocked: 'warning',
  completed: 'success',
};

export const PRIORITY_LABEL: Record<ItemPriority, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const DEFAULT_TYPE_FOR: Record<ItemNature, ItemType> = { knowledge: 'note', actionable: 'task' };

export const LENS_PATH: Record<ItemNature, string> = { knowledge: '/knowledge', actionable: '/actionable' };

export function ItemTypeIcon({
  type,
  completed,
  ...props
}: { type: ItemType; completed?: boolean } & SvgIconProps) {
  const sx = { color: `itemType.${type}`, ...props.sx };
  if (type === 'task') {
    return completed ? (
      <CheckCircleRounded {...props} sx={sx} />
    ) : (
      <RadioButtonUncheckedRounded {...props} sx={sx} />
    );
  }
  if (type === 'project') return <FolderOutlined {...props} sx={sx} />;
  if (type === 'idea') return <LightbulbOutlined {...props} sx={sx} />;
  return <DescriptionOutlined {...props} sx={sx} />;
}

/** Local calendar day as YYYY-MM-DD (dueAt/reviewAt are date-only — specs §12.5). */
export function todayLocal(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
