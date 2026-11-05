import AddRounded from '@mui/icons-material/AddRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import ViewSidebarOutlined from '@mui/icons-material/ViewSidebarOutlined';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { visuallyHidden } from '../lib/a11y.ts';
import { useAuth } from '../auth/AuthProvider.tsx';
import { Wordmark } from '../components/Wordmark.tsx';
import { useQuickCapture } from '../features/inbox/CaptureProvider.tsx';
import { useOnboarding } from '../features/onboarding/OnboardingProvider.tsx';
import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded';

interface TopBarProps {
  title: string;
  compact: boolean;
  /** Opens the command box (search, jump, create). */
  onOpenCommand: () => void;
  /** The screen shows its own name, so the title is for screen readers only. */
  titleHidden?: boolean;
  detailOpen: boolean;
  onToggleDetail: () => void;
}

export function TopBar({
  title,
  titleHidden,
  compact,
  onOpenCommand,
  detailOpen,
  onToggleDetail,
}: TopBarProps) {
  const { user, logout } = useAuth();
  const capture = useQuickCapture();
  const onboarding = useOnboarding();
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <AppBar position="sticky" sx={{ bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar variant="dense" sx={{ gap: { xs: 1, md: 1.5 }, minHeight: 56, px: { xs: 1.5, sm: 2 } }}>
        {compact && <Wordmark size="small" />}
        {/* One visible name per screen: phones have the bottom nav, and some screens name themselves.
            The h1 stays for screen readers either way. */}
        <Typography
          variant="subtitle1"
          component="h1"
          noWrap
          sx={compact || titleHidden ? visuallyHidden : { fontWeight: 600, flexShrink: 0 }}
        >
          {title}
        </Typography>

        {/* Looks like a search field; opens the command box, which searches, jumps and creates (B-01 B9). */}
        <ButtonBase
          data-tour="search"
          onClick={onOpenCommand}
          aria-label="Search or jump to"
          aria-keyshortcuts="Control+K /"
          // A control's width, not a content width.
          sx={{
            flex: 1,
            maxWidth: 480,
            mx: 'auto',
            justifyContent: 'flex-start',
            gap: 1,
            px: 1.5,
            py: 0.75,
            borderRadius: 2,
            bgcolor: 'action.hover',
            color: 'text.secondary',
            typography: 'body1',
          }}
        >
          <SearchRounded fontSize="small" />
          <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
            {compact ? 'Search' : 'Search or jump to…'}
          </Box>
          {!compact && (
            <Box
              component="kbd"
              sx={{ typography: 'caption', px: 0.75, borderRadius: 0.5, border: 1, borderColor: 'divider' }}
            >
              {isMac ? '⌘K' : 'Ctrl K'}
            </Box>
          )}
        </ButtonBase>

        <Tooltip title="Quick capture  ·  c">
          {compact ? (
            <IconButton aria-label="Capture" onClick={capture.open} data-tour="capture">
              <AddRounded />
            </IconButton>
          ) : (
            <Button variant="contained" startIcon={<AddRounded />} onClick={capture.open} data-tour="capture">
              Capture
            </Button>
          )}
        </Tooltip>

        {!compact && (
          <Tooltip title={detailOpen ? 'Hide details' : 'Show details'}>
            <IconButton aria-label="Toggle detail panel" aria-pressed={detailOpen} onClick={onToggleDetail}>
              <ViewSidebarOutlined sx={{ transform: 'scaleX(-1)' }} />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Account">
          <IconButton
            aria-label="Account menu"
            data-tour="account"
            aria-haspopup="menu"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{ p: 0.5 }}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: 'secondary.main',
                color: 'secondary.contrastText',
                typography: 'button',
              }}
            >
              {user?.email.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={menuAnchor}
          open={!!menuAnchor}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem disabled sx={{ opacity: '1 !important' }}>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              navigate('/settings');
            }}
          >
            <ListItemIcon>
              <SettingsOutlined fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onboarding.startTour();
            }}
          >
            <ListItemIcon>
              <HelpOutlineRounded fontSize="small" />
            </ListItemIcon>
            Take the tour
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              void logout();
            }}
          >
            <ListItemIcon>
              <LogoutRounded fontSize="small" />
            </ListItemIcon>
            Log out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
