import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Drawer from '@mui/material/Drawer';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Link, useLocation, useNavigate } from 'react-router';
import { Wordmark } from '../components/Wordmark.tsx';
import { useInbox } from '../features/inbox/queries.ts';
import { DESTINATIONS, destinationForPath, type Destination } from './destinations.tsx';

export const RAIL_WIDTH = 76;

/** Permanent mini rail (two panes and up): the four places, Settings at the foot. */
export function NavRail() {
  const current = destinationForPath(useLocation().pathname)?.key;
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: RAIL_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: RAIL_WIDTH,
          boxSizing: 'border-box',
          bgcolor: 'background.default',
          borderRight: 1,
          borderColor: 'divider',
          py: 1.5,
        },
      }}
    >
      <Box
        component="nav"
        aria-label="Main"
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flex: 1 }}
      >
        <Box sx={{ height: 40, display: 'grid', placeItems: 'center', mb: 1 }}>
          <Wordmark size="small" />
        </Box>
        {DESTINATIONS.filter((d) => d.inNav || d.key === 'settings').map((d) => (
          <Tooltip
            key={d.key}
            title={d.shortcut ? `${d.label}  ·  g ${d.shortcut}` : d.label}
            placement="right"
            describeChild
          >
            <ButtonBase
              component={Link}
              to={d.path}
              // Active by place, not exact path: Garden is active on its Notes and Tasks filters too.
              className={current === d.key ? 'active' : ''}
              aria-current={current === d.key ? 'page' : undefined}
              data-tour={`nav-${d.key}`}
              sx={(theme) => ({
                width: 60,
                py: 1,
                borderRadius: 2,
                flexDirection: 'column',
                gap: 0.25,
                color: 'text.secondary',
                ...(d.key === 'settings' && { mt: 'auto' }),
                '&:hover': { bgcolor: 'action.hover' },
                '&.active': {
                  // Label stays body-text colour (4.5:1 on the tint); the icon carries the accent.
                  color: 'text.primary',
                  '& svg': { color: 'primary.main' },
                  bgcolor: theme.alpha((theme.vars ?? theme).palette.primary.main, 0.12),
                },
                '&.Mui-focusVisible': { outline: 2, outlineColor: 'primary.main' },
              })}
            >
              <DestIcon d={d} />
              <Typography component="span" variant="caption" sx={{ fontWeight: 600 }}>
                {d.label}
              </Typography>
            </ButtonBase>
          </Tooltip>
        ))}
      </Box>
    </Drawer>
  );
}

/** Phone navigation (single pane) — the four places. */
export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const items = DESTINATIONS.filter((d) => d.inNav);
  const current = destinationForPath(location.pathname)?.key ?? false;

  return (
    <Paper
      component="nav"
      aria-label="Main"
      square
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: 1,
        borderColor: 'divider',
        zIndex: 'appBar',
      }}
    >
      <BottomNavigation
        value={items.some((d) => d.key === current) ? current : false}
        onChange={(_, key: string) => navigate(items.find((d) => d.key === key)!.path)}
        showLabels
      >
        {items.map((d) => (
          <BottomNavigationAction
            key={d.key}
            value={d.key}
            data-tour={`nav-${d.key}`}
            label={d.label}
            icon={<DestIcon d={d} />}
            sx={{ minWidth: 0 }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}

/** Destination icon; Inbox shows how many captures await filing. */
export function DestIcon({ d }: { d: Destination }) {
  const { data: inbox } = useInbox();
  if (d.key !== 'inbox') return <>{d.icon}</>;
  const count = inbox?.length ?? 0;
  return (
    <Badge badgeContent={count} color="secondary" max={99} invisible={count === 0}>
      {d.icon}
    </Badge>
  );
}
