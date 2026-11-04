import AddRounded from '@mui/icons-material/AddRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import ViewSidebarOutlined from '@mui/icons-material/ViewSidebarOutlined';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputBase from '@mui/material/InputBase';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { useState, type RefObject } from 'react';
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
  searchRef: RefObject<HTMLInputElement | null>;
  detailOpen: boolean;
  onToggleDetail: () => void;
}

export function TopBar({ title, compact, searchRef, detailOpen, onToggleDetail }: TopBarProps) {
  const { user, logout } = useAuth();
  const capture = useQuickCapture();
  const onboarding = useOnboarding();
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState('');

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <AppBar position="sticky" sx={{ bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar variant="dense" sx={{ gap: { xs: 1, md: 1.5 }, minHeight: 56, px: { xs: 1.5, sm: 2 } }}>
        {compact && <Wordmark size="small" />}
        {/* On phones the bottom nav already shows where you are; keep the h1 for screen readers. */}
        <Typography
          variant="subtitle1"
          component="h1"
          noWrap
          sx={compact ? visuallyHidden : { fontWeight: 600, flexShrink: 0 }}
        >
          {title}
        </Typography>

        <Box
          component="form"
          role="search"
          data-tour="search"
          onSubmit={submitSearch}
          // A control's width, not a content width.
          sx={{ flex: 1, maxWidth: 480, mx: 'auto' }}
        >
          <InputBase
            inputRef={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={compact ? 'Search' : 'Search everything  ( / )'}
            inputProps={{ 'aria-label': 'Search' }}
            startAdornment={
              <InputAdornment position="start">
                <SearchRounded fontSize="small" />
              </InputAdornment>
            }
            sx={{
              width: '100%',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              bgcolor: 'action.hover',
              '&.Mui-focused': { bgcolor: 'background.paper', outline: 2, outlineColor: 'primary.main' },
            }}
          />
        </Box>

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
