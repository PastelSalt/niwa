import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { Wordmark } from './Wordmark.tsx';

export function FullPageLoader() {
  return (
    <Box
      role="status"
      aria-label="Loading"
      sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <Wordmark size="large" />
        <CircularProgress size={24} />
      </Box>
    </Box>
  );
}
