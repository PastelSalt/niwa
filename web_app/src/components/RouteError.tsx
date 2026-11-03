import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { EmptyState } from './EmptyState.tsx';

/** Shown when a screen crashes. Inside the shell, navigation keeps working. */
export function RouteError() {
  const error = useRouteError();
  // A new deploy can remove old code chunks; a reload fetches the current ones.
  const staleChunk =
    error instanceof TypeError && /dynamically imported module|Failed to fetch/i.test(error.message);
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : null;

  return (
    <Box role="alert" sx={{ p: 2 }}>
      <EmptyState
        icon={<ErrorOutlineRounded />}
        title={staleChunk ? 'NIWA was updated' : 'Something went wrong on this screen'}
        description={
          staleChunk
            ? 'Reload to get the latest version. Your saved work is safe.'
            : 'Your saved work is safe. Reload to try again, or go back to the garden.'
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={() => window.location.reload()}>
              Reload
            </Button>
            <Button href="/">Home</Button>
          </Box>
        }
      />
      {import.meta.env.DEV && detail && (
        <Typography
          variant="caption"
          color="text.secondary"
          component="pre"
          sx={{ textAlign: 'center', whiteSpace: 'pre-wrap' }}
        >
          {detail}
        </Typography>
      )}
    </Box>
  );
}
