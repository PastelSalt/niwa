import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type { ItemNature } from '@niwa/contracts';
import { useCallback, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { NotifierProvider } from '../components/Notifier.tsx';
import { CaptureProvider, useQuickCapture } from '../features/inbox/CaptureProvider.tsx';
import { ItemDialogsProvider } from '../features/items/ItemDialogs.tsx';
import { useSelectedItemId } from '../features/items/useSelectedItemId.ts';
import { DetailPanel } from './DetailPanel.tsx';
import { destinationForPath, type Destination } from './destinations.tsx';
import { BottomNav, NavRail } from './NavRail.tsx';
import { TopBar } from './TopBar.tsx';
import { TreePane } from './TreePane.tsx';
import { useGlobalShortcuts } from './useGlobalShortcuts.ts';

/**
 * Rail | Tree pane | Main | Detail panel — CONCEPT.md §1.1, responsive per §1.2:
 * ≥ lg everything docked · md–lg detail as overlay · < md bottom nav; the tree becomes the main view.
 */
export function AppShell() {
  return (
    <NotifierProvider>
      <ItemDialogsProvider>
        <CaptureProvider>
          <ShellLayout />
        </CaptureProvider>
      </ItemDialogsProvider>
    </NotifierProvider>
  );
}

const lensOf = (d: Destination | undefined): ItemNature | null =>
  d?.key === 'knowledge' || d?.key === 'actionable' ? d.key : null;

function ShellLayout() {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('md'));
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));
  const location = useLocation();
  const destination = destinationForPath(location.pathname);
  const lens = lensOf(destination);
  const selectedId = useSelectedItemId();
  const [detailOpen, setDetailOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const focusSearch = useCallback(() => searchRef.current?.focus(), []);
  const capture = useQuickCapture();
  useGlobalShortcuts(focusSearch, capture.open);

  // Selecting a new item reveals its details where there's room for a docked panel.
  const [revealedFor, setRevealedFor] = useState<string | undefined>();
  if (selectedId && isWide && selectedId !== revealedFor) {
    setRevealedFor(selectedId);
    setDetailOpen(true);
  }

  const showTreePane = !isPhone && !!lens;
  const phoneTree = isPhone && !!lens && !selectedId;

  return (
    <Box sx={{ display: 'flex', height: '100dvh', overflow: 'hidden', bgcolor: 'background.default' }}>
      {!isPhone && <NavRail />}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <TopBar
          title={destination?.label ?? 'niwa'}
          compact={isPhone}
          searchRef={searchRef}
          detailOpen={detailOpen}
          onToggleDetail={() => setDetailOpen((v) => !v)}
        />
        <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {showTreePane && lens && <TreePane lens={lens} label={destination!.label} />}
          <Box component="main" sx={{ flex: 1, minWidth: 0, overflow: 'auto', pb: isPhone ? 9 : 0 }}>
            {phoneTree && lens ? <PhoneLensHome lens={lens} label={destination!.label} /> : <Outlet />}
          </Box>
          {!isPhone && (
            <DetailPanel
              open={detailOpen}
              docked={isWide}
              itemId={selectedId}
              onClose={() => setDetailOpen(false)}
            />
          )}
        </Box>
      </Box>
      {isPhone && <BottomNav />}
    </Box>
  );
}

/** Phones have no side pane: the lens home is the tree (Actionable adds a Focus tab). */
function PhoneLensHome({ lens, label }: { lens: ItemNature; label: string }) {
  const [tab, setTab] = useState<'focus' | 'tree'>('focus');
  if (lens === 'knowledge') return <TreePane lens={lens} label={label} fullWidth />;
  return (
    <>
      <Tabs value={tab} onChange={(_, v: 'focus' | 'tree') => setTab(v)} variant="fullWidth">
        <Tab value="focus" label="Focus" />
        <Tab value="tree" label="Tree" />
      </Tabs>
      {tab === 'focus' ? <Outlet /> : <TreePane lens={lens} label={label} fullWidth />}
    </>
  );
}
