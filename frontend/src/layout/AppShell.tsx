import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useCallback, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { DetailPanel } from './DetailPanel.tsx';
import { destinationForPath } from './destinations.tsx';
import { BottomNav, NavRail } from './NavRail.tsx';
import { TopBar } from './TopBar.tsx';
import { TreePane } from './TreePane.tsx';
import { useGlobalShortcuts } from './useGlobalShortcuts.ts';

/**
 * Rail | Tree pane | Main | Detail panel — CONCEPT.md §1.1, responsive per §1.2:
 * ≥ lg everything docked · md–lg detail as overlay · < md bottom nav, no tree pane.
 */
export function AppShell() {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('md'));
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));
  const location = useLocation();
  const destination = destinationForPath(location.pathname);
  const [detailOpen, setDetailOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const focusSearch = useCallback(() => searchRef.current?.focus(), []);
  useGlobalShortcuts(focusSearch);

  const showTree = !isPhone && !!destination?.showsTree;

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' }}>
      {!isPhone && <NavRail />}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar
          title={destination?.label ?? 'niwa'}
          compact={isPhone}
          searchRef={searchRef}
          detailOpen={detailOpen}
          onToggleDetail={() => setDetailOpen((v) => !v)}
        />
        <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {showTree && destination && <TreePane lens={destination.label} />}
          <Box component="main" sx={{ flex: 1, minWidth: 0, overflow: 'auto', pb: isPhone ? 9 : 0 }}>
            <Outlet />
          </Box>
          {!isPhone && <DetailPanel open={detailOpen} docked={isWide} onClose={() => setDetailOpen(false)} />}
        </Box>
      </Box>
      {isPhone && <BottomNav />}
    </Box>
  );
}
