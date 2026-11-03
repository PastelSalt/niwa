import CloseRounded from '@mui/icons-material/CloseRounded';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { EmptyState } from '../components/EmptyState.tsx';
import { ItemFields } from '../features/items/ItemFields.tsx';
import { useItem } from '../features/items/queries.ts';

export const DETAIL_WIDTH = 320;

/** Item fields panel (CONCEPT.md §1.1). Docked on wide screens, overlay otherwise. */
export function DetailPanel({
  open,
  docked,
  itemId,
  onClose,
}: {
  open: boolean;
  docked: boolean;
  itemId: string | undefined;
  onClose: () => void;
}) {
  const { data: item, isLoading } = useItem(itemId);

  const content = (
    <Box sx={{ width: DETAIL_WIDTH, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography variant="subtitle2" sx={{ flex: 1 }} noWrap>
          Details
        </Typography>
        <IconButton size="small" aria-label="Close details" onClick={onClose}>
          <CloseRounded fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {itemId && isLoading && (
          <Box sx={{ p: 2 }}>
            {[1, 2, 3, 4].map((k) => (
              <Skeleton key={k} height={48} />
            ))}
          </Box>
        )}
        {item && <ItemFields key={item.id} item={item} />}
        {!itemId && (
          <EmptyState
            icon={<TuneOutlined />}
            title="Nothing selected"
            description="Select an item to see its status, priority, dates, tags and links."
          />
        )}
      </Box>
    </Box>
  );

  if (docked) {
    return open ? (
      <Box
        component="aside"
        aria-label="Details"
        sx={{
          borderLeft: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          flexShrink: 0,
          display: 'flex',
        }}
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
