import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useUserAppearance } from '../app/appearance.tsx';
import { NotifierProvider } from '../components/Notifier.tsx';
import { CaptureProvider, useQuickCapture } from '../features/inbox/CaptureProvider.tsx';
import { ItemDialogsProvider } from '../features/items/ItemDialogs.tsx';
import { OnboardingProvider } from '../features/onboarding/OnboardingProvider.tsx';
import { useSelectedItemId } from '../features/items/useSelectedItemId.ts';
import { DetailPanel } from './DetailPanel.tsx';
import { destinationForPath, gardenFilterFor, type GardenFilter } from './destinations.tsx';
import { CommandBoxProvider, useCommandBox } from './CommandBox.tsx';
import { BottomNav, NavRail } from './NavRail.tsx';
import { TopBar } from './TopBar.tsx';
import { TreePane } from './TreePane.tsx';
import { useGlobalShortcuts } from './useGlobalShortcuts.ts';
import { useShellLayout } from './useLayout.ts';

/**
 * Rail | Tree pane | Main | Detail panel — CONCEPT.md §1.1, responsive per §1.2 and B-02 V7:
 * ≥ 1280 px everything docked · 720–1280 px two panes, details as an overlay · < 720 px bottom nav; the tree
 * becomes the main view.
 */
export function AppShell() {
  // The user's theme and font apply inside the app only; public pages keep the defaults (B-02 V1.P4).
  useUserAppearance();
  return (
    <NotifierProvider>
      {/* Signed-in screens are private; React hoists this into <head>. robots.txt disallows them too. */}
      <meta name="robots" content="noindex" />
      <ItemDialogsProvider>
        <CaptureProvider>
          <OnboardingProvider>
            <CommandBoxProvider>
              <ShellLayout />
            </CommandBoxProvider>
          </OnboardingProvider>
        </CaptureProvider>
      </ItemDialogsProvider>
    </NotifierProvider>
  );
}

function ShellLayout() {
  const shell = useShellLayout();
  const isPhone = shell === 'single';
  const isWide = shell === 'docked';
  const location = useLocation();
  const destination = destinationForPath(location.pathname);
  const lens = gardenFilterFor(location.pathname);
  const selectedId = useSelectedItemId();
  // Closed by default (B-01 B11): the item page shows what's set; the panel is there when asked for.
  const [detailOpen, setDetailOpen] = useState(false);
  const command = useCommandBox();
  const capture = useQuickCapture();
  useGlobalShortcuts(command.open, capture.open);

  const showTreePane = !isPhone && !!lens;
  const phoneTree = isPhone && !!lens && !selectedId;

  return (
    <Box sx={{ display: 'flex', height: '100dvh', overflow: 'hidden', bgcolor: 'background.default' }}>
      {!isPhone && <NavRail />}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <TopBar
          title={destination?.label ?? 'niwa'}
          titleHidden={destination?.namedOnScreen}
          compact={isPhone}
          onOpenCommand={command.open}
          detailOpen={detailOpen}
          onToggleDetail={() => setDetailOpen((v) => !v)}
        />
        <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {showTreePane && lens && <TreePane lens={lens} />}
          <Box component="main" sx={{ flex: 1, minWidth: 0, overflow: 'auto', pb: isPhone ? 9 : 0 }}>
            <Suspense fallback={<LinearProgress aria-label="Loading" sx={{ height: 2 }} />}>
              {phoneTree && lens ? <PhoneLensHome lens={lens} /> : <Outlet />}
            </Suspense>
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

/** Phones have no side pane: Garden's home is the tree (Tasks adds a Focus tab). */
function PhoneLensHome({ lens }: { lens: GardenFilter }) {
  const [tab, setTab] = useState<'focus' | 'tree'>('focus');
  if (lens !== 'actionable') return <TreePane lens={lens} fullWidth />;
  return (
    <>
      <Tabs value={tab} onChange={(_, v: 'focus' | 'tree') => setTab(v)} variant="fullWidth">
        <Tab value="focus" label="Focus" />
        <Tab value="tree" label="Tree" />
      </Tabs>
      {tab === 'focus' ? <Outlet /> : <TreePane lens={lens} fullWidth />}
    </>
  );
}
