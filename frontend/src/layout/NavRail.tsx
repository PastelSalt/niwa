import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Drawer from '@mui/material/Drawer';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { Wordmark } from '../components/Wordmark.tsx';
import { DESTINATIONS, destinationForPath } from './destinations.tsx';

export const RAIL_WIDTH = 76;

/** Permanent mini rail (≥ md). */
export function NavRail() {
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
        {DESTINATIONS.map((d) => (
          <Tooltip
            key={d.key}
            title={d.shortcut ? `${d.label}  ·  g ${d.shortcut}` : d.label}
            placement="right"
          >
            <ButtonBase
              component={NavLink}
              to={d.path}
              aria-label={d.label}
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
                  color: 'primary.main',
                  bgcolor: theme.alpha((theme.vars ?? theme).palette.primary.main, 0.12),
                },
                '&.Mui-focusVisible': { outline: 2, outlineColor: 'primary.main' },
              })}
            >
              {d.icon}
              <Typography component="span" sx={{ fontSize: 11, fontWeight: 600 }}>
                {d.label}
              </Typography>
            </ButtonBase>
          </Tooltip>
        ))}
      </Box>
    </Drawer>
  );
}

/** Phone navigation (< md) — CONCEPT.md §1.2. */
export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const items = DESTINATIONS.filter((d) => d.inBottomNav);
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
      <BottomNavigation value={current} onChange={(_, key: string) => navigate(`/${key}`)} showLabels>
        {items.map((d) => (
          <BottomNavigationAction
            key={d.key}
            value={d.key}
            label={d.label}
            icon={d.icon}
            sx={{ minWidth: 0 }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
