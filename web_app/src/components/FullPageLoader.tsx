import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Wordmark } from './Wordmark.tsx';

/** After this long, say why it's slow: the free server sleeps when idle (B-02 V6). */
const WAKING_AFTER_MS = 4000;

export function FullPageLoader() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), WAKING_AFTER_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <Box
      role="status"
      aria-label="Loading"
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Box
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textAlign: 'center' }}
      >
        <Wordmark size="large" />
        <CircularProgress size={24} />
        <Fade in={slow}>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: (t) => t.niwa.width.card }}>
            Waking up the garden… the server rests when it's quiet, so the first visit can take up to a
            minute.
          </Typography>
        </Fade>
      </Box>
    </Box>
  );
}
