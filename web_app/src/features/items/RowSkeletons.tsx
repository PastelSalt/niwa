import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

/** List loading state shaped like ItemRows (B-02 V6): one pattern for every list. */
export function RowSkeletons({ rows = 3 }: { rows?: number }) {
  return (
    <Box
      role="status"
      aria-label="Loading"
      sx={{ border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}
    >
      {Array.from({ length: rows }, (_, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 1.5,
            minHeight: 56,
            borderBottom: i < rows - 1 ? 1 : 0,
            borderColor: 'divider',
          }}
        >
          <Skeleton variant="circular" width={20} height={20} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={`${55 + ((i * 17) % 35)}%`} sx={{ typography: 'body1' }} />
            <Skeleton variant="text" width="30%" sx={{ typography: 'body2' }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
