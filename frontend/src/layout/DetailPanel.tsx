import CloseRounded from '@mui/icons-material/CloseRounded';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { EmptyState } from '../components/EmptyState.tsx';

export const DETAIL_WIDTH = 320;

/** Item fields panel (CONCEPT.md §1.1). Docked on wide screens, overlay otherwise. */
export function DetailPanel({
  open,
  docked,
  onClose,
}: {
  open: boolean;
  docked: boolean;
  onClose: () => void;
}) {
  const content = (
    <Box sx={{ width: DETAIL_WIDTH, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          Details
        </Typography>
        <IconButton size="small" aria-label="Close details" onClick={onClose}>
          <CloseRounded fontSize="small" />
        </IconButton>
      </Box>
      <EmptyState
        icon={<TuneOutlined />}
        title="Nothing selected"
        description="Select an item to see its status, priority, dates, tags and links."
      />
    </Box>
  );

  if (docked) {
    return open ? (
      <Box
        component="aside"
        aria-label="Details"
        sx={{ borderLeft: 1, borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}
      >
        {content}
      </Box>
    ) : null;
  }
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      {content}
    </Drawer>
  );
}
