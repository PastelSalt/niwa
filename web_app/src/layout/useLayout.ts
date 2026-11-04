import useMediaQuery from '@mui/material/useMediaQuery';
import { layout } from '@niwa/tokens';

/**
 * Which shell layout applies (NIWA-PLAN-B-02 V7): `single` on phones (bottom nav, one pane), `panes` on
 * tablets (rail + tree + content, Details as an overlay), `docked` on desktops (Details docked).
 */
export function useShellLayout(): 'single' | 'panes' | 'docked' {
  const twoPane = useMediaQuery(`(min-width: ${layout.twoPane}px)`);
  const docked = useMediaQuery(`(min-width: ${layout.docked}px)`);
  return !twoPane ? 'single' : docked ? 'docked' : 'panes';
}
