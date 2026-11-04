import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type { ItemSummary } from '@niwa/contracts';
import { useId, useState, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { ItemTypeIcon, LENS_PATH } from './itemMeta.tsx';

/**
 * One row for an item in any list — Focus, Inbox, Inside, Search, Trash (NIWA-PLAN-B-02 V3).
 *
 * [select] [icon or completion] [title / meta / extra · chips] [actions]
 *
 * Laid out as a flex row (no absolutely positioned actions), so nothing can overlap the title. Chips sit to
 * the right when there's room and wrap under the meta line when there isn't; on phones the actions collapse
 * into a "⋯" menu so the title gets the full width.
 */

export interface RowAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  /** Shown as a text button (others are icon buttons) on wide screens. */
  primary?: boolean;
  /** Accessible name when it differs from `label` (e.g. "Delete <title>"). */
  ariaLabel?: string;
}

export interface ItemRowProps {
  item: ItemSummary;
  /** Where the row leads; `null` for rows that don't open anything (Trash). */
  to?: string | null;
  /** Replaces the plain title (search highlighting). */
  title?: ReactNode;
  /** Secondary line: path, status, type, time. */
  meta?: ReactNode;
  /** Extra block under the meta line (search snippet). */
  extra?: ReactNode;
  chips?: ReactNode;
  /** Tasks and projects: a round completion control instead of the type icon. */
  completion?: { done: boolean; onToggle: () => void };
  /** Inbox multi-select. */
  selection?: { checked: boolean; onChange: () => void };
  actions?: RowAction[];
  /** Struck-through title (completed). */
  done?: boolean;
}

/** The completion control — a circle, the same shape the tree uses for tasks (V3). */
export function CompleteToggle({
  done,
  onToggle,
  title,
}: {
  done: boolean;
  onToggle: () => void;
  title: string;
}) {
  return (
    <Checkbox
      checked={done}
      onChange={onToggle}
      icon={<RadioButtonUncheckedRounded />}
      checkedIcon={<CheckCircleRounded />}
      sx={{ color: 'itemType.task', '&.Mui-checked': { color: 'success.main' } }}
      slotProps={{ input: { 'aria-label': done ? `Reopen ${title}` : `Complete ${title}` } }}
    />
  );
}

export function ItemRow({
  item,
  to,
  title,
  meta,
  extra,
  chips,
  completion,
  selection,
  actions = [],
  done = item.status === 'completed',
}: ItemRowProps) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const href = to === undefined ? `${LENS_PATH[item.nature]}/${item.id}` : to;
  const titleId = useId();

  const body = (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: 1.5,
        rowGap: 0.75,
        py: 1.25,
        pr: 1,
      }}
    >
      <Box sx={{ flex: '1 1 14rem', minWidth: 0 }}>
        <Typography
          id={titleId}
          variant="body1"
          sx={{
            fontWeight: 500,
            textDecoration: done && completion ? 'line-through' : 'none',
            color: done && completion ? 'text.secondary' : 'text.primary',
            // Two lines at most, then an ellipsis — long titles stay readable on phones.
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            overflowWrap: 'anywhere',
          }}
        >
          {title ?? item.title}
        </Typography>
        {meta && (
          <Typography variant="body2" color="text.secondary" component="div" noWrap>
            {meta}
          </Typography>
        )}
        {extra}
      </Box>
      {chips && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, flex: '0 1 auto', minWidth: 0 }}>{chips}</Box>
      )}
    </Box>
  );

  return (
    <Box
      component="li"
      aria-labelledby={titleId}
      sx={{
        display: 'flex',
        alignItems: 'center',
        minHeight: 56,
        pl: 0.5,
        borderBottom: 1,
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 0 },
        listStyle: 'none',
      }}
    >
      {selection && (
        <Checkbox
          checked={selection.checked}
          onChange={selection.onChange}
          slotProps={{ input: { 'aria-label': `Select ${item.title}` } }}
        />
      )}
      {completion ? (
        <CompleteToggle done={completion.done} onToggle={completion.onToggle} title={item.title} />
      ) : (
        <Box sx={{ display: 'flex', px: 1.25, color: 'text.secondary' }}>
          <ItemTypeIcon type={item.type} completed={item.status === 'completed'} fontSize="small" />
        </Box>
      )}
      {href ? (
        <ButtonBase
          component={RouterLink}
          to={href}
          sx={{
            flex: 1,
            minWidth: 0,
            justifyContent: 'flex-start',
            textAlign: 'left',
            borderRadius: 1,
            pl: 0.5,
            '&:hover': { bgcolor: 'action.hover' },
            '&.Mui-focusVisible': { outline: 2, outlineColor: 'primary.main', outlineOffset: -2 },
          }}
        >
          {body}
        </ButtonBase>
      ) : (
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', pl: 0.5 }}>{body}</Box>
      )}
      {actions.length > 0 && <RowActions actions={actions} compact={isPhone} title={item.title} />}
    </Box>
  );
}

function RowActions({ actions, compact, title }: { actions: RowAction[]; compact: boolean; title: string }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  if (compact) {
    return (
      <Box sx={{ pr: 0.5 }}>
        <IconButton aria-label={`Actions for ${title}`} onClick={(e) => setAnchor(e.currentTarget)}>
          <MoreHorizRounded />
        </IconButton>
        <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
          {actions.map((a) => (
            <MenuItem
              key={a.label}
              onClick={() => {
                setAnchor(null);
                a.onClick();
              }}
            >
              <ListItemIcon>{a.icon}</ListItemIcon>
              {a.label}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pr: 1 }}>
      {actions.map((a) =>
        a.primary ? (
          <Button key={a.label} size="small" startIcon={a.icon} onClick={a.onClick} aria-label={a.ariaLabel}>
            {a.label}
          </Button>
        ) : (
          <Tooltip key={a.label} title={a.label}>
            <IconButton size="small" aria-label={a.ariaLabel ?? a.label} onClick={a.onClick}>
              {a.icon}
            </IconButton>
          </Tooltip>
        ),
      )}
    </Box>
  );
}

/** The list around rows: an outlined surface with no bullets. */
export function ItemRowList({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      component="ul"
      aria-label={label}
      sx={{ m: 0, p: 0, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}
    >
      {children}
    </Box>
  );
}
